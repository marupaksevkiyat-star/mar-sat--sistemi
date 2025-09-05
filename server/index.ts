import express, { type Request, Response, NextFunction } from "express";
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
  // Database setup - otomatik tablo oluşturma
  try {
    if (process.env.NODE_ENV === 'production' && process.env.DATABASE_URL) {
      console.log('🔧 Setting up database...');
      
      // Drizzle kit push ile tabloları oluştur
      const { spawn } = await import('child_process');
      
      await new Promise((resolve, reject) => {
        const pushProcess = spawn('npx', ['drizzle-kit', 'push', '--force'], {
          stdio: 'inherit',
          env: { ...process.env }
        });
        
        pushProcess.on('close', (code) => {
          if (code === 0) {
            console.log('✅ Database schema pushed successfully!');
            resolve(true);
          } else {
            console.log('⚠️ Schema push failed, continuing...');
            resolve(true); // Continue even if fails
          }
        });
        
        pushProcess.on('error', (err) => {
          console.log('⚠️ Schema push error:', err.message);
          resolve(true); // Continue even if fails
        });
      });
      
      // Test verisi ekle
      try {
        const { db } = await import('./db');
        const { users, products } = await import('../shared/schema');
        
        console.log('🔧 Adding test data...');
        
        // Test kullanıcıları ekle
        await db.insert(users).values([
          { id: 'admin', email: 'admin@test.com', firstName: 'Admin', lastName: 'User', role: 'admin' },
          { id: 'murat', email: 'murat@test.com', firstName: 'Murat', lastName: 'Kargo', role: 'shipping' },
          { id: 'ahmet', email: 'ahmet@test.com', firstName: 'Ahmet', lastName: 'Satış', role: 'sales' }
        ]).onConflictDoNothing();
        
        // Test ürünleri ekle
        await db.insert(products).values([
          { id: 'prod-1', name: 'Standart Kutu', unit: 'adet', price: '10.50' },
          { id: 'prod-2', name: 'Büyük Kutu', unit: 'adet', price: '15.75' },
          { id: 'prod-3', name: 'Özel Kutu', unit: 'adet', price: '25.00' }
        ]).onConflictDoNothing();
        
        console.log('✅ Database setup completed!');
      } catch (dataError: any) {
        console.log('⚠️ Test data error:', dataError.message);
      }
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
