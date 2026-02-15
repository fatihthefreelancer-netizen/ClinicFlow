# ClinicFlow - Medical Clinic Management Platform

## Overview

ClinicFlow is a multi-tenant SaaS web application for clinic management. Each doctor has one private account (email + password), which can be shared with their assistant. The platform features a real-time shared patient board (Live Board), a dashboard with analytics, and Excel export functionality. All data is strictly isolated per account.

The application is built as a full-stack TypeScript project with a React frontend, Express backend, PostgreSQL database, and WebSocket-based real-time updates. The UI is in French, and the currency is Moroccan Dirham (MAD/Dhs).

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
- **Path Aliases**: `@/` maps to `client/src/`, `@shared/` maps to `shared/`

### Backend Architecture
- **Framework**: Express.js running on Node with TypeScript (via tsx)
- **HTTP Server**: Node's built-in `http.createServer` wrapping Express (required for WebSocket support)
- **Real-time**: WebSocket server (ws library) mounted at `/ws` path on the same HTTP server, scoped per account
- **Authentication**: Email + password auth with bcrypt, sessions stored in PostgreSQL via connect-pg-simple
- **Email**: Resend for transactional emails (verification, password reset). Falls back to console.log if RESEND_API_KEY not set.
- **API Pattern**: REST endpoints under `/api/` with Zod schemas for validation (defined in `shared/routes.ts`)
- **Build**: Custom build script using Vite for client and esbuild for server, outputting to `dist/`

### Data Layer
- **Database**: PostgreSQL (required, connection via `DATABASE_URL` environment variable)
- **ORM**: Drizzle ORM with drizzle-zod for schema-to-validation integration
- **Schema Location**: `shared/schema.ts` (main schema) and `shared/models/auth.ts` (auth tables)
- **Migrations**: Drizzle Kit with `drizzle-kit push` for schema synchronization (migrations output to `./migrations`)
- **Multi-tenancy**: All data queries are scoped by `account_id` for strict data isolation

### Database Schema
- **accounts**: Multi-tenant account table (id UUID, email, password_hash, first_name, last_name, verified, created_at)
- **verification_tokens**: Email verification tokens (account_id FK, token, expires_at)
- **password_reset_tokens**: Password reset tokens (account_id FK, token, expires_at)
- **users**: Legacy user table (kept for compatibility) - do not drop
- **sessions**: Session storage table - mandatory, do not drop
- **profiles**: Legacy profiles table (kept for compatibility)
- **visits**: Patient visit records with account_id FK for data isolation, plus fields for patient name, phone, age, mutuelle status, arrival time, condition, status (waiting/in_consultation/done/left), price (in dirhams as integer), next step, visit date

### Authentication & Authorization
- **Method**: Email + password (bcryptjs for hashing)
- **Session**: Server-side sessions stored in PostgreSQL `sessions` table via connect-pg-simple
- **Account model**: One account = one login (email + password), shared between doctor and assistant
- **Concurrent sessions**: Supported - same account can be logged in from multiple devices
- **Email verification**: Required before login, via verification token sent by Resend
- **Password reset**: Via reset token sent by Resend, expires in 1 hour
- **Auth files**: Located in `server/replit_integrations/auth/`
- **Email service**: `server/email.ts` - uses Resend SDK, falls back to console.log if API key not set

### Auth Routes
- `POST /api/auth/signup` - Create new account
- `POST /api/auth/login` - Sign in
- `POST /api/auth/logout` - Sign out
- `GET /api/auth/user` - Get current session user
- `GET /api/auth/verify-email?token=` - Verify email
- `POST /api/auth/resend-verification` - Resend verification email
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password with token

### Real-time Communication
- **Protocol**: WebSocket at `/ws` endpoint
- **Pattern**: Server broadcasts visit create/update/delete events scoped to the same account_id
- **Client handling**: `use-websocket.ts` hook authenticates with account ID on connect, parses messages and updates React Query cache directly
- **Account scoping**: WebSocket connections are tracked per account_id, broadcasts only go to the same account

### Key Pages
1. **Login** (`/login`): Email + password sign-in page
2. **SignUp** (`/signup`): Registration page with email, password, clinic name
3. **ForgotPassword** (`/forgot-password`): Password reset request page
4. **ResetPassword** (`/reset-password?token=`): New password entry page
5. **VerifyEmail** (`/verify-email?token=`): Email verification page
6. **LiveBoard** (`/`): Main patient queue table for the current day, with search, date picker, add patient dialog, edit dialog, summary stat cards, and Excel export
7. **Dashboard** (`/dashboard`): Analytics page with a 30-day line chart and KPIs
8. **Support** (`/support`): Contact support page

### Shared Code (`shared/`)
- `schema.ts`: Drizzle table definitions and Zod insert schemas
- `routes.ts`: API route definitions with Zod response schemas, used by both client and server
- `models/auth.ts`: Auth-specific table definitions (accounts, sessions, users, tokens)

### Build & Dev
- **Dev**: `npm run dev` - runs tsx with Vite dev server middleware for HMR
- **Build**: `npm run build` - Vite builds client to `dist/public`, esbuild bundles server to `dist/index.cjs`
- **Production**: `npm start` - runs the bundled server which serves static files from `dist/public`
- **DB Push**: `npm run db:push` - pushes schema changes to database via Drizzle Kit

## External Dependencies

### Required Services
- **PostgreSQL Database**: Connected via `DATABASE_URL` environment variable. Used for all data storage including sessions, accounts, and visits

### Optional Services
- **Resend**: For transactional emails (verification, password reset). Set `RESEND_API_KEY` secret and optionally `RESEND_FROM_EMAIL` env var. Falls back to console logging if not configured.

### Key npm Packages
- **drizzle-orm** + **drizzle-kit**: Database ORM and migration tooling
- **express** + **ws**: HTTP server and WebSocket
- **bcryptjs**: Password hashing
- **resend**: Transactional email service
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

### Optional Environment Variables
- `RESEND_API_KEY`: Resend API key for sending emails (secret)
- `RESEND_FROM_EMAIL`: Sender email address for transactional emails (defaults to `ClinicFlow <onboarding@resend.dev>`)
