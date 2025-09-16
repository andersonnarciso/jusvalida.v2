import { storage } from "../storage";
import { aiService } from "./ai";
import type { QueueJob, BatchJob, BatchDocument, BatchJobMetadata, BatchDocumentMetadata } from "@shared/schema";
import fs from "fs";

interface BatchProcessingJob {
  batchJobId: string;
  userId: string;
  aiProvider: string;
  aiModel: string;
  analysisType: string;
  templateId?: string;
}

class BatchProcessor {
  private isProcessing = false;
  private processingInterval: NodeJS.Timeout | null = null;
  private maxConcurrentJobs = 5; // Process up to 5 documents in parallel
  private pollingInterval = 5000; // Check for new jobs every 5 seconds

  constructor() {
    this.startPolling();
  }

  private startPolling() {
    if (this.processingInterval) return;
    
    console.log("🔄 Starting batch processor polling...");
    this.processingInterval = setInterval(async () => {
      if (!this.isProcessing) {
        await this.processNextJob();
      }
    }, this.pollingInterval);
  }

  public stopPolling() {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
      console.log("⏹️ Stopped batch processor polling");
    }
  }

  private async processNextJob() {
    try {
      const queueJob = await storage.getNextQueueJob();
      if (!queueJob) return; // No jobs to process

      console.log(`📋 Processing queue job: ${queueJob.id}`);
      await this.processQueueJob(queueJob);
    } catch (error) {
      console.error("❌ Error in batch processor:", error);
    }
  }

  private async processQueueJob(queueJob: QueueJob) {
    if (queueJob.jobType !== 'batch_processing') {
      console.log(`⏭️ Skipping non-batch job: ${queueJob.jobType}`);
      return;
    }

    this.isProcessing = true;

    try {
      // Update queue job status to processing
      await storage.updateQueueJobStatus(queueJob.id, 'processing');

      const jobData = queueJob.jobData as BatchProcessingJob;
      await this.processBatchJob(jobData);

      // Mark queue job as completed
      await storage.updateQueueJobStatus(queueJob.id, 'completed');
      console.log(`✅ Completed queue job: ${queueJob.id}`);
    } catch (error: any) {
      console.error(`❌ Failed to process queue job ${queueJob.id}:`, error);
      
      // Update queue job with error
      await storage.updateQueueJobStatus(queueJob.id, 'failed', error.message);
      
      // Update batch job status to failed
      const jobData = queueJob.jobData as BatchProcessingJob;
      if (jobData.batchJobId) {
        await storage.updateBatchJobStatus(jobData.batchJobId, 'failed', error.message);
      }
    } finally {
      this.isProcessing = false;
    }
  }

  private async processBatchJob(jobData: BatchProcessingJob) {
    const { batchJobId, userId, aiProvider, aiModel, analysisType, templateId } = jobData;

    console.log(`🚀 Starting batch processing for job: ${batchJobId}`);

    // Get batch job and documents
    const batchJob = await storage.getBatchJobById(batchJobId);
    if (!batchJob) {
      throw new Error(`Batch job not found: ${batchJobId}`);
    }

    const batchDocuments = await storage.getBatchDocuments(batchJobId);
    if (batchDocuments.length === 0) {
      throw new Error(`No documents found for batch job: ${batchJobId}`);
    }

    // Update batch job status to processing
    await storage.updateBatchJobStatus(batchJobId, 'processing');

    // Get user to check credits and API keys
    const user = await storage.getUser(userId);
    if (!user) {
      throw new Error(`User not found: ${userId}`);
    }

    // Get user's API key for the provider if needed
    let userApiKey: string | undefined;
    if (aiProvider !== 'free') {
      const providerConfig = await storage.getAiProvider(userId, aiProvider);
      userApiKey = providerConfig?.apiKey;
    }

    // Get template data if specified
    let templateData = null;
    if (templateId) {
      templateData = await storage.getTemplateWithPrompts(templateId);
    }

    let totalCreditsUsed = 0;
    let processedCount = 0;
    let failedCount = 0;

    try {
      // Process documents in parallel batches
      const chunkSize = this.maxConcurrentJobs;
      const documentChunks = this.chunkArray(batchDocuments, chunkSize);

      for (const chunk of documentChunks) {
        const promises = chunk.map(doc => this.processDocument(
          doc,
          userId,
          aiProvider,
          aiModel,
          analysisType,
          userApiKey,
          templateId
        ));

        const results = await Promise.allSettled(promises);
        
        // Process results
        for (let i = 0; i < results.length; i++) {
          const result = results[i];
          const document = chunk[i];

          if (result.status === 'fulfilled') {
            const { creditsUsed } = result.value;
            totalCreditsUsed += creditsUsed;
            processedCount++;
            console.log(`✅ Processed document: ${document.originalFileName}`);
          } else {
            failedCount++;
            console.error(`❌ Failed to process document ${document.originalFileName}:`, result.reason);
            await storage.updateBatchDocumentStatus(document.id, 'failed', result.reason?.message || 'Processing failed');
          }
        }

        // Update batch job progress
        const progressPercentage = Math.round(((processedCount + failedCount) / batchDocuments.length) * 100);
        await storage.updateBatchJob(batchJobId, {
          processedDocuments: processedCount,
          failedDocuments: failedCount,
          totalCreditsUsed,
          metadata: { 
            ...(batchJob.metadata as BatchJobMetadata || {}), 
            progressPercentage 
          } as BatchJobMetadata
        });
      }

      // Determine final status
      const finalStatus = failedCount === batchDocuments.length ? 'failed' : 
                         failedCount > 0 ? 'completed_with_errors' : 'completed';

      // Update final batch job status
      await storage.updateBatchJobStatus(batchJobId, finalStatus);

      console.log(`🎉 Batch processing completed for ${batchJobId}: ${processedCount} success, ${failedCount} failed`);

    } catch (error: any) {
      console.error(`❌ Batch processing failed for ${batchJobId}:`, error);
      await storage.updateBatchJobStatus(batchJobId, 'failed', error.message);
      throw error;
    }
  }

  private async processDocument(
    document: BatchDocument,
    userId: string,
    aiProvider: string,
    aiModel: string,
    analysisType: string,
    userApiKey?: string,
    templateId?: string
  ): Promise<{ creditsUsed: number }> {
    // UPDATED: Extract file metadata once for cleanup in finally block
    const metadata = document.metadata as BatchDocumentMetadata & { filePath?: string; tempFile?: boolean };
    
    try {
      // Update document status to processing
      await storage.updateBatchDocumentStatus(document.id, 'processing');

      const filePath = metadata?.filePath;
      
      if (!filePath) {
        throw new Error('File path not found in document metadata');
      }
      
      if (!fs.existsSync(filePath)) {
        throw new Error(`File not found on disk: ${filePath}`);
      }

      // Read file content from disk - SECURE: No more base64 in memory
      let content: string;
      try {
        const fileBuffer = await fs.promises.readFile(filePath);
        content = fileBuffer.toString('utf-8');
        console.log(`📝 Read file from disk: ${document.originalFileName} (${fileBuffer.length} bytes)`);
      } catch (readError: any) {
        throw new Error(`Failed to read file ${filePath}: ${readError.message}`);
      }

      // Calculate credits needed
      const creditsNeeded = aiService.getProviderCredits(`${aiProvider}-${aiModel}`);

      // Create document analysis record
      const analysis = await storage.createDocumentAnalysis(userId, {
        title: `Batch: ${document.originalFileName}`,
        content,
        aiProvider,
        aiModel,
        analysisType,
        templateId: templateId || null,
        result: {},
        creditsUsed: creditsNeeded,
      });

      try {
        // Perform AI analysis
        const result = await aiService.analyzeDocument(
          content,
          analysisType,
          aiProvider,
          aiModel,
          userApiKey,
          templateId
        );

        // Update analysis with result
        await storage.updateDocumentAnalysisResult(analysis.id, result, "completed");

        // Link batch document to analysis
        await storage.linkBatchDocumentToAnalysis(document.id, analysis.id);

        // Update document status to completed
        await storage.updateBatchDocumentStatus(document.id, 'completed');

        // FIXED: Credits were already deducted at batch creation, so don't deduct again
        return { creditsUsed: creditsNeeded };

      } catch (analysisError: any) {
        // Update analysis as failed
        await storage.updateDocumentAnalysisResult(analysis.id, { error: analysisError.message }, "failed");
        throw analysisError;
      }

    } catch (error: any) {
      console.error(`❌ Error processing document ${document.originalFileName}:`, error);
      await storage.updateBatchDocumentStatus(document.id, 'failed', error.message);
      throw error;
    } finally {
      // REQUIRED: Always clean up temp file in finally block regardless of success/failure
      try {
        await this.cleanupDocumentFile(document, metadata);
      } catch (cleanupError) {
        console.error(`❌ Failed to cleanup file in finally block:`, cleanupError);
      }
    }
  }

  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }

  // Helper method to clean up temporary files after processing
  private async cleanupDocumentFile(document: BatchDocument, metadata: any) {
    if (metadata?.tempFile && metadata?.filePath) {
      try {
        if (fs.existsSync(metadata.filePath)) {
          await fs.promises.unlink(metadata.filePath);
          console.log(`🗑️ Cleaned up temp file: ${metadata.filePath}`);
        }
      } catch (error) {
        console.error(`❌ Failed to cleanup temp file ${metadata.filePath}:`, error);
      }
    }
  }

  // Public methods for external control
  public async retryBatchJob(batchJobId: string) {
    try {
      const batchJob = await storage.getBatchJobById(batchJobId);
      if (!batchJob) {
        throw new Error(`Batch job not found: ${batchJobId}`);
      }

      // Reset batch job status
      await storage.updateBatchJobStatus(batchJobId, 'pending');

      // Reset failed documents to pending
      const documents = await storage.getBatchDocuments(batchJobId);
      const failedDocuments = documents.filter(doc => doc.status === 'failed');
      
      for (const doc of failedDocuments) {
        await storage.updateBatchDocumentStatus(doc.id, 'pending');
      }

      // Create new queue job
      await storage.createQueueJob({
        jobType: 'batch_processing',
        jobData: {
          batchJobId: batchJob.id,
          userId: batchJob.userId,
          aiProvider: batchJob.aiProvider,
          aiModel: batchJob.aiModel,
          analysisType: batchJob.analysisType,
          templateId: batchJob.templateId
        },
        priority: 2 // Higher priority for retries
      });

      console.log(`🔄 Retry initiated for batch job: ${batchJobId}`);
    } catch (error) {
      console.error(`❌ Error retrying batch job ${batchJobId}:`, error);
      throw error;
    }
  }

  public getStatus() {
    return {
      isProcessing: this.isProcessing,
      pollingActive: this.processingInterval !== null,
      maxConcurrentJobs: this.maxConcurrentJobs,
      pollingInterval: this.pollingInterval
    };
  }
}

// Create singleton instance
export const batchProcessor = new BatchProcessor();

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Shutting down batch processor...');
  batchProcessor.stopPolling();
});

process.on('SIGINT', () => {
  console.log('🛑 Shutting down batch processor...');
  batchProcessor.stopPolling();
});