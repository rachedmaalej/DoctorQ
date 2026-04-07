import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { api } from '@/lib/api';
import { webBrand } from '@/lib/brand';
import type { ClinicHours, ClinicHoursDay } from '@/types';
import BSClosuresSubPanel from './BSClosuresSubPanel';
import '@/components/receptionist/receptionist.css';

const CLINIC_TIMEZONE = webBrand.country === 'FR' ? 'Europe/Paris' : 'Africa/Tunis';

interface BSClinicHoursPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const DAYS = [
  { key: 'monday', label: 'Lundi' },
  { key: 'tuesday', label: 'Mardi' },
  { key: 'wednesday', label: 'Mercredi' },
  { key: 'thursday', label: 'Jeudi' },
  { key: 'friday', label: 'Vendredi' },
  { key: 'saturday', label: 'Samedi' },
  { key: 'sunday', label: 'Dimanche' },
] as const;

const DEFAULT_HOURS: ClinicHours = {
  monday:    { enabled: true,  open: '08:00', close: '17:00', lunchStart: '12:00', lunchEnd: '13:00' },
  tuesday:   { enabled: true,  open: '08:00', close: '17:00', lunchStart: '12:00', lunchEnd: '13:00' },
  wednesday: { enabled: true,  open: '08:00', close: '17:00', lunchStart: '12:00', lunchEnd: '13:00' },
  thursday:  { enabled: true,  open: '08:00', close: '17:00', lunchStart: '12:00', lunchEnd: '13:00' },
  friday:    { enabled: true,  open: '08:00', close: '17:00', lunchStart: '12:00', lunchEnd: '13:00' },
  saturday:  { enabled: false, open: '08:00', close: '12:00', lunchStart: null,    lunchEnd: null },
  sunday:    { enabled: false, open: '08:00', close: '12:00', lunchStart: null,    lunchEnd: null },
};

// ── Time helpers ──
const MIN_MINS = 360;  // 06:00
const MAX_MINS = 1260; // 21:00
const SNAP = 15;       // 15-min increments

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

function minutesToTime(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function snapTo(mins: number): number {
  return Math.round(mins / SNAP) * SNAP;
}

function pct(mins: number): number {
  return ((mins - MIN_MINS) / (MAX_MINS - MIN_MINS)) * 100;
}

function minsFromPct(pctVal: number): number {
  return MIN_MINS + (pctVal / 100) * (MAX_MINS - MIN_MINS);
}

// ── Draggable handle hook ──
function useDragHandle(
  trackRef: React.RefObject<HTMLDivElement>,
  currentMins: number,
  minMins: number,
  maxMins: number,
  onChange: (mins: number) => void,
) {
  const isDragging = useRef(false);

  const getMinutesFromEvent = useCallback((clientX: number) => {
    const track = trackRef.current;
    if (!track) return currentMins;
    const rect = track.getBoundingClientRect();
    const pctVal = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
    const raw = minsFromPct(pctVal);
    return Math.max(minMins, Math.min(maxMins, snapTo(raw)));
  }, [trackRef, currentMins, minMins, maxMins]);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    isDragging.current = true;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging.current) return;
    const mins = getMinutesFromEvent(e.clientX);
    onChange(mins);
  }, [getMinutesFromEvent, onChange]);

  const handlePointerUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  return { handlePointerDown, handlePointerMove, handlePointerUp };
}

// ── DaySlider component ──
function DaySlider({
  day,
  onUpdate,
}: {
  day: ClinicHoursDay;
  onUpdate: (updates: Partial<ClinicHoursDay>) => void;
}) {
  const trackRef = useRef<HTMLDivElement>(null);

  const openMins = timeToMinutes(day.open || '08:00');
  const closeMins = timeToMinutes(day.close || '17:00');
  const hasBreak = day.lunchStart != null && day.lunchEnd != null;
  const breakStartMins = hasBreak ? timeToMinutes(day.lunchStart!) : 0;
  const breakEndMins = hasBreak ? timeToMinutes(day.lunchEnd!) : 0;

  const openDrag = useDragHandle(trackRef, openMins, MIN_MINS, (hasBreak ? breakStartMins - SNAP : closeMins - SNAP), (m) => onUpdate({ open: minutesToTime(m) }));
  const closeDrag = useDragHandle(trackRef, closeMins, (hasBreak ? breakEndMins + SNAP : openMins + SNAP), MAX_MINS, (m) => onUpdate({ close: minutesToTime(m) }));
  const breakStartDrag = useDragHandle(trackRef, breakStartMins, openMins + SNAP, breakEndMins - SNAP, (m) => onUpdate({ lunchStart: minutesToTime(m) }));
  const breakEndDrag = useDragHandle(trackRef, breakEndMins, breakStartMins + SNAP, closeMins - SNAP, (m) => onUpdate({ lunchEnd: minutesToTime(m) }));

  const pO = pct(openMins);
  const pC = pct(closeMins);
  const pBS = hasBreak ? pct(breakStartMins) : 0;
  const pBE = hasBreak ? pct(breakEndMins) : 0;

  const handleStyle = (left: number, accent: boolean, size = 14): React.CSSProperties => ({
    position: 'absolute',
    left: `${left}%`,
    top: accent ? 2 : 3,
    width: size,
    height: size,
    borderRadius: '50%',
    background: accent ? '#0F7B6C' : '#D4920B',
    border: '2px solid white',
    boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
    transform: 'translateX(-50%)',
    cursor: 'grab',
    touchAction: 'none',
    zIndex: 3,
  });

  return (
    <div>
      {/* Track */}
      <div
        ref={trackRef as React.RefObject<HTMLDivElement>}
        style={{ position: 'relative', height: 20, margin: '0 6px', touchAction: 'none' }}
      >
        {/* Background track */}
        <div style={{ position: 'absolute', top: 7, left: 0, right: 0, height: 6, background: '#E8E6DF', borderRadius: 3 }} />

        {hasBreak ? (
          <>
            {/* Morning segment */}
            <div style={{ position: 'absolute', top: 7, left: `${pO}%`, width: `${pBS - pO}%`, height: 6, background: '#0F7B6C', borderRadius: '3px 0 0 3px' }} />
            {/* Break gap */}
            <div style={{ position: 'absolute', top: 5, left: `${pBS}%`, width: `${pBE - pBS}%`, height: 10, background: '#FEF7E6', border: '1px dashed #D4920B', borderRadius: 3 }} />
            {/* Afternoon segment */}
            <div style={{ position: 'absolute', top: 7, left: `${pBE}%`, width: `${pC - pBE}%`, height: 6, background: '#0F7B6C', borderRadius: '0 3px 3px 0' }} />
          </>
        ) : (
          /* Full bar */
          <div style={{ position: 'absolute', top: 7, left: `${pO}%`, width: `${pC - pO}%`, height: 6, background: '#0F7B6C', borderRadius: 3 }} />
        )}

        {/* Open handle */}
        <div style={handleStyle(pO, true)} onPointerDown={openDrag.handlePointerDown} onPointerMove={openDrag.handlePointerMove} onPointerUp={openDrag.handlePointerUp} />
        {/* Close handle */}
        <div style={handleStyle(pC, true)} onPointerDown={closeDrag.handlePointerDown} onPointerMove={closeDrag.handlePointerMove} onPointerUp={closeDrag.handlePointerUp} />

        {/* Break handles */}
        {hasBreak && (
          <>
            <div style={handleStyle(pBS, false, 12)} onPointerDown={breakStartDrag.handlePointerDown} onPointerMove={breakStartDrag.handlePointerMove} onPointerUp={breakStartDrag.handlePointerUp} />
            <div style={handleStyle(pBE, false, 12)} onPointerDown={breakEndDrag.handlePointerDown} onPointerMove={breakEndDrag.handlePointerMove} onPointerUp={breakEndDrag.handlePointerUp} />
          </>
        )}
      </div>

      {/* Time labels */}
      <div style={{ display: 'flex', justifyContent: 'space-between', margin: '4px 6px 0', fontSize: 10, fontWeight: 600 }}>
        <span style={{ color: '#0F7B6C' }}>{day.open || '08:00'}</span>
        {hasBreak && (
          <span style={{ color: '#D4920B' }}>{day.lunchStart} – {day.lunchEnd}</span>
        )}
        <span style={{ color: '#0F7B6C' }}>{day.close || '17:00'}</span>
      </div>
    </div>
  );
}

// ── Main panel ──
export default function BSClinicHoursPanel({ isOpen, onClose }: BSClinicHoursPanelProps) {
  const { clinic } = useAuthStore();
  const [hours, setHours] = useState<ClinicHours>(DEFAULT_HOURS);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [showClosures, setShowClosures] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialLoadRef = useRef(true);

  useEffect(() => {
    if (clinic) {
      initialLoadRef.current = true;
      if (clinic.clinicHours && Object.keys(clinic.clinicHours).length > 0) {
        const merged: ClinicHours = {};
        for (const day of DAYS) {
          const saved = clinic.clinicHours[day.key];
          merged[day.key] = saved ? { ...DEFAULT_HOURS[day.key], ...saved } : { ...DEFAULT_HOURS[day.key] };
        }
        setHours(merged);
      } else {
        setHours(DEFAULT_HOURS);
      }
    }
  }, [clinic]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape' && isOpen) onClose(); };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [isOpen, onClose]);

  const save = useCallback(async (data: ClinicHours) => {
    setAutoSaveStatus('saving');
    try {
      await api.updateClinic({ clinicHours: data as Record<string, unknown> });
      setAutoSaveStatus('saved');
      setTimeout(() => setAutoSaveStatus('idle'), 2000);
    } catch {
      setAutoSaveStatus('error');
      setTimeout(() => setAutoSaveStatus('idle'), 3000);
    }
  }, []);

  useEffect(() => {
    if (initialLoadRef.current) { initialLoadRef.current = false; return; }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => save(hours), 500);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [hours, save]);

  const updateDay = useCallback((dayKey: string, updates: Partial<ClinicHoursDay>) => {
    setHours(prev => ({ ...prev, [dayKey]: { ...prev[dayKey], ...updates } }));
  }, []);

  const toggleDay = useCallback((dayKey: string) => {
    setHours(prev => ({ ...prev, [dayKey]: { ...prev[dayKey], enabled: !prev[dayKey].enabled } }));
  }, []);

  const toggleLunch = useCallback((dayKey: string) => {
    setHours(prev => {
      const day = prev[dayKey];
      const hasLunch = day.lunchStart != null && day.lunchEnd != null;
      return { ...prev, [dayKey]: { ...day, lunchStart: hasLunch ? null : '12:00', lunchEnd: hasLunch ? null : '13:00' } };
    });
  }, []);

  const isCurrentlyOpen = useMemo(() => {
    const now = new Date();
    const localTime = new Date(now.toLocaleString('en-US', { timeZone: CLINIC_TIMEZONE }));
    const dayMap = [6, 0, 1, 2, 3, 4, 5];
    const todayKey = DAYS[dayMap[localTime.getDay()]].key;
    const today = hours[todayKey];
    if (!today?.enabled || !today.open || !today.close) return false;
    const currentMins = localTime.getHours() * 60 + localTime.getMinutes();
    const openMins = timeToMinutes(today.open);
    const closeMins = timeToMinutes(today.close);
    if (currentMins < openMins || currentMins >= closeMins) return false;
    if (today.lunchStart && today.lunchEnd) {
      if (currentMins >= timeToMinutes(today.lunchStart) && currentMins < timeToMinutes(today.lunchEnd)) return false;
    }
    return true;
  }, [hours]);

  return (
    <>
      {isOpen && <div className="bs-panel-backdrop" onClick={onClose} style={{ zIndex: 219 }} />}

      <div className={`bs-right-panel ${isOpen ? 'open' : ''}`} style={{ zIndex: 220, maxWidth: 430, width: '100%' }}>
        <div className="bs-panel-header">
          <button onClick={onClose} className="bs-panel-back">
            <span className="material-symbols-rounded" style={{ fontSize: 22 }}>arrow_back</span>
          </button>
          <span className="bs-panel-title">Horaires du cabinet</span>
        </div>

        <div className="bs-panel-body">
          {/* Status card */}
          <div style={{ background: '#FFF', border: '1px solid #E8E6DF', borderRadius: 12, padding: '14px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: isCurrentlyOpen ? '#E8F5EE' : '#FDECEA', flexShrink: 0, position: 'relative' }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: isCurrentlyOpen ? '#2D8B4E' : '#D94F3B' }} />
              {isCurrentlyOpen && <div style={{ position: 'absolute', width: 10, height: 10, borderRadius: '50%', background: '#2D8B4E', animation: 'pulse 2s infinite', opacity: 0.4 }} />}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#1A1A1A' }}>
                {isCurrentlyOpen ? 'Actuellement ouvert' : 'Actuellement fermé'}
              </div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 4, fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 100, background: '#F6F5F0', color: '#9E9B90' }}>
                <span className="material-symbols-rounded" style={{ fontSize: 12 }}>public</span>
                {CLINIC_TIMEZONE}
              </div>
            </div>
          </div>

          {autoSaveStatus !== 'idle' && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, padding: '6px 0', marginBottom: 8, fontSize: 11, fontWeight: 500, color: autoSaveStatus === 'error' ? '#D94F3B' : '#2D8B4E' }}>
              <span className="material-symbols-rounded" style={{ fontSize: 14 }}>
                {autoSaveStatus === 'saving' ? 'sync' : autoSaveStatus === 'saved' ? 'check_circle' : 'error'}
              </span>
              {autoSaveStatus === 'saving' && 'Enregistrement...'}
              {autoSaveStatus === 'saved' && 'Modifications enregistrées'}
              {autoSaveStatus === 'error' && "Erreur lors de l'enregistrement"}
            </div>
          )}

          {/* Legend */}
          <div style={{ display: 'flex', gap: 14, alignItems: 'center', padding: '0 14px 8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, fontWeight: 600, color: '#9E9B90' }}>
              <div style={{ width: 12, height: 6, borderRadius: 3, background: '#0F7B6C' }} /> Ouvert
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, fontWeight: 600, color: '#9E9B90' }}>
              <div style={{ width: 12, height: 6, borderRadius: 3, background: '#D4920B' }} /> Pause
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, fontWeight: 600, color: '#9E9B90' }}>
              <div style={{ width: 12, height: 6, borderRadius: 3, background: '#E8E6DF' }} /> Fermé
            </div>
          </div>

          {/* Weekly schedule with sliders */}
          <div className="bs-settings-label">Horaires hebdomadaires</div>
          <div className="bs-settings-group" style={{ padding: 0, overflow: 'hidden' }}>
            {DAYS.map((day, idx) => {
              const d = hours[day.key];
              const hasLunch = d.lunchStart != null && d.lunchEnd != null;

              return (
                <div key={day.key} style={{ borderTop: idx > 0 ? '1px solid #E8E6DF' : 'none' }}>
                  {/* Day header */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', opacity: d.enabled ? 1 : 0.5, transition: 'opacity 0.2s' }}>
                    <div style={{ width: 75, fontSize: 13, fontWeight: 600, color: '#1A1A1A', flexShrink: 0 }}>
                      {day.label}
                    </div>
                    <div style={{ flex: 1, fontSize: 12, fontWeight: 600, color: d.enabled ? '#0F7B6C' : '#9E9B90' }}>
                      {d.enabled ? `${d.open || '08:00'} – ${d.close || '17:00'}` : 'Fermé'}
                    </div>
                    {/* Day toggle */}
                    <div
                      onClick={() => toggleDay(day.key)}
                      style={{ width: 38, height: 20, borderRadius: 10, position: 'relative', cursor: 'pointer', flexShrink: 0, background: d.enabled ? '#0F7B6C' : '#E8E6DF', transition: 'background 0.2s' }}
                    >
                      <div style={{ position: 'absolute', top: 2, width: 16, height: 16, borderRadius: '50%', background: '#FFF', boxShadow: '0 1px 3px rgba(0,0,0,0.15)', left: d.enabled ? 20 : 2, transition: 'left 0.2s' }} />
                    </div>
                  </div>

                  {/* Slider (only when enabled) */}
                  {d.enabled && (
                    <div style={{ padding: '0 14px 6px' }}>
                      <DaySlider
                        day={d}
                        onUpdate={(updates) => updateDay(day.key, updates)}
                      />
                      {/* Break toggle */}
                      <div
                        onClick={() => toggleLunch(day.key)}
                        style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6, padding: '5px 8px', borderRadius: 6, background: hasLunch ? '#FEF7E6' : '#F6F5F0', cursor: 'pointer', transition: 'background 0.15s' }}
                      >
                        <span className="material-symbols-rounded" style={{ fontSize: 14, color: hasLunch ? '#D4920B' : '#9E9B90' }}>restaurant</span>
                        <span style={{ fontSize: 10, fontWeight: 600, color: hasLunch ? '#D4920B' : '#9E9B90', flex: 1 }}>
                          {hasLunch ? `Pause ${d.lunchStart} – ${d.lunchEnd}` : 'Ajouter une pause'}
                        </span>
                        <div style={{ width: 30, height: 16, borderRadius: 8, background: hasLunch ? '#D4920B' : '#E8E6DF', position: 'relative', flexShrink: 0 }}>
                          <div style={{ position: 'absolute', top: 2, left: hasLunch ? 16 : 2, width: 12, height: 12, borderRadius: '50%', background: 'white', boxShadow: '0 1px 2px rgba(0,0,0,0.15)', transition: 'left 0.2s' }} />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Closures button */}
          <button
            onClick={() => setShowClosures(true)}
            style={{ width: '100%', marginTop: 16, padding: '14px 16px', background: '#FFF', border: '1px solid #E8E6DF', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', fontFamily: 'inherit', transition: 'border-color 0.15s' }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = '#D94F3B')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = '#E8E6DF')}
          >
            <div style={{ width: 36, height: 36, borderRadius: 10, background: '#FDF0ED', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span className="material-symbols-rounded" style={{ fontSize: 20, color: '#D94F3B' }}>event_busy</span>
            </div>
            <div style={{ flex: 1, textAlign: 'left' }}>
              <div style={{ fontSize: 14, fontWeight: 500, color: '#1A1A1A' }}>Jours fériés & congés</div>
              <div style={{ fontSize: 12, color: '#9E9B90', marginTop: 1 }}>Fermetures exceptionnelles, vacances</div>
            </div>
            <span className="material-symbols-rounded" style={{ fontSize: 18, color: '#D4D2CC' }}>chevron_right</span>
          </button>

          {/* Help text */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginTop: 16, padding: '12px 14px', background: '#F6F5F0', borderRadius: 10 }}>
            <span className="material-symbols-rounded" style={{ fontSize: 16, color: '#9E9B90', flexShrink: 0, marginTop: 1 }}>info</span>
            <span style={{ fontSize: 11, color: '#9E9B90', lineHeight: 1.5 }}>
              {"Les horaires sont affichés aux patients sur la page d'enregistrement et la page de statut."}
            </span>
          </div>
        </div>
      </div>

      <BSClosuresSubPanel isOpen={showClosures} onClose={() => setShowClosures(false)} />

      <style>{`
        @keyframes pulse {
          0% { transform: scale(1); opacity: 0.4; }
          50% { transform: scale(2.2); opacity: 0; }
          100% { transform: scale(1); opacity: 0; }
        }
      `}</style>
    </>
  );
}
