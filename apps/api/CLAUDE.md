# DoctorQ API

Express + TypeScript + Prisma + Socket.io. Entry point: `src/index.ts`.
Dev: `pnpm dev` (tsx watch). Build: `prisma generate && tsc` -> `dist/`.

## Architecture

```
src/
  index.ts              # Express app, Socket.io, health check, seed endpoint
  routes/
    auth.ts             # Login, logout, getMe, change-password
    signup.ts           # Public: register, verify-email, forgot/reset-password
    subscription.ts     # Subscription status, Konnect checkout, SMS packages
    queue.ts            # CRUD queue, call-next, reorder, check-in (public), patient status (public)
    clinic.ts           # Settings, QR code, doctor-presence toggle
    doctor.ts           # Multi-doctor CRUD (mounted at /api/clinic/doctors)
    admin.ts            # Admin-only: metrics, clinic CRUD, payments, impersonation
    metrics.ts          # Prometheus /metrics endpoint
  services/
    queueService.ts     # Add/remove patients, call-next, archive (uses transactions)
    positionService.ts  # Position recalculation with raw SQL batch updates
    notificationService.ts  # Socket.io emissions + SMS sending (checks credits)
    statsService.ts     # Queue stats calculation, daily aggregation
    subscriptionService.ts  # Subscription lifecycle, trial checks, Konnect
    signupService.ts    # Registration, email verification, password reset
    adminService.ts     # All admin analytics (48KB - largest file)
    doctorService.ts    # Multi-doctor CRUD
  lib/
    auth.ts             # JWT sign/verify, authMiddleware, requestContext
    prisma.ts           # Prisma client singleton
    socket.ts           # Socket.io singleton: setSocketIO / getSocketIO / emitToRoom
    scheduler.ts        # Cron jobs (midnight reset, 9AM trial check)
    email.ts            # Resend templates (welcome, trial expiring, password reset)
    sms.ts              # Twilio client + SMS templates (QUEUE_JOINED, ALMOST_TURN, YOUR_TURN)
    konnect.ts          # Konnect payment gateway (initPayment, getPaymentDetails)
    cache.ts            # Simple in-memory cache
    metrics.ts          # Prometheus metrics (HTTP duration, socket connections)
    requestContext.ts   # AsyncLocalStorage for tenant isolation
```

## Key Patterns

### Queue Position Recalculation
`positionService.recalculatePositionsAndStatuses()` uses batch raw SQL in a transaction:
1. Renumber positions by: `priorityOrder` > `appointmentTime` > `arrivedAt`
2. Position #1 -> IN_CONSULTATION (auto-set `calledAt`)
3. Position at `notifyAtPosition` -> NOTIFIED (auto-set `notifiedAt`)
4. Remaining -> WAITING
Always call this after any queue mutation, then `emitQueueUpdate()`.

### Adding Patients (Transaction Safety)
`queueService.addPatient()` wraps duplicate-check + position-get + create in a Prisma `$transaction`. Phone numbers normalized to `+216XXXXXXXX` before duplicate check.

### Service -> Notification Flow
1. Route validates input (Zod)
2. Service performs DB mutation in transaction
3. Calls `notificationService.emitQueueUpdate(clinicId)` for dashboard refresh
4. Calls `notificationService.emitPatientUpdate(entryId)` for patient status pages
5. Calls `notificationService.sendSmsNotification(entryId, template)` if applicable

### Admin Auth
Not role-based. Hardcoded `ADMIN_EMAILS` array in `routes/admin.ts`. `isAdmin` middleware checks `req.clinic.email` against the list.

## Socket.io

### Rooms
- `clinic:{clinicId}` — Authenticated (JWT). Doctor/receptionist dashboard.
- `patient:{entryId}` — Public. Patient status page.
- `clinic:{clinicId}:patients` — Public. All patients (doctor presence broadcasts).

### Server -> Client Events
- `queue:updated` — `{ queue, stats }` — Full queue refresh to clinic room
- `patient:called` — `{ position, status }` — Individual patient update
- `doctor:presence` — `{ clinicId, isDoctorPresent }` — Presence toggle
- `joined:clinic` / `joined:patient` — Join confirmation

### Client -> Server Events
- `join:clinic` — `{ clinicId, token }` — Authenticated join
- `join:patient` — `{ entryId }` — Public join (also auto-joins clinic:patients room)

## Cron Jobs (scheduler.ts)

- **Midnight (Africa/Tunis):** Archive queue stats to DailyStat, delete stale entries, set `isDoctorPresent=false` for all clinics, emit `doctor:presence` events.
- **9 AM (Africa/Tunis):** Check trial clinics, send warning emails at 7 and 3 days remaining.

## API Response Format

- Success: `{ data: T }`
- Error: `{ error: { code: string, message: string } }`
- The frontend `ApiClient` unwraps `.data` automatically.

## Rate Limiting

Public endpoints rate-limited to 30 req/min per IP: `/api/queue/checkin`, `/api/queue/patient`, `/api/signup/*`

## Testing

Vitest. Run: `pnpm test`. Minimal coverage currently — focus on services when adding tests.
