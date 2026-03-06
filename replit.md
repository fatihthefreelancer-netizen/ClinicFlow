# ClinicFlow - Medical Clinic Management Platform

## Overview

ClinicFlow is a multi-tenant SaaS web application for clinic management. Each doctor has one private account (email + password), which can be shared with their assistant. The platform features a real-time shared patient board (Live Board), a dashboard with analytics, and Excel export functionality. All data is strictly isolated per account.

The application is built as a full-stack TypeScript project with a React frontend, Express backend, Supabase PostgreSQL database, Supabase Auth for authentication, and WebSocket-based real-time updates. The UI is in French, and the currency is Moroccan Dirham (MAD/Dhs).

## User Preferences

Preferred communication style: Simple, everyday language.

## CRITICAL DATA SAFETY RULES
This application uses real medical data.
The AI agent must NEVER modify, reset, seed, mock, or delete any database records.

### Database access rules
- The AI is allowed to:
    - READ data
    - QUERY data
    - AGGREGATE data for statistics and dashboards
- The AI is strictly FORBIDDEN to:
    - Insert patients automatically
    - Delete any patient records
    - Update existing patient records
    - Reset or recreate the database
    - Replace existing data with new data
    - Seed or mock patients for testing

### Patient creation rules
- Patients can ONLY be created by:
    - a doctor
    - or an assistant
- The system must NEVER auto-create patients.

### Daily workflow logic
- Each patient belongs to a specific date.
- Each day starts with an empty patient list.
- During the day, doctors or assistants may:
    - add
    - edit
    - delete patients
- When a new day starts:
    - the previous day's data remains accessible
    - previous data is immutable
    - a new empty day is created if it does not exist

### Absolute rule
If a feature requires modifying database content automatically, DO NOT IMPLEMENT IT.
Ask for explicit confirmation instead.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript, bundled via Vite
- **Routing**: Wouter (lightweight client-side router)
- **State Management**: TanStack React Query for server state, with WebSocket for real-time cache updates
- **UI Components**: shadcn/ui (New York style) built on Radix UI primitives with Tailwind CSS
- **Charts**: Recharts for the analytics dashboard
- **Forms**: React Hook Form with Zod resolvers for validation
- **Excel Export**: xlsx library for client-side .xlsx file generation
- **Auth Client**: @supabase/supabase-js for client-side authentication
- **Path Aliases**: `@/` maps to `client/src/`, `@shared/` maps to `shared/`

### Backend Architecture
- **Framework**: Express.js running on Node with TypeScript (via tsx)
- **HTTP Server**: Node's built-in `http.createServer` wrapping Express (required for WebSocket support)
- **Real-time**: WebSocket server (ws library) mounted at `/ws` path on the same HTTP server, scoped per account
- **Authentication**: Supabase Auth with JWT token verification via `@supabase/supabase-js` admin client
- **API Pattern**: REST endpoints under `/api/` with Zod schemas for validation (defined in `shared/routes.ts`)
- **Build**: Custom build script using Vite for client and esbuild for server, outputting to `dist/`

### Data Layer
- **Database**: Supabase PostgreSQL (connected via `SUPABASE_DB_URL` environment variable, falls back to `DATABASE_URL`)
- **ORM**: Drizzle ORM with drizzle-zod for schema-to-validation integration
- **Schema Location**: `shared/schema.ts` (main schema) and `shared/models/auth.ts` (user table)
- **Migrations**: Drizzle Kit with `drizzle-kit push` for schema synchronization (migrations output to `./migrations`)
- **Multi-tenancy**: All data queries are scoped by `account_id` (Supabase Auth user ID) for strict data isolation

### Database Schema
- **visits**: Patient visit records with account_id (Supabase Auth user UUID) for data isolation, plus fields for patient name, phone, age, mutuelle status, arrival time, condition, status (waiting/in_consultation/done/left), price (in dirhams as integer), next step, visit date
- **profiles**: User profiles table with role (doctor/assistant)
- **users**: Lightweight user table for local profile data

### Authentication & Authorization
- **Method**: Supabase Auth (email + password, JWT-based)
- **Frontend**: Supabase JS client handles signup, login, logout, email verification, password reset
- **Backend**: JWT verification via Supabase admin client (`SUPABASE_SERVICE_ROLE_KEY`). Bearer token sent in `Authorization` header on every API request.
- **Account model**: One Supabase Auth user = one login (email + password), shared between doctor and assistant
- **Concurrent sessions**: Supported via Supabase Auth session management
- **Email verification**: Handled by Supabase Auth (sends verification emails automatically)
- **Password reset**: Handled by Supabase Auth (sends reset emails automatically)
- **Auth files**: `server/replit_integrations/auth/replitAuth.ts` (middleware), `server/supabase.ts` (admin client), `client/src/lib/supabase.ts` (frontend client)
- **User metadata**: firstName and lastName stored in Supabase Auth user_metadata

### Auth Flow
- Frontend calls Supabase Auth directly for signup/login/logout/password-reset
- Supabase returns JWT access token on successful login
- All API requests include `Authorization: Bearer <token>` header
- Backend `isAuthenticated` middleware verifies token with Supabase admin client
- User info (id, email, firstName, lastName) extracted from verified token and attached to `req.user`

### Real-time Communication
- **Protocol**: WebSocket at `/ws` endpoint
- **Pattern**: Server broadcasts visit create/update/delete events scoped to the same account_id
- **Client handling**: `use-websocket.ts` hook authenticates with Supabase access token on connect, parses messages and updates React Query cache directly
- **Account scoping**: Server verifies the token and extracts user ID, broadcasts only go to the same account

### Key Pages
1. **Login** (`/login`): Email + password sign-in page (via Supabase Auth)
2. **SignUp** (`/signup`): Registration page with email, password, clinic name (via Supabase Auth)
3. **ForgotPassword** (`/forgot-password`): Password reset request page (via Supabase Auth)
4. **ResetPassword** (`/reset-password`): New password entry page (handles Supabase recovery redirect)
5. **VerifyEmail** (`/verify-email`): Email verification page (handles Supabase verification redirect)
6. **LiveBoard** (`/`): Main patient queue table for the current day, with search, date picker, add patient dialog, edit dialog, summary stat cards, and Excel export
7. **Dashboard** (`/dashboard`): Analytics page with a 30-day line chart and KPIs
8. **Support** (`/support`): Contact support page

### Shared Code (`shared/`)
- `schema.ts`: Drizzle table definitions and Zod insert schemas
- `routes.ts`: API route definitions with Zod response schemas, used by both client and server
- `models/auth.ts`: User table definition

### Build & Dev
- **Dev**: `npm run dev` - runs tsx with Vite dev server middleware for HMR
- **Build**: `npm run build` - Vite builds client to `dist/public`, esbuild bundles server to `dist/index.cjs`
- **Production**: `npm start` - runs the bundled server which serves static files from `dist/public`
- **DB Push**: `npm run db:push` - pushes schema changes to database via Drizzle Kit

## External Dependencies

### Required Services
- **Supabase**: PostgreSQL database + Auth service. Project URL: https://zgiexxygdsjmethtaewg.supabase.co

### Key npm Packages
- **drizzle-orm** + **drizzle-kit**: Database ORM and migration tooling
- **express** + **ws**: HTTP server and WebSocket
- **@supabase/supabase-js**: Supabase client for auth and database
- **@tanstack/react-query**: Server state management
- **recharts**: Dashboard charts
- **xlsx**: Excel file export
- **zod** + **drizzle-zod**: Schema validation
- **shadcn/ui** components (Radix UI + Tailwind CSS)
- **wouter**: Client-side routing
- **date-fns**: Date manipulation

### Environment Variables Required
- `SUPABASE_DB_URL`: Supabase PostgreSQL connection string (pooler mode)
- `SUPABASE_URL`: Supabase project URL
- `SUPABASE_ANON_KEY`: Supabase public/anon API key
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase service role key (secret, server-side only)
- `VITE_SUPABASE_URL`: Supabase project URL (exposed to frontend)
- `VITE_SUPABASE_ANON_KEY`: Supabase public/anon API key (exposed to frontend)
