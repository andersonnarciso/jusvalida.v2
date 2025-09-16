import type { Express } from "express";
import { createServer, type Server } from "http";
import Stripe from "stripe";
import { storage } from "./storage";
import { aiService } from "./services/ai";
import bcrypt from "bcrypt";
import session from "express-session";
import { insertUserSchema, loginUserSchema, insertDocumentAnalysisSchema, insertSupportTicketSchema, insertTicketMessageSchema } from "@shared/schema";
import multer from "multer";
import { z } from "zod";

declare global {
  namespace Express {
    interface User {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      username: string;
      credits: number;
      stripeCustomerId?: string | null;
    }
    
    interface Request {
      user?: User;
    }
  }
}

declare module 'express-session' {
  interface SessionData {
    user?: Express.User;
  }
}

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-08-27.basil",
});

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
    cb(null, allowedTypes.includes(file.mimetype));
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Session configuration
  app.use(session({
    secret: process.env.SESSION_SECRET || 'fallback-secret',
    resave: false,
    saveUninitialized: false,
    cookie: { 
      secure: false, // Set to true in production with HTTPS
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  }));

  // Auth middleware
  const requireAuth = (req: any, res: any, next: any) => {
    if (!req.session?.user) {
      return res.status(401).json({ message: "Authentication required" });
    }
    req.user = req.session.user;
    next();
  };

  // Authentication routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const validatedData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(validatedData.email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(validatedData.password, 10);
      
      const user = await storage.createUser({
        ...validatedData,
        password: hashedPassword,
      });

      // Set session
      req.session.user = {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        credits: user.credits,
        stripeCustomerId: user.stripeCustomerId,
      };

      res.json({
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          username: user.username,
          credits: user.credits,
        }
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = loginUserSchema.parse(req.body);
      
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Set session
      req.session.user = {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        credits: user.credits,
        stripeCustomerId: user.stripeCustomerId,
      };

      res.json({
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          username: user.username,
          credits: user.credits,
        }
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/auth/me", requireAuth, (req, res) => {
    res.json({ user: req.user });
  });

  // Document analysis routes
  app.post("/api/analyze", requireAuth, upload.single('file'), async (req, res) => {
    try {
      let content = '';
      
      if (req.file) {
        // Handle file upload - for now just convert buffer to string
        // In production, you'd want proper PDF/DOC parsing
        content = req.file.buffer.toString('utf-8');
      } else if (req.body.content) {
        content = req.body.content;
      } else {
        return res.status(400).json({ message: "No content provided" });
      }

      const { analysisType, aiProvider, aiModel } = req.body;
      
      // Validate free tier limits
      if (req.user.credits === 0) {
        return res.status(402).json({ message: "Insufficient credits" });
      }

      // Get user's API key for the provider if needed
      let userApiKey;
      if (aiProvider !== 'free') {
        const providerConfig = await storage.getAiProvider(req.user.id, aiProvider);
        userApiKey = providerConfig?.apiKey;
      }

      // Calculate credits needed
      const creditsNeeded = aiService.getProviderCredits(`${aiProvider}-${aiModel}`);
      
      if (req.user.credits < creditsNeeded) {
        return res.status(402).json({ message: "Insufficient credits" });
      }

      // Create analysis record
      const analysis = await storage.createDocumentAnalysis(req.user.id, {
        title: req.body.title || `Document Analysis ${new Date().toISOString()}`,
        content,
        aiProvider,
        aiModel,
        analysisType,
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
          userApiKey
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

        // Update session
        req.session.user!.credits = newCredits;

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

  app.get("/api/analyses", requireAuth, async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const analyses = await storage.getDocumentAnalyses(req.user.id, limit);
      res.json(analyses);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/analyses/:id", requireAuth, async (req, res) => {
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

  // AI Provider management routes
  app.get("/api/ai-providers", requireAuth, async (req, res) => {
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

  app.post("/api/ai-providers", requireAuth, async (req, res) => {
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

  app.delete("/api/ai-providers/:id", requireAuth, async (req, res) => {
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
  app.post("/api/create-payment-intent", requireAuth, async (req, res) => {
    try {
      const { credits, amount } = req.body;
      
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: "brl",
        metadata: {
          userId: req.user.id,
          credits: credits.toString(),
        },
      });

      res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error: any) {
      res.status(500).json({ message: "Error creating payment intent: " + error.message });
    }
  });

  app.post("/api/confirm-payment", requireAuth, async (req, res) => {
    try {
      const { paymentIntentId } = req.body;
      
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      
      if (paymentIntent.status === 'succeeded' && paymentIntent.metadata.userId === req.user.id) {
        const credits = parseInt(paymentIntent.metadata.credits);
        const newCredits = req.user.credits + credits;
        
        await storage.updateUserCredits(req.user.id, newCredits);
        await storage.createCreditTransaction(
          req.user.id,
          "purchase",
          credits,
          `Purchase of ${credits} credits`,
          paymentIntentId
        );

        req.session.user!.credits = newCredits;
        
        res.json({ success: true, newCredits });
      } else {
        res.status(400).json({ message: "Payment not completed" });
      }
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/credit-transactions", requireAuth, async (req, res) => {
    try {
      const transactions = await storage.getCreditTransactions(req.user.id);
      res.json(transactions);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Support ticket routes
  app.get("/api/support/tickets", requireAuth, async (req, res) => {
    try {
      const tickets = await storage.getSupportTickets(req.user.id);
      res.json(tickets);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/support/tickets", requireAuth, async (req, res) => {
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

  app.get("/api/support/tickets/:id", requireAuth, async (req, res) => {
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

  app.post("/api/support/tickets/:id/messages", requireAuth, async (req, res) => {
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

  const httpServer = createServer(app);
  return httpServer;
}
