# 12_Testing_Plan.md

## Overview

This document outlines a comprehensive testing strategy for DoctorQ, covering unit tests, integration tests, E2E tests, performance testing, and accessibility testing. The goal is 80%+ code coverage with focus on critical user flows.

## Table of Contents

1. [Testing Pyramid](#testing-pyramid)
2. [Unit Testing](#unit-testing)
3. [Integration Testing](#integration-testing)
4. [End-to-End Testing](#end-to-end-testing)
5. [Performance Testing](#performance-testing)
6. [Accessibility Testing](#accessibility-testing)
7. [Test Data Management](#test-data-management)
8. [CI/CD Integration](#cicd-integration)
9. [Manual Testing Checklist](#manual-testing-checklist)

---

## Testing Pyramid

### Distribution Strategy

```
        /\
       /E2E\        10% - Critical user flows
      /------\
     /  INT   \     20% - API endpoints, database queries
    /----------\
   /    UNIT    \   70% - Pure functions, utilities, hooks
  /--------------\
```

**Coverage Targets:**

| Test Type | Coverage | Priority | Tools |
|-----------|----------|----------|-------|
| **Unit Tests** | 80% lines, 70% branches | High | Vitest (frontend), Jest (backend) |
| **Integration Tests** | All API endpoints | High | Supertest, Testing Library |
| **E2E Tests** | 5 critical flows | Medium | Playwright |
| **Performance** | Load & stress tests | Medium | k6, Artillery |
| **Accessibility** | WCAG 2.1 AA | High | axe-core, manual |

---

## Unit Testing

### Frontend Unit Tests (Vitest)

**What to Test:**

- Pure utility functions
- Custom hooks
- Component logic (not rendering)
- State management (Zustand stores)
- API client methods

**Framework Setup:**

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/**/*.test.{ts,tsx}', 'src/types/**'],
      thresholds: {
        lines: 80,
        branches: 70,
        functions: 80,
        statements: 80,
      },
    },
  },
});
```

#### Example: Testing Utility Functions

```typescript
// src/lib/queue-utils.test.ts
import { describe, it, expect } from 'vitest';
import {
  calculateEstimatedWait,
  formatTunisianPhone,
  isValidTunisianPhone,
} from './queue-utils';

describe('calculateEstimatedWait', () => {
  it('calculates correct wait time for position 5', () => {
    const result = calculateEstimatedWait(5, 15);
    expect(result).toBe(75); // 5 patients × 15 min
  });

  it('returns 0 for position 0', () => {
    const result = calculateEstimatedWait(0, 15);
    expect(result).toBe(0);
  });

  it('handles large positions', () => {
    const result = calculateEstimatedWait(20, 10);
    expect(result).toBe(200);
  });
});

describe('formatTunisianPhone', () => {
  it('adds +216 prefix if missing', () => {
    expect(formatTunisianPhone('98123456')).toBe('+21698123456');
  });

  it('preserves +216 prefix if present', () => {
    expect(formatTunisianPhone('+21698123456')).toBe('+21698123456');
  });

  it('handles 216 without + sign', () => {
    expect(formatTunisianPhone('21698123456')).toBe('+21698123456');
  });

  it('removes spaces and hyphens', () => {
    expect(formatTunisianPhone('98 12 34 56')).toBe('+21698123456');
    expect(formatTunisianPhone('98-123-456')).toBe('+21698123456');
  });
});

describe('isValidTunisianPhone', () => {
  it('validates correct Tunisia phone numbers', () => {
    expect(isValidTunisianPhone('+21698123456')).toBe(true);
    expect(isValidTunisianPhone('+21699234567')).toBe(true);
    expect(isValidTunisianPhone('+21620123456')).toBe(true); // Landline
  });

  it('rejects invalid numbers', () => {
    expect(isValidTunisianPhone('+1234567890')).toBe(false); // Wrong country
    expect(isValidTunisianPhone('+216123456')).toBe(false);  // Too short
    expect(isValidTunisianPhone('notaphone')).toBe(false);   // Not a number
  });
});
```

#### Example: Testing Custom Hooks

```typescript
// src/hooks/use-queue.test.ts
import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useQueue } from './use-queue';
import * as api from '../lib/api';

// Mock API module
vi.mock('../lib/api');

describe('useQueue', () => {
  const mockClinicId = 'clinic-123';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches queue on mount', async () => {
    const mockQueue = [
      { id: '1', position: 1, status: 'WAITING' },
      { id: '2', position: 2, status: 'WAITING' },
    ];

    vi.spyOn(api, 'get').mockResolvedValue(mockQueue);

    const { result } = renderHook(() => useQueue(mockClinicId));

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.queue).toEqual(mockQueue);
    expect(api.get).toHaveBeenCalledWith('/api/queue');
  });

  it('handles API errors gracefully', async () => {
    vi.spyOn(api, 'get').mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useQueue(mockClinicId));

    await waitFor(() => {
      expect(result.current.error).toBe('Network error');
    });

    expect(result.current.queue).toEqual([]);
  });

  it('addPatient updates queue optimistically', async () => {
    const initialQueue = [{ id: '1', position: 1 }];
    const newPatient = { id: '2', position: 2 };

    vi.spyOn(api, 'get').mockResolvedValue(initialQueue);
    vi.spyOn(api, 'post').mockResolvedValue(newPatient);

    const { result } = renderHook(() => useQueue(mockClinicId));

    await waitFor(() => {
      expect(result.current.queue).toEqual(initialQueue);
    });

    await result.current.addPatient({
      patientPhone: '+21698123456',
      patientName: 'Test Patient',
    });

    expect(result.current.queue).toHaveLength(2);
    expect(result.current.queue[1]).toEqual(newPatient);
  });
});
```

### Backend Unit Tests (Jest)

**What to Test:**

- Service layer business logic
- Utility functions (phone formatting, position calculation)
- Middleware (auth, error handling)
- Validation schemas (Zod)

**Framework Setup:**

```typescript
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/*.test.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.test.ts',
    '!src/types/**',
  ],
  coverageThreshold: {
    global: {
      lines: 80,
      branches: 70,
      functions: 80,
      statements: 80,
    },
  },
};
```

#### Example: Testing Service Layer

```typescript
// src/services/queue.service.test.ts
import { describe, it, expect, beforeEach, vi } from '@jest/globals';
import { queueService } from './queue.service';
import { queueRepository } from '../repositories/queue.repository';
import { notificationService } from './notification.service';

// Mock dependencies
vi.mock('../repositories/queue.repository');
vi.mock('./notification.service');

describe('QueueService', () => {
  const clinicId = 'clinic-123';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('addPatient', () => {
    it('creates queue entry with correct position', async () => {
      const mockExistingQueue = [
        { id: '1', position: 1, status: 'WAITING' },
        { id: '2', position: 2, status: 'WAITING' },
      ];

      vi.spyOn(queueRepository, 'findTodayQueue').mockResolvedValue(mockExistingQueue);
      vi.spyOn(queueRepository, 'create').mockResolvedValue({
        id: '3',
        position: 3,
        status: 'WAITING',
        patientPhone: '+21698123456',
      });
      vi.spyOn(notificationService, 'sendQueueJoined').mockResolvedValue();

      const result = await queueService.addPatient(clinicId, {
        patientPhone: '+21698123456',
        patientName: 'Test Patient',
      });

      expect(result.position).toBe(3);
      expect(queueRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          clinicId,
          position: 3,
          status: 'WAITING',
        })
      );
      expect(notificationService.sendQueueJoined).toHaveBeenCalled();
    });

    it('throws error for duplicate check-in', async () => {
      const mockExisting = {
        id: '1',
        patientPhone: '+21698123456',
        status: 'WAITING',
      };

      vi.spyOn(queueRepository, 'findByPhoneToday').mockResolvedValue(mockExisting);

      await expect(
        queueService.addPatient(clinicId, {
          patientPhone: '+21698123456',
        })
      ).rejects.toThrow('Patient already in queue');
    });
  });

  describe('callNextPatient', () => {
    it('updates first waiting patient to IN_CONSULTATION', async () => {
      const mockQueue = [
        { id: '1', position: 1, status: 'WAITING' },
        { id: '2', position: 2, status: 'WAITING' },
      ];

      vi.spyOn(queueRepository, 'findTodayQueue').mockResolvedValue(mockQueue);
      vi.spyOn(queueRepository, 'updateStatus').mockResolvedValue({
        ...mockQueue[0],
        status: 'IN_CONSULTATION',
      });
      vi.spyOn(queueRepository, 'recalculatePositions').mockResolvedValue();
      vi.spyOn(notificationService, 'sendYourTurn').mockResolvedValue();

      const result = await queueService.callNextPatient(clinicId);

      expect(result.id).toBe('1');
      expect(queueRepository.updateStatus).toHaveBeenCalledWith(
        '1',
        'IN_CONSULTATION'
      );
      expect(queueRepository.recalculatePositions).toHaveBeenCalledWith(clinicId);
      expect(notificationService.sendYourTurn).toHaveBeenCalled();
    });

    it('throws error when no patients waiting', async () => {
      vi.spyOn(queueRepository, 'findTodayQueue').mockResolvedValue([]);

      await expect(
        queueService.callNextPatient(clinicId)
      ).rejects.toThrow('No patients waiting');
    });
  });
});
```

---

## Integration Testing

### API Integration Tests

**What to Test:**

- Complete request/response cycles
- Database interactions
- Authentication middleware
- Error handling
- Socket.io events

**Framework Setup:**

```typescript
// src/test/integration/setup.ts
import { PrismaClient } from '@prisma/client';
import { Server } from 'http';
import { app } from '../app';

export let server: Server;
export let prisma: PrismaClient;

export async function setupTestEnvironment() {
  // Use test database
  prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL_TEST,
      },
    },
  });

  // Clear all tables
  await prisma.queueEntry.deleteMany();
  await prisma.clinic.deleteMany();

  // Start server
  server = app.listen(0); // Random available port
}

export async function teardownTestEnvironment() {
  await prisma.$disconnect();
  server.close();
}
```

#### Example: Testing API Endpoints

```typescript
// src/routes/queue.routes.test.ts
import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { app } from '../app';
import { setupTestEnvironment, teardownTestEnvironment, prisma } from '../test/integration/setup';

describe('Queue API Integration Tests', () => {
  let authToken: string;
  let clinicId: string;

  beforeAll(async () => {
    await setupTestEnvironment();

    // Create test clinic
    const clinic = await prisma.clinic.create({
      data: {
        name: 'Test Clinic',
        email: 'test@clinic.com',
        passwordHash: await bcrypt.hash('password123', 10),
      },
    });
    clinicId = clinic.id;

    // Login to get token
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@clinic.com',
        password: 'password123',
      });

    authToken = loginResponse.body.token;
  });

  afterAll(async () => {
    await teardownTestEnvironment();
  });

  beforeEach(async () => {
    // Clear queue entries before each test
    await prisma.queueEntry.deleteMany();
  });

  describe('POST /api/queue', () => {
    it('creates new queue entry', async () => {
      const response = await request(app)
        .post('/api/queue')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          patientPhone: '+21698123456',
          patientName: 'Ahmed Ben Salem',
        });

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        id: expect.any(String),
        clinicId,
        patientPhone: '+21698123456',
        patientName: 'Ahmed Ben Salem',
        position: 1,
        status: 'WAITING',
        checkInMethod: 'MANUAL',
      });

      // Verify database
      const dbEntry = await prisma.queueEntry.findUnique({
        where: { id: response.body.id },
      });
      expect(dbEntry).not.toBeNull();
      expect(dbEntry!.position).toBe(1);
    });

    it('returns 409 for duplicate check-in', async () => {
      // First check-in
      await request(app)
        .post('/api/queue')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ patientPhone: '+21698123456' });

      // Duplicate check-in
      const response = await request(app)
        .post('/api/queue')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ patientPhone: '+21698123456' });

      expect(response.status).toBe(409);
      expect(response.body.error.code).toBe('DUPLICATE_ENTRY');
    });

    it('returns 400 for invalid phone number', async () => {
      const response = await request(app)
        .post('/api/queue')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ patientPhone: 'invalid' });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('returns 401 without auth token', async () => {
      const response = await request(app)
        .post('/api/queue')
        .send({ patientPhone: '+21698123456' });

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/queue/next', () => {
    it('calls next patient successfully', async () => {
      // Create 3 waiting patients
      await prisma.queueEntry.createMany({
        data: [
          { clinicId, patientPhone: '+21698111111', position: 1, status: 'WAITING' },
          { clinicId, patientPhone: '+21698222222', position: 2, status: 'WAITING' },
          { clinicId, patientPhone: '+21698333333', position: 3, status: 'WAITING' },
        ],
      });

      const response = await request(app)
        .post('/api/queue/next')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.calledPatient).toMatchObject({
        position: 1,
        status: 'IN_CONSULTATION',
      });

      // Verify positions recalculated
      const remainingQueue = await prisma.queueEntry.findMany({
        where: { clinicId, status: 'WAITING' },
        orderBy: { position: 'asc' },
      });

      expect(remainingQueue).toHaveLength(2);
      expect(remainingQueue[0].position).toBe(1); // Was position 2, now 1
      expect(remainingQueue[1].position).toBe(2); // Was position 3, now 2
    });

    it('returns 404 when no patients waiting', async () => {
      const response = await request(app)
        .post('/api/queue/next')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe('NO_PATIENTS_WAITING');
    });
  });

  describe('GET /api/queue', () => {
    it('returns today\'s queue', async () => {
      await prisma.queueEntry.createMany({
        data: [
          { clinicId, patientPhone: '+21698111111', position: 1, status: 'WAITING' },
          { clinicId, patientPhone: '+21698222222', position: 2, status: 'WAITING' },
        ],
      });

      const response = await request(app)
        .get('/api/queue')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.queue).toHaveLength(2);
      expect(response.body.stats).toMatchObject({
        waiting: 2,
        inConsultation: 0,
        completed: 0,
      });
    });

    it('filters by status', async () => {
      await prisma.queueEntry.createMany({
        data: [
          { clinicId, patientPhone: '+21698111111', position: 1, status: 'WAITING' },
          { clinicId, patientPhone: '+21698222222', position: 0, status: 'COMPLETED', completedAt: new Date() },
        ],
      });

      const response = await request(app)
        .get('/api/queue?status=WAITING')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.queue).toHaveLength(1);
      expect(response.body.queue[0].status).toBe('WAITING');
    });
  });
});
```

---

## End-to-End Testing

### E2E Tests with Playwright

**Critical User Flows to Test:**

1. Patient QR check-in → Real-time updates → Called for consultation
2. Receptionist adds patient → Doctor calls next → Patient notified
3. Patient arrives → Waits → Gets "almost turn" → Called → Completed
4. No-show scenario → Patient marked absent → Next patient called
5. Offline resilience → Network disconnect → Reconnect → Data syncs

#### Example: E2E Test - Complete Patient Journey

```typescript
// tests/e2e/patient-journey.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Complete Patient Journey', () => {
  test('patient checks in via QR, waits, and gets called', async ({ page, context }) => {
    // Step 1: Patient scans QR code
    await page.goto('http://localhost:5173/checkin/clinic-test-id');

    // Step 2: Patient enters phone number
    await page.fill('input[name="patientPhone"]', '+21698123456');
    await page.fill('input[name="patientName"]', 'Ahmed Test');
    await page.click('button:has-text("Rejoindre la file")');

    // Step 3: Verify redirect to status page
    await expect(page).toHaveURL(/\/patient\/[a-z0-9-]+/);

    // Step 4: Verify position displayed
    await expect(page.locator('[data-testid="position"]')).toContainText('#1');
    await expect(page.locator('[data-testid="estimated-wait"]')).toContainText('min');

    // Step 5: Open doctor dashboard in new tab
    const doctorPage = await context.newPage();
    await doctorPage.goto('http://localhost:5173/login');
    await doctorPage.fill('input[type="email"]', 'test@clinic.com');
    await doctorPage.fill('input[type="password"]', 'password123');
    await doctorPage.click('button:has-text("Se connecter")');

    await expect(doctorPage).toHaveURL('/dashboard');

    // Step 6: Verify patient appears in queue
    await expect(doctorPage.locator('[data-testid="queue-item"]')).toContainText('Ahmed Test');

    // Step 7: Doctor calls next patient
    await doctorPage.click('button:has-text("Appeler Suivant")');

    // Step 8: Verify patient status page updates (real-time via Socket.io)
    await expect(page.locator('[data-testid="status"]')).toContainText("C'EST VOTRE TOUR", {
      timeout: 5000, // Wait up to 5s for Socket.io event
    });

    // Step 9: Verify visual change (green background)
    await expect(page.locator('[data-testid="status-card"]')).toHaveClass(/bg-green/);

    // Step 10: Doctor marks as completed
    await doctorPage.click('[data-testid="mark-complete-btn"]');

    // Step 11: Verify patient moved to completed
    await expect(doctorPage.locator('[data-testid="completed-list"]')).toContainText('Ahmed Test');
  });

  test('handles offline scenario gracefully', async ({ page, context }) => {
    // Check in patient
    await page.goto('http://localhost:5173/checkin/clinic-test-id');
    await page.fill('input[name="patientPhone"]', '+21698123456');
    await page.click('button:has-text("Rejoindre la file")');

    await expect(page).toHaveURL(/\/patient\/[a-z0-9-]+/);

    // Simulate offline
    await context.setOffline(true);

    // Verify offline indicator appears
    await expect(page.locator('[data-testid="connection-status"]')).toContainText('Déconnecté');

    // Simulate going back online
    await context.setOffline(false);

    // Verify connection restored
    await expect(page.locator('[data-testid="connection-status"]')).toContainText('Connecté', {
      timeout: 10000,
    });

    // Verify position still displayed (data persisted)
    await expect(page.locator('[data-testid="position"]')).toBeVisible();
  });
});
```

---

## Performance Testing

### Load Testing with k6

```javascript
// tests/load/queue-operations.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '1m', target: 50 },  // Ramp up to 50 users
    { duration: '3m', target: 50 },  // Stay at 50 users
    { duration: '1m', target: 100 }, // Spike to 100 users
    { duration: '2m', target: 100 }, // Stay at 100 users
    { duration: '1m', target: 0 },   // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95% of requests under 2s
    http_req_failed: ['rate<0.01'],    // Error rate < 1%
  },
};

const BASE_URL = 'http://localhost:3001';

export default function () {
  // Login
  const loginRes = http.post(`${BASE_URL}/api/auth/login`, JSON.stringify({
    email: 'test@clinic.com',
    password: 'password123',
  }), {
    headers: { 'Content-Type': 'application/json' },
  });

  check(loginRes, {
    'login successful': (r) => r.status === 200,
  });

  const token = loginRes.json('token');

  // Get queue
  const queueRes = http.get(`${BASE_URL}/api/queue`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  check(queueRes, {
    'queue fetched': (r) => r.status === 200,
    'response time OK': (r) => r.timings.duration < 2000,
  });

  sleep(1);
}
```

**Run:**
```bash
k6 run tests/load/queue-operations.js
```

---

## Accessibility Testing

### Automated Testing with axe-core

```typescript
// tests/a11y/accessibility.spec.ts
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility Tests', () => {
  test('patient status page is accessible', async ({ page }) => {
    await page.goto('http://localhost:5173/patient/test-entry-id');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('queue dashboard is accessible', async ({ page }) => {
    await page.goto('http://localhost:5173/dashboard');

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    expect(results.violations).toEqual([]);
  });
});
```

### Manual Accessibility Checklist

- [ ] Keyboard navigation works (Tab, Enter, Escape)
- [ ] Screen reader announces all interactive elements
- [ ] Color contrast ratio ≥ 4.5:1 for text
- [ ] Focus indicators visible
- [ ] ARIA labels on icon buttons
- [ ] Form inputs have labels
- [ ] Error messages announced
- [ ] Language attribute set (lang="fr" or lang="ar")
- [ ] RTL layout works correctly for Arabic

---

## Test Data Management

### Database Seed for Testing

```typescript
// prisma/seed-test.ts
import { PrismaClient, QueueStatus, CheckInMethod } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

export async function seedTestData() {
  // Create test clinic
  const clinic = await prisma.clinic.create({
    data: {
      name: 'Cabinet Dr. Test',
      email: 'test@doctorq.tn',
      passwordHash: await bcrypt.hash('test123', 10),
      doctorName: 'Dr. Test',
      language: 'fr',
      avgConsultationMins: 15,
      notifyAtPosition: 2,
    },
  });

  // Create queue entries with various statuses
  await prisma.queueEntry.createMany({
    data: [
      {
        clinicId: clinic.id,
        patientName: 'Patient 1 Waiting',
        patientPhone: '+21698111111',
        position: 1,
        status: QueueStatus.WAITING,
        checkInMethod: CheckInMethod.QR_CODE,
      },
      {
        clinicId: clinic.id,
        patientName: 'Patient 2 Waiting',
        patientPhone: '+21698222222',
        position: 2,
        status: QueueStatus.WAITING,
        checkInMethod: CheckInMethod.MANUAL,
      },
      {
        clinicId: clinic.id,
        patientName: 'Patient In Consultation',
        patientPhone: '+21698333333',
        position: 0,
        status: QueueStatus.IN_CONSULTATION,
        checkInMethod: CheckInMethod.QR_CODE,
        calledAt: new Date(),
      },
      {
        clinicId: clinic.id,
        patientName: 'Patient Completed',
        patientPhone: '+21698444444',
        position: 0,
        status: QueueStatus.COMPLETED,
        checkInMethod: CheckInMethod.MANUAL,
        completedAt: new Date(),
      },
    ],
  });

  console.log('Test data seeded successfully');
}
```

---

## CI/CD Integration

### GitHub Actions Workflow

```yaml
# .github/workflows/test.yml
name: Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  unit-tests:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: doctorq_test
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install pnpm
        run: npm install -g pnpm

      - name: Install dependencies
        run: pnpm install

      - name: Run unit tests
        run: pnpm test
        env:
          DATABASE_URL_TEST: postgresql://test:test@localhost:5432/doctorq_test

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm install -g pnpm
      - run: pnpm install
      - run: pnpm playwright install --with-deps
      - run: pnpm test:e2e
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

---

## Manual Testing Checklist

### Pre-Release Testing

**Queue Management:**
- [ ] Add patient manually
- [ ] Patient checks in via QR code
- [ ] Call next patient
- [ ] Mark patient as completed
- [ ] Mark patient as no-show
- [ ] Remove patient from queue
- [ ] Send manual notification

**Real-time Updates:**
- [ ] Position updates automatically
- [ ] "Your turn" notification appears instantly
- [ ] Doctor sees queue updates without refresh
- [ ] WebSocket reconnects after disconnect

**Notifications:**
- [ ] SMS sent on check-in (verify actual SMS delivery)
- [ ] "Almost turn" SMS sent (position ≤ 2)
- [ ] "Your turn" SMS sent when called
- [ ] WhatsApp messages work (if enabled)
- [ ] French translations correct
- [ ] Arabic translations correct (RTL layout)

**Mobile Responsiveness:**
- [ ] Patient status page on mobile (iOS)
- [ ] Patient status page on mobile (Android)
- [ ] Doctor dashboard on tablet
- [ ] Check-in page on mobile

**Browser Compatibility:**
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (iOS)
- [ ] Edge

**Performance:**
- [ ] Page load < 5 seconds
- [ ] API response < 2 seconds
- [ ] Queue with 50+ patients performs well

---

## Next Steps

- **Implementation**: See [15_Project_Phases.md](./15_Project_Phases.md) for test integration timeline
- **CI/CD**: See [13_Launch_Checklist.md](./13_Launch_Checklist.md) for deployment pipeline
- **Standards**: See [10_Coding_Standards.md](./10_Coding_Standards.md) for test code conventions
