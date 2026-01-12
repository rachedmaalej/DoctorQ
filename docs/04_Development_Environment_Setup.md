# 04_Development_Environment_Setup.md

## Overview

This document provides step-by-step instructions for setting up a complete development environment for DoctorQ. Following this guide, a new developer should be productive within 1 hour.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Repository Setup](#repository-setup)
3. [Database Setup](#database-setup)
4. [Environment Variables](#environment-variables)
5. [Running Development Servers](#running-development-servers)
6. [Database Tools](#database-tools)
7. [Testing Setup](#testing-setup)
8. [Code Quality Tools](#code-quality-tools)
9. [Git Hooks](#git-hooks)
10. [IDE Configuration](#ide-configuration)
11. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software

**Node.js 20+**
```bash
# Verify installation
node --version  # Should be v20.x.x or higher

# Install via nvm (recommended)
nvm install 20
nvm use 20
```

**pnpm 8+** (Package Manager)
```bash
# Install globally
npm install -g pnpm@latest

# Verify installation
pnpm --version  # Should be 8.x.x or higher
```

**PostgreSQL 15+**
```bash
# Verify installation
psql --version  # Should be 15.x or higher

# Option 1: Install locally (Windows)
# Download from https://www.postgresql.org/download/windows/

# Option 2: Install locally (macOS)
brew install postgresql@15
brew services start postgresql@15

# Option 3: Use Docker (recommended for consistency)
docker --version  # Ensure Docker is installed
```

**Git**
```bash
# Verify installation
git --version
```

### Recommended Software

**VS Code** (IDE)
- Download from https://code.visualstudio.com/

**Docker Desktop** (for containerized PostgreSQL)
- Download from https://www.docker.com/products/docker-desktop

---

## Repository Setup

### Clone Repository

```bash
# Clone the repository
git clone https://github.com/your-org/doctorq.git
cd doctorq

# Verify directory structure
ls -la
# Should see: apps/, packages/, docs/, .claude/, package.json, pnpm-workspace.yaml
```

### Install Dependencies

```bash
# Install all dependencies (monorepo)
pnpm install

# This installs dependencies for:
# - Root workspace
# - apps/web (React frontend)
# - apps/api (Node.js backend)
# - packages/shared (shared types)

# Verify installation
pnpm list --depth=0
```

**Expected Output:**
```
doctorq@1.0.0
├── apps/web
├── apps/api
└── packages/shared
```

---

## Database Setup

### Option 1: Docker (Recommended)

**Create docker-compose.yml** (if not exists):
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: doctorq-postgres
    restart: unless-stopped
    ports:
      - "5432:5432"
    environment:
      POSTGRES_USER: doctorq
      POSTGRES_PASSWORD: doctorq_dev_password
      POSTGRES_DB: doctorq_dev
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U doctorq"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
```

**Start PostgreSQL:**
```bash
# Start database container
docker-compose up -d postgres

# Verify it's running
docker ps
# Should see doctorq-postgres container

# Check logs
docker-compose logs postgres

# Test connection
docker exec -it doctorq-postgres psql -U doctorq -d doctorq_dev
# If successful, you'll see: doctorq_dev=#
# Type \q to exit
```

### Option 2: Local PostgreSQL Installation

```bash
# Create database
createdb doctorq_dev

# Or using psql
psql postgres
CREATE DATABASE doctorq_dev;
CREATE USER doctorq WITH PASSWORD 'doctorq_dev_password';
GRANT ALL PRIVILEGES ON DATABASE doctorq_dev TO doctorq;
\q
```

### Initialize Database Schema

```bash
# Generate Prisma Client
pnpm db:generate

# Push schema to database (for development)
pnpm db:push

# OR run migrations (for production-like workflow)
pnpm db:migrate

# Verify schema
pnpm db:studio
# Opens Prisma Studio at http://localhost:5555
```

### Seed Test Data

```bash
# Seed database with test clinic and patients
pnpm db:seed

# This creates:
# - 1 test clinic (Dr. Ahmed Ben Salem, La Marsa)
# - 5-10 queue entries with various statuses
# - Sample daily stats for last 7 days
```

**Verify Seed Data:**
```bash
# Open Prisma Studio
pnpm db:studio

# Or query directly
docker exec -it doctorq-postgres psql -U doctorq -d doctorq_dev -c "SELECT * FROM \"Clinic\";"
```

---

## Environment Variables

### Backend Environment (.env in apps/api/)

Create `apps/api/.env`:
```bash
# Database
DATABASE_URL="postgresql://doctorq:doctorq_dev_password@localhost:5432/doctorq_dev"

# Authentication
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
JWT_EXPIRES_IN="7d"

# SMS (Twilio)
TWILIO_ACCOUNT_SID="your_twilio_account_sid"
TWILIO_AUTH_TOKEN="your_twilio_auth_token"
TWILIO_PHONE_NUMBER="+1234567890"

# WhatsApp (future - optional for MVP)
WHATSAPP_BUSINESS_ID=""
WHATSAPP_ACCESS_TOKEN=""

# Server Configuration
PORT=3001
NODE_ENV="development"
CORS_ORIGIN="http://localhost:5173"

# Frontend URL (for SMS links)
FRONTEND_URL="http://localhost:5173"

# Logging
LOG_LEVEL="debug"
```

### Frontend Environment (.env in apps/web/)

Create `apps/web/.env`:
```bash
# API URLs
VITE_API_URL="http://localhost:3001"
VITE_SOCKET_URL="http://localhost:3001"

# App Configuration
VITE_DEFAULT_LANGUAGE="fr"
VITE_ENABLE_WHATSAPP="false"

# Feature Flags (optional)
VITE_ENABLE_ANALYTICS="false"
VITE_ENABLE_DEBUG="true"
```

### Environment Variable Explanations

| Variable | Purpose | Where to Get |
|----------|---------|--------------|
| `DATABASE_URL` | PostgreSQL connection string | Local setup or docker-compose |
| `JWT_SECRET` | Secret key for signing JWT tokens | Generate: `openssl rand -base64 32` |
| `TWILIO_ACCOUNT_SID` | Twilio account identifier | [Twilio Console](https://console.twilio.com/) |
| `TWILIO_AUTH_TOKEN` | Twilio authentication token | [Twilio Console](https://console.twilio.com/) |
| `TWILIO_PHONE_NUMBER` | Twilio phone number for SMS | Purchase from Twilio |

**Generate JWT Secret:**
```bash
# macOS/Linux
openssl rand -base64 32

# Windows (PowerShell)
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

---

## Running Development Servers

### Start Both Frontend & Backend

```bash
# From root directory
pnpm dev

# This starts:
# - Frontend (Vite): http://localhost:5173
# - Backend (Express): http://localhost:3001
# - Both in watch mode (auto-restart on file changes)
```

### Start Individually

**Backend Only:**
```bash
# From root
pnpm dev:api

# Or from apps/api
cd apps/api
pnpm dev

# Server starts at: http://localhost:3001
# API available at: http://localhost:3001/api
# Socket.io at: ws://localhost:3001
```

**Frontend Only:**
```bash
# From root
pnpm dev:web

# Or from apps/web
cd apps/web
pnpm dev

# Vite dev server at: http://localhost:5173
# Auto-opens in browser
```

### Verify Services Running

**Check Backend:**
```bash
# Health check endpoint
curl http://localhost:3001/health

# Expected response:
# {"status":"ok","timestamp":"2025-01-11T..."}

# Check API routes
curl http://localhost:3001/api
```

**Check Frontend:**
- Open browser to http://localhost:5173
- Should see DoctorQ login page
- Check browser console for errors (should be none)

**Check Socket.io:**
```bash
# Install wscat globally
npm install -g wscat

# Test WebSocket connection
wscat -c ws://localhost:3001
# Should connect successfully
```

---

## Database Tools

### Prisma Studio

Interactive database GUI for inspecting and editing data.

```bash
# Start Prisma Studio
pnpm db:studio

# Opens at: http://localhost:5555
# Allows browsing all tables, adding/editing records
```

**Common Tasks in Prisma Studio:**
- View all clinics, queue entries, daily stats
- Manually add test patients
- Inspect queue status and positions
- Delete test data

### Prisma CLI Commands

```bash
# Generate Prisma Client (after schema changes)
pnpm db:generate

# Create migration (production workflow)
pnpm db:migrate dev --name add_new_field

# Apply migrations (production)
pnpm db:migrate deploy

# Reset database (WARNING: deletes all data)
pnpm db:reset

# Push schema without migration (development only)
pnpm db:push

# Seed database with test data
pnpm db:seed

# Format schema file
pnpm db:format
```

### Database Reset & Reseed

```bash
# Complete reset (deletes all data and reseeds)
pnpm db:reset

# Manual reset
pnpm db:push --force-reset
pnpm db:seed
```

---

## Testing Setup

### Run All Tests

```bash
# From root - runs all test suites
pnpm test

# This runs:
# - Frontend unit tests (Vitest)
# - Backend unit tests (Jest)
# - Integration tests
```

### Frontend Tests (Vitest)

```bash
# Run frontend tests only
pnpm test:web

# Watch mode (re-run on file change)
pnpm test:web --watch

# With coverage report
pnpm test:web --coverage

# Single test file
pnpm test:web src/components/queue/QueueList.test.tsx
```

**Coverage Report:**
```bash
pnpm test:web --coverage

# Opens HTML report at: apps/web/coverage/index.html
```

### Backend Tests (Jest)

```bash
# Run backend tests only
pnpm test:api

# Watch mode
pnpm test:api --watch

# With coverage
pnpm test:api --coverage

# Single test file
pnpm test:api src/services/queue.service.test.ts
```

### Integration Tests

```bash
# Run integration tests (API endpoints with test database)
pnpm test:integration

# Requires:
# - Test database running (separate from dev database)
# - DATABASE_URL_TEST environment variable
```

**Setup Test Database:**
```bash
# Add to apps/api/.env.test
DATABASE_URL_TEST="postgresql://doctorq:doctorq_dev_password@localhost:5432/doctorq_test"

# Create test database
docker exec -it doctorq-postgres psql -U doctorq -c "CREATE DATABASE doctorq_test;"
```

### End-to-End Tests (Playwright)

```bash
# Install Playwright (first time only)
pnpm exec playwright install

# Run E2E tests
pnpm test:e2e

# Run in headed mode (see browser)
pnpm test:e2e --headed

# Run specific test
pnpm test:e2e tests/patient-checkin.spec.ts
```

---

## Code Quality Tools

### ESLint (Linting)

```bash
# Lint all code
pnpm lint

# Lint specific workspace
pnpm lint:web   # Frontend only
pnpm lint:api   # Backend only

# Auto-fix issues
pnpm lint --fix
```

**ESLint Configuration:**
- Root: `.eslintrc.json` (base config)
- Frontend: `apps/web/.eslintrc.json` (React rules)
- Backend: `apps/api/.eslintrc.json` (Node.js rules)

### Prettier (Formatting)

```bash
# Format all code
pnpm format

# Check formatting without writing
pnpm format:check

# Format specific files
pnpm prettier --write "apps/web/src/**/*.{ts,tsx}"
```

**Prettier Configuration:**
```json
// .prettierrc
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "arrowParens": "avoid"
}
```

### TypeScript Type Checking

```bash
# Check types (all workspaces)
pnpm typecheck

# Check frontend only
pnpm typecheck:web

# Check backend only
pnpm typecheck:api
```

---

## Git Hooks

### Husky Setup

Git hooks are configured with Husky to enforce code quality before commits.

```bash
# Install Husky (should be done automatically with pnpm install)
pnpm husky install

# Hooks are located in: .husky/
```

### Pre-commit Hook

Runs before every commit:
```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# Run linter
pnpm lint-staged

# Run type check
pnpm typecheck
```

**lint-staged Configuration:**
```json
// package.json
{
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{json,md}": [
      "prettier --write"
    ]
  }
}
```

### Pre-push Hook

Runs before `git push`:
```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# Run all tests
pnpm test

# If tests fail, push is blocked
```

### Commit Message Validation

Uses Conventional Commits format:
```bash
# Valid commit messages:
feat: add patient check-in via WhatsApp
fix: correct queue position calculation
docs: update API documentation
refactor: simplify socket.io event handlers
test: add tests for queue service
chore: update dependencies

# Invalid (will be rejected):
"fixed bug"
"WIP"
"changes"
```

**commitlint Configuration:**
```json
// .commitlintrc.json
{
  "extends": ["@commitlint/config-conventional"],
  "rules": {
    "type-enum": [
      2,
      "always",
      ["feat", "fix", "docs", "refactor", "test", "chore", "style", "perf"]
    ]
  }
}
```

---

## IDE Configuration

### VS Code Recommended Setup

**Extensions to Install:**

Open Command Palette (`Ctrl+Shift+P`) → "Extensions: Show Recommended Extensions"

1. **Prisma** (Prisma.prisma)
   - Syntax highlighting for schema.prisma
   - Auto-completion for models

2. **ESLint** (dbaeumer.vscode-eslint)
   - Real-time linting in editor
   - Auto-fix on save

3. **Prettier** (esbenp.prettier-vscode)
   - Code formatting
   - Format on save

4. **Tailwind CSS IntelliSense** (bradlc.vscode-tailwindcss)
   - Auto-completion for Tailwind classes
   - Hover previews

5. **i18next Ally** (lokalise.i18n-ally)
   - Translation management
   - Inline translation previews

6. **GitLens** (eamodio.gitlens)
   - Enhanced Git integration

**Install All Recommended Extensions:**
```bash
# From project root
code --install-extension Prisma.prisma
code --install-extension dbaeumer.vscode-eslint
code --install-extension esbenp.prettier-vscode
code --install-extension bradlc.vscode-tailwindcss
code --install-extension lokalise.i18n-ally
code --install-extension eamodio.gitlens
```

### VS Code Settings

Create `.vscode/settings.json`:
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true,
  "tailwindCSS.experimental.classRegex": [
    ["cva\\(([^)]*)\\)", "[\"'`]([^\"'`]*).*?[\"'`]"],
    ["cn\\(([^)]*)\\)", "[\"'`]([^\"'`]*).*?[\"'`]"]
  ],
  "[prisma]": {
    "editor.defaultFormatter": "Prisma.prisma"
  }
}
```

### VS Code Tasks

Create `.vscode/tasks.json` for quick commands:
```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Start Dev Servers",
      "type": "shell",
      "command": "pnpm dev",
      "problemMatcher": []
    },
    {
      "label": "Run Tests",
      "type": "shell",
      "command": "pnpm test",
      "problemMatcher": []
    },
    {
      "label": "Open Prisma Studio",
      "type": "shell",
      "command": "pnpm db:studio",
      "problemMatcher": []
    }
  ]
}
```

Run tasks: `Ctrl+Shift+P` → "Tasks: Run Task"

### VS Code Launch Configurations

Create `.vscode/launch.json` for debugging:
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Backend",
      "type": "node",
      "request": "launch",
      "runtimeExecutable": "pnpm",
      "runtimeArgs": ["dev:api"],
      "skipFiles": ["<node_internals>/**"],
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen"
    },
    {
      "name": "Debug Frontend",
      "type": "chrome",
      "request": "launch",
      "url": "http://localhost:5173",
      "webRoot": "${workspaceFolder}/apps/web/src"
    }
  ]
}
```

**Usage:**
- Set breakpoints in code
- Press `F5` or go to Run & Debug panel
- Select configuration and click play

---

## Troubleshooting

### Database Connection Issues

**Error:** `Can't reach database server at localhost:5432`

**Solutions:**
```bash
# Check if PostgreSQL is running
docker ps  # Should see doctorq-postgres

# Restart PostgreSQL
docker-compose restart postgres

# Check logs
docker-compose logs postgres

# Verify DATABASE_URL in .env
echo $DATABASE_URL
# Should match docker-compose.yml credentials
```

### Port Already in Use

**Error:** `Port 3001 is already in use`

**Solutions:**
```bash
# Find process using port
# Windows
netstat -ano | findstr :3001
taskkill /PID <process_id> /F

# macOS/Linux
lsof -ti:3001 | xargs kill -9

# Or change port in apps/api/.env
PORT=3002
```

### Prisma Client Not Generated

**Error:** `@prisma/client did not initialize yet`

**Solutions:**
```bash
# Generate Prisma Client
pnpm db:generate

# If still fails, delete and regenerate
rm -rf node_modules/.prisma
pnpm db:generate
```

### TypeScript Errors in VS Code

**Error:** Red squiggly lines everywhere, "Cannot find module..."

**Solutions:**
```bash
# Restart TS Server in VS Code
# Ctrl+Shift+P → "TypeScript: Restart TS Server"

# Use workspace TypeScript version
# Ctrl+Shift+P → "TypeScript: Select TypeScript Version" → "Use Workspace Version"

# Reinstall dependencies
rm -rf node_modules
pnpm install
```

### Tailwind Classes Not Working

**Error:** Tailwind classes have no effect in browser

**Solutions:**
```bash
# Check tailwind.config.js content paths
# Should include: "./src/**/*.{js,ts,jsx,tsx}"

# Restart Vite dev server
# Ctrl+C → pnpm dev:web

# Clear Vite cache
rm -rf apps/web/node_modules/.vite
pnpm dev:web
```

### Git Hooks Not Running

**Error:** Commits succeed even with linting errors

**Solutions:**
```bash
# Reinstall Husky
pnpm husky install

# Make hooks executable (macOS/Linux)
chmod +x .husky/pre-commit
chmod +x .husky/pre-push

# Verify hooks
ls -la .husky/
# Should see pre-commit and pre-push files
```

### Twilio SMS Not Sending

**Error:** SMS notifications fail in development

**Solutions:**
```bash
# Verify Twilio credentials in apps/api/.env
# Test credentials with Twilio CLI
twilio phone-numbers:list

# Check Twilio account balance
# Visit: https://console.twilio.com/

# For development, use console logging instead
# Set in apps/api/.env:
TWILIO_MOCK=true  # Logs SMS to console instead of sending
```

### Socket.io Connection Failed

**Error:** Frontend shows "Disconnected" status

**Solutions:**
```bash
# Verify CORS settings in backend
# apps/api/src/index.ts should have:
cors({ origin: process.env.CORS_ORIGIN })

# Check VITE_SOCKET_URL in frontend .env
# Should match backend URL: http://localhost:3001

# Check browser console for CORS errors
# Restart both frontend and backend
```

---

## Verification Checklist

After completing setup, verify all components:

### Backend Checklist
- [ ] `pnpm dev:api` starts without errors
- [ ] `curl http://localhost:3001/health` returns `{"status":"ok"}`
- [ ] Prisma Studio opens at `http://localhost:5555`
- [ ] Test clinic exists in database (from seed)
- [ ] Backend logs show "Server listening on port 3001"

### Frontend Checklist
- [ ] `pnpm dev:web` starts without errors
- [ ] Browser opens to `http://localhost:5173`
- [ ] Login page renders correctly
- [ ] No console errors in browser DevTools
- [ ] Tailwind styles are applied

### Database Checklist
- [ ] PostgreSQL running (Docker or local)
- [ ] `pnpm db:studio` opens successfully
- [ ] Seed data visible in Prisma Studio
- [ ] Can query database directly via psql

### Testing Checklist
- [ ] `pnpm test:web` runs and passes
- [ ] `pnpm test:api` runs and passes
- [ ] `pnpm lint` shows no errors
- [ ] `pnpm typecheck` shows no errors

### Git Hooks Checklist
- [ ] Commit with bad format is rejected
- [ ] Commit with linting errors is blocked
- [ ] Pre-push hook runs tests

---

## Quick Start Summary

**For Impatient Developers:**

```bash
# 1. Clone and install
git clone https://github.com/your-org/doctorq.git
cd doctorq
pnpm install

# 2. Start database
docker-compose up -d

# 3. Setup database
pnpm db:push
pnpm db:seed

# 4. Configure environment
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
# Edit .env files with your values

# 5. Start development servers
pnpm dev

# 6. Open browser
# Frontend: http://localhost:5173
# Backend: http://localhost:3001
# Prisma Studio: pnpm db:studio

# 7. Run tests
pnpm test
```

**Test Credentials (from seed):**
```
Email: test@doctorq.tn
Password: test123
```

---

## Next Steps

After environment setup:

1. Read [05_Technical_Architecture.md](./05_Technical_Architecture.md) for system overview
2. Review [10_Coding_Standards.md](./10_Coding_Standards.md) for code conventions
3. Check [12_Testing_Plan.md](./12_Testing_Plan.md) for testing guidelines
4. Explore [14_Claude_Code_Tools_Guide.md](./14_Claude_Code_Tools_Guide.md) for development workflows

**Start Coding:**
- Frontend: Begin with `apps/web/src/pages/doctor/QueueDashboard.tsx`
- Backend: Begin with `apps/api/src/routes/queue.routes.ts`

**Get Help:**
- Check [Troubleshooting](#troubleshooting) section above
- Read error logs carefully (often contain solution)
- Ask team members or create GitHub issue
