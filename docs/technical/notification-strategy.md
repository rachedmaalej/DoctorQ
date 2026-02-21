# Patient Queue Notification Strategy

**Date:** February 2026
**Status:** Research & Recommendation
**Author:** Technical analysis for DoctorQ / BleSaf

---

## Executive Summary

**The problem:** When a patient's phone screen is off or the browser is backgrounded, our Socket.io + Web Audio notifications don't fire. This defeats the core value proposition — patients cannot walk away from the waiting room and be reliably alerted.

**The solution:** A **three-tier layered notification strategy** combining Web Push (free, good Android coverage), WhatsApp Business API (reliable phone-waking on all devices, low cost), and client-side enhancements (Screen Wake Lock, improved audio). No single technology solves this alone — the combination is what makes it robust.

### Recommended Priority Order

| Priority | Channel | Reliability | Cost | Effort | Timeline |
|----------|---------|-------------|------|--------|----------|
| **1st** | **Web Push (PWA)** | High (Android), Medium (iOS) | Free | 3-5 days | Week 1-2 |
| **2nd** | **WhatsApp Business API** | Excellent (all devices) | ~$0.01-0.03/msg | 5-7 days | Week 3-4 |
| **3rd** | **Screen Wake Lock** | Medium (foreground only) | Free | 1 day | Week 1 |
| Fallback | SMS (local provider) | Excellent | ~$0.02-0.03/msg | 2-3 days | Phase C |

**Why this order:** Web Push is free and covers ~75% of our Tunisian patients (Android). WhatsApp covers the rest with near-100% reliability on both platforms. Screen Wake Lock is a quick win for patients actively watching their screen.

---

## 1. Current System Analysis

### What We Have Today

| Component | Technology | File | Status |
|-----------|-----------|------|--------|
| Real-time updates | Socket.io | `apps/api/src/index.ts` (lines 58-414) | Working |
| Sound alerts | Web Audio API (4 tones) | `apps/web/src/lib/sounds.ts` | Foreground only |
| Vibration | `navigator.vibrate()` | `apps/web/src/pages/PatientStatusPage.tsx` | Android foreground only |
| Patient page | React SPA | `apps/web/src/pages/PatientStatusPage.tsx` | Working |
| Queue logic | Position + status engine | `apps/api/src/services/positionService.ts` | Working |
| Notification dispatch | Socket.io emit helpers | `apps/api/src/services/notificationService.ts` | Socket.io only |
| Service Worker | — | — | **NOT IMPLEMENTED** |
| PWA Manifest | — | — | **NOT IMPLEMENTED** |
| Push Notifications | — | — | **NOT IMPLEMENTED** |

### Existing Notification Flow

```
Queue Change (addPatient, callNext, removePatient, doctorToggle)
  → positionService.recalculatePositionsAndStatuses()
  → notificationService.emitQueueUpdate(clinicId)        → clinic dashboard
  → notificationService.emitAllPatientUpdates(clinicId)   → each patient room
    → Socket.io event: "patient:called" { position, status, estimatedWaitMins }
      → PatientStatusPage detects position change
        → Web Audio sound (based on position)
        → navigator.vibrate() pattern
        → Toast notification UI
```

### Why Current Approach Fails in Background

| Browser Behavior | Impact |
|-----------------|--------|
| JS throttled in background tabs (1 call/sec after ~30s) | Socket.io events delayed or missed |
| Web Audio API `AudioContext` suspended in background | No sound when screen off |
| `navigator.vibrate()` requires visible, active page | No vibration in background |
| iOS Safari suspends backgrounded tabs entirely | Complete notification failure |
| Mobile OS kills inactive browser processes | WebSocket connection drops |

---

## 2. Detailed Comparison of All Approaches

### 2.1 Web Push Notifications (via Service Workers + Push API)

**How it works:** Server sends a push message via FCM/APNs/Mozilla to the browser's push service. The service worker wakes up, receives the message, and calls `showNotification()` — which triggers an OS-level notification with sound, vibration, and lock-screen display.

| Criterion | Assessment |
|-----------|------------|
| **Reliability** | **Android: Excellent.** Works even when browser is closed. Uses FCM (same as native apps). **iOS: Good but conditional** — requires PWA installed to home screen (iOS 16.4+). |
| **Cross-platform** | Android Chrome ✅ Samsung Internet ✅ Firefox ✅ iOS Safari ✅ (PWA only) |
| **User friction** | Android: Single "Allow notifications?" prompt. iOS: Must "Add to Home Screen" first, THEN grant notification permission — 2-step flow. |
| **Cost** | **Free.** FCM, APNs, and Mozilla push services have no per-message charges. |
| **Implementation** | Medium. Need: manifest.json, service worker, VAPID keys, push subscription storage, `web-push` npm library on server. |
| **GDPR/RGPD** | Standard notification consent. No personal data sent through push service (payload is encrypted end-to-end). |
| **Medical context** | Professional. Looks like a native app notification. |

**Platform-Specific Details:**

| Feature | Android Chrome | iOS Safari (PWA) | iOS Safari (browser tab) |
|---------|---------------|-------------------|--------------------------|
| Push API available | ✅ | ✅ (16.4+) | ❌ **Not available** |
| Requires home screen install | No | **Yes** | N/A |
| Lock screen notifications | ✅ | ✅ | N/A |
| Sound | ✅ (system default) | ✅ (system default) | N/A |
| Vibration pattern control | ✅ (`vibrate` option) | ❌ (system default) | N/A |
| Custom notification sound | ❌ | ❌ | N/A |
| Badge on icon | ✅ | ✅ (Badging API) | N/A |
| Works when browser closed | ✅ | ✅ | N/A |
| Silent/data-only push | Limited | ❌ | N/A |
| Action buttons | ✅ (up to 2) | Limited | N/A |

**iOS Friction Analysis:**

The iOS "Add to Home Screen" requirement is the biggest obstacle. The patient flow would be:

1. Patient opens queue status page in Safari
2. We detect they're on iOS and NOT in standalone mode
3. Show a guided overlay: "Add this page to your Home Screen to receive notifications"
4. Patient taps Share → "Add to Home Screen" → "Add"
5. Patient opens the newly added PWA from home screen
6. We prompt: "Allow notifications?"
7. Patient taps "Allow"

This is 7 steps vs. 1 step on Android ("Allow notifications?"). For older, non-tech-savvy patients, this is significant friction. **This is why WhatsApp is essential as a complementary channel for iOS users.**

### 2.2 WhatsApp Business API (Cloud API)

**How it works:** Server sends a template message via Meta's Cloud API to the patient's WhatsApp. WhatsApp delivers it as a normal message, which triggers the phone's WhatsApp notification (sound, vibration, lock screen) regardless of what the patient is doing.

| Criterion | Assessment |
|-----------|------------|
| **Reliability** | **Excellent on all devices.** WhatsApp has system-level notification permissions. Messages arrive and alert even when phone is locked, in Do Not Disturb, etc. (unless WhatsApp is specifically silenced). |
| **Cross-platform** | iOS ✅ Android ✅ Feature phones ❌ |
| **User friction** | **Very low.** Patient just needs WhatsApp installed (60-70% Tunisia, 55-60% France). Opt-in checkbox at check-in. No additional app install. |
| **Cost** | ~$0.01/conversation (Tunisia utility), ~$0.02-0.035 (France). **Free if patient checked in via WhatsApp** (24-hour service window). |
| **Implementation** | Medium (5-7 days). REST API, template approval, webhook for incoming messages. |
| **GDPR/RGPD** | End-to-end encrypted. Requires explicit opt-in. Must provide opt-out ("reply STOP"). Meta DPA covers data processing. |
| **Medical context** | **Excellent.** WhatsApp is already used in healthcare in Tunisia. Patients trust it. Professional-looking template messages. |

**Pricing Model:**

| Scenario | Cost per notification |
|----------|----------------------|
| Patient checked in via WhatsApp (within 24h window) | **Free** (service conversation) |
| Template message to non-WhatsApp check-in patient (Tunisia) | ~$0.008-0.015 |
| Template message to non-WhatsApp check-in patient (France) | ~$0.02-0.035 |

**Monthly Cost Estimate (80 patients/day clinic):**

| Patient Type | % | Daily Count | Cost/Notification | Daily Cost |
|-------------|---|------------|-------------------|------------|
| WhatsApp check-in (free window) | 70% | 56 | $0.00 | $0.00 |
| QR/Manual check-in (template) | 20% | 16 | $0.01 | $0.16 |
| No WhatsApp (skip) | 10% | 8 | — | — |
| **Monthly total** | | | | **~$5/month** |

**Template Messages to Create:**

```
Template: queue_approaching (Utility, French)
"Bonjour {{1}}, votre tour approche au cabinet {{2}}. Position: #{{3}}.
Merci de vous présenter à l'accueil."

Template: queue_your_turn (Utility, French)
"{{1}}, c'est votre tour au cabinet {{2}} !
Présentez-vous maintenant à l'accueil."

Template: queue_approaching_ar (Utility, Arabic)
"مرحباً {{1}}، دورك يقترب في عيادة {{2}}. الموقع: #{{3}}.
يرجى التوجه إلى الاستقبال."

Template: queue_your_turn_ar (Utility, Arabic)
"{{1}}، حان دورك في عيادة {{2}}!
توجه الآن إلى الاستقبال."
```

### 2.3 SMS (Local Provider)

**How it works:** Server sends an SMS via a local Tunisian gateway (Ooredoo, Tunisie Telecom) or international provider (Twilio, Vonage). SMS arrives as a standard text message.

| Criterion | Assessment |
|-----------|------------|
| **Reliability** | **Excellent.** Works on every phone (including feature phones). Always wakes the device. 95-98% delivery rate domestically. |
| **Cross-platform** | Universal ✅ (even non-smartphones) |
| **User friction** | **Zero.** Phone number already collected at check-in. |
| **Cost** | Local TN provider: ~$0.02-0.03/SMS. Twilio: ~$0.05-0.065/SMS (Tunisia). France: ~$0.06-0.08/SMS. |
| **Implementation** | Low (2-3 days). Simple HTTP API call. |
| **GDPR/RGPD** | Requires consent. In France, CNIL lighter regime for transactional/service SMS. |
| **Medical context** | **Excellent.** Professional and familiar. |

**Why SMS was removed and when to reconsider:**

SMS was removed in Feb 2026 due to Twilio costs. However, with a **local Tunisian provider** (Ooredoo bulk SMS at 50-80 millimes/SMS ≈ $0.016-0.025), costs drop dramatically. SMS should be reconsidered as a **last-resort fallback** for patients without WhatsApp and who can't/won't enable Web Push.

**Cost comparison (80 patients/day):**

| Channel | Cost/message (Tunisia) | If 100% of patients | If 10% fallback only |
|---------|----------------------|---------------------|---------------------|
| Twilio SMS | $0.05 | $120/month | $12/month |
| Local SMS | $0.025 | $60/month | $6/month |
| WhatsApp | $0.01 | $24/month | $2.40/month |
| Web Push | $0.00 | $0/month | $0/month |

### 2.4 Screen Wake Lock API

**How it works:** Keeps the screen on while the patient has the queue status page open. Not a notification mechanism per se, but prevents the "screen off → missed update" scenario for patients actively watching.

| Criterion | Assessment |
|-----------|------------|
| **Reliability** | **Good for foreground use.** Auto-releases when page is backgrounded or phone locked by user. |
| **Cross-platform** | Chrome ✅ (84+) Firefox ✅ (126+) Safari/iOS ✅ (16.4+) |
| **User friction** | None (can be automatic) or one toggle ("Keep screen on"). |
| **Cost** | Free |
| **Implementation** | Very low (1 day, ~20 lines of code) |
| **Battery impact** | Significant. Screen-on is the #1 battery drain. Offer as opt-in with warning. |

### 2.5 Other Channels Evaluated

| Channel | Verdict | Reason |
|---------|---------|--------|
| **Telegram Bot** | ❌ Not recommended | Too low adoption in target demographic (10-15% Tunisia). High user friction (install app + find bot). Free API is attractive but user base isn't there. |
| **Automated Voice Call** | ❌ Not recommended | Disruptive (phone rings loudly in clinic). Patients may not answer unknown numbers. More expensive than SMS. Jarring in medical context. |
| **Email** | ❌ Not suitable | Not time-sensitive enough. Email push notifications are unreliable. Average open time is hours, not minutes. |
| **Native App (FCM/APNs)** | ❌ Violates constraints | Requires app store install. Contradicts "no app needed" value proposition. Maintenance burden for two platforms. |
| **Silent Audio Loop trick** | ❌ Anti-pattern | Unreliable on iOS. Battery drain. Browser vendors actively closing this loophole. Unprofessional (shows media indicator). |
| **Web Locks / Background Sync** | ❌ Cannot solve this | Web Locks don't prevent suspension. Background Sync is one-shot and Chrome-only. Periodic Background Sync has 12h+ minimum interval. |

---

## 3. Recommended Layered Strategy

### Tier 1: Zero Friction (No extra user action)

These work immediately when the patient opens their status page:

| Enhancement | What it does | Effort |
|------------|-------------|--------|
| **Screen Wake Lock** | Keeps screen on while status page is open (opt-in toggle) | 1 day |
| **Improved audio fallback** | Use `<audio>` element instead of Web Audio API for better background persistence | 0.5 day |
| **Visibility API handling** | Detect when page returns to foreground, re-sync queue position immediately via HTTP fetch | 0.5 day |
| **Socket.io reconnection** | Already implemented. Ensure pending events are replayed on reconnect. | Verify |

### Tier 2: Low Friction (Single permission grant)

Requires one user action — either tapping "Allow" on a notification prompt or checking an opt-in box:

| Enhancement | What it does | Effort |
|------------|-------------|--------|
| **Web Push Notifications** | OS-level notifications that work when browser is closed. Android: 1-tap permission. iOS: requires PWA install first. | 3-5 days |
| **WhatsApp notification opt-in** | Checkbox at check-in: "Notify me via WhatsApp when my turn approaches." Uses Cloud API template messages. | 5-7 days |

### Tier 3: High Value (Patient willing to invest)

For patients who install the PWA to their home screen:

| Enhancement | What it does | Effort |
|------------|-------------|--------|
| **Full PWA experience** | Home screen icon, splash screen, standalone mode, push notifications on iOS | Included in Web Push work |
| **Guided iOS install flow** | Animated overlay showing how to "Add to Home Screen" on Safari | 1-2 days |
| **App badge** | Show queue position as a badge on the PWA icon | 0.5 day |

---

## 4. Implementation Architecture

### 4.1 Web Push Architecture

```
┌──────────────────────────────────────────────────────────┐
│                    PATIENT'S PHONE                        │
│                                                          │
│  ┌─────────────┐    ┌──────────────┐                    │
│  │ Patient      │    │ Service      │                    │
│  │ Status Page  │───▸│ Worker (sw.js)│                    │
│  │ (React)      │    │              │                    │
│  └──────┬───────┘    └──────┬───────┘                    │
│         │                   │                            │
│         │ subscribe()       │ push event                 │
│         ▼                   │ → showNotification()       │
│  ┌─────────────┐           │                            │
│  │ PushManager  │           │                            │
│  │ .subscribe() │           │                            │
│  └──────┬───────┘           │                            │
│         │                   ▲                            │
└─────────┼───────────────────┼────────────────────────────┘
          │ subscription      │ push message
          │ {endpoint, keys}  │ (encrypted)
          ▼                   │
┌─────────────────────────────┼────────────────────────────┐
│              BLESAF API SERVER                            │
│                                                          │
│  ┌──────────────┐    ┌──────────────┐                    │
│  │ POST         │    │ web-push     │                    │
│  │ /api/push/   │    │ library      │────────────────┐   │
│  │ subscribe    │    │ .sendNotif() │                │   │
│  └──────┬───────┘    └──────▲───────┘                │   │
│         │                   │                        │   │
│         ▼                   │                        │   │
│  ┌──────────────┐    ┌──────┴───────┐                │   │
│  │ Prisma DB    │    │ notification │                │   │
│  │ PushSub      │───▸│ Service      │                │   │
│  │ model        │    │ (enhanced)   │                │   │
│  └──────────────┘    └──────▲───────┘                │   │
│                             │                        │   │
│                      ┌──────┴───────┐                │   │
│                      │ Queue Change │                │   │
│                      │ (callNext,   │                │   │
│                      │  removeEntry)│                │   │
│                      └──────────────┘                │   │
└──────────────────────────────┬───────────────────────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │ Push Service        │
                    │ (FCM / APNs /       │
                    │  Mozilla Push)      │
                    │                     │
                    │ Delivers to phone   │
                    │ even when browser   │
                    │ is closed           │
                    └─────────────────────┘
```

### 4.2 WhatsApp Notification Architecture

```
┌───────────────────────────────────────────────────────────┐
│                    BLESAF API SERVER                       │
│                                                           │
│  Queue Change Event                                       │
│       │                                                   │
│       ▼                                                   │
│  ┌─────────────────┐                                      │
│  │ notificationSvc  │                                      │
│  │ .notifyPatient() │                                      │
│  └────┬────┬────┬───┘                                      │
│       │    │    │                                          │
│   ┌───┘    │    └───┐                                     │
│   ▼        ▼        ▼                                     │
│ Socket.io  Web     WhatsApp                               │
│ (existing) Push    Cloud API                              │
│            │        │                                     │
│            │        ▼                                     │
│            │  ┌────────────────┐                           │
│            │  │ Check:          │                           │
│            │  │ 1. whatsappOptIn│                           │
│            │  │ 2. Has WA number│                           │
│            │  │ 3. Not already  │                           │
│            │  │    notified     │                           │
│            │  └───────┬────────┘                           │
│            │          │                                   │
│            │          ▼                                   │
│            │  ┌────────────────┐     ┌──────────────────┐ │
│            │  │ In WA 24h      │ YES │ Send free-form   │ │
│            │  │ window?        ├────▸│ message           │ │
│            │  └───────┬────────┘     └──────────────────┘ │
│            │       NO │                                   │
│            │          ▼                                   │
│            │  ┌────────────────┐                           │
│            │  │ Send template  │                           │
│            │  │ message (~$0.01)│                           │
│            │  └────────────────┘                           │
└────────────┼──────────────────────────────────────────────┘
             │
             ▼
     ┌───────────────┐        ┌───────────────┐
     │ Push Service   │        │ WhatsApp      │
     │ (FCM/APNs)     │        │ (Meta Cloud)  │
     └───────┬───────┘        └───────┬───────┘
             │                        │
             ▼                        ▼
     ┌────────────────────────────────────────┐
     │           PATIENT'S PHONE              │
     │                                        │
     │  OS Notification     WhatsApp Message  │
     │  (from browser)      (sound + vibrate) │
     │  🔔 "Your turn       💬 "Votre tour   │
     │   is approaching"     approche..."     │
     └────────────────────────────────────────┘
```

### 4.3 Combined Notification Decision Flow

```
Patient Queue Position Changes to NOTIFIED (position ≤ 2)
    │
    ├─► Socket.io emit "patient:called" (ALWAYS — existing behavior)
    │
    ├─► Has push subscription?
    │     YES → web-push.sendNotification(subscription, payload)
    │     NO  → skip
    │
    └─► WhatsApp opt-in AND has phone number?
          YES → Check if already sent WA notification for this entry
                  NO  → Send WhatsApp template/session message
                  YES → Skip (avoid duplicate)
          NO  → skip
```

### 4.4 Key Technical Decisions

**When to send push/WhatsApp notifications:**

| Queue Event | Socket.io | Web Push | WhatsApp |
|-------------|-----------|----------|----------|
| Position improved (> 3 ahead) | ✅ | ❌ (too noisy) | ❌ |
| Position = 3 (approaching) | ✅ | ✅ | ❌ |
| Position ≤ 2 (NOTIFIED status) | ✅ | ✅ | ✅ (first time only) |
| IN_CONSULTATION (called in) | ✅ | ✅ | ✅ (if not sent at NOTIFIED) |

**Rationale:** Push/WhatsApp are "interruptive" channels. We should only use them when the patient genuinely needs to act (come to the desk). Position 3 is an early heads-up via push; WhatsApp fires at position ≤ 2 when it's truly their turn.

---

## 5. Implementation Roadmap

### Phase 1: Quick Wins (Week 1 — 2 days)

**Screen Wake Lock + Visibility improvements**

Files to modify:
- `apps/web/src/pages/PatientStatusPage.tsx` — Add wake lock + visibility re-sync
- `apps/web/src/lib/sounds.ts` — Add `<audio>` element fallback alongside Web Audio

New code:
```typescript
// Screen Wake Lock (PatientStatusPage.tsx)
useEffect(() => {
  let wakeLock: WakeLockSentinel | null = null;

  const requestWakeLock = async () => {
    if ('wakeLock' in navigator) {
      try { wakeLock = await navigator.wakeLock.request('screen'); }
      catch { /* user denied or low battery */ }
    }
  };

  // Re-acquire on visibility change (auto-released when tab hidden)
  const handleVisibility = () => {
    if (document.visibilityState === 'visible') {
      requestWakeLock();
      // Also re-fetch queue position in case we missed Socket.io events
      refetchPatientStatus();
    }
  };

  document.addEventListener('visibilitychange', handleVisibility);
  requestWakeLock();

  return () => {
    document.removeEventListener('visibilitychange', handleVisibility);
    wakeLock?.release();
  };
}, []);
```

### Phase 2: Web Push (Weeks 1-2 — 3-5 days)

**New files to create:**
- `apps/web/public/manifest.webmanifest` — PWA manifest
- `apps/web/public/sw.js` — Service worker for push handling
- `apps/web/src/lib/pushNotifications.ts` — Client-side push subscription logic
- `apps/api/src/lib/webpush.ts` — Server-side web-push integration
- `apps/api/src/routes/push.ts` — Push subscription API endpoint

**Files to modify:**
- `apps/api/prisma/schema.prisma` — Add `PushSubscription` model
- `apps/api/src/services/notificationService.ts` — Add push notification dispatch
- `apps/web/src/pages/PatientStatusPage.tsx` — Add push permission prompt
- `apps/web/index.html` — Link manifest

**Schema addition:**
```prisma
model PushSubscription {
  id        String   @id @default(cuid())
  entryId   String   // Links to QueueEntry
  endpoint  String
  p256dh    String   // Push encryption key
  auth      String   // Push auth secret
  createdAt DateTime @default(now())

  entry     QueueEntry @relation(fields: [entryId], references: [id], onDelete: Cascade)

  @@index([entryId])
}
```

**Environment variables to add:**
```env
VAPID_PUBLIC_KEY=     # Generate once with: npx web-push generate-vapid-keys
VAPID_PRIVATE_KEY=    # Keep secret
VAPID_SUBJECT=mailto:admin@blesaf.tn
```

**NPM dependency:**
```bash
cd apps/api && pnpm add web-push
cd apps/api && pnpm add -D @types/web-push
```

### Phase 3: WhatsApp Business API (Weeks 3-4 — 5-7 days)

**Prerequisites (non-code, 3-7 days):**
1. Create Meta Business account and verify business
2. Register a dedicated WhatsApp Business phone number
3. Submit template messages for approval (typically approved within 1-24 hours)
4. Obtain permanent access token (System User token)

**New files to create:**
- `apps/api/src/lib/whatsapp.ts` — WhatsApp Cloud API client
- `apps/api/src/routes/whatsapp.ts` — Webhook for incoming messages + delivery receipts

**Files to modify:**
- `apps/api/prisma/schema.prisma` — Add `whatsappOptIn`, `whatsappNotifiedAt` to QueueEntry
- `apps/api/src/services/notificationService.ts` — Add WhatsApp dispatch
- `apps/web/src/pages/PatientCheckInPage.tsx` — Add WhatsApp opt-in checkbox
- `apps/web/src/i18n/locales/fr.json` — Translation keys for WhatsApp opt-in
- `apps/web/src/i18n/locales/ar.json` — Arabic translation keys

**Environment variables to add:**
```env
WHATSAPP_PHONE_NUMBER_ID=   # From Meta Business dashboard
WHATSAPP_ACCESS_TOKEN=       # System User permanent token
WHATSAPP_VERIFY_TOKEN=       # Webhook verification token (you define this)
```

**Server-side WhatsApp client:**
```typescript
// apps/api/src/lib/whatsapp.ts
const GRAPH_API = 'https://graph.facebook.com/v19.0';

export async function sendWhatsAppTemplate(
  to: string,           // +216XXXXXXXX
  templateName: string, // 'queue_your_turn'
  language: string,     // 'fr' or 'ar'
  parameters: string[]  // ['Patient Name', 'Clinic Name', '2']
) {
  const response = await fetch(
    `${GRAPH_API}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: to.replace('+', ''),
        type: 'template',
        template: {
          name: templateName,
          language: { code: language },
          components: [{
            type: 'body',
            parameters: parameters.map(text => ({ type: 'text', text })),
          }],
        },
      }),
    }
  );
  return response.json();
}
```

### Phase 4: SMS Fallback (Phase C — 2-3 days)

Only implement if metrics show significant patient population without WhatsApp. Use a local Tunisian SMS aggregator for domestic rates (~$0.02-0.03/SMS).

---

## 6. Known Limitations and Risks

### Web Push Limitations

| Risk | Severity | Mitigation |
|------|----------|------------|
| iOS requires PWA install to home screen | **High** (affects ~25% of TN users, ~50% of FR users) | Guided install overlay + WhatsApp as fallback |
| Patient denies notification permission (can't re-prompt) | **Medium** | "Soft ask" pattern — show custom UI first, only call browser API after user clicks "Yes" |
| Push subscription can expire | **Low** | Re-subscribe on each page visit; check `expirationTime` |
| Browser closed + service worker killed by OS | **Low** (rare on Android, possible on iOS) | WhatsApp fallback |
| Apple may change PWA push behavior | **Low** | Monitor WebKit blog; WhatsApp unaffected |

### WhatsApp Limitations

| Risk | Severity | Mitigation |
|------|----------|------------|
| Meta Business verification takes time | **Medium** | Start process early (Phase 2 prep during Phase 1) |
| Template rejection | **Low** | Queue notifications are textbook "utility" — historically high approval rate |
| Patient doesn't have WhatsApp | **Low** in Tunisia (60-70% penetration) | Web Push primary; SMS fallback in Phase 4 |
| WhatsApp pricing changes | **Low** | Current costs are minimal (~$5/clinic/month); monitor quarterly |
| 24-hour window expiry for non-template messages | **Low** | Always use template messages for queue notifications (works anytime) |

### General Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| Notification fatigue (too many alerts) | **Medium** | Only notify at position ≤ 3 (push) and ≤ 2 (WhatsApp). Max 2-3 notifications per patient visit. |
| Duplicate notifications (push + WhatsApp at same time) | **Low** | Intentional — redundancy increases reliability. Different urgency levels. |
| Patient phone on Do Not Disturb | **Low** | Out of our control; clinic can call patient's name on lobby display as final fallback |
| GDPR complaint about unsolicited notifications | **Low** | Explicit opt-in at check-in; easy opt-out; data deleted daily (midnight cron) |

---

## 7. Competitor Benchmarks

The industry standard for queue management notification is clear:

| Competitor | Primary Channel | Secondary | Requires App? |
|-----------|----------------|-----------|--------------|
| **Waitwhile** | SMS | Email, Web Push | No (web-based) |
| **Qminder** | SMS | Display boards | No |
| **QLess** | SMS + Automated call | Push (native app) | Optional app |
| **Qmatic** | SMS | Display boards, native app | Optional app |
| **Yelp Waitlist** | Push (native app) | SMS | Yes (Yelp app) |
| **OpenTable** | Push (native app) | SMS | Yes (app) |

**Key insight:** Every major competitor uses **SMS as the primary notification channel**. Our approach of Web Push + WhatsApp is actually more modern and cost-effective, though it trades some universality (no feature phone support) for dramatically lower per-message cost.

**Our advantage:** By combining Web Push (free) + WhatsApp (near-free for WA check-in patients), we achieve comparable or better notification reliability at a fraction of the SMS cost that competitors incur.

---

## 8. Metrics to Track

Once implemented, track these to measure effectiveness:

| Metric | How to measure | Target |
|--------|---------------|--------|
| Push permission grant rate | Granted / Prompted | > 60% (Android), > 20% (iOS) |
| WhatsApp opt-in rate | Opted in / Total check-ins | > 50% |
| Notification delivery rate | Delivered / Sent (push + WA) | > 95% |
| No-show rate (before vs. after) | NO_SHOW entries / Total | Decrease by 30%+ |
| Average time from NOTIFIED → IN_CONSULTATION | Timestamp delta | Decrease (patients arrive faster) |
| PWA install rate (iOS) | Standalone mode detections | Track for optimization |
| Patient satisfaction | Post-visit survey (future) | Baseline then improve |

---

## Appendix A: Environment Variables Summary

```env
# Web Push (Phase 2)
VAPID_PUBLIC_KEY=BEl62iUYgU...
VAPID_PRIVATE_KEY=Dl2x7...
VAPID_SUBJECT=mailto:admin@blesaf.tn

# WhatsApp Business API (Phase 3)
WHATSAPP_PHONE_NUMBER_ID=123456789
WHATSAPP_ACCESS_TOKEN=EAAx...
WHATSAPP_VERIFY_TOKEN=my_custom_verify_token

# SMS - Local Provider (Phase 4, if needed)
SMS_PROVIDER_API_KEY=
SMS_PROVIDER_API_URL=
SMS_SENDER_ID=BleSaf
```

## Appendix B: PWA Manifest Template

```json
{
  "name": "BleSaf - File d'attente",
  "short_name": "BleSaf",
  "description": "Suivez votre position dans la file d'attente",
  "start_url": "/patient/status",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#2563eb",
  "orientation": "portrait",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" },
    { "src": "/icons/icon-maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
```

## Appendix C: Service Worker Template

```javascript
// sw.js — minimal push notification service worker
self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {};

  const options = {
    body: data.body || 'Votre tour approche !',
    icon: '/icons/icon-192.png',
    badge: '/icons/badge-72.png',
    tag: data.tag || 'queue-update',      // Replace previous notification
    renotify: true,                        // Vibrate even if replacing
    vibrate: [200, 100, 200, 100, 400],   // Android only
    data: { url: data.url || '/' },
    actions: [
      { action: 'open', title: 'Voir ma position' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(
      data.title || 'BleSaf',
      options
    )
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const url = event.notification.data?.url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((windowClients) => {
      // Focus existing tab if open
      for (const client of windowClients) {
        if (client.url.includes('/patient/') && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise open new tab
      return clients.openWindow(url);
    })
  );
});
```
