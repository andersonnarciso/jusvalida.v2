import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import bcrypt from "bcrypt";
import { storage } from "./storage";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// Secure admin user creation function
async function createInitialAdminUser() {
  try {
    // Check if any admin users exist
    const existingAdminUsers = await storage.getUsersByRole("admin");
    
    if (existingAdminUsers.length === 0) {
      // No admin users exist, check for environment variables
      const adminEmail = process.env.INITIAL_ADMIN_EMAIL;
      const adminPassword = process.env.INITIAL_ADMIN_PASSWORD;
      
      if (adminEmail && adminPassword) {
        // Create the first admin user
        const hashedPassword = await bcrypt.hash(adminPassword, 10);
        
        const adminUser = await storage.createUser({
          username: adminEmail.split('@')[0] + '_admin',
          email: adminEmail,
          password: hashedPassword,
          firstName: 'Admin',
          lastName: 'User',
          credits: 100, // Give admin user extra credits
        });
        
        // Set the role to admin (this bypasses normal role assignment restrictions)
        await storage.updateUserRole(adminUser.id, "admin");
        
        log(`✅ Initial admin user created with email: ${adminEmail}`);
      } else {
        log(`⚠️  No admin users found. Set INITIAL_ADMIN_EMAIL and INITIAL_ADMIN_PASSWORD environment variables to create the first admin user.`);
      }
    }
  } catch (error) {
    log(`❌ Error creating initial admin user: ${error}`);
  }
}

(async () => {
  const server = await registerRoutes(app);
  
  // Create initial admin user if needed
  await createInitialAdminUser();

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
