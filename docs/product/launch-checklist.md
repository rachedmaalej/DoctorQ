# Launch Checklist

## Pre-Launch Requirements

### Technical Infrastructure

- [ ] **Domain Setup**
  - [ ] Register blesaf.tn domain
  - [ ] Configure DNS for frontend (Vercel/Netlify)
  - [ ] Configure DNS for API (Railway/Render)
  - [ ] SSL certificates active

- [ ] **Email Service**
  - [ ] Resend account created
  - [ ] Domain verified (DNS records)
  - [ ] API key added to production env
  - [ ] Test email delivery (all 3 templates)

- [ ] **Payment Gateway**
  - [ ] Konnect merchant application submitted
  - [ ] Business verification completed
  - [ ] API credentials received
  - [ ] Webhook URL configured
  - [ ] Test payment flow end-to-end

- [ ] **Database**
  - [ ] Production database provisioned
  - [ ] Schema migrated (`prisma db push`)
  - [ ] Backups configured
  - [ ] Connection pooling enabled

### Missing Frontend Pages

- [ ] **Email Verification Page** (`/verify-email`)
  - Shows success/error after clicking email link
  - Redirects to login on success

- [ ] **Password Reset Page** (`/reset-password`)
  - Form to enter new password
  - Token validation
  - Success redirect to login

### Legal Requirements

- [ ] **Privacy Policy**
  - Data collection disclosure
  - Cookie usage
  - GDPR-like compliance for Tunisia

- [ ] **Terms of Service**
  - Subscription terms
  - Refund policy
  - Service availability

- [ ] **Business Registration**
  - Tunisian business entity
  - Tax registration

### Content & Copy

- [ ] **Landing Page**
  - [ ] French copy reviewed
  - [ ] Arabic copy reviewed
  - [ ] Pricing accurate
  - [ ] Contact email active

- [ ] **Email Templates**
  - [ ] Professional design
  - [ ] Both languages tested
  - [ ] Links working

### Testing

- [ ] **End-to-End Flows**
  - [ ] Signup → Email verification → Login
  - [ ] Onboarding wizard (all 3 steps)
  - [ ] QR poster download
  - [ ] Subscription purchase
  - [ ] SMS package purchase
  - [ ] Password reset

- [ ] **Mobile Responsiveness**
  - [ ] Landing page
  - [ ] Signup form
  - [ ] Dashboard
  - [ ] Patient status page

- [ ] **RTL Support (Arabic)**
  - [ ] Landing page layout
  - [ ] Forms alignment
  - [ ] Dashboard layout

---

## Post-Launch (Phase 2)

### Automation

- [ ] **Trial Reminder Emails**
  - [ ] 7 days before expiry
  - [ ] 3 days before expiry
  - [ ] Trial expired

- [ ] **Subscription Management**
  - [ ] Auto-renewal reminders
  - [ ] Payment failure handling
  - [ ] Grace period logic

### Analytics

- [ ] **Tracking Setup**
  - [ ] Page views (Plausible/Umami)
  - [ ] Conversion events
  - [ ] Funnel analysis

### Growth Features

- [ ] **Referral Program**
  - [ ] Referral codes
  - [ ] Credit rewards

- [ ] **Physical QR Ordering**
  - [ ] Partner with print shop
  - [ ] Order form in app
  - [ ] Delivery tracking

---

## Environment Checklist

### Production Environment Variables

```bash
# Copy this template and fill in values

# Database
DATABASE_URL=

# Auth
JWT_SECRET=
JWT_EXPIRES_IN=7d

# Email
RESEND_API_KEY=
FROM_EMAIL=BleSaf <noreply@blesaf.tn>

# Payments
KONNECT_API_KEY=
KONNECT_WALLET_ID=

# URLs
FRONTEND_URL=https://blesaf.tn
API_URL=https://api.blesaf.tn

# Server
PORT=3003
NODE_ENV=production
```

### Deployment Commands

```bash
# Build and deploy API
cd apps/api
pnpm build
# Deploy to Railway/Render

# Build and deploy frontend
cd apps/web
pnpm build
# Deploy to Vercel/Netlify
```

---

## Launch Day

### Morning Checklist

1. [ ] Verify all services are running
2. [ ] Test signup flow one more time
3. [ ] Check email delivery
4. [ ] Verify payment gateway is live
5. [ ] Confirm monitoring/alerting is active

### Monitoring

- [ ] API health endpoint responding
- [ ] Database connections stable
- [ ] Email delivery rate normal
- [ ] No error spikes in logs

### Support Readiness

- [ ] Support email monitored (support@blesaf.tn)
- [ ] WhatsApp support number active
- [ ] FAQ page accessible
- [ ] Known issues documented

---

## Rollback Plan

If critical issues arise:

1. **Frontend Issues**
   - Revert to previous Vercel/Netlify deployment
   - One-click rollback in dashboard

2. **API Issues**
   - Revert to previous Railway/Render deployment
   - Restore database from backup if needed

3. **Payment Issues**
   - Disable payment buttons temporarily
   - Contact Konnect support
   - Extend trials manually if needed

4. **Email Issues**
   - Switch to backup email provider
   - Or temporarily disable email verification
