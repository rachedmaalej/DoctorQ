import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { api } from '@/lib/api';
import '@/components/receptionist/receptionist.css';

interface BSWaitingRoomDisplayPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const SPECIALTIES = [
  { key: 'general', label: 'Generale', icon: 'stethoscope' },
  { key: 'ophthalmology', label: 'Ophtalmo', icon: 'visibility' },
  { key: 'dentistry', label: 'Dentiste', icon: 'dentistry' },
  { key: 'cardiology', label: 'Cardio', icon: 'cardiology' },
  { key: 'dermatology', label: 'Dermato', icon: 'dermatology' },
  { key: 'pediatrics', label: 'Pediatrie', icon: 'pediatrics' },
] as const;

const ANNOUNCEMENT_PRESETS = [
  { label: 'Retard 15 min', text: 'Le docteur aura 15 min de retard aujourd\'hui. Merci pour votre patience.' },
  { label: 'Ferme demain', text: 'Le cabinet sera ferme demain. Merci de votre comprehension.' },
  { label: 'Masque obligatoire', text: 'Port du masque obligatoire dans la salle d\'attente.' },
  { label: 'Horaires modifies', text: 'Les horaires du cabinet ont ete modifies. Veuillez verifier les nouveaux horaires.' },
] as const;

const WELCOME_MAX = 200;
const ANNOUNCEMENT_MAX = 300;

export default function BSWaitingRoomDisplayPanel({ isOpen, onClose }: BSWaitingRoomDisplayPanelProps) {
  const { clinic } = useAuthStore();

  // State
  const [funFactsEnabled, setFunFactsEnabled] = useState(false);
  const [specialty, setSpecialty] = useState<string | null>(null);
  const [welcomeMessage, setWelcomeMessage] = useState('');
  const [announcement, setAnnouncement] = useState('');
  const [showQueuePosition, setShowQueuePosition] = useState(true);
  const [showEstimatedWait, setShowEstimatedWait] = useState(true);
  const [enableLanguageSwitcher, setEnableLanguageSwitcher] = useState(true);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  // Refs for tracking saved state
  const savedWelcomeRef = useRef('');
  const savedAnnouncementRef = useRef('');

  // Sync from clinic on open
  useEffect(() => {
    if (clinic && isOpen) {
      setFunFactsEnabled(clinic.funFactsEnabled ?? false);
      setSpecialty(clinic.specialty ?? null);
      setWelcomeMessage(clinic.welcomeMessage ?? '');
      savedWelcomeRef.current = clinic.welcomeMessage ?? '';
      setShowQueuePosition(clinic.showQueuePosition !== false);
      setShowEstimatedWait(clinic.showEstimatedWait !== false);
      setEnableLanguageSwitcher(clinic.enableLanguageSwitcher !== false);
      // Announcement is not on Clinic type; start empty
      setAnnouncement('');
      savedAnnouncementRef.current = '';
    }
  }, [clinic, isOpen]);

  // Escape key closes panel
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape' && isOpen) onClose(); };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [isOpen, onClose]);

  // Generic save helper
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

  // Save announcement via dedicated endpoint
  const saveAnnouncement = useCallback(async (text: string | null) => {
    setAutoSaveStatus('saving');
    try {
      await api.setAnnouncement(text);
      setAutoSaveStatus('saved');
      setTimeout(() => setAutoSaveStatus('idle'), 2000);
    } catch {
      setAutoSaveStatus('error');
      setTimeout(() => setAutoSaveStatus('idle'), 3000);
    }
  }, []);

  // Toggle handlers (save immediately)
  const handleToggleFunFacts = useCallback(() => {
    const next = !funFactsEnabled;
    setFunFactsEnabled(next);
    save({ funFactsEnabled: next });
  }, [funFactsEnabled, save]);

  const handleSelectSpecialty = useCallback((key: string) => {
    const next = specialty === key ? null : key;
    setSpecialty(next);
    save({ specialty: next ?? '' });
  }, [specialty, save]);

  const handleToggleQueuePosition = useCallback(() => {
    const next = !showQueuePosition;
    setShowQueuePosition(next);
    save({ showQueuePosition: next });
  }, [showQueuePosition, save]);

  const handleToggleEstimatedWait = useCallback(() => {
    const next = !showEstimatedWait;
    setShowEstimatedWait(next);
    save({ showEstimatedWait: next });
  }, [showEstimatedWait, save]);

  const handleToggleLanguageSwitcher = useCallback(() => {
    const next = !enableLanguageSwitcher;
    setEnableLanguageSwitcher(next);
    save({ enableLanguageSwitcher: next });
  }, [enableLanguageSwitcher, save]);

  // Welcome message: save on blur
  const handleWelcomeBlur = useCallback(() => {
    if (welcomeMessage !== savedWelcomeRef.current) {
      savedWelcomeRef.current = welcomeMessage;
      save({ welcomeMessage: welcomeMessage || null });
    }
  }, [welcomeMessage, save]);

  // Announcement: save on blur
  const handleAnnouncementBlur = useCallback(() => {
    if (announcement !== savedAnnouncementRef.current) {
      savedAnnouncementRef.current = announcement;
      saveAnnouncement(announcement || null);
    }
  }, [announcement, saveAnnouncement]);

  // Preset quick-fill
  const handlePreset = useCallback((text: string) => {
    setAnnouncement(text);
    savedAnnouncementRef.current = text;
    saveAnnouncement(text);
  }, [saveAnnouncement]);

  // Clear announcement
  const handleClearAnnouncement = useCallback(() => {
    setAnnouncement('');
    savedAnnouncementRef.current = '';
    saveAnnouncement(null);
  }, [saveAnnouncement]);

  // Find active preset
  const activePreset = ANNOUNCEMENT_PRESETS.find(p => p.text === announcement);

  // Toggle component
  const Toggle = useCallback(({ on, onToggle }: { on: boolean; onToggle: () => void }) => (
    <div
      onClick={onToggle}
      style={{
        width: 44, height: 24, borderRadius: 12, position: 'relative',
        cursor: 'pointer', flexShrink: 0,
        background: on ? '#0F7B6C' : '#E8E6DF',
        transition: 'background 0.2s',
      }}
    >
      <div style={{
        position: 'absolute', top: 3, width: 18, height: 18, borderRadius: '50%',
        background: '#FFF', boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
        left: on ? 23 : 3, transition: 'left 0.2s',
      }} />
    </div>
  ), []);

  return (
    <>
      {isOpen && <div className="bs-panel-backdrop" onClick={onClose} />}

      <div className={`bs-right-panel ${isOpen ? 'open' : ''}`} style={{ zIndex: 95 }}>
        {/* Header */}
        <div className="bs-panel-header">
          <button onClick={onClose} className="bs-panel-back">
            <span className="material-symbols-rounded" style={{ fontSize: 22 }}>arrow_back</span>
          </button>
          <span className="bs-panel-title">Affichage salle d'attente</span>
        </div>

        <div className="bs-panel-body">

          {/* ── Section 1: Anecdotes medicales ── */}
          <div className="bs-settings-label">Anecdotes medicales</div>
          <div className="bs-settings-group" style={{ marginBottom: 20 }}>
            {/* Toggle row */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px',
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8,
                background: '#E8F5F1', color: '#0F7B6C',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <span className="material-symbols-rounded" style={{ fontSize: 18 }}>lightbulb</span>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: '#1A1A1A' }}>Afficher des anecdotes</div>
                <div style={{ fontSize: 11, color: '#9E9B90', marginTop: 1 }}>Divertir les patients pendant l'attente</div>
              </div>
              <Toggle on={funFactsEnabled} onToggle={handleToggleFunFacts} />
            </div>

            {/* Specialty grid (shown when enabled) */}
            {funFactsEnabled && (
              <div style={{
                display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6,
                padding: '0 16px 14px',
              }}>
                {SPECIALTIES.map(s => {
                  const selected = specialty === s.key;
                  return (
                    <button
                      key={s.key}
                      onClick={() => handleSelectSpecialty(s.key)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        padding: '8px 10px', borderRadius: 8,
                        border: `1.5px solid ${selected ? '#0F7B6C' : '#E8E6DF'}`,
                        background: selected ? '#E8F5F1' : '#FFF',
                        color: selected ? '#0F7B6C' : '#6B6960',
                        fontSize: 11, fontWeight: 500,
                        cursor: 'pointer', transition: 'all 0.15s',
                      }}
                    >
                      <span className="material-symbols-rounded" style={{ fontSize: 16 }}>{s.icon}</span>
                      {s.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── Section 2: Message de bienvenue ── */}
          <div className="bs-settings-label">Message de bienvenue</div>
          <div style={{
            background: '#FFF', border: '1px solid #E8E6DF', borderRadius: 12,
            padding: 16, marginBottom: 20,
          }}>
            <div style={{
              fontSize: 10, fontWeight: 600, textTransform: 'uppercase' as const,
              letterSpacing: '0.6px', color: '#9E9B90', marginBottom: 8,
            }}>
              Texte affiche aux patients
            </div>
            <input
              type="text"
              value={welcomeMessage}
              onChange={e => setWelcomeMessage(e.target.value.slice(0, WELCOME_MAX))}
              onBlur={handleWelcomeBlur}
              placeholder="Bienvenue au cabinet du Dr..."
              style={{
                width: '100%', height: 40,
                background: '#F6F5F0', border: '1.5px solid #E8E6DF', borderRadius: 8,
                padding: '0 12px', fontSize: 13, color: '#1A1A1A',
                fontFamily: 'inherit', outline: 'none',
                transition: 'border-color 0.2s',
              }}
              onFocus={e => { e.currentTarget.style.borderColor = '#0F7B6C'; }}
              onBlurCapture={e => { e.currentTarget.style.borderColor = '#E8E6DF'; }}
            />
            <div style={{
              fontSize: 10, color: '#9E9B90', textAlign: 'right', marginTop: 4,
            }}>
              {welcomeMessage.length} / {WELCOME_MAX}
            </div>
          </div>

          {/* ── Section 3: Annonce ── */}
          <div className="bs-settings-label">Annonce</div>
          <div style={{
            background: '#FFF', border: '1px solid #E8E6DF', borderRadius: 12,
            padding: 16, marginBottom: 20,
          }}>
            <div style={{
              fontSize: 10, fontWeight: 600, textTransform: 'uppercase' as const,
              letterSpacing: '0.6px', color: '#9E9B90', marginBottom: 8,
            }}>
              Message d'annonce (optionnel)
            </div>
            <textarea
              value={announcement}
              onChange={e => setAnnouncement(e.target.value.slice(0, ANNOUNCEMENT_MAX))}
              onBlur={handleAnnouncementBlur}
              placeholder="Tapez un message d'annonce..."
              style={{
                width: '100%', height: 70, resize: 'none',
                background: '#F6F5F0', border: '1.5px solid #E8E6DF', borderRadius: 8,
                padding: '10px 12px', fontSize: 13, color: '#1A1A1A',
                fontFamily: 'inherit', outline: 'none',
                transition: 'border-color 0.2s',
              }}
              onFocus={e => { e.currentTarget.style.borderColor = '#0F7B6C'; }}
              onBlurCapture={e => { e.currentTarget.style.borderColor = '#E8E6DF'; }}
            />
            <div style={{
              fontSize: 10, color: '#9E9B90', textAlign: 'right', marginTop: 4,
            }}>
              {announcement.length} / {ANNOUNCEMENT_MAX}
            </div>

            {/* Preset quick-fill buttons */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
              {ANNOUNCEMENT_PRESETS.map(preset => {
                const isActive = activePreset?.label === preset.label;
                return (
                  <button
                    key={preset.label}
                    onClick={() => handlePreset(preset.text)}
                    style={{
                      padding: '6px 10px', borderRadius: 8,
                      border: `1.5px solid ${isActive ? '#0F7B6C' : '#E8E6DF'}`,
                      background: isActive ? '#E8F5F1' : '#FFF',
                      color: isActive ? '#0F7B6C' : '#6B6960',
                      fontSize: 11, fontWeight: isActive ? 600 : 500,
                      cursor: 'pointer', transition: 'all 0.15s',
                    }}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>

            {/* Clear announcement button */}
            {announcement && (
              <button
                onClick={handleClearAnnouncement}
                style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  marginTop: 10, padding: '6px 0',
                  background: 'none', border: 'none',
                  color: '#D94F3B', fontSize: 12, fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                <span className="material-symbols-rounded" style={{ fontSize: 16 }}>close</span>
                Effacer l'annonce
              </button>
            )}
          </div>

          {/* ── Section 4: Options d'affichage ── */}
          <div className="bs-settings-label">Options d'affichage</div>
          <div className="bs-settings-group" style={{ marginBottom: 20 }}>
            {/* Position dans la file */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px',
              borderBottom: '1px solid rgba(228,226,221,0.5)',
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8,
                background: '#EDF3FC', color: '#3B7DD9',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <span className="material-symbols-rounded" style={{ fontSize: 18 }}>format_list_numbered</span>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: '#1A1A1A' }}>Position dans la file</div>
                <div style={{ fontSize: 11, color: '#9E9B90', marginTop: 1 }}>Afficher le numero du patient</div>
              </div>
              <Toggle on={showQueuePosition} onToggle={handleToggleQueuePosition} />
            </div>

            {/* Temps d'attente estime */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px',
              borderBottom: '1px solid rgba(228,226,221,0.5)',
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8,
                background: '#FDF5E6', color: '#D4920B',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <span className="material-symbols-rounded" style={{ fontSize: 18 }}>schedule</span>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: '#1A1A1A' }}>Temps d'attente estime</div>
                <div style={{ fontSize: 11, color: '#9E9B90', marginTop: 1 }}>Afficher une estimation de l'attente</div>
              </div>
              <Toggle on={showEstimatedWait} onToggle={handleToggleEstimatedWait} />
            </div>

            {/* Selecteur de langue */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px',
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8,
                background: '#F0EFEA', color: '#9E9B90',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <span className="material-symbols-rounded" style={{ fontSize: 18 }}>language</span>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: '#1A1A1A' }}>Selecteur de langue</div>
                <div style={{ fontSize: 11, color: '#9E9B90', marginTop: 1 }}>Permettre de changer la langue</div>
              </div>
              <Toggle on={enableLanguageSwitcher} onToggle={handleToggleLanguageSwitcher} />
            </div>
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

          {/* ── Section 5: Apercu ── */}
          <div className="bs-settings-label">Apercu</div>
          <div style={{
            background: '#FFF', border: '1px solid #E8E6DF', borderRadius: 12,
            overflow: 'hidden', marginBottom: 20,
          }}>
            {/* Preview header */}
            <div style={{
              padding: '10px 16px', borderBottom: '1px solid #E8E6DF',
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <span className="material-symbols-rounded" style={{ fontSize: 16, color: '#9E9B90' }}>smartphone</span>
              <span style={{
                fontSize: 10, fontWeight: 600, textTransform: 'uppercase' as const,
                letterSpacing: '0.8px', color: '#9E9B90',
              }}>
                Page patient
              </span>
            </div>

            {/* Mini phone preview */}
            <div style={{ padding: 16 }}>
              <div style={{
                background: '#F6F5F0', border: '1px solid #E8E6DF', borderRadius: 12,
                padding: 14,
              }}>
                {/* Welcome message */}
                {welcomeMessage && (
                  <div style={{
                    fontSize: 11, fontWeight: 700, color: '#1A1A1A', marginBottom: 10,
                  }}>
                    {welcomeMessage}
                  </div>
                )}

                {/* Announcement badge */}
                {announcement && (
                  <div style={{
                    display: 'flex', alignItems: 'flex-start', gap: 6,
                    background: '#FDF5E6', border: '1px solid rgba(212,146,11,0.2)',
                    borderRadius: 8, padding: '8px 10px', marginBottom: 10,
                  }}>
                    <span className="material-symbols-rounded" style={{ fontSize: 14, color: '#D4920B', flexShrink: 0, marginTop: 1 }}>
                      campaign
                    </span>
                    <div style={{ fontSize: 10, color: '#D4920B', lineHeight: 1.4, fontWeight: 500 }}>
                      {announcement.length > 80 ? announcement.slice(0, 80) + '...' : announcement}
                    </div>
                  </div>
                )}

                {/* Queue position */}
                {showQueuePosition && (
                  <div style={{ textAlign: 'center', marginBottom: 10 }}>
                    <div style={{ fontSize: 10, fontWeight: 600, color: '#9E9B90', textTransform: 'uppercase' as const, letterSpacing: '0.5px', marginBottom: 4 }}>
                      Votre position
                    </div>
                    <div style={{
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      width: 44, height: 44, borderRadius: 12,
                      background: '#E8F5F1', color: '#0F7B6C',
                      fontSize: 22, fontWeight: 700,
                    }}>
                      3
                    </div>
                  </div>
                )}

                {/* Estimated wait */}
                {showEstimatedWait && (
                  <div style={{
                    textAlign: 'center', fontSize: 11, color: '#9E9B90', fontWeight: 500,
                    marginBottom: funFactsEnabled ? 10 : 0,
                  }}>
                    Attente estimee: <span style={{ fontWeight: 700, color: '#6B6960' }}>~45 min</span>
                  </div>
                )}

                {/* Fun fact card */}
                {funFactsEnabled && (
                  <div style={{
                    background: '#E8F5F1', borderRadius: 8, padding: '10px 12px',
                  }}>
                    <div style={{
                      fontSize: 9, fontWeight: 700, color: '#0F7B6C',
                      textTransform: 'uppercase' as const, letterSpacing: '0.5px', marginBottom: 4,
                    }}>
                      Le saviez-vous ?
                    </div>
                    <div style={{ fontSize: 10, color: '#0F7B6C', lineHeight: 1.4 }}>
                      Le coeur humain bat environ 100 000 fois par jour, pompant environ 7 500 litres de sang.
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
