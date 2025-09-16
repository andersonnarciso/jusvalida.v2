import { type User, type InsertUser, type LoginUser, type AiProvider, type InsertAiProvider, type DocumentAnalysis, type InsertDocumentAnalysis, type CreditTransaction, type SupportTicket, type InsertSupportTicket, type TicketMessage, type InsertTicketMessage } from "@shared/schema";
import { randomUUID } from "crypto";

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

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private aiProviders: Map<string, AiProvider>;
  private documentAnalyses: Map<string, DocumentAnalysis>;
  private creditTransactions: Map<string, CreditTransaction>;
  private supportTickets: Map<string, SupportTicket>;
  private ticketMessages: Map<string, TicketMessage>;

  constructor() {
    this.users = new Map();
    this.aiProviders = new Map();
    this.documentAnalyses = new Map();
    this.creditTransactions = new Map();
    this.supportTickets = new Map();
    this.ticketMessages = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = {
      ...insertUser,
      id,
      credits: 5, // Free tier starts with 5 credits
      stripeCustomerId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async updateUserCredits(id: string, credits: number): Promise<User> {
    const user = this.users.get(id);
    if (!user) throw new Error("User not found");
    
    const updatedUser = { ...user, credits, updatedAt: new Date() };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async updateStripeCustomerId(id: string, customerId: string): Promise<User> {
    const user = this.users.get(id);
    if (!user) throw new Error("User not found");
    
    const updatedUser = { ...user, stripeCustomerId: customerId, updatedAt: new Date() };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async getAiProviders(userId: string): Promise<AiProvider[]> {
    return Array.from(this.aiProviders.values()).filter(provider => provider.userId === userId);
  }

  async getAiProvider(userId: string, provider: string): Promise<AiProvider | undefined> {
    return Array.from(this.aiProviders.values()).find(p => p.userId === userId && p.provider === provider);
  }

  async createAiProvider(userId: string, providerData: InsertAiProvider): Promise<AiProvider> {
    const id = randomUUID();
    const provider: AiProvider = {
      ...providerData,
      id,
      userId,
      isActive: providerData.isActive ?? true,
      createdAt: new Date(),
    };
    this.aiProviders.set(id, provider);
    return provider;
  }

  async updateAiProvider(id: string, providerData: Partial<InsertAiProvider>): Promise<AiProvider> {
    const provider = this.aiProviders.get(id);
    if (!provider) throw new Error("AI Provider not found");
    
    const updatedProvider = { ...provider, ...providerData };
    this.aiProviders.set(id, updatedProvider);
    return updatedProvider;
  }

  async deleteAiProvider(id: string): Promise<void> {
    this.aiProviders.delete(id);
  }

  async getDocumentAnalyses(userId: string, limit?: number): Promise<DocumentAnalysis[]> {
    const analyses = Array.from(this.documentAnalyses.values())
      .filter(analysis => analysis.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    
    return limit ? analyses.slice(0, limit) : analyses;
  }

  async getDocumentAnalysis(id: string, userId: string): Promise<DocumentAnalysis | undefined> {
    const analysis = this.documentAnalyses.get(id);
    return analysis && analysis.userId === userId ? analysis : undefined;
  }

  async createDocumentAnalysis(userId: string, analysisData: InsertDocumentAnalysis): Promise<DocumentAnalysis> {
    const id = randomUUID();
    const analysis: DocumentAnalysis = {
      ...analysisData,
      id,
      userId,
      status: "pending",
      createdAt: new Date(),
    };
    this.documentAnalyses.set(id, analysis);
    return analysis;
  }

  async updateDocumentAnalysisResult(id: string, result: any, status: string): Promise<DocumentAnalysis> {
    const analysis = this.documentAnalyses.get(id);
    if (!analysis) throw new Error("Document analysis not found");
    
    const updatedAnalysis = { ...analysis, result, status };
    this.documentAnalyses.set(id, updatedAnalysis);
    return updatedAnalysis;
  }

  async getCreditTransactions(userId: string): Promise<CreditTransaction[]> {
    return Array.from(this.creditTransactions.values())
      .filter(transaction => transaction.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async createCreditTransaction(userId: string, type: string, amount: number, description: string, stripePaymentIntentId?: string): Promise<CreditTransaction> {
    const id = randomUUID();
    const transaction: CreditTransaction = {
      id,
      userId,
      type,
      amount,
      description,
      stripePaymentIntentId: stripePaymentIntentId || null,
      createdAt: new Date(),
    };
    this.creditTransactions.set(id, transaction);
    return transaction;
  }

  async getSupportTickets(userId: string): Promise<SupportTicket[]> {
    return Array.from(this.supportTickets.values())
      .filter(ticket => ticket.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getSupportTicket(id: string, userId: string): Promise<SupportTicket | undefined> {
    const ticket = this.supportTickets.get(id);
    return ticket && ticket.userId === userId ? ticket : undefined;
  }

  async createSupportTicket(userId: string, ticketData: InsertSupportTicket): Promise<SupportTicket> {
    const id = randomUUID();
    const ticket: SupportTicket = {
      ...ticketData,
      id,
      userId,
      status: "open",
      priority: ticketData.priority || "normal",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.supportTickets.set(id, ticket);
    return ticket;
  }

  async updateSupportTicketStatus(id: string, status: string): Promise<SupportTicket> {
    const ticket = this.supportTickets.get(id);
    if (!ticket) throw new Error("Support ticket not found");
    
    const updatedTicket = { ...ticket, status, updatedAt: new Date() };
    this.supportTickets.set(id, updatedTicket);
    return updatedTicket;
  }

  async getTicketMessages(ticketId: string): Promise<TicketMessage[]> {
    return Array.from(this.ticketMessages.values())
      .filter(message => message.ticketId === ticketId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  async createTicketMessage(messageData: InsertTicketMessage): Promise<TicketMessage> {
    const id = randomUUID();
    const message: TicketMessage = {
      ...messageData,
      id,
      userId: messageData.userId || null,
      isFromSupport: messageData.isFromSupport ?? false,
      createdAt: new Date(),
    };
    this.ticketMessages.set(id, message);
    return message;
  }
}

export const storage = new MemStorage();
