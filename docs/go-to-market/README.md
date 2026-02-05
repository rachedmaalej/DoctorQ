# BleSaf Go-to-Market Strategy

## Overview

BleSaf is a self-service SaaS queue management system for medical clinics in Tunisia. This documentation covers the technical implementation that enables doctors to discover, sign up, and start using BleSaf without admin intervention.

## Business Model

| Item | Price |
|------|-------|
| Monthly subscription | 50 TND/month |
| Yearly subscription | 500 TND/year (2 months free) |
| Free trial | 30 days |
| Free SMS on signup | 50 credits |

### SMS Packages (separate from subscription)

| Package | Credits | Price | Per-SMS |
|---------|---------|-------|---------|
| Starter | 100 | 10 TND | 0.10 TND |
| Standard | 300 | 25 TND | 0.08 TND |
| Pro | 1000 | 70 TND | 0.07 TND |

## Documentation Index

1. [Technical Architecture](./01-Technical-Architecture.md) - System design and components
2. [User Flows](./02-User-Flows.md) - Step-by-step user journeys
3. [Configuration Guide](./03-Configuration-Guide.md) - Environment setup
4. [Launch Checklist](./04-Launch-Checklist.md) - Pre-launch requirements
5. [Landing Page Copy](./05-Landing-Page-Copy.md) - Marketing content (FR/AR)

## Quick Start

```bash
# Install dependencies
pnpm install

# Apply database schema
cd apps/api && npx prisma db push

# Start development servers
pnpm dev
```

Then visit:
- Landing page: http://localhost:5173/
- Signup: http://localhost:5173/signup
- API health: http://localhost:3003/health

## Target Market

### Primary Users
- Independent medical practices in Tunisia
- Clinics with 20-100 patients/day
- Doctors frustrated with chaotic waiting rooms

### Market Size
- ~5,000 independent medical practices in Tunisia
- Target: 50+ paying clinics for viable business
- Break-even: ~10 clinics at 50 TND/month

## Value Proposition

**For Doctors:**
- Reduce waiting room chaos
- Happier patients = better reviews
- Simple setup (5 minutes)

**For Patients:**
- Know exactly when it's their turn
- Wait anywhere (car, cafe, home)
- SMS notifications in French or Arabic
