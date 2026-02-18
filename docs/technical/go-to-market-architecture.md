# Technical Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React)                         │
├─────────────────────────────────────────────────────────────────┤
│  Landing Page  │  Signup  │  Onboarding  │  Subscription  │ ... │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTP/WebSocket
┌────────────────────────────▼────────────────────────────────────┐
│                        BACKEND (Express)                        │
├─────────────────────────────────────────────────────────────────┤
│  /api/signup  │  /api/subscription  │  /api/queue  │  /api/auth │
└────────────────────────────┬────────────────────────────────────┘
                             │
        ┌────────────────────┼────────────────────┐
        ▼                    ▼                    ▼
┌───────────────┐  ┌─────────────────┐  ┌─────────────────┐
│   PostgreSQL  │  │     Resend      │  │     Konnect     │
│   (Supabase)  │  │   (Email API)   │  │  (Payment API)  │
└───────────────┘  └─────────────────┘  └─────────────────┘
```

## Database Schema Additions

### Clinic Model Extensions

```prisma
model Clinic {
  // ... existing fields ...

  // Subscription Management
  subscriptionStatus    SubscriptionStatus @default(TRIAL)
  subscriptionPlan      SubscriptionPlan?
  trialEndsAt           DateTime?
  subscriptionEndsAt    DateTime?

  // Email Verification
  emailVerified           Boolean   @default(false)
  emailVerificationToken  String?   @unique
  emailVerificationExpiry DateTime?

  // Password Reset
  passwordResetToken      String?   @unique
  passwordResetExpiry     DateTime?

  // SMS Credits (separate from subscription)
  smsCredits            Int       @default(0)
  smsCreditsUsed        Int       @default(0)

  // Onboarding Progress
  onboardingCompleted   Boolean   @default(false)
  onboardingStep        Int       @default(0)
}

enum SubscriptionStatus {
  TRIAL      // 30-day free trial
  ACTIVE     // Paid and current
  PAST_DUE   // Payment failed, grace period
  EXPIRED    // Trial or subscription ended
  CANCELLED  // User cancelled
}

enum SubscriptionPlan {
  MONTHLY    // 50 TND/month
  YEARLY     // 500 TND/year
}
```

### New Models

```prisma
model SubscriptionEvent {
  id          String   @id @default(uuid())
  clinicId    String
  clinic      Clinic   @relation(fields: [clinicId], references: [id])
  eventType   String   // trial_started, payment_success, etc.
  amount      Int?     // In millimes
  paymentRef  String?
  notes       String?
  createdAt   DateTime @default(now())
}

model SmsPackagePurchase {
  id          String   @id @default(uuid())
  clinicId    String
  clinic      Clinic   @relation(fields: [clinicId], references: [id])
  packageName String   // starter, standard, pro
  credits     Int
  amount      Int      // In millimes
  paymentRef  String?
  createdAt   DateTime @default(now())
}
```

## API Endpoints

### Public Endpoints (No Auth Required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/signup` | Register new clinic |
| POST | `/api/signup/verify-email` | Verify email with token |
| POST | `/api/signup/resend-verification` | Resend verification email |
| POST | `/api/signup/forgot-password` | Request password reset |
| POST | `/api/signup/reset-password` | Reset password with token |

### Protected Endpoints (Auth Required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/subscription` | Get subscription status |
| POST | `/api/subscription/checkout` | Create payment checkout |
| GET | `/api/subscription/sms` | Get SMS balance |
| POST | `/api/subscription/sms/checkout` | Buy SMS package |
| GET | `/api/subscription/onboarding` | Get onboarding status |
| POST | `/api/subscription/onboarding/step` | Update onboarding step |

## File Structure

### Backend (apps/api/src/)

```
routes/
├── signup.ts           # Public registration endpoints
├── subscription.ts     # Subscription management
└── auth.ts            # Existing auth routes

services/
├── signupService.ts    # Registration logic
├── subscriptionService.ts # Trial/payment logic
└── queueService.ts    # Existing queue logic

lib/
├── email.ts           # Email templates & Resend integration
├── konnect.ts         # Payment gateway integration
├── prisma.ts          # Database client
└── auth.ts            # JWT utilities
```

### Frontend (apps/web/src/)

```
pages/
├── LandingPage.tsx     # Marketing landing page
├── SignupPage.tsx      # Self-registration form
├── OnboardingPage.tsx  # 3-step setup wizard
├── SubscriptionPage.tsx # Plan management
├── LoginPage.tsx       # Existing login
└── DashboardPage.tsx   # Existing dashboard

components/
└── ui/
    └── LanguageSwitcher.tsx  # FR/AR toggle

i18n/
└── locales/
    ├── fr.json         # French translations
    └── ar.json         # Arabic translations
```

## Email Templates

Located in `apps/api/src/lib/email.ts`:

| Template | Trigger | Content |
|----------|---------|---------|
| Verification | Signup | Confirm email link (24h expiry) |
| Welcome | Email verified | Trial started, next steps |
| Password Reset | Forgot password | Reset link (1h expiry) |

All templates support:
- French and Arabic languages
- RTL layout for Arabic
- Responsive HTML design
- Plain text fallback

## Security Considerations

1. **Password Hashing**: bcryptjs with 10 rounds
2. **Token Generation**: crypto.randomBytes(32) for 64-char hex tokens
3. **Token Expiry**: 24h for email verification, 1h for password reset
4. **Rate Limiting**: Applied to `/api/signup` routes
5. **Email Enumeration**: Generic responses don't reveal if email exists
