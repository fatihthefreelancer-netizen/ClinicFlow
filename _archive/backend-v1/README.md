# Backend v1 archive

This folder contains files from the previous backend/database/serverless implementation of ClinicFlow, archived at the end of Phase 1 (frontend-only prototype).

**Contents:**
- `supabase-reset.sql` – Supabase schema for visits table, RLS, realtime
- `shared/routes.ts` – API route definitions (/api/me, /api/visits, /api/analytics)
- `shared/models/auth.ts` – Drizzle users table definition
- `drizzle.config.ts` – Drizzle Kit config for migrations
- `replit.md` – Project documentation (old full-stack architecture)
- `.local/skills/` – Cursor/Replit skills (references to Express, DB, etc.)

The active project is now: **frontend UI + Supabase Auth + mock data only**. No database queries, backend routes, or serverless functions remain in the main tree.
