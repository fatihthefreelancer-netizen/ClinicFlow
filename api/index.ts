import serverless from "serverless-http";
import { app, setupErrorHandler } from "../server/app.js";
import { registerRoutes } from "../server/routes.js";

// Initialize the routes once when the lambda is warmed up
let initialized = false;
const initPromise = (async () => {
  // We pass null for the httpServer so WebSocket logic is skipped
  // as Vercel serverless functions do not support long-lived WebSocket servers.
  await registerRoutes(null, app);
  
  // Setup error handler after routes are registered
  setupErrorHandler();
  
  initialized = true;
})();

const handler = serverless(app);

export default async function (req: any, res: any) {
  if (!initialized) {
    await initPromise;
  }
  return handler(req, res);
}
