# 10_Coding_Standards.md

## Overview

This document defines comprehensive coding standards, naming conventions, and best practices for the DoctorQ project. Consistency in code style improves readability, maintainability, and collaboration.

## Table of Contents

1. [TypeScript Standards](#typescript-standards)
2. [Naming Conventions](#naming-conventions)
3. [React Best Practices](#react-best-practices)
4. [API Design Patterns](#api-design-patterns)
5. [Git Workflow](#git-workflow)
6. [Documentation Standards](#documentation-standards)
7. [Code Review Checklist](#code-review-checklist)

---

## TypeScript Standards

### Strict Mode Configuration

**Always enable strict mode** in `tsconfig.json`:

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

### Type vs Interface

**Use `interface` for:**
- Object shapes that may be extended
- Public API contracts
- Component props

```typescript
// ✅ Good: Interface for component props
interface QueueListProps {
  entries: QueueEntry[];
  onCallNext: () => void;
  onRemove: (id: string) => void;
}

// ✅ Good: Interface that can be extended
interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

interface QueueEntry extends BaseEntity {
  patientName: string;
  position: number;
}
```

**Use `type` for:**
- Union types
- Intersection types
- Function types
- Type aliases for primitives

```typescript
// ✅ Good: Type for unions
type QueueStatus = 'WAITING' | 'NOTIFIED' | 'IN_CONSULTATION' | 'COMPLETED';
type CheckInMethod = 'QR_CODE' | 'MANUAL' | 'WHATSAPP' | 'SMS';

// ✅ Good: Type for function signatures
type NotificationSender = (
  phone: string,
  message: string
) => Promise<void>;

// ✅ Good: Type for intersections
type AuthenticatedRequest = Request & {
  clinic: {
    id: string;
    email: string;
  };
};
```

### Avoid `any`

**Never use `any`** - use `unknown` or proper typing instead.

```typescript
// ❌ Bad: Using any
function processData(data: any) {
  return data.name.toUpperCase(); // No type safety!
}

// ✅ Good: Using unknown with type guards
function processData(data: unknown) {
  if (typeof data === 'object' && data !== null && 'name' in data) {
    const { name } = data as { name: string };
    return name.toUpperCase();
  }
  throw new Error('Invalid data');
}

// ✅ Better: Use proper typing
interface UserData {
  name: string;
  email: string;
}

function processData(data: UserData) {
  return data.name.toUpperCase();
}
```

### Enum Usage

**Use enums for fixed constants** matching database enums.

```typescript
// ✅ Good: Enum matching Prisma schema
enum QueueStatus {
  WAITING = 'WAITING',
  NOTIFIED = 'NOTIFIED',
  IN_CONSULTATION = 'IN_CONSULTATION',
  COMPLETED = 'COMPLETED',
  NO_SHOW = 'NO_SHOW',
  CANCELLED = 'CANCELLED',
}

// Usage
const entry: QueueEntry = {
  status: QueueStatus.WAITING, // Type-safe
  // ...
};

// ❌ Bad: Using string literals
const entry = {
  status: 'waiting', // Typo-prone, no autocomplete
};
```

### Null vs Undefined

**Prefer `null` for intentional absence, `undefined` for uninitialized.**

```typescript
// ✅ Good: Null for "no value"
interface QueueEntry {
  patientName: string | null; // May be explicitly null
  completedAt: Date | null;   // Null until completed
}

// ✅ Good: Undefined for optional properties
interface AddPatientRequest {
  patientPhone: string;
  patientName?: string; // Optional = may be undefined
  visitReason?: string;
}

// ❌ Bad: Mixing null and undefined inconsistently
interface BadExample {
  name: string | null | undefined; // Confusing
}
```

### Type Assertions

**Avoid type assertions** unless absolutely necessary. Use type guards instead.

```typescript
// ❌ Bad: Type assertion without validation
const user = JSON.parse(jsonString) as User;

// ✅ Good: Validate before asserting
function parseUser(jsonString: string): User {
  const data = JSON.parse(jsonString);

  // Runtime validation (use Zod for complex objects)
  if (
    typeof data === 'object' &&
    'id' in data &&
    'email' in data
  ) {
    return data as User;
  }

  throw new Error('Invalid user data');
}

// ✅ Better: Use Zod schema
const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
});

const user = UserSchema.parse(JSON.parse(jsonString));
```

---

## Naming Conventions

### General Rules

| Element | Convention | Example |
|---------|-----------|---------|
| **Variables** | camelCase | `queueEntry`, `patientPhone` |
| **Functions** | camelCase | `calculateWaitTime()`, `sendNotification()` |
| **Classes** | PascalCase | `QueueService`, `NotificationManager` |
| **Components** | PascalCase | `QueueList`, `PositionCard` |
| **Files (general)** | kebab-case | `queue-service.ts`, `auth-utils.ts` |
| **React components** | PascalCase | `QueueList.tsx`, `AddPatientModal.tsx` |
| **Constants** | SCREAMING_SNAKE_CASE | `SMS_DAILY_LIMIT`, `MAX_RETRIES` |
| **Types/Interfaces** | PascalCase | `QueueEntry`, `AuthRequest` |
| **Enums** | PascalCase | `QueueStatus`, `CheckInMethod` |
| **Database tables** | snake_case | `queue_entries`, `daily_stats` |
| **Prisma models** | PascalCase | `QueueEntry`, `DailyStat` |

### Variable Naming

```typescript
// ✅ Good: Descriptive, clear intent
const patientPhone = '+21698123456';
const estimatedWaitMinutes = 75;
const isQueueEmpty = queue.length === 0;

// ❌ Bad: Abbreviations, unclear
const ph = '+21698123456';
const ew = 75;
const empty = queue.length === 0;

// ✅ Good: Boolean variables start with is/has/should/can
const isAuthenticated = !!token;
const hasWaitingPatients = waitingCount > 0;
const shouldSendNotification = position <= 2;

// ❌ Bad: Non-descriptive boolean names
const authenticated = !!token;
const patients = waitingCount > 0;
```

### Function Naming

```typescript
// ✅ Good: Verb + noun, describes action
function calculateEstimatedWait(position: number): number { }
function sendSMSNotification(phone: string, message: string): Promise<void> { }
function recalculateQueuePositions(clinicId: string): Promise<void> { }

// ❌ Bad: Noun only, unclear action
function estimatedWait(position: number): number { }
function sms(phone: string, message: string): Promise<void> { }

// ✅ Good: Getters/setters use get/set prefix
function getClinicSettings(clinicId: string): Promise<ClinicSettings> { }
function setNotifyAtPosition(position: number): void { }

// ✅ Good: Boolean functions use is/has/can
function isValidTunisianPhone(phone: string): boolean { }
function hasWaitingPatients(clinicId: string): Promise<boolean> { }
function canCallNextPatient(clinicId: string): boolean { }
```

### Component Naming

```typescript
// ✅ Good: PascalCase, descriptive
QueueList.tsx
AddPatientModal.tsx
PositionCard.tsx
PatientStatusPage.tsx

// ❌ Bad: camelCase or unclear
queueList.tsx
add-patient.tsx
card.tsx
page.tsx

// ✅ Good: Component function matches filename
// File: QueueList.tsx
export function QueueList({ entries }: QueueListProps) { }

// ❌ Bad: Mismatch
// File: QueueList.tsx
export function Queue({ entries }: QueueListProps) { }
```

### File Naming

```typescript
// Frontend Files
components/
  ui/
    button.tsx           // ✅ kebab-case for UI components
    card.tsx
  queue/
    QueueList.tsx        // ✅ PascalCase for feature components
    AddPatientModal.tsx

hooks/
  use-queue.ts          // ✅ kebab-case, use- prefix
  use-socket.ts

services/
  api-client.ts         // ✅ kebab-case
  notification-service.ts

// Backend Files
routes/
  queue.routes.ts       // ✅ kebab-case with .routes suffix
  auth.routes.ts

services/
  queue.service.ts      // ✅ kebab-case with .service suffix
  notification.service.ts

repositories/
  queue.repository.ts   // ✅ kebab-case with .repository suffix
```

### Constants

```typescript
// ✅ Good: SCREAMING_SNAKE_CASE for true constants
const SMS_DAILY_LIMIT = 500;
const MAX_RETRIES = 3;
const DEFAULT_AVG_CONSULTATION_MINS = 15;
const TWILIO_FROM_NUMBER = process.env.TWILIO_PHONE_NUMBER!;

// ✅ Good: camelCase for config objects
const twilioConfig = {
  accountSid: process.env.TWILIO_ACCOUNT_SID!,
  authToken: process.env.TWILIO_AUTH_TOKEN!,
};

// ❌ Bad: All caps for non-constants
const CLINIC_ID = req.params.clinicId; // This changes, not a constant
```

---

## React Best Practices

### Functional Components with Hooks

**Always use functional components**, not class components.

```typescript
// ✅ Good: Functional component with TypeScript
interface QueueListProps {
  entries: QueueEntry[];
  onCallNext: () => void;
}

export function QueueList({ entries, onCallNext }: QueueListProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <div>
      {entries.map(entry => (
        <QueueItem
          key={entry.id}
          entry={entry}
          isSelected={entry.id === selectedId}
          onClick={() => setSelectedId(entry.id)}
        />
      ))}
      <button onClick={onCallNext}>Call Next</button>
    </div>
  );
}

// ❌ Bad: Class component
class QueueList extends React.Component { }
```

### Custom Hooks

**Extract reusable logic** into custom hooks with `use` prefix.

```typescript
// ✅ Good: Custom hook for queue operations
export function useQueue(clinicId: string) {
  const [queue, setQueue] = useState<QueueEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchQueue() {
      try {
        const data = await api.get<QueueEntry[]>(`/api/queue`);
        setQueue(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }

    fetchQueue();
  }, [clinicId]);

  const addPatient = useCallback(async (patient: AddPatientRequest) => {
    const newEntry = await api.post<QueueEntry>('/api/queue', patient);
    setQueue(prev => [...prev, newEntry]);
  }, []);

  return { queue, isLoading, error, addPatient };
}

// Usage in component
function QueueDashboard() {
  const { queue, isLoading, addPatient } = useQueue(clinicId);

  if (isLoading) return <LoadingSpinner />;

  return <QueueList entries={queue} onAddPatient={addPatient} />;
}
```

### Memoization

**Use memoization** for expensive calculations and stable references.

```typescript
// ✅ Good: useMemo for expensive calculations
function QueueDashboard({ entries }: { entries: QueueEntry[] }) {
  const stats = useMemo(() => {
    return {
      waiting: entries.filter(e => e.status === 'WAITING').length,
      avgWaitTime: calculateAverageWait(entries), // Expensive operation
      completed: entries.filter(e => e.status === 'COMPLETED').length,
    };
  }, [entries]);

  return <StatsPanel stats={stats} />;
}

// ✅ Good: useCallback for stable function references
function QueueList({ entries }: QueueListProps) {
  const handleCallNext = useCallback(async () => {
    await api.post('/api/queue/next');
    // Callback will not change on re-renders
  }, []); // Empty deps = stable reference

  return <CallNextButton onClick={handleCallNext} />;
}

// ✅ Good: React.memo for preventing unnecessary re-renders
export const QueueItem = React.memo(function QueueItem({
  entry,
  onClick,
}: QueueItemProps) {
  return (
    <div onClick={onClick}>
      {entry.patientName} - Position #{entry.position}
    </div>
  );
});
```

### Props Destructuring

**Destructure props** in function signature for clarity.

```typescript
// ✅ Good: Destructured props
function PositionCard({ position, estimatedWait, status }: PositionCardProps) {
  return (
    <div>
      <h2>Position #{position}</h2>
      <p>{estimatedWait} min wait</p>
    </div>
  );
}

// ❌ Bad: Props object
function PositionCard(props: PositionCardProps) {
  return (
    <div>
      <h2>Position #{props.position}</h2>
      <p>{props.estimatedWait} min wait</p>
    </div>
  );
}
```

### Error Boundaries

**Wrap components** in error boundaries for graceful failures.

```typescript
// Error boundary component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    // Send to Sentry
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback />;
    }

    return this.props.children;
  }
}

// Usage
function App() {
  return (
    <ErrorBoundary>
      <QueueDashboard />
    </ErrorBoundary>
  );
}
```

### Conditional Rendering

**Use early returns** for cleaner conditional rendering.

```typescript
// ✅ Good: Early returns
function QueueList({ entries }: QueueListProps) {
  if (entries.length === 0) {
    return <EmptyState message="No patients in queue" />;
  }

  if (error) {
    return <ErrorMessage error={error} />;
  }

  return (
    <div>
      {entries.map(entry => <QueueItem key={entry.id} entry={entry} />)}
    </div>
  );
}

// ❌ Bad: Nested ternaries
function QueueList({ entries }: QueueListProps) {
  return (
    <div>
      {entries.length === 0 ? (
        <EmptyState message="No patients in queue" />
      ) : error ? (
        <ErrorMessage error={error} />
      ) : (
        entries.map(entry => <QueueItem key={entry.id} entry={entry} />)
      )}
    </div>
  );
}
```

---

## API Design Patterns

### RESTful Conventions

**Follow REST principles** for API endpoint design.

| Method | Endpoint | Purpose | Example |
|--------|----------|---------|---------|
| `GET` | `/api/queue` | List resources | Get today's queue |
| `POST` | `/api/queue` | Create resource | Add patient to queue |
| `GET` | `/api/queue/:id` | Get single resource | Get specific queue entry |
| `PATCH` | `/api/queue/:id` | Update resource | Update patient status |
| `DELETE` | `/api/queue/:id` | Delete resource | Remove patient from queue |
| `POST` | `/api/queue/next` | Custom action | Call next patient |

```typescript
// ✅ Good: RESTful routes
app.get('/api/queue', authMiddleware, getQueue);
app.post('/api/queue', authMiddleware, addPatient);
app.patch('/api/queue/:id/status', authMiddleware, updateStatus);
app.delete('/api/queue/:id', authMiddleware, removePatient);
app.post('/api/queue/next', authMiddleware, callNextPatient);

// ❌ Bad: Non-RESTful, unclear
app.get('/api/getQueue', getQueue);
app.post('/api/createPatient', addPatient);
app.post('/api/updatePatientStatus', updateStatus);
```

### HTTP Status Codes

**Use appropriate status codes** for all responses.

```typescript
// ✅ Good: Proper status codes
// 200 OK - Successful GET/PATCH
res.status(200).json({ queue });

// 201 Created - Successful POST (resource created)
res.status(201).json({ entry });

// 204 No Content - Successful DELETE
res.status(204).send();

// 400 Bad Request - Validation error
res.status(400).json({ error: 'Invalid phone number' });

// 401 Unauthorized - Missing/invalid token
res.status(401).json({ error: 'Authentication required' });

// 403 Forbidden - Valid token but insufficient permissions
res.status(403).json({ error: 'Access denied' });

// 404 Not Found - Resource doesn't exist
res.status(404).json({ error: 'Queue entry not found' });

// 409 Conflict - Duplicate resource
res.status(409).json({ error: 'Patient already in queue' });

// 500 Internal Server Error - Unexpected server error
res.status(500).json({ error: 'Internal server error' });

// ❌ Bad: Always 200, status in body
res.status(200).json({ success: false, error: 'Not found' });
```

### Error Response Format

**Standardize error responses** across all endpoints.

```typescript
// ✅ Good: Consistent error format
interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: any;
  };
}

// Example
res.status(400).json({
  error: {
    code: 'VALIDATION_ERROR',
    message: 'Invalid request data',
    details: [
      { field: 'patientPhone', message: 'Invalid Tunisia phone format' }
    ]
  }
});

// ❌ Bad: Inconsistent error formats
res.status(400).json({ error: 'Invalid phone' });
res.status(400).json({ message: 'Bad request', errors: [...] });
res.status(400).send('Validation failed');
```

### Request Validation

**Validate all inputs** using Zod schemas.

```typescript
// ✅ Good: Zod schema validation
import { z } from 'zod';

const AddPatientSchema = z.object({
  patientPhone: z.string().regex(/^(\+216)?[2459]\d{7}$/, 'Invalid Tunisia phone'),
  patientName: z.string().min(1).max(100).optional(),
  visitReason: z.string().max(500).optional(),
});

export async function addPatientController(req: Request, res: Response) {
  try {
    // Parse and validate
    const data = AddPatientSchema.parse(req.body);

    // Use validated data
    const entry = await queueService.addPatient(req.clinic!.id, data);

    res.status(201).json(entry);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request data',
          details: error.errors
        }
      });
    }
    throw error;
  }
}

// ❌ Bad: Manual validation, error-prone
export async function addPatientController(req: Request, res: Response) {
  if (!req.body.patientPhone) {
    return res.status(400).json({ error: 'Phone required' });
  }
  if (typeof req.body.patientPhone !== 'string') {
    return res.status(400).json({ error: 'Phone must be string' });
  }
  // ... many more checks ...
}
```

---

## Git Workflow

### Conventional Commits

**Use Conventional Commits** format for all commit messages.

**Format:** `<type>(<scope>): <subject>`

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `refactor`: Code refactoring (no functionality change)
- `test`: Adding or updating tests
- `chore`: Build process, dependencies, tooling
- `style`: Code style changes (formatting, semicolons)
- `perf`: Performance improvements

```bash
# ✅ Good: Conventional commit messages
feat(queue): add WhatsApp check-in support
fix(notifications): correct SMS template for Arabic
docs(api): update endpoint documentation
refactor(services): simplify queue position calculation
test(queue): add tests for duplicate check-in handling
chore(deps): upgrade Prisma to 5.8.0
style(components): format with Prettier
perf(database): add index on clinicId and status

# ❌ Bad: Unclear, non-conventional
"fixed bug"
"WIP"
"changes"
"update"
"asdf"
```

### Branch Naming

**Use descriptive branch names** with type prefix.

```bash
# ✅ Good: Clear, descriptive branches
feature/whatsapp-checkin
feature/patient-status-page
fix/sms-retry-logic
fix/position-calculation-bug
refactor/notification-service
hotfix/production-login-error

# ❌ Bad: Unclear, personal
my-branch
test
feature1
john-dev
```

### Pull Request Template

**Use a PR template** for consistency.

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] New feature
- [ ] Bug fix
- [ ] Refactoring
- [ ] Documentation

## Changes Made
- Added WhatsApp Business API integration
- Updated notification routing logic
- Added tests for WhatsApp check-in flow

## Testing Steps
1. Check in via WhatsApp by sending "ARRIVER"
2. Verify WhatsApp message received (not SMS)
3. Open status page link from WhatsApp
4. Confirm real-time updates work

## Screenshots
(If UI changes)

## Checklist
- [ ] Code follows project coding standards
- [ ] Tests added/updated and passing
- [ ] Documentation updated
- [ ] No linting errors
- [ ] TypeScript types are correct
- [ ] Reviewed own code
```

### Code Review Checklist

**Reviewers should check:**

- [ ] **Functionality**: Does it work as intended?
- [ ] **Tests**: Are there tests? Do they pass?
- [ ] **Types**: Are TypeScript types correct and strict?
- [ ] **Naming**: Are names clear and follow conventions?
- [ ] **Error handling**: Are errors handled gracefully?
- [ ] **Performance**: Any obvious performance issues?
- [ ] **Security**: Any security vulnerabilities? (SQL injection, XSS, etc.)
- [ ] **Consistency**: Does it match existing code style?
- [ ] **Documentation**: Are complex parts documented?
- [ ] **Edge cases**: Are edge cases handled?

---

## Documentation Standards

### JSDoc Comments

**Document public functions** with JSDoc.

```typescript
/**
 * Calculates estimated wait time for a patient based on their queue position.
 *
 * @param position - The patient's position in the queue (1-indexed)
 * @param avgConsultationMins - Average consultation time in minutes
 * @returns Estimated wait time in minutes
 *
 * @example
 * ```typescript
 * const wait = calculateEstimatedWait(5, 15);
 * console.log(wait); // 75 (5 patients × 15 min)
 * ```
 */
export function calculateEstimatedWait(
  position: number,
  avgConsultationMins: number
): number {
  return position * avgConsultationMins;
}
```

### Inline Comments

**Use inline comments sparingly** - code should be self-documenting.

```typescript
// ✅ Good: Comment explains WHY, not WHAT
// Subtract 1 because patient's own position shouldn't count toward wait
const patientsAhead = position - 1;

// ✅ Good: Complex logic needs explanation
// Exponential backoff: wait 2^attempt seconds (2s, 4s, 8s)
const delayMs = Math.pow(2, attempt) * 1000;

// ❌ Bad: Comment just repeats code
// Set position to 1
const position = 1;

// ❌ Bad: Obvious comment
// Loop through entries
for (const entry of entries) { }
```

### README Files

**Every package/module** should have a README.

```markdown
# Queue Service

Business logic for queue management operations.

## Usage

```typescript
import { queueService } from './services/queue.service';

// Add patient to queue
const entry = await queueService.addPatient(clinicId, {
  patientPhone: '+21698123456',
  patientName: 'Ahmed',
});

// Call next patient
await queueService.callNextPatient(clinicId);
```

## API

### `addPatient(clinicId, data)`
Adds a new patient to the clinic's queue.

**Parameters:**
- `clinicId` (string): The clinic's UUID
- `data` (AddPatientRequest): Patient information

**Returns:** Promise<QueueEntry>

**Throws:**
- `ValidationError`: Invalid phone number format
- `ConflictError`: Patient already in queue
```

---

## Code Review Checklist

### Before Submitting PR

- [ ] Run `pnpm lint` - No linting errors
- [ ] Run `pnpm typecheck` - No TypeScript errors
- [ ] Run `pnpm test` - All tests pass
- [ ] Run `pnpm format` - Code is formatted
- [ ] Review own code - Read through changes
- [ ] Update documentation - README, JSDoc, etc.
- [ ] Add tests - For new features/bug fixes
- [ ] Test manually - Verify in browser/Postman
- [ ] Check for secrets - No API keys, passwords committed
- [ ] Update CHANGELOG - Document notable changes

### Reviewer Checklist

- [ ] **Functionality**: Does it solve the problem?
- [ ] **Tests**: Adequate test coverage?
- [ ] **Security**: No vulnerabilities introduced?
- [ ] **Performance**: No obvious performance issues?
- [ ] **Readability**: Code is clear and maintainable?
- [ ] **Standards**: Follows coding conventions?
- [ ] **Documentation**: Complex logic documented?
- [ ] **Error Handling**: Errors handled gracefully?
- [ ] **Edge Cases**: Unusual scenarios considered?
- [ ] **Breaking Changes**: Is migration needed?

---

## Next Steps

- **API Design**: See [11_API_Specification.md](./11_API_Specification.md) for detailed endpoint specs
- **Testing**: See [12_Testing_Plan.md](./12_Testing_Plan.md) for testing standards
- **Development**: See [04_Development_Environment_Setup.md](./04_Development_Environment_Setup.md) for setup
