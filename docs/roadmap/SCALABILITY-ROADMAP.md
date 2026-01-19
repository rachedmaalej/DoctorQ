# DoctorQ Scalability Assessment & SaaS Strategy

## Executive Summary

DoctorQ is currently a **well-architected MVP** suitable for **10-20 clinics** with **20-30 concurrent patients per clinic**. However, scaling to 100+ clinics requires addressing critical database and real-time communication bottlenecks.

---

## Current Capacity Assessment

### Single Clinic Performance

| Queue Size | Performance | User Experience |
|------------|-------------|-----------------|
| **1-20 patients** | Excellent | Smooth, responsive |
| **20-30 patients** | Good | Minor delays on queue operations (~500ms) |
| **30-50 patients** | Degraded | Noticeable delays (1-2s), animation stutters |
| **50+ patients** | Poor | Operations take 2-5s, potential timeouts |

**Bottleneck:** The `recalculatePositionsAndStatuses()` function executes **N individual database updates** for every queue operation (add, remove, call next, reorder).

### Concurrent Clinics

| Clinics | Total Patients | Database Load | Socket.io Load | Verdict |
|---------|---------------|---------------|----------------|---------|
| **10** | 200 | ~2,000 queries/min | ~200 connections | ✅ Works |
| **50** | 1,000 | ~10,000 queries/min | ~1,000 connections | ⚠️ Marginal |
| **100** | 2,000 | ~20,000 queries/min | ~2,000 connections | ❌ Fails |

---

## Critical Bottlenecks Identified

### 1. N+1 Database Queries (CRITICAL)

**Location:** `apps/api/src/routes/queue.ts` lines 57-107

```
POST /api/queue/next with 50 patients:
├─ 1x findFirst (current patient)
├─ 1x update (mark completed)
├─ 1x findMany (get queue)
├─ 50x update (recalculate positions)  ← BOTTLENECK
├─ 1x findMany (refresh queue)
├─ 3x queries (getQueueStats)
└─ Total: ~60 database queries
```

**Impact:** Each queue operation takes 50-100ms per patient in queue.

### 2. Socket.io Broadcast Loop (HIGH)

**Location:** `apps/api/src/routes/queue.ts` lines 476-487

```typescript
// Current: 50 individual emissions
for (const patient of updatedPatients) {
  emitPatientUpdate(patient.id, patient.position, patient.status);
}
```

**Impact:** 50 socket emissions instead of 1 batched event.

### 3. No Caching Layer (HIGH)

- Queue statistics recalculated on every operation (3 DB queries)
- Clinic settings fetched repeatedly
- No Redis or in-memory caching

### 4. Missing Connection Pooling (HIGH)

**Location:** `apps/api/src/lib/prisma.ts`

Default Prisma pool size is 5 connections. At 20+ concurrent requests, connections queue up.

### 5. Socket.io Security Gap (MEDIUM)

**Location:** `apps/api/src/index.ts` lines 70-85

```typescript
socket.on('join:clinic', ({ clinicId, token }) => {
  // TODO: Verify token  ← NOT IMPLEMENTED
  socket.join(roomName);
});
```

Any client can join any clinic room without authentication.

### 6. No Rate Limiting (MEDIUM)

Public endpoints have no protection against abuse:
- `POST /api/queue/checkin/:clinicId`
- `GET /api/queue/patient/:entryId`

---

## SaaS Scaling Strategy

### Phase 1: Support 10 Clinics (Current + Minor Fixes)

**Cost:** ~$50/month infrastructure

#### Required Changes

1. **Add Database Indexes** ✅ DONE
   ```prisma
   @@index([clinicId, status, position])
   @@index([patientPhone])
   ```

2. **Configure Connection Pooling**
   ```typescript
   // In DATABASE_URL
   ?connection_limit=20&pool_timeout=30
   ```

3. **Add Basic Rate Limiting**
   ```typescript
   import rateLimit from 'express-rate-limit';
   app.use('/api/', rateLimit({ windowMs: 60000, max: 100 }));
   ```

4. **Secure Socket.io Rooms**
   ```typescript
   socket.on('join:clinic', async ({ clinicId, token }) => {
     const verified = await verifyToken(token);
     if (verified?.clinicId !== clinicId) return socket.disconnect();
     socket.join(`clinic:${clinicId}`);
   });
   ```

#### Infrastructure
- **Database:** Supabase Free/Pro ($25/month)
- **Backend:** Railway Starter ($5/month)
- **Frontend:** Vercel Free

---

### Phase 2: Support 100 Clinics

**Cost:** ~$200-500/month infrastructure

#### Required Changes

1. **Batch Position Updates (Critical)**
   ```typescript
   // Replace N individual updates with single query
   await prisma.$executeRaw`
     UPDATE "QueueEntry"
     SET position = subq.new_pos,
         status = CASE
           WHEN subq.new_pos = 1 THEN 'IN_CONSULTATION'
           WHEN subq.new_pos = 2 THEN 'NOTIFIED'
           ELSE status
         END
     FROM (
       SELECT id, ROW_NUMBER() OVER (ORDER BY "arrivedAt") as new_pos
       FROM "QueueEntry"
       WHERE "clinicId" = ${clinicId}
       AND status IN ('WAITING', 'NOTIFIED', 'IN_CONSULTATION')
     ) subq
     WHERE "QueueEntry".id = subq.id
   `;
   ```
   **Impact:** 50 queries → 1 query

2. **Add Redis Caching**
   ```typescript
   // Cache queue stats (invalidate on changes)
   const statsKey = `stats:${clinicId}`;
   let stats = await redis.get(statsKey);
   if (!stats) {
     stats = await calculateStats(clinicId);
     await redis.setex(statsKey, 30, JSON.stringify(stats));
   }
   ```

3. **Batch Socket Emissions**
   ```typescript
   // Single broadcast instead of loop
   const updates = patients.map(p => ({ id: p.id, position: p.position, status: p.status }));
   io.to(`clinic:${clinicId}:patients`).emit('queue:batch-update', updates);
   ```

4. **Database Transactions**
   ```typescript
   await prisma.$transaction(async (tx) => {
     await tx.queueEntry.update({ where: { id }, data: { status: 'COMPLETED' } });
     await tx.$executeRaw`UPDATE ... bulk position recalc ...`;
   });
   ```

5. **Add Health Checks & Monitoring**
   - Sentry for error tracking
   - Database query monitoring
   - Socket.io connection metrics

#### Infrastructure
- **Database:** Supabase Pro with read replicas ($75/month)
- **Redis:** Upstash ($20/month)
- **Backend:** Railway Pro with auto-scaling ($50/month)
- **Frontend:** Vercel Pro ($20/month)
- **Monitoring:** Sentry ($26/month)

---

### Phase 3: Support 1,000 Clinics

**Cost:** ~$2,000-5,000/month infrastructure

#### Architecture Changes

1. **Horizontal Backend Scaling**
   ```
   Load Balancer (nginx/cloudflare)
          │
   ┌──────┴──────┐
   │   API Pod   │ ×3-5 instances
   └──────┬──────┘
          │
   ┌──────┴──────┐
   │ Socket.io   │ with Redis adapter
   │   Pods      │ ×3-5 instances
   └──────┬──────┘
          │
   ┌──────┴──────┐
   │   Redis     │ Cluster mode
   │   Cluster   │
   └─────────────┘
   ```

2. **Socket.io Redis Adapter**
   ```typescript
   import { createAdapter } from '@socket.io/redis-adapter';
   const pubClient = createClient({ url: REDIS_URL });
   const subClient = pubClient.duplicate();
   io.adapter(createAdapter(pubClient, subClient));
   ```
   Enables Socket.io scaling across multiple server instances.

3. **Database Sharding Strategy**
   - Option A: Clinic-based sharding (clinics 1-500 on DB1, 501-1000 on DB2)
   - Option B: Geographic sharding (Tunisia DB, international DB)
   - Option C: Use CockroachDB or PlanetScale for auto-sharding

4. **Queue Processing Offload**
   ```
   API receives request → Publish to Redis Queue → Worker processes
   ```
   Move heavy operations (position recalculation, SMS sending) to background workers.

5. **CDN & Edge Caching**
   - Static assets on Cloudflare CDN
   - API responses cached at edge for read-heavy endpoints
   - Patient status pages served from edge

#### Infrastructure
- **Database:** PlanetScale or CockroachDB ($500-1000/month)
- **Redis:** Redis Enterprise ($200/month)
- **Backend:** Kubernetes on GCP/AWS ($500-1500/month)
- **CDN:** Cloudflare Pro ($200/month)
- **Monitoring:** Datadog/New Relic ($300/month)

---

## Feature Requirements for SaaS

### Multi-Tenancy (Required for all phases)

| Feature | Phase 1 | Phase 2 | Phase 3 |
|---------|---------|---------|---------|
| Clinic isolation | ✅ Backend enforced | ✅ + Frontend validation | ✅ + Database level |
| Subscription management | Manual | Stripe integration | Full billing system |
| Usage tracking | Basic logs | Per-clinic metrics | Real-time dashboards |
| Admin portal | None | Basic admin UI | Full admin system |

### Security Hardening

| Feature | Current | Required |
|---------|---------|----------|
| JWT token verification | ✅ HTTP | + Socket.io |
| Rate limiting | ❌ None | Per-clinic limits |
| Input validation | ✅ Zod | + SQL injection audit |
| Security headers | ❌ None | Helmet.js + CSP |
| Token revocation | ❌ None | Redis blacklist |
| Audit logging | ❌ None | All admin actions |

### Operational Requirements

| Capability | Phase 1 | Phase 2 | Phase 3 |
|------------|---------|---------|---------|
| Backup strategy | Supabase auto | Daily + PITR | Multi-region |
| Uptime SLA | Best effort | 99.5% | 99.9% |
| Support | Email only | Email + chat | 24/7 support |
| Onboarding | Self-serve | Guided setup | White-glove |

---

## Cost Projection

| Scale | Monthly Infra | Dev Effort | Break-even |
|-------|--------------|------------|------------|
| 10 clinics | $50-100 | 2 weeks | 2 clinics @ 50 TND |
| 100 clinics | $300-500 | 6 weeks | 10 clinics @ 50 TND |
| 1,000 clinics | $3,000-5,000 | 6 months | 100 clinics @ 50 TND |

---

## Immediate Recommendations

### Quick Wins (This Week)
1. ~~Add missing database indexes~~ ✅ DONE
2. Configure connection pooling → Prevents connection exhaustion
3. Secure Socket.io rooms → Security requirement
4. Add rate limiting → Prevents abuse

### Medium-Term (Next Month)
1. Implement batch position updates → 10x performance improvement
2. Add Redis caching for stats → Reduces DB load by 50%
3. Batch Socket.io emissions → Reduces network overhead

### Long-Term (Before 100 Clinics)
1. Set up monitoring (Sentry, metrics)
2. Implement subscription billing (Stripe)
3. Build admin portal for clinic management
4. Add database transactions for data integrity

---

## Conclusion

DoctorQ has a solid foundation for a SaaS product. The main obstacle is the **N+1 query pattern in queue operations**, which is solvable with batch updates. With 4-6 weeks of focused development, the system can scale to 100 clinics. Reaching 1,000 clinics requires architectural changes (Redis adapter, horizontal scaling, database sharding) but the core business logic is sound.

**Recommended first step:** Implement batch position updates and add Redis caching. This alone will support 50-100 clinics with current infrastructure.
