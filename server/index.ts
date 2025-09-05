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
    if (process.env.NODE_ENV === 'production') {
      const { db } = await import('./db');
      const { sql } = await import('drizzle-orm');
      
      console.log('🔧 Setting up database tables...');
      
      // Test kullanıcıları oluştur (eğer yoksa)
      await db.execute(sql`
        INSERT INTO users (id, email, "firstName", "lastName", role) VALUES 
        ('admin', 'admin@test.com', 'Admin', 'User', 'admin'),
        ('murat', 'murat@test.com', 'Murat', 'Kargo', 'shipping'),
        ('ahmet', 'ahmet@test.com', 'Ahmet', 'Satış', 'sales'),
        ('ayse', 'ayse@test.com', 'Ayşe', 'Üretim', 'production')
        ON CONFLICT (id) DO NOTHING
      `);
      
      // Örnek ürünler ekle
      await db.execute(sql`
        INSERT INTO products (id, name, unit, price) VALUES 
        ('prod-1', 'Standart Kutu', 'adet', 10.50),
        ('prod-2', 'Büyük Kutu', 'adet', 15.75),
        ('prod-3', 'Özel Kutu', 'adet', 25.00)
        ON CONFLICT (id) DO NOTHING
      `);
      
      console.log('✅ Database setup completed!');
    }
  } catch (error: any) {
    console.log('⚠️ Database setup error (this is normal on first deploy):', error.message);
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
