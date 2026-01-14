# 11_API_Specification.md

## Overview

This document provides complete API specifications for all DoctorQ endpoints in OpenAPI 3.0 style. It includes request/response schemas, authentication requirements, error handling, and WebSocket events.

## Table of Contents

1. [Base Configuration](#base-configuration)
2. [Authentication Endpoints](#authentication-endpoints)
3. [Queue Management Endpoints](#queue-management-endpoints)
4. [Patient Endpoints (Public)](#patient-endpoints-public)
5. [Statistics Endpoints](#statistics-endpoints)
6. [Clinic Settings Endpoints](#clinic-settings-endpoints)
7. [WebSocket Events](#websocket-events)
8. [Error Handling](#error-handling)
9. [Rate Limiting](#rate-limiting)

---

## Base Configuration

### Base URL

```
Development:  http://localhost:3001
Production:   https://api.doctorq.tn
```

### API Version

Current version: **v1** (no version prefix in URL for MVP)

Future breaking changes will use `/api/v2` prefix.

### Content Type

All requests and responses use `application/json`.

### Authentication

Protected endpoints require JWT token in Authorization header:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## Authentication Endpoints

### POST /api/auth/login

Authenticate clinic user and receive JWT token.

**Request:**

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "clinic@example.com",
  "password": "secretPassword123"
}
```

**Request Schema:**

```typescript
{
  email: string;      // Valid email format
  password: string;   // Min 6 characters
}
```

**Success Response (200 OK):**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "clinic": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Cabinet Dr. Ahmed",
    "email": "clinic@example.com",
    "doctorName": "Dr. Ahmed Ben Salem",
    "language": "fr",
    "avgConsultationMins": 15,
    "notifyAtPosition": 2,
    "enableWhatsApp": false
  }
}
```

**Response Schema:**

```typescript
{
  token: string;      // JWT token (expires in 7 days)
  clinic: {
    id: string;
    name: string;
    email: string;
    doctorName: string | null;
    language: 'fr' | 'ar';
    avgConsultationMins: number;
    notifyAtPosition: number;
    enableWhatsApp: boolean;
  };
}
```

**Error Responses:**

```json
// 400 Bad Request - Validation error
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request data",
    "details": [
      {
        "path": "email",
        "message": "Invalid email format"
      }
    ]
  }
}

// 401 Unauthorized - Invalid credentials
{
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Email or password is incorrect"
  }
}

// 429 Too Many Requests - Rate limit exceeded
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many login attempts, try again later"
  }
}
```

---

### POST /api/auth/logout

Logout current user (client-side token removal).

**Request:**

```http
POST /api/auth/logout
Authorization: Bearer <token>
```

**Success Response (204 No Content):**

```
(Empty body)
```

**Note:** Token is managed client-side. Server can add token to blacklist for extra security.

---

### GET /api/auth/me

Get current authenticated clinic information.

**Request:**

```http
GET /api/auth/me
Authorization: Bearer <token>
```

**Success Response (200 OK):**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Cabinet Dr. Ahmed",
  "email": "clinic@example.com",
  "doctorName": "Dr. Ahmed Ben Salem",
  "phone": "+21671123456",
  "address": "12 Rue de la Liberté, La Marsa",
  "language": "fr",
  "avgConsultationMins": 15,
  "notifyAtPosition": 2,
  "enableWhatsApp": false,
  "isActive": true,
  "createdAt": "2025-01-01T10:00:00Z"
}
```

**Error Responses:**

```json
// 401 Unauthorized - Invalid or expired token
{
  "error": {
    "code": "INVALID_TOKEN",
    "message": "Token is invalid or expired"
  }
}
```

---

## Queue Management Endpoints

### GET /api/queue

Get today's queue entries for authenticated clinic.

**Authentication:** Required

**Request:**

```http
GET /api/queue
Authorization: Bearer <token>
```

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `status` | string | all | Filter by status: `WAITING`, `NOTIFIED`, `IN_CONSULTATION`, `COMPLETED`, `NO_SHOW`, `CANCELLED` |
| `date` | string (ISO date) | today | Get queue for specific date (YYYY-MM-DD) |

**Success Response (200 OK):**

```json
{
  "queue": [
    {
      "id": "entry-uuid-1",
      "clinicId": "clinic-uuid",
      "patientName": "Ahmed Ben Salem",
      "patientPhone": "+21698123456",
      "position": 1,
      "status": "WAITING",
      "checkInMethod": "QR_CODE",
      "arrivedAt": "2025-01-11T09:30:00Z",
      "notifiedAt": null,
      "calledAt": null,
      "completedAt": null,
      "createdAt": "2025-01-11T09:30:00Z",
      "updatedAt": "2025-01-11T09:30:00Z"
    },
    {
      "id": "entry-uuid-2",
      "clinicId": "clinic-uuid",
      "patientName": "Fatima Trabelsi",
      "patientPhone": "+21699234567",
      "position": 2,
      "status": "WAITING",
      "checkInMethod": "MANUAL",
      "arrivedAt": "2025-01-11T09:45:00Z",
      "notifiedAt": null,
      "calledAt": null,
      "completedAt": null,
      "createdAt": "2025-01-11T09:45:00Z",
      "updatedAt": "2025-01-11T09:45:00Z"
    }
  ],
  "stats": {
    "waiting": 2,
    "inConsultation": 1,
    "completed": 5,
    "noShows": 1,
    "avgWaitMins": 45
  }
}
```

**Response Schema:**

```typescript
{
  queue: QueueEntry[];
  stats: {
    waiting: number;
    inConsultation: number;
    completed: number;
    noShows: number;
    avgWaitMins: number | null;
  };
}

interface QueueEntry {
  id: string;
  clinicId: string;
  patientName: string | null;
  patientPhone: string;
  position: number;
  status: QueueStatus;
  checkInMethod: CheckInMethod;
  arrivedAt: string; // ISO 8601
  notifiedAt: string | null;
  calledAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

enum QueueStatus {
  WAITING = 'WAITING',
  NOTIFIED = 'NOTIFIED',
  IN_CONSULTATION = 'IN_CONSULTATION',
  COMPLETED = 'COMPLETED',
  NO_SHOW = 'NO_SHOW',
  CANCELLED = 'CANCELLED',
}

enum CheckInMethod {
  QR_CODE = 'QR_CODE',
  MANUAL = 'MANUAL',
  WHATSAPP = 'WHATSAPP',
  SMS = 'SMS',
}
```

---

### POST /api/queue

Add patient to queue (manual check-in by receptionist).

**Authentication:** Required

**Request:**

```http
POST /api/queue
Authorization: Bearer <token>
Content-Type: application/json

{
  "patientPhone": "+21698123456",
  "patientName": "Ahmed Ben Salem",
  "visitReason": "Consultation générale"
}
```

**Request Schema:**

```typescript
{
  patientPhone: string;    // Required, Tunisia format: +216XXXXXXXX
  patientName?: string;    // Optional, 1-100 chars
  visitReason?: string;    // Optional, max 500 chars
}
```

**Success Response (201 Created):**

```json
{
  "id": "entry-uuid-new",
  "clinicId": "clinic-uuid",
  "patientName": "Ahmed Ben Salem",
  "patientPhone": "+21698123456",
  "position": 3,
  "status": "WAITING",
  "checkInMethod": "MANUAL",
  "arrivedAt": "2025-01-11T10:00:00Z",
  "notifiedAt": null,
  "calledAt": null,
  "completedAt": null,
  "estimatedWaitMins": 45,
  "createdAt": "2025-01-11T10:00:00Z",
  "updatedAt": "2025-01-11T10:00:00Z"
}
```

**Error Responses:**

```json
// 400 Bad Request - Invalid phone number
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid phone number format",
    "details": [
      {
        "path": "patientPhone",
        "message": "Must match Tunisia format: +216XXXXXXXX"
      }
    ]
  }
}

// 409 Conflict - Patient already in queue
{
  "error": {
    "code": "DUPLICATE_ENTRY",
    "message": "Patient already in queue",
    "existingEntry": {
      "id": "entry-uuid-existing",
      "position": 2,
      "status": "WAITING"
    }
  }
}
```

---

### POST /api/queue/next

Call next patient in queue (move from WAITING to IN_CONSULTATION).

**Authentication:** Required

**Request:**

```http
POST /api/queue/next
Authorization: Bearer <token>
```

**Success Response (200 OK):**

```json
{
  "calledPatient": {
    "id": "entry-uuid-1",
    "patientName": "Ahmed Ben Salem",
    "patientPhone": "+21698123456",
    "position": 1,
    "status": "IN_CONSULTATION",
    "calledAt": "2025-01-11T10:15:00Z"
  },
  "updatedQueue": [
    {
      "id": "entry-uuid-2",
      "position": 1,
      "status": "WAITING"
    },
    {
      "id": "entry-uuid-3",
      "position": 2,
      "status": "WAITING"
    }
  ]
}
```

**Error Responses:**

```json
// 404 Not Found - No patients waiting
{
  "error": {
    "code": "NO_PATIENTS_WAITING",
    "message": "No patients in queue"
  }
}
```

**Side Effects:**

1. Updates first WAITING patient to IN_CONSULTATION
2. Sets `calledAt` timestamp
3. Recalculates positions for remaining patients
4. Sends SMS/WhatsApp "YOUR TURN" notification
5. Emits Socket.io events:
   - `patient:called` to patient room
   - `position:changed` to affected patients
   - `queue:updated` to clinic room

---

### PATCH /api/queue/:id/status

Update patient status manually.

**Authentication:** Required

**Request:**

```http
PATCH /api/queue/entry-uuid-1/status
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "COMPLETED"
}
```

**Request Schema:**

```typescript
{
  status: QueueStatus; // WAITING | NOTIFIED | IN_CONSULTATION | COMPLETED | NO_SHOW | CANCELLED
}
```

**Success Response (200 OK):**

```json
{
  "id": "entry-uuid-1",
  "status": "COMPLETED",
  "completedAt": "2025-01-11T10:30:00Z",
  "updatedAt": "2025-01-11T10:30:00Z"
}
```

**Error Responses:**

```json
// 404 Not Found - Entry doesn't exist
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Queue entry not found"
  }
}

// 403 Forbidden - Entry belongs to different clinic
{
  "error": {
    "code": "FORBIDDEN",
    "message": "Access denied to this queue entry"
  }
}
```

---

### DELETE /api/queue/:id

Remove patient from queue.

**Authentication:** Required

**Request:**

```http
DELETE /api/queue/entry-uuid-1
Authorization: Bearer <token>
```

**Success Response (204 No Content):**

```
(Empty body)
```

**Error Responses:**

```json
// 404 Not Found
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Queue entry not found"
  }
}
```

**Side Effects:**

1. Deletes queue entry from database
2. Recalculates positions for remaining patients
3. Emits `queue:updated` to clinic room

---

### POST /api/queue/:id/notify

Manually send notification to patient.

**Authentication:** Required

**Request:**

```http
POST /api/queue/entry-uuid-1/notify
Authorization: Bearer <token>
Content-Type: application/json

{
  "type": "ALMOST_TURN"
}
```

**Request Schema:**

```typescript
{
  type: 'QUEUE_JOINED' | 'ALMOST_TURN' | 'YOUR_TURN';
}
```

**Success Response (200 OK):**

```json
{
  "sent": true,
  "method": "SMS",
  "messageSid": "SM1234567890abcdef"
}
```

**Error Responses:**

```json
// 500 Internal Server Error - SMS delivery failed
{
  "error": {
    "code": "NOTIFICATION_FAILED",
    "message": "Failed to send notification",
    "details": {
      "twilioError": "Invalid phone number"
    }
  }
}
```

---

## Patient Endpoints (Public)

### GET /api/patient/:id

Get patient queue entry and position (public, no auth required).

**Authentication:** None

**Request:**

```http
GET /api/patient/entry-uuid-1
```

**Success Response (200 OK):**

```json
{
  "id": "entry-uuid-1",
  "clinicName": "Cabinet Dr. Ahmed",
  "position": 3,
  "status": "WAITING",
  "estimatedWaitMins": 45,
  "patientsAhead": 2,
  "arrivedAt": "2025-01-11T09:30:00Z",
  "isYourTurn": false
}
```

**Response Schema:**

```typescript
{
  id: string;
  clinicName: string;
  position: number;
  status: QueueStatus;
  estimatedWaitMins: number;
  patientsAhead: number;
  arrivedAt: string;
  isYourTurn: boolean; // True if status === IN_CONSULTATION
}
```

**Error Responses:**

```json
// 404 Not Found - Entry doesn't exist or is old
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Queue entry not found"
  }
}
```

**Note:** This endpoint is rate-limited to prevent abuse (100 req/hour per IP).

---

### POST /api/checkin/:clinicId

Patient self-check-in via QR code or direct link.

**Authentication:** None (Public)

**Request:**

```http
POST /api/checkin/clinic-uuid-1
Content-Type: application/json

{
  "patientPhone": "+21698123456",
  "patientName": "Ahmed"
}
```

**Request Schema:**

```typescript
{
  patientPhone: string;    // Required, Tunisia format
  patientName?: string;    // Optional
}
```

**Success Response (201 Created):**

```json
{
  "id": "entry-uuid-new",
  "clinicName": "Cabinet Dr. Ahmed",
  "position": 5,
  "status": "WAITING",
  "checkInMethod": "QR_CODE",
  "estimatedWaitMins": 75,
  "statusLink": "https://doctorq.tn/patient/entry-uuid-new",
  "arrivedAt": "2025-01-11T10:00:00Z"
}
```

**Error Responses:**

```json
// 404 Not Found - Clinic doesn't exist
{
  "error": {
    "code": "CLINIC_NOT_FOUND",
    "message": "Clinic not found or inactive"
  }
}

// 409 Conflict - Already in queue
{
  "error": {
    "code": "ALREADY_IN_QUEUE",
    "message": "You are already in this clinic's queue",
    "existingEntry": {
      "id": "entry-uuid-existing",
      "position": 3,
      "statusLink": "https://doctorq.tn/patient/entry-uuid-existing"
    }
  }
}
```

**Side Effects:**

1. Creates new queue entry with status=WAITING
2. Calculates position based on existing waiting patients
3. Sends SMS/WhatsApp notification (based on checkInMethod)
4. Emits `queue:updated` to clinic room

---

## Statistics Endpoints

### GET /api/stats/today

Get today's statistics for authenticated clinic.

**Authentication:** Required

**Request:**

```http
GET /api/stats/today
Authorization: Bearer <token>
```

**Success Response (200 OK):**

```json
{
  "date": "2025-01-11",
  "totalPatients": 12,
  "waiting": 3,
  "inConsultation": 1,
  "completed": 7,
  "noShows": 1,
  "cancelled": 0,
  "avgWaitMins": 42,
  "avgConsultationMins": 18
}
```

---

### GET /api/stats/history

Get historical statistics (last 30 days).

**Authentication:** Required

**Request:**

```http
GET /api/stats/history?days=30
Authorization: Bearer <token>
```

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `days` | number | 30 | Number of days to retrieve (max 90) |

**Success Response (200 OK):**

```json
{
  "stats": [
    {
      "date": "2025-01-11",
      "totalPatients": 12,
      "avgWaitMins": 42,
      "noShows": 1
    },
    {
      "date": "2025-01-10",
      "totalPatients": 15,
      "avgWaitMins": 38,
      "noShows": 2
    }
  ]
}
```

---

## Clinic Settings Endpoints

### GET /api/clinic

Get clinic settings.

**Authentication:** Required

**Request:**

```http
GET /api/clinic
Authorization: Bearer <token>
```

**Success Response (200 OK):**

```json
{
  "id": "clinic-uuid",
  "name": "Cabinet Dr. Ahmed",
  "doctorName": "Dr. Ahmed Ben Salem",
  "phone": "+21671123456",
  "address": "12 Rue de la Liberté, La Marsa",
  "language": "fr",
  "avgConsultationMins": 15,
  "notifyAtPosition": 2,
  "enableWhatsApp": false
}
```

---

### PATCH /api/clinic

Update clinic settings.

**Authentication:** Required

**Request:**

```http
PATCH /api/clinic
Authorization: Bearer <token>
Content-Type: application/json

{
  "avgConsultationMins": 20,
  "notifyAtPosition": 3,
  "language": "ar"
}
```

**Request Schema:**

```typescript
{
  name?: string;
  doctorName?: string;
  phone?: string;
  address?: string;
  language?: 'fr' | 'ar';
  avgConsultationMins?: number; // 5-60 minutes
  notifyAtPosition?: number;    // 1-10
  enableWhatsApp?: boolean;
}
```

**Success Response (200 OK):**

```json
{
  "id": "clinic-uuid",
  "name": "Cabinet Dr. Ahmed",
  "language": "ar",
  "avgConsultationMins": 20,
  "notifyAtPosition": 3,
  "updatedAt": "2025-01-11T10:00:00Z"
}
```

---

### GET /api/clinic/qr

Generate QR code for clinic check-in.

**Authentication:** Required

**Request:**

```http
GET /api/clinic/qr?format=png&size=512
Authorization: Bearer <token>
```

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `format` | string | `png` | Output format: `png`, `svg`, or `url` |
| `size` | number | 256 | QR code size in pixels (128-1024) |

**Success Response (200 OK):**

**Format: `png` or `svg`**
```
Content-Type: image/png (or image/svg+xml)
(Binary image data)
```

**Format: `url`**
```json
{
  "url": "https://doctorq.tn/checkin/clinic-uuid",
  "qrCodeDataUrl": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..."
}
```

---

## WebSocket Events

### Server → Client Events

**Event: `queue:updated`**

Sent to clinic room when queue changes.

```typescript
socket.to(`clinic:${clinicId}`).emit('queue:updated', {
  queue: QueueEntry[],
  stats: {
    waiting: number,
    inConsultation: number,
    completed: number,
    avgWaitMins: number,
  }
});
```

**Event: `patient:called`**

Sent to patient room when it's their turn.

```typescript
socket.to(`patient:${entryId}`).emit('patient:called', {
  status: 'IN_CONSULTATION',
  message: "C'est votre tour!"
});
```

**Event: `position:changed`**

Sent to patient room when position updates.

```typescript
socket.to(`patient:${entryId}`).emit('position:changed', {
  newPosition: number,
  estimatedWaitMins: number
});
```

### Client → Server Events

**Event: `join:clinic`**

Join clinic room (for doctor/receptionist dashboard).

```typescript
socket.emit('join:clinic', {
  clinicId: string,
  token: string // JWT token
});
```

**Event: `join:patient`**

Join patient room (for patient status page).

```typescript
socket.emit('join:patient', {
  entryId: string
});
```

**Event: `leave:clinic`**

Leave clinic room.

```typescript
socket.emit('leave:clinic', {
  clinicId: string
});
```

**Event: `leave:patient`**

Leave patient room.

```typescript
socket.emit('leave:patient', {
  entryId: string
});
```

---

## Error Handling

### Standard Error Response Format

All errors follow this format:

```typescript
{
  error: {
    code: string;       // Machine-readable error code
    message: string;    // Human-readable error message
    details?: any;      // Additional context (optional)
  }
}
```

### Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Request data validation failed |
| `INVALID_CREDENTIALS` | 401 | Login failed |
| `INVALID_TOKEN` | 401 | JWT token invalid or expired |
| `FORBIDDEN` | 403 | Access denied to resource |
| `NOT_FOUND` | 404 | Resource doesn't exist |
| `DUPLICATE_ENTRY` | 409 | Resource already exists |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server error |
| `NOTIFICATION_FAILED` | 500 | SMS/WhatsApp delivery failed |

---

## Rate Limiting

### Limits by Endpoint Type

| Endpoint Type | Limit | Window |
|---------------|-------|--------|
| **Public** (check-in, patient status) | 100 requests | 1 hour per IP |
| **Authenticated** (queue, stats) | 1000 requests | 1 hour per clinic |
| **SMS sending** | 500 SMS | 24 hours per clinic |
| **Login** | 5 attempts | 15 minutes per IP |

### Rate Limit Headers

Responses include rate limit information:

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 87
X-RateLimit-Reset: 1704974400
```

### Rate Limit Exceeded Response

```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests, please try again later",
    "retryAfter": 3600
  }
}
```

---

## Next Steps

- **Testing**: See [12_Testing_Plan.md](./12_Testing_Plan.md) for API testing strategies
- **Implementation**: See [15_Project_Phases.md](./15_Project_Phases.md) for development phases
- **Architecture**: See [05_Technical_Architecture.md](./05_Technical_Architecture.md) for system design
