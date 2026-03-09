import ASIcon from './ASIcon';
import { useMemo } from 'react';

import type { Doctor, QueueEntry, DoctorState } from '@/types';
import { QueueStatus } from '@/types';
import { formatDoctorName, formatDisplayName, getTokenColor } from './utils';

interface ASDoctorStatusBarProps {
  doctors: Doctor[];
  queue: QueueEntry[];
  waitingByDoctor: Map<string, number>;
  onDoctorClick: (doctorId: string) => void;
  onCallNextForDoctor: (doctorId: string) => void;
}

/** Per-doctor stats derived from queue data */
interface DoctorStats {
  waiting: number;
  seen: number;
  avgWaitMin: number | null;
}

function computePerDoctorStats(
  queue: QueueEntry[],
  doctorId: string,
  waitingCount: number,
): DoctorStats {
  let seenCount = 0;
  let totalWaitMs = 0;
  let waitSamples = 0;

  for (const e of queue) {
    if (e.doctorId !== doctorId) continue;

    if (e.status === QueueStatus.COMPLETED || e.status === QueueStatus.IN_CONSULTATION) {
      seenCount++;
    }
    // Compute avg wait from entries that have been called
    if (e.calledAt && e.arrivedAt) {
      const wait = new Date(e.calledAt).getTime() - new Date(e.arrivedAt).getTime();
      if (wait > 0) {
        totalWaitMs += wait;
        waitSamples++;
      }
    }
  }

  return {
    waiting: waitingCount,
    seen: seenCount,
    avgWaitMin: waitSamples > 0 ? Math.round(totalWaitMs / waitSamples / 60000) : null,
  };
}

function getStateLabel(
  state: DoctorState,
  _doctor: Doctor,
  inConsultationPatient?: QueueEntry | null,
): { label: string; pulsing: boolean } {
  switch (state) {
    case 'consulting': {
      const patientName = inConsultationPatient?.patientName;
      const calledAt = inConsultationPatient?.calledAt;
      const sinceMin = calledAt
        ? Math.round((Date.now() - new Date(calledAt).getTime()) / 60000)
        : 0;
      if (patientName) {
        const display = formatDisplayName(patientName);
        return {
          label: sinceMin > 0 ? `${display} · ${sinceMin} min` : display,
          pulsing: true,
        };
      }
      return {
        label: sinceMin > 0 ? `En consultation · ${sinceMin} min` : 'En consultation',
        pulsing: true,
      };
    }
    case 'free':
      return { label: 'Libre', pulsing: false };
    case 'pause':
      return { label: 'En pause', pulsing: false };
    case 'absent_today':
      return { label: 'Absent', pulsing: false };
    case 'home_visit':
      return { label: 'Visite domicile', pulsing: false };
    default:
      return { label: '', pulsing: false };
  }
}

export default function ASDoctorStatusBar({
  doctors,
  queue,
  waitingByDoctor,
  onDoctorClick,
  onCallNextForDoctor,
}: ASDoctorStatusBarProps) {
  const visibleDoctors = doctors.filter((d) => d.state !== 'inactive' && d.isActive);

  // Count unassigned waiting patients (no doctorId) — any doctor can call them
  const unassignedWaiting = useMemo(() => {
    return queue.filter(
      (e) => !e.doctorId && (e.status === QueueStatus.WAITING || e.status === QueueStatus.NOTIFIED)
    ).length;
  }, [queue]);

  const perDoctorStats = useMemo(() => {
    const map = new Map<string, DoctorStats>();
    for (const doc of visibleDoctors) {
      const assigned = waitingByDoctor.get(doc.id) || 0;
      // Include unassigned patients in the waiting count — they're callable by any doctor
      map.set(doc.id, computePerDoctorStats(queue, doc.id, assigned + unassignedWaiting));
    }
    return map;
  }, [queue, visibleDoctors, waitingByDoctor, unassignedWaiting]);

  if (visibleDoctors.length === 0) return null;


  return (
    <div
      className="as-section-doctors as-fade-up as-fade-up-2"
      style={{ display: 'flex', flexDirection: 'column', gap: 6 }}
    >
      {/* Section header */}
      <div className="as-section-header">
        <span style={{
          width: 8, height: 8, borderRadius: 4,
          background: 'var(--section-doctors-accent)', display: 'inline-block',
        }} />
        <span className="as-section-header-label" style={{ color: 'var(--section-doctors-text)' }}>
          Médecins
        </span>
        <span style={{
          fontSize: 10, fontWeight: 600, color: 'var(--section-doctors-muted)',
          marginLeft: 'auto',
        }}>
          {visibleDoctors.length}
        </span>
      </div>

      {visibleDoctors.map((doctor) => {
        const color = getTokenColor(doctor.colorToken);
        const inConsultPatient = queue.find(
          (e) => e.doctorId === doctor.id && e.status === QueueStatus.IN_CONSULTATION
        );
        const stateInfo = getStateLabel(doctor.state, doctor, inConsultPatient);
        const dStats = perDoctorStats.get(doctor.id);
        const showSuivant = (doctor.state === 'consulting' || doctor.state === 'free') && (dStats?.waiting ?? 0) > 0;
        const isMuted = doctor.state === 'pause' || doctor.state === 'absent_today';
        const waiting = dStats?.waiting ?? 0;
        const seen = dStats?.seen ?? 0;
        const avgWait = dStats?.avgWaitMin;

        return (
          <div
            key={doctor.id}
            role="button"
            tabIndex={0}
            aria-label={`${formatDoctorName(doctor.name)}, ${stateInfo.label}`}
            onClick={() => onDoctorClick(doctor.id)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onDoctorClick(doctor.id); } }}
            style={{
              display: 'flex',
              alignItems: 'center',
              background: 'var(--color-surface)',
              borderRadius: 'var(--radius)',
              border: '1px solid var(--color-border-subtle)',
              overflow: 'hidden',
              cursor: 'pointer',
              opacity: isMuted ? 0.6 : 1,
              transition: 'opacity 0.2s',
            }}
          >
            {/* Left: color band */}
            <div style={{ width: 3, alignSelf: 'stretch', background: isMuted ? 'var(--color-text-muted)' : color.fg, flexShrink: 0 }} />

            {/* Middle: compact two-line layout */}
            <div style={{ flex: 1, padding: '8px 10px', minWidth: 0 }}>
              {/* Row 1: Name + specialty + status dot/label */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 2 }}>
                <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 13, fontWeight: 700, color: 'var(--color-text-primary)', whiteSpace: 'nowrap' }}>
                  {formatDoctorName(doctor.name)}
                </span>
                {doctor.specialty && (
                  <span style={{
                    fontSize: 8, padding: '1px 6px', borderRadius: 'var(--radius-pill)',
                    background: color.bg, color: color.fg, fontWeight: 600,
                  }}>
                    {doctor.specialty}
                  </span>
                )}
              </div>
              {/* Row 2: Status + inline KPIs */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                {stateInfo.pulsing ? (
                  <span className="as-pulse-consultation" style={{
                    width: 5, height: 5, borderRadius: 3,
                    background: color.fg, display: 'inline-block', flexShrink: 0,
                  }} />
                ) : (
                  <span style={{
                    width: 5, height: 5, borderRadius: 3,
                    background: isMuted ? 'var(--color-text-muted)' : color.fg,
                    display: 'inline-block', opacity: 0.5, flexShrink: 0,
                  }} />
                )}
                <span style={{
                  fontSize: 10, color: isMuted ? 'var(--color-text-muted)' : color.fg,
                  fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                  {stateInfo.label}
                </span>
                <span style={{ fontSize: 10, color: 'var(--color-text-muted)', marginLeft: 'auto', whiteSpace: 'nowrap', flexShrink: 0 }}>
                  <strong style={{ color: waiting > 0 ? 'var(--section-doctors-accent)' : 'var(--color-text-primary)' }}>{waiting}</strong> att.
                  {' · '}
                  <strong style={{ color: 'var(--color-text-primary)' }}>{seen}</strong> vus
                  {avgWait != null && <>{' · '}<strong style={{ color: 'var(--color-text-primary)' }}>{avgWait}m</strong> moy.</>}
                </span>
              </div>
            </div>

            {/* Right: compact Suivant button */}
            {showSuivant && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCallNextForDoctor(doctor.id);
                }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 2,
                  padding: '6px 10px', margin: '0 8px',
                  borderRadius: 'var(--radius-sm)', border: `1.5px solid ${color.fg}`,
                  background: 'transparent', color: color.fg,
                  cursor: 'pointer', fontFamily: 'inherit',
                  fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
                  letterSpacing: '0.03em', whiteSpace: 'nowrap',
                  transition: 'filter 0.15s', flexShrink: 0,
                }}
                onMouseOver={(e) => (e.currentTarget.style.filter = 'brightness(0.95)')}
                onMouseOut={(e) => (e.currentTarget.style.filter = 'none')}
              >
                <ASIcon name="chevron_right" size={14} />
                Suivant
              </button>
            )}
          </div>
        );
      })}

    </div>
  );
}

