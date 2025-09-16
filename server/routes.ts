import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import Stripe from "stripe";
import { storage } from "./storage";
import { aiService } from "./services/ai";
import { batchProcessor } from "./services/batchProcessor";
import { requireSupabaseAuth, requireSupabaseAdmin } from "./middleware/supabase-auth";
import { insertDocumentAnalysisSchema, insertSupportTicketSchema, insertTicketMessageSchema, adminTicketMessageSchema, adminUserUpdateSchema, insertAiProviderConfigSchema, insertCreditPackageSchema, insertDocumentTemplateSchema, insertLegalClauseSchema, insertTemplatePromptSchema, insertTemplateAnalysisRuleSchema, insertBatchJobSchema, insertBatchDocumentSchema, insertQueueJobSchema } from "@shared/schema";
import multer from "multer";
import { z } from "zod";
import fs from "fs";
import path from "path";

// Global types cleaned up - using Supabase Auth instead of sessions

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-06-20",
});

// Helper function to check if user can use free analysis (3 per month)
async function checkFreeAnalysisLimit(userId: string): Promise<boolean> {
  try {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    
    const freeAnalysesThisMonth = await storage.getDocumentAnalyses(userId)
      .then(analyses => analyses.filter(analysis => 
        analysis.aiProvider === 'free' && 
        new Date(analysis.createdAt) >= startOfMonth
      ));
    
    return freeAnalysesThisMonth.length < 3;
  } catch (error) {
    console.error('Error checking free analysis limit:', error);
    return false;
  }
}

// Helper function removed - no longer needed with Supabase Auth

// Configure multer for file uploads - SECURE: Using disk storage to prevent memory exhaustion
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, '/tmp/uploads');
    },
    filename: (req, file, cb) => {
      // SECURITY FIX: Sanitize filename to prevent path traversal attacks
      const safeBasename = path.basename(file.originalname);
      const sanitizedName = safeBasename.replace(/[^a-zA-Z0-9._-]/g, "_");
      const randomString = Math.random().toString(36).substring(2);
      const uniqueName = `${Date.now()}-${randomString}-${sanitizedName}`;
      
      // Additional security: reject if any path separators remain
      if (uniqueName.includes('/') || uniqueName.includes('\\') || uniqueName.includes('..')) {
        return cb(new Error('Invalid filename detected'), '');
      }
      
      cb(null, uniqueName);
    }
  }),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit for single file uploads
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
    cb(null, allowedTypes.includes(file.mimetype));
  }
});

// Configure dedicated multer for batch uploads with 50MB per file limit
const batchUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, '/tmp/batch-uploads');
    },
    filename: (req, file, cb) => {
      // SECURITY FIX: Sanitize filename to prevent path traversal attacks
      const safeBasename = path.basename(file.originalname);
      const sanitizedName = safeBasename.replace(/[^a-zA-Z0-9._-]/g, "_");
      const randomString = Math.random().toString(36).substring(2);
      const uniqueName = `${Date.now()}-${randomString}-${sanitizedName}`;
      
      // Additional security: reject if any path separators remain
      if (uniqueName.includes('/') || uniqueName.includes('\\') || uniqueName.includes('..')) {
        return cb(new Error('Invalid filename detected'), '');
      }
      
      cb(null, uniqueName);
    }
  }),
  limits: { 
    fileSize: 50 * 1024 * 1024, // 50MB per file for batch uploads
    files: 25 // Maximum 25 files per batch
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
    cb(null, allowedTypes.includes(file.mimetype));
  }
}).array('files', 25);

// Middleware to validate total batch size (max 500MB)
async function validateBatchSize(req: express.Request, res: express.Response, next: express.NextFunction) {
  if (!req.files || !Array.isArray(req.files)) {
    return res.status(400).json({ message: 'No files provided' });
  }

  const totalSize = req.files.reduce((acc: number, file: Express.Multer.File) => acc + file.size, 0);
  const maxTotalSize = 500 * 1024 * 1024; // 500MB total

  if (totalSize > maxTotalSize) {
    // Cleanup uploaded files before rejecting
    await cleanupUploadedFiles(req.files as Express.Multer.File[]);
    return res.status(413).json({ 
      message: 'Total batch size exceeds 500MB limit',
      totalSize: Math.round(totalSize / 1024 / 1024),
      maxSize: 500
    });
  }

  next();
}

// Helper function to cleanup uploaded files (async version defined later)

// Handle successful payment processing from Stripe webhook
async function handleSuccessfulPayment(paymentIntent: Stripe.PaymentIntent) {
  try {
    console.log(`💳 Processing successful payment: ${paymentIntent.id}`);
    
    const { userId, packageId } = paymentIntent.metadata;
    
    if (!userId || !packageId) {
      console.error("❌ Missing metadata in payment intent:", paymentIntent.id);
      return;
    }

    // Check if this payment has already been processed
    const existingTransaction = await storage.getCreditTransactionByStripeId(paymentIntent.id);
    if (existingTransaction) {
      console.log(`⚠️  Payment already processed: ${paymentIntent.id}`);
      return;
    }

    // Get the user
    const user = await storage.getUser(userId);
    if (!user) {
      console.error(`❌ User not found: ${userId}`);
      return;
    }

    // SECURITY: Validate customer ID matches user
    if (user.stripeCustomerId && paymentIntent.customer !== user.stripeCustomerId) {
      console.error(`❌ Customer ID mismatch for payment ${paymentIntent.id}: user has ${user.stripeCustomerId}, payment has ${paymentIntent.customer}`);
      return;
    }

    // Get package details from database (trusted source)
    const creditPackage = await storage.getCreditPackage(packageId);
    if (!creditPackage) {
      console.error(`❌ Package not found: ${packageId}`);
      return;
    }

    // Validate payment amount matches package price
    const expectedAmount = Math.round(parseFloat(creditPackage.price) * 100);
    if (paymentIntent.amount !== expectedAmount) {
      console.error(`❌ Amount mismatch for payment ${paymentIntent.id}: expected ${expectedAmount}, got ${paymentIntent.amount}`);
      return;
    }

    // ATOMIC: Credit the user account in a single transaction to prevent race conditions
    const credits = creditPackage.credits;
    const newCredits = user.credits + credits;
    
    // Use storage method that handles atomicity
    const result = await storage.processPaymentTransaction(userId, {
      type: "purchase",
      amount: credits,
      description: `Webhook: Purchase of ${credits} credits (${creditPackage.name})`,
      stripePaymentIntentId: paymentIntent.id,
      newCreditBalance: newCredits
    });

    console.log(`✅ Successfully processed payment ${paymentIntent.id}: ${credits} credits added to user ${userId}`);
    
  } catch (error: any) {
    console.error(`❌ Error processing payment ${paymentIntent.id}:`, error);
  }
}

// Helper function to clean up uploaded files
async function cleanupUploadedFiles(files: Express.Multer.File[]) {
  for (const file of files) {
    try {
      if (file.path && fs.existsSync(file.path)) {
        await fs.promises.unlink(file.path);
        console.log(`🗑️ Cleaned up temp file: ${file.path}`);
      }
    } catch (error) {
      console.error(`❌ Failed to cleanup file ${file.path}:`, error);
    }
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Stripe webhook endpoint - needs to be before body parsing middleware
  app.post("/api/webhooks/stripe", express.raw({ type: "application/json" }), async (req, res) => {
    const sig = req.headers["stripe-signature"];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    
    // SECURITY: Webhook signature verification is MANDATORY for production security
    if (!webhookSecret) {
      console.error("❌ STRIPE_WEBHOOK_SECRET is required for webhook security");
      return res.status(500).send("Webhook secret not configured");
    }
    
    if (!sig) {
      console.error("❌ Stripe signature header missing");
      return res.status(400).send("Stripe signature header missing");
    }
    
    let event;

    try {
      // MANDATORY signature verification for security
      event = stripe.webhooks.constructEvent(req.body, sig as string, webhookSecret);
      console.log(`✅ Webhook signature verified for event: ${event.type}`);
    } catch (err: any) {
      console.error("❌ Webhook signature verification failed:", err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    switch (event.type) {
      case "payment_intent.succeeded":
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handleSuccessfulPayment(paymentIntent);
        break;
      
      case "payment_intent.payment_failed":
        const failedPayment = event.data.object as Stripe.PaymentIntent;
        console.error("💳 Payment failed:", failedPayment.id, failedPayment.last_payment_error?.message);
        break;
      
      default:
        console.log(`🔔 Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  });

  // Express setup for Supabase Auth - no sessions needed


  app.get("/api/auth/me", requireSupabaseAuth, (req, res) => {
    // Prevent caching to avoid 304 responses that break JSON parsing
    res.set({
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'ETag': ''
    });
    res.json({ user: req.user });
  });

  // Document analysis routes
  app.post("/api/analyze", requireSupabaseAuth, upload.single('file'), async (req, res) => {
    try {
      let content = '';
      
      if (req.file) {
        // Proper file processing for different formats
        try {
          if (req.file.mimetype === 'application/pdf') {
            const pdfParse = await import('pdf-parse');
            const pdfData = await pdfParse.default(req.file.buffer);
            content = pdfData.text;
          } else if (req.file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
            const mammoth = await import('mammoth');
            const result = await mammoth.extractRawText({ buffer: req.file.buffer });
            content = result.value;
          } else if (req.file.mimetype === 'application/msword') {
            // For older DOC files, try mammoth but fallback to buffer if needed
            try {
              const mammoth = await import('mammoth');
              const result = await mammoth.extractRawText({ buffer: req.file.buffer });
              content = result.value;
            } catch (docError) {
              content = req.file.buffer.toString('utf-8');
            }
          } else if (req.file.mimetype === 'text/plain') {
            content = req.file.buffer.toString('utf-8');
          } else {
            return res.status(400).json({ message: "Tipo de arquivo não suportado" });
          }
        } catch (parseError) {
          console.error("Erro no processamento do arquivo:", parseError);
          return res.status(400).json({ message: "Erro ao processar arquivo. Tente um formato diferente." });
        }
      } else if (req.body.content) {
        content = req.body.content;
      } else {
        return res.status(400).json({ message: "No content provided" });
      }

      const { analysisType, aiProvider, aiModel, templateId } = req.body;
      
      // Validate template if provided
      let templateData = null;
      if (templateId) {
        templateData = await storage.getTemplateWithPrompts(templateId);
        if (!templateData) {
          return res.status(404).json({ message: "Template not found" });
        }
      }
      
      // Check if user can use free analysis (3 per month) or needs credits
      const canUseFreeAnalysis = await checkFreeAnalysisLimit(req.user.id);
      const needsCredits = !canUseFreeAnalysis && req.user.credits === 0;
      
      if (needsCredits) {
        return res.status(402).json({ 
          message: "Você atingiu o limite de 3 análises gratuitas por mês. Compre créditos para continuar." 
        });
      }

      // Get user's API key for the provider if needed
      let userApiKey;
      if (aiProvider !== 'free') {
        const providerConfig = await storage.getAiProvider(req.user.id, aiProvider);
        userApiKey = providerConfig?.apiKey;
      }

      // Calculate credits needed - free users can use 'free' provider
      let actualProvider = aiProvider;
      let actualModel = aiModel;
      let creditsNeeded = 0;
      
      if (canUseFreeAnalysis && (req.user.credits === 0 || aiProvider === 'free')) {
        // Force free analysis for users without credits or explicitly choosing free
        actualProvider = 'free';
        actualModel = 'basic';
        creditsNeeded = 0;
      } else {
        creditsNeeded = aiService.getProviderCredits(`${aiProvider}-${aiModel}`, analysisType);
        if (req.user.credits < creditsNeeded) {
          return res.status(402).json({ 
            message: `Créditos insuficientes. Necessário: ${creditsNeeded}, disponível: ${req.user.credits}` 
          });
        }
      }

      // Create analysis record with template reference
      const analysis = await storage.createDocumentAnalysis(req.user.id, {
        title: req.body.title || `Document Analysis ${new Date().toISOString()}`,
        content,
        aiProvider,
        aiModel,
        analysisType,
        templateId: templateData?.template.id || null,
        result: {},
        creditsUsed: creditsNeeded,
      });

      try {
        // Perform AI analysis with template support
        const result = await aiService.analyzeDocument(
          content,
          analysisType,
          actualProvider,
          actualModel,
          userApiKey,
          templateId
        );

        // Update analysis with result
        await storage.updateDocumentAnalysisResult(analysis.id, result, "completed");

        // Deduct credits and create transaction
        const newCredits = req.user.credits - creditsNeeded;
        await storage.updateUserCredits(req.user.id, newCredits);
        await storage.createCreditTransaction(
          req.user.id,
          "usage",
          -creditsNeeded,
          `Document analysis using ${aiProvider} ${aiModel}`
        );

        // Credits updated in database - no session to update

        res.json({
          analysisId: analysis.id,
          result,
          creditsUsed: creditsNeeded,
          remainingCredits: newCredits,
        });
      } catch (error: any) {
        // Mark analysis as failed
        await storage.updateDocumentAnalysisResult(analysis.id, { error: error.message }, "failed");
        throw error;
      }
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/analyses", requireSupabaseAuth, async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const analyses = await storage.getDocumentAnalyses(req.user.id, limit);
      res.json(analyses);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/analyses/:id", requireSupabaseAuth, async (req, res) => {
    try {
      const analysis = await storage.getDocumentAnalysis(req.params.id, req.user.id);
      if (!analysis) {
        return res.status(404).json({ message: "Analysis not found" });
      }
      res.json(analysis);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Soft delete analysis (move to trash)
  app.delete("/api/analyses/:id", requireSupabaseAuth, async (req, res) => {
    try {
      const analysis = await storage.softDeleteAnalysis(req.params.id, req.user.id, req.user.id);
      res.json({ 
        message: "Análise movida para lixeira com sucesso",
        analysis 
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Get deleted analyses (trash)
  app.get("/api/analyses/trash/list", requireSupabaseAuth, async (req, res) => {
    try {
      const deletedAnalyses = await storage.getDeletedAnalyses(req.user.id);
      res.json(deletedAnalyses);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Restore analysis from trash
  app.post("/api/analyses/:id/restore", requireSupabaseAuth, async (req, res) => {
    try {
      const analysis = await storage.restoreAnalysis(req.params.id, req.user.id);
      res.json({ 
        message: "Análise restaurada com sucesso",
        analysis 
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // AI Provider management routes
  app.get("/api/ai-providers", requireSupabaseAuth, async (req, res) => {
    try {
      const providers = await storage.getAiProviders(req.user.id);
      // Don't return API keys in the response
      const sanitizedProviders = providers.map(p => ({
        ...p,
        apiKey: p.apiKey ? '****' : null
      }));
      res.json(sanitizedProviders);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/ai-providers", requireSupabaseAuth, async (req, res) => {
    try {
      const { provider, apiKey } = req.body;
      
      // Check if provider already exists
      const existingProvider = await storage.getAiProvider(req.user.id, provider);
      if (existingProvider) {
        // Update existing
        const updated = await storage.updateAiProvider(existingProvider.id, { apiKey });
        res.json({ ...updated, apiKey: '****' });
      } else {
        // Create new
        const newProvider = await storage.createAiProvider(req.user.id, {
          provider,
          apiKey,
          isActive: true,
        });
        res.json({ ...newProvider, apiKey: '****' });
      }
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/ai-providers/:id", requireSupabaseAuth, async (req, res) => {
    try {
      const { id } = req.params;
      
      // Verify that the provider belongs to the authenticated user
      const providers = await storage.getAiProviders(req.user.id);
      const providerToDelete = providers.find(p => p.id === id);
      
      if (!providerToDelete) {
        return res.status(404).json({ message: "AI provider not found" });
      }
      
      await storage.deleteAiProvider(id);
      res.json({ message: "AI provider deleted successfully" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Credit purchase routes
  app.post("/api/create-payment-intent", requireSupabaseAuth, async (req, res) => {
    try {
      const { packageId } = req.body;
      
      if (!packageId) {
        return res.status(400).json({ message: "Package ID is required" });
      }

      // Get package details from database (trusted source)
      const creditPackage = await storage.getCreditPackage(packageId);
      
      if (!creditPackage || !creditPackage.isActive) {
        return res.status(404).json({ message: "Credit package not found or inactive" });
      }

      // Use server-side price (prevent client tampering)
      const amount = parseFloat(creditPackage.price);
      
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: "brl",
        metadata: {
          userId: req.user.id,
          packageId: packageId, // Store packageId instead of credits
        },
      });

      res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error: any) {
      res.status(500).json({ message: "Error creating payment intent: " + error.message });
    }
  });

  app.post("/api/confirm-payment", requireSupabaseAuth, async (req, res) => {
    try {
      const { paymentIntentId } = req.body;
      
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      
      if (paymentIntent.status === 'succeeded' && paymentIntent.metadata.userId === req.user.id) {
        const { packageId } = paymentIntent.metadata;
        
        if (!packageId) {
          return res.status(400).json({ message: "Invalid payment: no package ID found" });
        }

        // Get package details from database (trusted source)
        const creditPackage = await storage.getCreditPackage(packageId);
        
        if (!creditPackage) {
          return res.status(400).json({ message: "Invalid payment: package not found" });
        }

        // Validate payment amount matches package price
        const expectedAmount = Math.round(parseFloat(creditPackage.price) * 100);
        if (paymentIntent.amount !== expectedAmount) {
          return res.status(400).json({ message: "Invalid payment: amount mismatch" });
        }

        const credits = creditPackage.credits;
        const newCredits = req.user.credits + credits;
        
        await storage.updateUserCredits(req.user.id, newCredits);
        await storage.createCreditTransaction(
          req.user.id,
          "purchase",
          credits,
          `Purchase of ${credits} credits (${creditPackage.name})`,
          paymentIntentId
        );

        // Credits updated in database - no session to update
        
        res.json({ success: true, newCredits });
      } else {
        res.status(400).json({ message: "Payment not completed" });
      }
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/credit-transactions", requireSupabaseAuth, async (req, res) => {
    try {
      const transactions = await storage.getCreditTransactions(req.user.id);
      res.json(transactions);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Credit analytics for users
  app.get("/api/credit-analytics", requireSupabaseAuth, async (req, res) => {
    try {
      const [transactions, analyses] = await Promise.all([
        storage.getCreditTransactions(req.user.id),
        storage.getDocumentAnalyses(req.user.id)
      ]);

      // Calculate spending by AI provider
      const providerSpending: Record<string, number> = {};
      const monthlySpending: Record<string, number> = {};
      
      analyses.forEach(analysis => {
        const provider = `${analysis.aiProvider}-${analysis.aiModel}`;
        providerSpending[provider] = (providerSpending[provider] || 0) + analysis.creditsUsed;
        
        const month = analysis.createdAt.toISOString().slice(0, 7); // YYYY-MM
        monthlySpending[month] = (monthlySpending[month] || 0) + analysis.creditsUsed;
      });

      // Calculate total spending and purchases
      let totalSpent = 0;
      let totalPurchased = 0;
      
      transactions.forEach(tx => {
        if (tx.type === 'usage') {
          totalSpent += Math.abs(tx.amount);
        } else if (tx.type === 'purchase') {
          totalPurchased += tx.amount;
        }
      });

      res.json({
        summary: {
          totalSpent,
          totalPurchased,
          currentBalance: req.user.credits,
          totalAnalyses: analyses.length
        },
        providerSpending: Object.entries(providerSpending).map(([provider, amount]) => ({
          provider,
          amount
        })),
        monthlySpending: Object.entries(monthlySpending).map(([month, amount]) => ({
          month,
          amount
        })).sort((a, b) => a.month.localeCompare(b.month)),
        recentTransactions: transactions.slice(0, 5)
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Support ticket routes
  app.get("/api/support/tickets", requireSupabaseAuth, async (req, res) => {
    try {
      const tickets = await storage.getSupportTickets(req.user.id);
      res.json(tickets);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/support/tickets", requireSupabaseAuth, async (req, res) => {
    try {
      const ticketData = insertSupportTicketSchema.parse(req.body);
      const ticket = await storage.createSupportTicket(req.user.id, ticketData);
      
      // Create initial message
      await storage.createTicketMessage({
        ticketId: ticket.id,
        userId: req.user.id,
        message: ticketData.message,
        isFromSupport: false,
      });
      
      res.json(ticket);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/support/tickets/:id", requireSupabaseAuth, async (req, res) => {
    try {
      const ticket = await storage.getSupportTicket(req.params.id, req.user.id);
      if (!ticket) {
        return res.status(404).json({ message: "Ticket not found" });
      }
      
      const messages = await storage.getTicketMessages(ticket.id);
      res.json({ ticket, messages });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/support/tickets/:id/messages", requireSupabaseAuth, async (req, res) => {
    try {
      const ticket = await storage.getSupportTicket(req.params.id, req.user.id);
      if (!ticket) {
        return res.status(404).json({ message: "Ticket not found" });
      }

      const messageData = insertTicketMessageSchema.parse({
        ...req.body,
        ticketId: req.params.id,
        userId: req.user.id,
      });
      
      const message = await storage.createTicketMessage(messageData);
      res.json(message);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Update ticket status (limited for users)
  app.patch("/api/support/tickets/:id", requireSupabaseAuth, async (req, res) => {
    try {
      const ticket = await storage.getSupportTicket(req.params.id, req.user.id);
      if (!ticket) {
        return res.status(404).json({ message: "Ticket not found" });
      }

      const { status } = req.body;
      
      // Users can only close/reopen their own tickets
      if (!['closed', 'open'].includes(status)) {
        return res.status(400).json({ message: "Users can only close or reopen tickets" });
      }

      const updatedTicket = await storage.updateSupportTicketStatus(ticket.id, status);
      res.json(updatedTicket);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Dynamic data endpoints for frontend components
  app.get("/api/ai-provider-configs", async (req, res) => {
    try {
      const configs = await storage.getAiProviderConfigs();
      res.json(configs);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/credit-packages", async (req, res) => {
    try {
      const packages = await storage.getCreditPackages();
      res.json(packages);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/platform-stats", async (req, res) => {
    try {
      let stats = await storage.getPlatformStats();
      
      // If no stats exist or stats are older than 1 hour, recompute them
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      if (!stats || new Date(stats.lastUpdated) < oneHourAgo) {
        stats = await storage.computeAndUpdatePlatformStats();
      }
      
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Admin middleware (legacy - removed in favor of Supabase Auth with role metadata)

  // Admin routes
  app.get("/api/admin/tickets", requireSupabaseAdmin, async (req, res) => {
    try {
      // Get all tickets from all users (admin view)
      const { userId } = req.query;
      let tickets;
      
      if (userId) {
        tickets = await storage.getSupportTickets(userId as string);
      } else {
        // For now, get tickets for all users - in production you'd optimize this query
        tickets = await storage.getAllSupportTickets();
      }
      
      res.json(tickets);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/admin/tickets/:id/messages", requireSupabaseAdmin, async (req, res) => {
    try {
      // Admin can reply to any ticket
      const { id } = req.params;
      
      // Validate request body using proper schema
      const { message } = adminTicketMessageSchema.parse(req.body);

      const messageData = {
        ticketId: id,
        userId: null, // Admin messages don't have a userId
        message,
        isFromSupport: true,
      };
      
      const newMessage = await storage.createTicketMessage(messageData);
      
      // Auto-update ticket status to pending if it was closed
      const ticket = await storage.getSupportTicketById(id);
      if (ticket && ticket.status === 'closed') {
        await storage.updateSupportTicketStatus(id, 'pending');
      }
      
      res.json(newMessage);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/admin/tickets/:id/status", requireSupabaseAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      // Admin can set any status
      const allowedStatuses = ['open', 'pending', 'resolved', 'closed'];
      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }

      const updatedTicket = await storage.updateSupportTicketStatus(id, status);
      res.json(updatedTicket);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Admin user management routes
  app.get("/api/admin/users", requireSupabaseAdmin, async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      
      const result = await storage.getAllUsers(page, limit);
      // Sanitize user objects to remove password fields
      const sanitizedResult = {
        ...result,
        users: result.users.map(toSafeUser)
      };
      res.json(sanitizedResult);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/admin/users/:id", requireSupabaseAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      
      // Validate request body using Zod schema
      const validatedData = adminUserUpdateSchema.parse(req.body);
      const { role, credits } = validatedData;
      
      let updatedUser;
      
      if (role !== undefined) {
        updatedUser = await storage.updateUserRole(id, role);
      }
      
      if (credits !== undefined) {
        updatedUser = await storage.updateUserCredits(id, credits);
      }
      
      if (!updatedUser) {
        // If no specific update was made, just get the user
        updatedUser = await storage.getUser(id);
        if (!updatedUser) {
          return res.status(404).json({ message: "User not found" });
        }
      }
      
      res.json(toSafeUser(updatedUser));
    } catch (error: any) {
      // Handle Zod validation errors
      if (error.name === 'ZodError') {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: error.message });
    }
  });

  // Admin analytics routes
  app.get("/api/admin/analytics", requireSupabaseAdmin, async (req, res) => {
    try {
      const analytics = await storage.getPlatformAnalytics();
      res.json(analytics);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/admin/ai-usage", requireSupabaseAdmin, async (req, res) => {
    try {
      const aiUsage = await storage.getAiUsageAnalytics();
      res.json(aiUsage);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Admin financial analytics endpoints
  app.get("/api/admin/financial-details", requireSupabaseAdmin, async (req, res) => {
    try {
      const [
        transactions, 
        packages, 
        userStats,
        recentTransactions
      ] = await Promise.all([
        db.select({
          date: sql<string>`DATE(${creditTransactions.createdAt})`,
          type: creditTransactions.type,
          amount: sum(creditTransactions.amount),
          count: count()
        }).from(creditTransactions)
         .groupBy(sql`DATE(${creditTransactions.createdAt})`, creditTransactions.type)
         .orderBy(sql`DATE(${creditTransactions.createdAt}) DESC`)
         .limit(30),
        
        storage.getCreditPackages(),
        
        db.select({
          totalUsers: count(),
          averageCredits: sql<number>`ROUND(AVG(${users.credits}), 2)`,
          maxCredits: sql<number>`MAX(${users.credits})`,
          usersWithCredits: sql<number>`COUNT(CASE WHEN ${users.credits} > 0 THEN 1 END)`
        }).from(users),
        
        db.select({
          id: creditTransactions.id,
          userId: creditTransactions.userId,
          type: creditTransactions.type,
          amount: creditTransactions.amount,
          description: creditTransactions.description,
          createdAt: creditTransactions.createdAt,
          userEmail: users.email,
          userName: sql<string>`${users.firstName} || ' ' || ${users.lastName}`
        }).from(creditTransactions)
         .innerJoin(users, eq(creditTransactions.userId, users.id))
         .orderBy(desc(creditTransactions.createdAt))
         .limit(20)
      ]);

      // Process package popularity
      const packageSales: Record<string, number> = {};
      recentTransactions.forEach(tx => {
        if (tx.type === 'purchase') {
          const packageName = tx.description.match(/\(([^)]+)\)$/)?.[1] || 'Unknown';
          packageSales[packageName] = (packageSales[packageName] || 0) + 1;
        }
      });

      res.json({
        dailyTransactions: transactions,
        packagePopularity: Object.entries(packageSales).map(([name, sales]) => ({
          name,
          sales
        })).sort((a, b) => b.sales - a.sales),
        userStatistics: userStats[0],
        recentTransactions,
        totalPackages: packages.length,
        activePackages: packages.filter(p => p.isActive).length
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/admin/credit-trends", requireSupabaseAdmin, async (req, res) => {
    try {
      const days = parseInt(req.query.days as string) || 30;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const [creditTrends, topSpenders, hourlyUsage] = await Promise.all([
        // Daily credit trends
        db.select({
          date: sql<string>`DATE(${creditTransactions.createdAt})`,
          purchases: sql<number>`COALESCE(SUM(CASE WHEN ${creditTransactions.type} = 'purchase' THEN ${creditTransactions.amount} ELSE 0 END), 0)`,
          usage: sql<number>`COALESCE(ABS(SUM(CASE WHEN ${creditTransactions.type} = 'usage' THEN ${creditTransactions.amount} ELSE 0 END)), 0)`,
          net: sql<number>`SUM(${creditTransactions.amount})`
        }).from(creditTransactions)
         .where(gte(creditTransactions.createdAt, startDate))
         .groupBy(sql`DATE(${creditTransactions.createdAt})`)
         .orderBy(sql`DATE(${creditTransactions.createdAt})`),

        // Top spending users
        db.select({
          userId: creditTransactions.userId,
          userEmail: users.email,
          userName: sql<string>`${users.firstName} || ' ' || ${users.lastName}`,
          totalSpent: sql<number>`ABS(SUM(CASE WHEN ${creditTransactions.type} = 'usage' THEN ${creditTransactions.amount} ELSE 0 END))`,
          totalPurchased: sql<number>`SUM(CASE WHEN ${creditTransactions.type} = 'purchase' THEN ${creditTransactions.amount} ELSE 0 END)`,
          transactionCount: count()
        }).from(creditTransactions)
         .innerJoin(users, eq(creditTransactions.userId, users.id))
         .where(gte(creditTransactions.createdAt, startDate))
         .groupBy(creditTransactions.userId, users.email, users.firstName, users.lastName)
         .orderBy(sql`ABS(SUM(CASE WHEN ${creditTransactions.type} = 'usage' THEN ${creditTransactions.amount} ELSE 0 END)) DESC`)
         .limit(10),

        // Hourly usage patterns
        db.select({
          hour: sql<number>`EXTRACT(HOUR FROM ${creditTransactions.createdAt})`,
          transactions: count(),
          credits: sql<number>`ABS(SUM(CASE WHEN ${creditTransactions.type} = 'usage' THEN ${creditTransactions.amount} ELSE 0 END))`
        }).from(creditTransactions)
         .where(and(
           gte(creditTransactions.createdAt, startDate),
           eq(creditTransactions.type, 'usage')
         ))
         .groupBy(sql`EXTRACT(HOUR FROM ${creditTransactions.createdAt})`)
         .orderBy(sql`EXTRACT(HOUR FROM ${creditTransactions.createdAt})`)
      ]);

      res.json({
        creditTrends,
        topSpenders,
        hourlyUsage,
        period: {
          days,
          startDate: startDate.toISOString(),
          endDate: new Date().toISOString()
        }
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Admin data seeding endpoints
  app.post("/api/admin/seed-data", requireSupabaseAdmin, async (req, res) => {
    try {
      // Seed AI Provider Configs
      const aiProviderConfigsData = [
        {
          providerId: 'openai-gpt5',
          name: 'OpenAI',
          model: 'GPT-5',
          provider: 'openai',
          credits: 3,
          description: 'Modelo mais avançado para análise jurídica detalhada',
          iconName: 'Bot',
          isPopular: true,
          isFree: false,
          isActive: true,
          sortOrder: 1,
        },
        {
          providerId: 'anthropic-claude',
          name: 'Anthropic',
          model: 'Claude Sonnet 4',
          provider: 'anthropic',
          credits: 3,
          description: 'Especializado em análise de documentos legais',
          iconName: 'Brain',
          isPopular: false,
          isFree: false,
          isActive: true,
          sortOrder: 2,
        },
        {
          providerId: 'openai-gpt4',
          name: 'OpenAI',
          model: 'GPT-4',
          provider: 'openai',
          credits: 2,
          description: 'Análise confiável com boa precisão',
          iconName: 'Bot',
          isPopular: false,
          isFree: false,
          isActive: true,
          sortOrder: 3,
        },
        {
          providerId: 'gemini-pro',
          name: 'Google',
          model: 'Gemini Pro',
          provider: 'gemini',
          credits: 1,
          description: 'Análise rápida e eficiente',
          iconName: 'Sparkles',
          isPopular: false,
          isFree: false,
          isActive: true,
          sortOrder: 4,
        },
        {
          providerId: 'openrouter',
          name: 'OpenRouter',
          model: 'Multiple Models',
          provider: 'openrouter',
          credits: 2,
          description: 'Acesso a múltiplos modelos de IA',
          iconName: 'Route',
          isPopular: false,
          isFree: false,
          isActive: true,
          sortOrder: 5,
        },
        {
          providerId: 'free-ai',
          name: 'IA Gratuita',
          model: 'Basic Analysis',
          provider: 'free',
          credits: 0,
          description: 'Análise básica para usuários gratuitos',
          iconName: 'Gift',
          isPopular: false,
          isFree: true,
          isActive: true,
          sortOrder: 6,
        }
      ];

      // Seed Credit Packages
      const creditPackagesData = [
        {
          packageId: 'credits_50',
          name: '50 Créditos',
          credits: 50,
          price: '47.00',
          isPopular: false,
          description: 'Ideal para uso básico',
          features: ['Análises básicas', 'Todos os provedores de IA', 'Suporte por email'],
          isActive: true,
          sortOrder: 1,
        },
        {
          packageId: 'credits_100',
          name: '100 Créditos',
          credits: 100,
          price: '87.00',
          isPopular: true,
          description: 'Melhor custo-benefício',
          features: ['Análises ilimitadas', 'Todos os provedores de IA', 'Suporte prioritário', '15% de desconto'],
          isActive: true,
          sortOrder: 2,
        },
        {
          packageId: 'credits_500',
          name: '500 Créditos',
          credits: 500,
          price: '397.00',
          isPopular: false,
          description: 'Para uso profissional',
          features: ['Volume profissional', 'Todos os provedores de IA', 'Suporte dedicado', '20% de desconto'],
          isActive: true,
          sortOrder: 3,
        }
      ];

      // Check if data already exists to avoid duplicates
      const existingConfigs = await storage.getAiProviderConfigs();
      const existingPackages = await storage.getCreditPackages();

      if (existingConfigs.length === 0) {
        for (const config of aiProviderConfigsData) {
          await storage.createAiProviderConfig(config);
        }
      }

      if (existingPackages.length === 0) {
        for (const pkg of creditPackagesData) {
          await storage.createCreditPackage(pkg);
        }
      }

      // Seed initial platform stats
      await storage.computeAndUpdatePlatformStats();

      res.json({ 
        message: "Database seeded successfully",
        aiProviderConfigs: existingConfigs.length === 0 ? aiProviderConfigsData.length : 0,
        creditPackages: existingPackages.length === 0 ? creditPackagesData.length : 0,
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ============================================================================
  // TEMPLATE MANAGEMENT API ROUTES
  // ============================================================================

  // Document Templates Routes
  app.get("/api/templates", async (req, res) => {
    try {
      const templates = await storage.getDocumentTemplates();
      res.json(templates);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/templates/:templateId", async (req, res) => {
    try {
      const { templateId } = req.params;
      const templateData = await storage.getTemplateWithPrompts(templateId);
      if (!templateData) {
        return res.status(404).json({ message: "Template not found" });
      }
      res.json(templateData);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/templates/category/:category", async (req, res) => {
    try {
      const { category } = req.params;
      const templates = await storage.getDocumentTemplatesByCategory(category);
      res.json(templates);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/templates", requireSupabaseAdmin, async (req, res) => {
    try {
      const templateData = insertDocumentTemplateSchema.parse(req.body);
      const template = await storage.createDocumentTemplate(templateData);
      res.status(201).json(template);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: "Invalid template data", errors: error.errors });
      }
      res.status(500).json({ message: error.message });
    }
  });

  app.put("/api/templates/:id", requireSupabaseAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const templateData = insertDocumentTemplateSchema.partial().parse(req.body);
      const template = await storage.updateDocumentTemplate(id, templateData);
      res.json(template);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: "Invalid template data", errors: error.errors });
      }
      if (error.message === "Document Template not found") {
        return res.status(404).json({ message: error.message });
      }
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/templates/:id", requireSupabaseAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteDocumentTemplate(id);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Legal Clauses Routes
  app.get("/api/legal-clauses", async (req, res) => {
    try {
      const clauses = await storage.getLegalClauses();
      res.json(clauses);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/legal-clauses/category/:category", async (req, res) => {
    try {
      const { category } = req.params;
      const clauses = await storage.getLegalClausesByCategory(category);
      res.json(clauses);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/legal-clauses/template/:templateId", async (req, res) => {
    try {
      const { templateId } = req.params;
      const clauses = await storage.getLegalClausesByTemplate(templateId);
      res.json(clauses);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/legal-clauses", requireSupabaseAdmin, async (req, res) => {
    try {
      const clauseData = insertLegalClauseSchema.parse(req.body);
      const clause = await storage.createLegalClause(clauseData);
      res.status(201).json(clause);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: "Invalid clause data", errors: error.errors });
      }
      res.status(500).json({ message: error.message });
    }
  });

  app.put("/api/legal-clauses/:id", requireSupabaseAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const clauseData = insertLegalClauseSchema.partial().parse(req.body);
      const clause = await storage.updateLegalClause(id, clauseData);
      res.json(clause);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: "Invalid clause data", errors: error.errors });
      }
      if (error.message === "Legal Clause not found") {
        return res.status(404).json({ message: error.message });
      }
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/legal-clauses/:id", requireSupabaseAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteLegalClause(id);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Template Prompts Routes
  app.get("/api/templates/:templateId/prompts", requireSupabaseAdmin, async (req, res) => {
    try {
      const { templateId } = req.params;
      const template = await storage.getDocumentTemplateById(templateId);
      if (!template) {
        return res.status(404).json({ message: "Template not found" });
      }
      const prompts = await storage.getTemplatePrompts(templateId);
      res.json(prompts);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/template-prompts", requireSupabaseAdmin, async (req, res) => {
    try {
      const promptData = insertTemplatePromptSchema.parse(req.body);
      const prompt = await storage.createTemplatePrompt(promptData);
      res.status(201).json(prompt);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: "Invalid prompt data", errors: error.errors });
      }
      res.status(500).json({ message: error.message });
    }
  });

  app.put("/api/template-prompts/:id", requireSupabaseAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const promptData = insertTemplatePromptSchema.partial().parse(req.body);
      const prompt = await storage.updateTemplatePrompt(id, promptData);
      res.json(prompt);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: "Invalid prompt data", errors: error.errors });
      }
      if (error.message === "Template Prompt not found") {
        return res.status(404).json({ message: error.message });
      }
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/template-prompts/:id", requireSupabaseAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteTemplatePrompt(id);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Template Analysis Rules Routes
  app.get("/api/templates/:templateId/analysis-rules", requireSupabaseAdmin, async (req, res) => {
    try {
      const { templateId } = req.params;
      const template = await storage.getDocumentTemplateById(templateId);
      if (!template) {
        return res.status(404).json({ message: "Template not found" });
      }
      const rules = await storage.getTemplateAnalysisRules(templateId);
      res.json(rules);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/template-analysis-rules", requireSupabaseAdmin, async (req, res) => {
    try {
      const ruleData = insertTemplateAnalysisRuleSchema.parse(req.body);
      const rule = await storage.createTemplateAnalysisRule(ruleData);
      res.status(201).json(rule);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: "Invalid rule data", errors: error.errors });
      }
      res.status(500).json({ message: error.message });
    }
  });

  app.put("/api/template-analysis-rules/:id", requireSupabaseAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const ruleData = insertTemplateAnalysisRuleSchema.partial().parse(req.body);
      const rule = await storage.updateTemplateAnalysisRule(id, ruleData);
      res.json(rule);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: "Invalid rule data", errors: error.errors });
      }
      if (error.message === "Template Analysis Rule not found") {
        return res.status(404).json({ message: error.message });
      }
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/template-analysis-rules/:id", requireSupabaseAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteTemplateAnalysisRule(id);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ===============================
  // BATCH PROCESSING ENDPOINTS
  // ===============================

  // Enhanced MIME type validation for security
  function validateFileType(file: Express.Multer.File): boolean {
    const allowedTypes = {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt']
    };
    
    // Check MIME type
    if (!allowedTypes[file.mimetype as keyof typeof allowedTypes]) {
      return false;
    }
    
    // Check file extension matches MIME type
    const validExtensions = allowedTypes[file.mimetype as keyof typeof allowedTypes];
    const fileExtension = path.extname(file.originalname).toLowerCase();
    
    return validExtensions.includes(fileExtension);
  }

  // SECURITY FIX: Configure multer for batch uploads with comprehensive limits
  const batchUpload = multer({
    storage: multer.diskStorage({
      destination: (req, file, cb) => {
        cb(null, '/tmp/batch-uploads');
      },
      filename: (req, file, cb) => {
        // SECURITY FIX: Sanitize filename to prevent path traversal attacks
        const safeBasename = path.basename(file.originalname);
        const sanitizedName = safeBasename.replace(/[^a-zA-Z0-9._-]/g, "_");
        const randomString = Math.random().toString(36).substring(2);
        const uniqueName = `${Date.now()}-${randomString}-${sanitizedName}`;
        
        // Additional security: reject if any path separators remain
        if (uniqueName.includes('/') || uniqueName.includes('\\') || uniqueName.includes('..')) {
          return cb(new Error('Invalid filename detected'), '');
        }
        
        cb(null, uniqueName);
      }
    }),
    limits: { 
      fileSize: 50 * 1024 * 1024, // 50MB per file for batch processing
      files: 25, // Maximum 25 files per batch to prevent resource exhaustion
      fieldSize: 1024 * 1024, // 1MB limit for form fields
      fieldNameSize: 100, // Limit field name length
      fields: 20 // Limit number of form fields
    },
    fileFilter: (req, file, cb) => {
      // Enhanced validation with both MIME type and extension check
      if (!validateFileType(file)) {
        return cb(new Error(`Invalid file type: ${file.mimetype}. Only PDF, DOC, DOCX, and TXT files are allowed.`), false);
      }
      
      cb(null, true);
    }
  });

  // Middleware to validate total batch size before processing
  const validateBatchSize = (req: any, res: any, next: any) => {
    if (req.files && Array.isArray(req.files)) {
      const totalSize = req.files.reduce((sum: number, file: Express.Multer.File) => sum + file.size, 0);
      const maxTotalSize = 500 * 1024 * 1024; // 500MB total batch limit
      
      if (totalSize > maxTotalSize) {
        // CLEANUP: Remove uploaded files on rejection
        cleanupUploadedFiles(req.files as Express.Multer.File[]);
        return res.status(413).json({ 
          message: `Total batch size exceeds limit. Maximum: ${maxTotalSize / (1024 * 1024)}MB, Received: ${(totalSize / (1024 * 1024)).toFixed(2)}MB`,
          maxTotalSize,
          actualSize: totalSize
        });
      }
      
      // Validate file count on server side (double-check multer limit)
      if (req.files.length > 25) {
        // CLEANUP: Remove uploaded files on rejection
        cleanupUploadedFiles(req.files as Express.Multer.File[]);
        return res.status(413).json({ 
          message: `Too many files. Maximum: 25, Received: ${req.files.length}`,
          maxFiles: 25,
          actualFiles: req.files.length
        });
      }
    }
    next();
  };

  // Create batch job with multiple files - SECURE: Disk-based storage with atomic credit reservation
  app.post("/api/batch/create", requireSupabaseAuth, batchUpload.array('files', 25), validateBatchSize, async (req, res) => {
    let uploadedFiles: Express.Multer.File[] = [];
    let batchJobCreated = false;
    
    try {
      const files = req.files as Express.Multer.File[];
      uploadedFiles = files || [];
      
      if (!files || files.length === 0) {
        // CLEANUP: Remove uploaded files on no files error
        cleanupUploadedFiles(uploadedFiles);
        return res.status(400).json({ message: "No files provided for batch processing" });
      }

      const { name, description, analysisType, aiProvider, aiModel, templateId } = req.body;

      // Validate required fields
      if (!name || !analysisType || !aiProvider || !aiModel) {
        // CLEANUP: Remove uploaded files on validation error
        cleanupUploadedFiles(uploadedFiles);
        return res.status(400).json({ message: "Missing required fields: name, analysisType, aiProvider, aiModel" });
      }

      // Validate template if provided
      let templateData = null;
      if (templateId) {
        templateData = await storage.getTemplateWithPrompts(templateId);
        if (!templateData) {
          // CLEANUP: Remove uploaded files on template not found error
          cleanupUploadedFiles(uploadedFiles);
          return res.status(404).json({ message: "Template not found" });
        }
      }

      // Calculate total credits needed based on analysis type
      const creditsPerDocument = aiService.getProviderCredits(`${aiProvider}-${aiModel}`, analysisType);
      const totalCreditsNeeded = creditsPerDocument * files.length;
      
      // RACE CONDITION FIX: Atomic credit check and reservation
      // Deduct credits immediately to prevent race conditions
      try {
        await storage.deductUserCredits(req.user.id, totalCreditsNeeded, `Batch processing reservation: ${name}`);
        console.log(`✅ Reserved ${totalCreditsNeeded} credits for batch: ${name}`);
      } catch (creditError: any) {
        // Clean up uploaded files if credit deduction fails
        await cleanupUploadedFiles(files);
        
        if (creditError.message.includes("Insufficient credits")) {
          return res.status(402).json({ 
            message: "Insufficient credits for batch processing",
            creditsNeeded: totalCreditsNeeded,
            creditsAvailable: req.user.credits,
            documentsCount: files.length
          });
        }
        throw creditError;
      }

      // Create batch job
      const batchJob = await storage.createBatchJob(req.user.id, {
        name,
        description,
        analysisType,
        templateId: templateData?.template.id || null,
        aiProvider,
        aiModel,
        totalDocuments: files.length,
        totalCreditsEstimated: totalCreditsNeeded,
        metadata: {}
      });
      batchJobCreated = true;

      // Create batch documents with file paths (not buffers) - SECURE: No more base64 in database
      const batchDocuments = await Promise.all(
        files.map(async (file, index) => {
          return await storage.createBatchDocument({
            batchJobId: batchJob.id,
            originalFileName: file.originalname,
            fileSize: file.size,
            fileMimeType: file.mimetype,
            sortOrder: index,
            metadata: { 
              filePath: file.path, // Store disk path instead of buffer
              tempFile: true // Mark for cleanup after processing
            }
          });
        })
      );

      // Create queue job for batch processing
      await storage.createQueueJob({
        jobType: 'batch_processing',
        jobData: {
          batchJobId: batchJob.id,
          userId: req.user.id,
          aiProvider,
          aiModel,
          analysisType,
          templateId
        },
        priority: 1
      });

      res.status(201).json({
        batchJob,
        documents: batchDocuments,
        estimatedCredits: totalCreditsNeeded
      });
      
      console.log(`✅ Batch job created: ${batchJob.id} with ${files.length} files`);
      
    } catch (error: any) {
      console.error('❌ Batch creation error:', error);
      
      // CLEANUP: If batch creation fails, clean up uploaded files and refund credits
      if (uploadedFiles.length > 0) {
        await cleanupUploadedFiles(uploadedFiles);
      }
      
      // If credits were deducted but batch creation failed, refund them
      if (!batchJobCreated && uploadedFiles.length > 0) {
        try {
          const creditsPerDocument = aiService.getProviderCredits(`${aiProvider}-${aiModel}`);
          const totalCreditsNeeded = creditsPerDocument * uploadedFiles.length;
          await storage.createCreditTransaction(
            req.user.id, 
            "refund", 
            totalCreditsNeeded, 
            `Batch creation failed - refund for: ${name || 'unnamed batch'}`
          );
          console.log(`✅ Refunded ${totalCreditsNeeded} credits due to batch creation failure`);
        } catch (refundError) {
          console.error('❌ Failed to refund credits after batch creation failure:', refundError);
        }
      }
      
      res.status(500).json({ message: error.message });
    }
  });

  // Get user's batch jobs
  app.get("/api/batch/jobs", requireSupabaseAuth, async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
      const batchJobs = await storage.getBatchJobs(req.user.id, limit);
      res.json(batchJobs);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Get specific batch job with details
  app.get("/api/batch/jobs/:id", requireSupabaseAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const batchJob = await storage.getBatchJob(id, req.user.id);
      if (!batchJob) {
        return res.status(404).json({ message: "Batch job not found" });
      }

      const documents = await storage.getBatchDocuments(id);
      res.json({ ...batchJob, documents });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Get batch job statistics
  app.get("/api/batch/statistics", requireSupabaseAuth, async (req, res) => {
    try {
      const statistics = await storage.getBatchJobStatistics(req.user.id);
      res.json(statistics);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Cancel batch job (if still pending)
  app.post("/api/batch/jobs/:id/cancel", requireSupabaseAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const batchJob = await storage.getBatchJob(id, req.user.id);
      if (!batchJob) {
        return res.status(404).json({ message: "Batch job not found" });
      }

      if (batchJob.status !== 'pending') {
        return res.status(400).json({ message: "Cannot cancel batch job that is already processing or completed" });
      }

      const updatedJob = await storage.updateBatchJobStatus(id, 'cancelled');
      res.json(updatedJob);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Delete batch job
  app.delete("/api/batch/jobs/:id", requireSupabaseAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const batchJob = await storage.getBatchJob(id, req.user.id);
      if (!batchJob) {
        return res.status(404).json({ message: "Batch job not found" });
      }

      await storage.deleteBatchJob(id);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Get batch processing results
  app.get("/api/batch/jobs/:id/results", requireSupabaseAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const batchJob = await storage.getBatchJob(id, req.user.id);
      if (!batchJob) {
        return res.status(404).json({ message: "Batch job not found" });
      }

      const documents = await storage.getBatchDocuments(id);
      
      // Get analysis results for completed documents
      const documentsWithResults = await Promise.all(
        documents.map(async (doc) => {
          if (doc.documentAnalysisId) {
            const analysis = await storage.getDocumentAnalysis(doc.documentAnalysisId, req.user.id);
            return { ...doc, analysis };
          }
          return doc;
        })
      );

      // Calculate batch summary
      const completedDocs = documentsWithResults.filter(doc => doc.status === 'completed');
      const failedDocs = documentsWithResults.filter(doc => doc.status === 'failed');
      
      const summary = {
        totalDocuments: documents.length,
        completedDocuments: completedDocs.length,
        failedDocuments: failedDocs.length,
        totalCreditsUsed: batchJob.totalCreditsUsed,
        overallRiskLevel: calculateBatchRiskLevel(completedDocs),
        averageComplianceScore: calculateAverageCompliance(completedDocs)
      };

      res.json({
        batchJob,
        documents: documentsWithResults,
        summary
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Admin endpoints for batch management
  app.get("/api/admin/batch/jobs", requireSupabaseAdmin, async (req, res) => {
    try {
      const page = req.query.page ? parseInt(req.query.page as string) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
      const result = await storage.getAllBatchJobs(page, limit);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/admin/batch/statistics", requireSupabaseAdmin, async (req, res) => {
    try {
      const statistics = await storage.getBatchJobStatistics(); // No userId for admin view
      res.json(statistics);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Queue management endpoints
  app.get("/api/admin/queue/jobs", requireSupabaseAdmin, async (req, res) => {
    try {
      const status = req.query.status as string;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const queueJobs = await storage.getQueueJobs(status, limit);
      res.json(queueJobs);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/admin/queue/jobs/:id/retry", requireSupabaseAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const retryJob = await storage.retryFailedQueueJob(id);
      res.json(retryJob);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/admin/queue/jobs/:id", requireSupabaseAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteQueueJob(id);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Helper functions for batch processing
  function calculateBatchRiskLevel(completedDocs: any[]): string {
    if (completedDocs.length === 0) return 'unknown';
    
    const riskLevels = completedDocs.map(doc => doc.analysis?.result?.riskLevel).filter(Boolean);
    const criticalCount = riskLevels.filter(level => level === 'critical').length;
    const highCount = riskLevels.filter(level => level === 'high').length;
    
    if (criticalCount > 0) return 'critical';
    if (highCount > riskLevels.length * 0.5) return 'high';
    if (highCount > 0) return 'medium';
    return 'low';
  }

  function calculateAverageCompliance(completedDocs: any[]): number {
    const complianceScores = completedDocs
      .map(doc => doc.analysis?.result?.legalCompliance?.score)
      .filter(score => score !== undefined && score !== null);
    
    if (complianceScores.length === 0) return 0;
    return Math.round(complianceScores.reduce((sum, score) => sum + score, 0) / complianceScores.length);
  }

  const httpServer = createServer(app);
  return httpServer;
}
