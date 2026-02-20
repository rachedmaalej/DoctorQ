import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { api } from '@/lib/api';
import '@/components/receptionist/receptionist.css';

interface BSConsultationDurationPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function BSConsultationDurationPanel({ isOpen, onClose }: BSConsultationDurationPanelProps) {
  const { clinic } = useAuthStore();
  const [avgMins, setAvgMins] = useState(10);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const savedRef = useRef(10);

  // Sync from clinic data
  useEffect(() => {
    if (clinic) {
      const val = clinic.avgConsultationMins || 10;
      setAvgMins(val);
      savedRef.current = val;
    }
  }, [clinic]);

  const hasChanges = useCallback(() => savedRef.current !== avgMins, [avgMins]);

  const autoSave = useCallback(async () => {
    if (!hasChanges()) return;
    setAutoSaveStatus('saving');
    try {
      await api.updateClinic({ avgConsultationMins: avgMins });
      savedRef.current = avgMins;
      setAutoSaveStatus('saved');
      setTimeout(() => setAutoSaveStatus('idle'), 2000);
    } catch {
      setAutoSaveStatus('error');
      setTimeout(() => setAutoSaveStatus('idle'), 3000);
    }
  }, [avgMins, hasChanges]);

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
          <div className="bs-settings-label">Durée moyenne</div>
          <div className="bs-settings-group" style={{ padding: '16px 14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 500, color: '#1A1A1A' }}>Consultation</div>
                <div style={{ fontSize: 11, color: '#9E9B90', marginTop: 1 }}>Minutes par patient</div>
              </div>
              <div className="bs-stepper">
                <button
                  className="bs-stepper-btn"
                  onClick={() => setAvgMins(prev => Math.max(5, prev - 1))}
                >
                  <span className="material-symbols-rounded" style={{ fontSize: 18 }}>remove</span>
                </button>
                <div className="bs-stepper-value">{avgMins}</div>
                <button
                  className="bs-stepper-btn"
                  onClick={() => setAvgMins(prev => Math.min(60, prev + 1))}
                >
                  <span className="material-symbols-rounded" style={{ fontSize: 18 }}>add</span>
                </button>
              </div>
            </div>
            <div style={{ fontSize: 11, color: '#9E9B90', marginTop: 12, lineHeight: 1.4 }}>
              Cette valeur est utilisée pour estimer le temps d'attente de vos patients.
            </div>
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
              {autoSaveStatus === 'saved' && 'Modifications enregistrées'}
              {autoSaveStatus === 'error' && "Erreur lors de l'enregistrement"}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
