/**
 * DEV ONLY — Floating tooltip showing live queue stats.
 * Draggable, collapsible. TODO: Remove before production launch.
 */
import { useState, useRef, useCallback, useEffect } from 'react';
import type { QueueStats } from '@/types';

interface DevStatsTooltipProps {
  stats: QueueStats | null;
  currentConsultStartedAt?: string | null; // calledAt ISO string of IN_CONSULTATION patient
}

export default function DevStatsTooltip({ stats, currentConsultStartedAt }: DevStatsTooltipProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [position, setPosition] = useState({ x: 16, y: 100 });
  const dragRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Consultation timer — derived from actual calledAt timestamp, ticks every second
  const [now, setNow] = useState(Date.now());
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    timerRef.current = setInterval(() => setNow(Date.now()), 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const elapsed = currentConsultStartedAt
    ? Math.max(0, Math.floor((now - new Date(currentConsultStartedAt).getTime()) / 1000))
    : null;

  const fmtTimer = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    dragRef.current = { startX: e.clientX, startY: e.clientY, origX: position.x, origY: position.y };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [position]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    setPosition({ x: dragRef.current.origX + dx, y: dragRef.current.origY + dy });
  }, []);

  const onPointerUp = useCallback(() => {
    dragRef.current = null;
  }, []);

  // Keep tooltip within viewport
  useEffect(() => {
    const el = tooltipRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const maxX = window.innerWidth - rect.width - 8;
    const maxY = window.innerHeight - rect.height - 8;
    if (position.x > maxX || position.y > maxY || position.x < 0 || position.y < 0) {
      setPosition({
        x: Math.max(0, Math.min(position.x, maxX)),
        y: Math.max(0, Math.min(position.y, maxY)),
      });
    }
  }, [position, collapsed]);

  const fmt = (v: number | null | undefined) => v != null ? `${v} min` : '—';

  return (
    <div
      ref={tooltipRef}
      className="fixed z-[9999] select-none"
      style={{ left: position.x, top: position.y }}
    >
      {/* Drag handle */}
      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        className="flex items-center gap-1.5 px-2 py-1 bg-gray-900 text-yellow-300 rounded-t-lg cursor-grab active:cursor-grabbing text-[10px] font-mono font-bold"
      >
        <span className="material-symbols-outlined" style={{ fontSize: 14 }}>bug_report</span>
        DEV STATS
        <button
          onClick={() => setCollapsed(c => !c)}
          className="ml-auto text-gray-400 hover:text-white"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
            {collapsed ? 'expand_more' : 'expand_less'}
          </span>
        </button>
      </div>

      {/* Stats body */}
      {!collapsed && (
        <div className="bg-gray-900/95 text-gray-100 rounded-b-lg px-3 py-2 text-[11px] font-mono space-y-1 min-w-[200px] border-t border-gray-700">
          <Row label="Avg Wait" value={fmt(stats?.avgWait)} />
          <Row label="Max Wait" value={fmt(stats?.maxWait)} />
          <Row label="Avg Consult (EMA)" value={fmt(stats?.effectiveAvgMins)} />
          <Row label="Last Consult" value={fmt(stats?.lastConsultationMins)} />
          <Row label="Current consult" value={elapsed != null ? fmtTimer(elapsed) : '—'} highlight={elapsed != null} />
          <div className="border-t border-gray-700 pt-1 mt-1" />
          <Row label="Waiting" value={String(stats?.waiting ?? 0)} />
          <Row label="Seen today" value={String(stats?.seen ?? 0)} />
          <Row label="No-shows" value={String(stats?.noShows ?? 0)} />
        </div>
      )}
    </div>
  );
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-gray-400">{label}</span>
      <span className={`font-semibold ${highlight ? 'text-green-400 tabular-nums' : 'text-yellow-200'}`}>{value}</span>
    </div>
  );
}
