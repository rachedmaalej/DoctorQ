# DoctorQ Deployment Guide

This guide walks you through deploying DoctorQ to production for a live demo accessible from any device, anywhere.

## Architecture Overview

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│  Vercel         │────▶│  Railway        │────▶│  Supabase       │
│  (Frontend)     │     │  (Backend API)  │     │  (PostgreSQL)   │
│                 │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
   doctorq.vercel.app   doctorq-api.railway.app    ✅ Already set up
```

## Prerequisites

- [x] **Supabase PostgreSQL** - Already configured and working
- [ ] **GitHub account** - To connect repositories
- [ ] **Railway account** - For backend hosting (free tier available)
- [ ] **Vercel account** - For frontend hosting (free tier)

## Current Status

| Component | Status | Details |
|-----------|--------|---------|
| Database | ✅ Ready | Supabase PostgreSQL (cloud) |
| Backend | 🔄 Local | Needs deployment to Railway |
| Frontend | 🔄 Local | Needs deployment to Vercel |

---

## Step 1: Push Code to GitHub

If your code isn't already on GitHub:

```bash
# Initialize git (if not already)
git init

# Add all files
git add .

# Commit
git commit -m "Prepare for deployment"

# Create repo on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/doctorq.git
git branch -M main
git push -u origin main
```

---

## Step 2: Deploy Backend to Railway

### 2.1 Create Railway Account

1. Go to [railway.app](https://railway.app)
2. Sign in with **GitHub** (recommended for easy repo access)
3. You get $5 free credits (enough for months of light usage)

### 2.2 Create New Project

1. Click **"New Project"**
2. Select **"Deploy from GitHub repo"**
3. Choose your `doctorq` (or `IjaTawa`) repository
4. Railway will detect it's a monorepo

### 2.3 Configure the Service

1. Click on the created service
2. Go to **Settings** tab
3. Set **Root Directory**: `apps/api`
4. Set **Build Command**: `npm install && npm run build`
5. Set **Start Command**: `npm start`

### 2.4 Add Environment Variables

Go to **Variables** tab and add:

```env
# Database (your existing Supabase connection)
DATABASE_URL=postgresql://postgres.fefixfzjiuyyngfudamu:Mayasmine2@@9@aws-1-eu-west-1.pooler.supabase.com:5432/postgres

# Authentication
JWT_SECRET=generate-a-long-random-string-here-at-least-32-chars
JWT_EXPIRES_IN=7d

# Server
PORT=3001
NODE_ENV=production

# CORS (update after Vercel deployment)
FRONTEND_URL=https://doctorq.vercel.app
CORS_ORIGIN=https://doctorq.vercel.app
```

> ⚠️ **Security Note**: Generate a new secure JWT_SECRET for production. You can use:
> ```bash
> node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
> ```

### 2.5 Generate Domain

1. Go to **Settings** → **Networking**
2. Click **"Generate Domain"**
3. You'll get a URL like: `doctorq-api-production.up.railway.app`
4. **Save this URL** - you'll need it for the frontend

### 2.6 Deploy

Railway auto-deploys on every push to main. Check the **Deployments** tab for status.

---

## Step 3: Deploy Frontend to Vercel

### 3.1 Create Vercel Account

1. Go to [vercel.com](https://vercel.com)
2. Sign in with **GitHub**

### 3.2 Import Project

1. Click **"Add New..."** → **"Project"**
2. Select your `doctorq` repository
3. Vercel will detect the monorepo structure

### 3.3 Configure Build Settings

1. Set **Root Directory**: `apps/web`
2. **Framework Preset**: Vite (should auto-detect)
3. **Build Command**: `npm run build` (default)
4. **Output Directory**: `dist` (default)

### 3.4 Add Environment Variables

Add these environment variables:

```env
VITE_API_URL=https://YOUR-RAILWAY-URL.up.railway.app
VITE_SOCKET_URL=https://YOUR-RAILWAY-URL.up.railway.app
VITE_DEFAULT_LANGUAGE=fr
```

Replace `YOUR-RAILWAY-URL` with the actual Railway domain from Step 2.5.

### 3.5 Deploy

1. Click **"Deploy"**
2. Wait for build to complete (~2-3 minutes)
3. You'll get a URL like: `doctorq.vercel.app`

---

## Step 4: Update Backend CORS

Now that you have your Vercel URL, update Railway:

1. Go to your Railway project
2. Go to **Variables**
3. Update these values:

```env
FRONTEND_URL=https://doctorq.vercel.app
CORS_ORIGIN=https://doctorq.vercel.app
```

4. Railway will auto-redeploy with new variables

---

## Step 5: Verify Deployment

### Test the Backend

```bash
curl https://YOUR-RAILWAY-URL.up.railway.app/health
```

Should return: `{"status":"ok","timestamp":"..."}`

### Test the Frontend

1. Open `https://doctorq.vercel.app` in your browser
2. You should see the login page
3. Try logging in with your test credentials

### Test Real-time Updates

1. Open dashboard on your computer
2. Open check-in page on your phone
3. Check in as a patient
4. Verify the dashboard updates in real-time

---

## Step 6: Demo URLs

After deployment, share these URLs:

| Purpose | URL |
|---------|-----|
| **Doctor Dashboard** | `https://doctorq.vercel.app/login` |
| **Patient Check-in** | `https://doctorq.vercel.app/checkin/{clinic-id}` |
| **Patient Status** | `https://doctorq.vercel.app/status/{entry-id}` |

### Getting the Clinic ID

1. Log into the dashboard
2. The clinic ID is in the QR code URL or visible in browser dev tools
3. For Dr. Ahmed's test clinic: `ec719110-4f22-4b90-b79d-a427da11a197`

---

## Troubleshooting

### Backend won't start

1. Check Railway logs for errors
2. Verify DATABASE_URL is correct
3. Ensure all environment variables are set

### CORS errors

1. Verify FRONTEND_URL and CORS_ORIGIN match your Vercel URL exactly
2. Include `https://` prefix
3. No trailing slash

### Socket.io not connecting

1. Ensure VITE_SOCKET_URL points to Railway URL
2. Check that Railway is using HTTPS
3. Verify no firewall blocking WebSocket connections

### Database connection fails

1. Check Supabase dashboard for connection limits
2. Verify DATABASE_URL includes correct password
3. Try the connection string in Prisma Studio locally

---

## Cost Breakdown

| Service | Free Tier | Paid (if needed) |
|---------|-----------|------------------|
| **Supabase** | 500MB DB, 2 projects | $25/mo for more |
| **Railway** | $5 credit (~500 hours) | $5-10/mo typical |
| **Vercel** | Unlimited for personal | $20/mo for team |

**Total for demo/pilot**: **$0** (within free tiers)

---

## Custom Domain (Optional)

### For Vercel (Frontend)

1. Go to Project Settings → Domains
2. Add `app.doctorq.tn` (or your domain)
3. Update DNS with provided records

### For Railway (Backend)

1. Go to Service Settings → Networking
2. Add custom domain `api.doctorq.tn`
3. Update DNS with provided records

Then update environment variables to use new domains.

---

## Security Checklist Before Production

- [ ] Generate new JWT_SECRET (don't use development secret)
- [ ] Change Supabase database password
- [ ] Enable Supabase Row Level Security (RLS)
- [ ] Set up rate limiting on Railway
- [ ] Enable Vercel Analytics for monitoring
- [ ] Configure error tracking (Sentry recommended)

---

## Quick Reference

```bash
# Local development
pnpm dev

# Build for production
pnpm build

# Database commands
pnpm db:push      # Push schema changes
pnpm db:migrate   # Run migrations
pnpm db:seed      # Seed test data
pnpm db:studio    # Open Prisma Studio
```

---

## Support

- **Railway Docs**: https://docs.railway.app
- **Vercel Docs**: https://vercel.com/docs
- **Supabase Docs**: https://supabase.com/docs
