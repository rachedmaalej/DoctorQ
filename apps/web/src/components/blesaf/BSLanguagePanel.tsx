import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/stores/authStore';
import { api } from '@/lib/api';
import '@/components/receptionist/receptionist.css';

interface BSLanguagePanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const LANGUAGES = [
  { code: 'fr' as const, flag: '\u{1F1F9}\u{1F1F3}', native: 'Français', english: 'French', dir: 'LTR', dirLabel: 'gauche à droite' },
  { code: 'ar' as const, flag: '\u{1F1F9}\u{1F1F3}', native: '\u0627\u0644\u0639\u0631\u0628\u064A\u0629', english: 'Arabic', dir: 'RTL', dirLabel: 'droite à gauche' },
];

export default function BSLanguagePanel({ isOpen, onClose }: BSLanguagePanelProps) {
  const { i18n } = useTranslation();
  const { clinic } = useAuthStore();
  const [selectedLang, setSelectedLang] = useState<'fr' | 'ar'>('fr');
  const [showSwitcher, setShowSwitcher] = useState(true);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  useEffect(() => {
    if (clinic) {
      setSelectedLang((clinic.language as 'fr' | 'ar') || 'fr');
      setShowSwitcher(clinic.enableLanguageSwitcher !== false);
    }
  }, [clinic]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape' && isOpen) onClose(); };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [isOpen, onClose]);

  const save = useCallback(async (updates: Record<string, unknown>) => {
    setAutoSaveStatus('saving');
    try {
      await api.updateClinic(updates as any);
      setAutoSaveStatus('saved');
      setTimeout(() => setAutoSaveStatus('idle'), 2000);
    } catch {
      setAutoSaveStatus('error');
      setTimeout(() => setAutoSaveStatus('idle'), 3000);
    }
  }, []);

  const handleSelectLanguage = useCallback(async (lang: 'fr' | 'ar') => {
    if (lang === selectedLang) return;
    setSelectedLang(lang);
    i18n.changeLanguage(lang);
    save({ language: lang });
  }, [selectedLang, i18n, save]);

  const handleToggleSwitcher = useCallback(() => {
    const next = !showSwitcher;
    setShowSwitcher(next);
    save({ enableLanguageSwitcher: next });
  }, [showSwitcher, save]);

  const current = LANGUAGES.find(l => l.code === selectedLang) || LANGUAGES[0];

  return (
    <>
      {isOpen && <div className="bs-panel-backdrop" onClick={onClose} />}

      <div className={`bs-right-panel ${isOpen ? 'open' : ''}`} style={{ zIndex: 95 }}>
        <div className="bs-panel-header">
          <button onClick={onClose} className="bs-panel-back">
            <span className="material-symbols-rounded" style={{ fontSize: 22 }}>arrow_back</span>
          </button>
          <span className="bs-panel-title">Langue</span>
        </div>

        <div className="bs-panel-body">
          {/* Language selection */}
          <div className="bs-settings-label">Langue de l'interface</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
            {LANGUAGES.map(lang => {
              const selected = selectedLang === lang.code;
              return (
                <div
                  key={lang.code}
                  onClick={() => handleSelectLanguage(lang.code)}
                  style={{
                    background: selected ? '#F0FAF8' : '#FFF',
                    border: `2px solid ${selected ? '#0F7B6C' : '#E8E6DF'}`,
                    borderRadius: 14,
                    padding: '16px 18px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  <div style={{
                    width: 44, height: 44, borderRadius: 10,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 28, flexShrink: 0,
                    background: selected ? '#E8F5F1' : '#F6F5F0',
                  }}>
                    {lang.flag}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: 16, fontWeight: 700, color: '#1A1A1A',
                      fontFamily: lang.code === 'ar' ? "'IBM Plex Sans Arabic', sans-serif" : 'inherit',
                    }}>
                      {lang.native}
                    </div>
                    <div style={{ fontSize: 12, color: '#9E9B90', marginTop: 1 }}>{lang.english}</div>
                    <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
                      <span style={{
                        fontSize: 9, fontWeight: 600, textTransform: 'uppercase' as const,
                        padding: '2px 6px', borderRadius: 100,
                        background: lang.dir === 'RTL' ? '#FDF5E6' : '#E8F5F1',
                        color: lang.dir === 'RTL' ? '#D4920B' : '#0F7B6C',
                      }}>
                        {lang.dir === 'RTL' ? '\u2190 RTL' : 'LTR \u2192'}
                      </span>
                    </div>
                  </div>
                  <div style={{
                    width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    ...(selected
                      ? { background: '#0F7B6C', color: '#FFF' }
                      : { border: '2px solid #E8E6DF' }
                    ),
                  }}>
                    {selected && (
                      <span className="material-symbols-rounded" style={{ fontSize: 16 }}>check</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Auto-save indicator */}
          {autoSaveStatus !== 'idle' && (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
              padding: '8px 0', fontSize: 11, fontWeight: 500,
              color: autoSaveStatus === 'error' ? '#D94F3B' : '#2D8B4E',
            }}>
              <span className="material-symbols-rounded" style={{ fontSize: 14 }}>
                {autoSaveStatus === 'saving' ? 'sync' : autoSaveStatus === 'saved' ? 'check_circle' : 'error'}
              </span>
              {autoSaveStatus === 'saving' && 'Enregistrement...'}
              {autoSaveStatus === 'saved' && 'Modifications enregistrées'}
              {autoSaveStatus === 'error' && "Erreur lors de l'enregistrement"}
            </div>
          )}

          {/* Patient-facing settings */}
          <div className="bs-settings-label">Affichage patient</div>
          <div className="bs-settings-group">
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px',
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: '#EDF3FC', color: '#3B7DD9', flexShrink: 0,
              }}>
                <span className="material-symbols-rounded" style={{ fontSize: 18 }}>language</span>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: '#1A1A1A' }}>Sélecteur de langue</div>
                <div style={{ fontSize: 11, color: '#9E9B90', marginTop: 1 }}>Permettre aux patients de changer la langue</div>
              </div>
              <div
                onClick={handleToggleSwitcher}
                style={{
                  width: 44, height: 24, borderRadius: 12, position: 'relative',
                  cursor: 'pointer', flexShrink: 0,
                  background: showSwitcher ? '#0F7B6C' : '#E8E6DF',
                  transition: 'background 0.2s',
                }}
              >
                <div style={{
                  position: 'absolute', top: 3, width: 18, height: 18, borderRadius: '50%',
                  background: '#FFF', boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
                  left: showSwitcher ? 23 : 3, transition: 'left 0.2s',
                }} />
              </div>
            </div>
          </div>

          {/* Preview section */}
          <div className="bs-settings-label" style={{ marginTop: 12 }}>Aperçu patient</div>
          <div style={{
            background: '#FFF', border: '1px solid #E8E6DF', borderRadius: 12, overflow: 'hidden',
          }}>
            <div style={{
              padding: '10px 16px', borderBottom: '1px solid #E8E6DF',
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <span className="material-symbols-rounded" style={{ fontSize: 16, color: '#9E9B90' }}>visibility</span>
              <span style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.8px', color: '#9E9B90' }}>
                Ce que voit le patient
              </span>
              <span style={{
                fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 100,
                background: current.dir === 'RTL' ? '#FDF5E6' : '#E8F5F1',
                color: current.dir === 'RTL' ? '#D4920B' : '#0F7B6C',
                marginLeft: 'auto',
              }}>
                {selectedLang.toUpperCase()}
              </span>
            </div>
            <div style={{ padding: 16 }}>
              <div style={{
                background: '#F6F5F0', border: '1px solid #E8E6DF', borderRadius: 12,
                padding: 12, fontSize: 12,
                direction: current.dir === 'RTL' ? 'rtl' : 'ltr',
              }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#9E9B90', marginBottom: 8, textTransform: 'uppercase' as const, letterSpacing: '0.6px' }}>
                  {selectedLang === 'ar' ? '\u0635\u0641\u062D\u0629 \u062D\u0627\u0644\u0629 \u0627\u0644\u0645\u0631\u064A\u0636' : 'Page statut patient'}
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#1A1A1A', marginBottom: 4 }}>
                  {selectedLang === 'ar' ? '\u0645\u0631\u062D\u0628\u064B\u0627 \u0628\u0643\u0645 \u0641\u064A \u0627\u0644\u0639\u064A\u0627\u062F\u0629' : 'Bienvenue au cabinet'}
                </div>
                <div style={{ fontSize: 12, color: '#6B6960', marginBottom: 8 }}>
                  {selectedLang === 'ar' ? '\u0645\u0648\u0642\u0639\u0643 \u0641\u064A \u0627\u0644\u0637\u0627\u0628\u0648\u0631 :' : "Votre position dans la file d'attente :"}
                </div>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  background: '#E8F5F1', padding: '6px 12px', borderRadius: 8,
                  fontSize: 16, fontWeight: 700, color: '#0F7B6C',
                }}>
                  <span className="material-symbols-rounded" style={{ fontSize: 18 }}>groups</span>
                  3
                </div>
              </div>
            </div>
            <div style={{
              padding: '10px 16px', background: '#F6F5F0', borderTop: '1px solid #E8E6DF',
              fontSize: 11, color: '#9E9B90', fontWeight: 500,
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <span className="material-symbols-rounded" style={{ fontSize: 14 }}>text_format</span>
              Direction du texte: <span style={{ fontSize: 13, fontWeight: 700 }}>
                {current.dir === 'RTL' ? '\u2190 RTL' : 'LTR \u2192'}
              </span> ({current.dirLabel})
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
