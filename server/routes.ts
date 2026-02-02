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
import { eq } from "drizzle-orm";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Setup Replit Auth
  await setupAuth(app);
  registerAuthRoutes(app);

  // === SEED DATA ===
  // Create initial profiles for users if they don't exist
  // This is a simple hook to ensure roles are assigned.
  // In a real app, this would be an admin UI.
  // Here, we'll make the first user a 'doctor' and subsequent ones 'assistant' if no profile exists.
  app.use(async (req: any, res, next) => {
    if (req.isAuthenticated() && req.user?.claims?.sub) {
      const userId = req.user.claims.sub;
      const existingProfile = await storage.getProfile(userId);
      if (!existingProfile) {
        // Check if any profiles exist
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

  // Get current user extended info
  app.get(api.auth.me.path, isAuthenticated, async (req: any, res) => {
    const userId = req.user.claims.sub;
    const profile = await storage.getProfile(userId);
    res.json({
      user: req.user,
      role: profile?.role || "assistant", // Default to assistant if no profile yet
    });
  });

  // Visits
  app.get(api.visits.list.path, isAuthenticated, async (req, res) => {
    const { date: queryDate, range, startDate, endDate } = req.query;
    let filters: any = {};
    
    if (range === 'today' || !range && !queryDate && !startDate) {
      filters.date = format(new Date(), 'yyyy-MM-dd');
    } else if (queryDate) {
      filters.date = String(queryDate);
    } else if (startDate && endDate) {
      filters.startDate = String(startDate);
      filters.endDate = String(endDate);
    }

    const result = await storage.getVisits(filters);
    res.json(result);
  });

  app.get(api.visits.get.path, isAuthenticated, async (req, res) => {
    const visit = await storage.getVisit(Number(req.params.id));
    if (!visit) return res.status(404).json({ message: "Visit not found" });
    res.json(visit);
  });

  app.post(api.visits.create.path, isAuthenticated, async (req, res) => {
    try {
      const input = api.visits.create.input.parse(req.body);
      const visit = await storage.createVisit(input);
      
      broadcast({ type: "CREATE", data: visit });
      res.status(201).json(visit);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  app.put(api.visits.update.path, isAuthenticated, async (req: any, res) => {
    try {
      const id = Number(req.params.id);
      const userId = req.user.claims.sub;
      
      const input = api.visits.update.input.parse(req.body);
      
      // Update lastUpdatedBy
      const updateData = { ...input, lastUpdatedBy: userId };
      
      const visit = await storage.updateVisit(id, updateData);
      
      broadcast({ type: "UPDATE", data: visit });
      res.json(visit);
    } catch (err) {
        if (err instanceof z.ZodError) {
            res.status(400).json({ message: err.errors[0].message });
        } else {
            res.status(500).json({ message: "Internal server error" });
        }
    }
  });

  app.delete(api.visits.delete.path, isAuthenticated, async (req, res) => {
    const id = Number(req.params.id);
    await storage.deleteVisit(id);
    
    broadcast({ type: "DELETE", id });
    res.status(204).send();
  });

  // Analytics
  app.get(api.analytics.get.path, isAuthenticated, async (req: any, res) => {
    const userId = req.user.claims.sub;
    const profile = await storage.getProfile(userId);
    
    if (profile?.role !== 'doctor') {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const { startDate, endDate } = req.query;
    if (!startDate || !endDate) {
      return res.status(400).json({ message: "Start and End date required" });
    }

    const stats = await storage.getAnalytics(String(startDate), String(endDate));
    res.json(stats);
  });

  // Seed Data (if empty)
  const existingVisits = await storage.getVisits({ date: format(new Date(), 'yyyy-MM-dd') });
  if (existingVisits.length === 0) {
    console.log("Seeding today's visits...");
    const today = format(new Date(), 'yyyy-MM-dd');
    await storage.createVisit({
      patientName: "John Doe",
      condition: "Flu symptoms",
      status: "waiting",
      visitDate: today,
    });
    await storage.createVisit({
      patientName: "Jane Smith",
      condition: "Back pain",
      status: "in_consultation",
      visitDate: today,
    });
  }

  return httpServer;
}
