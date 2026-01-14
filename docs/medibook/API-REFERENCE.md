# MediBook - API Reference

## Base URL

```
Development: http://localhost:3002/api
Production:  https://api.medibook.tn/api
```

## Authentication

All endpoints (except health check) require JWT authentication.

```
Authorization: Bearer <token>
```

The token is shared with DoctorQ - logging into either app provides access to both.

## Response Format

### Success Response

```json
{
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100
  }
}
```

### Error Response

```json
{
  "error": "VALIDATION_ERROR",
  "message": "Invalid input",
  "details": {
    "field": "phone",
    "issue": "Phone number must start with +216"
  }
}
```

### HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request - Validation error |
| 401 | Unauthorized - Invalid/missing token |
| 404 | Not Found |
| 409 | Conflict - Double booking, duplicate |
| 500 | Internal Server Error |

---

## Appointments

### List Appointments

```
GET /api/appointments
```

Query parameters:

| Parameter | Type | Description |
|-----------|------|-------------|
| `date` | string | Filter by date (YYYY-MM-DD) |
| `doctorId` | string | Filter by doctor |
| `patientId` | string | Filter by patient |
| `status` | string | Filter by status |
| `from` | string | Start date range |
| `to` | string | End date range |
| `page` | number | Page number (default: 1) |
| `limit` | number | Items per page (default: 50) |

**Example:**
```bash
GET /api/appointments?date=2024-01-15&doctorId=abc123
```

**Response:**
```json
{
  "data": [
    {
      "id": "apt_123",
      "clinicId": "clinic_456",
      "doctorId": "doc_789",
      "patientId": "pat_012",
      "date": "2024-01-15",
      "startTime": "2024-01-15T09:00:00Z",
      "endTime": "2024-01-15T09:30:00Z",
      "duration": 30,
      "status": "SCHEDULED",
      "reason": "Annual checkup",
      "notes": null,
      "doctor": {
        "id": "doc_789",
        "name": "Dr. Kamoun",
        "color": "#4f46e5"
      },
      "patient": {
        "id": "pat_012",
        "name": "Ahmed Ben Ali",
        "phone": "+21698765432"
      }
    }
  ],
  "meta": {
    "page": 1,
    "limit": 50,
    "total": 15
  }
}
```

### Get Single Appointment

```
GET /api/appointments/:id
```

**Response:**
```json
{
  "data": {
    "id": "apt_123",
    "clinicId": "clinic_456",
    "doctorId": "doc_789",
    "patientId": "pat_012",
    "date": "2024-01-15",
    "startTime": "2024-01-15T09:00:00Z",
    "endTime": "2024-01-15T09:30:00Z",
    "duration": 30,
    "status": "SCHEDULED",
    "reason": "Annual checkup",
    "notes": "Patient has history of hypertension",
    "reminder24hSent": false,
    "reminder1hSent": false,
    "queueEntryId": null,
    "doctor": { ... },
    "patient": { ... },
    "createdAt": "2024-01-10T14:30:00Z",
    "updatedAt": "2024-01-10T14:30:00Z"
  }
}
```

### Create Appointment

```
POST /api/appointments
```

**Request Body:**
```json
{
  "doctorId": "doc_789",
  "patientId": "pat_012",
  "date": "2024-01-15",
  "startTime": "09:00",
  "duration": 30,
  "reason": "Annual checkup",
  "notes": "Patient has history of hypertension"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `doctorId` | string | Yes | Doctor UUID |
| `patientId` | string | Yes | Patient UUID |
| `date` | string | Yes | Date (YYYY-MM-DD) |
| `startTime` | string | Yes | Start time (HH:MM) |
| `duration` | number | Yes | Duration in minutes |
| `reason` | string | No | Reason for visit |
| `notes` | string | No | Additional notes |

**Response:** `201 Created`
```json
{
  "data": {
    "id": "apt_123",
    ...
  }
}
```

**Errors:**
- `409 Conflict` - Time slot already booked
- `400 Bad Request` - Invalid date/time or outside working hours

### Update Appointment

```
PATCH /api/appointments/:id
```

**Request Body:**
```json
{
  "date": "2024-01-16",
  "startTime": "10:00",
  "status": "CONFIRMED",
  "notes": "Updated notes"
}
```

All fields are optional. Only provided fields are updated.

### Cancel Appointment

```
DELETE /api/appointments/:id
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `reason` | string | Cancellation reason |

This sets status to `CANCELLED` rather than deleting the record.

### Check In Patient

```
POST /api/appointments/:id/checkin
```

Creates a QueueEntry in DoctorQ and links it to this appointment.

**Response:**
```json
{
  "data": {
    "appointmentId": "apt_123",
    "queueEntryId": "qe_456",
    "position": 3,
    "estimatedWait": 45
  }
}
```

---

## Patients

### List Patients

```
GET /api/patients
```

Query parameters:

| Parameter | Type | Description |
|-----------|------|-------------|
| `search` | string | Search by name or phone |
| `page` | number | Page number (default: 1) |
| `limit` | number | Items per page (default: 20) |

**Example:**
```bash
GET /api/patients?search=ahmed
```

**Response:**
```json
{
  "data": [
    {
      "id": "pat_012",
      "name": "Ahmed Ben Ali",
      "phone": "+21698765432",
      "email": "ahmed@example.com",
      "dateOfBirth": "1985-03-15",
      "gender": "MALE",
      "notes": null,
      "reminderPreference": "SMS",
      "createdAt": "2024-01-01T10:00:00Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 1
  }
}
```

### Get Single Patient

```
GET /api/patients/:id
```

### Create Patient

```
POST /api/patients
```

**Request Body:**
```json
{
  "name": "Ahmed Ben Ali",
  "phone": "+21698765432",
  "email": "ahmed@example.com",
  "dateOfBirth": "1985-03-15",
  "gender": "MALE",
  "notes": "Allergic to penicillin",
  "reminderPreference": "SMS"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Full name |
| `phone` | string | Yes | Phone (format: +216XXXXXXXX) |
| `email` | string | No | Email address |
| `dateOfBirth` | string | No | Date of birth (YYYY-MM-DD) |
| `gender` | string | No | MALE, FEMALE, or OTHER |
| `notes` | string | No | Medical notes |
| `reminderPreference` | string | No | SMS, WHATSAPP, or NONE |

**Errors:**
- `409 Conflict` - Phone number already exists for this clinic

### Update Patient

```
PATCH /api/patients/:id
```

### Get Patient History

```
GET /api/patients/:id/history
```

Returns past appointments for the patient.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `page` | number | Page number |
| `limit` | number | Items per page |

**Response:**
```json
{
  "data": [
    {
      "id": "apt_100",
      "date": "2023-12-15",
      "startTime": "2023-12-15T10:00:00Z",
      "status": "COMPLETED",
      "reason": "Flu symptoms",
      "doctor": {
        "name": "Dr. Kamoun"
      }
    }
  ],
  "meta": { ... }
}
```

---

## Doctors

### List Doctors

```
GET /api/doctors
```

Query parameters:

| Parameter | Type | Description |
|-----------|------|-------------|
| `active` | boolean | Filter by active status (default: true) |

**Response:**
```json
{
  "data": [
    {
      "id": "doc_789",
      "name": "Dr. Kamoun",
      "specialty": "General Practice",
      "phone": "+21655443322",
      "email": "kamoun@clinic.tn",
      "color": "#4f46e5",
      "slotDuration": 20,
      "isActive": true
    }
  ]
}
```

### Get Single Doctor

```
GET /api/doctors/:id
```

Includes working hours in response.

### Create Doctor

```
POST /api/doctors
```

**Request Body:**
```json
{
  "name": "Dr. Kamoun",
  "specialty": "General Practice",
  "phone": "+21655443322",
  "email": "kamoun@clinic.tn",
  "color": "#4f46e5",
  "slotDuration": 20,
  "workingHours": {
    "monday": { "start": "09:00", "end": "17:00" },
    "tuesday": { "start": "09:00", "end": "17:00" },
    "wednesday": { "start": "09:00", "end": "13:00" },
    "thursday": { "start": "09:00", "end": "17:00" },
    "friday": { "start": "09:00", "end": "17:00" },
    "saturday": null,
    "sunday": null
  }
}
```

### Update Doctor

```
PATCH /api/doctors/:id
```

### Get Doctor Availability

```
GET /api/doctors/:id/availability
```

Returns available time slots for a specific date.

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `date` | string | Yes | Date (YYYY-MM-DD) |
| `duration` | number | No | Desired duration (default: doctor's slotDuration) |

**Response:**
```json
{
  "data": {
    "date": "2024-01-15",
    "doctorId": "doc_789",
    "workingHours": {
      "start": "09:00",
      "end": "17:00"
    },
    "availableSlots": [
      { "start": "09:00", "end": "09:30" },
      { "start": "09:30", "end": "10:00" },
      { "start": "11:00", "end": "11:30" },
      ...
    ],
    "bookedSlots": [
      { "start": "10:00", "end": "10:30", "appointmentId": "apt_123" },
      { "start": "10:30", "end": "11:00", "appointmentId": "apt_124" }
    ]
  }
}
```

---

## Calendar

### Get Day View

```
GET /api/calendar/day/:date
```

**Example:**
```bash
GET /api/calendar/day/2024-01-15
```

**Response:**
```json
{
  "data": {
    "date": "2024-01-15",
    "appointments": [
      {
        "id": "apt_123",
        "startTime": "09:00",
        "endTime": "09:30",
        "status": "SCHEDULED",
        "doctor": { "id": "doc_789", "name": "Dr. Kamoun", "color": "#4f46e5" },
        "patient": { "id": "pat_012", "name": "Ahmed Ben Ali", "phone": "+216..." }
      },
      ...
    ],
    "summary": {
      "total": 15,
      "scheduled": 8,
      "confirmed": 5,
      "checkedIn": 2,
      "completed": 0
    }
  }
}
```

### Get Week View

```
GET /api/calendar/week/:date
```

Returns appointments for the week starting at the given date.

**Response:**
```json
{
  "data": {
    "weekStart": "2024-01-15",
    "weekEnd": "2024-01-21",
    "days": [
      {
        "date": "2024-01-15",
        "appointments": [ ... ]
      },
      {
        "date": "2024-01-16",
        "appointments": [ ... ]
      },
      ...
    ]
  }
}
```

### Get Month View

```
GET /api/calendar/month/:date
```

Returns a summary of appointments per day for the month.

**Response:**
```json
{
  "data": {
    "month": "2024-01",
    "days": [
      { "date": "2024-01-01", "count": 12 },
      { "date": "2024-01-02", "count": 8 },
      ...
    ]
  }
}
```

### Get Available Slots

```
GET /api/calendar/slots
```

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `doctorId` | string | No | Filter by doctor |
| `date` | string | Yes | Date (YYYY-MM-DD) |
| `duration` | number | No | Desired duration (default: 15) |

**Response:**
```json
{
  "data": {
    "date": "2024-01-15",
    "slots": [
      { "doctorId": "doc_789", "doctorName": "Dr. Kamoun", "start": "09:00", "end": "09:30" },
      { "doctorId": "doc_789", "doctorName": "Dr. Kamoun", "start": "09:30", "end": "10:00" },
      { "doctorId": "doc_111", "doctorName": "Dr. Ben Salah", "start": "09:00", "end": "09:30" },
      ...
    ]
  }
}
```

---

## Integration

### Check In to DoctorQ Queue

```
POST /api/integration/checkin
```

**Request Body:**
```json
{
  "appointmentId": "apt_123"
}
```

**Response:**
```json
{
  "data": {
    "appointmentId": "apt_123",
    "queueEntryId": "qe_456",
    "position": 3,
    "estimatedWait": 45,
    "status": "CHECKED_IN"
  }
}
```

### Get Queue Status

```
GET /api/integration/queue-status/:appointmentId
```

Returns the current queue position for a checked-in appointment.

**Response:**
```json
{
  "data": {
    "appointmentId": "apt_123",
    "queueEntryId": "qe_456",
    "position": 2,
    "estimatedWait": 30,
    "status": "WAITING"
  }
}
```

### Webhook Receiver (from DoctorQ)

```
POST /api/integration/webhook
```

Receives status updates from DoctorQ when queue status changes.

**Request Body:**
```json
{
  "event": "queue:status_changed",
  "queueEntryId": "qe_456",
  "appointmentId": "apt_123",
  "status": "IN_CONSULTATION"
}
```

Events:
- `queue:status_changed` - Queue entry status updated
- `queue:position_changed` - Position in queue changed
- `queue:completed` - Patient finished consultation
- `queue:no_show` - Patient marked as no-show

---

## Real-time Events (Socket.io)

### Connect

```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3002', {
  auth: { token: 'Bearer xxx' }
});

socket.emit('join:clinic', { clinicId: 'clinic_456' });
```

### Events

**appointment:created**
```javascript
socket.on('appointment:created', (data) => {
  // { appointment: Appointment }
});
```

**appointment:updated**
```javascript
socket.on('appointment:updated', (data) => {
  // { appointment: Appointment, changes: { field: newValue } }
});
```

**appointment:cancelled**
```javascript
socket.on('appointment:cancelled', (data) => {
  // { appointmentId: string, reason: string }
});
```

**patient:checked_in**
```javascript
socket.on('patient:checked_in', (data) => {
  // { appointmentId: string, queueEntryId: string, position: number }
});
```

---

## Rate Limits

| Endpoint | Limit |
|----------|-------|
| All endpoints | 100 requests/minute per clinic |
| POST /api/appointments | 20 requests/minute |
| POST /api/integration/checkin | 10 requests/minute |

---

## Errors

### Error Codes

| Code | Description |
|------|-------------|
| `VALIDATION_ERROR` | Invalid input data |
| `UNAUTHORIZED` | Invalid or missing token |
| `NOT_FOUND` | Resource not found |
| `DOUBLE_BOOKING` | Time slot already booked |
| `DUPLICATE_PATIENT` | Patient with same phone exists |
| `OUTSIDE_HOURS` | Appointment outside working hours |
| `DOCTORQ_ERROR` | Error communicating with DoctorQ |
| `INTERNAL_ERROR` | Server error |

### Example Error

```json
{
  "error": "DOUBLE_BOOKING",
  "message": "This time slot is already booked",
  "details": {
    "existingAppointmentId": "apt_999",
    "requestedTime": "10:00",
    "conflictingTime": "09:45-10:15"
  }
}
```
