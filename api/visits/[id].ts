import { z } from "zod";
import { api } from "../../shared/routes";
import { requireUser } from "../_lib/auth";
import { getIntParam, json } from "../_lib/http";
import * as storage from "../_lib/storage";

export default async function handler(req: any, res: any) {
  try {
    const user = await requireUser(req);
    const id = getIntParam(req.query?.id);
    if (!id) return json(res, 400, { message: "Invalid id" });

    if (req.method === api.visits.get.method) {
      const visit = await storage.getVisit(id);
      if (!visit || (visit as any).accountId !== user.id) {
        return json(res, 404, { message: "Visit not found" });
      }
      return json(res, 200, visit);
    }

    if (req.method === api.visits.update.method) {
      const existing = await storage.getVisit(id);
      if (!existing || (existing as any).accountId !== user.id) {
        return json(res, 404, { message: "Visit not found" });
      }

      const input = api.visits.update.input.parse(req.body);
      const visit = await storage.updateVisit(id, input);
      return json(res, 200, visit);
    }

    if (req.method === api.visits.delete.method) {
      const existing = await storage.getVisit(id);
      if (!existing || (existing as any).accountId !== user.id) {
        return json(res, 404, { message: "Visit not found" });
      }
      await storage.deleteVisit(id);
      res.statusCode = 204;
      return res.end();
    }

    return json(res, 405, { message: "Method Not Allowed" });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return json(res, 400, { message: err.errors[0]?.message || "Validation error" });
    }
    const status = err?.statusCode || 500;
    return json(res, status, { message: err?.message || "Internal server error" });
  }
}

