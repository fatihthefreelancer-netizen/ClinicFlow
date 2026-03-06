import type { Express, RequestHandler } from "express";
import { supabaseAdmin } from "../../supabase";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        firstName: string | null;
        lastName: string | null;
      };
    }
  }
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
}

export function registerAuthRoutes(app: Express): void {
}

export const isAuthenticated: RequestHandler = async (req: any, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Non authentifié" });
    }

    const token = authHeader.substring(7);
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ message: "Non authentifié" });
    }

    req.user = {
      id: user.id,
      email: user.email || "",
      firstName: user.user_metadata?.firstName || user.user_metadata?.first_name || null,
      lastName: user.user_metadata?.lastName || user.user_metadata?.last_name || null,
    };

    next();
  } catch (err) {
    return res.status(401).json({ message: "Non authentifié" });
  }
};

export function getSession() {
  return (_req: any, _res: any, next: any) => next();
}
