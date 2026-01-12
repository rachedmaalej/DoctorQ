# 09_Claude_Code_Configuration.md

## Overview

This document defines Claude Code skills, agents, and slash commands specifically designed for DoctorQ development. These configurations enable rapid, consistent development by encoding project-specific patterns and workflows.

## Table of Contents

1. [Custom Skills](#custom-skills)
2. [Custom Agents](#custom-agents)
3. [Slash Commands](#slash-commands)
4. [IDE Integration](#ide-integration)
5. [Workflow Examples](#workflow-examples)

---

## Custom Skills

Skills are reusable task templates stored in `.claude/skills/`. Each skill encodes a specific development pattern.

### Skill 1: queue-component

**File:** `.claude/skills/queue-component.md`

**Purpose:** Generate queue management components following DoctorQ patterns

**Usage:** `/queue-component QueueList`

**Description:**
Creates a new queue-related component with proper TypeScript types, Tailwind styling, and Socket.io integration. Follows DoctorQ component structure and naming conventions.

**Capabilities:**
- Generate component with props interface
- Include Socket.io hooks for real-time updates
- Add accessibility attributes (ARIA labels)
- Include error boundaries
- Follow naming conventions (PascalCase)
- Add proper TypeScript types from shared types

**Example Output:**
```typescript
// components/queue/QueueList.tsx
import { QueueEntry, QueueStatus } from '@/types';
import { useSocket } from '@/hooks/use-socket';
import { Badge } from '@/components/ui/badge';

export interface QueueListProps {
  entries: QueueEntry[];
  onCallNext: () => void;
  onRemove: (id: string) => void;
  onNotify: (id: string) => void;
}

export function QueueList({
  entries,
  onCallNext,
  onRemove,
  onNotify,
}: QueueListProps) {
  const { isConnected } = useSocket();

  return (
    <div className="space-y-4">
      {/* Connection indicator */}
      <div className="flex items-center gap-2">
        <span className={`h-2 w-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
        <span className="text-sm text-gray-600">
          {isConnected ? 'Connecté' : 'Déconnecté'}
        </span>
      </div>

      {/* Queue list */}
      {entries.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          Aucun patient en attente
        </div>
      ) : (
        entries.map((entry) => (
          <QueueItem
            key={entry.id}
            entry={entry}
            onRemove={() => onRemove(entry.id)}
            onNotify={() => onNotify(entry.id)}
          />
        ))
      )}
    </div>
  );
}
```

---

### Skill 2: patient-view

**File:** `.claude/skills/patient-view.md`

**Purpose:** Generate patient-facing status page components

**Usage:** `/patient-view PositionCard`

**Description:**
Creates patient status components with real-time position updates, estimated wait time display, and visual status indicators. Includes Socket.io integration and mobile-first responsive design.

**Example Output:**
```typescript
// components/patient/PositionCard.tsx
import { QueueStatus } from '@/types';
import { useEffect, useState } from 'react';
import { useSocket } from '@/hooks/use-socket';

export interface PositionCardProps {
  entryId: string;
  position: number;
  estimatedWaitMins: number;
  status: QueueStatus;
}

export function PositionCard({
  entryId,
  position,
  estimatedWaitMins,
  status,
}: PositionCardProps) {
  const { socket } = useSocket();
  const [currentPosition, setCurrentPosition] = useState(position);
  const [estimatedWait, setEstimatedWait] = useState(estimatedWaitMins);

  useEffect(() => {
    if (!socket) return;

    socket.emit('join:patient', { entryId });

    socket.on('position:changed', ({ newPosition, estimatedWait }) => {
      setCurrentPosition(newPosition);
      setEstimatedWait(estimatedWait);
    });

    return () => {
      socket.emit('leave:patient', { entryId });
      socket.off('position:changed');
    };
  }, [socket, entryId]);

  const isYourTurn = status === 'IN_CONSULTATION';

  return (
    <div
      className={`rounded-xl p-6 ${
        isYourTurn
          ? 'bg-green-50 border-2 border-green-500'
          : 'bg-white border border-gray-200'
      }`}
    >
      {isYourTurn ? (
        <div className="text-center">
          <h1 className="text-4xl font-bold text-green-900 mb-2">
            🎉 C'EST VOTRE TOUR!
          </h1>
          <p className="text-lg text-green-700">
            Présentez-vous à l'accueil
          </p>
        </div>
      ) : (
        <div className="text-center">
          <p className="text-sm text-gray-600 mb-1">Votre position</p>
          <h1 className="text-6xl font-bold text-primary-600 mb-4">
            #{currentPosition}
          </h1>
          <p className="text-lg text-gray-700">
            Attente estimée: <span className="font-semibold">{estimatedWait} min</span>
          </p>
        </div>
      )}
    </div>
  );
}
```

---

### Skill 3: api-route

**File:** `.claude/skills/api-route.md`

**Purpose:** Scaffold Express API routes with validation and error handling

**Usage:** `/api-route queue`

**Description:**
Creates complete Express route with controller, service layer, Zod validation, authentication middleware, and proper error handling. Follows DoctorQ API conventions.

**Example Output:**
```typescript
// routes/queue.routes.ts
import { Router } from 'express';
import { z } from 'zod';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware';
import { queueController } from '../controllers/queue.controller';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// GET /api/queue - Get today's queue
router.get('/', queueController.getQueue);

// POST /api/queue - Add patient
router.post('/', queueController.addPatient);

// POST /api/queue/next - Call next patient
router.post('/next', queueController.callNextPatient);

// PATCH /api/queue/:id/status - Update status
router.patch('/:id/status', queueController.updateStatus);

// DELETE /api/queue/:id - Remove patient
router.delete('/:id', queueController.removePatient);

export { router as queueRouter };
```

```typescript
// controllers/queue.controller.ts
import { Response } from 'express';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth.middleware';
import { queueService } from '../services/queue.service';

const AddPatientSchema = z.object({
  patientPhone: z.string().regex(/^(\+216)?[2459]\d{7}$/, 'Invalid Tunisia phone'),
  patientName: z.string().min(1).max(100).optional(),
  visitReason: z.string().max(500).optional(),
});

export const queueController = {
  async addPatient(req: AuthRequest, res: Response) {
    try {
      const data = AddPatientSchema.parse(req.body);
      const clinicId = req.clinic!.id;

      const entry = await queueService.addPatient(clinicId, data);

      res.status(201).json(entry);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request data',
            details: error.errors,
          },
        });
      }
      throw error;
    }
  },

  async getQueue(req: AuthRequest, res: Response) {
    const clinicId = req.clinic!.id;
    const status = req.query.status as string | undefined;

    const result = await queueService.getTodayQueue(clinicId, status);

    res.json(result);
  },

  // ... other methods
};
```

---

### Skill 4: prisma-model

**File:** `.claude/skills/prisma-model.md`

**Purpose:** Add Prisma models with migrations and proper relationships

**Usage:** `/prisma-model Notification`

**Description:**
Creates new Prisma model with proper field types, indexes, relationships, and generates migration. Follows DoctorQ schema conventions.

**Example Output:**
```prisma
// prisma/schema.prisma

model Notification {
  id        String   @id @default(uuid())

  // Relations
  clinicId  String
  clinic    Clinic   @relation(fields: [clinicId], references: [id], onDelete: Cascade)

  entryId   String?
  entry     QueueEntry? @relation(fields: [entryId], references: [id], onDelete: SetNull)

  // Notification details
  type      NotificationType
  method    NotificationMethod
  recipient String  // Phone number or WhatsApp ID
  message   String  @db.Text

  // Delivery tracking
  status    NotificationStatus @default(PENDING)
  sentAt    DateTime?
  deliveredAt DateTime?
  failedAt  DateTime?
  errorMessage String?

  // External provider
  externalId String?  // Twilio MessageSid or WhatsApp message ID

  // Retry logic
  retryCount Int @default(0)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([clinicId, createdAt])
  @@index([entryId])
  @@index([status])
}

enum NotificationType {
  QUEUE_JOINED
  ALMOST_TURN
  YOUR_TURN
  MANUAL
}

enum NotificationMethod {
  SMS
  WHATSAPP
}

enum NotificationStatus {
  PENDING
  SENT
  DELIVERED
  FAILED
}
```

```bash
# Generated migration command
pnpm prisma migrate dev --name add_notification_model
```

---

### Skill 5: socket-event

**File:** `.claude/skills/socket-event.md`

**Purpose:** Create Socket.io event handlers (client + server)

**Usage:** `/socket-event position-changed`

**Description:**
Generates paired Socket.io event handlers for both server and client, with proper TypeScript types and room management.

**Example Output:**

**Server:**
```typescript
// socket/handlers/position.handler.ts
import { Server, Socket } from 'socket.io';
import { queueRepository } from '../../repositories/queue.repository';

export function setupPositionHandlers(io: Server) {
  return {
    async emitPositionChanged(entryId: string) {
      const entry = await queueRepository.findById(entryId);

      if (!entry) return;

      const estimatedWait = calculateEstimatedWait(
        entry.position,
        entry.clinic.avgConsultationMins
      );

      io.to(`patient:${entryId}`).emit('position:changed', {
        newPosition: entry.position,
        estimatedWaitMins: estimatedWait,
      });
    },
  };
}
```

**Client:**
```typescript
// hooks/use-position-updates.ts
import { useEffect } from 'react';
import { useSocket } from './use-socket';

interface PositionChangedPayload {
  newPosition: number;
  estimatedWaitMins: number;
}

export function usePositionUpdates(
  entryId: string,
  onPositionChanged: (payload: PositionChangedPayload) => void
) {
  const { socket } = useSocket();

  useEffect(() => {
    if (!socket) return;

    socket.emit('join:patient', { entryId });

    socket.on('position:changed', onPositionChanged);

    return () => {
      socket.emit('leave:patient', { entryId });
      socket.off('position:changed');
    };
  }, [socket, entryId, onPositionChanged]);
}
```

---

### Skill 6: sms-template

**File:** `.claude/skills/sms-template.md`

**Purpose:** Generate i18n SMS templates with FR/AR translations

**Usage:** `/sms-template reminder`

**Description:**
Creates bilingual SMS templates with proper variable interpolation, character count optimization, and i18n integration.

**Example Output:**
```typescript
// lib/sms-templates.ts
export const SMS_TEMPLATES = {
  REMINDER: {
    fr: "{{clinicName}} - Rappel: Rendez-vous aujourd'hui. Position actuelle: #{{position}}. Lien: {{link}}",
    ar: "{{clinicName}} - تذكير: موعدك اليوم. موقعك الحالي: #{{position}}. الرابط: {{link}}",
  },
} as const;

// Character counts (including variables)
// FR: ~95 chars (1 SMS)
// AR: ~85 chars (1 SMS)
```

```typescript
// services/notification.service.ts
import { SMS_TEMPLATES } from '../lib/sms-templates';

export async function sendReminder(
  phone: string,
  language: 'fr' | 'ar',
  vars: { clinicName: string; position: number; link: string }
) {
  const template = SMS_TEMPLATES.REMINDER[language];

  const message = template
    .replace('{{clinicName}}', vars.clinicName)
    .replace('{{position}}', vars.position.toString())
    .replace('{{link}}', vars.link);

  await twilioClient.messages.create({
    to: phone,
    from: process.env.TWILIO_PHONE_NUMBER,
    body: message,
  });
}
```

---

### Skill 7: test-suite

**File:** `.claude/skills/test-suite.md`

**Purpose:** Generate test files (unit, integration, E2E) for components/routes

**Usage:** `/test-suite queue.service`

**Description:**
Creates comprehensive test suite with proper mocking, assertions, and coverage for DoctorQ components and services.

**Example Output:**
```typescript
// services/queue.service.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { queueService } from './queue.service';
import { queueRepository } from '../repositories/queue.repository';
import { notificationService } from './notification.service';

vi.mock('../repositories/queue.repository');
vi.mock('./notification.service');

describe('QueueService', () => {
  const clinicId = 'test-clinic-id';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('addPatient', () => {
    it('adds patient with correct position', async () => {
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
    it('calls next patient and recalculates positions', async () => {
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
      expect(queueRepository.updateStatus).toHaveBeenCalledWith('1', 'IN_CONSULTATION');
      expect(queueRepository.recalculatePositions).toHaveBeenCalledWith(clinicId);
      expect(notificationService.sendYourTurn).toHaveBeenCalled();
    });

    it('throws error when no patients waiting', async () => {
      vi.spyOn(queueRepository, 'findTodayQueue').mockResolvedValue([]);

      await expect(queueService.callNextPatient(clinicId)).rejects.toThrow(
        'No patients waiting'
      );
    });
  });
});
```

---

## Custom Agents

Agents are specialized Claude instances configured for specific tasks in `.claude/agents/`.

### Agent 1: queue-logic-agent

**File:** `.claude/agents/queue-logic-agent.json`

**Purpose:** Specializes in queue position calculations, status transitions, and business logic

**Configuration:**
```json
{
  "name": "queue-logic-agent",
  "description": "Expert in queue management logic: position calculation, status transitions, no-show handling",
  "model": "sonnet",
  "tools": ["Read", "Write", "Edit", "Bash", "Grep", "Glob"],
  "context": [
    "Focus on queue business logic implementation",
    "Ensure position recalculation is accurate",
    "Handle edge cases: duplicate check-in, empty queue, concurrent updates",
    "Use Prisma transactions for atomic operations",
    "Emit Socket.io events after state changes"
  ],
  "restrictions": [
    "Do not modify authentication logic",
    "Do not change database schema without approval",
    "Always test position calculation edge cases"
  ]
}
```

**Usage:**
```bash
# Launch agent for queue logic task
claude task --agent queue-logic-agent "Fix position calculation when patient is removed mid-queue"
```

---

### Agent 2: notification-agent

**File:** `.claude/agents/notification-agent.json`

**Purpose:** Handles SMS/WhatsApp routing, template rendering, retry logic

**Configuration:**
```json
{
  "name": "notification-agent",
  "description": "Expert in notification delivery: SMS/WhatsApp routing, template rendering, retry logic, delivery tracking",
  "model": "sonnet",
  "tools": ["Read", "Write", "Edit", "Bash"],
  "context": [
    "Route notifications based on checkInMethod (QR→SMS, WhatsApp→WhatsApp)",
    "Implement exponential backoff retry (3 attempts: 2s, 4s, 8s)",
    "Log all notification attempts to database",
    "Optimize SMS length to stay within 160 chars (1 SMS)",
    "Handle Twilio errors gracefully (invalid number, rate limit, etc.)"
  ],
  "restrictions": [
    "Never send notifications without user consent",
    "Respect daily SMS limits (500/clinic/day)",
    "Do not expose Twilio credentials in logs"
  ]
}
```

---

### Agent 3: auth-agent

**File:** `.claude/agents/auth-agent.json`

**Purpose:** JWT implementation, middleware, route protection

**Configuration:**
```json
{
  "name": "auth-agent",
  "description": "Expert in authentication: JWT generation/validation, auth middleware, session management",
  "model": "sonnet",
  "tools": ["Read", "Write", "Edit", "Grep"],
  "context": [
    "Use bcrypt for password hashing (10 rounds)",
    "JWT expires in 7 days",
    "Attach clinic info to AuthRequest.clinic",
    "Return 401 for invalid/expired tokens",
    "Never log passwords or tokens"
  ],
  "restrictions": [
    "Do not reduce password hash rounds below 10",
    "Do not change JWT_SECRET in production without migration plan",
    "Always validate token signature"
  ]
}
```

---

### Agent 4: real-time-agent

**File:** `.claude/agents/real-time-agent.json`

**Purpose:** Socket.io event design, room management, connection handling

**Configuration:**
```json
{
  "name": "real-time-agent",
  "description": "Expert in real-time features: Socket.io rooms, event emission, connection management, fallback to polling",
  "model": "sonnet",
  "tools": ["Read", "Write", "Edit", "Bash"],
  "context": [
    "Use rooms for isolation: clinic:${clinicId}, patient:${entryId}",
    "Verify authentication before joining clinic rooms (JWT)",
    "Emit to specific rooms, never broadcast to all",
    "Handle disconnect/reconnect gracefully",
    "Implement fallback polling if WebSocket unavailable"
  ],
  "restrictions": [
    "Do not allow unauthenticated access to clinic rooms",
    "Do not emit sensitive data to wrong rooms",
    "Always clean up listeners on disconnect"
  ]
}
```

---

### Agent 5: i18n-agent

**File:** `.claude/agents/i18n-agent.json`

**Purpose:** Translation management, RTL layout fixes, bilingual content

**Configuration:**
```json
{
  "name": "i18n-agent",
  "description": "Expert in internationalization: French/Arabic translations, RTL layout, i18next configuration",
  "model": "sonnet",
  "tools": ["Read", "Write", "Edit", "Grep"],
  "context": [
    "French is default language (fr)",
    "Arabic requires RTL layout (dir='rtl')",
    "Use logical CSS properties (ms-4 not ml-4) for RTL compatibility",
    "SMS templates must fit in 160 chars for both languages",
    "Test UI in both LTR and RTL modes"
  ],
  "restrictions": [
    "Do not use directional CSS (margin-left, padding-right) - use logical properties",
    "Always provide both FR and AR translations",
    "Verify RTL layout doesn't break UI"
  ]
}
```

---

## Slash Commands

Slash commands are quick shortcuts for common operations (configured in project settings).

### /db-migrate

**Command:** Run Prisma migrations with safety checks

**Implementation:**
```bash
#!/bin/bash
# Check if migrations are pending
pnpm prisma migrate status

# Prompt for confirmation
read -p "Run migrations? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]
then
    pnpm prisma migrate deploy
    echo "✅ Migrations completed"
else
    echo "❌ Migrations cancelled"
fi
```

---

### /seed-test-data

**Command:** Populate database with test data

**Implementation:**
```bash
pnpm prisma db seed
echo "✅ Test data seeded: 1 clinic, 5 patients"
```

---

### /run-tests

**Command:** Execute test suites in order

**Implementation:**
```bash
echo "Running unit tests..."
pnpm test:unit

echo "Running integration tests..."
pnpm test:integration

echo "Running E2E tests..."
pnpm test:e2e

echo "✅ All tests completed"
```

---

## IDE Integration

### VS Code Tasks

**File:** `.vscode/tasks.json`

```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Generate Queue Component",
      "type": "shell",
      "command": "claude",
      "args": ["skill", "queue-component", "${input:componentName}"],
      "problemMatcher": []
    },
    {
      "label": "Create API Route",
      "type": "shell",
      "command": "claude",
      "args": ["skill", "api-route", "${input:routeName}"],
      "problemMatcher": []
    }
  ],
  "inputs": [
    {
      "id": "componentName",
      "type": "promptString",
      "description": "Component name (e.g., QueueList)"
    },
    {
      "id": "routeName",
      "type": "promptString",
      "description": "Route name (e.g., queue)"
    }
  ]
}
```

---

## Workflow Examples

### Example 1: Adding New Feature

**Task:** Add "Send Manual Notification" feature

**Workflow:**
```bash
# 1. Plan the feature
claude task --agent general "Plan implementation for manual notification feature"

# 2. Create API route
claude skill api-route notification

# 3. Add Prisma model (if needed)
claude skill prisma-model Notification

# 4. Create Socket.io event
claude skill socket-event notification-sent

# 5. Generate tests
claude skill test-suite notification.service

# 6. Run tests
/run-tests
```

### Example 2: Fixing Bug

**Task:** Fix incorrect position calculation

**Workflow:**
```bash
# 1. Use specialized agent
claude task --agent queue-logic-agent "Fix position calculation bug when patient removed mid-queue"

# 2. Agent will:
#    - Read queue.service.ts
#    - Identify bug in recalculatePositions()
#    - Fix the logic
#    - Update/add tests
#    - Verify fix

# 3. Review changes and commit
git add .
git commit -m "fix(queue): correct position recalculation on patient removal"
```

### Example 3: Adding Translation

**Task:** Add new SMS template in FR/AR

**Workflow:**
```bash
# 1. Use i18n agent
claude task --agent i18n-agent "Add 'appointment reminder' SMS template in French and Arabic"

# 2. Generate template
claude skill sms-template appointment-reminder

# 3. Verify character counts
# FR: ~120 chars (1 SMS)
# AR: ~95 chars (1 SMS)

# 4. Test in both languages
```

---

## Next Steps

- **Implementation**: See [14_Claude_Code_Tools_Guide.md](./14_Claude_Code_Tools_Guide.md) for practical usage
- **Development Phases**: See [15_Project_Phases.md](./15_Project_Phases.md) for when to use each skill/agent
- **Coding Standards**: See [10_Coding_Standards.md](./10_Coding_Standards.md) for generated code quality
