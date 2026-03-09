import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import type { QueueEntry, QueueStats, Doctor, ScheduleSlot } from '@/types';
import { useAuthStore } from '@/stores/authStore';
import { useWaitingRoom } from '@/hooks/useWaitingRoom';
import { useScheduleView } from '@/hooks/useScheduleView';
import { useDoctorActions } from '@/hooks/useDoctorActions';
import { usePatientActions } from '@/hooks/usePatientActions';
import { api } from '@/lib/api';
import './ausuivant.css';

import ASTopbar from './ASTopbar';
import ASDoctorStatusBar from './ASDoctorStatusBar';
import ASDoctorActionPanel from './ASDoctorActionPanel';
import ASSessionControls from './ASSessionControls';
import type { DashboardView } from './ASSessionControls';
import ASWaitingRoom from './ASWaitingRoom';
import ASScheduleTimeline from './ASScheduleTimeline';
import ASNoShowBanner from './ASNoShowBanner';
import ASDoctolibImportBanner, { isDoctolibBannerDismissed } from './ASDoctolibImportBanner';
import ASQuickActionBar from './ASQuickActionBar';
import ASCallNextSheet from './ASCallNextSheet';
import ASAddPatientSheet from './ASAddPatientSheet';
import ASSettingsPanel from './ASSettingsPanel';
import ASTransferPatientSheet from './ASTransferPatientSheet';
import ASPatientDetailDrawer from './ASPatientDetailDrawer';
import ASManualRDVSheet from './ASManualRDVSheet';
import ASIcsImportSheet from './ASIcsImportSheet';

interface AuSuivantDashboardProps {
  queue: QueueEntry[];
  stats: QueueStats | null;
  doctors: Doctor[];
  onCallNext: () => void;
  onCallNextForDoctor: (doctorId: string) => void;
  onRemovePatient: (id: string) => void;
  onMarkUrgent: (id: string) => void;
  isCallingNext: boolean;
  isDoctorPresent: boolean;
  onToggleDoctorPresent?: () => void;
  isTogglingPresence?: boolean;
  onRefreshDoctors?: () => void;
}

export default function AuSuivantDashboard({
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
}: AuSuivantDashboardProps) {
  const { clinic } = useAuthStore();
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCallNextSheetOpen, setIsCallNextSheetOpen] = useState(false);
  const [quickAddInput, setQuickAddInput] = useState('');
  const [quickAddInitialFirst, setQuickAddInitialFirst] = useState('');
  const [quickAddInitialLast, setQuickAddInitialLast] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestionIdx, setSelectedSuggestionIdx] = useState(-1);
  const quickAddRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const [activeView, setActiveView] = useState<DashboardView>('queue');
  const [scheduleSlots, setScheduleSlots] = useState<ScheduleSlot[]>([]);
  const [dismissedNoShows, setDismissedNoShows] = useState<Set<string>>(new Set());
  const [isManualRDVOpen, setIsManualRDVOpen] = useState(false);
  const [isIcsImportOpen, setIsIcsImportOpen] = useState(false);

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

  // ── Quick-add autocomplete: collect known patient names ──
  const STORAGE_KEY = 'as_patient_names';

  const knownNames = useMemo(() => {
    // Gather names from current queue
    const queueNames = queue
      .map((e) => e.patientName)
      .filter((n): n is string => !!n && n.trim().length > 0);

    // Gather names from localStorage (persisted across sessions)
    let storedNames: string[] = [];
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) storedNames = JSON.parse(raw);
    } catch { /* ignore */ }

    // Merge and deduplicate (case-insensitive), keep original casing
    const seen = new Map<string, string>();
    for (const name of [...storedNames, ...queueNames]) {
      const key = name.trim().toLowerCase();
      if (!seen.has(key)) seen.set(key, name.trim());
    }

    // Persist merged set back
    const merged = Array.from(seen.values());
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(merged.slice(-200))); } catch { /* ignore */ }

    return merged;
  }, [queue]);

  const suggestions = useMemo(() => {
    const q = quickAddInput.trim().toLowerCase();
    if (q.length < 1) return [];
    return knownNames
      .filter((n) => n.toLowerCase().includes(q))
      .slice(0, 6);
  }, [quickAddInput, knownNames]);

  const openAddSheetWithName = useCallback((name: string) => {
    const parts = name.trim().split(/\s+/);
    setQuickAddInitialFirst(parts[0] || '');
    setQuickAddInitialLast(parts.slice(1).join(' '));
    setQuickAddInput('');
    setShowSuggestions(false);
    setSelectedSuggestionIdx(-1);
    setIsAddSheetOpen(true);
  }, []);

  const handleQuickAddKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedSuggestionIdx((prev) => Math.min(prev + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedSuggestionIdx((prev) => Math.max(prev - 1, -1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedSuggestionIdx >= 0 && suggestions[selectedSuggestionIdx]) {
        openAddSheetWithName(suggestions[selectedSuggestionIdx]);
      } else {
        openAddSheetWithName(quickAddInput);
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setSelectedSuggestionIdx(-1);
      quickAddRef.current?.blur();
    }
  }, [suggestions, selectedSuggestionIdx, quickAddInput, openAddSheetWithName]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node) &&
        quickAddRef.current && !quickAddRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
        setSelectedSuggestionIdx(-1);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const waitingCount = stats?.waiting ?? allPatients.filter(p => p.status === 'WAITING' || p.status === 'NOTIFIED').length;
  const avgMins = (stats as any)?.effectiveAvgMins || clinic?.avgConsultationMins || 15;
  const hasMultiDoctor = doctors.length > 1;

  // In multi-doctor mode, derive presence from individual doctor states
  const effectiveDoctorPresent = hasMultiDoctor
    ? doctors.some((d) => d.isActive && (d.state === 'free' || d.state === 'consulting'))
    : isDoctorPresent;

  // Doctor actions
  const refreshDoctors = onRefreshDoctors || (() => {});
  const doctorActions = useDoctorActions(refreshDoctors);
  const patientActions = usePatientActions(refreshDoctors);

  // Fetch schedule slots
  const fetchSchedule = useCallback(async () => {
    try {
      const data = await api.getScheduleToday();
      setScheduleSlots(data);
    } catch {
      // Schedule API may not be available yet — silently ignore
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

  const showDoctolibBanner = !hasSchedule && !isDoctolibBannerDismissed();

  return (
    <div className="as-dashboard">
      {/* Topbar */}
      <ASTopbar
        onOpenSettings={() => setIsSettingsOpen(true)}
        isSessionActive={isDoctorPresent}
      />

      {/* View Tabs: Salle / Agenda (moved above doctor cards per B3 layout) */}
      <ASSessionControls
        activeView={activeView}
        onViewChange={setActiveView}
        waitingCount={waitingCount}
      />

      {/* B3 Per-Doctor Cards with KPIs (multi-doctor only) */}
      {hasMultiDoctor && (
        <div style={{ position: 'relative' }}>
          <ASDoctorStatusBar
            doctors={doctors}
            queue={queue}
            waitingByDoctor={waitingByDoctor}
            onDoctorClick={(id) => setActionPanelDoctorId(id === actionPanelDoctorId ? null : id)}
            onCallNextForDoctor={onCallNextForDoctor}
          />

          {/* Doctor Action Panel (positioned absolutely below status bar) */}
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

      {/* No-show banner (shown in both views) */}
      {activeNoShows.length > 0 && (
        <ASNoShowBanner
          noShowCandidates={activeNoShows}
          doctors={doctors}
          onMarkNoShow={handleMarkNoShow}
          onDismiss={handleDismissNoShow}
        />
      )}

      {/* Doctolib import banner (only when no schedule exists) */}
      {showDoctolibBanner && (
        <ASDoctolibImportBanner
          onImportDoctolib={() => setIsIcsImportOpen(true)}
          onManualEntry={() => setIsManualRDVOpen(true)}
          onDismiss={() => {}}
        />
      )}

      {/* Main content: Queue or Schedule view */}
      <div key={activeView} className="as-view-enter">
        {activeView === 'queue' ? (
          <ASWaitingRoom
            patients={allPatients}
            doctors={doctors}
            avgConsultationMins={avgMins}
            onMarkUrgent={onMarkUrgent}
            onRemove={onRemovePatient}
            onCallIn={patientActions.callIn}
            onMarkNoShow={patientActions.markNoShow}
            onTransfer={(id) => setTransferPatientId(id)}
            onComplete={patientActions.markDone}
            completedCount={stats?.seen ?? 0}
            hasDoctors={doctors.length > 0}
            addPatientSlot={
              <div
                className="as-fade-up"
                style={{
                  margin: '0 12px 10px',
                  position: 'relative',
                }}
              >
                <div
                  style={{
                    padding: '6px 10px 6px 14px',
                    background: 'var(--color-surface)',
                    border: '1.5px solid var(--color-border)',
                    borderRadius: 'var(--radius)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                  }}
                >
                  <span
                    className="flex items-center justify-center flex-shrink-0"
                    style={{
                      width: 32, height: 32, borderRadius: 10,
                      background: 'var(--color-primary)', color: 'white',
                    }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4-4v2" /><circle cx="9" cy="7" r="4" /><line x1="19" y1="8" x2="19" y2="14" /><line x1="22" y1="11" x2="16" y2="11" />
                    </svg>
                  </span>
                  <input
                    ref={quickAddRef}
                    type="text"
                    value={quickAddInput}
                    onChange={(e) => {
                      setQuickAddInput(e.target.value);
                      setShowSuggestions(true);
                      setSelectedSuggestionIdx(-1);
                    }}
                    onFocus={() => { if (quickAddInput.trim()) setShowSuggestions(true); }}
                    onKeyDown={handleQuickAddKeyDown}
                    placeholder="Nom du patient..."
                    style={{
                      flex: 1,
                      border: 'none',
                      outline: 'none',
                      background: 'transparent',
                      fontSize: 14,
                      fontWeight: 500,
                      color: 'var(--color-text-primary)',
                      fontFamily: 'inherit',
                      padding: '8px 0',
                    }}
                  />
                </div>

                {/* Autocomplete suggestions dropdown */}
                {showSuggestions && suggestions.length > 0 && (
                  <div
                    ref={suggestionsRef}
                    style={{
                      position: 'absolute',
                      left: 0,
                      right: 0,
                      top: '100%',
                      marginTop: 4,
                      background: 'var(--color-surface)',
                      border: '1.5px solid var(--color-border)',
                      borderRadius: 'var(--radius)',
                      boxShadow: '0 4px 16px rgba(0,0,0,0.10)',
                      zIndex: 50,
                      overflow: 'hidden',
                    }}
                  >
                    {suggestions.map((name, idx) => {
                      const isSelected = idx === selectedSuggestionIdx;
                      // Highlight matching portion
                      const q = quickAddInput.trim().toLowerCase();
                      const matchIdx = name.toLowerCase().indexOf(q);
                      const before = name.slice(0, matchIdx);
                      const match = name.slice(matchIdx, matchIdx + q.length);
                      const after = name.slice(matchIdx + q.length);

                      return (
                        <div
                          key={name}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            openAddSheetWithName(name);
                          }}
                          onMouseEnter={() => setSelectedSuggestionIdx(idx)}
                          style={{
                            padding: '10px 14px',
                            fontSize: 14,
                            fontWeight: 500,
                            cursor: 'pointer',
                            background: isSelected ? 'var(--accent-light, var(--color-surface-alt))' : 'transparent',
                            color: 'var(--color-text-primary)',
                            borderBottom: idx < suggestions.length - 1 ? '1px solid var(--color-border-subtle)' : 'none',
                            transition: 'background 0.1s ease',
                          }}
                        >
                          {before}<strong style={{ color: 'var(--color-primary)' }}>{match}</strong>{after}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            }
          />
        ) : (
          <ASScheduleTimeline
            slots={scheduleSlots}
            walkIns={scheduleView.walkIns}
            doctors={doctors}
            onAssignToSlot={handleAssignToSlot}
            onPatientClick={handlePatientClick}
          />
        )}
      </div>

      {/* Quick Action Bar (fixed bottom) */}
      <ASQuickActionBar
        onAddPatient={() => setIsAddSheetOpen(true)}
        onCallNext={() => {
          // If only one doctor is free (not consulting), skip the picker sheet
          const freeDoctors = doctors.filter(
            (d) => d.isActive && d.state === 'free',
          );
          if (freeDoctors.length === 1) {
            onCallNextForDoctor(freeDoctors[0].id);
          } else if (doctors.filter((d) => d.isActive).length <= 1) {
            // Single-doctor mode: call directly
            const active = doctors.find((d) => d.isActive);
            if (active) onCallNextForDoctor(active.id);
            else onCallNext();
          } else {
            setIsCallNextSheetOpen(true);
          }
        }}
        isCallingNext={isCallingNext}
        disabled={waitingCount === 0 || !effectiveDoctorPresent}
        waitingCount={waitingCount}
      />

      {/* Call Next Sheet (doctor picker) */}
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

      {/* Add Patient Bottom Sheet */}
      <ASAddPatientSheet
        isOpen={isAddSheetOpen}
        onClose={() => {
          setIsAddSheetOpen(false);
          setQuickAddInitialFirst('');
          setQuickAddInitialLast('');
        }}
        doctors={doctors}
        initialFirstName={quickAddInitialFirst}
        initialLastName={quickAddInitialLast}
      />

      {/* Manual RDV Entry Sheet */}
      <ASManualRDVSheet
        isOpen={isManualRDVOpen}
        onClose={() => setIsManualRDVOpen(false)}
        doctors={doctors}
        defaultDuration={clinic?.avgConsultationMins || 15}
        onSlotsCreated={() => { fetchSchedule(); setIsManualRDVOpen(false); }}
      />

      {/* ICS Import Sheet (Doctolib) */}
      <ASIcsImportSheet
        isOpen={isIcsImportOpen}
        onClose={() => setIsIcsImportOpen(false)}
        doctors={doctors}
        defaultDuration={clinic?.avgConsultationMins || 15}
        onSlotsCreated={() => { fetchSchedule(); setIsIcsImportOpen(false); }}
      />

      {/* Settings Panel */}
      <ASSettingsPanel
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        clinic={clinic}
      />

      {/* Patient Detail Drawer (mobile) */}
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
      />

      {/* Transfer Patient Sheet */}
      <ASTransferPatientSheet
        isOpen={transferPatientId !== null}
        onClose={() => setTransferPatientId(null)}
        patient={transferPatient || null}
        doctors={doctors}
        waitingByDoctor={waitingByDoctor}
        onTransfer={(patientId, targetDoctorId) => {
          const source = queue.find(e => e.id === patientId);
          patientActions.transferToDoctor(patientId, targetDoctorId, source?.doctorId || '');
          setTransferPatientId(null);
        }}
      />
    </div>
  );
}
