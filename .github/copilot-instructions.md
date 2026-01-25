# Elexis Appointments - AI Coding Agent Instructions

## Project Overview
Medical appointment booking system with Bun runtime backend and Svelte frontend. Integrates with Elexis database (MySQL) for managing patient appointments via web interface.

## Architecture & Tech Stack

### Backend (Root)
- **Runtime**: Bun (not Node.js) - use `bun` commands, not `npm`
- **Framework**: MikroRest (`@rgwch/mikrorest`) - lightweight REST API server
- **Database**: Direct SQL queries via `bun:sql` - no ORM
- **Entry Point**: `index.ts` (business logic) → imported by `server.ts` (HTTP layer)

### Frontend (`/frontend/`)
- **Framework**: Svelte 5 + TypeScript + Vite
- **I18n**: svelte-i18n with JSON files in `src/lib/i18n/` (de, en, fr, it, pt, ru, sr)
- **Build**: Vite builds to `frontend/dist`, served statically by backend

### Database Integration
- Uses Elexis database schema (Swiss medical practice management software)
- Direct SQL queries, no migrations - database schema is managed externally
- Key tables: `agntermine` (appointments), `kontakt` (patients/contacts)
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

# Create standalone executable
bun install
bun build ./index.ts --compile --outfile termine
```

### Testing Changes
Frontend connects to backend on port specified by `process.env.PORT` (default 3341). Frontend dev mode uses `VITE_PORT` env var.

## Key Patterns & Conventions

### Environment Configuration (Required)
Uses `dotenv`. Essential variables (all read from `.env` file):
- `database` - MySQL connection string (format: `mysql://user:pass@host/dbname`)
- `bereich` - appointment area/resource name (default: "Arzt")
- `minFreeMinutes` - minimum consecutive free minutes for slot (default: 30)
- `maxPerDay` - max free slots shown per day (default: 5)
- `defaultAppointmentDuration` - default booking duration in minutes (default: 15)
- `TerminTyp` - appointment type label (default: "Normal")
- `PORT` - server port (default: 3341)
- `SMTPUSER`, `SMTPPASSWORD` - email credentials (planned for appointment confirmations)
- **TODO**: `workStart`, `workEnd` - work hours currently hardcoded (8:00-18:00) in `getFreeSlotsAt()`

### Authentication Pattern
- Uses MikroRest's built-in JWT auth via `server.handleLogin()`
- Patients authenticate with birthdate (YYYY-MM-DD) + email
- Backend validates against Elexis `kontakt` table in `checkAccess()`
- Frontend stores JWT token, includes in all API requests via `Authorization: Bearer <token>`

### Appointment Slot Algorithm (index.ts)
1. Queries `agntermine` table for taken slots on given date
2. Calculates free slots in work hours (currently hardcoded 8:00-18:00, should be configurable)
3. Only shows slots with `minFreeMinutes` consecutive availability
4. Limits results to `maxPerDay`, prioritizing earliest/latest + random middle slots

### Date Handling
- Frontend uses Luxon (`DateTime`) for date manipulation
- Backend uses native `Date` then converts to Elexis format via `elexisdateFromDate()`
- API exchanges ISO date strings, internal DB uses `YYYYMMDD` format

### Type Safety
- Shared types in root `types.d.ts` - frontend imports with `../../../types.d`
- Both backend and frontend use same type definitions for `termin` and `user`

## API Endpoints

All endpoints except `/api/checkaccess` require JWT authentication via `server.authorize` middleware.

### POST `/api/checkaccess`
- Login endpoint via `server.handleLogin()`
- Body: `{ username: birthdate (YYYY-MM-DD), password: email }`
- Returns: `{ token: jwt, user: { id, lastname, firstname, mail } }`

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
- Returns: `termin[]` array
- Requires: JWT token

### POST `/api/deleteappointment`
- Body: `{ appid: string, patId: string }`
- Marks appointment as deleted (soft delete: sets `deleted="1"`)
- Returns: `{ success: true }`
- Requires: JWT token

## Adding Features

### New API Endpoint
1. Add handler in `server.ts` using `server.addRoute()`
2. Export business logic function from `index.ts`
3. Add client function to `frontend/src/lib/io.ts`
4. Always close SQL connection in try/finally block

### New Configuration
Add to `.env` with default fallback: `process.env.VAR_NAME || "default"`

### Frontend Translations
Add key to all JSON files in `frontend/src/lib/i18n/`, use `$_('key')` in Svelte components

## Testing
Tests need to be created for this project. When implementing tests:
- Test appointment slot calculation logic with various scenarios
- Test date conversion between ISO and Elexis formats
- Test authentication flow with valid/invalid credentials
- Consider integration tests for database interactions

## Common Pitfalls
- Don't use `npm` commands - this is a Bun project (use `bun` instead)
- SQL connections must be closed manually - always use try/finally with `db.close()`
- Elexis date strings are `YYYYMMDD` format, not ISO - use conversion functions
- Frontend must build before creating standalone executable
- MikroRest authorization requires `server.authorize` middleware in route definition
