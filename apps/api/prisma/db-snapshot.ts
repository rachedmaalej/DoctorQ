/**
 * Database Snapshot & Diff Tool
 *
 * Takes a snapshot of all database records and saves to JSON.
 * When a previous snapshot exists, generates a diff report.
 *
 * Usage:
 *   npx tsx prisma/db-snapshot.ts              # Take snapshot + diff against previous
 *   npx tsx prisma/db-snapshot.ts --snapshot    # Take snapshot only (no diff)
 *   npx tsx prisma/db-snapshot.ts --diff        # Diff last two snapshots (no new snapshot)
 *   npx tsx prisma/db-snapshot.ts --list        # List all snapshots
 *   npx tsx prisma/db-snapshot.ts --clean       # Keep only last 10 snapshots
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const prisma = new PrismaClient();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SNAPSHOT_DIR = path.join(__dirname, '..', '..', '..', 'snapshots');

// ─── Types ──────────────────────────────────────────────────────────────────

interface ClinicSnapshot {
  id: string;
  name: string;
  email: string;
  doctorName: string | null;
  phone: string | null;
  country: string;
  specialty: string | null;
  isActive: boolean;
  subscriptionStatus: string;
  subscriptionPlan: string | null;
  trialEndsAt: string | null;
  subscriptionEndsAt: string | null;
  emailVerified: boolean;
  onboardingCompleted: boolean;
  onboardingStep: number;
  isDoctorPresent: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

interface DoctorSnapshot {
  id: string;
  clinicId: string;
  name: string;
  specialty: string | null;
  isActive: boolean;
}

interface QueueSummary {
  clinicId: string;
  clinicName: string;
  WAITING: number;
  NOTIFIED: number;
  IN_CONSULTATION: number;
  COMPLETED: number;
  NO_SHOW: number;
  CANCELLED: number;
  total: number;
}

interface DailyStatSnapshot {
  clinicId: string;
  date: string;
  totalPatients: number;
  avgWaitMins: number | null;
  noShows: number;
}

interface PaymentSnapshot {
  id: string;
  clinicId: string;
  amount: number;
  month: string;
  method: string;
  status: string;
  paidAt: string;
}

interface EventSnapshot {
  id: string;
  clinicId: string;
  eventType: string;
  amount: number | null;
  createdAt: string;
}

interface DbSnapshot {
  timestamp: string;
  counts: {
    clinics: number;
    doctors: number;
    queueEntries: number;
    dailyStats: number;
    paymentRecords: number;
    subscriptionEvents: number;
  };
  clinics: ClinicSnapshot[];
  doctors: DoctorSnapshot[];
  queueByClinic: QueueSummary[];
  recentDailyStats: DailyStatSnapshot[];
  paymentRecords: PaymentSnapshot[];
  subscriptionEvents: EventSnapshot[];
}

// ─── Snapshot ───────────────────────────────────────────────────────────────

async function takeSnapshot(): Promise<DbSnapshot> {
  const [clinics, doctors, queueEntries, dailyStats, payments, events] =
    await Promise.all([
      prisma.clinic.findMany({
        orderBy: { createdAt: 'asc' },
        select: {
          id: true,
          name: true,
          email: true,
          doctorName: true,
          phone: true,
          country: true,
          specialty: true,
          isActive: true,
          subscriptionStatus: true,
          subscriptionPlan: true,
          trialEndsAt: true,
          subscriptionEndsAt: true,
          emailVerified: true,
          onboardingCompleted: true,
          onboardingStep: true,
          isDoctorPresent: true,
          lastLoginAt: true,
          createdAt: true,
        },
      }),
      prisma.doctor.findMany({
        orderBy: { createdAt: 'asc' },
        select: {
          id: true,
          clinicId: true,
          name: true,
          specialty: true,
          isActive: true,
        },
      }),
      prisma.queueEntry.groupBy({
        by: ['clinicId', 'status'],
        _count: true,
      }),
      prisma.dailyStat.findMany({
        orderBy: { date: 'desc' },
        take: 100,
        select: {
          clinicId: true,
          date: true,
          totalPatients: true,
          avgWaitMins: true,
          noShows: true,
        },
      }),
      prisma.paymentRecord.findMany({
        orderBy: { paidAt: 'desc' },
        select: {
          id: true,
          clinicId: true,
          amount: true,
          month: true,
          method: true,
          status: true,
          paidAt: true,
        },
      }),
      prisma.subscriptionEvent.findMany({
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          clinicId: true,
          eventType: true,
          amount: true,
          createdAt: true,
        },
      }),
    ]);

  // Build clinic ID → name map
  const clinicMap = new Map(clinics.map((c) => [c.id, c.name]));

  // Build queue summary by clinic
  const queueMap = new Map<string, QueueSummary>();
  for (const c of clinics) {
    queueMap.set(c.id, {
      clinicId: c.id,
      clinicName: c.name,
      WAITING: 0,
      NOTIFIED: 0,
      IN_CONSULTATION: 0,
      COMPLETED: 0,
      NO_SHOW: 0,
      CANCELLED: 0,
      total: 0,
    });
  }
  for (const entry of queueEntries) {
    const summary = queueMap.get(entry.clinicId);
    if (summary) {
      const status = entry.status as keyof Omit<QueueSummary, 'clinicId' | 'clinicName' | 'total'>;
      if (status in summary) {
        (summary as Record<string, number>)[status] = entry._count;
        summary.total += entry._count;
      }
    }
  }

  const serialize = (d: Date | null) => (d ? d.toISOString() : null);

  return {
    timestamp: new Date().toISOString(),
    counts: {
      clinics: clinics.length,
      doctors: doctors.length,
      queueEntries: queueEntries.reduce((sum, e) => sum + e._count, 0),
      dailyStats: dailyStats.length,
      paymentRecords: payments.length,
      subscriptionEvents: events.length,
    },
    clinics: clinics.map((c) => ({
      ...c,
      subscriptionStatus: String(c.subscriptionStatus),
      subscriptionPlan: c.subscriptionPlan ? String(c.subscriptionPlan) : null,
      trialEndsAt: serialize(c.trialEndsAt),
      subscriptionEndsAt: serialize(c.subscriptionEndsAt),
      lastLoginAt: serialize(c.lastLoginAt),
      createdAt: c.createdAt.toISOString(),
    })),
    doctors: doctors.map((d) => ({ ...d })),
    queueByClinic: Array.from(queueMap.values()).filter((q) => q.total > 0),
    recentDailyStats: dailyStats.map((s) => ({
      ...s,
      date: s.date.toISOString().split('T')[0],
    })),
    paymentRecords: payments.map((p) => ({
      ...p,
      month: p.month.toISOString().split('T')[0],
      paidAt: p.paidAt.toISOString(),
    })),
    subscriptionEvents: events.map((e) => ({
      ...e,
      createdAt: e.createdAt.toISOString(),
    })),
  };
}

function saveSnapshot(snapshot: DbSnapshot): string {
  if (!fs.existsSync(SNAPSHOT_DIR)) {
    fs.mkdirSync(SNAPSHOT_DIR, { recursive: true });
  }

  const ts = snapshot.timestamp.replace(/[:.]/g, '-').slice(0, 19);
  const filename = `snapshot-${ts}.json`;
  const filepath = path.join(SNAPSHOT_DIR, filename);

  fs.writeFileSync(filepath, JSON.stringify(snapshot, null, 2));
  return filepath;
}

// ─── Diff ───────────────────────────────────────────────────────────────────

function diffSnapshots(before: DbSnapshot, after: DbSnapshot): string {
  const lines: string[] = [];
  const hr = '─'.repeat(60);

  lines.push(`# Database Diff Report`);
  lines.push(`**Before:** ${before.timestamp}`);
  lines.push(`**After:**  ${after.timestamp}`);
  lines.push('');

  // ── Count changes ─────────────────────────────────────────────────────
  lines.push(`## Record Counts`);
  lines.push('');
  lines.push('| Table | Before | After | Change |');
  lines.push('|-------|--------|-------|--------|');

  for (const key of Object.keys(before.counts) as (keyof DbSnapshot['counts'])[]) {
    const b = before.counts[key];
    const a = after.counts[key];
    const diff = a - b;
    const sign = diff > 0 ? `+${diff}` : diff < 0 ? `${diff}` : '—';
    const flag = diff !== 0 ? ' ⚠️' : '';
    lines.push(`| ${key} | ${b} | ${a} | ${sign}${flag} |`);
  }
  lines.push('');

  // ── Clinic changes ────────────────────────────────────────────────────
  const beforeClinicMap = new Map(before.clinics.map((c) => [c.id, c]));
  const afterClinicMap = new Map(after.clinics.map((c) => [c.id, c]));

  const addedClinics = after.clinics.filter((c) => !beforeClinicMap.has(c.id));
  const removedClinics = before.clinics.filter((c) => !afterClinicMap.has(c.id));
  const commonIds = before.clinics
    .filter((c) => afterClinicMap.has(c.id))
    .map((c) => c.id);

  if (addedClinics.length || removedClinics.length) {
    lines.push(`## Clinic Changes`);
    lines.push('');

    for (const c of addedClinics) {
      lines.push(`### ➕ ADDED: ${c.name}`);
      lines.push(`- Email: ${c.email}`);
      lines.push(`- Country: ${c.country}`);
      lines.push(`- Status: ${c.subscriptionStatus}`);
      lines.push(`- Created: ${c.createdAt}`);
      lines.push('');
    }

    for (const c of removedClinics) {
      lines.push(`### ❌ REMOVED: ${c.name}`);
      lines.push(`- Email: ${c.email}`);
      lines.push(`- Country: ${c.country}`);
      lines.push(`- Status: ${c.subscriptionStatus}`);
      lines.push('');
    }
  }

  // ── Field-level changes on existing clinics ───────────────────────────
  const TRACKED_FIELDS: (keyof ClinicSnapshot)[] = [
    'name',
    'isActive',
    'subscriptionStatus',
    'subscriptionPlan',
    'trialEndsAt',
    'subscriptionEndsAt',
    'emailVerified',
    'onboardingCompleted',
    'onboardingStep',
    'isDoctorPresent',
    'lastLoginAt',
  ];

  const clinicFieldChanges: string[] = [];
  for (const id of commonIds) {
    const b = beforeClinicMap.get(id)!;
    const a = afterClinicMap.get(id)!;

    const changes: string[] = [];
    for (const field of TRACKED_FIELDS) {
      const bv = JSON.stringify(b[field]);
      const av = JSON.stringify(a[field]);
      if (bv !== av) {
        changes.push(`  - **${field}**: \`${bv}\` → \`${av}\``);
      }
    }

    if (changes.length) {
      clinicFieldChanges.push(`### 📝 ${b.name} (${b.email})`);
      clinicFieldChanges.push(...changes);
      clinicFieldChanges.push('');
    }
  }

  if (clinicFieldChanges.length) {
    lines.push(`## Clinic Field Updates`);
    lines.push('');
    lines.push(...clinicFieldChanges);
  }

  // ── Doctor changes ────────────────────────────────────────────────────
  const beforeDoctorIds = new Set(before.doctors.map((d) => d.id));
  const afterDoctorIds = new Set(after.doctors.map((d) => d.id));

  const addedDoctors = after.doctors.filter((d) => !beforeDoctorIds.has(d.id));
  const removedDoctors = before.doctors.filter((d) => !afterDoctorIds.has(d.id));

  if (addedDoctors.length || removedDoctors.length) {
    lines.push(`## Doctor Changes`);
    lines.push('');
    for (const d of addedDoctors) {
      const clinic = afterClinicMap.get(d.clinicId);
      lines.push(`- ➕ **${d.name}** added to ${clinic?.name || d.clinicId}`);
    }
    for (const d of removedDoctors) {
      const clinic = beforeClinicMap.get(d.clinicId);
      lines.push(`- ❌ **${d.name}** removed from ${clinic?.name || d.clinicId}`);
    }
    lines.push('');
  }

  // ── Queue changes ─────────────────────────────────────────────────────
  const beforeQueueMap = new Map(before.queueByClinic.map((q) => [q.clinicId, q]));
  const afterQueueMap = new Map(after.queueByClinic.map((q) => [q.clinicId, q]));

  const allQueueClinicIds = new Set([
    ...before.queueByClinic.map((q) => q.clinicId),
    ...after.queueByClinic.map((q) => q.clinicId),
  ]);

  const queueChanges: string[] = [];
  for (const cid of allQueueClinicIds) {
    const b = beforeQueueMap.get(cid);
    const a = afterQueueMap.get(cid);
    const clinicName =
      afterClinicMap.get(cid)?.name || beforeClinicMap.get(cid)?.name || cid;

    const bTotal = b?.total || 0;
    const aTotal = a?.total || 0;

    if (bTotal !== aTotal) {
      const statuses = ['WAITING', 'NOTIFIED', 'IN_CONSULTATION', 'COMPLETED', 'NO_SHOW', 'CANCELLED'] as const;
      const details = statuses
        .map((s) => {
          const bv = (b as Record<string, number> | undefined)?.[s] || 0;
          const av = (a as Record<string, number> | undefined)?.[s] || 0;
          if (bv !== av) return `${s}: ${bv}→${av}`;
          return null;
        })
        .filter(Boolean);

      queueChanges.push(
        `- **${clinicName}**: ${bTotal}→${aTotal} total (${details.join(', ')})`
      );
    }
  }

  if (queueChanges.length) {
    lines.push(`## Queue Changes`);
    lines.push('');
    lines.push(...queueChanges);
    lines.push('');
  }

  // ── DailyStat changes ─────────────────────────────────────────────────
  const beforeStatKeys = new Set(
    before.recentDailyStats.map((s) => `${s.clinicId}|${s.date}`)
  );
  const newStats = after.recentDailyStats.filter(
    (s) => !beforeStatKeys.has(`${s.clinicId}|${s.date}`)
  );

  if (newStats.length) {
    lines.push(`## New DailyStats`);
    lines.push('');
    for (const s of newStats) {
      const clinicName = afterClinicMap.get(s.clinicId)?.name || s.clinicId;
      lines.push(
        `- **${clinicName}** (${s.date}): ${s.totalPatients} patients, avg wait ${s.avgWaitMins ?? '?'}min, ${s.noShows} no-shows`
      );
    }
    lines.push('');
  }

  // ── Payment changes ───────────────────────────────────────────────────
  const beforePayIds = new Set(before.paymentRecords.map((p) => p.id));
  const newPayments = after.paymentRecords.filter((p) => !beforePayIds.has(p.id));

  if (newPayments.length) {
    lines.push(`## New Payments`);
    lines.push('');
    for (const p of newPayments) {
      const clinicName = afterClinicMap.get(p.clinicId)?.name || p.clinicId;
      lines.push(
        `- **${clinicName}**: ${p.amount} (${p.method}, ${p.status}) for ${p.month}`
      );
    }
    lines.push('');
  }

  // ── Subscription event changes ────────────────────────────────────────
  const beforeEventIds = new Set(before.subscriptionEvents.map((e) => e.id));
  const newEvents = after.subscriptionEvents.filter(
    (e) => !beforeEventIds.has(e.id)
  );

  if (newEvents.length) {
    lines.push(`## New Subscription Events`);
    lines.push('');
    for (const e of newEvents) {
      const clinicName = afterClinicMap.get(e.clinicId)?.name || e.clinicId;
      lines.push(`- **${clinicName}**: ${e.eventType} at ${e.createdAt}`);
    }
    lines.push('');
  }

  // ── No changes ────────────────────────────────────────────────────────
  const hasChanges =
    addedClinics.length > 0 ||
    removedClinics.length > 0 ||
    clinicFieldChanges.length > 0 ||
    addedDoctors.length > 0 ||
    removedDoctors.length > 0 ||
    queueChanges.length > 0 ||
    newStats.length > 0 ||
    newPayments.length > 0 ||
    newEvents.length > 0;

  if (!hasChanges) {
    lines.push('## No Changes Detected');
    lines.push('');
    lines.push('The database is identical between the two snapshots.');
    lines.push('');
  }

  return lines.join('\n');
}

// ─── Utilities ──────────────────────────────────────────────────────────────

function getSnapshotFiles(): string[] {
  if (!fs.existsSync(SNAPSHOT_DIR)) return [];
  return fs
    .readdirSync(SNAPSHOT_DIR)
    .filter((f) => f.startsWith('snapshot-') && f.endsWith('.json'))
    .sort();
}

function loadSnapshot(filepath: string): DbSnapshot {
  return JSON.parse(fs.readFileSync(filepath, 'utf-8'));
}

function printSummary(snapshot: DbSnapshot) {
  console.log(`\n📊 Database Snapshot — ${snapshot.timestamp}\n`);
  console.log(`  Clinics:        ${snapshot.counts.clinics}`);
  console.log(`  Doctors:        ${snapshot.counts.doctors}`);
  console.log(`  Queue Entries:  ${snapshot.counts.queueEntries}`);
  console.log(`  Daily Stats:    ${snapshot.counts.dailyStats}`);
  console.log(`  Payments:       ${snapshot.counts.paymentRecords}`);
  console.log(`  Sub Events:     ${snapshot.counts.subscriptionEvents}`);
  console.log('');

  console.log('  Clinics:');
  for (const c of snapshot.clinics) {
    const status = c.subscriptionStatus.padEnd(8);
    const active = c.isActive ? '✅' : '⛔';
    console.log(`    ${active} ${c.name} (${c.email}) — ${status} [${c.country}]`);
  }
  console.log('');

  if (snapshot.queueByClinic.length) {
    console.log('  Active Queues:');
    for (const q of snapshot.queueByClinic) {
      console.log(
        `    ${q.clinicName}: ${q.total} entries (W:${q.WAITING} N:${q.NOTIFIED} IC:${q.IN_CONSULTATION} C:${q.COMPLETED} NS:${q.NO_SHOW})`
      );
    }
    console.log('');
  }
}

// ─── Main ───────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const snapshotOnly = args.includes('--snapshot');
  const diffOnly = args.includes('--diff');
  const listOnly = args.includes('--list');
  const cleanUp = args.includes('--clean');

  if (listOnly) {
    const files = getSnapshotFiles();
    if (!files.length) {
      console.log('No snapshots found.');
      return;
    }
    console.log(`\n📁 Snapshots (${SNAPSHOT_DIR}):\n`);
    for (const f of files) {
      const snap = loadSnapshot(path.join(SNAPSHOT_DIR, f));
      console.log(`  ${f} — ${snap.counts.clinics} clinics, ${snap.counts.queueEntries} queue entries`);
    }
    return;
  }

  if (cleanUp) {
    const files = getSnapshotFiles();
    if (files.length <= 10) {
      console.log(`Only ${files.length} snapshots found. Nothing to clean.`);
      return;
    }
    const toDelete = files.slice(0, files.length - 10);
    for (const f of toDelete) {
      fs.unlinkSync(path.join(SNAPSHOT_DIR, f));
    }
    console.log(`Cleaned up ${toDelete.length} old snapshots. Kept last 10.`);
    return;
  }

  if (diffOnly) {
    const files = getSnapshotFiles();
    if (files.length < 2) {
      console.log('Need at least 2 snapshots to diff.');
      return;
    }
    const before = loadSnapshot(path.join(SNAPSHOT_DIR, files[files.length - 2]));
    const after = loadSnapshot(path.join(SNAPSHOT_DIR, files[files.length - 1]));
    const report = diffSnapshots(before, after);

    const reportPath = path.join(SNAPSHOT_DIR, `diff-${files[files.length - 1].replace('snapshot-', '').replace('.json', '')}.md`);
    fs.writeFileSync(reportPath, report);
    console.log(report);
    console.log(`\n📄 Report saved to: ${reportPath}`);
    return;
  }

  // Take new snapshot
  console.log('Taking database snapshot...');
  const snapshot = await takeSnapshot();
  const filepath = saveSnapshot(snapshot);
  printSummary(snapshot);
  console.log(`💾 Saved to: ${filepath}`);

  // Auto-diff against previous snapshot (unless --snapshot flag)
  if (!snapshotOnly) {
    const files = getSnapshotFiles();
    if (files.length >= 2) {
      const prevFile = files[files.length - 2];
      const before = loadSnapshot(path.join(SNAPSHOT_DIR, prevFile));
      const report = diffSnapshots(before, snapshot);

      const reportPath = filepath.replace('.json', '-diff.md');
      fs.writeFileSync(reportPath, report);

      console.log('\n' + '═'.repeat(60));
      console.log(report);
      console.log(`📄 Diff report saved to: ${reportPath}`);
    } else {
      console.log('\n(First snapshot — no previous snapshot to diff against)');
    }
  }
}

main()
  .catch((e) => {
    console.error('Failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
