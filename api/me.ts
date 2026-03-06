import { requireUser } from "./_lib/auth";
import { json } from "./_lib/http";

export default async function handler(req: any, res: any) {
  if (req.method !== "GET") {
    return json(res, 405, { message: "Method Not Allowed" });
  }

  try {
    const user = await requireUser(req);
    return json(res, 200, {
      user: { claims: { sub: user.id, email: user.email } },
      firstName: user.firstName,
      lastName: user.lastName,
    });
  } catch (err: any) {
    const status = err?.statusCode || 500;
    return json(res, status, { message: err?.message || "Internal server error" });
  }
}

