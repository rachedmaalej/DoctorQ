# MediBook - Appointment Management System

A web-based appointment management application for Tunisian medical clinics, designed to integrate seamlessly with [DoctorQ](../README.md) (queue management system).

## Overview

MediBook solves the appointment scheduling chaos in Tunisian clinics where appointments are managed via paper notebooks, WhatsApp messages, or mental tracking. It provides:

- **Calendar-based scheduling** - Monthly, weekly, and daily views
- **Patient management** - Track patient history and preferences
- **Multi-doctor support** - Color-coded calendars per doctor
- **SMS reminders** - Automated 24h and 1h appointment reminders
- **DoctorQ integration** - One-click check-in to the queue system

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS |
| State | Zustand |
| Real-time | Socket.io |
| Backend | Node.js, Express, TypeScript |
| Database | PostgreSQL, Prisma ORM |
| i18n | react-i18next (French, Arabic with RTL) |

## Project Structure

```
apps/
├── medibook-web/          # React frontend
│   ├── src/
│   │   ├── components/    # UI components
│   │   ├── pages/         # Route pages
│   │   ├── hooks/         # Custom hooks
│   │   ├── stores/        # Zustand stores
│   │   ├── lib/           # Utilities, API client
│   │   └── i18n/          # Translations
│   └── public/
│
└── medibook-api/          # Express backend
    ├── src/
    │   ├── routes/        # API endpoints
    │   ├── services/      # Business logic
    │   └── lib/           # Utilities
    └── prisma/            # Database schema
```

## Quick Start

### Prerequisites

- Node.js 20+
- pnpm 8+
- PostgreSQL 15+
- Running DoctorQ instance (for integration)

### Installation

```bash
# From monorepo root
pnpm install

# Set up environment
cp apps/medibook-api/.env.example apps/medibook-api/.env
cp apps/medibook-web/.env.example apps/medibook-web/.env

# Run database migrations
pnpm --filter medibook-api db:push

# Start development servers
pnpm --filter medibook-api dev
pnpm --filter medibook-web dev
```

### Environment Variables

**Backend (`apps/medibook-api/.env`):**
```bash
DATABASE_URL=postgresql://user:pass@localhost:5432/doctorq
JWT_SECRET=your-shared-jwt-secret  # Same as DoctorQ
PORT=3002
DOCTORQ_API_URL=http://localhost:3001
```

**Frontend (`apps/medibook-web/.env`):**
```bash
VITE_API_URL=http://localhost:3002
VITE_SOCKET_URL=http://localhost:3002
VITE_DOCTORQ_URL=http://localhost:5173
```

## Key Features

### Calendar Views

- **Month View**: Overview of all appointments, color-coded by doctor
- **Week View**: Detailed weekly schedule with time slots
- **Day View**: Timeline of today's appointments with quick actions

### Appointment Management

- Create appointments with patient lookup/creation
- Drag-and-drop rescheduling
- Quick status updates (confirm, cancel, no-show)
- Reason and notes fields

### Patient Management

- Patient database with search
- Appointment history per patient
- Reminder preferences (SMS, WhatsApp, none)

### DoctorQ Integration

When a patient arrives:
1. Find their appointment in MediBook
2. Click "Check In"
3. Patient automatically appears in DoctorQ queue
4. Status syncs in real-time between systems

## API Documentation

See [API-REFERENCE.md](./API-REFERENCE.md) for full endpoint documentation.

### Key Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/appointments` | List appointments with filters |
| POST | `/api/appointments` | Create new appointment |
| POST | `/api/appointments/:id/checkin` | Check patient into DoctorQ |
| GET | `/api/calendar/day/:date` | Get day view data |
| GET | `/api/patients` | List/search patients |

## Database Schema

See [DATABASE-SCHEMA.md](./DATABASE-SCHEMA.md) for full schema documentation.

### Core Models

- **Doctor** - Clinic staff with working hours and specialties
- **Patient** - Patient records with contact info and preferences
- **Appointment** - Scheduled appointments linking doctors and patients

## Development

### Commands

```bash
# Development
pnpm --filter medibook-api dev      # Start backend
pnpm --filter medibook-web dev      # Start frontend

# Database
pnpm --filter medibook-api db:push  # Push schema changes
pnpm --filter medibook-api db:studio # Open Prisma Studio

# Build
pnpm --filter medibook-api build
pnpm --filter medibook-web build

# Lint
pnpm --filter medibook-api lint
pnpm --filter medibook-web lint
```

### Testing

```bash
# Run tests
pnpm --filter medibook-api test
pnpm --filter medibook-web test
```

## Roadmap

- [x] Project setup and documentation
- [ ] Core backend (CRUD endpoints)
- [ ] Core frontend (calendar UI)
- [ ] DoctorQ integration
- [ ] SMS reminders
- [ ] Mobile responsive design
- [ ] Recurring appointments

## Related Documentation

- [Full Specification](./SPECIFICATION.md)
- [Database Schema](./DATABASE-SCHEMA.md)
- [API Reference](./API-REFERENCE.md)
- [DoctorQ Documentation](../README.md)

## License

Proprietary - IjaTawa
