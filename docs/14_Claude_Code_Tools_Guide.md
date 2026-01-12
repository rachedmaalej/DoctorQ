# 14_Claude_Code_Tools_Guide.md

## Overview

This document provides best practices, workflows, and practical examples for using Claude Code tools effectively in DoctorQ development. It covers tool selection, common workflows, agent usage patterns, and debugging strategies.

## Table of Contents

1. [Tool Selection Guide](#tool-selection-guide)
2. [Common Workflows](#common-workflows)
3. [Agent Usage Patterns](#agent-usage-patterns)
4. [Debugging with Claude](#debugging-with-claude)
5. [Performance Optimization](#performance-optimization)
6. [Tips & Best Practices](#tips--best-practices)

---

## Tool Selection Guide

### When to Use Each Tool

| Tool | Use When | Don't Use When | DoctorQ Example |
|------|----------|----------------|-----------------|
| **Read** | Need to inspect specific file | Searching across many files | Read queue.service.ts to understand logic |
| **Write** | Creating new file | File already exists | Create new component QueueList.tsx |
| **Edit** | Modifying existing file | Need to see full file first | Update addPatient() function |
| **Bash** | Running commands, git ops | File operations (use Read/Write instead) | `pnpm test`, `git commit` |
| **Glob** | Find files by pattern | Searching file contents | Find all `*.service.ts` files |
| **Grep** | Search code content | Finding files by name | Find all uses of "QueueEntry" |
| **Task** | Launch specialized agent | Simple direct operations | Explore codebase structure |

### Decision Tree

```
Need to work with files?
├─ Know exact file path?
│  ├─ Read content → Use Read
│  ├─ Modify content → Use Edit (after Read)
│  └─ Create new file → Use Write
│
├─ Don't know path?
│  ├─ Know filename pattern → Use Glob (*.tsx, *queue*)
│  └─ Know code content → Use Grep (search "calculateWait")
│
Need to run command?
├─ File operation (cat, echo) → Use Read/Write instead
├─ Git operation → Use Bash
├─ npm/pnpm command → Use Bash
└─ Database operation → Use Bash

Need to explore/plan?
├─ Understand codebase → Task (Explore agent)
├─ Design feature → Task (Plan agent)
└─ Specialized task → Task (Custom agent)
```

---

## Common Workflows

### Workflow 1: Adding a New Feature

**Scenario:** Add "Export Queue to CSV" feature

**Step-by-Step:**

```bash
# 1. Understand current queue implementation
Task: Explore agent
Prompt: "How is queue data currently fetched and displayed in QueueDashboard?"
Result: Agent finds QueueDashboard.tsx, useQueue hook, queue.service.ts

# 2. Read relevant files
Read: apps/web/src/hooks/use-queue.ts
Read: apps/api/src/services/queue.service.ts

# 3. Plan implementation
Task: Plan agent
Prompt: "Design implementation for exporting today's queue to CSV file"
Result: Agent provides step-by-step plan

# 4. Implement backend endpoint
Write: apps/api/src/routes/export.routes.ts
Write: apps/api/src/services/export.service.ts

# 5. Add frontend button
Edit: apps/web/src/pages/doctor/QueueDashboard.tsx
(Add export button that calls new API endpoint)

# 6. Test implementation
Bash: pnpm test:unit src/services/export.service.test.ts

# 7. Commit changes
Bash: git add . && git commit -m "feat(export): add CSV export for queue"
```

**Claude Commands:**
```
1. "Explore how queue data is currently fetched and displayed"
2. "Design implementation for CSV export feature"
3. "Create export service with CSV generation"
4. "Add export button to queue dashboard"
5. "Write tests for export service"
```

---

### Workflow 2: Fixing a Bug

**Scenario:** Position not recalculating correctly when patient removed

**Step-by-Step:**

```bash
# 1. Locate bug (search for position calculation)
Grep: pattern="recalculatePositions" output_mode="files_with_matches"
Result: Found in queue.service.ts, queue.repository.ts

# 2. Read files to understand current logic
Read: apps/api/src/services/queue.service.ts
Read: apps/api/src/repositories/queue.repository.ts

# 3. Identify issue
# Manual analysis or ask Claude to review logic

# 4. Write test that reproduces bug
Write: apps/api/src/services/queue.service.test.ts
(Add test case for "position recalculation after removal")

# 5. Run test to confirm it fails
Bash: pnpm test queue.service.test.ts

# 6. Fix the bug
Edit: apps/api/src/services/queue.service.ts
(Update recalculatePositions logic)

# 7. Run test to confirm fix
Bash: pnpm test queue.service.test.ts

# 8. Run all tests to ensure no regressions
Bash: pnpm test

# 9. Commit fix
Bash: git add . && git commit -m "fix(queue): correct position recalculation on removal"
```

**Claude Commands:**
```
1. "Find all files that handle queue position calculation"
2. "Review the recalculatePositions function for bugs"
3. "Write test that reproduces position calculation bug when patient removed mid-queue"
4. "Fix the position recalculation logic"
5. "Verify fix with tests"
```

---

### Workflow 3: Refactoring

**Scenario:** Extract notification logic from queue service into separate service

**Step-by-Step:**

```bash
# 1. Understand current structure
Task: Explore agent
Prompt: "Map all notification-related code in the codebase"
Result: Agent finds notification calls in queue.service.ts, patient.controller.ts

# 2. Read current implementation
Read: apps/api/src/services/queue.service.ts
Grep: pattern="twilio|sms|notification" output_mode="content"

# 3. Create new notification service
Write: apps/api/src/services/notification.service.ts

# 4. Move notification logic
Edit: apps/api/src/services/queue.service.ts
(Replace inline Twilio calls with notificationService.sendX())

# 5. Update imports
Edit: apps/api/src/services/queue.service.ts
(Add import for notificationService)

# 6. Write tests for new service
Write: apps/api/src/services/notification.service.test.ts

# 7. Run tests
Bash: pnpm test

# 8. Commit refactor
Bash: git add . && git commit -m "refactor(notifications): extract to separate service"
```

---

### Workflow 4: Adding i18n Translation

**Scenario:** Add Arabic translation for new feature

**Step-by-Step:**

```bash
# 1. Find existing translation files
Glob: pattern="**/locales/*.json"
Result: apps/web/src/i18n/locales/fr.json, apps/web/src/i18n/locales/ar.json

# 2. Read French translation (source)
Read: apps/web/src/i18n/locales/fr.json

# 3. Add new French keys
Edit: apps/web/src/i18n/locales/fr.json
(Add: "export": { "button": "Exporter CSV", "success": "Export réussi" })

# 4. Add Arabic translations
Edit: apps/web/src/i18n/locales/ar.json
(Add: "export": { "button": "تصدير CSV", "success": "تم التصدير بنجاح" })

# 5. Use in component
Edit: apps/web/src/pages/doctor/QueueDashboard.tsx
(Add: const { t } = useTranslation(); ... <button>{t('export.button')}</button>)

# 6. Test in both languages
Bash: pnpm dev:web
(Manually switch language in UI and verify)
```

**Claude Commands:**
```
1. "Add French and Arabic translations for CSV export feature"
2. "Update QueueDashboard to use i18n for export button"
```

---

## Agent Usage Patterns

### Pattern 1: Code Exploration

**When to Use:**
- New to codebase
- Understanding feature implementation
- Finding where to make changes

**Example:**
```bash
# Broad exploration
Task: Explore agent (thoroughness: medium)
Prompt: "Explain the complete patient check-in flow from QR scan to queue entry"

# Specific search
Task: Explore agent (thoroughness: quick)
Prompt: "Find all components that display queue position"
```

**Output:**
- List of relevant files
- Flow diagram
- Key functions identified
- Recommendations for changes

---

### Pattern 2: Implementation Planning

**When to Use:**
- Before implementing complex feature
- Need architectural decisions
- Multiple implementation options

**Example:**
```bash
Task: Plan agent
Prompt: "Design implementation for WhatsApp Business API integration. Consider:
- How to detect WhatsApp check-ins
- Message template approval process
- Notification routing logic
- Cost optimization vs SMS"
```

**Output:**
- Step-by-step implementation plan
- Files to create/modify
- Dependencies needed
- Trade-offs analysis
- Estimated complexity

---

### Pattern 3: Specialized Agent Usage

**When to Use:**
- Domain-specific task (queue logic, notifications, auth)
- Complex business logic
- Need expert context

**Example:**

```bash
# Queue logic expert
Task: queue-logic-agent
Prompt: "Implement 'hold position' feature where patient can leave queue for 15 mins and retain position"

# Notification expert
Task: notification-agent
Prompt: "Optimize SMS templates to reduce from 170 chars to <160 to save costs"

# i18n expert
Task: i18n-agent
Prompt: "Fix RTL layout issues in patient status page for Arabic"
```

---

## Debugging with Claude

### Strategy 1: Error Analysis

**When:** Encountering runtime error

**Workflow:**
```bash
# 1. Copy error message
Error: "Cannot read property 'position' of undefined at QueueList.tsx:42"

# 2. Read the file with error
Read: apps/web/src/components/queue/QueueList.tsx (offset: 35, limit: 15)

# 3. Ask Claude to analyze
Prompt: "This error occurs: [paste error]. Here's the code: [context from Read].
What's the issue and how to fix it?"

# 4. Apply fix
Edit: apps/web/src/components/queue/QueueList.tsx
(Add null check: entry?.position)

# 5. Verify fix
Bash: pnpm dev:web
(Manually test the scenario)
```

---

### Strategy 2: Logic Debugging

**When:** Feature works but produces wrong results

**Workflow:**
```bash
# 1. Identify suspicious function
Grep: pattern="calculateEstimatedWait" output_mode="content"

# 2. Read function
Read: apps/web/src/lib/queue-utils.ts

# 3. Write test case
Prompt: "Write test for calculateEstimatedWait that exposes the bug where
position 0 returns wrong value"

Write: apps/web/src/lib/queue-utils.test.ts

# 4. Run test (should fail)
Bash: pnpm test queue-utils.test.ts

# 5. Ask Claude to fix
Prompt: "The test fails. Fix the calculateEstimatedWait function."

Edit: apps/web/src/lib/queue-utils.ts

# 6. Run test (should pass)
Bash: pnpm test queue-utils.test.ts
```

---

### Strategy 3: Performance Debugging

**When:** App is slow

**Workflow:**
```bash
# 1. Identify slow component
Prompt: "Profile QueueDashboard component. What could cause slowness?"

Read: apps/web/src/pages/doctor/QueueDashboard.tsx

# 2. Claude suggests issues:
# - Missing memoization
# - Unnecessary re-renders
# - Large data rendering

# 3. Apply optimizations
Edit: apps/web/src/pages/doctor/QueueDashboard.tsx
(Add useMemo, useCallback, React.memo)

# 4. Measure improvement
Bash: pnpm build && pnpm preview
(Use Chrome DevTools to measure)
```

---

## Performance Optimization

### Optimizing Claude Usage

**DO:**
- ✅ Use specific prompts: "Fix position calculation in queue.service.ts line 45"
- ✅ Provide context: Read relevant files before asking for changes
- ✅ Use specialized agents for domain tasks
- ✅ Batch related changes: "Update all queue components to use new Badge component"

**DON'T:**
- ❌ Vague prompts: "Fix the queue"
- ❌ Ask without context: Provide relevant code first
- ❌ Use general agent for specialized tasks
- ❌ Make many small sequential edits: Plan changes first

### Tool Performance Tips

**Read Tool:**
```bash
# ❌ Slow: Read entire large file
Read: apps/api/src/services/queue.service.ts

# ✅ Fast: Read specific section
Read: apps/api/src/services/queue.service.ts (offset: 100, limit: 50)
```

**Grep Tool:**
```bash
# ❌ Slow: Content mode for many files
Grep: pattern="patient" output_mode="content"

# ✅ Fast: Files mode first, then read specific files
Grep: pattern="patient" output_mode="files_with_matches"
Read: (files found)
```

**Glob Tool:**
```bash
# ❌ Slow: Recursive search from root
Glob: pattern="**/*"

# ✅ Fast: Specific directory and pattern
Glob: pattern="apps/web/src/components/**/*.tsx"
```

---

## Tips & Best Practices

### General Tips

1. **Read Before Edit**
   ```bash
   # Always read file before editing
   Read: apps/api/src/services/queue.service.ts
   # Then edit
   Edit: apps/api/src/services/queue.service.ts (old: ..., new: ...)
   ```

2. **Use Grep for Discovery**
   ```bash
   # Find all usages before refactoring
   Grep: pattern="QueueEntry" output_mode="files_with_matches"
   # Then read and update each file
   ```

3. **Commit Frequently**
   ```bash
   # After each logical change
   Bash: git add . && git commit -m "feat: add X"
   # Don't accumulate many changes
   ```

4. **Test After Changes**
   ```bash
   # Always run relevant tests
   Bash: pnpm test queue.service.test.ts
   # Before committing
   ```

---

### Project-Specific Tips for DoctorQ

1. **Queue Operations:**
   - Always recalculate positions after modifying queue
   - Emit Socket.io events after state changes
   - Use Prisma transactions for atomic operations

2. **Notifications:**
   - Route based on checkInMethod (QR→SMS, WhatsApp→WhatsApp)
   - Keep SMS under 160 chars (1 SMS = cheaper)
   - Implement retry logic (3 attempts with backoff)

3. **Real-time:**
   - Join appropriate rooms (clinic:X, patient:Y)
   - Clean up listeners on unmount
   - Fallback to polling if Socket.io fails

4. **i18n:**
   - Always add both FR and AR translations
   - Use logical CSS (ms-4 not ml-4) for RTL
   - Test UI in both languages

5. **Testing:**
   - Write test before fixing bug (TDD for bugs)
   - Mock external services (Twilio, Prisma)
   - Test edge cases (empty queue, duplicate check-in)

---

### Workflow Shortcuts

**Quick Feature Addition:**
```bash
claude "Add [feature] to [component]"
# Claude will:
# 1. Read component
# 2. Add feature
# 3. Update tests
# 4. Run tests
```

**Quick Bug Fix:**
```bash
claude "Fix [bug description] in [file]"
# Claude will:
# 1. Read file
# 2. Identify issue
# 3. Fix code
# 4. Write/update test
```

**Quick Refactor:**
```bash
claude "Extract [logic] from [file] into new [service/component]"
# Claude will:
# 1. Read current code
# 2. Create new file
# 3. Move logic
# 4. Update imports
# 5. Update tests
```

---

### Common Mistakes to Avoid

❌ **Mistake 1:** Not reading file before editing
```bash
# Wrong
Edit: apps/api/src/services/queue.service.ts (old: ..., new: ...)
# Result: Edit fails because old string not found

# Right
Read: apps/api/src/services/queue.service.ts
# Then copy exact string from output
Edit: apps/api/src/services/queue.service.ts (old: [exact string], new: ...)
```

❌ **Mistake 2:** Using Bash for file operations
```bash
# Wrong
Bash: cat apps/api/src/services/queue.service.ts

# Right
Read: apps/api/src/services/queue.service.ts
```

❌ **Mistake 3:** Vague prompts
```bash
# Wrong
"Fix the queue"

# Right
"Fix position recalculation in queue.service.ts:145 where removed patients cause position skips"
```

❌ **Mistake 4:** Not testing after changes
```bash
# Wrong
Edit: ... (make changes)
Bash: git commit -m "fix: ..."

# Right
Edit: ... (make changes)
Bash: pnpm test
Bash: git commit -m "fix: ..."
```

---

## Example Session Transcript

**Task:** Add "Mark as Priority" feature

```
User: Add ability to mark patient as priority in queue

Claude: I'll help add priority patient functionality. Let me start by exploring
the current queue structure.

[Task: Explore agent]
Prompt: "Understand current queue data model and how positions are calculated"

Agent Result:
- Queue uses position field (integer)
- Positions calculated in queue.repository.ts:recalculatePositions()
- No priority flag currently exists

Claude: Based on exploration, I'll:
1. Add isPriority field to QueueEntry model
2. Update position calculation to put priority patients first
3. Add UI toggle in queue dashboard
4. Update notifications to indicate priority

Proceeding with implementation...

[Read: prisma/schema.prisma]
[Edit: prisma/schema.prisma]
Added: isPriority Boolean @default(false)

[Bash: pnpm prisma migrate dev --name add_is_priority]
Migration created successfully

[Read: apps/api/src/repositories/queue.repository.ts]
[Edit: apps/api/src/repositories/queue.repository.ts]
Updated recalculatePositions() to sort by isPriority DESC, then arrivedAt ASC

[Read: apps/web/src/components/queue/QueueList.tsx]
[Edit: apps/web/src/components/queue/QueueList.tsx]
Added priority toggle button with star icon

[Write: apps/api/src/services/queue.service.test.ts]
Added test: "priority patients appear first in queue"

[Bash: pnpm test queue.service.test.ts]
All tests passing ✓

Claude: Priority patient feature complete!

Changes made:
1. ✅ Added isPriority field to database
2. ✅ Updated position calculation logic
3. ✅ Added UI toggle in queue dashboard
4. ✅ Added tests
5. ✅ All tests passing

Next steps:
- Review changes
- Test manually with priority patient
- Commit: "feat(queue): add priority patient marking"
```

---

## Next Steps

- **Implementation**: See [15_Project_Phases.md](./15_Project_Phases.md) for development timeline
- **Skills Reference**: See [09_Claude_Code_Configuration.md](./09_Claude_Code_Configuration.md) for available skills
- **Coding Standards**: See [10_Coding_Standards.md](./10_Coding_Standards.md) for code quality guidelines
