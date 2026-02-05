# User Flows

## 1. Discovery & Signup Flow

```
┌─────────────────┐
│  Landing Page   │  Doctor discovers BleSaf
│    (/)          │  - Value proposition
└────────┬────────┘  - Pricing information
         │           - FAQ section
         ▼
┌─────────────────┐
│   Signup Page   │  Doctor creates account
│   (/signup)     │  - Clinic name, email, password
└────────┬────────┘  - Optional: doctor name, phone
         │
         ▼
┌─────────────────┐
│ Email Sent      │  Verification email sent
│ (Success Modal) │  - Link valid for 24 hours
└────────┬────────┘  - Can resend if needed
         │
         ▼
┌─────────────────┐
│ Email Inbox     │  Doctor clicks verification link
│ (External)      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Email Verified  │  Account activated
│ (/verify-email) │  - Welcome email sent
└────────┬────────┘  - 30-day trial started
         │           - 50 free SMS credited
         ▼
┌─────────────────┐
│   Login Page    │  Doctor logs in
│   (/login)      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Onboarding    │  Guided setup wizard
│  (/onboarding)  │
└─────────────────┘
```

## 2. Onboarding Flow (3 Steps)

### Step 1: Clinic Setup
- Confirm/edit clinic name
- Add doctor name
- Set preferred language (FR/AR)
- Configure notification settings

### Step 2: QR Code Setup
- View generated QR code
- Download printable poster (A4 PDF)
- Instructions for placement

### Step 3: Tutorial
- Quick overview of dashboard
- How patients check in
- SMS notification flow
- "Add first patient" prompt

```
Step 1          Step 2          Step 3
Clinic Setup    QR Code         Tutorial
    ●──────────────●──────────────●
    │              │              │
    │  Name        │  Download    │  Dashboard
    │  Language    │  PDF poster  │  overview
    │  Settings    │  Placement   │  First patient
    │              │  tips        │
    ▼              ▼              ▼
              COMPLETED → Dashboard
```

## 3. Subscription Flow

### Trial Period (30 days)

```
Day 1                    Day 23              Day 27              Day 30
  │                        │                   │                   │
  ▼                        ▼                   ▼                   ▼
Trial Started    (Future) 7-day      (Future) 3-day        Trial Expires
                 reminder email       reminder email
```

### Upgrade Flow

```
┌─────────────────┐
│ Subscription    │  View current status
│ Page            │  - Trial days remaining
└────────┬────────┘  - SMS balance
         │
         │  Click "Upgrade"
         ▼
┌─────────────────┐
│ Select Plan     │  Choose Monthly or Yearly
│                 │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Konnect         │  Payment gateway
│ Checkout        │  - Card payment
└────────┬────────┘  - Mobile payment
         │
         │  Payment success
         ▼
┌─────────────────┐
│ Subscription    │  Account upgraded
│ Active          │  - Status: ACTIVE
└─────────────────┘  - Receipt email sent
```

## 4. SMS Purchase Flow

```
┌─────────────────┐
│ Subscription    │  Check SMS balance
│ Page            │  - Current credits
└────────┬────────┘  - Usage stats
         │
         │  Click package
         ▼
┌─────────────────┐
│ Select Package  │  Starter (100), Standard (300), Pro (1000)
│                 │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Konnect         │  Payment gateway
│ Checkout        │
└────────┬────────┘
         │
         │  Payment success
         ▼
┌─────────────────┐
│ Credits Added   │  Balance updated
│                 │  - Immediate availability
└─────────────────┘
```

## 5. Password Reset Flow

```
┌─────────────────┐
│ Login Page      │  Click "Forgot password"
│                 │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Enter Email     │  Submit email address
│                 │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Email Sent      │  Reset link sent
│ (if exists)     │  - Valid for 1 hour
└────────┬────────┘  - Generic message (security)
         │
         ▼
┌─────────────────┐
│ Reset Password  │  Enter new password
│ (/reset-password)│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Login Page      │  Password updated
│                 │  - Can login with new password
└─────────────────┘
```

## State Transitions

### Subscription Status

```
                    ┌──────────────┐
     Signup ───────►│    TRIAL     │
                    └──────┬───────┘
                           │
           ┌───────────────┼───────────────┐
           │               │               │
           ▼               ▼               ▼
    ┌──────────┐    ┌──────────┐    ┌──────────┐
    │  ACTIVE  │◄───│ PAST_DUE │    │ EXPIRED  │
    └────┬─────┘    └──────────┘    └──────────┘
         │                                ▲
         │         ┌──────────┐           │
         └────────►│CANCELLED │───────────┘
                   └──────────┘
```

### Email Verification

```
Unverified ──► Token Generated ──► Email Sent ──► Link Clicked ──► Verified
                    │                                                  │
                    │              Token Expired                       │
                    └────────────────────►─────────────────────────────┘
                                   (Resend new token)
```
