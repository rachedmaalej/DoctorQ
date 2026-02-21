import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { api } from '@/lib/api';
import '@/components/receptionist/receptionist.css';

interface BSNotificationsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const MIN_POSITION = 1;
const MAX_POSITION = 10;
const QUEUE_DOTS = 5;

export default function BSNotificationsPanel({ isOpen, onClose }: BSNotificationsPanelProps) {
  const { clinic } = useAuthStore();

  const [notifyAtPosition, setNotifyAtPosition] = useState(2);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [quietHoursEnabled, setQuietHoursEnabled] = useState(false);
  const [quietHoursStart, setQuietHoursStart] = useState('20:00');
  const [quietHoursEnd, setQuietHoursEnd] = useState('07:00');
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  // Push status
  const [pushPermission, setPushPermission] = useState<NotificationPermission | 'unsupported'>('unsupported');
  const [testingSend, setTestingSend] = useState(false);

  // Sync from clinic
  useEffect(() => {
    if (clinic) {
      setNotifyAtPosition(clinic.notifyAtPosition || 2);
      setSoundEnabled(clinic.notificationSoundEnabled !== false);
      setQuietHoursEnabled(clinic.quietHoursStart != null);
      setQuietHoursStart(clinic.quietHoursStart || '20:00');
      setQuietHoursEnd(clinic.quietHoursEnd || '07:00');
    }
  }, [clinic]);

  // Check push permission
  useEffect(() => {
    if (isOpen) {
      if (!('Notification' in window)) {
        setPushPermission('unsupported');
      } else {
        setPushPermission(Notification.permission);
      }
    }
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape' && isOpen) onClose(); };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [isOpen, onClose]);

  // Save helper
  const save = useCallback(async (updates: Record<string, unknown>) => {
    setAutoSaveStatus('saving');
    try {
      await api.updateClinic(updates as Parameters<typeof api.updateClinic>[0]);
      setAutoSaveStatus('saved');
      setTimeout(() => setAutoSaveStatus('idle'), 2000);
    } catch {
      setAutoSaveStatus('error');
      setTimeout(() => setAutoSaveStatus('idle'), 3000);
    }
  }, []);

  // Handlers
  const handlePositionChange = useCallback((delta: number) => {
    setNotifyAtPosition(prev => {
      const next = Math.max(MIN_POSITION, Math.min(MAX_POSITION, prev + delta));
      if (next !== prev) {
        save({ notifyAtPosition: next });
      }
      return next;
    });
  }, [save]);

  const handleSoundToggle = useCallback(() => {
    setSoundEnabled(prev => {
      const next = !prev;
      save({ notificationSoundEnabled: next });
      return next;
    });
  }, [save]);

  const handleQuietHoursToggle = useCallback(() => {
    setQuietHoursEnabled(prev => {
      const next = !prev;
      if (next) {
        save({ quietHoursStart, quietHoursEnd });
      } else {
        save({ quietHoursStart: null, quietHoursEnd: null });
      }
      return next;
    });
  }, [save, quietHoursStart, quietHoursEnd]);

  const handleQuietHoursStartChange = useCallback((value: string) => {
    setQuietHoursStart(value);
    save({ quietHoursStart: value });
  }, [save]);

  const handleQuietHoursEndChange = useCallback((value: string) => {
    setQuietHoursEnd(value);
    save({ quietHoursEnd: value });
  }, [save]);

  const handleTestPush = useCallback(async () => {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    setTestingSend(true);
    try {
      const registration = await navigator.serviceWorker.getRegistration('/');
      if (registration) {
        await registration.showNotification('BleSaf', {
          body: `Vous etes en position ${notifyAtPosition}. Veuillez vous rapprocher de la salle d'attente.`,
          icon: '/icon-192.png',
        });
      }
    } catch {
      // ignore
    } finally {
      setTimeout(() => setTestingSend(false), 1000);
    }
  }, [notifyAtPosition]);

  const pushActive = pushPermission === 'granted';

  return (
    <>
      {isOpen && <div className="bs-panel-backdrop" onClick={onClose} />}

      <div className={`bs-right-panel ${isOpen ? 'open' : ''}`} style={{ zIndex: 95 }}>
        {/* Header */}
        <div className="bs-panel-header">
          <button onClick={onClose} className="bs-panel-back">
            <span className="material-symbols-rounded" style={{ fontSize: 22 }}>arrow_back</span>
          </button>
          <span className="bs-panel-title">Notifications patients</span>
        </div>

        <div className="bs-panel-body">

          {/* ── Section: Alerte de position ── */}
          <div className="bs-settings-label">Alerte de position</div>
          <div style={{
            background: '#FFF',
            border: '1px solid #E8E6DF',
            borderRadius: 16,
            padding: 20,
            marginBottom: 20,
          }}>
            {/* Header row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: '#EDF3FC',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <span className="material-symbols-rounded" style={{ fontSize: 20, color: '#3B7DD9' }}>
                  notification_important
                </span>
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#1A1A1A' }}>
                Notifier a la position
              </div>
            </div>

            {/* Stepper */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16,
              marginBottom: 16,
            }}>
              <button
                onClick={() => handlePositionChange(-1)}
                disabled={notifyAtPosition <= MIN_POSITION}
                style={{
                  width: 40, height: 40, borderRadius: '50%',
                  border: '2px solid #E8E6DF', background: '#FFF',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: notifyAtPosition <= MIN_POSITION ? 'not-allowed' : 'pointer',
                  color: '#6B6960',
                  transition: 'all 0.15s',
                  opacity: notifyAtPosition <= MIN_POSITION ? 0.4 : 1,
                }}
                onMouseEnter={e => {
                  if (notifyAtPosition > MIN_POSITION) {
                    e.currentTarget.style.borderColor = '#0F7B6C';
                    e.currentTarget.style.color = '#0F7B6C';
                  }
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = '#E8E6DF';
                  e.currentTarget.style.color = '#6B6960';
                }}
              >
                <span className="material-symbols-rounded" style={{ fontSize: 20 }}>remove</span>
              </button>

              <div style={{ fontSize: 32, fontWeight: 700, color: '#0F7B6C', minWidth: 40, textAlign: 'center' }}>
                {notifyAtPosition}
              </div>

              <button
                onClick={() => handlePositionChange(1)}
                disabled={notifyAtPosition >= MAX_POSITION}
                style={{
                  width: 40, height: 40, borderRadius: '50%',
                  border: '2px solid #E8E6DF', background: '#FFF',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: notifyAtPosition >= MAX_POSITION ? 'not-allowed' : 'pointer',
                  color: '#6B6960',
                  transition: 'all 0.15s',
                  opacity: notifyAtPosition >= MAX_POSITION ? 0.4 : 1,
                }}
                onMouseEnter={e => {
                  if (notifyAtPosition < MAX_POSITION) {
                    e.currentTarget.style.borderColor = '#0F7B6C';
                    e.currentTarget.style.color = '#0F7B6C';
                  }
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = '#E8E6DF';
                  e.currentTarget.style.color = '#6B6960';
                }}
              >
                <span className="material-symbols-rounded" style={{ fontSize: 20 }}>add</span>
              </button>
            </div>

            {/* Explanation text */}
            <div style={{
              background: '#F6F5F0',
              borderRadius: 10,
              padding: '12px 14px',
              fontSize: 13,
              color: '#6B6960',
              lineHeight: 1.5,
              textAlign: 'center',
              marginBottom: 16,
            }}>
              Le patient est alerte quand il est a{' '}
              <span style={{ fontWeight: 700, color: '#0F7B6C' }}>{notifyAtPosition}</span>{' '}
              position{notifyAtPosition > 1 ? 's' : ''} de son tour
            </div>

            {/* Queue mini visualization */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
              padding: '8px 0',
            }}>
              {Array.from({ length: QUEUE_DOTS }).map((_, i) => {
                const isCurrent = i === 0;
                const isAlerted = i === notifyAtPosition && notifyAtPosition < QUEUE_DOTS;
                const isWaiting = !isCurrent && !isAlerted;

                let dotBg = '#D4D2CC';
                let label = '';
                if (isCurrent) {
                  dotBg = '#0F7B6C';
                  label = 'En cours';
                } else if (isAlerted) {
                  dotBg = '#3B7DD9';
                  label = 'Alerte!';
                }

                return (
                  <div key={i} style={{ display: 'contents' }}>
                    {i > 0 && (
                      <span style={{ fontSize: 12, color: '#D4D2CC', flexShrink: 0 }}>&#8594;</span>
                    )}
                    <div style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center',
                      gap: 4, flex: 1,
                    }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: '50%',
                        background: dotBg,
                        transition: 'all 0.3s',
                        ...(isAlerted ? {
                          animation: 'bs-pulse-blue 2s ease-in-out infinite',
                          boxShadow: '0 0 0 4px rgba(59,125,217,0.2)',
                        } : {}),
                      }} />
                      <span style={{
                        fontSize: 9, fontWeight: 600,
                        color: isCurrent ? '#0F7B6C' : isAlerted ? '#3B7DD9' : '#9E9B90',
                        whiteSpace: 'nowrap',
                        minHeight: 13,
                      }}>
                        {label || (isWaiting ? `${i + 1}` : '')}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Pulse animation */}
          <style>{`
            @keyframes bs-pulse-blue {
              0%, 100% { box-shadow: 0 0 0 4px rgba(59,125,217,0.2); }
              50% { box-shadow: 0 0 0 8px rgba(59,125,217,0.1); }
            }
          `}</style>

          {/* ── Section: Comportement ── */}
          <div className="bs-settings-label">Comportement</div>
          <div className="bs-settings-group" style={{ padding: 0, overflow: 'hidden', marginBottom: 20 }}>
            {/* Sound notification toggle */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px',
              borderBottom: '1px solid rgba(228,226,221,0.5)',
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8,
                background: '#FDF5E6',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <span className="material-symbols-rounded" style={{ fontSize: 18, color: '#D4920B' }}>
                  volume_up
                </span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: '#1A1A1A' }}>Son de notification</div>
                <div style={{ fontSize: 11, color: '#9E9B90', marginTop: 1 }}>
                  Jouer un son quand le patient est notifie
                </div>
              </div>
              <div
                onClick={handleSoundToggle}
                style={{
                  width: 44, height: 24, borderRadius: 12, position: 'relative',
                  cursor: 'pointer', flexShrink: 0,
                  background: soundEnabled ? '#0F7B6C' : '#E8E6DF',
                  transition: 'background 0.2s',
                }}
              >
                <div style={{
                  position: 'absolute', top: 3, width: 18, height: 18, borderRadius: '50%',
                  background: '#FFF', boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
                  left: soundEnabled ? 23 : 3, transition: 'left 0.2s',
                }} />
              </div>
            </div>

            {/* Quiet hours toggle */}
            <div style={{ padding: '14px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: '#F0EDF7',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <span className="material-symbols-rounded" style={{ fontSize: 18, color: '#7C5CFC' }}>
                    bedtime
                  </span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: '#1A1A1A' }}>Heures silencieuses</div>
                  <div style={{ fontSize: 11, color: '#9E9B90', marginTop: 1 }}>
                    Desactiver les notifications pendant la nuit
                  </div>
                </div>
                <div
                  onClick={handleQuietHoursToggle}
                  style={{
                    width: 44, height: 24, borderRadius: 12, position: 'relative',
                    cursor: 'pointer', flexShrink: 0,
                    background: quietHoursEnabled ? '#0F7B6C' : '#E8E6DF',
                    transition: 'background 0.2s',
                  }}
                >
                  <div style={{
                    position: 'absolute', top: 3, width: 18, height: 18, borderRadius: '50%',
                    background: '#FFF', boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
                    left: quietHoursEnabled ? 23 : 3, transition: 'left 0.2s',
                  }} />
                </div>
              </div>

              {/* Quiet hours config (expandable) */}
              <div style={{
                maxHeight: quietHoursEnabled ? 80 : 0,
                opacity: quietHoursEnabled ? 1 : 0,
                overflow: 'hidden',
                transition: 'max-height 0.35s cubic-bezier(0.22,1,0.36,1), opacity 0.25s ease',
              }}>
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  gap: 12, paddingTop: 14,
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <span style={{
                      fontSize: 10, fontWeight: 600, textTransform: 'uppercase' as const,
                      letterSpacing: '0.6px', color: '#9E9B90',
                    }}>
                      Debut
                    </span>
                    <input
                      type="time"
                      value={quietHoursStart}
                      onChange={e => handleQuietHoursStartChange(e.target.value)}
                      style={{
                        height: 36, background: '#F6F5F0',
                        border: '1.5px solid #E8E6DF', borderRadius: 8,
                        padding: '0 10px', fontFamily: 'inherit',
                        fontSize: 13, color: '#1A1A1A', textAlign: 'center',
                        outline: 'none', cursor: 'pointer',
                      }}
                    />
                  </div>
                  <span style={{ fontSize: 18, color: '#D4D2CC', marginTop: 16 }}>&mdash;</span>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <span style={{
                      fontSize: 10, fontWeight: 600, textTransform: 'uppercase' as const,
                      letterSpacing: '0.6px', color: '#9E9B90',
                    }}>
                      Fin
                    </span>
                    <input
                      type="time"
                      value={quietHoursEnd}
                      onChange={e => handleQuietHoursEndChange(e.target.value)}
                      style={{
                        height: 36, background: '#F6F5F0',
                        border: '1.5px solid #E8E6DF', borderRadius: 8,
                        padding: '0 10px', fontFamily: 'inherit',
                        fontSize: 13, color: '#1A1A1A', textAlign: 'center',
                        outline: 'none', cursor: 'pointer',
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Section: Push web ── */}
          <div className="bs-settings-label">Push web</div>
          <div style={{
            background: '#FFF',
            border: '1px solid #E8E6DF',
            borderRadius: 12,
            padding: '14px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            marginBottom: 20,
          }}>
            {/* Icon with status dot */}
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: '#E8F5F1',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <span className="material-symbols-rounded" style={{ fontSize: 20, color: '#0F7B6C' }}>
                  notifications_active
                </span>
              </div>
              <div style={{
                position: 'absolute', bottom: -1, right: -1,
                width: 10, height: 10, borderRadius: '50%',
                background: pushActive ? '#2D8B4E' : '#D94F3B',
                border: '2px solid #FFF',
              }} />
            </div>

            {/* Label + value */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: '#1A1A1A' }}>Notifications push</div>
              <div style={{
                fontSize: 12, fontWeight: 600, marginTop: 2,
                color: pushActive ? '#2D8B4E' : '#D94F3B',
              }}>
                {pushActive ? 'Actif' : 'Inactif'}
              </div>
            </div>

            {/* Test button */}
            <button
              onClick={handleTestPush}
              disabled={!pushActive || testingSend}
              style={{
                height: 32, padding: '0 12px',
                border: '1.5px solid #E8E6DF', borderRadius: 8,
                background: '#FFF', cursor: !pushActive || testingSend ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', gap: 6,
                fontFamily: 'inherit', fontSize: 12, fontWeight: 500,
                color: !pushActive ? '#D4D2CC' : '#6B6960',
                transition: 'all 0.15s',
                opacity: testingSend ? 0.6 : 1,
              }}
              onMouseEnter={e => {
                if (pushActive && !testingSend) {
                  e.currentTarget.style.borderColor = '#0F7B6C';
                  e.currentTarget.style.color = '#0F7B6C';
                }
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = '#E8E6DF';
                e.currentTarget.style.color = pushActive ? '#6B6960' : '#D4D2CC';
              }}
            >
              <span className="material-symbols-rounded" style={{ fontSize: 16 }}>send</span>
              Tester
            </button>
          </div>

          {/* ── Auto-save indicator ── */}
          {autoSaveStatus !== 'idle' && (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
              padding: '8px 0', fontSize: 11, fontWeight: 500, marginBottom: 12,
              color: autoSaveStatus === 'error' ? '#D94F3B' : autoSaveStatus === 'saved' ? '#2D8B4E' : '#9E9B90',
              transition: 'opacity 0.3s',
            }}>
              <span className="material-symbols-rounded" style={{ fontSize: 14 }}>
                {autoSaveStatus === 'saving' ? 'sync' : autoSaveStatus === 'saved' ? 'check_circle' : 'error'}
              </span>
              {autoSaveStatus === 'saving' && 'Enregistrement...'}
              {autoSaveStatus === 'saved' && 'Modifications enregistrees'}
              {autoSaveStatus === 'error' && "Erreur lors de l'enregistrement"}
            </div>
          )}

          {/* ── Section: Apercu ── */}
          <div className="bs-settings-label">Apercu</div>
          <div style={{
            background: '#FFF',
            border: '1px solid #E8E6DF',
            borderRadius: 12,
            overflow: 'hidden',
          }}>
            {/* Preview header bar */}
            <div style={{
              padding: '10px 16px', borderBottom: '1px solid #E8E6DF',
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <span className="material-symbols-rounded" style={{ fontSize: 16, color: '#9E9B90' }}>visibility</span>
              <span style={{
                fontSize: 10, fontWeight: 600, textTransform: 'uppercase' as const,
                letterSpacing: '0.8px', color: '#9E9B90',
              }}>
                Ce que recoit le patient
              </span>
            </div>

            {/* Notification preview */}
            <div style={{ padding: 16 }}>
              <div style={{
                background: '#F6F5F0',
                border: '1px solid #E8E6DF',
                borderRadius: 12,
                padding: 14,
                display: 'flex',
                gap: 12,
              }}>
                {/* Notification icon */}
                <div style={{
                  width: 40, height: 40, borderRadius: '50%',
                  background: '#EDF3FC',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <span className="material-symbols-rounded" style={{ fontSize: 20, color: '#3B7DD9' }}>
                    notifications
                  </span>
                </div>

                {/* Notification content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 10, fontWeight: 700, textTransform: 'uppercase' as const,
                    letterSpacing: '0.8px', color: '#9E9B90', marginBottom: 4,
                  }}>
                    BleSaf
                  </div>
                  <div style={{
                    fontSize: 14, fontWeight: 600, color: '#1A1A1A', marginBottom: 4,
                  }}>
                    C'est bientot votre tour !
                  </div>
                  <div style={{
                    fontSize: 12, color: '#6B6960', lineHeight: 1.5, marginBottom: 6,
                  }}>
                    Vous etes en position{' '}
                    <span style={{ fontWeight: 700, color: '#0F7B6C' }}>{notifyAtPosition}</span>.
                    Veuillez vous rapprocher de la salle d'attente.
                  </div>
                  <div style={{
                    fontSize: 11, color: '#B8B5AD', fontWeight: 500,
                  }}>
                    A l'instant
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
