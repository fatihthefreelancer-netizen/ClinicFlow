import session from "express-session";
import type { Express, RequestHandler } from "express";
import connectPg from "connect-pg-simple";

const HARDCODED_USERS: Record<string, { id: string; username: string; password: string; firstName: string; lastName: string; role: string }> = {
  "Hakim1": {
    id: "doctor-hakim1",
    username: "Hakim1",
    password: "Docteur1",
    firstName: "Hakim",
    lastName: "Doctor",
    role: "doctor",
  },
  "Assistant1": {
    id: "assistant-1",
    username: "Assistant1",
    password: "Assistant1",
    firstName: "Assistant",
    lastName: "Clinique",
    role: "assistant",
  },
};

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000;
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false,
      maxAge: sessionTtl,
    },
  });
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());

  app.post("/api/login", (req: any, res) => {
    const { username, password } = req.body;
    const account = HARDCODED_USERS[username];

    if (!account || account.password !== password) {
      return res.status(401).json({ message: "Nom d'utilisateur ou mot de passe incorrect" });
    }

    req.session.user = {
      id: account.id,
      username: account.username,
      firstName: account.firstName,
      lastName: account.lastName,
      role: account.role,
    };

    req.session.save((err: any) => {
      if (err) {
        return res.status(500).json({ message: "Erreur de session" });
      }
      res.json({
        id: account.id,
        username: account.username,
        firstName: account.firstName,
        lastName: account.lastName,
        role: account.role,
      });
    });
  });

  app.get("/api/logout", (req: any, res) => {
    req.session.destroy((err: any) => {
      res.redirect("/");
    });
  });
}

export const isAuthenticated: RequestHandler = (req: any, res, next) => {
  if (req.session?.user) {
    return next();
  }
  return res.status(401).json({ message: "Unauthorized" });
};
