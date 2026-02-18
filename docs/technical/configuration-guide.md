# Configuration Guide

## Environment Variables

### Required for Production

Create or update `apps/api/.env`:

```bash
# ─── Database ────────────────────────────────────────────
DATABASE_URL="postgresql://user:password@host:5432/database"

# ─── Authentication ──────────────────────────────────────
JWT_SECRET="your-secure-random-string-min-32-chars"
JWT_EXPIRES_IN="7d"

# ─── Email Service (Resend) ──────────────────────────────
RESEND_API_KEY="re_xxxxxxxxxxxxxxxxxxxxxxxxxxxx"
FROM_EMAIL="BleSaf <noreply@blesaf.tn>"

# ─── Payment Gateway (Konnect) ───────────────────────────
KONNECT_API_KEY="your-konnect-api-key"
KONNECT_WALLET_ID="your-wallet-id"

# ─── Application URLs ────────────────────────────────────
FRONTEND_URL="https://blesaf.tn"
API_URL="https://api.blesaf.tn"

# ─── Server ──────────────────────────────────────────────
PORT=3003
NODE_ENV="production"
```

### Frontend Environment

Create or update `apps/web/.env`:

```bash
VITE_API_URL="https://api.blesaf.tn"
VITE_SOCKET_URL="https://api.blesaf.tn"
```

## Service Setup

### 1. Resend (Email)

1. Sign up at [resend.com](https://resend.com)
2. Verify your domain (blesaf.tn)
3. Create an API key
4. Add `RESEND_API_KEY` to environment

**Free Tier Limits:**
- 100 emails/day
- 3,000 emails/month
- Sufficient for early growth

**DNS Records Required:**
```
TXT  _resend.blesaf.tn  "resend-verify=xxxxxxxx"
MX   blesaf.tn          feedback-smtp.resend.com
TXT  blesaf.tn          "v=spf1 include:_spf.resend.com ~all"
```

### 2. Konnect (Payments)

1. Apply for merchant account at [konnect.network](https://konnect.network)
2. Complete business verification (Tunisian business required)
3. Get API credentials from dashboard
4. Configure webhook URL: `https://api.blesaf.tn/api/subscription/webhook`

**Supported Payment Methods:**
- Credit/Debit cards (Visa, Mastercard)
- E-DINAR
- Mobile payments

**Webhook Events:**
- `payment.completed` - Payment successful
- `payment.failed` - Payment declined

### 3. Database (Supabase/PostgreSQL)

The schema is managed via Prisma. To apply:

```bash
cd apps/api
npx prisma db push
```

**Schema Changes Added:**
- Subscription fields on Clinic model
- SubscriptionEvent model
- SmsPackagePurchase model

## Pricing Configuration

Located in `apps/api/src/services/subscriptionService.ts`:

```typescript
const SUBSCRIPTION_PRICES = {
  MONTHLY: 50000,  // 50 TND in millimes
  YEARLY: 500000,  // 500 TND in millimes
};

const SMS_PACKAGES = {
  starter: { credits: 100, price: 10000 },   // 10 TND
  standard: { credits: 300, price: 25000 },  // 25 TND
  pro: { credits: 1000, price: 70000 },      // 70 TND
};
```

To change prices, update these constants and redeploy.

## Email Templates

Located in `apps/api/src/lib/email.ts`:

| Template | Function | Customizable |
|----------|----------|--------------|
| Verification | `sendVerificationEmail()` | Yes - HTML/text |
| Welcome | `sendWelcomeEmail()` | Yes - HTML/text |
| Password Reset | `sendPasswordResetEmail()` | Yes - HTML/text |

To customize:
1. Edit the template functions in `email.ts`
2. Update both French and Arabic versions
3. Test with `NODE_ENV=development` (logs to console)

## Development Mode

When `RESEND_API_KEY` is not set:
- Emails are logged to console instead of sent
- Verification tokens are returned in API responses
- Useful for local testing

```bash
# Start without email service
unset RESEND_API_KEY
pnpm dev
```

## Security Configuration

### Rate Limiting

Applied in `apps/api/src/index.ts`:

```typescript
// Signup routes: 5 requests per minute per IP
app.use('/api/signup', rateLimit({
  windowMs: 60 * 1000,
  max: 5,
}));
```

### CORS

```typescript
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
}));
```

### Token Expiry

| Token Type | Expiry |
|------------|--------|
| Email Verification | 24 hours |
| Password Reset | 1 hour |
| JWT Auth | 7 days |

## Troubleshooting

### Email Not Sending

1. Check `RESEND_API_KEY` is set
2. Verify domain DNS records
3. Check Resend dashboard for delivery status
4. Look for errors in API logs

### Payment Issues

1. Verify `KONNECT_API_KEY` and `KONNECT_WALLET_ID`
2. Check webhook URL is accessible
3. Test with Konnect sandbox mode first
4. Review payment logs in Konnect dashboard

### Database Errors

```bash
# Reset database (development only!)
cd apps/api
npx prisma db push --force-reset

# View data
npx prisma studio
```
