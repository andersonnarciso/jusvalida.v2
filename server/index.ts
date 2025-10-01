   import dotenv from 'dotenv';
   dotenv.config();


// SECURITY: Load environment variables first, before any other imports
dotenv.config();

import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import bcrypt from "bcrypt";
import { storage } from "./storage";
import { validateEncryptionStartup } from "./lib/encryption";
import fs from "fs";
import path from "path";

const app = express();
// SECURITY: Set body size limits to prevent payload attacks
// Regular JSON requests limited to 50MB for batch metadata
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: false, limit: '50mb' }));

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

// SECURITY FIX: Ensure upload directories exist on startup
async function createUploadDirectories() {
  const uploadDirs = ['/tmp/uploads', '/tmp/batch-uploads'];
  
  for (const dir of uploadDirs) {
    try {
      await fs.promises.mkdir(dir, { recursive: true });
      log(`✅ Upload directory ensured: ${dir}`);
    } catch (error: any) {
      log(`❌ Failed to create upload directory ${dir}: ${error.message}`);
      throw error;
    }
  }
}

// SECURITY FIX: Periodic cleanup of orphaned temporary files
async function cleanupOrphanedFiles() {
  const uploadDirs = ['/tmp/uploads', '/tmp/batch-uploads'];
  const maxAge = 24 * 60 * 60 * 1000; // 24 hours
  
  for (const dir of uploadDirs) {
    try {
      const files = await fs.promises.readdir(dir);
      const now = Date.now();
      
      for (const file of files) {
        const filePath = path.join(dir, file);
        try {
          const stats = await fs.promises.stat(filePath);
          const age = now - stats.mtime.getTime();
          
          if (age > maxAge) {
            await fs.promises.unlink(filePath);
            log(`🗑️ Cleaned up orphaned file: ${filePath}`);
          }
        } catch (fileError: any) {
          // File might have been deleted already, ignore
          if (fileError.code !== 'ENOENT') {
            log(`⚠️ Error checking file ${filePath}: ${fileError.message}`);
          }
        }
      }
    } catch (dirError: any) {
      if (dirError.code !== 'ENOENT') {
        log(`⚠️ Error cleaning directory ${dir}: ${dirError.message}`);
      }
    }
  }
}

// Start periodic cleanup every hour
setInterval(cleanupOrphanedFiles, 60 * 60 * 1000);
// Run initial cleanup after 5 minutes
setTimeout(cleanupOrphanedFiles, 5 * 60 * 1000);

// Automatic cleanup of deleted analyses older than 7 days
async function cleanupExpiredAnalyses() {
  try {
    const deletedCount = await storage.cleanupExpiredAnalyses();
    if (deletedCount > 0) {
      log(`🗑️ Cleaned up ${deletedCount} expired analysis/analyses from trash`);
    }
  } catch (error: any) {
    log(`❌ Error during analysis cleanup: ${error.message}`);
  }
}

// Run analysis cleanup daily at 2 AM (if server is running continuously)
// Otherwise run every 24 hours from server start
setInterval(cleanupExpiredAnalyses, 24 * 60 * 60 * 1000); // 24 hours
// Run initial cleanup after 10 minutes
setTimeout(cleanupExpiredAnalyses, 10 * 60 * 1000);

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
  // SECURITY: Validate encryption system at startup
  validateEncryptionStartup();
  
  // SECURITY FIX: Create upload directories before routes registration
  await createUploadDirectories();
  
  // SECURITY: Perform one-time migration after encryption validation
  try {
    await storage.performOneTimeMigration();
  } catch (error) {
    log(`❌ CRITICAL: Security migration failed: ${error}`);
    process.exit(1);
  }
  
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
  // Other ports are firewalled. Default to 3000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '3000', 10);
  server.listen(port, () => {
    log(`serving on port ${port}`);
  });
})();
