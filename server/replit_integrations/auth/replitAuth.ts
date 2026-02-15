import session from "express-session";
import type { Express, RequestHandler } from "express";
import connectPg from "connect-pg-simple";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { db } from "../../db";
import { accounts, verificationTokens, passwordResetTokens } from "@shared/schema";
import { eq, and, gt } from "drizzle-orm";
import { sendVerificationEmail, sendPasswordResetEmail } from "../../email.js";

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

function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

function getBaseUrl(req: any): string {
  const protocol = req.headers["x-forwarded-proto"] || req.protocol || "https";
  const host = req.headers["x-forwarded-host"] || req.headers.host;
  return `${protocol}://${host}`;
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());

  app.post("/api/auth/signup", async (req: any, res) => {
    try {
      const { email, password, firstName, lastName } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: "Email et mot de passe requis" });
      }

      if (password.length < 6) {
        return res.status(400).json({ message: "Le mot de passe doit contenir au moins 6 caractères" });
      }

      const existing = await db.select().from(accounts).where(eq(accounts.email, email.toLowerCase().trim()));
      if (existing.length > 0) {
        return res.status(409).json({ message: "Un compte avec cet email existe déjà" });
      }

      const passwordHash = await bcrypt.hash(password, 12);
      const [account] = await db.insert(accounts).values({
        email: email.toLowerCase().trim(),
        passwordHash,
        firstName: firstName || null,
        lastName: lastName || null,
        verified: false,
      }).returning();

      const token = generateToken();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
      await db.insert(verificationTokens).values({
        accountId: account.id,
        token,
        expiresAt,
      });

      const baseUrl = getBaseUrl(req);
      await sendVerificationEmail(account.email, token, baseUrl);

      res.status(201).json({ message: "Compte créé. Vérifiez votre email pour activer votre compte." });
    } catch (err: any) {
      res.status(500).json({ message: "Erreur lors de la création du compte" });
    }
  });

  app.post("/api/auth/login", async (req: any, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: "Email et mot de passe requis" });
      }

      const [account] = await db.select().from(accounts).where(eq(accounts.email, email.toLowerCase().trim()));

      if (!account) {
        return res.status(401).json({ message: "Email ou mot de passe incorrect" });
      }

      const valid = await bcrypt.compare(password, account.passwordHash);
      if (!valid) {
        return res.status(401).json({ message: "Email ou mot de passe incorrect" });
      }

      if (!account.verified) {
        return res.status(403).json({ message: "Veuillez vérifier votre email avant de vous connecter" });
      }

      req.session.account = {
        id: account.id,
        email: account.email,
        firstName: account.firstName,
        lastName: account.lastName,
      };

      req.session.save((err: any) => {
        if (err) {
          return res.status(500).json({ message: "Erreur de session" });
        }
        res.json({
          id: account.id,
          email: account.email,
          firstName: account.firstName,
          lastName: account.lastName,
        });
      });
    } catch (err: any) {
      res.status(500).json({ message: "Erreur de connexion" });
    }
  });

  app.post("/api/auth/logout", (req: any, res) => {
    req.session.destroy((err: any) => {
      if (err) {
        return res.status(500).json({ message: "Erreur de déconnexion" });
      }
      res.json({ message: "Déconnecté" });
    });
  });

  app.get("/api/auth/user", (req: any, res) => {
    if (req.session?.account) {
      return res.json(req.session.account);
    }
    return res.status(401).json({ message: "Non authentifié" });
  });

  app.get("/api/auth/verify-email", async (req: any, res) => {
    try {
      const { token } = req.query;
      if (!token) {
        return res.status(400).json({ message: "Token manquant" });
      }

      const [record] = await db.select().from(verificationTokens)
        .where(and(
          eq(verificationTokens.token, String(token)),
          gt(verificationTokens.expiresAt, new Date())
        ));

      if (!record) {
        return res.status(400).json({ message: "Lien de vérification invalide ou expiré" });
      }

      await db.update(accounts)
        .set({ verified: true })
        .where(eq(accounts.id, record.accountId));

      await db.delete(verificationTokens)
        .where(eq(verificationTokens.accountId, record.accountId));

      res.json({ message: "Email vérifié avec succès. Vous pouvez maintenant vous connecter." });
    } catch (err: any) {
      res.status(500).json({ message: "Erreur de vérification" });
    }
  });

  app.post("/api/auth/resend-verification", async (req: any, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ message: "Email requis" });
      }

      const [account] = await db.select().from(accounts).where(eq(accounts.email, email.toLowerCase().trim()));
      if (!account) {
        return res.json({ message: "Si un compte existe avec cet email, un lien de vérification a été envoyé." });
      }

      if (account.verified) {
        return res.json({ message: "Ce compte est déjà vérifié." });
      }

      await db.delete(verificationTokens).where(eq(verificationTokens.accountId, account.id));

      const token = generateToken();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
      await db.insert(verificationTokens).values({
        accountId: account.id,
        token,
        expiresAt,
      });

      const baseUrl = getBaseUrl(req);
      await sendVerificationEmail(account.email, token, baseUrl);

      res.json({ message: "Si un compte existe avec cet email, un lien de vérification a été envoyé." });
    } catch (err: any) {
      res.status(500).json({ message: "Erreur lors de l'envoi" });
    }
  });

  app.post("/api/auth/forgot-password", async (req: any, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ message: "Email requis" });
      }

      const [account] = await db.select().from(accounts).where(eq(accounts.email, email.toLowerCase().trim()));

      res.json({ message: "Si un compte existe avec cet email, un lien de réinitialisation a été envoyé." });

      if (!account) return;

      await db.delete(passwordResetTokens).where(eq(passwordResetTokens.accountId, account.id));

      const token = generateToken();
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
      await db.insert(passwordResetTokens).values({
        accountId: account.id,
        token,
        expiresAt,
      });

      const baseUrl = getBaseUrl(req);
      await sendPasswordResetEmail(account.email, token, baseUrl);
    } catch (err: any) {
      // silent
    }
  });

  app.post("/api/auth/reset-password", async (req: any, res) => {
    try {
      const { token, password } = req.body;
      if (!token || !password) {
        return res.status(400).json({ message: "Token et mot de passe requis" });
      }

      if (password.length < 6) {
        return res.status(400).json({ message: "Le mot de passe doit contenir au moins 6 caractères" });
      }

      const [record] = await db.select().from(passwordResetTokens)
        .where(and(
          eq(passwordResetTokens.token, String(token)),
          gt(passwordResetTokens.expiresAt, new Date())
        ));

      if (!record) {
        return res.status(400).json({ message: "Lien de réinitialisation invalide ou expiré" });
      }

      const passwordHash = await bcrypt.hash(password, 12);
      await db.update(accounts)
        .set({ passwordHash })
        .where(eq(accounts.id, record.accountId));

      await db.delete(passwordResetTokens)
        .where(eq(passwordResetTokens.accountId, record.accountId));

      res.json({ message: "Mot de passe modifié avec succès." });
    } catch (err: any) {
      res.status(500).json({ message: "Erreur de réinitialisation" });
    }
  });
}

export function registerAuthRoutes(app: Express) {
  // All auth routes are registered in setupAuth
}

export const isAuthenticated: RequestHandler = (req: any, res, next) => {
  if (req.session?.account) {
    return next();
  }
  return res.status(401).json({ message: "Non authentifié" });
};
