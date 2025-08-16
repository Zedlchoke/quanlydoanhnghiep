import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { storage } from "./storage";
import { errorHandler, requestLogger, timeoutHandler, bodyParserErrorHandler } from "./middleware";

// Production deployment fix - August 10, 2025 14:20 - Force redeploy with fixed APIs
// CRITICAL FIX: Production missing getAllBusinessesForAutocomplete() + getAllDocumentTransactions()
// This change triggers Render to rebuild with latest code containing all required methods

const app = express();

// Trust proxy for deployment platforms
app.set('trust proxy', 1);

// CORS middleware for production
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Request timeout
app.use(timeoutHandler(30000));

// Body parsing with error handling
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(bodyParserErrorHandler);

// Request logging
if (process.env.NODE_ENV !== 'production') {
  app.use(requestLogger);
}

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
  // Initialize database on startup
  try {
    log("Initializing database...");
    await storage.initializeDatabase();
    log("Database initialization completed");
  } catch (error) {
    log(`Database initialization failed: ${error}`);
  }

  const server = await registerRoutes(app);

  // Use enhanced error handler
  app.use(errorHandler);

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // AUTOSCALE DEPLOYMENT FIX: Single port only, bind to 0.0.0.0
  // Replit autoscale requires exactly one port exposed on 0.0.0.0
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen(port, "0.0.0.0", () => {
    log(`serving on port ${port}`);
  });
})();
// Force deployment trigger Sun Aug 10 02:09:09 PM UTC 2025
// Production deployment trigger - Sun Aug 10 02:49:06 PM UTC 2025 - Force Render rebuild with latest code
// Force production rebuild with critical fix - 1754837364
// CRITICAL FIX - 1754837428 - TypeScript compilation errors resolved
