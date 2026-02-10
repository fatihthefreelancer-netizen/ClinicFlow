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
  await setupAuth(app);
  registerAuthRoutes(app);

  const wss = new WebSocketServer({ server: httpServer, path: "/ws" });

  const broadcast = (message: any) => {
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(message));
      }
    });
  };

  wss.on("connection", (ws) => {
    ws.on("close", () => {});
  });

  app.get(api.auth.me.path, isAuthenticated, async (req: any, res) => {
    const user = req.session.user;
    res.json({
      user: { claims: { sub: user.id, first_name: user.firstName, last_name: user.lastName } },
      role: user.role,
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
      const input = api.visits.update.input.parse(req.body);
      const visit = await storage.updateVisit(id, input);
      
      broadcast({ type: "UPDATE", data: visit });
      res.json(visit);
    } catch (err: any) {
        if (err instanceof z.ZodError) {
            res.status(400).json({ message: err.errors[0].message });
        } else {
            res.status(500).json({ message: err?.message || "Internal server error" });
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
    const { startDate, endDate } = req.query;
    if (!startDate || !endDate) {
      return res.status(400).json({ message: "Start and End date required" });
    }

    const formattedStart = format(new Date(String(startDate)), 'yyyy-MM-dd');
    const formattedEnd = format(new Date(String(endDate)), 'yyyy-MM-dd');

    const stats = await storage.getAnalytics(formattedStart, formattedEnd);
    res.json(stats);
  });

  app.get("/api/export", isAuthenticated, async (req: any, res) => {
    const { startDate, endDate } = req.query;
    if (!startDate || !endDate) {
      return res.status(400).json({ message: "Start and End date required" });
    }

    const formattedStart = format(new Date(String(startDate)), 'yyyy-MM-dd');
    const formattedEnd = format(new Date(String(endDate)), 'yyyy-MM-dd');

    const data = await storage.getVisits({ startDate: formattedStart, endDate: formattedEnd });
    
    let csv = "\uFEFFArrivée,Nom du patient,Âge,Condition,Statut,Mutuelle,Mutuelle Remplie,Prix,Étape Suivante,Date\n";
    data.forEach(v => {
      const arrival = v.arrivalTime ? format(new Date(v.arrivalTime), 'HH:mm') : '--:--';
      csv += `"${arrival}","${v.patientName}","${v.age ?? ""}","${v.condition}","${v.status}","${v.mutuelle}","${v.mutuelleRemplie}","${v.price || 0}","${v.nextStep || ""}","${v.visitDate}"\n`;
    });

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=clinic-export-${formattedStart}-to-${formattedEnd}.csv`);
    res.send(csv);
  });

  return httpServer;
}
