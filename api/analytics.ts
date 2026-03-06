import { format } from "date-fns";
import { api } from "../shared/routes";
import { requireUser } from "./_lib/auth";
import { json } from "./_lib/http";
import * as storage from "./_lib/storage";

export default async function handler(req: any, res: any) {
  if (req.method !== api.analytics.get.method) {
    return json(res, 405, { message: "Method Not Allowed" });
  }

  try {
    const user = await requireUser(req);
    const { startDate, endDate } = (req.query || {}) as Record<string, any>;
    if (!startDate || !endDate) {
      return json(res, 400, { message: "Start and End date required" });
    }

    const formattedStart = format(new Date(String(startDate)), "yyyy-MM-dd");
    const formattedEnd = format(new Date(String(endDate)), "yyyy-MM-dd");

    const stats = await storage.getAnalytics(formattedStart, formattedEnd, user.id);
    return json(res, 200, stats);
  } catch (err: any) {
    const status = err?.statusCode || 500;
    return json(res, status, { message: err?.message || "Internal server error" });
  }
}

