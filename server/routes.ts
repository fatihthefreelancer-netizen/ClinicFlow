import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./replit_integrations/auth";
import { api } from "@shared/routes";
import { z } from "zod";
import { format } from "date-fns";
import { db } from "./db";
import { visits, profiles, users } from "@shared/schema";
import { eq, and, gte, lte } from "drizzle-orm";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Setup Replit Auth
  await setupAuth(app);
  registerAuthRoutes(app);

  // === SEED DATA REMOVED ===
  app.use(async (req: any, res, next) => {
    if (req.isAuthenticated() && req.user?.claims?.sub) {
      const userId = req.user.claims.sub;
      const existingProfile = await storage.getProfile(userId);
      if (!existingProfile) {
        const allProfiles = await db.select().from(profiles);
        const role = allProfiles.length === 0 ? "doctor" : "assistant";
        await storage.createProfile({ userId, role });
      }
    }
    next();
  });

  // === WEBSOCKET SETUP ===
  const wss = new WebSocketServer({ server: httpServer, path: "/ws" });

  const broadcast = (message: any) => {
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(message));
      }
    });
  };

  wss.on("connection", (ws) => {
    console.log("Client connected");
    ws.on("close", () => console.log("Client disconnected"));
  });

  // === API ROUTES ===

  return httpServer;
}
