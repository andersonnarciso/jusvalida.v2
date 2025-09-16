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
  role: text("role").notNull().default("user").$type<"user" | "admin" | "support">(),
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

export const aiProviderConfigs = pgTable("ai_provider_configs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  providerId: text("provider_id").notNull().unique(), // 'openai-gpt4', 'anthropic-claude', etc.
  name: text("name").notNull(), // 'OpenAI', 'Anthropic', etc.
  model: text("model").notNull(), // 'GPT-4', 'Claude Sonnet 4', etc.
  provider: text("provider").notNull(), // 'openai', 'anthropic', 'gemini', etc.
  credits: integer("credits").notNull(), // Cost in credits
  description: text("description").notNull(),
  iconName: text("icon_name").notNull(), // Icon identifier for frontend
  isPopular: boolean("is_popular").notNull().default(false),
  isFree: boolean("is_free").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const creditPackages = pgTable("credit_packages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  packageId: text("package_id").notNull().unique(), // 'credits_50', 'credits_100', etc.
  name: text("name").notNull(), // '50 Créditos', '100 Créditos', etc.
  credits: integer("credits").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(), // Price in reais
  isPopular: boolean("is_popular").notNull().default(false),
  description: text("description").notNull(),
  features: jsonb("features").notNull(), // Array of feature strings
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const platformStats = pgTable("platform_stats", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  totalDocuments: integer("total_documents").notNull().default(0),
  totalUsers: integer("total_users").notNull().default(0),
  totalAnalyses: integer("total_analyses").notNull().default(0),
  averageAccuracy: decimal("average_accuracy", { precision: 5, scale: 2 }).notNull().default(sql`0.00`),
  lastUpdated: timestamp("last_updated").notNull().default(sql`CURRENT_TIMESTAMP`),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  role: true, // Prevent users from setting their own role
  createdAt: true,
  updatedAt: true,
}).extend({
  password: z.string().min(8, "Password must be at least 8 characters"),
  email: z.string().email("Invalid email address"),
});

// Admin-only schema for role assignment
export const assignRoleSchema = z.object({
  userId: z.string(),
  role: z.enum(["user", "admin", "support"]),
});

// Admin user update schema with proper validation
export const adminUserUpdateSchema = z.object({
  role: z.enum(["user", "admin", "support"]).optional(),
  credits: z.number().int().min(0, "Credits must be a non-negative integer").optional(),
}).strict().refine(
  (data) => data.role !== undefined || data.credits !== undefined,
  { message: "At least one field (role or credits) must be provided" }
);

// Admin message schema with proper validation
export const adminTicketMessageSchema = z.object({
  message: z.string().min(1, "Message is required"),
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

export const insertAiProviderConfigSchema = createInsertSchema(aiProviderConfigs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCreditPackageSchema = createInsertSchema(creditPackages).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPlatformStatsSchema = createInsertSchema(platformStats).omit({
  id: true,
  lastUpdated: true,
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
export type AiProviderConfig = typeof aiProviderConfigs.$inferSelect;
export type CreditPackage = typeof creditPackages.$inferSelect;
export type PlatformStats = typeof platformStats.$inferSelect;

export type InsertAiProvider = z.infer<typeof insertAiProviderSchema>;
export type InsertDocumentAnalysis = z.infer<typeof insertDocumentAnalysisSchema>;
export type InsertSupportTicket = z.infer<typeof insertSupportTicketSchema>;
export type InsertTicketMessage = z.infer<typeof insertTicketMessageSchema>;
export type InsertAiProviderConfig = z.infer<typeof insertAiProviderConfigSchema>;
export type InsertCreditPackage = z.infer<typeof insertCreditPackageSchema>;
export type InsertPlatformStats = z.infer<typeof insertPlatformStatsSchema>;

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
