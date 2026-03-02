import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/stores/authStore';
import { api } from '@/lib/api';
import '@/components/receptionist/receptionist.css';

interface BSQueueRulesPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

type QueueMode = 'RDV_PRIORITY' | 'FIFO' | 'RDV_ON_TIME';

const MIN_GRACE = 5;
const MAX_GRACE = 30;

const MODES: { key: QueueMode; icon: string; iconBg: string; iconColor: string }[] = [
  { key: 'RDV_PRIORITY', icon: 'calendar_month', iconBg: '#E8F5F1', iconColor: '#0F7B6C' },
  { key: 'FIFO', icon: 'group', iconBg: '#EDF3FC', iconColor: '#3B7DD9' },
  { key: 'RDV_ON_TIME', icon: 'schedule', iconBg: '#FEF7E6', iconColor: '#D4920B' },
];

export default function BSQueueRulesPanel({ isOpen, onClose }: BSQueueRulesPanelProps) {
  const { t } = useTranslation();
  const { clinic } = useAuthStore();
  const [mode, setMode] = useState<QueueMode>('RDV_PRIORITY');
  const [grace, setGrace] = useState(15);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const savedModeRef = useRef<QueueMode>('RDV_PRIORITY');
  const savedGraceRef = useRef(15);

  useEffect(() => {
    if (clinic) {
      const m = (clinic.queueMode as QueueMode) || 'RDV_PRIORITY';
      const g = clinic.rdvGraceMinutes ?? 15;
      setMode(m);
      setGrace(g);
      savedModeRef.current = m;
      savedGraceRef.current = g;
    }
  }, [clinic]);

  const hasChanges = useCallback(() => {
    return savedModeRef.current !== mode || savedGraceRef.current !== grace;
  }, [mode, grace]);

  const autoSave = useCallback(async () => {
    if (!hasChanges()) return;
    setAutoSaveStatus('saving');
    try {
      await api.updateClinic({ queueMode: mode, rdvGraceMinutes: grace });
      savedModeRef.current = mode;
      savedGraceRef.current = grace;
      setAutoSaveStatus('saved');
      setTimeout(() => setAutoSaveStatus('idle'), 2000);
    } catch {
      setAutoSaveStatus('error');
      setTimeout(() => setAutoSaveStatus('idle'), 3000);
    }
  }, [mode, grace, hasChanges]);

  const handleClose = useCallback(async () => {
    if (hasChanges()) {
      await autoSave();
    }
    onClose();
  }, [hasChanges, autoSave, onClose]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape' && isOpen) handleClose(); };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [isOpen, handleClose]);

  const modeLabels: Record<QueueMode, { title: string; desc: string }> = {
    RDV_PRIORITY: {
      title: t('settings.queueRules.rdvPriority', 'RDV prioritaire'),
      desc: t('settings.queueRules.rdvPriorityDesc', 'Les patients avec RDV passent avant les sans RDV'),
    },
    FIFO: {
      title: t('settings.queueRules.fifo', 'Premier arrivé'),
      desc: t('settings.queueRules.fifoDesc', "Ordre d'arrivée, le RDV est informatif"),
    },
    RDV_ON_TIME: {
      title: t('settings.queueRules.rdvOnTime', "RDV à l'heure"),
      desc: t('settings.queueRules.rdvOnTimeDesc', 'RDV prioritaire seulement si arrivé à l\'heure'),
    },
  };

  return (
    <>
      {isOpen && <div className="bs-panel-backdrop" onClick={handleClose} />}

      <div className={`bs-right-panel ${isOpen ? 'open' : ''}`} style={{ zIndex: 95 }}>
        {/* Header */}
        <div className="bs-panel-header">
          <button onClick={handleClose} className="bs-panel-back">
            <span className="material-symbols-rounded" style={{ fontSize: 22 }}>arrow_back</span>
          </button>
          <span className="bs-panel-title">
            {t('settings.queueRules.title', "Règles de la file")}
          </span>
        </div>

        <div className="bs-panel-body">
          {/* Mode selector cards */}
          <div className="bs-settings-label">
            {t('settings.queueRules.modeLabel', "Mode de tri")}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
            {MODES.map(({ key, icon, iconBg, iconColor }) => {
              const isActive = mode === key;
              return (
                <button
                  key={key}
                  onClick={() => setMode(key)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '14px 16px',
                    border: isActive ? '2px solid #0F7B6C' : '1.5px solid #E8E6DF',
                    borderRadius: 14,
                    background: isActive ? '#F0FAF7' : '#FFFFFF',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontFamily: 'inherit',
                    transition: 'all 0.15s',
                    width: '100%',
                  }}
                >
                  {/* Icon */}
                  <div style={{
                    width: 40, height: 40, borderRadius: 10,
                    background: iconBg,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <span className="material-symbols-rounded" style={{ fontSize: 20, color: iconColor }}>
                      {icon}
                    </span>
                  </div>

                  {/* Text */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#1A1A1A' }}>
                      {modeLabels[key].title}
                    </div>
                    <div style={{ fontSize: 12, color: '#8E9693', lineHeight: 1.3, marginTop: 2 }}>
                      {modeLabels[key].desc}
                    </div>
                  </div>

                  {/* Check indicator */}
                  {isActive && (
                    <span className="material-symbols-rounded" style={{
                      fontSize: 20, color: '#0F7B6C', flexShrink: 0,
                      fontVariationSettings: "'FILL' 1",
                    }}>
                      check_circle
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Grace period stepper — only for RDV_ON_TIME */}
          {mode === 'RDV_ON_TIME' && (
            <>
              <div className="bs-settings-label">
                {t('settings.queueRules.graceLabel', "Tolérance de retard")}
              </div>
              <div style={{
                background: '#FFF',
                border: '1px solid #E8E6DF',
                borderRadius: 14,
                padding: '20px 16px',
                marginBottom: 20,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
                  <button
                    onClick={() => setGrace(prev => Math.max(MIN_GRACE, prev - 5))}
                    style={{
                      width: 40, height: 40, borderRadius: '50%',
                      border: '2px solid #E8E6DF', background: '#FFF',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', color: '#6B6960',
                    }}
                  >
                    <span className="material-symbols-rounded" style={{ fontSize: 20 }}>remove</span>
                  </button>

                  <div style={{ textAlign: 'center', minWidth: 80 }}>
                    <div style={{ fontSize: 28, fontWeight: 700, color: '#1A1A1A' }}>{grace}</div>
                    <div style={{ fontSize: 12, color: '#9E9B90', fontWeight: 500 }}>minutes</div>
                  </div>

                  <button
                    onClick={() => setGrace(prev => Math.min(MAX_GRACE, prev + 5))}
                    style={{
                      width: 40, height: 40, borderRadius: '50%',
                      border: '2px solid #E8E6DF', background: '#FFF',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', color: '#6B6960',
                    }}
                  >
                    <span className="material-symbols-rounded" style={{ fontSize: 20 }}>add</span>
                  </button>
                </div>

                <div style={{ fontSize: 12, color: '#8E9693', textAlign: 'center', marginTop: 12, lineHeight: 1.5 }}>
                  {t('settings.queueRules.graceExplain',
                    'Un patient avec RDV qui arrive plus de {{minutes}} min en retard perd sa priorité',
                    { minutes: grace }
                  )}
                </div>
              </div>
            </>
          )}

          {/* Auto-save indicator */}
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
            }}>
              <span className="material-symbols-rounded" style={{ fontSize: 14 }}>
                {autoSaveStatus === 'saving' ? 'sync' : autoSaveStatus === 'saved' ? 'check_circle' : 'error'}
              </span>
              {autoSaveStatus === 'saving' && t('settings.autoSave.saving', 'Enregistrement...')}
              {autoSaveStatus === 'saved' && t('settings.autoSave.saved', 'Modifications enregistrées')}
              {autoSaveStatus === 'error' && t('settings.autoSave.error', "Erreur lors de l'enregistrement")}
            </div>
          )}

          {/* Explanation card */}
          <div style={{
            background: '#FFF',
            border: '1px solid #E8E6DF',
            borderRadius: 12,
            padding: '14px 16px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: 10,
          }}>
            <span className="material-symbols-rounded" style={{ fontSize: 18, color: '#9E9B90', marginTop: 1 }}>
              info
            </span>
            <div style={{ fontSize: 12, color: '#8E9693', lineHeight: 1.5 }}>
              {t('settings.queueRules.emergencyNote',
                "L'urgence est toujours disponible. Utilisez le menu patient pour marquer un patient comme urgence — il passera juste après la consultation en cours."
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
