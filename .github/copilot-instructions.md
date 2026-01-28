# Elexis Appointments - AI Coding Agent Instructions

## Project Overview
Medical appointment booking system with Bun runtime backend and Svelte 5 frontend. Integrates with Elexis database (MySQL) for managing patient appointments via web interface.

## Architecture & Tech Stack

### Backend (Root)
- **Runtime**: Bun (not Node.js) - use `bun` commands, not `npm`
- **Framework**: MikroRest (`@rgwch/mikrorest`) - lightweight REST API server
- **Database**: Direct SQL queries via `bun:sql` - no ORM
- **Entry Point**: `index.ts` (business logic) → imported by `server.ts` (HTTP layer)
- **Email**: nodemailer for appointment confirmations with iCal attachments

### Frontend (`/frontend/`)
- **Framework**: Svelte 5 + TypeScript + Vite
- **I18n**: svelte-i18n with JSON files in `src/lib/i18n/` (de, en, fr, it, pt, ru, sr, ta)
- **Build**: Vite builds to `frontend/dist`, served statically by backend

### Database Integration
- Uses Elexis database schema (Swiss medical practice management software)
- Direct SQL queries, no migrations - database schema is managed externally
- Key tables: `agntermine` (appointments), `kontakt` (patients/contacts)
- Key fields: `terminstatus` (appointment state), `deleted` (soft delete flag)
- Date format: Elexis uses `YYYYMMDD` strings (e.g., `20260125`), convert with `elexisdateFromDate()`

## Critical Developer Workflows

### Development
```bash
# Backend dev (from root)
bun index.ts

# Frontend dev (from frontend/)
cd frontend && bun run dev
```

### Production Build
```bash
# Build frontend first
cd frontend && bun install && bun run build
cd ..

# Create standalone executables
bun install
bun build --compile --minify --target=bun-linux-x64 ./index.ts --outfile termine-linux-x64
bun build --compile --minify --target=bun-windows-x64 ./index.ts --outfile termine-windows-x64
bun build --compile --minify --target=bun-darwin-x64 ./index.ts --outfile termine-macos-x64
bun build --compile --minify --target=bun-darwin-arm64 ./index.ts --outfile termine-macos-arm64
```

### Testing Changes
- Backend runs on port specified by `PORT` env var (default: 3000)
- Frontend dev mode uses `VITE_PORT` env var for connecting to backend
- Frontend dev server typically runs on port 5173 (Vite default)

## Key Patterns & Conventions

### Environment Configuration (Required)
Uses `dotenv`. Essential variables (see `.env.sample` for template):
- `database` - MySQL connection string (format: `mysql://user:pass@host/dbname`)
- `bereich` - appointment area/resource name (default: "Arzt")
- `minFreeMinutes` - minimum consecutive free minutes for slot (default: 30)
- `maxPerDay` - max free slots shown per day (default: 5)
- `defaultAppointmentDuration` - default booking duration in minutes (default: 15)
- `TerminTyp` - appointment type label (default: "Internet")
- `CreatedState` - status for new appointments (default: "scheduled")
- `CancelledState` - status for cancelled appointments (default: "cancelled")
- `workStart`, `workEnd` - work hours in 24-hour format (default: 8, 18)
- `PORT` - backend server port (default: 3000)
- `VITE_PORT` - frontend dev mode backend port (default: 3000)
- `MICROREST_JWT_SECRET` - JWT signing secret (required for auth)
- `URL` - public URL for email verification links
- `SMTP_SERVER`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD` - email config
- `EMAIL_FROM` - sender email address
- `EMAIL_TEMPLATES_PATH` - optional path to custom email templates JSON file (default: `email-templates.json` in root)

### Authentication Pattern
- **Two-step verification**: Initial login with birthdate + email, then email token verification
- Step 1: `checkAccess()` validates credentials against Elexis `kontakt` table
- Step 2: `sendToken()` emails verification token, `verifyToken()` validates it
- Uses MikroRest's JWT auth via `server.handleLogin()` for initial access
- Token verification upgrades JWT to include `verified: true` flag
- Frontend stores JWT token, includes in all API requests via `Authorization: Bearer <token>`
- Verified users can delete appointments; non-verified can only view/book

### Appointment Slot Algorithm (index.ts)
1. Queries `agntermine` table for taken slots on given date with `deleted="0"`
2. Calculates free slots in work hours (configurable via `workStart` and `workEnd` env vars)
3. Only shows slots with `minFreeMinutes` consecutive availability
4. Limits results to `maxPerDay`, prioritizing earliest/latest + random middle slots
5. Returns minutes from midnight (e.g., 480 = 08:00, 540 = 09:00)

### Date Handling
- Frontend uses Luxon (`DateTime`) for date manipulation
- Backend uses native `Date` then converts to Elexis format via `elexisdateFromDate()`
- API exchanges ISO date strings, internal DB uses `YYYYMMDD` format
- Time stored as minutes from midnight in `beginn` field (e.g., 480 = 08:00)

### Type Safety
- Shared types in root `types.d.ts` - frontend imports with `../../../types.d`
- Both backend and frontend use same type definitions for `termin` and `user`
- Key types: `termin` (appointment), `user` (patient with verified flag)

### Soft Delete Pattern
- Appointments are never hard-deleted from database
- Deletion updates `terminstatus` field to `CancelledState` value (default: "abgesagt")
- Queries filter by `deleted="0"` AND `terminstatus!=${CancelledState}`

## API Endpoints

All endpoints except `/api/checkaccess` require JWT authentication via `server.authorize` middleware.

### POST `/api/checkaccess`
- Login endpoint via `server.handleLogin()`
- Body: `{ username: email, password: birthdate (YYYY-MM-DD) }`
- Returns: `{ token: jwt, user: { id, lastname, firstname, mail, verified: false } }`

### GET `/api/sendtoken`
- Sends email verification token to logged-in user
- Requires: JWT token (non-verified)
- Sends email with verification link containing token

### GET `/api/verifytoken`
- Query params: `token` (from email link)
- Returns: `{ token: jwt (with verified: true), user: { ... } }`
- Requires: JWT token

### GET `/api/getfreeslotsat`
- Query params: `date` (ISO string)
- Returns: `{ freeSlots: number[] }` (minutes from midnight)
- Requires: JWT token

### POST `/api/takeslot`
- Body: `{ date: ISO string, startMinute: number, duration: number, patId: string }`
- Returns: `termin` object
- Requires: JWT token

### GET `/api/findappointments`
- Query params: `patId` (patient ID)
- Returns: `termin[]` array sorted by date/time descending
- Filters out deleted and cancelled appointments
- Requires: JWT token

### POST `/api/deleteappointment`
- Body: `{ appid: string, patId: string }`
- Updates `terminstatus` to `CancelledState` (soft delete)
- Returns: `{ success: true }`
- Requires: JWT token with `verified: true`

### GET `/api/sendconfirmation`
- Query params: `id` (appointment ID)
- Sends email confirmation with iCal attachment to patient
- Requires: JWT token

## Adding Features

### New API Endpoint
1. Add handler in `server.ts` using `server.addRoute()` or `server.handleLogin()`
2. Export business logic function from `index.ts`
3. Add client function to `frontend/src/lib/io.ts`
4. Always close SQL connection in try/finally block with `db.close()` or `db?.close()`

### New Configuration
1. Add to `.env.sample` with documentation
2. Use with default fallback: `process.env.VAR_NAME || "default"`
3. Update this documentation with new variable

### Frontend Translations
1. Add key to `frontend/src/lib/i18n/de.json` (primary language)
2. Run `bun run i18n` from frontend directory to sync to other languages (en, fr, it, pt, ru, sr, ta)
3. Use `$_('key')` in Svelte components to access translations

### Content Management
- Disclaimer files in `frontend/src/lib/content/` for all supported languages
- All disclaimer files should have consistent structure with translation note and copyright
- Primary language is German (`disclaimer.de.md`) - other languages are machine translations
- Translation note explains that translations are automated and encourages error reporting

### Email Templates
- Email content configured in `email-templates.json` (customizable via `EMAIL_TEMPLATES_PATH` env var)
- Template system in `email-templates.ts` with simple `{{variable}}` replacement
- Three template types: `token` (verification email), `confirmation` (appointment confirmation), `ical` (calendar event details)
- iCal generation uses `ical-generator` package
- Mailer class in `mailer.ts` handles SMTP connection

## Testing
Tests created using Bun's test runner:
- `index.test.ts` - tests for business logic functions (getFreeSlotsAt, takeSlot, checkAccess, etc.)
- `server.test.ts` - tests for HTTP endpoints and authentication

Run tests with:
```bash
bun test
```

Note: Many tests require a running test database. Tests will skip gracefully if database is not available.

## Common Pitfalls
- Don't use `npm` commands - this is a Bun project (use `bun` instead)
- SQL connections must be closed manually - always use try/finally with `db.close()` or `db?.close()`
- Elexis date strings are `YYYYMMDD` format, not ISO - use `elexisdateFromDate()` conversion
- Frontend must build before creating standalone executable
- MikroRest authorization requires `server.authorize` middleware in route definition
- Authentication username/password are swapped: username=email, password=birthdate
- Appointments use soft delete via `terminstatus` field, not `deleted` field
- Port defaults differ: backend defaults to 3000, not 3341
- Email token verification requires two-step process: login → email token → verify token
