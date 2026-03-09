import ASIcon from './ASIcon';
import { useState, useEffect, useCallback, useMemo } from 'react';
import type { QueueEntry, QueueStats, Doctor, ScheduleSlot } from '@/types';
import { QueueStatus } from '@/types';
import { useAuthStore } from '@/stores/authStore';
import { useWaitingRoom } from '@/hooks/useWaitingRoom';
import { useScheduleView } from '@/hooks/useScheduleView';
import { useDoctorActions } from '@/hooks/useDoctorActions';
import { usePatientActions } from '@/hooks/usePatientActions';
import { api } from '@/lib/api';

import './ausuivant.css';

import ASTopbar from './ASTopbar';
import ASDoctorActionPanel from './ASDoctorActionPanel';
import ASPatientRow, { getDoctorInitial } from './ASPatientRow';
import ASScheduleTimeline from './ASScheduleTimeline';
import ASNoShowBanner from './ASNoShowBanner';
import ASCallNextSheet from './ASCallNextSheet';
import ASAddPatientDrawer from './ASAddPatientDrawer';
import ASSettingsPanel from './ASSettingsPanel';
import ASTransferPatientSheet from './ASTransferPatientSheet';
import ASPatientDetailDrawer from './ASPatientDetailDrawer';
import { formatDoctorName, formatDisplayName, getTokenColor, formatArrivalTime, getConsultationDuration } from './utils';

interface ASDesktopLayoutProps {
  queue: QueueEntry[];
  stats: QueueStats | null;
  doctors: Doctor[];
  onCallNext: () => void;
  onCallNextForDoctor: (doctorId: string) => void;
  onRemovePatient: (id: string) => void;
  onMarkUrgent: (id: string) => void;
  isCallingNext: boolean;
  isDoctorPresent: boolean;
  onToggleDoctorPresent: () => void;
  isTogglingPresence?: boolean;
  onRefreshDoctors?: () => void;
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

export default function ASDesktopLayout({
  queue,
  stats,
  doctors,
  onCallNext,
  onCallNextForDoctor,
  onRemovePatient,
  onMarkUrgent,
  isCallingNext,
  isDoctorPresent,
  onRefreshDoctors,
}: ASDesktopLayoutProps) {
  const { clinic } = useAuthStore();
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCallNextSheetOpen, setIsCallNextSheetOpen] = useState(false);
  const [scheduleSlots, setScheduleSlots] = useState<ScheduleSlot[]>([]);
  const [dismissedNoShows, setDismissedNoShows] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [isScheduleExpanded, setIsScheduleExpanded] = useState(false);

  // Doctor action panel state
  const [actionPanelDoctorId, setActionPanelDoctorId] = useState<string | null>(null);
  const actionPanelDoctor = actionPanelDoctorId ? doctors.find((d) => d.id === actionPanelDoctorId) : null;

  // Patient detail drawer state
  const [detailPatientId, setDetailPatientId] = useState<string | null>(null);
  const detailPatient = detailPatientId ? queue.find((e) => e.id === detailPatientId) : null;

  // Transfer sheet state
  const [transferPatientId, setTransferPatientId] = useState<string | null>(null);
  const transferPatient = transferPatientId ? queue.find((e) => e.id === transferPatientId) : null;

  const { allPatients, waitingByDoctor, unassignedWaiting } = useWaitingRoom(queue, doctors);

  const waitingCount = stats?.waiting ?? allPatients.filter(p => p.status === 'WAITING' || p.status === 'NOTIFIED').length;
  const avgMins = (stats as any)?.effectiveAvgMins || clinic?.avgConsultationMins || 15;
  const hasMultiDoctor = doctors.length > 1;
  const visibleDoctors = doctors.filter((d) => d.state !== 'inactive' && d.isActive);

  // Per-doctor stats
  const unassignedWaitingCount = useMemo(() => {
    return queue.filter(
      (e) => !e.doctorId && (e.status === QueueStatus.WAITING || e.status === QueueStatus.NOTIFIED)
    ).length;
  }, [queue]);

  const perDoctorStats = useMemo(() => {
    const map = new Map<string, DoctorStats>();
    for (const doc of visibleDoctors) {
      const assigned = waitingByDoctor.get(doc.id) || 0;
      map.set(doc.id, computePerDoctorStats(queue, doc.id, assigned + unassignedWaitingCount));
    }
    return map;
  }, [queue, visibleDoctors, waitingByDoctor, unassignedWaitingCount]);

  // Doctor & patient actions
  const refreshDoctors = onRefreshDoctors || (() => {});
  const doctorActions = useDoctorActions(refreshDoctors);
  const patientActions = usePatientActions(refreshDoctors);

  // Fetch schedule slots
  const fetchSchedule = useCallback(async () => {
    try {
      const data = await api.getScheduleToday();
      setScheduleSlots(data);
    } catch {
      // Schedule API may not be available yet
    }
  }, []);

  useEffect(() => {
    fetchSchedule();
  }, [fetchSchedule]);

  // Schedule view derivation
  const graceMinutes = 10;
  const hasSchedule = scheduleSlots.length > 0;
  const scheduleView = useScheduleView(queue, doctors, scheduleSlots, graceMinutes, hasSchedule);

  // Filter out dismissed no-shows
  const activeNoShows = scheduleView.noShowCandidates.filter(
    (s) => !dismissedNoShows.has(s.id),
  );

  // Filter patients — only waiting (consultation is shown in doctor cards)
  const waitingPatients = allPatients.filter(p => p.status !== QueueStatus.IN_CONSULTATION);
  const filteredWaiting = searchQuery.trim()
    ? waitingPatients.filter((p) =>
        (p.patientName || '').toLowerCase().includes(searchQuery.trim().toLowerCase()),
      )
    : waitingPatients;

  const handleMarkNoShow = useCallback(async (slotIds: string[]) => {
    setDismissedNoShows((prev) => {
      const next = new Set(prev);
      for (const id of slotIds) next.add(id);
      return next;
    });
  }, []);

  const handleDismissNoShow = useCallback((slotId: string) => {
    setDismissedNoShows((prev) => new Set(prev).add(slotId));
  }, []);

  const handleAssignToSlot = useCallback((_slotId: string) => {
    setIsAddSheetOpen(true);
  }, []);

  const handlePatientClick = useCallback((entryId: string) => {
    setDetailPatientId(entryId);
  }, []);

  const handleCompleteConsultation = useCallback(async (entryId: string) => {
    try {
      await api.updatePatientStatus(entryId, { status: QueueStatus.COMPLETED });
    } catch {
      // Will sync via socket
    }
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if ((e.target as HTMLElement).isContentEditable) return;

      switch (e.key.toLowerCase()) {
        case 'n':
          e.preventDefault();
          if (hasMultiDoctor) {
            setIsCallNextSheetOpen(true);
          } else {
            onCallNext();
          }
          break;
        case 'a':
          e.preventDefault();
          setIsAddSheetOpen(true);
          break;
        case 'escape':
          if (detailPatientId) {
            setDetailPatientId(null);
          } else if (transferPatientId) {
            setTransferPatientId(null);
          } else if (isCallNextSheetOpen) {
            setIsCallNextSheetOpen(false);
          } else if (isAddSheetOpen) {
            setIsAddSheetOpen(false);
          } else if (isSettingsOpen) {
            setIsSettingsOpen(false);
          } else if (actionPanelDoctorId) {
            setActionPanelDoctorId(null);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    hasMultiDoctor, onCallNext, detailPatientId, transferPatientId,
    isCallNextSheetOpen, isAddSheetOpen, isSettingsOpen, actionPanelDoctorId,
  ]);

  // ── Desktop topbar slot: search + add patient ──
  const topbarDesktopSlot = (
    <div className="flex items-center gap-2" style={{ flex: 1, justifyContent: 'flex-end', marginLeft: 24, marginRight: 12 }}>
      {/* Search */}
      <div style={{ position: 'relative', maxWidth: 280, flex: 1 }}>
        <ASIcon name="search" size={14} style={{
            position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
            color: 'var(--color-text-muted)', pointerEvents: 'none',
          }} />
        <input
          type="text"
          placeholder="Rechercher un patient..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            paddingLeft: 30, paddingTop: 7, paddingBottom: 7,
            fontSize: 13, border: '1px solid var(--color-border-subtle)',
            borderRadius: 'var(--radius-sm)', background: 'var(--color-surface-alt)',
            width: '100%',
          }}
        />
      </div>
      {/* Add patient */}
      <button
        onClick={() => setIsAddSheetOpen(true)}
        className="flex items-center gap-1.5"
        style={{
          padding: '7px 14px', borderRadius: 'var(--radius-sm)',
          border: 'none', background: 'var(--color-primary)', color: 'white',
          fontSize: 12, fontWeight: 600, cursor: 'pointer',
          fontFamily: 'inherit', whiteSpace: 'nowrap',
        }}
      >
        <ASIcon name="add" size={14} />
        Patient
      </button>
    </div>
  );

  return (
    <div className="as-dashboard as-desktop as-command-center">
      {/* Topbar with search + add integrated */}
      <ASTopbar
        onOpenSettings={() => setIsSettingsOpen(true)}
        isSessionActive={isDoctorPresent}
        desktopSlot={topbarDesktopSlot}
      />

      {/* No-show banner (if any) */}
      {activeNoShows.length > 0 && (
        <div style={{ maxWidth: 960, margin: '0 auto', padding: '0 24px' }}>
          <ASNoShowBanner
            noShowCandidates={activeNoShows}
            doctors={doctors}
            onMarkNoShow={handleMarkNoShow}
            onDismiss={handleDismissNoShow}
          />
        </div>
      )}

      {/* ═══ DOCTOR CARDS with integrated consultation ═══ */}
      {hasMultiDoctor && visibleDoctors.length > 0 && (
        <div style={{ position: 'relative', maxWidth: 960, margin: '0 auto', padding: '12px 24px 0' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${Math.min(visibleDoctors.length, 3)}, 1fr)`,
            gap: 12,
          }}>
            {visibleDoctors.map((doctor) => {
              const color = getTokenColor(doctor.colorToken);
              const dStats = perDoctorStats.get(doctor.id);
              const waiting = dStats?.waiting ?? 0;
              const seen = dStats?.seen ?? 0;
              const avgWait = dStats?.avgWaitMin;
              const isMuted = doctor.state === 'pause' || doctor.state === 'absent_today';
              const showSuivant = (doctor.state === 'consulting' || doctor.state === 'free') && waiting > 0;

              // Find current in-consultation patient for this doctor
              const inConsultPatient = queue.find(
                (e) => e.doctorId === doctor.id && e.status === QueueStatus.IN_CONSULTATION
              );
              const isConsulting = !!inConsultPatient;

              return (
                <div
                  key={doctor.id}
                  className="as-fade-up-card"
                  style={{
                    borderRadius: 'var(--radius)',
                    border: '1px solid var(--color-border-subtle)',
                    overflow: 'hidden',
                    background: 'white',
                    opacity: isMuted ? 0.6 : 1,
                    transition: 'box-shadow 0.2s, opacity 0.2s',
                  }}
                  onMouseOver={(e) => { if (!isMuted) e.currentTarget.style.boxShadow = 'var(--shadow-dropdown)'; }}
                  onMouseOut={(e) => { e.currentTarget.style.boxShadow = 'none'; }}
                >
                  {/* Card header: doctor identity + KPIs */}
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => setActionPanelDoctorId(doctor.id === actionPanelDoctorId ? null : doctor.id)}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setActionPanelDoctorId(doctor.id === actionPanelDoctorId ? null : doctor.id); } }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '10px 12px', borderBottom: '1px solid var(--color-border-subtle)',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ width: 4, height: 36, borderRadius: 2, background: isMuted ? 'var(--color-text-muted)' : color.fg, flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="flex items-center gap-1.5" style={{ marginBottom: 2 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-primary)' }}>
                          {formatDoctorName(doctor.name)}
                        </span>
                        {doctor.specialty && (
                          <span style={{
                            fontSize: 8, padding: '1px 5px', borderRadius: 5,
                            background: color.bg, color: color.fg, fontWeight: 600,
                          }}>
                            {doctor.specialty}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>
                        <strong style={{ color: waiting > 0 ? 'var(--section-doctors-accent)' : 'var(--color-text-primary)' }}>{waiting}</strong> att.
                        {' · '}
                        <strong style={{ color: 'var(--color-text-primary)' }}>{seen}</strong> vus
                        {avgWait != null && <>{' · '}<strong style={{ color: 'var(--color-text-primary)' }}>{avgWait}m</strong> moy.</>}
                      </div>
                    </div>
                  </div>

                  {/* Consultation zone: current patient or "Libre" */}
                  {isConsulting ? (
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '8px 12px',
                      background: 'var(--section-consult-bg)',
                      borderBottom: '1px solid var(--section-consult-border)',
                    }}>
                      <div
                        className="flex items-center justify-center flex-shrink-0"
                        style={{
                          width: 28, height: 28, borderRadius: 8,
                          background: color.fg, color: 'white',
                          fontWeight: 700, fontSize: 11,
                        }}
                      >
                        {getDoctorInitial(doctor.id, doctors)}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="flex items-center gap-1.5">
                          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)' }}>
                            {formatDisplayName(inConsultPatient.patientName)}
                          </span>
                          {inConsultPatient.appointmentTime ? (
                            <span style={{
                              fontSize: 8, padding: '1px 5px', borderRadius: 4,
                              fontWeight: 600, background: color.bg, color: color.fg,
                            }}>
                              {formatArrivalTime(inConsultPatient.appointmentTime)}
                            </span>
                          ) : (
                            <span style={{
                              fontSize: 8, padding: '1px 5px', borderRadius: 4,
                              fontWeight: 600, background: 'var(--color-surface-alt)', color: 'var(--color-text-muted)',
                            }}>
                              SANS RDV
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5" style={{ marginTop: 1 }}>
                          <span className="as-pulse-consultation" style={{
                            width: 5, height: 5, borderRadius: 3,
                            background: 'var(--section-consult-accent)', display: 'inline-block',
                          }} />
                          <span style={{ fontSize: 10, color: 'var(--section-consult-text)', fontWeight: 500 }}>
                            En consultation · {getConsultationDuration(inConsultPatient.calledAt)} min
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleCompleteConsultation(inConsultPatient.id)}
                        className="flex items-center gap-1"
                        style={{
                          padding: '5px 10px', borderRadius: 8, border: 'none',
                          background: 'var(--section-consult-accent)', color: 'white',
                          fontSize: 10, fontWeight: 700, cursor: 'pointer',
                          fontFamily: 'inherit', whiteSpace: 'nowrap', flexShrink: 0,
                        }}
                      >
                        <ASIcon name="check_circle" size={12} />
                        Terminer
                      </button>
                    </div>
                  ) : (
                    !isMuted && (
                      <div style={{
                        padding: '10px 12px',
                        background: 'var(--color-surface-alt)',
                        borderBottom: '1px dashed var(--color-border-subtle)',
                        display: 'flex', alignItems: 'center', gap: 6,
                      }}>
                        <span style={{
                          width: 5, height: 5, borderRadius: 3,
                          background: color.fg, display: 'inline-block', opacity: 0.5,
                        }} />
                        <span style={{ fontSize: 11, color: 'var(--color-text-muted)', fontWeight: 500 }}>
                          Libre
                        </span>
                      </div>
                    )
                  )}

                  {/* Card footer: Suivant button */}
                  {showSuivant && (
                    <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '6px 10px' }}>
                      <button
                        onClick={() => onCallNextForDoctor(doctor.id)}
                        disabled={isCallingNext}
                        className="flex items-center gap-1"
                        style={{
                          padding: '5px 12px', borderRadius: 8, border: 'none',
                          background: color.bg, color: color.fg,
                          fontSize: 10, fontWeight: 700, cursor: 'pointer',
                          fontFamily: 'inherit', whiteSpace: 'nowrap',
                          textTransform: 'uppercase', letterSpacing: '0.03em',
                          opacity: isCallingNext ? 0.6 : 1,
                          transition: 'filter 0.15s',
                        }}
                        onMouseOver={(e) => (e.currentTarget.style.filter = 'brightness(0.95)')}
                        onMouseOut={(e) => (e.currentTarget.style.filter = 'none')}
                      >
                        <ASIcon name="chevron_right" size={14} />
                        Suivant
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Doctor action panel */}
          {actionPanelDoctor && (
            <ASDoctorActionPanel
              doctor={actionPanelDoctor}
              isOpen={true}
              onClose={() => setActionPanelDoctorId(null)}
              waitingCount={waitingByDoctor.get(actionPanelDoctor.id) || 0}
              onCallNext={(id) => { onCallNextForDoctor(id); setActionPanelDoctorId(null); }}
              onMarkAbsent={(id) => { doctorActions.markAbsent(id); setActionPanelDoctorId(null); }}
              onNotifyDelay={(id) => { doctorActions.notifyDelay(id); setActionPanelDoctorId(null); }}
              onTogglePause={(id) => {
                const doc = doctors.find((d) => d.id === id);
                if (doc) doctorActions.togglePause(id, doc.state);
                setActionPanelDoctorId(null);
              }}
              onSetHomeVisit={(id) => { doctorActions.setHomeVisit(id); setActionPanelDoctorId(null); }}
            />
          )}
        </div>
      )}

      {/* ═══ AGENDA STRIP (collapsed when empty, expandable when populated) ═══ */}
      <div style={{ maxWidth: 960, margin: '12px auto 0', padding: '0 24px' }}>
        {hasSchedule ? (
          <div style={{
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--color-border-subtle)',
            background: 'var(--color-surface)',
            overflow: 'hidden',
          }}>
            <button
              onClick={() => setIsScheduleExpanded(!isScheduleExpanded)}
              className="flex items-center gap-2"
              style={{
                width: '100%', padding: '8px 14px',
                border: 'none', background: 'transparent',
                cursor: 'pointer', fontFamily: 'inherit',
                fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)',
                textTransform: 'uppercase', letterSpacing: '0.5px',
              }}
            >
              <ASIcon name="calendar_today" size={13} style={{ color: 'var(--section-doctors-accent)' }} />
              Agenda du jour · {scheduleSlots.length} créneau{scheduleSlots.length > 1 ? 'x' : ''}
              <ASIcon name="chevron_right" size={14} style={{
                  marginLeft: 'auto',
                  transform: isScheduleExpanded ? 'rotate(90deg)' : 'none',
                  transition: 'transform 0.2s',
                }} />
            </button>
            {isScheduleExpanded && (
              <div style={{ borderTop: '1px solid var(--color-border-subtle)' }}>
                <ASScheduleTimeline
                  slots={scheduleSlots}
                  walkIns={scheduleView.walkIns}
                  doctors={doctors}
                  onAssignToSlot={handleAssignToSlot}
                  onPatientClick={handlePatientClick}
                />
              </div>
            )}
          </div>
        ) : (
          <div
            className="flex items-center gap-2"
            style={{
              padding: '8px 14px',
              background: 'var(--color-surface-alt)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--color-border-subtle)',
              fontSize: 11, color: 'var(--color-text-muted)',
            }}
          >
            <ASIcon name="calendar_today" size={13} />
            <span>Agenda du jour · <em>Aucun rendez-vous importé</em></span>
          </div>
        )}
      </div>

      {/* ═══ FILE D'ATTENTE section ═══ */}
      <div style={{ maxWidth: 960, margin: '12px auto 0', padding: '0 24px 100px' }}>
        {/* Queue header with global Suivant */}
        <div
          className="flex items-center justify-between"
          style={{
            padding: '10px 0', marginBottom: 4,
            borderBottom: '1px solid var(--color-border-subtle)',
          }}
        >
          <div className="flex items-center gap-2">
            <span style={{
              width: 8, height: 8, borderRadius: 4,
              background: 'var(--section-waiting-accent)', display: 'inline-block',
            }} />
            <span style={{
              fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
              letterSpacing: '0.5px', color: 'var(--section-waiting-text)',
            }}>
              File d'attente
            </span>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-primary)' }}>
              {filteredWaiting.length}
            </span>
          </div>

          <button
            onClick={() => hasMultiDoctor ? setIsCallNextSheetOpen(true) : onCallNext()}
            disabled={waitingCount === 0 || !isDoctorPresent || isCallingNext}
            className="flex items-center gap-1.5"
            style={{
              padding: '7px 14px', borderRadius: 'var(--radius-sm)',
              border: 'none',
              background: waitingCount > 0 && isDoctorPresent ? 'var(--color-primary)' : 'var(--color-border)',
              color: waitingCount > 0 && isDoctorPresent ? 'white' : 'var(--color-text-muted)',
              fontSize: 12, fontWeight: 600,
              cursor: waitingCount > 0 && isDoctorPresent ? 'pointer' : 'default',
              fontFamily: 'inherit', whiteSpace: 'nowrap',
              opacity: isCallingNext ? 0.6 : 1,
            }}
          >
            Suivant
            {waitingCount > 0 && (
              <span style={{
                background: 'rgba(255,255,255,0.2)', padding: '1px 6px',
                borderRadius: 8, fontSize: 10,
              }}>
                {waitingCount}
              </span>
            )}
          </button>
        </div>

        {/* Patient rows */}
        {filteredWaiting.length > 0 ? (
          <div
            className="flex flex-col"
            role="list"
            aria-label={`File d'attente, ${filteredWaiting.length} patients`}
            aria-live="polite"
          >
            {filteredWaiting.map((entry, index) => {
              const estimatedWaitMinutes = index * avgMins;
              return (
                <ASPatientRow
                  key={entry.id}
                  entry={entry}
                  doctors={doctors}
                  position={index + 1}
                  estimatedWaitMinutes={estimatedWaitMinutes}
                  onMarkUrgent={onMarkUrgent}
                  onRemove={onRemovePatient}
                  onCallIn={patientActions.callIn}
                  onMarkNoShow={patientActions.markNoShow}
                  onTransfer={(id) => { setTransferPatientId(id); }}
                  animationDelay={index * 0.04}
                />
              );
            })}
          </div>
        ) : (
          <div
            className="flex flex-col items-center justify-center"
            style={{
              padding: '40px 24px', color: 'var(--color-text-muted)',
              textAlign: 'center',
            }}
          >
            {(stats?.seen ?? 0) > 0 ? (
              <>
                <span style={{ fontSize: 28, marginBottom: 6 }}>&#10004;</span>
                <span style={{ fontSize: 13, fontWeight: 500 }}>Tous les patients ont été vus !</span>
              </>
            ) : (
              <>
                <span style={{ fontSize: 28, marginBottom: 6 }}>&#128522;</span>
                <span style={{ fontSize: 13, fontWeight: 500 }}>Aucun patient en attente</span>
              </>
            )}
          </div>
        )}
      </div>

      {/* ═══ OVERLAYS ═══ */}

      <ASCallNextSheet
        isOpen={isCallNextSheetOpen}
        onClose={() => setIsCallNextSheetOpen(false)}
        doctors={doctors}
        waitingByDoctor={waitingByDoctor}
        unassignedWaiting={unassignedWaiting}
        onCallNextForDoctor={onCallNextForDoctor}
        onCallNextGlobal={onCallNext}
        isCallingNext={isCallingNext}
      />

      <ASAddPatientDrawer
        isOpen={isAddSheetOpen}
        onClose={() => setIsAddSheetOpen(false)}
        doctors={doctors}
      />

      <ASSettingsPanel
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        clinic={clinic}
      />

      <ASPatientDetailDrawer
        isOpen={detailPatientId !== null}
        onClose={() => setDetailPatientId(null)}
        entry={detailPatient || null}
        doctors={doctors}
        onMarkUrgent={onMarkUrgent}
        onTransfer={(id) => { setDetailPatientId(null); setTransferPatientId(id); }}
        onMarkNoShow={patientActions.markNoShow}
        onCallIn={patientActions.callIn}
        onMarkDone={patientActions.markDone}
        onRemove={onRemovePatient}
        variant="desktop"
      />

      <ASTransferPatientSheet
        isOpen={transferPatientId !== null}
        onClose={() => setTransferPatientId(null)}
        patient={transferPatient || null}
        doctors={doctors}
        waitingByDoctor={waitingByDoctor}
        onTransfer={(patientId, targetDoctorId) => {
          patientActions.transferToDoctor(patientId, targetDoctorId);
          setTransferPatientId(null);
        }}
      />
    </div>
  );
}
