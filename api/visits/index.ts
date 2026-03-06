import { format } from "date-fns";
import { z } from "zod";
import { api } from "../../shared/routes";
import { requireUser } from "../_lib/auth";
import { json } from "../_lib/http";
import * as storage from "../_lib/storage";

export default async function handler(req: any, res: any) {
  try {
    const user = await requireUser(req);

    if (req.method === api.visits.list.method) {
      const { date: queryDate, range, startDate, endDate } = (req.query || {}) as Record<string, any>;
      const filters: any = { accountId: user.id };

      if (range === "today" || (!range && !queryDate && !startDate)) {
        filters.date = format(new Date(), "yyyy-MM-dd");
      } else if (queryDate) {
        filters.date = String(queryDate);
      } else if (startDate && endDate) {
        filters.startDate = format(new Date(String(startDate)), "yyyy-MM-dd");
        filters.endDate = format(new Date(String(endDate)), "yyyy-MM-dd");
      }

      const result = await storage.getVisits(filters);
      return json(res, 200, result);
    }

    if (req.method === api.visits.create.method) {
      const input = api.visits.create.input.parse(req.body);
      const visit = await storage.createVisit({ ...input, accountId: user.id });
      return json(res, 201, visit);
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

