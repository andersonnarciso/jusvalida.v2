import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, boolean, jsonb, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  credits: integer("credits").notNull().default(5), // Start with 5 free credits
  stripeCustomerId: text("stripe_customer_id"),
  createdAt: timestamp("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const aiProviders = pgTable("ai_providers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  provider: text("provider").notNull(), // 'openai', 'anthropic', 'gemini', 'openrouter'
  apiKey: text("api_key").notNull(), // Encrypted
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const documentAnalyses = pgTable("document_analyses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  content: text("content").notNull(),
  aiProvider: text("ai_provider").notNull(),
  aiModel: text("ai_model").notNull(),
  analysisType: text("analysis_type").notNull(), // 'general', 'contract', 'legal', 'compliance'
  result: jsonb("result"),
  creditsUsed: integer("credits_used").notNull(),
  status: text("status").notNull().default("completed"), // 'pending', 'processing', 'completed', 'failed'
  createdAt: timestamp("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const creditTransactions = pgTable("credit_transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // 'purchase', 'usage', 'refund'
  amount: integer("amount").notNull(), // Positive for purchases, negative for usage
  description: text("description").notNull(),
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  createdAt: timestamp("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const supportTickets = pgTable("support_tickets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  subject: text("subject").notNull(),
  message: text("message").notNull(),
  status: text("status").notNull().default("open"), // 'open', 'pending', 'resolved', 'closed'
  priority: text("priority").notNull().default("normal"), // 'low', 'normal', 'high', 'urgent'
  createdAt: timestamp("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const ticketMessages = pgTable("ticket_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ticketId: varchar("ticket_id").notNull().references(() => supportTickets.id, { onDelete: "cascade" }),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }),
  message: text("message").notNull(),
  isFromSupport: boolean("is_from_support").notNull().default(false),
  createdAt: timestamp("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  password: z.string().min(8, "Password must be at least 8 characters"),
  email: z.string().email("Invalid email address"),
});

export const loginUserSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const insertAiProviderSchema = createInsertSchema(aiProviders).omit({
  id: true,
  userId: true,
  createdAt: true,
});

export const insertDocumentAnalysisSchema = createInsertSchema(documentAnalyses).omit({
  id: true,
  userId: true,
  createdAt: true,
  status: true,
});

export const insertSupportTicketSchema = createInsertSchema(supportTickets).omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
  status: true,
});

export const insertTicketMessageSchema = createInsertSchema(ticketMessages).omit({
  id: true,
  createdAt: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type LoginUser = z.infer<typeof loginUserSchema>;
export type User = typeof users.$inferSelect;
export type AiProvider = typeof aiProviders.$inferSelect;
export type DocumentAnalysis = typeof documentAnalyses.$inferSelect;
export type CreditTransaction = typeof creditTransactions.$inferSelect;
export type SupportTicket = typeof supportTickets.$inferSelect;
export type TicketMessage = typeof ticketMessages.$inferSelect;

export type InsertAiProvider = z.infer<typeof insertAiProviderSchema>;
export type InsertDocumentAnalysis = z.infer<typeof insertDocumentAnalysisSchema>;
export type InsertSupportTicket = z.infer<typeof insertSupportTicketSchema>;
export type InsertTicketMessage = z.infer<typeof insertTicketMessageSchema>;

// Relations
import { relations } from "drizzle-orm";

export const usersRelations = relations(users, ({ many }) => ({
  aiProviders: many(aiProviders),
  documentAnalyses: many(documentAnalyses),
  creditTransactions: many(creditTransactions),
  supportTickets: many(supportTickets),
}));

export const aiProvidersRelations = relations(aiProviders, ({ one }) => ({
  user: one(users, {
    fields: [aiProviders.userId],
    references: [users.id],
  }),
}));

export const documentAnalysesRelations = relations(documentAnalyses, ({ one }) => ({
  user: one(users, {
    fields: [documentAnalyses.userId],
    references: [users.id],
  }),
}));

export const supportTicketsRelations = relations(supportTickets, ({ one, many }) => ({
  user: one(users, {
    fields: [supportTickets.userId],
    references: [users.id],
  }),
  messages: many(ticketMessages),
}));

export const ticketMessagesRelations = relations(ticketMessages, ({ one }) => ({
  ticket: one(supportTickets, {
    fields: [ticketMessages.ticketId],
    references: [supportTickets.id],
  }),
  user: one(users, {
    fields: [ticketMessages.userId],
    references: [users.id],
  }),
}));
