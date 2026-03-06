import { app, log, setupErrorHandler } from "./app";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";

// This file is the primary entry point for local development (npm run dev).
// On Vercel, the application entries are routed through /api/index.ts instead.

const httpServer = createServer(app);

(async () => {
  await registerRoutes(httpServer, app);
  
  setupErrorHandler();

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || "5000", 10);
  httpServer.listen(
    {
      port,
      host: "0.0.0.0",
      reusePort: true,
    },
    () => {
      log(`serving on port ${port}`);
    },
  );
})();
