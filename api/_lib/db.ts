import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "../../shared/schema";

const { Pool } = pg;

const connectionString = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("SUPABASE_DB_URL or DATABASE_URL must be set");
}

declare global {
  // eslint-disable-next-line no-var
  var __clinicflowPool: pg.Pool | undefined;
}

const pool = globalThis.__clinicflowPool ?? new Pool({ connectionString });
globalThis.__clinicflowPool = pool;

export const db = drizzle(pool, { schema });

