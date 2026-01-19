# DoctorQ Production Monitoring & Analytics Dashboard

## Overview

A comprehensive monitoring solution for DoctorQ production launch (Jan 21-22, 2026), providing:
1. **Clinic Owner Dashboard** - Operational metrics for Dr. Kamoun and future clinics
2. **Admin Dashboard** - Business metrics for SaaS owner (Rached)
3. **Technical Monitoring** - Full Prometheus + Grafana stack for production health

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         DATA SOURCES                                 │
├──────────────────┬──────────────────┬──────────────────────────────┤
│  PostgreSQL      │  Express API     │  Socket.io                   │
│  (Queue data)    │  (Metrics)       │  (Real-time events)          │
└────────┬─────────┴────────┬─────────┴──────────────┬───────────────┘
         │                  │                         │
         ▼                  ▼                         ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      COLLECTION LAYER                                │
├──────────────────┬──────────────────┬──────────────────────────────┤
│  Stats Service   │  Prometheus      │  PostHog                     │
│  (DB queries)    │  (API metrics)   │  (Event tracking)            │
└────────┬─────────┴────────┬─────────┴──────────────┬───────────────┘
         │                  │                         │
         ▼                  ▼                         ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      VISUALIZATION LAYER                             │
├──────────────────┬──────────────────┬──────────────────────────────┤
│  Clinic Dashboard│  Admin Dashboard │  Grafana                     │
│  (React in-app)  │  (React in-app)  │  (Technical ops)             │
└──────────────────┴──────────────────┴──────────────────────────────┘
```

---

## Part 1: Clinic Owner Dashboard (Dr. Kamoun's View)

### Location
- **Route:** `/dashboard` (enhance existing)
- **File:** `apps/web/src/components/queue/QueueStats.tsx`

### Metrics to Display

| Metric | Description | Update Frequency |
|--------|-------------|------------------|
| **En Attente** | Patients currently waiting | Real-time |
| **Vus Aujourd'hui** | Patients seen today | Real-time |
| **Attente Moyenne** | Avg wait time (today only) | Every 30s |
| **Temps Max** | Longest wait today | Every 30s |
| **Non-présentés** | No-shows today | Real-time |
| **Méthode Check-in** | QR vs Manual breakdown | Hourly |
| **Heure de Fin Estimée** | Based on avg consultation time | Every 5 min |

### Historical View (New Feature)
- **Weekly summary** - Show trends for past 7 days
- **Peak hours chart** - When is clinic busiest?
- **No-show patterns** - Which days have most no-shows?

### Implementation

**Backend Changes:**
```
apps/api/src/services/statsService.ts
- Add getTodayStats(clinicId) - filtered to today only
- Add getWeeklyStats(clinicId) - aggregated by day
- Add getPeakHours(clinicId) - group by hour

apps/api/src/routes/stats.ts (new file)
- GET /api/stats/today
- GET /api/stats/weekly
- GET /api/stats/peak-hours
```

**Frontend Changes:**
```
apps/web/src/components/queue/QueueStats.tsx
- Fix avg wait time bug (filter to today)
- Add no-show count display
- Add check-in method breakdown

apps/web/src/components/queue/StatsHistory.tsx (new)
- Weekly trends chart
- Peak hours visualization
```

---

## Part 2: Admin Dashboard (Your View as SaaS Owner)

### Location
- **Route:** `/admin` (new protected route, only for super admin)
- **File:** `apps/web/src/pages/admin/Dashboard.tsx` (new)

### Business Metrics

| Metric | Formula | Alert Threshold |
|--------|---------|-----------------|
| **Active Clinics** | Clinics with login in past 30 days | N/A |
| **MRR** | Active clinics × 50 TND | Drop >10% |
| **Total Patients Today** | Sum across all clinics | N/A |
| **SMS Sent Today** | Count from notification service | >500/day (cost) |
| **Churn Risk** | Clinics with no login in 7+ days | >20% of base |
| **QR Adoption Rate** | QR check-ins / total check-ins | <30% (need training) |
| **Avg Queue Length** | Across all clinics | >20 (performance risk) |

### Clinic Health Table

| Column | Description |
|--------|-------------|
| Clinic Name | Doctor/clinic name |
| Last Active | Days since last login |
| Patients Today | Queue entries today |
| Avg Wait Time | Today's average |
| Status | 🟢 Active / 🟡 At Risk / 🔴 Churned |

### Implementation

**Database Changes:**
```prisma
# Add to schema.prisma

model AdminUser {
  id           String   @id @default(uuid())
  email        String   @unique
  passwordHash String
  role         String   @default("admin") // admin, super_admin
  createdAt    DateTime @default(now())
}

model ClinicActivity {
  id        String   @id @default(uuid())
  clinicId  String
  clinic    Clinic   @relation(fields: [clinicId], references: [id])
  action    String   // login, add_patient, call_next, etc.
  timestamp DateTime @default(now())

  @@index([clinicId, timestamp])
}
```

**Backend:**
```
apps/api/src/routes/admin.ts (new)
- GET /api/admin/metrics - Business metrics
- GET /api/admin/clinics - Clinic health list
- GET /api/admin/clinic/:id/activity - Activity timeline

apps/api/src/middleware/adminAuth.ts (new)
- Verify super_admin role
```

**Frontend:**
```
apps/web/src/pages/admin/Dashboard.tsx (new)
apps/web/src/pages/admin/ClinicDetail.tsx (new)
apps/web/src/components/admin/MetricsCards.tsx (new)
apps/web/src/components/admin/ClinicsTable.tsx (new)
apps/web/src/components/admin/ChurnRiskAlert.tsx (new)
```

---

## Part 3: Technical Monitoring (Prometheus + Grafana)

### Metrics to Expose

**API Metrics (via prom-client):**
```javascript
// HTTP metrics
http_request_duration_seconds{method, route, status_code}
http_requests_total{method, route, status_code}

// Business metrics
doctorq_active_connections{type} // websocket, http
doctorq_queue_entries_total{clinic_id, status}
doctorq_sms_sent_total{type, status}
doctorq_api_errors_total{route, error_type}

// Database metrics
doctorq_db_query_duration_seconds{query_type}
doctorq_db_pool_connections{state} // active, idle, waiting
```

**Socket.io Metrics:**
```javascript
doctorq_socket_connections_total
doctorq_socket_rooms_active{type} // clinic, patient
doctorq_socket_messages_total{event}
doctorq_socket_latency_seconds
```

### Implementation

**Backend:**
```
apps/api/src/lib/metrics.ts (new)
- Initialize prom-client
- Define custom metrics
- Export metrics middleware

apps/api/src/routes/metrics.ts (new)
- GET /metrics - Prometheus scrape endpoint
```

**Infrastructure:**
```yaml
# docker-compose.monitoring.yml (new in project root)
services:
  prometheus:
    image: prom/prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml

  grafana:
    image: grafana/grafana
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
```

### Grafana Dashboards

**Dashboard 1: API Health**
- Request rate (rpm)
- Error rate (%)
- Latency percentiles (p50, p95, p99)
- Active connections

**Dashboard 2: Business Overview**
- Active clinics gauge
- Patients per hour
- SMS sent per hour
- Queue lengths across clinics

**Dashboard 3: Real-Time Operations**
- Socket.io connections
- Message throughput
- Room occupancy

---

## Part 4: PostHog Event Tracking

### Events to Track

**Queue Events:**
```javascript
posthog.capture('patient_added', {
  clinicId,
  method: 'qr' | 'manual',
  queueLength,
  appointmentTime // if set
});

posthog.capture('patient_called', {
  clinicId,
  waitTimeMinutes,
  queuePosition
});

posthog.capture('patient_completed', {
  clinicId,
  totalWaitMinutes,
  consultationMinutes
});

posthog.capture('patient_no_show', {
  clinicId,
  waitedMinutes
});
```

**Clinic Events:**
```javascript
posthog.capture('clinic_login', {
  clinicId,
  platform: 'web' | 'mobile'
});

posthog.capture('doctor_presence_changed', {
  clinicId,
  isPresent: boolean
});

posthog.capture('sms_sent', {
  clinicId,
  type: 'queue_joined' | 'almost_turn' | 'your_turn',
  deliveryStatus
});
```

### Implementation

```
apps/api/src/lib/posthog.ts (new)
- PostHog client initialization
- Helper functions for event tracking

# Add to existing services:
apps/api/src/services/queueService.ts - Add tracking calls
apps/api/src/services/notificationService.ts - Add SMS tracking
```

---

## Part 5: Alert System

### Alert Rules

| Alert | Condition | Channel | Priority |
|-------|-----------|---------|----------|
| API Down | No requests for 5 min | Email + SMS | P0 |
| High Error Rate | >5% 5xx errors | Email | P1 |
| High Latency | p95 > 2s for 5 min | Email | P1 |
| SMS Delivery Failure | >10% failed | Email | P1 |
| Database Connection | Pool exhausted | Email + SMS | P0 |
| Clinic Churn Risk | No login 7 days | Email (weekly digest) | P2 |
| High Queue Length | >30 patients | Email to clinic | P2 |

### Implementation

**Option A: Grafana Alerting (Recommended for launch)**
- Use Grafana's built-in alerting
- Connect to email/Slack webhook

**Option B: Custom Alert Service (Post-launch)**
```
apps/api/src/services/alertService.ts (new)
- Check thresholds on schedule
- Send email via SendGrid/Resend
```

---

## Files to Create/Modify

### New Files

| File | Purpose |
|------|---------|
| `apps/api/src/routes/stats.ts` | Stats API endpoints |
| `apps/api/src/routes/admin.ts` | Admin dashboard API |
| `apps/api/src/routes/metrics.ts` | Prometheus metrics endpoint |
| `apps/api/src/lib/metrics.ts` | Prometheus metric definitions |
| `apps/api/src/lib/posthog.ts` | PostHog client |
| `apps/api/src/middleware/adminAuth.ts` | Admin route protection |
| `apps/web/src/pages/admin/Dashboard.tsx` | Admin dashboard page |
| `apps/web/src/pages/admin/ClinicDetail.tsx` | Individual clinic view |
| `apps/web/src/components/admin/MetricsCards.tsx` | KPI cards component |
| `apps/web/src/components/admin/ClinicsTable.tsx` | Clinic health table |
| `apps/web/src/components/queue/StatsHistory.tsx` | Historical stats for clinic |
| `docker-compose.monitoring.yml` | Prometheus + Grafana setup |
| `prometheus.yml` | Prometheus scrape config |
| `grafana/dashboards/*.json` | Pre-built Grafana dashboards |

### Files to Modify

| File | Changes |
|------|---------|
| `apps/api/prisma/schema.prisma` | Add AdminUser, ClinicActivity models |
| `apps/api/src/services/statsService.ts` | Fix today-only filtering, add weekly stats |
| `apps/api/src/services/queueService.ts` | Add PostHog event tracking |
| `apps/api/src/services/notificationService.ts` | Add SMS tracking |
| `apps/api/src/index.ts` | Add metrics middleware, new routes |
| `apps/web/src/components/queue/QueueStats.tsx` | Fix avg wait bug, add metrics |
| `apps/web/src/App.tsx` | Add admin routes |

---

## Implementation Phases

### Phase 1: Launch Ready (Jan 21-22) - 1 day
1. Fix avg wait time bug in QueueStats.tsx (filter to today)
2. Add no-show count to clinic dashboard
3. Add basic admin dashboard with MRR, active clinics
4. Set up Prometheus metrics endpoint
5. Deploy Grafana with basic API health dashboard

### Phase 2: Week 1 Post-Launch
1. Add PostHog event tracking
2. Implement churn risk alerts
3. Add clinic health table to admin dashboard
4. Create weekly stats endpoint for clinic owners

### Phase 3: Week 2-3 Post-Launch
1. Build historical trends charts
2. Add peak hours analysis
3. Implement SMS cost tracking
4. Create Grafana alerting rules

### Phase 4: Month 2
1. Add predictive churn model
2. Build cohort analysis
3. Implement custom alerts per clinic
4. Add export functionality for reports

---

## Verification Plan

### Testing Metrics Collection
```bash
# 1. Verify Prometheus metrics
curl http://localhost:3003/metrics

# 2. Check stats endpoint
curl -H "Authorization: Bearer $TOKEN" http://localhost:3003/api/stats/today

# 3. Verify admin endpoint
curl -H "Authorization: Bearer $ADMIN_TOKEN" http://localhost:3003/api/admin/metrics
```

### Testing Grafana
1. Open http://localhost:3000 (Grafana)
2. Import dashboard JSON
3. Verify data appears in panels
4. Test alert rules with fake data

### Testing PostHog
1. Check PostHog dashboard for events
2. Verify event properties are correct
3. Create a simple funnel (login → add patient → call next)

---

## Cost Estimates

| Service | Tier | Monthly Cost |
|---------|------|--------------|
| PostHog | Free (1M events) | $0 |
| Grafana Cloud | Free (3 users) | $0 |
| Railway (Prometheus) | Hobby | ~$5 |
| SendGrid (Alerts) | Free (100/day) | $0 |
| **Total** | | **~$5/month** |

---

## Quick Start Commands

```bash
# Start monitoring stack locally
docker-compose -f docker-compose.monitoring.yml up -d

# Access Grafana
open http://localhost:3000  # admin/admin

# Access Prometheus
open http://localhost:9090

# Check API metrics
curl http://localhost:3003/metrics
```

---

## Summary

This monitoring plan provides:

1. **For Dr. Kamoun (Clinic Owner)**
   - Real-time queue stats (fixed bugs)
   - Historical trends
   - Peak hours insights

2. **For You (SaaS Owner)**
   - MRR and active clinic tracking
   - Churn risk identification
   - SMS cost monitoring
   - Feature adoption metrics

3. **For Production Reliability**
   - API health monitoring
   - Error rate alerts
   - Database performance tracking
   - Real-time Socket.io metrics

**Launch Priority:** Phase 1 items are essential for Jan 21-22 launch. Phases 2-4 can be added incrementally as you onboard more clinics.
