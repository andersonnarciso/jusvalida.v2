import { type User, type InsertUser, type LoginUser, type AiProvider, type InsertAiProvider, type DocumentAnalysis, type InsertDocumentAnalysis, type CreditTransaction, type SupportTicket, type InsertSupportTicket, type TicketMessage, type InsertTicketMessage, type AiProviderConfig, type InsertAiProviderConfig, type CreditPackage, type InsertCreditPackage, type PlatformStats, type InsertPlatformStats, type DocumentTemplate, type InsertDocumentTemplate, type LegalClause, type InsertLegalClause, type TemplatePrompt, type InsertTemplatePrompt, type TemplateAnalysisRule, type InsertTemplateAnalysisRule } from "@shared/schema";
import { db } from "./db";
import { users, aiProviders, documentAnalyses, creditTransactions, supportTickets, ticketMessages, aiProviderConfigs, creditPackages, platformStats, documentTemplates, legalClauses, templatePrompts, templateAnalysisRules } from "@shared/schema";
import { eq, desc, and, limit as drizzleLimit, count, sum, gte, sql } from "drizzle-orm";

export interface IStorage {
  // User management
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUsersByRole(role: string): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUserCredits(id: string, credits: number): Promise<User>;
  updateUserRole(id: string, role: string): Promise<User>;
  updateStripeCustomerId(id: string, customerId: string): Promise<User>;

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
  getAiUsageAnalytics(): Promise<{
    providerUsage: Array<{provider: string, model: string, count: number, totalCredits: number}>;
    analysisTypes: Array<{type: string, count: number}>;
    errorRates: Array<{provider: string, model: string, successRate: number}>;
  }>;

  // AI Provider management
  getAiProviders(userId: string): Promise<AiProvider[]>;
  getAiProvider(userId: string, provider: string): Promise<AiProvider | undefined>;
  createAiProvider(userId: string, provider: InsertAiProvider): Promise<AiProvider>;
  updateAiProvider(id: string, provider: Partial<InsertAiProvider>): Promise<AiProvider>;
  deleteAiProvider(id: string): Promise<void>;

  // Document Analysis
  getDocumentAnalyses(userId: string, limit?: number): Promise<DocumentAnalysis[]>;
  getDocumentAnalysis(id: string, userId: string): Promise<DocumentAnalysis | undefined>;
  createDocumentAnalysis(userId: string, analysis: InsertDocumentAnalysis): Promise<DocumentAnalysis>;
  updateDocumentAnalysisResult(id: string, result: any, status: string): Promise<DocumentAnalysis>;

  // Credit Transactions
  getCreditTransactions(userId: string): Promise<CreditTransaction[]>;
  getCreditTransactionByStripeId(stripePaymentIntentId: string): Promise<CreditTransaction | undefined>;
  createCreditTransaction(userId: string, type: string, amount: number, description: string, stripePaymentIntentId?: string): Promise<CreditTransaction>;
  
  // ATOMIC: Process payment transaction with credit update in single DB transaction
  processPaymentTransaction(userId: string, transactionData: {
    type: string;
    amount: number;
    description: string;
    stripePaymentIntentId: string;
    newCreditBalance: number;
  }): Promise<{ user: User; transaction: CreditTransaction }>;

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

  // AI Provider Configs (Global)
  getAiProviderConfigs(): Promise<AiProviderConfig[]>;
  getAiProviderConfig(providerId: string): Promise<AiProviderConfig | undefined>;
  createAiProviderConfig(config: InsertAiProviderConfig): Promise<AiProviderConfig>;
  updateAiProviderConfig(id: string, config: Partial<InsertAiProviderConfig>): Promise<AiProviderConfig>;
  deleteAiProviderConfig(id: string): Promise<void>;

  // Credit Packages
  getCreditPackages(): Promise<CreditPackage[]>;
  getCreditPackage(packageId: string): Promise<CreditPackage | undefined>;
  createCreditPackage(pkg: InsertCreditPackage): Promise<CreditPackage>;
  updateCreditPackage(id: string, pkg: Partial<InsertCreditPackage>): Promise<CreditPackage>;
  deleteCreditPackage(id: string): Promise<void>;

  // Platform Stats
  getPlatformStats(): Promise<PlatformStats | undefined>;
  updatePlatformStats(stats: InsertPlatformStats): Promise<PlatformStats>;
  computeAndUpdatePlatformStats(): Promise<PlatformStats>;

  // Document Templates
  getDocumentTemplates(): Promise<DocumentTemplate[]>;
  getDocumentTemplate(templateId: string): Promise<DocumentTemplate | undefined>;
  getDocumentTemplateById(id: string): Promise<DocumentTemplate | undefined>;
  getDocumentTemplatesByCategory(category: string): Promise<DocumentTemplate[]>;
  createDocumentTemplate(template: InsertDocumentTemplate): Promise<DocumentTemplate>;
  updateDocumentTemplate(id: string, template: Partial<InsertDocumentTemplate>): Promise<DocumentTemplate>;
  deleteDocumentTemplate(id: string): Promise<void>;

  // Legal Clauses
  getLegalClauses(): Promise<LegalClause[]>;
  getLegalClause(clauseId: string): Promise<LegalClause | undefined>;
  getLegalClauseById(id: string): Promise<LegalClause | undefined>;
  getLegalClausesByCategory(category: string): Promise<LegalClause[]>;
  getLegalClausesByTemplate(templateId: string): Promise<LegalClause[]>;
  createLegalClause(clause: InsertLegalClause): Promise<LegalClause>;
  updateLegalClause(id: string, clause: Partial<InsertLegalClause>): Promise<LegalClause>;
  deleteLegalClause(id: string): Promise<void>;

  // Template Prompts
  getTemplatePrompts(templateId: string): Promise<TemplatePrompt[]>;
  getTemplatePrompt(id: string): Promise<TemplatePrompt | undefined>;
  getTemplatePromptsByProvider(templateId: string, aiProvider: string): Promise<TemplatePrompt[]>;
  createTemplatePrompt(prompt: InsertTemplatePrompt): Promise<TemplatePrompt>;
  updateTemplatePrompt(id: string, prompt: Partial<InsertTemplatePrompt>): Promise<TemplatePrompt>;
  deleteTemplatePrompt(id: string): Promise<void>;

  // Template Analysis Rules
  getTemplateAnalysisRules(templateId: string): Promise<TemplateAnalysisRule[]>;
  getTemplateAnalysisRule(id: string): Promise<TemplateAnalysisRule | undefined>;
  getTemplateAnalysisRulesByType(templateId: string, ruleType: string): Promise<TemplateAnalysisRule[]>;
  createTemplateAnalysisRule(rule: InsertTemplateAnalysisRule): Promise<TemplateAnalysisRule>;
  updateTemplateAnalysisRule(id: string, rule: Partial<InsertTemplateAnalysisRule>): Promise<TemplateAnalysisRule>;
  deleteTemplateAnalysisRule(id: string): Promise<void>;

  // Enhanced Analysis Methods
  getTemplateWithPrompts(templateId: string, aiProvider?: string): Promise<{
    template: DocumentTemplate;
    prompts: TemplatePrompt[];
    analysisRules: TemplateAnalysisRule[];
    requiredClauses: LegalClause[];
    optionalClauses: LegalClause[];
  } | undefined>;
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
    const usersByRole = await db.select().from(users).where(eq(users.role, role));
    return usersByRole;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({
        ...insertUser,
        credits: insertUser.credits || 10, // Use provided credits or default to 10
      })
      .returning();
    return user;
  }

  async updateUserCredits(id: string, credits: number): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ credits, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    if (!user) throw new Error("User not found");
    return user;
  }

  async updateUserRole(id: string, role: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ role: role as "user" | "admin" | "support", updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    if (!user) throw new Error("User not found");
    return user;
  }

  async updateStripeCustomerId(id: string, customerId: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ stripeCustomerId: customerId, updatedAt: new Date() })
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
      .where(eq(aiProviders.userId, userId));
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

  // Document Analysis
  async getDocumentAnalyses(userId: string, limit?: number): Promise<DocumentAnalysis[]> {
    let query = db
      .select()
      .from(documentAnalyses)
      .where(eq(documentAnalyses.userId, userId))
      .orderBy(desc(documentAnalyses.createdAt));
    
    if (limit) {
      query = query.limit(limit);
    }
    
    return await query;
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
        stripePaymentIntentId: stripePaymentIntentId || null,
      })
      .returning();
    return transaction;
  }

  // ATOMIC: Process payment transaction with credit update in single DB transaction
  async processPaymentTransaction(userId: string, transactionData: {
    type: string;
    amount: number;
    description: string;
    stripePaymentIntentId: string;
    newCreditBalance: number;
  }): Promise<{ user: User; transaction: CreditTransaction }> {
    // Use database transaction to ensure atomicity and prevent race conditions
    return await db.transaction(async (tx) => {
      // First, update user credits
      const [updatedUser] = await tx
        .update(users)
        .set({ 
          credits: transactionData.newCreditBalance,
          updatedAt: sql`CURRENT_TIMESTAMP`
        })
        .where(eq(users.id, userId))
        .returning();
      
      if (!updatedUser) {
        throw new Error(`User not found: ${userId}`);
      }
      
      // Then, create the credit transaction with unique constraint protection
      const [transaction] = await tx
        .insert(creditTransactions)
        .values({
          userId,
          type: transactionData.type,
          amount: transactionData.amount,
          description: transactionData.description,
          stripePaymentIntentId: transactionData.stripePaymentIntentId,
        })
        .returning();
      
      return { user: updatedUser, transaction };
    });
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

  // Admin-specific user management
  async getAllUsers(page: number = 1, limit: number = 20): Promise<{users: User[], total: number}> {
    const offset = (page - 1) * limit;
    
    const [usersResult, totalResult] = await Promise.all([
      db.select({
        id: users.id,
        username: users.username,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        role: users.role,
        credits: users.credits,
        stripeCustomerId: users.stripeCustomerId,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      }).from(users).orderBy(desc(users.createdAt)).limit(limit).offset(offset),
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
    // Get basic counts
    const [userCount, analysisCount] = await Promise.all([
      db.select({ count: count() }).from(users),
      db.select({ count: count() }).from(documentAnalyses)
    ]);

    // Get credit statistics
    const creditStats = await db.select({
      totalUsed: sum(creditTransactions.amount),
      type: creditTransactions.type
    }).from(creditTransactions).groupBy(creditTransactions.type);

    let totalCreditsUsed = 0;
    let totalCreditsPurchased = 0;
    let totalRevenue = 0;

    creditStats.forEach(stat => {
      if (stat.type === 'usage') {
        totalCreditsUsed = Math.abs(Number(stat.totalUsed) || 0);
      } else if (stat.type === 'purchase') {
        totalCreditsPurchased = Number(stat.totalUsed) || 0;
        // Assuming each credit costs R$0.10 (adjust as needed)
        totalRevenue = totalCreditsPurchased * 0.10;
      }
    });

    // Get user growth over last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const userGrowth = await db.select({
      date: sql<string>`DATE(${users.createdAt})`,
      count: count()
    }).from(users)
      .where(gte(users.createdAt, thirtyDaysAgo))
      .groupBy(sql`DATE(${users.createdAt})`)
      .orderBy(sql`DATE(${users.createdAt})`);

    // Get analysis growth over last 30 days
    const analysisGrowth = await db.select({
      date: sql<string>`DATE(${documentAnalyses.createdAt})`,
      count: count()
    }).from(documentAnalyses)
      .where(gte(documentAnalyses.createdAt, thirtyDaysAgo))
      .groupBy(sql`DATE(${documentAnalyses.createdAt})`)
      .orderBy(sql`DATE(${documentAnalyses.createdAt})`);

    // Get support ticket stats
    const ticketStats = await db.select({
      status: supportTickets.status,
      count: count()
    }).from(supportTickets).groupBy(supportTickets.status);

    const supportTicketsStats = {
      open: 0,
      pending: 0,
      resolved: 0,
      closed: 0
    };

    ticketStats.forEach(stat => {
      if (stat.status in supportTicketsStats) {
        supportTicketsStats[stat.status as keyof typeof supportTicketsStats] = Number(stat.count);
      }
    });

    return {
      totalUsers: userCount[0].count,
      totalAnalyses: analysisCount[0].count,
      totalCreditsUsed,
      totalCreditsPurchased,
      totalRevenue,
      userGrowth: userGrowth.map(g => ({ date: g.date, count: Number(g.count) })),
      analysisGrowth: analysisGrowth.map(g => ({ date: g.date, count: Number(g.count) })),
      supportTicketsStats
    };
  }

  async getAiUsageAnalytics(): Promise<{
    providerUsage: Array<{provider: string, model: string, count: number, totalCredits: number}>;
    analysisTypes: Array<{type: string, count: number}>;
    errorRates: Array<{provider: string, model: string, successRate: number}>;
  }> {
    // Get provider usage statistics
    const providerUsage = await db.select({
      provider: documentAnalyses.aiProvider,
      model: documentAnalyses.aiModel,
      count: count(),
      totalCredits: sum(documentAnalyses.creditsUsed)
    }).from(documentAnalyses)
      .groupBy(documentAnalyses.aiProvider, documentAnalyses.aiModel)
      .orderBy(desc(count()));

    // Get analysis types statistics
    const analysisTypes = await db.select({
      type: documentAnalyses.analysisType,
      count: count()
    }).from(documentAnalyses)
      .groupBy(documentAnalyses.analysisType)
      .orderBy(desc(count()));

    // Get error rates (success rates)
    const errorRates = await db.select({
      provider: documentAnalyses.aiProvider,
      model: documentAnalyses.aiModel,
      total: count(),
      successful: sum(sql<number>`CASE WHEN ${documentAnalyses.status} = 'completed' THEN 1 ELSE 0 END`)
    }).from(documentAnalyses)
      .groupBy(documentAnalyses.aiProvider, documentAnalyses.aiModel);

    return {
      providerUsage: providerUsage.map(p => ({
        provider: p.provider,
        model: p.model,
        count: Number(p.count),
        totalCredits: Number(p.totalCredits) || 0
      })),
      analysisTypes: analysisTypes.map(a => ({
        type: a.type,
        count: Number(a.count)
      })),
      errorRates: errorRates.map(e => ({
        provider: e.provider,
        model: e.model,
        successRate: Number(e.successful) / Number(e.total) * 100
      }))
    };
  }

  // AI Provider Configs (Global)
  async getAiProviderConfigs(): Promise<AiProviderConfig[]> {
    return await db
      .select()
      .from(aiProviderConfigs)
      .where(eq(aiProviderConfigs.isActive, true))
      .orderBy(aiProviderConfigs.sortOrder, aiProviderConfigs.createdAt);
  }

  async getAiProviderConfig(providerId: string): Promise<AiProviderConfig | undefined> {
    const [config] = await db
      .select()
      .from(aiProviderConfigs)
      .where(eq(aiProviderConfigs.providerId, providerId));
    return config || undefined;
  }

  async createAiProviderConfig(config: InsertAiProviderConfig): Promise<AiProviderConfig> {
    const [result] = await db
      .insert(aiProviderConfigs)
      .values(config)
      .returning();
    return result;
  }

  async updateAiProviderConfig(id: string, config: Partial<InsertAiProviderConfig>): Promise<AiProviderConfig> {
    const [result] = await db
      .update(aiProviderConfigs)
      .set({ ...config, updatedAt: new Date() })
      .where(eq(aiProviderConfigs.id, id))
      .returning();
    if (!result) throw new Error("AI Provider Config not found");
    return result;
  }

  async deleteAiProviderConfig(id: string): Promise<void> {
    await db.delete(aiProviderConfigs).where(eq(aiProviderConfigs.id, id));
  }

  // Credit Packages
  async getCreditPackages(): Promise<CreditPackage[]> {
    return await db
      .select()
      .from(creditPackages)
      .where(eq(creditPackages.isActive, true))
      .orderBy(creditPackages.sortOrder, creditPackages.createdAt);
  }

  async getCreditPackage(packageId: string): Promise<CreditPackage | undefined> {
    const [pkg] = await db
      .select()
      .from(creditPackages)
      .where(eq(creditPackages.packageId, packageId));
    return pkg || undefined;
  }

  async createCreditPackage(pkg: InsertCreditPackage): Promise<CreditPackage> {
    const [result] = await db
      .insert(creditPackages)
      .values(pkg)
      .returning();
    return result;
  }

  async updateCreditPackage(id: string, pkg: Partial<InsertCreditPackage>): Promise<CreditPackage> {
    const [result] = await db
      .update(creditPackages)
      .set({ ...pkg, updatedAt: new Date() })
      .where(eq(creditPackages.id, id))
      .returning();
    if (!result) throw new Error("Credit Package not found");
    return result;
  }

  async deleteCreditPackage(id: string): Promise<void> {
    await db.delete(creditPackages).where(eq(creditPackages.id, id));
  }

  // Platform Stats
  async getPlatformStats(): Promise<PlatformStats | undefined> {
    const [stats] = await db
      .select()
      .from(platformStats)
      .orderBy(desc(platformStats.lastUpdated))
      .limit(1);
    return stats || undefined;
  }

  async updatePlatformStats(stats: InsertPlatformStats): Promise<PlatformStats> {
    // First, try to get existing stats
    const existingStats = await this.getPlatformStats();
    
    if (existingStats) {
      // Update existing record
      const [result] = await db
        .update(platformStats)
        .set({ ...stats, lastUpdated: new Date() })
        .where(eq(platformStats.id, existingStats.id))
        .returning();
      return result;
    } else {
      // Create new record
      const [result] = await db
        .insert(platformStats)
        .values({ ...stats, lastUpdated: new Date() })
        .returning();
      return result;
    }
  }

  async computeAndUpdatePlatformStats(): Promise<PlatformStats> {
    // Compute real statistics
    const [userCount, analysisCount] = await Promise.all([
      db.select({ count: count() }).from(users),
      db.select({ count: count() }).from(documentAnalyses)
    ]);

    // Compute average accuracy (assuming 98% as default since we don't track accuracy yet)
    const averageAccuracy = 98.0;

    const stats: InsertPlatformStats = {
      totalDocuments: analysisCount[0].count,
      totalUsers: userCount[0].count, 
      totalAnalyses: analysisCount[0].count,
      averageAccuracy: averageAccuracy.toString()
    };

    return await this.updatePlatformStats(stats);
  }

  // Document Templates
  async getDocumentTemplates(): Promise<DocumentTemplate[]> {
    return await db
      .select()
      .from(documentTemplates)
      .where(eq(documentTemplates.isActive, true))
      .orderBy(documentTemplates.sortOrder, documentTemplates.createdAt);
  }

  async getDocumentTemplate(templateId: string): Promise<DocumentTemplate | undefined> {
    const [template] = await db
      .select()
      .from(documentTemplates)
      .where(eq(documentTemplates.templateId, templateId));
    return template || undefined;
  }

  async getDocumentTemplateById(id: string): Promise<DocumentTemplate | undefined> {
    const [template] = await db
      .select()
      .from(documentTemplates)
      .where(eq(documentTemplates.id, id));
    return template || undefined;
  }

  async getDocumentTemplatesByCategory(category: string): Promise<DocumentTemplate[]> {
    return await db
      .select()
      .from(documentTemplates)
      .where(and(eq(documentTemplates.category, category), eq(documentTemplates.isActive, true)))
      .orderBy(documentTemplates.sortOrder, documentTemplates.createdAt);
  }

  async createDocumentTemplate(template: InsertDocumentTemplate): Promise<DocumentTemplate> {
    const [result] = await db
      .insert(documentTemplates)
      .values(template)
      .returning();
    return result;
  }

  async updateDocumentTemplate(id: string, template: Partial<InsertDocumentTemplate>): Promise<DocumentTemplate> {
    const [result] = await db
      .update(documentTemplates)
      .set({ ...template, updatedAt: new Date() })
      .where(eq(documentTemplates.id, id))
      .returning();
    if (!result) throw new Error("Document Template not found");
    return result;
  }

  async deleteDocumentTemplate(id: string): Promise<void> {
    await db.delete(documentTemplates).where(eq(documentTemplates.id, id));
  }

  // Legal Clauses
  async getLegalClauses(): Promise<LegalClause[]> {
    return await db
      .select()
      .from(legalClauses)
      .where(eq(legalClauses.isActive, true))
      .orderBy(legalClauses.category, legalClauses.createdAt);
  }

  async getLegalClause(clauseId: string): Promise<LegalClause | undefined> {
    const [clause] = await db
      .select()
      .from(legalClauses)
      .where(eq(legalClauses.clauseId, clauseId));
    return clause || undefined;
  }

  async getLegalClauseById(id: string): Promise<LegalClause | undefined> {
    const [clause] = await db
      .select()
      .from(legalClauses)
      .where(eq(legalClauses.id, id));
    return clause || undefined;
  }

  async getLegalClausesByCategory(category: string): Promise<LegalClause[]> {
    return await db
      .select()
      .from(legalClauses)
      .where(and(eq(legalClauses.category, category), eq(legalClauses.isActive, true)))
      .orderBy(legalClauses.createdAt);
  }

  async getLegalClausesByTemplate(templateId: string): Promise<LegalClause[]> {
    // Find clauses that are applicable to this template
    return await db
      .select()
      .from(legalClauses)
      .where(
        and(
          eq(legalClauses.isActive, true),
          sql`${legalClauses.applicableTemplates} ? ${templateId}`
        )
      )
      .orderBy(legalClauses.category, legalClauses.createdAt);
  }

  async createLegalClause(clause: InsertLegalClause): Promise<LegalClause> {
    const [result] = await db
      .insert(legalClauses)
      .values(clause)
      .returning();
    return result;
  }

  async updateLegalClause(id: string, clause: Partial<InsertLegalClause>): Promise<LegalClause> {
    const [result] = await db
      .update(legalClauses)
      .set({ ...clause, updatedAt: new Date() })
      .where(eq(legalClauses.id, id))
      .returning();
    if (!result) throw new Error("Legal Clause not found");
    return result;
  }

  async deleteLegalClause(id: string): Promise<void> {
    await db.delete(legalClauses).where(eq(legalClauses.id, id));
  }

  // Template Prompts
  async getTemplatePrompts(templateId: string): Promise<TemplatePrompt[]> {
    return await db
      .select()
      .from(templatePrompts)
      .where(and(eq(templatePrompts.templateId, templateId), eq(templatePrompts.isActive, true)))
      .orderBy(templatePrompts.priority, templatePrompts.createdAt);
  }

  async getTemplatePrompt(id: string): Promise<TemplatePrompt | undefined> {
    const [prompt] = await db
      .select()
      .from(templatePrompts)
      .where(eq(templatePrompts.id, id));
    return prompt || undefined;
  }

  async getTemplatePromptsByProvider(templateId: string, aiProvider: string): Promise<TemplatePrompt[]> {
    return await db
      .select()
      .from(templatePrompts)
      .where(
        and(
          eq(templatePrompts.templateId, templateId),
          eq(templatePrompts.isActive, true),
          sql`${templatePrompts.aiProvider} = ${aiProvider} OR ${templatePrompts.aiProvider} = 'all'`
        )
      )
      .orderBy(templatePrompts.priority, templatePrompts.createdAt);
  }

  async createTemplatePrompt(prompt: InsertTemplatePrompt): Promise<TemplatePrompt> {
    const [result] = await db
      .insert(templatePrompts)
      .values(prompt)
      .returning();
    return result;
  }

  async updateTemplatePrompt(id: string, prompt: Partial<InsertTemplatePrompt>): Promise<TemplatePrompt> {
    const [result] = await db
      .update(templatePrompts)
      .set({ ...prompt, updatedAt: new Date() })
      .where(eq(templatePrompts.id, id))
      .returning();
    if (!result) throw new Error("Template Prompt not found");
    return result;
  }

  async deleteTemplatePrompt(id: string): Promise<void> {
    await db.delete(templatePrompts).where(eq(templatePrompts.id, id));
  }

  // Template Analysis Rules
  async getTemplateAnalysisRules(templateId: string): Promise<TemplateAnalysisRule[]> {
    return await db
      .select()
      .from(templateAnalysisRules)
      .where(and(eq(templateAnalysisRules.templateId, templateId), eq(templateAnalysisRules.isActive, true)))
      .orderBy(templateAnalysisRules.createdAt);
  }

  async getTemplateAnalysisRule(id: string): Promise<TemplateAnalysisRule | undefined> {
    const [rule] = await db
      .select()
      .from(templateAnalysisRules)
      .where(eq(templateAnalysisRules.id, id));
    return rule || undefined;
  }

  async getTemplateAnalysisRulesByType(templateId: string, ruleType: string): Promise<TemplateAnalysisRule[]> {
    return await db
      .select()
      .from(templateAnalysisRules)
      .where(
        and(
          eq(templateAnalysisRules.templateId, templateId),
          eq(templateAnalysisRules.ruleType, ruleType),
          eq(templateAnalysisRules.isActive, true)
        )
      )
      .orderBy(templateAnalysisRules.createdAt);
  }

  async createTemplateAnalysisRule(rule: InsertTemplateAnalysisRule): Promise<TemplateAnalysisRule> {
    const [result] = await db
      .insert(templateAnalysisRules)
      .values(rule)
      .returning();
    return result;
  }

  async updateTemplateAnalysisRule(id: string, rule: Partial<InsertTemplateAnalysisRule>): Promise<TemplateAnalysisRule> {
    const [result] = await db
      .update(templateAnalysisRules)
      .set({ ...rule, updatedAt: new Date() })
      .where(eq(templateAnalysisRules.id, id))
      .returning();
    if (!result) throw new Error("Template Analysis Rule not found");
    return result;
  }

  async deleteTemplateAnalysisRule(id: string): Promise<void> {
    await db.delete(templateAnalysisRules).where(eq(templateAnalysisRules.id, id));
  }

  // Enhanced Analysis Methods
  async getTemplateWithPrompts(templateId: string, aiProvider?: string): Promise<{
    template: DocumentTemplate;
    prompts: TemplatePrompt[];
    analysisRules: TemplateAnalysisRule[];
    requiredClauses: LegalClause[];
    optionalClauses: LegalClause[];
  } | undefined> {
    const template = await this.getDocumentTemplate(templateId);
    if (!template) return undefined;

    const [prompts, analysisRules] = await Promise.all([
      aiProvider 
        ? this.getTemplatePromptsByProvider(template.id, aiProvider)
        : this.getTemplatePrompts(template.id),
      this.getTemplateAnalysisRules(template.id)
    ]);

    // Get required and optional clauses based on template configuration
    const requiredClauseIds = Array.isArray(template.requiredClauses) ? template.requiredClauses : [];
    const optionalClauseIds = Array.isArray(template.optionalClauses) ? template.optionalClauses : [];

    const [requiredClauses, optionalClauses] = await Promise.all([
      Promise.all(requiredClauseIds.map(async (clauseId: string) => {
        const clause = await this.getLegalClause(clauseId);
        return clause;
      })).then(clauses => clauses.filter(clause => clause !== undefined) as LegalClause[]),
      Promise.all(optionalClauseIds.map(async (clauseId: string) => {
        const clause = await this.getLegalClause(clauseId);
        return clause;
      })).then(clauses => clauses.filter(clause => clause !== undefined) as LegalClause[])
    ]);

    return {
      template,
      prompts,
      analysisRules,
      requiredClauses,
      optionalClauses
    };
  }
}

export const storage = new DatabaseStorage();