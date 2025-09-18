import { type User, type InsertUser, type LoginUser, type AiProvider, type InsertAiProvider, type SystemAiProvider, type InsertSystemAiProvider, type DocumentAnalysis, type InsertDocumentAnalysis, type CreditTransaction, type SupportTicket, type InsertSupportTicket, type TicketMessage, type InsertTicketMessage, type AiProviderConfig, type InsertAiProviderConfig, type CreditPackage, type InsertCreditPackage, type PlatformStats, type InsertPlatformStats, type DocumentTemplate, type InsertDocumentTemplate, type LegalClause, type InsertLegalClause, type TemplatePrompt, type InsertTemplatePrompt, type TemplateAnalysisRule, type InsertTemplateAnalysisRule, type BatchJob, type InsertBatchJob, type BatchDocument, type InsertBatchDocument, type QueueJob, type InsertQueueJob, type BatchDocumentMetadata } from "@shared/schema";
import { encryptApiKey, decryptApiKey, migrateApiKey, isLegacyFormat, batchMigrateApiKeys } from "./lib/encryption";
import type { Express } from "express";
import { db } from "./db";
import { users, aiProviders, systemAiProviders, documentAnalyses, creditTransactions, supportTickets, ticketMessages, aiProviderConfigs, creditPackages, platformStats, documentTemplates, legalClauses, templatePrompts, templateAnalysisRules, batchJobs, batchDocuments, queueJobs } from "@shared/schema";
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
      .values({
        id: crypto.randomUUID(),
        ...insertUser
      })
      .returning();
    return user;
  }

  async ensureUserBySupabase(supabaseId: string, email: string, supabaseUserData: any): Promise<User> {
    const [userBySupabaseId] = await db
      .select()
      .from(users)
      .where(eq(users.supabaseId, supabaseId))
      .limit(1);
    
    if (userBySupabaseId) {
      return userBySupabaseId;
    }

    const [userByEmail] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    
    if (userByEmail) {
      if (userByEmail.supabaseId !== supabaseId) {
        const [updatedUser] = await db
          .update(users)
          .set({ supabaseId })
          .where(eq(users.id, userByEmail.id))
          .returning();
        return updatedUser;
      }
      return userByEmail;
    }

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
      totalCreditsUsed: analytics.totalCreditsUsed,
      totalCreditsPurchased: analytics.totalCreditsPurchased,
      totalRevenue: analytics.totalRevenue,
      lastUpdated: new Date()
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
}

export const storage = new DatabaseStorage();