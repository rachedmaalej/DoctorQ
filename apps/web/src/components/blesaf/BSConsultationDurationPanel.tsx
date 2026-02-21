import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { api } from '@/lib/api';
import type { Doctor } from '@/types';
import '@/components/receptionist/receptionist.css';

interface BSConsultationDurationPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const RING_RADIUS = 52;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;
const MIN_DURATION = 5;
const MAX_DURATION = 60;
const QUEUE_SIZE = 5;

const DOCTOR_COLORS = ['#0F7B6C', '#3B7DD9', '#D4920B', '#9B59B6', '#D94F3B', '#2D8B4E'];

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export default function BSConsultationDurationPanel({ isOpen, onClose }: BSConsultationDurationPanelProps) {
  const { clinic } = useAuthStore();
  const [avgMins, setAvgMins] = useState(10);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const savedRef = useRef(10);

  // Per-doctor state
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [doctorDurations, setDoctorDurations] = useState<Record<string, number>>({});
  const savedDoctorDurationsRef = useRef<Record<string, number>>({});
  const [loadingDoctors, setLoadingDoctors] = useState(false);

  // Sync clinic value
  useEffect(() => {
    if (clinic) {
      const val = clinic.avgConsultationMins || 10;
      setAvgMins(val);
      savedRef.current = val;
    }
  }, [clinic]);

  // Fetch doctors when panel opens
  useEffect(() => {
    if (isOpen) {
      setLoadingDoctors(true);
      api.getDoctors()
        .then(docs => {
          setDoctors(docs);
          const durations: Record<string, number> = {};
          docs.forEach(d => {
            durations[d.id] = d.avgConsultationMins;
          });
          setDoctorDurations(durations);
          savedDoctorDurationsRef.current = { ...durations };
        })
        .catch(() => {})
        .finally(() => setLoadingDoctors(false));
    }
  }, [isOpen]);

  const hasChanges = useCallback(() => {
    if (savedRef.current !== avgMins) return true;
    for (const id of Object.keys(doctorDurations)) {
      if (doctorDurations[id] !== savedDoctorDurationsRef.current[id]) return true;
    }
    return false;
  }, [avgMins, doctorDurations]);

  const autoSave = useCallback(async () => {
    if (!hasChanges()) return;
    setAutoSaveStatus('saving');
    try {
      // Save clinic-level duration if changed
      if (savedRef.current !== avgMins) {
        await api.updateClinic({ avgConsultationMins: avgMins });
        savedRef.current = avgMins;
      }
      // Save per-doctor durations if changed
      for (const id of Object.keys(doctorDurations)) {
        if (doctorDurations[id] !== savedDoctorDurationsRef.current[id]) {
          await api.updateDoctor(id, { avgConsultationMins: doctorDurations[id] });
          savedDoctorDurationsRef.current[id] = doctorDurations[id];
        }
      }
      setAutoSaveStatus('saved');
      setTimeout(() => setAutoSaveStatus('idle'), 2000);
    } catch {
      setAutoSaveStatus('error');
      setTimeout(() => setAutoSaveStatus('idle'), 3000);
    }
  }, [avgMins, doctorDurations, hasChanges]);

  // Auto-save when panel closes
  const handleClose = useCallback(async () => {
    if (hasChanges()) {
      await autoSave();
    }
    onClose();
  }, [hasChanges, autoSave, onClose]);

  // Close on Escape
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape' && isOpen) handleClose(); };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [isOpen, handleClose]);

  // Update a doctor's duration locally
  const setDoctorDuration = useCallback((doctorId: string, value: number) => {
    setDoctorDurations(prev => ({
      ...prev,
      [doctorId]: Math.max(MIN_DURATION, Math.min(MAX_DURATION, value)),
    }));
  }, []);

  // Ring calculation
  const ringFraction = avgMins / MAX_DURATION;
  const ringOffset = RING_CIRCUMFERENCE * (1 - ringFraction);

  // Impact calculation
  const totalWait = avgMins * QUEUE_SIZE;

  return (
    <>
      {isOpen && <div className="bs-panel-backdrop" onClick={handleClose} />}

      <div className={`bs-right-panel ${isOpen ? 'open' : ''}`} style={{ zIndex: 95 }}>
        {/* Header */}
        <div className="bs-panel-header">
          <button onClick={handleClose} className="bs-panel-back">
            <span className="material-symbols-rounded" style={{ fontSize: 22 }}>arrow_back</span>
          </button>
          <span className="bs-panel-title">Durée consultation</span>
        </div>

        <div className="bs-panel-body">

          {/* ── Duration Hero Card ── */}
          <div style={{
            background: '#FFF',
            border: '1px solid #E8E6DF',
            borderRadius: 16,
            padding: '28px 20px',
            textAlign: 'center',
            marginBottom: 20,
          }}>
            {/* SVG Ring */}
            <div style={{ width: 140, height: 140, margin: '0 auto 16px', position: 'relative' }}>
              <svg
                viewBox="0 0 120 120"
                style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}
              >
                <circle
                  cx="60" cy="60" r={RING_RADIUS}
                  fill="none" stroke="#E8E6DF" strokeWidth="6"
                />
                <circle
                  cx="60" cy="60" r={RING_RADIUS}
                  fill="none" stroke="#0F7B6C" strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={RING_CIRCUMFERENCE}
                  strokeDashoffset={ringOffset}
                  style={{ transition: 'stroke-dashoffset 0.6s ease' }}
                />
              </svg>
              <div style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <div style={{ fontSize: 36, fontWeight: 700, color: '#1A1A1A', lineHeight: 1 }}>
                  {avgMins}
                </div>
                <div style={{ fontSize: 13, fontWeight: 500, color: '#9E9B90', marginTop: 2 }}>
                  minutes
                </div>
              </div>
            </div>

            {/* Stepper Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 12 }}>
              <button
                onClick={() => setAvgMins(prev => Math.max(MIN_DURATION, prev - 1))}
                style={{
                  width: 44, height: 44, borderRadius: '50%',
                  border: '2px solid #E8E6DF', background: '#FFF',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', color: '#6B6960',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = '#0F7B6C';
                  e.currentTarget.style.color = '#0F7B6C';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = '#E8E6DF';
                  e.currentTarget.style.color = '#6B6960';
                }}
              >
                <span className="material-symbols-rounded" style={{ fontSize: 22 }}>remove</span>
              </button>
              <button
                onClick={() => setAvgMins(prev => Math.min(MAX_DURATION, prev + 1))}
                style={{
                  width: 44, height: 44, borderRadius: '50%',
                  border: '2px solid #E8E6DF', background: '#FFF',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', color: '#6B6960',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = '#0F7B6C';
                  e.currentTarget.style.color = '#0F7B6C';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = '#E8E6DF';
                  e.currentTarget.style.color = '#6B6960';
                }}
              >
                <span className="material-symbols-rounded" style={{ fontSize: 22 }}>add</span>
              </button>
            </div>

            {/* Range text */}
            <div style={{ fontSize: 11, color: '#9E9B90', marginTop: 8 }}>
              Min {MIN_DURATION} min — Max {MAX_DURATION} min
            </div>
          </div>

          {/* ── Auto-save indicator ── */}
          {autoSaveStatus !== 'idle' && (
            <div style={{
              textAlign: 'center',
              fontSize: 11,
              fontWeight: 500,
              padding: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
              color: autoSaveStatus === 'error' ? '#D94F3B' : autoSaveStatus === 'saved' ? '#2D8B4E' : '#9E9B90',
              transition: 'opacity 0.3s',
            }}>
              <span className="material-symbols-rounded" style={{ fontSize: 14 }}>
                {autoSaveStatus === 'saving' ? 'sync' : autoSaveStatus === 'saved' ? 'check_circle' : 'error'}
              </span>
              {autoSaveStatus === 'saving' && 'Enregistrement...'}
              {autoSaveStatus === 'saved' && 'Modifications enregistrées'}
              {autoSaveStatus === 'error' && "Erreur lors de l'enregistrement"}
            </div>
          )}

          {/* ── Impact Calculator Card ── */}
          <div className="bs-settings-label">Impact sur l'attente</div>
          <div style={{
            background: '#FFF',
            border: '1px solid #E8E6DF',
            borderRadius: 12,
            padding: 16,
            marginBottom: 16,
          }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8,
                background: '#FDF5E6',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <span className="material-symbols-rounded" style={{ fontSize: 18, color: '#D4920B' }}>
                  calculate
                </span>
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#1A1A1A' }}>
                Estimation temps d'attente
              </div>
            </div>

            {/* Dynamic text */}
            <div style={{ fontSize: 13, color: '#6B6960', lineHeight: 1.6, marginBottom: 12 }}>
              Avec <span style={{ fontWeight: 700, color: '#0F7B6C' }}>{avgMins} min</span> par patient,
              une file de <span style={{ fontWeight: 700, color: '#0F7B6C' }}>{QUEUE_SIZE} patients</span> représente
              environ <span style={{ fontWeight: 700, color: '#0F7B6C' }}>~{totalWait} min</span> d'attente
              pour le dernier patient.
            </div>

            {/* Visual queue */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '10px 0' }}>
              {Array.from({ length: QUEUE_SIZE }).map((_, i) => {
                const isWaiting = i >= 3;
                return (
                  <div key={i} style={{ display: 'contents' }}>
                    {i > 0 && (
                      <span style={{ fontSize: 14, color: '#D4D2CC', flexShrink: 0 }}>
                        &#8594;
                      </span>
                    )}
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 4,
                      flex: 1,
                    }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: '50%',
                        background: isWaiting ? '#FDF5E6' : '#E8F5F1',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <span
                          className="material-symbols-rounded"
                          style={{ fontSize: 16, color: isWaiting ? '#D4920B' : '#0F7B6C' }}
                        >
                          person
                        </span>
                      </div>
                      <span style={{ fontSize: 9, fontWeight: 600, color: '#9E9B90' }}>
                        {i * avgMins} min
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Per-Doctor Durations ── */}
          {doctors.length > 0 && (
            <>
              <div className="bs-settings-label">Par médecin</div>
              <div style={{
                background: '#FFF',
                border: '1px solid #E8E6DF',
                borderRadius: 12,
                overflow: 'hidden',
                marginBottom: 12,
              }}>
                {loadingDoctors ? (
                  <div style={{ fontSize: 13, color: '#9E9B90', padding: '14px 16px', textAlign: 'center' }}>
                    Chargement...
                  </div>
                ) : (
                  doctors.map((doctor, idx) => {
                    const duration = doctorDurations[doctor.id] ?? doctor.avgConsultationMins;
                    const isGlobal = duration === avgMins;
                    const color = DOCTOR_COLORS[idx % DOCTOR_COLORS.length];

                    return (
                      <div
                        key={doctor.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          padding: '12px 14px',
                          borderBottom: idx < doctors.length - 1 ? '1px solid rgba(228,226,221,0.5)' : 'none',
                        }}
                      >
                        {/* Avatar */}
                        <div style={{
                          width: 32, height: 32, borderRadius: '50%',
                          background: color,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 12, fontWeight: 700, color: '#FFF',
                          flexShrink: 0,
                        }}>
                          {getInitials(doctor.name)}
                        </div>

                        {/* Info */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#1A1A1A' }}>
                            {doctor.name}
                          </div>
                          {isGlobal ? (
                            <span style={{
                              fontSize: 10, fontWeight: 500, color: '#0F7B6C',
                              background: '#E8F5F1',
                              padding: '2px 6px', borderRadius: 100,
                            }}>
                              Valeur globale
                            </span>
                          ) : (
                            <div style={{ fontSize: 11, color: '#9E9B90' }}>
                              Personnalisée
                            </div>
                          )}
                        </div>

                        {/* Mini stepper */}
                        <div style={{
                          display: 'flex', alignItems: 'center',
                          border: '1.5px solid #E8E6DF', borderRadius: 8,
                          overflow: 'hidden', flexShrink: 0,
                        }}>
                          <button
                            onClick={() => setDoctorDuration(doctor.id, duration - 1)}
                            style={{
                              width: 30, height: 30, background: '#F0EFEA',
                              border: 'none', cursor: 'pointer',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              color: '#6B6960', fontWeight: 700, fontSize: 14,
                            }}
                          >
                            -
                          </button>
                          <div style={{
                            width: 32, height: 30,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 13, fontWeight: 700, color: '#1A1A1A',
                            background: '#FFF',
                            borderLeft: '1.5px solid #E8E6DF',
                            borderRight: '1.5px solid #E8E6DF',
                          }}>
                            {duration}
                          </div>
                          <button
                            onClick={() => setDoctorDuration(doctor.id, duration + 1)}
                            style={{
                              width: 30, height: 30, background: '#F0EFEA',
                              border: 'none', cursor: 'pointer',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              color: '#6B6960', fontWeight: 700, fontSize: 14,
                            }}
                          >
                            +
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </>
          )}

          {/* ── Today's Insight Card ── */}
          <div className="bs-settings-label">Aujourd'hui</div>
          <div style={{
            background: '#FFF',
            border: '1px solid #E8E6DF',
            borderRadius: 12,
            padding: '14px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              background: '#EDF3FC',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <span className="material-symbols-rounded" style={{ fontSize: 18, color: '#3B7DD9' }}>
                insights
              </span>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: '#9E9B90', fontWeight: 500 }}>
                Durée moyenne réelle
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#1A1A1A' }}>
                —
              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
