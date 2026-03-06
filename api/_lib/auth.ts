import { supabaseAdmin } from "./supabaseAdmin";

export type AuthUser = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
};

function extractBearerToken(req: any): string | null {
  const authHeader: string | undefined =
    req?.headers?.authorization ?? req?.headers?.Authorization;
  if (!authHeader || typeof authHeader !== "string") return null;
  if (!authHeader.startsWith("Bearer ")) return null;
  return authHeader.substring(7);
}

export async function requireUser(req: any): Promise<AuthUser> {
  const token = extractBearerToken(req);
  if (!token) {
    const err = new Error("Non authentifié");
    (err as any).statusCode = 401;
    throw err;
  }

  const {
    data: { user },
    error,
  } = await supabaseAdmin.auth.getUser(token);

  if (error || !user) {
    const err2 = new Error("Non authentifié");
    (err2 as any).statusCode = 401;
    throw err2;
  }

  return {
    id: user.id,
    email: user.email || "",
    firstName: (user.user_metadata as any)?.firstName || (user.user_metadata as any)?.first_name || null,
    lastName: (user.user_metadata as any)?.lastName || (user.user_metadata as any)?.last_name || null,
  };
}

