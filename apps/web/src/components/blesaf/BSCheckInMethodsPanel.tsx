import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { api } from '@/lib/api';
import '@/components/receptionist/receptionist.css';

interface BSCheckInMethodsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

type CheckInMethodType = 'QR_CODE' | 'MANUAL' | 'WHATSAPP';

export default function BSCheckInMethodsPanel({ isOpen, onClose }: BSCheckInMethodsPanelProps) {
  const { clinic } = useAuthStore();

  const [enableQrCode, setEnableQrCode] = useState(true);
  const [enableManualEntry] = useState(true);
  const [enableWhatsApp, setEnableWhatsApp] = useState(false);
  const [defaultCheckInMethod, setDefaultCheckInMethod] = useState<CheckInMethodType>('MANUAL');
  const [whatsAppPhone, setWhatsAppPhone] = useState('');
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  // Sync clinic values
  useEffect(() => {
    if (clinic) {
      setEnableQrCode(clinic.enableQrCode !== false);
      setEnableWhatsApp(clinic.enableWhatsApp === true);
      setDefaultCheckInMethod((clinic.defaultCheckInMethod as CheckInMethodType) || 'MANUAL');
      setWhatsAppPhone((clinic as any).phone || '');
    }
  }, [clinic]);

  // Close on Escape
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

  const handleToggleQrCode = useCallback(() => {
    const next = !enableQrCode;
    setEnableQrCode(next);
    // If disabling the current default method, fall back to MANUAL
    if (!next && defaultCheckInMethod === 'QR_CODE') {
      setDefaultCheckInMethod('MANUAL');
      save({ enableQrCode: next, defaultCheckInMethod: 'MANUAL' });
    } else {
      save({ enableQrCode: next });
    }
  }, [enableQrCode, defaultCheckInMethod, save]);

  const handleToggleWhatsApp = useCallback(() => {
    const next = !enableWhatsApp;
    setEnableWhatsApp(next);
    // If disabling the current default method, fall back to MANUAL
    if (!next && defaultCheckInMethod === 'WHATSAPP') {
      setDefaultCheckInMethod('MANUAL');
      save({ enableWhatsApp: next, defaultCheckInMethod: 'MANUAL' });
    } else {
      save({ enableWhatsApp: next });
    }
  }, [enableWhatsApp, defaultCheckInMethod, save]);

  const handleSetDefault = useCallback((method: CheckInMethodType) => {
    if (method === defaultCheckInMethod) return;
    // Only allow setting default if method is enabled
    if (method === 'QR_CODE' && !enableQrCode) return;
    if (method === 'WHATSAPP' && !enableWhatsApp) return;
    setDefaultCheckInMethod(method);
    save({ defaultCheckInMethod: method });
  }, [defaultCheckInMethod, enableQrCode, enableWhatsApp, save]);

  const handleWhatsAppPhoneChange = useCallback((input: string) => {
    // Strip to digits only (after +216 prefix)
    let stripped = input.replace(/[^\d]/g, '');
    if (stripped.length > 8) stripped = stripped.slice(0, 8);
    setWhatsAppPhone('+216' + stripped);
  }, []);

  // Format phone for display: XX XXX XXX
  const formatLocalPhone = (phone: string): string => {
    const local = phone.replace(/^\+216/, '').replace(/\D/g, '');
    if (local.length <= 2) return local;
    if (local.length <= 5) return `${local.slice(0, 2)} ${local.slice(2)}`;
    return `${local.slice(0, 2)} ${local.slice(2, 5)} ${local.slice(5, 8)}`;
  };

  // Toggle switch component
  const Toggle = useCallback(({ on, onClick, disabled }: { on: boolean; onClick?: () => void; disabled?: boolean }) => (
    <div
      onClick={disabled ? undefined : onClick}
      style={{
        width: 44, height: 24, borderRadius: 12, position: 'relative',
        cursor: disabled ? 'default' : 'pointer', flexShrink: 0,
        background: on ? '#0F7B6C' : '#E8E6DF',
        transition: 'background 0.2s',
        opacity: disabled ? 0.5 : 1,
        pointerEvents: disabled ? 'none' : 'auto',
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
          <span className="bs-panel-title">Methodes d'enregistrement</span>
        </div>

        <div className="bs-panel-body">

          {/* ── Available Methods ── */}
          <div className="bs-settings-label">Methodes disponibles</div>

          {/* ── QR Code Card ── */}
          <div style={{
            background: '#FFF',
            border: `1px solid ${enableQrCode ? '#0F7B6C' : '#E8E6DF'}`,
            borderRadius: 14,
            marginBottom: 12,
            overflow: 'hidden',
            transition: 'border-color 0.2s',
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '16px 16px 14px',
            }}>
              {/* Icon */}
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: '#E8F5F1', color: '#0F7B6C',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <span className="material-symbols-rounded" style={{ fontSize: 24 }}>qr_code_2</span>
              </div>
              {/* Text */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#1A1A1A' }}>QR Code</div>
                <div style={{ fontSize: 12, color: '#9E9B90', marginTop: 2 }}>
                  Les patients scannent un code QR a l'entree du cabinet
                </div>
              </div>
              {/* Toggle */}
              <Toggle on={enableQrCode} onClick={handleToggleQrCode} />
            </div>

            {/* Expandable QR Preview */}
            <div style={{
              maxHeight: enableQrCode ? 200 : 0,
              opacity: enableQrCode ? 1 : 0,
              overflow: 'hidden',
              transition: 'max-height 0.3s ease, opacity 0.25s ease',
            }}>
              <div style={{
                padding: '0 16px 16px',
                borderTop: '1px solid #E8E6DF',
                paddingTop: 14,
              }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 16,
                }}>
                  {/* QR Placeholder */}
                  <div style={{
                    width: 120, height: 120, borderRadius: 12,
                    background: '#F6F5F0', border: '1px solid #E8E6DF',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <span className="material-symbols-rounded" style={{ fontSize: 48, color: '#D4D2CC' }}>
                      qr_code_2
                    </span>
                  </div>
                  {/* Buttons */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
                    <button style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                      padding: '10px 16px', borderRadius: 10,
                      background: '#0F7B6C', color: '#FFF',
                      border: 'none', cursor: 'pointer',
                      fontSize: 13, fontWeight: 600,
                      transition: 'opacity 0.15s',
                    }}>
                      <span className="material-symbols-rounded" style={{ fontSize: 18 }}>download</span>
                      Telecharger
                    </button>
                    <button style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                      padding: '10px 16px', borderRadius: 10,
                      background: '#FFF', color: '#1A1A1A',
                      border: '1px solid #E8E6DF', cursor: 'pointer',
                      fontSize: 13, fontWeight: 600,
                      transition: 'border-color 0.15s',
                    }}>
                      <span className="material-symbols-rounded" style={{ fontSize: 18 }}>print</span>
                      Imprimer
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Manual Entry Card ── */}
          <div style={{
            background: '#FFF',
            border: '1px solid #0F7B6C',
            borderRadius: 14,
            marginBottom: 12,
            overflow: 'hidden',
            transition: 'border-color 0.2s',
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '16px 16px 14px',
            }}>
              {/* Icon */}
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: '#EDF3FC', color: '#3B7DD9',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <span className="material-symbols-rounded" style={{ fontSize: 24 }}>person_add</span>
              </div>
              {/* Text */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#1A1A1A' }}>Saisie manuelle</div>
                <div style={{ fontSize: 12, color: '#9E9B90', marginTop: 2 }}>
                  La secretaire inscrit le patient manuellement
                </div>
              </div>
              {/* Toggle (always on, disabled) */}
              <Toggle on={enableManualEntry} disabled />
            </div>

            {/* Info bar */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '10px 16px',
              background: '#F6F5F0',
              borderTop: '1px solid #E8E6DF',
            }}>
              <span className="material-symbols-rounded" style={{ fontSize: 16, color: '#9E9B90' }}>info</span>
              <span style={{ fontSize: 11, color: '#9E9B90', fontWeight: 500 }}>
                Cette methode est toujours active comme methode de secours
              </span>
            </div>
          </div>

          {/* ── WhatsApp Card ── */}
          <div style={{
            background: '#FFF',
            border: `1px solid ${enableWhatsApp ? '#0F7B6C' : '#E8E6DF'}`,
            borderRadius: 14,
            marginBottom: 12,
            overflow: 'hidden',
            transition: 'border-color 0.2s',
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '16px 16px 14px',
            }}>
              {/* Icon */}
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: '#E8F8EB', color: '#25D366',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <span className="material-symbols-rounded" style={{ fontSize: 24 }}>chat</span>
              </div>
              {/* Text */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#1A1A1A' }}>WhatsApp</div>
                <div style={{ fontSize: 12, color: '#9E9B90', marginTop: 2 }}>
                  Inscription via message WhatsApp
                </div>
              </div>
              {/* Toggle */}
              <Toggle on={enableWhatsApp} onClick={handleToggleWhatsApp} />
            </div>

            {/* Expandable WhatsApp phone input */}
            <div style={{
              maxHeight: enableWhatsApp ? 120 : 0,
              opacity: enableWhatsApp ? 1 : 0,
              overflow: 'hidden',
              transition: 'max-height 0.3s ease, opacity 0.25s ease',
            }}>
              <div style={{
                padding: '0 16px 16px',
                borderTop: '1px solid #E8E6DF',
                paddingTop: 14,
              }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#1A1A1A', marginBottom: 8 }}>
                  Numero WhatsApp
                </div>
                <div dir="ltr" style={{
                  display: 'flex', alignItems: 'center',
                  border: '1.5px solid #E8E6DF', borderRadius: 10,
                  overflow: 'hidden',
                  transition: 'border-color 0.2s',
                }}>
                  <div style={{
                    padding: '10px 12px',
                    background: '#F6F5F0',
                    borderRight: '1.5px solid #E8E6DF',
                    fontSize: 13, fontWeight: 600, color: '#6B6960',
                    flexShrink: 0,
                  }}>
                    +216
                  </div>
                  <input
                    type="tel"
                    value={formatLocalPhone(whatsAppPhone)}
                    onChange={e => handleWhatsAppPhoneChange(e.target.value)}
                    placeholder="XX XXX XXX"
                    style={{
                      flex: 1, border: 'none', outline: 'none',
                      padding: '10px 12px',
                      fontSize: 14, fontWeight: 500, color: '#1A1A1A',
                      background: 'transparent',
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ── Auto-save indicator ── */}
          {autoSaveStatus !== 'idle' && (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
              padding: '8px 0', fontSize: 11, fontWeight: 500,
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

          {/* ── Default Method Selector ── */}
          <div className="bs-settings-label">Methode par defaut</div>

          <div style={{
            background: '#F0EFEA',
            borderRadius: 10,
            padding: 3,
            display: 'flex',
            marginBottom: 12,
          }}>
            {/* QR option */}
            <button
              onClick={() => handleSetDefault('QR_CODE')}
              style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                padding: '10px 0', borderRadius: 8,
                border: 'none', cursor: enableQrCode ? 'pointer' : 'not-allowed',
                background: defaultCheckInMethod === 'QR_CODE' ? '#FFF' : 'transparent',
                boxShadow: defaultCheckInMethod === 'QR_CODE' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                color: defaultCheckInMethod === 'QR_CODE' ? '#1A1A1A' : '#9E9B90',
                fontSize: 12, fontWeight: 600,
                opacity: enableQrCode ? 1 : 0.4,
                transition: 'all 0.2s',
              }}
            >
              <span className="material-symbols-rounded" style={{ fontSize: 16 }}>qr_code_2</span>
              QR
            </button>

            {/* Manual option */}
            <button
              onClick={() => handleSetDefault('MANUAL')}
              style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                padding: '10px 0', borderRadius: 8,
                border: 'none', cursor: 'pointer',
                background: defaultCheckInMethod === 'MANUAL' ? '#FFF' : 'transparent',
                boxShadow: defaultCheckInMethod === 'MANUAL' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                color: defaultCheckInMethod === 'MANUAL' ? '#1A1A1A' : '#9E9B90',
                fontSize: 12, fontWeight: 600,
                transition: 'all 0.2s',
              }}
            >
              <span className="material-symbols-rounded" style={{ fontSize: 16 }}>person_add</span>
              Manuel
            </button>

            {/* WhatsApp option */}
            <button
              onClick={() => handleSetDefault('WHATSAPP')}
              style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                padding: '10px 0', borderRadius: 8,
                border: 'none', cursor: enableWhatsApp ? 'pointer' : 'not-allowed',
                background: defaultCheckInMethod === 'WHATSAPP' ? '#FFF' : 'transparent',
                boxShadow: defaultCheckInMethod === 'WHATSAPP' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                color: defaultCheckInMethod === 'WHATSAPP' ? '#1A1A1A' : '#9E9B90',
                fontSize: 12, fontWeight: 600,
                opacity: enableWhatsApp ? 1 : 0.4,
                transition: 'all 0.2s',
              }}
            >
              <span className="material-symbols-rounded" style={{ fontSize: 16 }}>chat</span>
              WhatsApp
            </button>
          </div>

          {/* Help text */}
          <div style={{
            display: 'flex', alignItems: 'flex-start', gap: 6,
            padding: '0 4px',
          }}>
            <span className="material-symbols-rounded" style={{ fontSize: 14, color: '#9E9B90', marginTop: 1 }}>info</span>
            <span style={{ fontSize: 11, color: '#9E9B90', lineHeight: 1.5 }}>
              Methode pre-selectionnee sur la page d'enregistrement des patients
            </span>
          </div>

        </div>
      </div>
    </>
  );
}
