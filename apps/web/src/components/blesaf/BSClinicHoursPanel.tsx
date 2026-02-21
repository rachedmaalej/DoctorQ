import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { api } from '@/lib/api';
import type { ClinicHours, ClinicHoursDay } from '@/types';
import '@/components/receptionist/receptionist.css';

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

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

export default function BSClinicHoursPanel({ isOpen, onClose }: BSClinicHoursPanelProps) {
  const { clinic } = useAuthStore();
  const [hours, setHours] = useState<ClinicHours>(DEFAULT_HOURS);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialLoadRef = useRef(true);

  // Load hours from clinic data
  useEffect(() => {
    if (clinic) {
      initialLoadRef.current = true;
      if (clinic.clinicHours && Object.keys(clinic.clinicHours).length > 0) {
        // Merge with defaults so every day key exists
        const merged: ClinicHours = {};
        for (const day of DAYS) {
          const saved = clinic.clinicHours[day.key];
          merged[day.key] = saved
            ? { ...DEFAULT_HOURS[day.key], ...saved }
            : { ...DEFAULT_HOURS[day.key] };
        }
        setHours(merged);
      } else {
        setHours(DEFAULT_HOURS);
      }
    }
  }, [clinic]);

  // Escape key handler
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape' && isOpen) onClose(); };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [isOpen, onClose]);

  // Save function
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

  // Debounced save triggered on hours change
  useEffect(() => {
    if (initialLoadRef.current) {
      initialLoadRef.current = false;
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      save(hours);
    }, 500);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [hours, save]);

  // Update a single day field
  const updateDay = useCallback((dayKey: string, updates: Partial<ClinicHoursDay>) => {
    setHours(prev => ({
      ...prev,
      [dayKey]: { ...prev[dayKey], ...updates },
    }));
  }, []);

  // Toggle day enabled/disabled
  const toggleDay = useCallback((dayKey: string) => {
    setHours(prev => ({
      ...prev,
      [dayKey]: { ...prev[dayKey], enabled: !prev[dayKey].enabled },
    }));
  }, []);

  // Toggle lunch break for a day
  const toggleLunch = useCallback((dayKey: string) => {
    setHours(prev => {
      const day = prev[dayKey];
      const hasLunch = day.lunchStart != null && day.lunchEnd != null;
      return {
        ...prev,
        [dayKey]: {
          ...day,
          lunchStart: hasLunch ? null : '12:00',
          lunchEnd: hasLunch ? null : '13:00',
        },
      };
    });
  }, []);

  // Determine if currently open
  const isCurrentlyOpen = useMemo(() => {
    const now = new Date();
    // Get current time in Africa/Tunis
    const tunisTime = new Date(now.toLocaleString('en-US', { timeZone: 'Africa/Tunis' }));
    const dayIndex = tunisTime.getDay(); // 0=Sun, 1=Mon...
    // Map JS day to our DAYS array: Mon=0, Tue=1... Sun=6
    const dayMap = [6, 0, 1, 2, 3, 4, 5]; // JS Sun=0 -> our index 6
    const todayKey = DAYS[dayMap[dayIndex]].key;
    const today = hours[todayKey];

    if (!today || !today.enabled || !today.open || !today.close) return false;

    const currentMins = tunisTime.getHours() * 60 + tunisTime.getMinutes();
    const openMins = timeToMinutes(today.open);
    const closeMins = timeToMinutes(today.close);

    if (currentMins < openMins || currentMins >= closeMins) return false;

    // Check if during lunch break
    if (today.lunchStart && today.lunchEnd) {
      const lunchStartMins = timeToMinutes(today.lunchStart);
      const lunchEndMins = timeToMinutes(today.lunchEnd);
      if (currentMins >= lunchStartMins && currentMins < lunchEndMins) return false;
    }

    return true;
  }, [hours]);

  // Inline styles for time inputs
  const timeInputStyle: React.CSSProperties = {
    background: '#F6F5F0',
    border: '1px solid #E8E6DF',
    borderRadius: 6,
    padding: '4px 8px',
    fontSize: 12,
    fontWeight: 600,
    color: '#1A1A1A',
    outline: 'none',
    width: 80,
    textAlign: 'center' as const,
    transition: 'border-color 0.2s, background 0.2s',
  };

  return (
    <>
      {isOpen && <div className="bs-panel-backdrop" onClick={onClose} />}

      <div className={`bs-right-panel ${isOpen ? 'open' : ''}`} style={{ zIndex: 95 }}>
        <div className="bs-panel-header">
          <button onClick={onClose} className="bs-panel-back">
            <span className="material-symbols-rounded" style={{ fontSize: 22 }}>arrow_back</span>
          </button>
          <span className="bs-panel-title">Horaires du cabinet</span>
        </div>

        <div className="bs-panel-body">
          {/* Status card */}
          <div style={{
            background: '#FFF',
            border: '1px solid #E8E6DF',
            borderRadius: 12,
            padding: '14px 16px',
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: isCurrentlyOpen ? '#E8F5EE' : '#FDECEA',
              flexShrink: 0,
              position: 'relative',
            }}>
              <div style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: isCurrentlyOpen ? '#2D8B4E' : '#D94F3B',
              }} />
              {isCurrentlyOpen && (
                <div style={{
                  position: 'absolute',
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  background: '#2D8B4E',
                  animation: 'pulse 2s infinite',
                  opacity: 0.4,
                }} />
              )}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#1A1A1A' }}>
                {isCurrentlyOpen ? 'Actuellement ouvert' : 'Actuellement ferm\u00e9'}
              </div>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                marginTop: 4,
                fontSize: 10,
                fontWeight: 600,
                padding: '2px 8px',
                borderRadius: 100,
                background: '#F6F5F0',
                color: '#9E9B90',
              }}>
                <span className="material-symbols-rounded" style={{ fontSize: 12 }}>public</span>
                Africa/Tunis
              </div>
            </div>
          </div>

          {/* Auto-save indicator */}
          {autoSaveStatus !== 'idle' && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
              padding: '6px 0',
              marginBottom: 8,
              fontSize: 11,
              fontWeight: 500,
              color: autoSaveStatus === 'error' ? '#D94F3B' : '#2D8B4E',
            }}>
              <span className="material-symbols-rounded" style={{ fontSize: 14 }}>
                {autoSaveStatus === 'saving' ? 'sync' : autoSaveStatus === 'saved' ? 'check_circle' : 'error'}
              </span>
              {autoSaveStatus === 'saving' && 'Enregistrement...'}
              {autoSaveStatus === 'saved' && 'Modifications enregistr\u00e9es'}
              {autoSaveStatus === 'error' && "Erreur lors de l'enregistrement"}
            </div>
          )}

          {/* Weekly schedule */}
          <div className="bs-settings-label">Horaires hebdomadaires</div>
          <div className="bs-settings-group" style={{ padding: 0, overflow: 'hidden' }}>
            {DAYS.map((day, idx) => {
              const d = hours[day.key];
              const hasLunch = d.lunchStart != null && d.lunchEnd != null;

              return (
                <div key={day.key}>
                  {/* Day row */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '10px 14px',
                    borderTop: idx > 0 ? '1px solid #E8E6DF' : 'none',
                    opacity: d.enabled ? 1 : 0.5,
                    transition: 'opacity 0.2s',
                  }}>
                    {/* Day name */}
                    <div style={{
                      width: 70,
                      fontSize: 13,
                      fontWeight: 600,
                      color: '#1A1A1A',
                      flexShrink: 0,
                    }}>
                      {day.label}
                    </div>

                    {/* Time inputs or Ferm\u00e9 label */}
                    <div style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      minWidth: 0,
                    }}>
                      {d.enabled ? (
                        <>
                          <input
                            type="time"
                            value={d.open || '08:00'}
                            onChange={(e) => updateDay(day.key, { open: e.target.value })}
                            style={timeInputStyle}
                            onFocus={(e) => {
                              e.currentTarget.style.borderColor = '#0F7B6C';
                              e.currentTarget.style.background = '#FFF';
                            }}
                            onBlur={(e) => {
                              e.currentTarget.style.borderColor = '#E8E6DF';
                              e.currentTarget.style.background = '#F6F5F0';
                            }}
                          />
                          <span style={{ fontSize: 11, color: '#9E9B90', fontWeight: 500 }}>\u2013</span>
                          <input
                            type="time"
                            value={d.close || '17:00'}
                            onChange={(e) => updateDay(day.key, { close: e.target.value })}
                            style={timeInputStyle}
                            onFocus={(e) => {
                              e.currentTarget.style.borderColor = '#0F7B6C';
                              e.currentTarget.style.background = '#FFF';
                            }}
                            onBlur={(e) => {
                              e.currentTarget.style.borderColor = '#E8E6DF';
                              e.currentTarget.style.background = '#F6F5F0';
                            }}
                          />
                        </>
                      ) : (
                        <span style={{
                          fontSize: 12,
                          fontWeight: 500,
                          color: '#9E9B90',
                          fontStyle: 'italic',
                        }}>
                          Ferm\u00e9
                        </span>
                      )}
                    </div>

                    {/* Toggle switch (mini 38x20) */}
                    <div
                      onClick={() => toggleDay(day.key)}
                      style={{
                        width: 38,
                        height: 20,
                        borderRadius: 10,
                        position: 'relative',
                        cursor: 'pointer',
                        flexShrink: 0,
                        background: d.enabled ? '#0F7B6C' : '#E8E6DF',
                        transition: 'background 0.2s',
                      }}
                    >
                      <div style={{
                        position: 'absolute',
                        top: 2,
                        width: 16,
                        height: 16,
                        borderRadius: '50%',
                        background: '#FFF',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
                        left: d.enabled ? 20 : 2,
                        transition: 'left 0.2s',
                      }} />
                    </div>
                  </div>

                  {/* Lunch break section (only for enabled days) */}
                  {d.enabled && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '8px 14px 10px',
                      borderTop: '1px dashed #E8E6DF',
                      marginLeft: 14,
                      marginRight: 14,
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        width: 70,
                        flexShrink: 0,
                      }}>
                        <span className="material-symbols-rounded" style={{ fontSize: 14, color: '#9E9B90' }}>
                          restaurant
                        </span>
                        <span style={{ fontSize: 10, fontWeight: 500, color: '#9E9B90' }}>
                          Pause
                        </span>
                      </div>

                      <div style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        minWidth: 0,
                      }}>
                        {hasLunch ? (
                          <>
                            <input
                              type="time"
                              value={d.lunchStart || '12:00'}
                              onChange={(e) => updateDay(day.key, { lunchStart: e.target.value })}
                              style={{ ...timeInputStyle, fontSize: 11, padding: '3px 6px', width: 74 }}
                              onFocus={(e) => {
                                e.currentTarget.style.borderColor = '#0F7B6C';
                                e.currentTarget.style.background = '#FFF';
                              }}
                              onBlur={(e) => {
                                e.currentTarget.style.borderColor = '#E8E6DF';
                                e.currentTarget.style.background = '#F6F5F0';
                              }}
                            />
                            <span style={{ fontSize: 10, color: '#9E9B90', fontWeight: 500 }}>\u2013</span>
                            <input
                              type="time"
                              value={d.lunchEnd || '13:00'}
                              onChange={(e) => updateDay(day.key, { lunchEnd: e.target.value })}
                              style={{ ...timeInputStyle, fontSize: 11, padding: '3px 6px', width: 74 }}
                              onFocus={(e) => {
                                e.currentTarget.style.borderColor = '#0F7B6C';
                                e.currentTarget.style.background = '#FFF';
                              }}
                              onBlur={(e) => {
                                e.currentTarget.style.borderColor = '#E8E6DF';
                                e.currentTarget.style.background = '#F6F5F0';
                              }}
                            />
                          </>
                        ) : (
                          <span style={{ fontSize: 10, color: '#9E9B90', fontStyle: 'italic' }}>
                            Pas de pause
                          </span>
                        )}
                      </div>

                      {/* Lunch toggle (mini) */}
                      <div
                        onClick={() => toggleLunch(day.key)}
                        style={{
                          width: 38,
                          height: 20,
                          borderRadius: 10,
                          position: 'relative',
                          cursor: 'pointer',
                          flexShrink: 0,
                          background: hasLunch ? '#0F7B6C' : '#E8E6DF',
                          transition: 'background 0.2s',
                        }}
                      >
                        <div style={{
                          position: 'absolute',
                          top: 2,
                          width: 16,
                          height: 16,
                          borderRadius: '50%',
                          background: '#FFF',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
                          left: hasLunch ? 20 : 2,
                          transition: 'left 0.2s',
                        }} />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Help text */}
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 8,
            marginTop: 16,
            padding: '12px 14px',
            background: '#F6F5F0',
            borderRadius: 10,
          }}>
            <span className="material-symbols-rounded" style={{
              fontSize: 16,
              color: '#9E9B90',
              flexShrink: 0,
              marginTop: 1,
            }}>
              info
            </span>
            <span style={{ fontSize: 11, color: '#9E9B90', lineHeight: 1.5 }}>
              {"Les horaires sont affich\u00e9s aux patients sur la page d'enregistrement et la page de statut."}
            </span>
          </div>
        </div>
      </div>

      {/* Pulse animation for open status indicator */}
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
