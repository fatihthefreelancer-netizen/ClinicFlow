# ClinicFlow - Medical Clinic Management Platform

## Overview

ClinicFlow is a web-based internal clinic management platform designed for coordination between a doctor and their assistant during daily consultations. It features a real-time shared patient board (Live Board), role-based access control (doctor vs assistant), a dashboard with analytics, and Excel export functionality.

The application is built as a full-stack TypeScript project with a React frontend, Express backend, PostgreSQL database, and WebSocket-based real-time updates. The UI is in French, and the currency is Moroccan Dirham (MAD/Dhs).

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript, bundled via Vite
- **Routing**: Wouter (lightweight client-side router)
- **State Management**: TanStack React Query for server state, with WebSocket for real-time cache updates
- **UI Components**: shadcn/ui (New York style) built on Radix UI primitives with Tailwind CSS
- **Charts**: Recharts for the analytics dashboard
- **Forms**: React Hook Form with Zod resolvers for validation
- **Excel Export**: xlsx library for client-side .xlsx file generation
- **Path Aliases**: `@/` maps to `client/src/`, `@shared/` maps to `shared/`

### Backend Architecture
- **Framework**: Express.js running on Node with TypeScript (via tsx)
- **HTTP Server**: Node's built-in `http.createServer` wrapping Express (required for WebSocket support)
- **Real-time**: WebSocket server (ws library) mounted at `/ws` path on the same HTTP server
- **Authentication**: Replit OpenID Connect (OIDC) auth with Passport.js, sessions stored in PostgreSQL via connect-pg-simple
- **API Pattern**: REST endpoints under `/api/` with Zod schemas for validation (defined in `shared/routes.ts`)
- **Build**: Custom build script using Vite for client and esbuild for server, outputting to `dist/`

### Data Layer
- **Database**: PostgreSQL (required, connection via `DATABASE_URL` environment variable)
- **ORM**: Drizzle ORM with drizzle-zod for schema-to-validation integration
- **Schema Location**: `shared/schema.ts` (main schema) and `shared/models/auth.ts` (auth tables)
- **Migrations**: Drizzle Kit with `drizzle-kit push` for schema synchronization (migrations output to `./migrations`)

### Database Schema
- **users**: Replit Auth user table (id, email, name, profile image) - mandatory, do not drop
- **sessions**: Session storage table for Replit Auth - mandatory, do not drop
- **profiles**: Links users to roles (doctor or assistant), references users table
- **visits**: Patient visit records with fields for patient name, age, mutuelle status, arrival time, condition, status (waiting/in_consultation/done/left), price (in dirhams as integer), next step, visit date, and last updated by

### Authentication & Authorization
- **Method**: Replit Auth (OpenID Connect) - no custom username/password
- **Session**: Server-side sessions stored in PostgreSQL `sessions` table
- **Roles**: Two roles - "doctor" (full access including analytics, exports, price editing) and "assistant" (limited to basic patient data entry)
- **Auto-provisioning**: First user gets "doctor" role, subsequent users get "assistant" role automatically
- **Auth files**: Located in `server/replit_integrations/auth/`

### Real-time Communication
- **Protocol**: WebSocket at `/ws` endpoint
- **Pattern**: Server broadcasts visit create/update/delete events to all connected clients
- **Client handling**: `use-websocket.ts` hook parses messages and updates React Query cache directly for instant UI updates without refetching

### Key Pages
1. **LiveBoard** (`/`): Main patient queue table for the current day, with search, date picker, add patient dialog, edit dialog, and Excel export
2. **Dashboard** (`/dashboard`): Doctor-only analytics page with a 30-day line chart (total patients, mutuelle, mutuelle remplie) and KPIs (average patients/day, average consultation price for current month)
3. **Login**: Replit Auth login page

### Shared Code (`shared/`)
- `schema.ts`: Drizzle table definitions and Zod insert schemas
- `routes.ts`: API route definitions with Zod response schemas, used by both client and server
- `models/auth.ts`: Auth-specific table definitions (users, sessions)

### Build & Dev
- **Dev**: `npm run dev` - runs tsx with Vite dev server middleware for HMR
- **Build**: `npm run build` - Vite builds client to `dist/public`, esbuild bundles server to `dist/index.cjs`
- **Production**: `npm start` - runs the bundled server which serves static files from `dist/public`
- **DB Push**: `npm run db:push` - pushes schema changes to database via Drizzle Kit

## External Dependencies

### Required Services
- **PostgreSQL Database**: Connected via `DATABASE_URL` environment variable. Used for all data storage including sessions, users, profiles, and visits
- **Replit Auth (OIDC)**: OpenID Connect provider at `https://replit.com/oidc`, requires `REPL_ID` and `SESSION_SECRET` environment variables

### Key npm Packages
- **drizzle-orm** + **drizzle-kit**: Database ORM and migration tooling
- **express** + **ws**: HTTP server and WebSocket
- **passport** + **openid-client**: Authentication
- **connect-pg-simple**: PostgreSQL session store
- **@tanstack/react-query**: Server state management
- **recharts**: Dashboard charts
- **xlsx**: Excel file export
- **zod** + **drizzle-zod**: Schema validation
- **shadcn/ui** components (Radix UI + Tailwind CSS)
- **wouter**: Client-side routing
- **date-fns**: Date manipulation

### Environment Variables Required
- `DATABASE_URL`: PostgreSQL connection string
- `SESSION_SECRET`: Secret for session encryption
- `REPL_ID`: Replit environment identifier (auto-set in Replit)
- `ISSUER_URL`: OIDC issuer URL (defaults to `https://replit.com/oidc`)