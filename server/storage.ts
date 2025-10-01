import { type User, type InsertUser, type LoginUser, type AiProvider, type InsertAiProvider, type SystemAiProvider, type InsertSystemAiProvider, type DocumentAnalysis, type InsertDocumentAnalysis, type CreditTransaction, type SupportTicket, type InsertSupportTicket, type TicketMessage, type InsertTicketMessage, type AiProviderConfig, type InsertAiProviderConfig, type CreditPackage, type InsertCreditPackage, type PlatformStats, type InsertPlatformStats, type DocumentTemplate, type InsertDocumentTemplate, type LegalClause, type InsertLegalClause, type TemplatePrompt, type InsertTemplatePrompt, type TemplateAnalysisRule, type InsertTemplateAnalysisRule, type BatchJob, type InsertBatchJob, type BatchDocument, type InsertBatchDocument, type QueueJob, type InsertQueueJob, type BatchDocumentMetadata, type SiteConfig, type InsertSiteConfig, type SmtpConfig, type InsertSmtpConfig, type AdminNotification, type InsertAdminNotification, type UserNotificationView, type InsertUserNotificationView, type StripeConfig, type InsertStripeConfig } from "@shared/schema";
import { encryptApiKey, decryptApiKey, migrateApiKey, isLegacyFormat, batchMigrateApiKeys } from "./lib/encryption";
import type { Express } from "express";
import { db } from "./db";
import { users, aiProviders, systemAiProviders, documentAnalyses, creditTransactions, supportTickets, ticketMessages, aiProviderConfigs, creditPackages, platformStats, documentTemplates, legalClauses, templatePrompts, templateAnalysisRules, batchJobs, batchDocuments, queueJobs, siteConfig, smtpConfig, adminNotifications, userNotificationViews, stripeConfig } from "@shared/schema";
import { eq, desc, and, count, sum, gte, sql, isNotNull, isNull, lte } from "drizzle-orm";

export interface IStorage {
  // User management
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUsersByRole(role: string): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  ensureUserBySupabase(supabaseId: string, email: string, supabaseUserData: any): Promise<User>;
  updateUserCredits(id: string, credits: number): Promise<User>;
  deductUserCredits(userId: string, amount: number, description: string): Promise<void>;
  updateUserRole(id: string, role: string): Promise<User>;
  updateStripeCustomerId(id: string, customerId: string): Promise<User>;
  updateUserStripeMode(id: string, stripeMode: 'test' | 'live'): Promise<User>;

  // Admin-specific user management
  getAllUsers(page?: number, limit?: number): Promise<{users: User[], total: number}>;
  getPlatformAnalytics(): Promise<{
    totalUsers: number;
    totalAnalyses: number;
    totalCreditsUsed: number;
    totalCreditsPurchased: number;
    totalRevenue: number;
    userGrowth: Array<{date: string, count: number}>;
    analysisGrowth: Array<{date: string, count: number}>;
    supportTicketsStats: {open: number, pending: number, resolved: number, closed: number};
  }>;

  // AI Provider management
  getAiProviders(userId: string): Promise<AiProvider[]>;
  getAiProvider(userId: string, provider: string): Promise<AiProvider | undefined>;
  createAiProvider(userId: string, provider: InsertAiProvider): Promise<AiProvider>;
  updateAiProvider(id: string, provider: Partial<InsertAiProvider>): Promise<AiProvider>;
  deleteAiProvider(id: string): Promise<void>;

  // System AI Provider management (Admin only)
  getSystemAiProviders(): Promise<SystemAiProvider[]>;
  getSystemAiProvider(provider: string): Promise<SystemAiProvider | undefined>;
  createSystemAiProvider(provider: InsertSystemAiProvider): Promise<SystemAiProvider>;
  updateSystemAiProvider(id: string, provider: Partial<InsertSystemAiProvider>): Promise<SystemAiProvider>;
  deleteSystemAiProvider(id: string): Promise<void>;
  getSystemApiKeyByProvider(provider: string): Promise<string | undefined>;
  
  // SECURITY: Get system providers with masked API keys for admin interface
  getSystemAiProvidersForAdmin(): Promise<Array<Omit<SystemAiProvider, 'apiKey'> & { maskedApiKey: string }>>;

  // AI Usage Analytics
  getAiUsageAnalytics(): Promise<{
    providerUsage: Array<{provider: string, model: string, count: number, totalCredits: number}>;
    analysisTypes: Array<{type: string, count: number}>;
    errorRates: Array<{provider: string, model: string, successRate: number}>;
  }>;

  // Credit Management
  getCreditPackages(): Promise<CreditPackage[]>;
  getCreditPackage(packageId: string): Promise<CreditPackage | undefined>;
  createCreditPackage(pkg: InsertCreditPackage): Promise<CreditPackage>;
  updateCreditPackage(id: string, pkg: Partial<InsertCreditPackage>): Promise<CreditPackage>;
  deleteCreditPackage(id: string): Promise<void>;

  // SECURITY: Migration functions for upgrading legacy encrypted keys
  migrateSystemApiKeys(): Promise<{
    total: number;
    migrated: number;
    alreadySecure: number;
    errors: Array<{id: string, error: string}>;
  }>;
  performOneTimeMigration(): Promise<void>;

  // Document Analysis
  getDocumentAnalyses(userId: string, limit?: number): Promise<DocumentAnalysis[]>;
  getDeletedAnalyses(userId: string): Promise<DocumentAnalysis[]>;
  getDocumentAnalysis(id: string, userId: string): Promise<DocumentAnalysis | undefined>;
  createDocumentAnalysis(userId: string, analysis: InsertDocumentAnalysis): Promise<DocumentAnalysis>;
  updateDocumentAnalysisResult(id: string, result: any, status: string): Promise<DocumentAnalysis>;
  softDeleteAnalysis(id: string, userId: string, deletedBy: string): Promise<DocumentAnalysis>;
  restoreAnalysis(id: string, userId: string): Promise<DocumentAnalysis>;
  hardDeleteAnalysis(id: string): Promise<void>;
  cleanupExpiredAnalyses(): Promise<number>;

  // Credit Transactions
  getCreditTransactions(userId: string): Promise<CreditTransaction[]>;
  getCreditTransactionByStripeId(stripePaymentIntentId: string): Promise<CreditTransaction | undefined>;
  createCreditTransaction(userId: string, type: string, amount: number, description: string, stripePaymentIntentId?: string): Promise<CreditTransaction>;
  
  // Support Tickets
  getSupportTickets(userId: string): Promise<SupportTicket[]>;
  getAllSupportTickets(): Promise<SupportTicket[]>;
  getSupportTicket(id: string, userId: string): Promise<SupportTicket | undefined>;
  getSupportTicketById(id: string): Promise<SupportTicket | undefined>;
  createSupportTicket(userId: string, ticket: InsertSupportTicket): Promise<SupportTicket>;
  updateSupportTicketStatus(id: string, status: string): Promise<SupportTicket>;

  // Ticket Messages
  getTicketMessages(ticketId: string): Promise<TicketMessage[]>;
  createTicketMessage(ticketMessage: InsertTicketMessage): Promise<TicketMessage>;

  // Platform Stats
  getPlatformStats(): Promise<PlatformStats | undefined>;
  updatePlatformStats(stats: InsertPlatformStats): Promise<PlatformStats>;
  computeAndUpdatePlatformStats(): Promise<PlatformStats>;

  // Site Configuration
  getSiteConfigs(section?: string): Promise<SiteConfig[]>;
  getSiteConfig(section: string, key: string): Promise<SiteConfig | undefined>;
  createSiteConfig(config: InsertSiteConfig): Promise<SiteConfig>;
  updateSiteConfig(id: string, config: Partial<InsertSiteConfig>): Promise<SiteConfig>;
  deleteSiteConfig(id: string): Promise<void>;

  // SMTP Configuration
  getSmtpConfig(): Promise<SmtpConfig | undefined>;
  createSmtpConfig(config: InsertSmtpConfig): Promise<SmtpConfig>;
  updateSmtpConfig(id: string, config: Partial<InsertSmtpConfig>): Promise<SmtpConfig>;
  deleteSmtpConfig(id: string): Promise<void>;

  // Stripe Configuration
  getStripeConfig(): Promise<StripeConfig | undefined>;
  createStripeConfig(config: InsertStripeConfig): Promise<StripeConfig>;
  updateStripeConfig(id: string, config: Partial<InsertStripeConfig>): Promise<StripeConfig>;
  deleteStripeConfig(id: string): Promise<void>;

  // Admin Notifications
  getAdminNotifications(targetAudience?: string): Promise<AdminNotification[]>;
  getAdminNotification(id: string): Promise<AdminNotification | undefined>;
  createAdminNotification(notification: InsertAdminNotification): Promise<AdminNotification>;
  updateAdminNotification(id: string, notification: Partial<InsertAdminNotification>): Promise<AdminNotification>;
  deleteAdminNotification(id: string): Promise<void>;

  // User Notification Views
  getUserNotificationViews(userId: string): Promise<UserNotificationView[]>;
  createUserNotificationView(view: InsertUserNotificationView): Promise<UserNotificationView>;
  getUnreadNotificationsForUser(userId: string): Promise<AdminNotification[]>;

  // Payment processing
  processPaymentTransaction(params: {
    userId: string;
    stripePaymentIntentId: string;
    amount: number;
    credits: number;
    packageId: string;
    stripeMode: 'test' | 'live';
  }): Promise<void>;

  // AI Provider Configs (aliases for existing methods)
  getAiProviderConfigs(userId: string): Promise<AiProvider[]>;
  getAiProviderConfig(id: string): Promise<AiProvider | undefined>;
  createAiProviderConfig(userId: string, config: InsertAiProvider): Promise<AiProvider>;
  updateAiProviderConfig(id: string, config: Partial<InsertAiProvider>): Promise<AiProvider>;
  deleteAiProviderConfig(id: string): Promise<void>;

  // Document Templates
  getDocumentTemplates(): Promise<DocumentTemplate[]>;
  getDocumentTemplatesByCategory(category: string): Promise<DocumentTemplate[]>;
  getDocumentTemplateById(id: string): Promise<DocumentTemplate | undefined>;
  createDocumentTemplate(template: InsertDocumentTemplate): Promise<DocumentTemplate>;
  updateDocumentTemplate(id: string, template: Partial<InsertDocumentTemplate>): Promise<DocumentTemplate>;
  deleteDocumentTemplate(id: string): Promise<void>;
  getTemplateWithPrompts(templateId: string, aiProvider?: string): Promise<any>;

  // Legal Clauses
  getLegalClauses(): Promise<LegalClause[]>;
  getLegalClausesByCategory(category: string): Promise<LegalClause[]>;
  getLegalClausesByTemplate(templateId: string): Promise<LegalClause[]>;
  createLegalClause(clause: InsertLegalClause): Promise<LegalClause>;
  updateLegalClause(id: string, clause: Partial<InsertLegalClause>): Promise<LegalClause>;
  deleteLegalClause(id: string): Promise<void>;

  // Template Prompts
  getTemplatePrompts(templateId: string): Promise<TemplatePrompt[]>;
  createTemplatePrompt(prompt: InsertTemplatePrompt): Promise<TemplatePrompt>;
  updateTemplatePrompt(id: string, prompt: Partial<InsertTemplatePrompt>): Promise<TemplatePrompt>;
  deleteTemplatePrompt(id: string): Promise<void>;

  // Template Analysis Rules
  getTemplateAnalysisRules(templateId: string): Promise<TemplateAnalysisRule[]>;
  createTemplateAnalysisRule(rule: InsertTemplateAnalysisRule): Promise<TemplateAnalysisRule>;
  updateTemplateAnalysisRule(id: string, rule: Partial<InsertTemplateAnalysisRule>): Promise<TemplateAnalysisRule>;
  deleteTemplateAnalysisRule(id: string): Promise<void>;

  // Batch Jobs
  getBatchJobs(userId: string): Promise<BatchJob[]>;
  getAllBatchJobs(): Promise<BatchJob[]>;
  getBatchJob(id: string, userId?: string): Promise<BatchJob | undefined>;
  createBatchJob(job: InsertBatchJob): Promise<BatchJob>;
  updateBatchJobStatus(id: string, status: string): Promise<void>;
  deleteBatchJob(id: string): Promise<void>;
  getBatchJobStatistics(userId: string): Promise<any>;

  // Batch Documents
  getBatchDocuments(batchJobId: string): Promise<BatchDocument[]>;
  createBatchDocument(doc: InsertBatchDocument): Promise<BatchDocument>;

  // Queue Jobs
  getQueueJobs(): Promise<QueueJob[]>;
  createQueueJob(job: InsertQueueJob): Promise<QueueJob>;
  retryFailedQueueJob(id: string): Promise<void>;
  deleteQueueJob(id: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User management
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async getUsersByRole(role: string): Promise<User[]> {
    const usersByRole = await db.select().from(users).where(eq(users.role, role as "user" | "admin" | "support"));
    return usersByRole;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async ensureUserBySupabase(supabaseId: string, email: string, supabaseUserData: any): Promise<User> {
    console.log('🔍 ensureUserBySupabase - Starting:', { supabaseId, email });
    
    const [userBySupabaseId] = await db
      .select()
      .from(users)
      .where(eq(users.supabaseId, supabaseId))
      .limit(1);
    
    if (userBySupabaseId) {
      console.log('✅ ensureUserBySupabase - Found existing user by supabaseId:', userBySupabaseId.id);
      return userBySupabaseId;
    }

    const [userByEmail] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    
    if (userByEmail) {
      console.log('✅ ensureUserBySupabase - Found existing user by email:', userByEmail.id);
      if (userByEmail.supabaseId !== supabaseId) {
        console.log('🔄 ensureUserBySupabase - Updating existing user with supabaseId');
        const [updatedUser] = await db
          .update(users)
          .set({ supabaseId })
          .where(eq(users.id, userByEmail.id))
          .returning();
        return updatedUser;
      }
      return userByEmail;
    }

    console.log('🆕 ensureUserBySupabase - Creating new user');
    const [newUser] = await db
      .insert(users)
      .values({
        id: crypto.randomUUID(),
        email,
        username: email.split('@')[0],
        firstName: supabaseUserData.user_metadata?.first_name || email.split('@')[0],
        lastName: supabaseUserData.user_metadata?.last_name || '',
        password: 'supabase-auth',
        supabaseId,
        role: 'user',
        credits: 5
      })
      .returning();
    
    console.log('✅ ensureUserBySupabase - New user created:', newUser.id);
    return newUser;
  }

  async updateUserCredits(id: string, credits: number): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ credits, updatedAt: sql`CURRENT_TIMESTAMP` })
      .where(eq(users.id, id))
      .returning();
    if (!user) throw new Error("User not found");
    return user;
  }

  async deductUserCredits(userId: string, amount: number, description: string): Promise<void> {
    await db.transaction(async (tx) => {
      const [currentUser] = await tx
        .select()
        .from(users)
        .where(eq(users.id, userId));
      
      if (!currentUser) {
        throw new Error(`User not found: ${userId}`);
      }

      if (currentUser.credits < amount) {
        throw new Error(`Insufficient credits: ${currentUser.credits} available, ${amount} required`);
      }

      const newCredits = currentUser.credits - amount;
      await tx
        .update(users)
        .set({ 
          credits: newCredits,
          updatedAt: sql`CURRENT_TIMESTAMP`
        })
        .where(eq(users.id, userId));

      await tx
        .insert(creditTransactions)
        .values({
          userId,
          type: 'usage',
          amount: -amount,
          description,
        });
    });
  }

  async updateUserRole(id: string, role: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ role: role as "user" | "admin" | "support", updatedAt: sql`CURRENT_TIMESTAMP` })
      .where(eq(users.id, id))
      .returning();
    if (!user) throw new Error("User not found");
    return user;
  }

  async updateStripeCustomerId(id: string, customerId: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ stripeCustomerId: customerId, updatedAt: sql`CURRENT_TIMESTAMP` })
      .where(eq(users.id, id))
      .returning();
    if (!user) throw new Error("User not found");
    return user;
  }

  async updateUserStripeMode(id: string, stripeMode: 'test' | 'live'): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ stripeMode, updatedAt: sql`CURRENT_TIMESTAMP` })
      .where(eq(users.id, id))
      .returning();
    if (!user) throw new Error("User not found");
    return user;
  }

  // AI Provider management
  async getAiProviders(userId: string): Promise<AiProvider[]> {
    return await db
      .select()
      .from(aiProviders)
      .where(eq(aiProviders.userId, userId))
      .orderBy(aiProviders.createdAt);
  }

  async getAiProvider(userId: string, provider: string): Promise<AiProvider | undefined> {
    const [result] = await db
      .select()
      .from(aiProviders)
      .where(and(eq(aiProviders.userId, userId), eq(aiProviders.provider, provider)));
    return result || undefined;
  }

  async createAiProvider(userId: string, providerData: InsertAiProvider): Promise<AiProvider> {
    const [provider] = await db
      .insert(aiProviders)
      .values({
        ...providerData,
        userId,
      })
      .returning();
    return provider;
  }

  async updateAiProvider(id: string, providerData: Partial<InsertAiProvider>): Promise<AiProvider> {
    const [provider] = await db
      .update(aiProviders)
      .set(providerData)
      .where(eq(aiProviders.id, id))
      .returning();
    if (!provider) throw new Error("AI Provider not found");
    return provider;
  }

  async deleteAiProvider(id: string): Promise<void> {
    await db.delete(aiProviders).where(eq(aiProviders.id, id));
  }

  // System AI Provider management (Admin only) - WITH ENCRYPTION
  async getSystemAiProviders(): Promise<SystemAiProvider[]> {
    return await db
      .select()
      .from(systemAiProviders)
      .orderBy(systemAiProviders.createdAt);
  }

  // SECURITY: Get system providers with masked API keys for admin interface
  async getSystemAiProvidersForAdmin(): Promise<Array<Omit<SystemAiProvider, 'apiKey'> & { maskedApiKey: string }>> {
    const providers = await db
      .select()
      .from(systemAiProviders)
      .orderBy(systemAiProviders.createdAt);

    return providers.map(provider => {
      const { apiKey, ...providerWithoutKey } = provider;
      let maskedKey = '****';
      
      // SECURITY: Decrypt only to mask - never return full key
      if (apiKey) {
        try {
          const decryptedKey = decryptApiKey(apiKey);
          maskedKey = decryptedKey.length >= 4 ? `****${decryptedKey.slice(-4)}` : '****';
        } catch (error) {
          console.error('Failed to decrypt key for masking:', error);
          maskedKey = '****';
        }
      }

      return {
        ...providerWithoutKey,
        maskedApiKey: maskedKey
      };
    });
  }

  async getSystemAiProvider(provider: string): Promise<SystemAiProvider | undefined> {
    const [result] = await db
      .select()
      .from(systemAiProviders)
      .where(eq(systemAiProviders.provider, provider));
    return result || undefined;
  }

  async createSystemAiProvider(providerData: InsertSystemAiProvider): Promise<SystemAiProvider> {
    // SECURITY: Encrypt API key before storing
    const encryptedData = {
      ...providerData,
      apiKey: encryptApiKey(providerData.apiKey)
    };
    
    const [provider] = await db
      .insert(systemAiProviders)
      .values(encryptedData)
      .returning();
    return provider;
  }

  async updateSystemAiProvider(id: string, providerData: Partial<InsertSystemAiProvider>): Promise<SystemAiProvider> {
    // SECURITY: Encrypt API key if provided
    const updateData: any = { ...providerData, updatedAt: new Date() };
    if (providerData.apiKey) {
      updateData.apiKey = encryptApiKey(providerData.apiKey);
    }
    
    const [provider] = await db
      .update(systemAiProviders)
      .set(updateData)
      .where(eq(systemAiProviders.id, id))
      .returning();
    if (!provider) throw new Error("System AI Provider not found");
    return provider;
  }

  async deleteSystemAiProvider(id: string): Promise<void> {
    await db.delete(systemAiProviders).where(eq(systemAiProviders.id, id));
  }

  async getSystemApiKeyByProvider(provider: string): Promise<string | undefined> {
    const [result] = await db
      .select({ apiKey: systemAiProviders.apiKey })
      .from(systemAiProviders)
      .where(and(
        eq(systemAiProviders.provider, provider),
        eq(systemAiProviders.isActive, true)
      ));
    
    // SECURITY: Decrypt API key for immediate use only
    if (result?.apiKey) {
      try {
        return decryptApiKey(result.apiKey);
      } catch (error) {
        console.error(`Failed to decrypt API key for provider ${provider}:`, error);
        return undefined;
      }
    }
    
    return undefined;
  }

  // Admin-specific user management
  async getAllUsers(page: number = 1, limit: number = 20): Promise<{users: User[], total: number}> {
    const offset = (page - 1) * limit;
    
    const [usersResult, totalResult] = await Promise.all([
      db.select().from(users).orderBy(desc(users.createdAt)).limit(limit).offset(offset),
      db.select({ count: count() }).from(users)
    ]);
    
    return {
      users: usersResult,
      total: totalResult[0].count
    };
  }

  async getPlatformAnalytics(): Promise<{
    totalUsers: number;
    totalAnalyses: number;
    totalCreditsUsed: number;
    totalCreditsPurchased: number;
    totalRevenue: number;
    userGrowth: Array<{date: string, count: number}>;
    analysisGrowth: Array<{date: string, count: number}>;
    supportTicketsStats: {open: number, pending: number, resolved: number, closed: number};
  }> {
    const [userCount, analysisCount] = await Promise.all([
      db.select({ count: count() }).from(users),
      db.select({ count: count() }).from(documentAnalyses)
    ]);

    return {
      totalUsers: userCount[0].count,
      totalAnalyses: analysisCount[0].count,
      totalCreditsUsed: 0,
      totalCreditsPurchased: 0,
      totalRevenue: 0,
      userGrowth: [],
      analysisGrowth: [],
      supportTicketsStats: { open: 0, pending: 0, resolved: 0, closed: 0 }
    };
  }

  // Document Analysis
  async getDocumentAnalyses(userId: string, limit?: number): Promise<DocumentAnalysis[]> {
    const query = db
      .select()
      .from(documentAnalyses)
      .where(and(
        eq(documentAnalyses.userId, userId),
        isNull(documentAnalyses.deletedAt)
      ))
      .orderBy(desc(documentAnalyses.createdAt));
    
    if (limit) {
      return await query.limit(limit);
    }
    
    return await query;
  }

  async getDeletedAnalyses(userId: string): Promise<DocumentAnalysis[]> {
    return await db
      .select()
      .from(documentAnalyses)
      .where(and(
        eq(documentAnalyses.userId, userId),
        isNotNull(documentAnalyses.deletedAt)
      ))
      .orderBy(desc(documentAnalyses.deletedAt));
  }

  async getDocumentAnalysis(id: string, userId: string): Promise<DocumentAnalysis | undefined> {
    const [analysis] = await db
      .select()
      .from(documentAnalyses)
      .where(and(eq(documentAnalyses.id, id), eq(documentAnalyses.userId, userId)));
    return analysis || undefined;
  }

  async createDocumentAnalysis(userId: string, analysisData: InsertDocumentAnalysis): Promise<DocumentAnalysis> {
    const [analysis] = await db
      .insert(documentAnalyses)
      .values({
        ...analysisData,
        userId,
        status: "pending",
      })
      .returning();
    return analysis;
  }

  async updateDocumentAnalysisResult(id: string, result: any, status: string): Promise<DocumentAnalysis> {
    const [analysis] = await db
      .update(documentAnalyses)
      .set({ result, status })
      .where(eq(documentAnalyses.id, id))
      .returning();
    if (!analysis) throw new Error("Document analysis not found");
    return analysis;
  }

  async softDeleteAnalysis(id: string, userId: string, deletedBy: string): Promise<DocumentAnalysis> {
    const [analysis] = await db
      .update(documentAnalyses)
      .set({ 
        deletedAt: new Date(),
        deletedBy
      })
      .where(and(
        eq(documentAnalyses.id, id),
        eq(documentAnalyses.userId, userId),
        isNull(documentAnalyses.deletedAt)
      ))
      .returning();
    if (!analysis) throw new Error("Document analysis not found or already deleted");
    return analysis;
  }

  async restoreAnalysis(id: string, userId: string): Promise<DocumentAnalysis> {
    const [analysis] = await db
      .update(documentAnalyses)
      .set({ 
        deletedAt: null,
        deletedBy: null
      })
      .where(and(
        eq(documentAnalyses.id, id),
        eq(documentAnalyses.userId, userId),
        isNotNull(documentAnalyses.deletedAt)
      ))
      .returning();
    if (!analysis) throw new Error("Document analysis not found or not deleted");
    return analysis;
  }

  async hardDeleteAnalysis(id: string): Promise<void> {
    await db.delete(documentAnalyses).where(eq(documentAnalyses.id, id));
  }

  async cleanupExpiredAnalyses(): Promise<number> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const result = await db
      .delete(documentAnalyses)
      .where(and(
        isNotNull(documentAnalyses.deletedAt),
        lte(documentAnalyses.deletedAt, thirtyDaysAgo)
      ));

    return result.rowCount || 0;
  }

  // Credit Transactions
  async getCreditTransactions(userId: string): Promise<CreditTransaction[]> {
    return await db
      .select()
      .from(creditTransactions)
      .where(eq(creditTransactions.userId, userId))
      .orderBy(desc(creditTransactions.createdAt));
  }

  async getCreditTransactionByStripeId(stripePaymentIntentId: string): Promise<CreditTransaction | undefined> {
    const [transaction] = await db
      .select()
      .from(creditTransactions)
      .where(eq(creditTransactions.stripePaymentIntentId, stripePaymentIntentId));
    return transaction || undefined;
  }

  async createCreditTransaction(userId: string, type: string, amount: number, description: string, stripePaymentIntentId?: string): Promise<CreditTransaction> {
    const [transaction] = await db
      .insert(creditTransactions)
      .values({
        userId,
        type,
        amount,
        description,
        stripePaymentIntentId
      })
      .returning();
    return transaction;
  }

  // Support Tickets
  async getSupportTickets(userId: string): Promise<SupportTicket[]> {
    return await db
      .select()
      .from(supportTickets)
      .where(eq(supportTickets.userId, userId))
      .orderBy(desc(supportTickets.createdAt));
  }

  async getAllSupportTickets(): Promise<SupportTicket[]> {
    return await db
      .select()
      .from(supportTickets)
      .orderBy(desc(supportTickets.createdAt));
  }

  async getSupportTicket(id: string, userId: string): Promise<SupportTicket | undefined> {
    const [ticket] = await db
      .select()
      .from(supportTickets)
      .where(and(eq(supportTickets.id, id), eq(supportTickets.userId, userId)));
    return ticket || undefined;
  }

  async getSupportTicketById(id: string): Promise<SupportTicket | undefined> {
    const [ticket] = await db
      .select()
      .from(supportTickets)
      .where(eq(supportTickets.id, id));
    return ticket || undefined;
  }

  async createSupportTicket(userId: string, ticketData: InsertSupportTicket): Promise<SupportTicket> {
    const [ticket] = await db
      .insert(supportTickets)
      .values({
        ...ticketData,
        userId,
        status: "open",
      })
      .returning();
    return ticket;
  }

  async updateSupportTicketStatus(id: string, status: string): Promise<SupportTicket> {
    const [ticket] = await db
      .update(supportTickets)
      .set({ status, updatedAt: new Date() })
      .where(eq(supportTickets.id, id))
      .returning();
    if (!ticket) throw new Error("Support ticket not found");
    return ticket;
  }

  // Ticket Messages
  async getTicketMessages(ticketId: string): Promise<TicketMessage[]> {
    return await db
      .select()
      .from(ticketMessages)
      .where(eq(ticketMessages.ticketId, ticketId))
      .orderBy(ticketMessages.createdAt);
  }

  async createTicketMessage(ticketMessage: InsertTicketMessage): Promise<TicketMessage> {
    const [message] = await db
      .insert(ticketMessages)
      .values(ticketMessage)
      .returning();
    return message;
  }

  // Platform Stats methods
  async getPlatformStats(): Promise<PlatformStats | undefined> {
    const [stats] = await db.select().from(platformStats).limit(1);
    return stats || undefined;
  }

  async updatePlatformStats(statsData: InsertPlatformStats): Promise<PlatformStats> {
    const [stats] = await db
      .insert(platformStats)
      .values(statsData)
      .onConflictDoUpdate({
        target: [platformStats.id],
        set: statsData
      })
      .returning();
    return stats;
  }

  async computeAndUpdatePlatformStats(): Promise<PlatformStats> {
    const analytics = await this.getPlatformAnalytics();
    const statsData: InsertPlatformStats = {
      totalUsers: analytics.totalUsers,
      totalAnalyses: analytics.totalAnalyses,
      totalDocuments: 0, // Can compute from document analyses
      averageAccuracy: "0.00"
    };
    return await this.updatePlatformStats(statsData);
  }

  // AI Usage Analytics
  async getAiUsageAnalytics(): Promise<{
    providerUsage: Array<{provider: string, model: string, count: number, totalCredits: number}>;
    analysisTypes: Array<{type: string, count: number}>;
    errorRates: Array<{provider: string, model: string, successRate: number}>;
  }> {
    return {
      providerUsage: [],
      analysisTypes: [],
      errorRates: []
    };
  }

  // Credit Packages
  async getCreditPackages(): Promise<CreditPackage[]> {
    return await db.select().from(creditPackages).orderBy(creditPackages.createdAt);
  }

  async getCreditPackage(packageId: string): Promise<CreditPackage | undefined> {
    const [pkg] = await db.select().from(creditPackages).where(eq(creditPackages.id, packageId));
    return pkg || undefined;
  }

  async createCreditPackage(pkgData: InsertCreditPackage): Promise<CreditPackage> {
    const [pkg] = await db.insert(creditPackages).values(pkgData).returning();
    return pkg;
  }

  async updateCreditPackage(id: string, pkgData: Partial<InsertCreditPackage>): Promise<CreditPackage> {
    const [pkg] = await db.update(creditPackages).set(pkgData).where(eq(creditPackages.id, id)).returning();
    if (!pkg) throw new Error("Credit package not found");
    return pkg;
  }

  async deleteCreditPackage(id: string): Promise<void> {
    await db.delete(creditPackages).where(eq(creditPackages.id, id));
  }

  // SECURITY: Migration functions for upgrading legacy encrypted keys
  
  /**
   * Migrates all system AI provider keys from legacy format to secure GCM format
   * @returns Migration results with counts and errors
   */
  async migrateSystemApiKeys(): Promise<{
    total: number;
    migrated: number;
    alreadySecure: number;
    errors: Array<{id: string, error: string}>;
  }> {
    console.log('🔄 Starting migration of system AI provider keys...');
    
    try {
      const providers = await db.select().from(systemAiProviders);
      const results = {
        total: providers.length,
        migrated: 0,
        alreadySecure: 0,
        errors: [] as Array<{id: string, error: string}>
      };
      
      for (const provider of providers) {
        try {
          if (!provider.apiKey) {
            console.log(`⚠️  Provider ${provider.provider} has no API key, skipping`);
            continue;
          }
          
          // Check if key is in legacy format
          if (isLegacyFormat(provider.apiKey)) {
            console.log(`🔄 Migrating provider ${provider.provider} from legacy format`);
            
            // Migrate the key
            const migratedKey = migrateApiKey(provider.apiKey);
            
            // Update in database
            await db
              .update(systemAiProviders)
              .set({ 
                apiKey: migratedKey,
                updatedAt: new Date()
              })
              .where(eq(systemAiProviders.id, provider.id));
            
            results.migrated++;
            console.log(`✅ Successfully migrated provider ${provider.provider}`);
          } else {
            results.alreadySecure++;
            console.log(`✅ Provider ${provider.provider} already uses secure format`);
          }
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Unknown error';
          results.errors.push({id: provider.id, error: errorMsg});
          console.error(`❌ Failed to migrate provider ${provider.provider}:`, errorMsg);
        }
      }
      
      console.log(`🏁 Migration completed:`);
      console.log(`   Total providers: ${results.total}`);
      console.log(`   Migrated: ${results.migrated}`);
      console.log(`   Already secure: ${results.alreadySecure}`);
      console.log(`   Errors: ${results.errors.length}`);
      
      return results;
    } catch (error) {
      // DEFENSIVE: Handle case where table doesn't exist yet
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      if (errorMsg.includes('relation') && errorMsg.includes('does not exist')) {
        console.log(`✅ Table system_ai_providers doesn't exist yet - skipping migration (this is normal for new installations)`);
        return {
          total: 0,
          migrated: 0,
          alreadySecure: 0,
          errors: []
        };
      }
      
      // Re-throw other errors
      console.error('❌ Failed to access system_ai_providers table:', errorMsg);
      throw error;
    }
  }
  
  /**
   * One-time migration function to upgrade all encrypted data
   * Should be called once during application startup after encryption validation
   */
  async performOneTimeMigration(): Promise<void> {
    try {
      console.log('🔄 Starting one-time security migration...');
      
      // Check if migration was already performed
      const migrationKey = 'encryption_migration_v2_gcm';
      const existingMigration = await this.checkMigrationStatus(migrationKey);
      
      if (existingMigration) {
        console.log('✅ Migration already completed, skipping');
        return;
      }
      
      // Perform migration
      const systemResults = await this.migrateSystemApiKeys();
      
      // Check if any errors occurred
      if (systemResults.errors.length > 0) {
        console.warn(`⚠️  Migration completed with ${systemResults.errors.length} errors`);
        // Log errors but don't fail completely
        systemResults.errors.forEach(error => {
          console.error(`   Error migrating ${error.id}: ${error.error}`);
        });
      }
      
      // Mark migration as completed
      await this.markMigrationCompleted(migrationKey);
      
      console.log('✅ One-time security migration completed successfully');
    } catch (error) {
      console.error('❌ Critical error during security migration:', error);
      throw new Error(`Security migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  /**
   * Check if a specific migration was already performed
   * Uses a simple approach with platformStats or creates a migration tracking mechanism
   */
  private async checkMigrationStatus(migrationKey: string): Promise<boolean> {
    try {
      // Simple check: look for a marker in platformStats or use a file-based approach
      // For now, we'll use a simple file-based approach
      const fs = await import('fs');
      const path = await import('path');
      const migrationFile = path.join('/tmp', `${migrationKey}.completed`);
      
      return fs.existsSync(migrationFile);
    } catch (error) {
      console.warn('Migration status check failed, assuming not migrated:', error);
      return false;
    }
  }
  
  /**
   * Mark a migration as completed
   */
  private async markMigrationCompleted(migrationKey: string): Promise<void> {
    try {
      const fs = await import('fs');
      const path = await import('path');
      const migrationFile = path.join('/tmp', `${migrationKey}.completed`);
      
      const migrationData = {
        migrationKey,
        completedAt: new Date().toISOString(),
        version: 'v2_gcm'
      };
      
      await fs.promises.writeFile(migrationFile, JSON.stringify(migrationData, null, 2));
      console.log(`✅ Migration ${migrationKey} marked as completed`);
    } catch (error) {
      console.warn('Failed to mark migration as completed:', error);
      // Don't throw here as this is not critical
    }
  }

  // Site Configuration methods
  async getSiteConfigs(section?: string): Promise<SiteConfig[]> {
    if (section) {
      return await db.select().from(siteConfig).where(eq(siteConfig.section, section));
    }
    return await db.select().from(siteConfig);
  }

  async getSiteConfig(section: string, key: string): Promise<SiteConfig | undefined> {
    const [config] = await db.select()
      .from(siteConfig)
      .where(and(eq(siteConfig.section, section), eq(siteConfig.key, key)))
      .limit(1);
    return config || undefined;
  }

  async createSiteConfig(configData: InsertSiteConfig): Promise<SiteConfig> {
    const [config] = await db.insert(siteConfig).values(configData).returning();
    return config;
  }

  async updateSiteConfig(id: string, configData: Partial<InsertSiteConfig>): Promise<SiteConfig> {
    const [config] = await db.update(siteConfig)
      .set(configData)
      .where(eq(siteConfig.id, id))
      .returning();
    return config;
  }

  async deleteSiteConfig(id: string): Promise<void> {
    await db.delete(siteConfig).where(eq(siteConfig.id, id));
  }

  // SMTP Configuration methods
  async getSmtpConfig(): Promise<SmtpConfig | undefined> {
    const [config] = await db.select().from(smtpConfig).where(eq(smtpConfig.isActive, true)).limit(1);
    return config || undefined;
  }

  async createSmtpConfig(configData: InsertSmtpConfig): Promise<SmtpConfig> {
    // Encrypt password before storing
    const encryptedConfig = {
      ...configData,
      password: await encryptApiKey(configData.password)
    };
    const [config] = await db.insert(smtpConfig).values(encryptedConfig).returning();
    return config;
  }

  async updateSmtpConfig(id: string, configData: Partial<InsertSmtpConfig>): Promise<SmtpConfig> {
    const updatedData: Partial<InsertSmtpConfig> = { ...configData };

    if (configData.password === null) {
      updatedData.password = null;
    } else if (configData.password !== undefined) {
      const trimmed = configData.password.trim();
      if (trimmed) {
        updatedData.password = await encryptApiKey(trimmed);
      } else {
        delete updatedData.password;
      }
    }

    const [config] = await db.update(smtpConfig)
      .set(updatedData)
      .where(eq(smtpConfig.id, id))
      .returning();
    return config;
  }

  async deleteSmtpConfig(id: string): Promise<void> {
    await db.delete(smtpConfig).where(eq(smtpConfig.id, id));
  }

  // Stripe Configuration methods
  async getStripeConfig(): Promise<StripeConfig | undefined> {
    const [config] = await db.select().from(stripeConfig).limit(1);
    return config || undefined;
  }

  async createStripeConfig(configData: InsertStripeConfig): Promise<StripeConfig> {
    // Encrypt sensitive keys before storing
    const encryptedConfig = {
      ...configData,
      testSecretKey: configData.testSecretKey ? await encryptApiKey(configData.testSecretKey) : null,
      liveSecretKey: configData.liveSecretKey ? await encryptApiKey(configData.liveSecretKey) : null,
      webhookSecret: configData.webhookSecret ? await encryptApiKey(configData.webhookSecret) : null,
    };
    const [config] = await db.insert(stripeConfig).values(encryptedConfig).returning();
    return config;
  }

  async updateStripeConfig(id: string, configData: Partial<InsertStripeConfig>): Promise<StripeConfig> {
    const updatedData: Partial<InsertStripeConfig> = { ...configData };

    if (configData.testSecretKey === null) {
      updatedData.testSecretKey = null;
    } else if (configData.testSecretKey !== undefined) {
      const trimmed = configData.testSecretKey.trim();
      if (trimmed) {
        updatedData.testSecretKey = await encryptApiKey(trimmed);
      } else {
        delete updatedData.testSecretKey;
      }
    }

    if (configData.liveSecretKey === null) {
      updatedData.liveSecretKey = null;
    } else if (configData.liveSecretKey !== undefined) {
      const trimmed = configData.liveSecretKey.trim();
      if (trimmed) {
        updatedData.liveSecretKey = await encryptApiKey(trimmed);
      } else {
        delete updatedData.liveSecretKey;
      }
    }

    if (configData.webhookSecret === null) {
      updatedData.webhookSecret = null;
    } else if (configData.webhookSecret !== undefined) {
      const trimmed = configData.webhookSecret.trim();
      if (trimmed) {
        updatedData.webhookSecret = await encryptApiKey(trimmed);
      } else {
        delete updatedData.webhookSecret;
      }
    }

    const [config] = await db.update(stripeConfig)
      .set(updatedData)
      .where(eq(stripeConfig.id, id))
      .returning();
    return config;
  }

  async deleteStripeConfig(id: string): Promise<void> {
    await db.delete(stripeConfig).where(eq(stripeConfig.id, id));
  }

  // Admin Notifications methods
  async getAdminNotifications(targetAudience?: string): Promise<AdminNotification[]> {
    let query = db.select().from(adminNotifications);
    
    if (targetAudience) {
      query = query.where(eq(adminNotifications.targetAudience, targetAudience));
    }
    
    return await query.orderBy(desc(adminNotifications.priority), desc(adminNotifications.createdAt));
  }

  async getAdminNotification(id: string): Promise<AdminNotification | undefined> {
    const [notification] = await db.select().from(adminNotifications).where(eq(adminNotifications.id, id)).limit(1);
    return notification || undefined;
  }

  async createAdminNotification(notificationData: InsertAdminNotification): Promise<AdminNotification> {
    const [notification] = await db.insert(adminNotifications).values(notificationData).returning();
    return notification;
  }

  async updateAdminNotification(id: string, notificationData: Partial<InsertAdminNotification>): Promise<AdminNotification> {
    const [notification] = await db.update(adminNotifications)
      .set(notificationData)
      .where(eq(adminNotifications.id, id))
      .returning();
    return notification;
  }

  async deleteAdminNotification(id: string): Promise<void> {
    await db.delete(adminNotifications).where(eq(adminNotifications.id, id));
  }

  // User Notification Views methods
  async getUserNotificationViews(userId: string): Promise<UserNotificationView[]> {
    return await db.select().from(userNotificationViews)
      .where(eq(userNotificationViews.userId, userId))
      .orderBy(desc(userNotificationViews.viewedAt));
  }

  async createUserNotificationView(viewData: InsertUserNotificationView): Promise<UserNotificationView> {
    const [view] = await db.insert(userNotificationViews).values(viewData).returning();
    return view;
  }

  async getUnreadNotificationsForUser(userId: string): Promise<AdminNotification[]> {
    // Get notifications that the user hasn't viewed yet
    const viewedNotificationIds = await db.select({ notificationId: userNotificationViews.notificationId })
      .from(userNotificationViews)
      .where(eq(userNotificationViews.userId, userId));
    
    const viewedIds = viewedNotificationIds.map(v => v.notificationId);
    
    // Get active notifications that weren't viewed by this user
    let query = db.select()
      .from(adminNotifications)
      .where(
        and(
          eq(adminNotifications.isActive, true),
          // Only get non-expired notifications
          sql`(${adminNotifications.expiresAt} IS NULL OR ${adminNotifications.expiresAt} > NOW())`
        )
      );
    
    // Filter out viewed notifications if there are any
    if (viewedIds.length > 0) {
      query = query.where(sql`${adminNotifications.id} NOT IN (${viewedIds.map(id => `'${id}'`).join(',')})`);
    }
    
    return await query.orderBy(desc(adminNotifications.priority), desc(adminNotifications.createdAt));
  }

  // Payment processing (critical method)
  async processPaymentTransaction(params: {
    userId: string;
    stripePaymentIntentId: string;
    amount: number;
    credits: number;
    packageId: string;
    stripeMode: 'test' | 'live';
  }): Promise<void> {
    const { userId, stripePaymentIntentId, amount, credits, packageId, stripeMode } = params;
    
    // Use database transaction for atomicity
    await db.transaction(async (tx) => {
      // Check for existing transaction (idempotency)
      const existingTransaction = await tx
        .select()
        .from(creditTransactions)
        .where(eq(creditTransactions.stripePaymentIntentId, stripePaymentIntentId))
        .limit(1);
      
      if (existingTransaction.length > 0) {
        return; // Already processed
      }
      
      // Get user
      const [user] = await tx.select().from(users).where(eq(users.id, userId)).limit(1);
      if (!user) {
        throw new Error('User not found');
      }
      
      // Update user credits
      const newCredits = user.credits + credits;
      await tx.update(users)
        .set({ credits: newCredits })
        .where(eq(users.id, userId));
      
      // Create transaction record
      await tx.insert(creditTransactions).values({
        userId,
        amount: amount.toString(),
        credits,
        type: 'purchase',
        description: `Compra de ${credits} créditos`,
        stripePaymentIntentId,
        stripeMode,
        packageId,
      });
    });
  }

  // AI Provider Configs (aliases to existing methods)
  async getAiProviderConfigs(userId: string): Promise<AiProvider[]> {
    return this.getAiProviders(userId);
  }

  async getAiProviderConfig(id: string): Promise<AiProvider | undefined> {
    const [provider] = await db.select().from(aiProviders).where(eq(aiProviders.id, id)).limit(1);
    return provider || undefined;
  }

  async createAiProviderConfig(userId: string, config: InsertAiProvider): Promise<AiProvider> {
    return this.createAiProvider(userId, config);
  }

  async updateAiProviderConfig(id: string, config: Partial<InsertAiProvider>): Promise<AiProvider> {
    return this.updateAiProvider(id, config);
  }

  async deleteAiProviderConfig(id: string): Promise<void> {
    return this.deleteAiProvider(id);
  }

  // Document Templates (basic implementations)
  async getDocumentTemplates(): Promise<DocumentTemplate[]> {
    return await db.select().from(documentTemplates).orderBy(documentTemplates.createdAt);
  }

  async getDocumentTemplatesByCategory(category: string): Promise<DocumentTemplate[]> {
    return await db.select().from(documentTemplates)
      .where(eq(documentTemplates.category, category))
      .orderBy(documentTemplates.createdAt);
  }

  async getDocumentTemplateById(id: string): Promise<DocumentTemplate | undefined> {
    const [template] = await db.select().from(documentTemplates).where(eq(documentTemplates.id, id)).limit(1);
    return template || undefined;
  }

  async createDocumentTemplate(templateData: InsertDocumentTemplate): Promise<DocumentTemplate> {
    const [template] = await db.insert(documentTemplates).values(templateData).returning();
    return template;
  }

  async updateDocumentTemplate(id: string, templateData: Partial<InsertDocumentTemplate>): Promise<DocumentTemplate> {
    const [template] = await db.update(documentTemplates)
      .set(templateData)
      .where(eq(documentTemplates.id, id))
      .returning();
    return template;
  }

  async deleteDocumentTemplate(id: string): Promise<void> {
    await db.delete(documentTemplates).where(eq(documentTemplates.id, id));
  }

  async getTemplateWithPrompts(templateId: string, aiProvider?: string): Promise<any> {
    // Basic implementation - can be enhanced later
    const template = await this.getDocumentTemplateById(templateId);
    if (!template) return null;

    const prompts = await this.getTemplatePrompts(templateId);
    const rules = await this.getTemplateAnalysisRules(templateId);
    
    return {
      template,
      prompts: aiProvider ? prompts.filter(p => p.aiProvider === aiProvider || p.aiProvider === 'all') : prompts,
      analysisRules: rules,
      requiredClauses: [],
      optionalClauses: []
    };
  }

  // Legal Clauses
  async getLegalClauses(): Promise<LegalClause[]> {
    return await db.select().from(legalClauses).orderBy(legalClauses.createdAt);
  }

  async getLegalClausesByCategory(category: string): Promise<LegalClause[]> {
    return await db.select().from(legalClauses)
      .where(eq(legalClauses.category, category))
      .orderBy(legalClauses.createdAt);
  }

  async getLegalClausesByTemplate(templateId: string): Promise<LegalClause[]> {
    return await db.select().from(legalClauses)
      .where(eq(legalClauses.templateId, templateId))
      .orderBy(legalClauses.sortOrder);
  }

  async createLegalClause(clauseData: InsertLegalClause): Promise<LegalClause> {
    const [clause] = await db.insert(legalClauses).values(clauseData).returning();
    return clause;
  }

  async updateLegalClause(id: string, clauseData: Partial<InsertLegalClause>): Promise<LegalClause> {
    const [clause] = await db.update(legalClauses)
      .set(clauseData)
      .where(eq(legalClauses.id, id))
      .returning();
    return clause;
  }

  async deleteLegalClause(id: string): Promise<void> {
    await db.delete(legalClauses).where(eq(legalClauses.id, id));
  }

  // Template Prompts
  async getTemplatePrompts(templateId: string): Promise<TemplatePrompt[]> {
    return await db.select().from(templatePrompts)
      .where(eq(templatePrompts.templateId, templateId))
      .orderBy(templatePrompts.priority);
  }

  async createTemplatePrompt(promptData: InsertTemplatePrompt): Promise<TemplatePrompt> {
    const [prompt] = await db.insert(templatePrompts).values(promptData).returning();
    return prompt;
  }

  async updateTemplatePrompt(id: string, promptData: Partial<InsertTemplatePrompt>): Promise<TemplatePrompt> {
    const [prompt] = await db.update(templatePrompts)
      .set(promptData)
      .where(eq(templatePrompts.id, id))
      .returning();
    return prompt;
  }

  async deleteTemplatePrompt(id: string): Promise<void> {
    await db.delete(templatePrompts).where(eq(templatePrompts.id, id));
  }

  // Template Analysis Rules
  async getTemplateAnalysisRules(templateId: string): Promise<TemplateAnalysisRule[]> {
    return await db.select().from(templateAnalysisRules)
      .where(eq(templateAnalysisRules.templateId, templateId))
      .orderBy(templateAnalysisRules.createdAt);
  }

  async createTemplateAnalysisRule(ruleData: InsertTemplateAnalysisRule): Promise<TemplateAnalysisRule> {
    const [rule] = await db.insert(templateAnalysisRules).values(ruleData).returning();
    return rule;
  }

  async updateTemplateAnalysisRule(id: string, ruleData: Partial<InsertTemplateAnalysisRule>): Promise<TemplateAnalysisRule> {
    const [rule] = await db.update(templateAnalysisRules)
      .set(ruleData)
      .where(eq(templateAnalysisRules.id, id))
      .returning();
    return rule;
  }

  async deleteTemplateAnalysisRule(id: string): Promise<void> {
    await db.delete(templateAnalysisRules).where(eq(templateAnalysisRules.id, id));
  }

  // Batch Jobs
  async getBatchJobs(userId: string): Promise<BatchJob[]> {
    return await db.select().from(batchJobs)
      .where(eq(batchJobs.userId, userId))
      .orderBy(desc(batchJobs.createdAt));
  }

  async getAllBatchJobs(): Promise<BatchJob[]> {
    return await db.select().from(batchJobs).orderBy(desc(batchJobs.createdAt));
  }

  async getBatchJob(id: string, userId?: string): Promise<BatchJob | undefined> {
    let query = db.select().from(batchJobs).where(eq(batchJobs.id, id));
    
    if (userId) {
      query = query.where(eq(batchJobs.userId, userId));
    }
    
    const [job] = await query.limit(1);
    return job || undefined;
  }

  async createBatchJob(jobData: InsertBatchJob): Promise<BatchJob> {
    const [job] = await db.insert(batchJobs).values(jobData).returning();
    return job;
  }

  async updateBatchJobStatus(id: string, status: string): Promise<void> {
    await db.update(batchJobs)
      .set({ status })
      .where(eq(batchJobs.id, id));
  }

  async deleteBatchJob(id: string): Promise<void> {
    await db.delete(batchJobs).where(eq(batchJobs.id, id));
  }

  async getBatchJobStatistics(userId: string): Promise<any> {
    const jobs = await this.getBatchJobs(userId);
    
    return {
      total: jobs.length,
      pending: jobs.filter(j => j.status === 'pending').length,
      processing: jobs.filter(j => j.status === 'processing').length,
      completed: jobs.filter(j => j.status === 'completed').length,
      failed: jobs.filter(j => j.status === 'failed').length,
    };
  }

  // Batch Documents
  async getBatchDocuments(batchJobId: string): Promise<BatchDocument[]> {
    return await db.select().from(batchDocuments)
      .where(eq(batchDocuments.batchJobId, batchJobId))
      .orderBy(batchDocuments.sortOrder);
  }

  async createBatchDocument(docData: InsertBatchDocument): Promise<BatchDocument> {
    const [doc] = await db.insert(batchDocuments).values(docData).returning();
    return doc;
  }

  // Queue Jobs
  async getQueueJobs(): Promise<QueueJob[]> {
    return await db.select().from(queueJobs).orderBy(desc(queueJobs.priority), queueJobs.scheduledFor);
  }

  async createQueueJob(jobData: InsertQueueJob): Promise<QueueJob> {
    const [job] = await db.insert(queueJobs).values(jobData).returning();
    return job;
  }

  async retryFailedQueueJob(id: string): Promise<void> {
    await db.update(queueJobs)
      .set({ 
        status: 'pending',
        attempts: 0,
        scheduledFor: new Date()
      })
      .where(eq(queueJobs.id, id));
  }

  async deleteQueueJob(id: string): Promise<void> {
    await db.delete(queueJobs).where(eq(queueJobs.id, id));
  }
}

export const storage = new DatabaseStorage();


