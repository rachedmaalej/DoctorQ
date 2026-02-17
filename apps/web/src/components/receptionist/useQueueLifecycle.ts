import { useState, useEffect, useCallback, useRef } from 'react';
import type { QueueEntry, QueueStats } from '@/types';
import { QueueStatus } from '@/types';
import type { QueueScreenStatus, ClosedDaySummary } from './types';

function getDateKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function lsKey(prefix: string, clinicId: string): string {
  return `${prefix}_${clinicId}_${getDateKey()}`;
}

function formatNow(): string {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

export function useQueueLifecycle(
  clinicId: string | undefined,
  queue: QueueEntry[],
  stats: QueueStats | null,
) {
  // ── Read persisted state ──────────────────────────────────
  const [queueStatus, setQueueStatusRaw] = useState<QueueScreenStatus>(() => {
    if (!clinicId) return 'PRE_OPEN';
    const stored = localStorage.getItem(lsKey('bs_queue_status', clinicId));
    if (stored === 'OPEN' || stored === 'CLOSING' || stored === 'CLOSED') return stored;
    return 'PRE_OPEN';
  });

  const [dayOpenedAt, setDayOpenedAtRaw] = useState<string | null>(() => {
    if (!clinicId) return null;
    return localStorage.getItem(lsKey('bs_day_opened', clinicId));
  });

  const [closedSummary, setClosedSummaryRaw] = useState<ClosedDaySummary | null>(() => {
    if (!clinicId) return null;
    try {
      const stored = localStorage.getItem(lsKey('bs_closed_summary', clinicId));
      return stored ? JSON.parse(stored) : null;
    } catch { return null; }
  });

  // ── Persist helper ────────────────────────────────────────
  const setQueueStatus = useCallback((status: QueueScreenStatus) => {
    setQueueStatusRaw(status);
    if (clinicId) localStorage.setItem(lsKey('bs_queue_status', clinicId), status);
  }, [clinicId]);

  // ── Re-hydrate when clinicId becomes available ────────────
  useEffect(() => {
    if (!clinicId) return;
    const stored = localStorage.getItem(lsKey('bs_queue_status', clinicId));
    if (stored === 'OPEN' || stored === 'CLOSING' || stored === 'CLOSED') {
      setQueueStatusRaw(stored);
    } else {
      setQueueStatusRaw('PRE_OPEN');
    }
    setDayOpenedAtRaw(localStorage.getItem(lsKey('bs_day_opened', clinicId)));
    try {
      const s = localStorage.getItem(lsKey('bs_closed_summary', clinicId));
      setClosedSummaryRaw(s ? JSON.parse(s) : null);
    } catch { setClosedSummaryRaw(null); }
  }, [clinicId]);

  // ── Auto-promote PRE_OPEN → OPEN ─────────────────────────
  // Only promote when we can VERIFY the queue data belongs to this clinic
  // (prevents stale cross-clinic promotions during admin impersonation switches)
  useEffect(() => {
    if (queueStatus !== 'PRE_OPEN' || !clinicId) return;

    // Verify queue entries belong to this clinic
    const myQueue = queue.filter(e => e.clinicId === clinicId);
    const hasInConsult = myQueue.some(e => e.status === QueueStatus.IN_CONSULTATION);
    // Only trust stats.seen when we have at least one verified queue entry
    const hasSeen = myQueue.length > 0 && stats && stats.seen > 0;

    if (hasSeen || hasInConsult) {
      setQueueStatus('OPEN');
      if (!dayOpenedAt) {
        const t = formatNow();
        setDayOpenedAtRaw(t);
        localStorage.setItem(lsKey('bs_day_opened', clinicId), t);
      }
    }
  }, [queueStatus, stats, queue, clinicId, dayOpenedAt, setQueueStatus]);

  // ── Stale-state validator ─────────────────────────────────
  // Continuously checks: if OPEN with zero activity for this clinic,
  // reset to PRE_OPEN. The manuallyOpened guard prevents resetting
  // immediately after the user clicks "Ouvrir la file".
  const manuallyOpenedRef = useRef(false);

  useEffect(() => { manuallyOpenedRef.current = false; }, [clinicId]);

  useEffect(() => {
    if (!clinicId || manuallyOpenedRef.current) return;
    // Wait until queue data is for this clinic (or confirmed empty)
    if (queue.length > 0 && queue[0].clinicId !== clinicId) return;

    const myQueue = queue.filter(e => e.clinicId === clinicId);
    const seenCount = stats?.seen ?? 0;

    if (queueStatus === 'OPEN' && seenCount === 0 && myQueue.length === 0) {
      setQueueStatusRaw('PRE_OPEN');
      localStorage.removeItem(lsKey('bs_queue_status', clinicId));
      localStorage.removeItem(lsKey('bs_day_opened', clinicId));
      setDayOpenedAtRaw(null);
    }
  }, [clinicId, stats, queue, queueStatus]);

  // ── Derived flags ─────────────────────────────────────────
  const waitingCount = queue.filter(
    e => e.status === QueueStatus.WAITING || e.status === QueueStatus.NOTIFIED,
  ).length;
  const hasInConsultation = queue.some(e => e.status === QueueStatus.IN_CONSULTATION);
  const isAllDone = queueStatus === 'CLOSING' && waitingCount === 0 && !hasInConsultation;

  // ── Transitions ───────────────────────────────────────────
  const openQueue = useCallback(() => {
    manuallyOpenedRef.current = true;
    setQueueStatus('OPEN');
    if (clinicId && !dayOpenedAt) {
      const t = formatNow();
      setDayOpenedAtRaw(t);
      localStorage.setItem(lsKey('bs_day_opened', clinicId), t);
    }
  }, [clinicId, dayOpenedAt, setQueueStatus]);

  const closeQueue = useCallback(() => {
    setQueueStatus('CLOSING');
  }, [setQueueStatus]);

  const reopenQueue = useCallback(() => {
    setQueueStatus('OPEN');
  }, [setQueueStatus]);

  const endDay = useCallback(() => {
    if (clinicId && stats) {
      const summary: ClosedDaySummary = {
        totalPatientsSeen: stats.seen,
        avgWaitMinutes: stats.avgWait ? Math.round(stats.avgWait) : 0,
        avgConsultMinutes: Math.round(stats.effectiveAvgMins),
        firstPatientTime: dayOpenedAt || '--:--',
        lastPatientTime: formatNow(),
      };
      localStorage.setItem(lsKey('bs_closed_summary', clinicId), JSON.stringify(summary));
      setClosedSummaryRaw(summary);
    }
    setQueueStatus('CLOSED');
  }, [clinicId, stats, dayOpenedAt, setQueueStatus]);

  const newDay = useCallback(() => {
    if (clinicId) {
      localStorage.removeItem(lsKey('bs_queue_status', clinicId));
      localStorage.removeItem(lsKey('bs_day_opened', clinicId));
      localStorage.removeItem(lsKey('bs_closed_summary', clinicId));
    }
    setQueueStatusRaw('PRE_OPEN');
    setDayOpenedAtRaw(null);
    setClosedSummaryRaw(null);
  }, [clinicId]);

  // ── Multi-tab sync ────────────────────────────────────────
  useEffect(() => {
    if (!clinicId) return;
    const handler = (e: StorageEvent) => {
      const statusKey = lsKey('bs_queue_status', clinicId);
      const openedKey = lsKey('bs_day_opened', clinicId);
      const summaryKey = lsKey('bs_closed_summary', clinicId);
      if (e.key === statusKey && e.newValue) {
        setQueueStatusRaw(e.newValue as QueueScreenStatus);
      } else if (e.key === openedKey) {
        setDayOpenedAtRaw(e.newValue);
      } else if (e.key === summaryKey) {
        try { setClosedSummaryRaw(e.newValue ? JSON.parse(e.newValue) : null); }
        catch { /* ignore */ }
      }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, [clinicId]);

  return {
    queueStatus,
    isAllDone,
    dayOpenedAt,
    closedSummary,
    openQueue,
    closeQueue,
    reopenQueue,
    endDay,
    newDay,
  };
}
