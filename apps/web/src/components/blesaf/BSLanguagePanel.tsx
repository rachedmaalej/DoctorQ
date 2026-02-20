import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/stores/authStore';
import { api } from '@/lib/api';
import '@/components/receptionist/receptionist.css';

interface BSLanguagePanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function BSLanguagePanel({ isOpen, onClose }: BSLanguagePanelProps) {
  const { i18n } = useTranslation();
  const { clinic } = useAuthStore();
  const [selectedLang, setSelectedLang] = useState<'fr' | 'ar'>('fr');
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  // Sync from clinic data
  useEffect(() => {
    if (clinic) {
      setSelectedLang((clinic.language as 'fr' | 'ar') || 'fr');
    }
  }, [clinic]);

  // Close on Escape
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape' && isOpen) onClose(); };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [isOpen, onClose]);

  const handleSelectLanguage = useCallback(async (lang: 'fr' | 'ar') => {
    if (lang === selectedLang) return;
    setSelectedLang(lang);
    i18n.changeLanguage(lang);
    setAutoSaveStatus('saving');
    try {
      await api.updateClinic({ language: lang });
      setAutoSaveStatus('saved');
      setTimeout(() => setAutoSaveStatus('idle'), 2000);
    } catch {
      setAutoSaveStatus('error');
      setTimeout(() => setAutoSaveStatus('idle'), 3000);
    }
  }, [selectedLang, i18n]);

  return (
    <>
      {isOpen && <div className="bs-panel-backdrop" onClick={onClose} />}

      <div className={`bs-right-panel ${isOpen ? 'open' : ''}`} style={{ zIndex: 95 }}>
        {/* Header */}
        <div className="bs-panel-header">
          <button onClick={onClose} className="bs-panel-back">
            <span className="material-symbols-rounded" style={{ fontSize: 22 }}>arrow_back</span>
          </button>
          <span className="bs-panel-title">Langue</span>
        </div>

        <div className="bs-panel-body">
          <div className="bs-settings-label">Langue de l'application</div>
          <div className="bs-settings-group">
            {/* Français */}
            <button className="bs-settings-item" onClick={() => handleSelectLanguage('fr')}>
              <div className="bs-settings-ico" style={{ background: '#F0EFEA', color: '#6B6960' }}>
                <span className="material-symbols-rounded" style={{ fontSize: 18 }}>translate</span>
              </div>
              <div className="bs-settings-txt">
                <div className="bs-settings-name">Français</div>
                <div className="bs-settings-desc">French</div>
              </div>
              {selectedLang === 'fr' && (
                <span className="material-symbols-rounded" style={{ color: '#0F7B6C', fontSize: 20 }}>
                  check_circle
                </span>
              )}
            </button>

            {/* العربية */}
            <button className="bs-settings-item" onClick={() => handleSelectLanguage('ar')}>
              <div className="bs-settings-ico" style={{ background: '#F0EFEA', color: '#6B6960' }}>
                <span className="material-symbols-rounded" style={{ fontSize: 18 }}>translate</span>
              </div>
              <div className="bs-settings-txt">
                <div className="bs-settings-name">العربية</div>
                <div className="bs-settings-desc">Arabic</div>
              </div>
              {selectedLang === 'ar' && (
                <span className="material-symbols-rounded" style={{ color: '#0F7B6C', fontSize: 20 }}>
                  check_circle
                </span>
              )}
            </button>
          </div>

          <div style={{ fontSize: 11, color: '#9E9B90', marginTop: 8, padding: '0 4px', lineHeight: 1.4 }}>
            Change la langue de l'interface et des notifications patients.
          </div>

          {/* Auto-save indicator */}
          {autoSaveStatus !== 'idle' && (
            <div
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                padding: '10px 20px', fontSize: 12, fontWeight: 500,
                color: autoSaveStatus === 'error' ? '#D94F3B' : '#0F7B6C',
                transition: 'opacity 0.3s',
              }}
            >
              <span className="material-symbols-rounded" style={{ fontSize: 16 }}>
                {autoSaveStatus === 'saving' ? 'sync' : autoSaveStatus === 'saved' ? 'check_circle' : 'error'}
              </span>
              {autoSaveStatus === 'saving' && 'Enregistrement...'}
              {autoSaveStatus === 'saved' && 'Langue mise à jour'}
              {autoSaveStatus === 'error' && "Erreur lors de l'enregistrement"}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
