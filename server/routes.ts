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

  // === SEED DATA ===
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

  app.get(api.auth.me.path, isAuthenticated, async (req: any, res) => {
    const userId = req.user.claims.sub;
    const profile = await storage.getProfile(userId);
    res.json({
      user: req.user,
      role: profile?.role || "assistant",
    });
  });

  app.get(api.visits.list.path, isAuthenticated, async (req, res) => {
    const { date: queryDate, range, startDate, endDate } = req.query;
    let filters: any = {};
    
    if (range === 'today' || (!range && !queryDate && !startDate)) {
      filters.date = format(new Date(), 'yyyy-MM-dd');
    } else if (queryDate) {
      filters.date = String(queryDate);
    } else if (startDate && endDate) {
      filters.startDate = format(new Date(String(startDate)), 'yyyy-MM-dd');
      filters.endDate = format(new Date(String(endDate)), 'yyyy-MM-dd');
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

    const formattedStart = format(new Date(String(startDate)), 'yyyy-MM-dd');
    const formattedEnd = format(new Date(String(endDate)), 'yyyy-MM-dd');

    const stats = await storage.getAnalytics(formattedStart, formattedEnd);
    res.json(stats);
  });

  // Export CSV
  app.get("/api/export", isAuthenticated, async (req: any, res) => {
    const userId = req.user.claims.sub;
    const profile = await storage.getProfile(userId);
    
    if (profile?.role !== 'doctor') {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const { startDate, endDate } = req.query;
    if (!startDate || !endDate) {
      return res.status(400).json({ message: "Start and End date required" });
    }

    const formattedStart = format(new Date(String(startDate)), 'yyyy-MM-dd');
    const formattedEnd = format(new Date(String(endDate)), 'yyyy-MM-dd');

    console.log("Analytics request params:", { startDate, endDate, formattedStart, formattedEnd });

    const data = await storage.getVisits({ startDate: formattedStart, endDate: formattedEnd });
    console.log("Analytics raw data from storage:", data.length, "records");
    
    let csv = "\uFEFFPatient Name,Arrival Time,Condition,Status,Price,Next Step,Date\n";
    data.forEach(v => {
      const arrival = v.arrivalTime ? format(new Date(v.arrivalTime), 'HH:mm') : '--:--';
      csv += `"${v.patientName}","${arrival}","${v.condition}","${v.status}","${(v.price || 0) / 100}","${v.nextStep || ""}","${v.visitDate}"\n`;
    });

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=clinic-export-${formattedStart}-to-${formattedEnd}.csv`);
    res.send(csv);
  });

  const existingVisits = await storage.getVisits({ date: format(new Date(), 'yyyy-MM-dd') });
  if (existingVisits.length === 0) {
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
