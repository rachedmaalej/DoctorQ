# DoctorQ - Virtual Queue Management System

A lightweight queue management system for independent medical practices in Tunisia. Built with React, Node.js, PostgreSQL, and Socket.io.

## Project Structure

```
doctorq/
├── apps/
│   ├── api/         # Node.js backend with Express & Socket.io
│   └── web/         # React frontend with Vite & Tailwind
├── packages/
│   └── shared/      # Shared types & constants (future)
└── docs/           # Documentation & specifications
```

## Tech Stack

### Backend (apps/api)
- **Runtime:** Node.js 20+
- **Framework:** Express.js
- **Database:** PostgreSQL with Prisma ORM
- **Real-time:** Socket.io
- **Auth:** JWT
- **Language:** TypeScript

### Frontend (apps/web)
- **Framework:** React 18 with TypeScript
- **Build Tool:** Vite
- **Styling:** Tailwind CSS
- **State:** Zustand
- **Real-time:** Socket.io-client
- **i18n:** react-i18next (French & Arabic with RTL)

## Getting Started

### Prerequisites

- Node.js 20+ installed
- PostgreSQL 15+ installed and running
- pnpm installed (`npm install -g pnpm`)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd doctorq
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up the database**

   Create a PostgreSQL database:
   ```bash
   createdb doctorq
   ```

4. **Configure environment variables**

   Backend (apps/api/.env):
   ```bash
   cp apps/api/.env.example apps/api/.env
   ```

   Edit `apps/api/.env` and update:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/doctorq?schema=public"
   JWT_SECRET="your-secret-key-change-this"
   ```

   Frontend (apps/web/.env):
   ```bash
   cp apps/web/.env.example apps/web/.env
   ```

5. **Initialize the database**
   ```bash
   pnpm db:push
   pnpm db:seed
   ```

   This creates the database schema and adds test data including:
   - Test clinic: dr.ahmed@example.tn / password123
   - Sample queue entries

6. **Start development servers**
   ```bash
   pnpm dev
   ```

   This starts both:
   - Backend API: http://localhost:3001
   - Frontend: http://localhost:5173

   Or run them separately:
   ```bash
   pnpm dev:api   # Backend only
   pnpm dev:web   # Frontend only
   ```

### Test Login

Navigate to http://localhost:5173 and login with:
- **Email:** dr.ahmed@example.tn
- **Password:** password123

## Available Scripts

From the root directory:

```bash
pnpm dev              # Start both frontend and backend
pnpm dev:api          # Start backend only
pnpm dev:web          # Start frontend only
pnpm build            # Build both apps
pnpm db:push          # Push Prisma schema to database
pnpm db:migrate       # Run database migrations
pnpm db:seed          # Seed database with test data
pnpm db:studio        # Open Prisma Studio (database GUI)
```

## Features (Phase 1 - MVP)

### Completed ✅
- [x] Monorepo setup with pnpm workspaces
- [x] PostgreSQL database with Prisma
- [x] JWT authentication
- [x] Queue management API (add, call next, remove)
- [x] Real-time updates via Socket.io
- [x] React dashboard with queue list
- [x] Add patient modal
- [x] Call next patient functionality
- [x] Patient status page
- [x] French/Arabic i18n support with RTL

### Next Steps (Phase 2)
- [ ] Patient check-in page with QR code
- [ ] QR code generation per clinic
- [ ] SMS notifications via Twilio
- [ ] WhatsApp notifications (future)

## Database Schema

### Main Models

**Clinic**
- Stores clinic information and settings
- Fields: name, email, password, language, avgConsultationMins, notifyAtPosition

**QueueEntry**
- Represents a patient in the queue
- Fields: patientName, patientPhone, position, status, checkInMethod, timestamps

**DailyStat**
- Daily statistics per clinic
- Fields: date, totalPatients, avgWaitMins, noShows

## Real-time Architecture

Socket.io rooms:
- `clinic:{clinicId}` - Updates for clinic dashboard
- `patient:{entryId}` - Updates for individual patient status pages

Events:
- `queue:updated` - Queue state changed
- `patient:called` - Patient called for consultation
- `position:changed` - Patient position updated

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login with email/password
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current clinic data

### Queue Management (Protected)
- `GET /api/queue` - Get today's queue
- `POST /api/queue` - Add patient to queue
- `POST /api/queue/next` - Call next patient
- `PATCH /api/queue/:id/status` - Update patient status
- `DELETE /api/queue/:id` - Remove patient from queue

### Patient (Public)
- `GET /api/patient/:id` - Get patient position and status

## Development Workflow

1. **Make changes** to code in `apps/api` or `apps/web`
2. **Hot reload** is enabled - changes reflect immediately
3. **Database changes:**
   - Update `apps/api/prisma/schema.prisma`
   - Run `pnpm db:push` to apply changes
4. **Add new dependencies:**
   ```bash
   cd apps/api   # or apps/web
   pnpm add <package-name>
   ```

## Project Documentation

- [CLAUDE.md](./CLAUDE.md) - Development guide and technical specs
- [docs/MVP-SPECIFICATION.md](./docs/MVP-SPECIFICATION.md) - Feature specifications
- [docs/wireframes.html](./docs/wireframes.html) - UI wireframes
- [docs/01_Project_Charter.md](./docs/01_Project_Charter.md) - Project charter
- [docs/15_Project_Phases.md](./docs/15_Project_Phases.md) - Implementation phases

## Troubleshooting

### Database connection errors
- Ensure PostgreSQL is running: `pg_ctl status`
- Check DATABASE_URL in apps/api/.env
- Verify database exists: `psql -l | grep doctorq`

### Port already in use
- Backend (3001): Check if another process is using port 3001
- Frontend (5173): Check if another Vite dev server is running

### Module not found errors
- Run `pnpm install` from the root directory
- Check that you're using pnpm (not npm or yarn)

## Support

For questions or issues:
1. Check the [CLAUDE.md](./CLAUDE.md) development guide
2. Review the project documentation in `/docs`
3. Open an issue in the repository

## License

Proprietary - All rights reserved
