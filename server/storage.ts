import { type User, type InsertUser, type LoginUser, type AiProvider, type InsertAiProvider, type DocumentAnalysis, type InsertDocumentAnalysis, type CreditTransaction, type SupportTicket, type InsertSupportTicket, type TicketMessage, type InsertTicketMessage } from "@shared/schema";
import { db } from "./db";
import { users, aiProviders, documentAnalyses, creditTransactions, supportTickets, ticketMessages } from "@shared/schema";
import { eq, desc, and, limit as drizzleLimit } from "drizzle-orm";

export interface IStorage {
  // User management
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserCredits(id: string, credits: number): Promise<User>;
  updateStripeCustomerId(id: string, customerId: string): Promise<User>;

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
  createCreditTransaction(userId: string, type: string, amount: number, description: string, stripePaymentIntentId?: string): Promise<CreditTransaction>;

  // Support Tickets
  getSupportTickets(userId: string): Promise<SupportTicket[]>;
  getSupportTicket(id: string, userId: string): Promise<SupportTicket | undefined>;
  createSupportTicket(userId: string, ticket: InsertSupportTicket): Promise<SupportTicket>;
  updateSupportTicketStatus(id: string, status: string): Promise<SupportTicket>;

  // Ticket Messages
  getTicketMessages(ticketId: string): Promise<TicketMessage[]>;
  createTicketMessage(ticketMessage: InsertTicketMessage): Promise<TicketMessage>;
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

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({
        ...insertUser,
        credits: 10, // Free tier starts with 10 credits
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

  // Support Tickets
  async getSupportTickets(userId: string): Promise<SupportTicket[]> {
    return await db
      .select()
      .from(supportTickets)
      .where(eq(supportTickets.userId, userId))
      .orderBy(desc(supportTickets.createdAt));
  }

  async getSupportTicket(id: string, userId: string): Promise<SupportTicket | undefined> {
    const [ticket] = await db
      .select()
      .from(supportTickets)
      .where(and(eq(supportTickets.id, id), eq(supportTickets.userId, userId)));
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
}

export const storage = new DatabaseStorage();