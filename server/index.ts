import express, { type Request, Response, NextFunction } from "express";
import { sql } from "drizzle-orm";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

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

(async () => {
  // Database setup - production ready
  try {
    if (process.env.NODE_ENV === 'production' && process.env.DATABASE_URL) {
      console.log('🔧 Setting up database...');
      
      // Test database connection first - with timeout and retry
      try {
        const { db } = await import('./db');
        
        // Simple HTTP-based connection test instead of WebSocket
        await Promise.race([
          db.execute(sql`SELECT 1`),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Connection timeout')), 5000)
          )
        ]);
        console.log('✅ Database connection verified!');
      } catch (connectError: any) {
        console.log('⚠️ Database connection test failed:', connectError.message, '- continuing without initial test...');
        // Continue anyway - database might work for actual queries
      }
      
      // PRODUCTION FIX: Skip schema push if causing WebSocket issues
      // Tables should already exist on Render database
      console.log('🔧 Skipping schema push in production - assuming tables exist');
      console.log('📝 Note: Run drizzle-kit push manually if schema changes needed');
      
      // PRODUCTION FIX: Skip test data insertion - may cause WebSocket issues
      console.log('🔧 Skipping test data insertion in production');
      console.log('📝 Note: Test data should already exist or be added manually');
      console.log('✅ Database setup completed!');
    }
  } catch (error: any) {
    console.log('⚠️ Database setup error:', error.message);
  }

  const server = await registerRoutes(app);

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
