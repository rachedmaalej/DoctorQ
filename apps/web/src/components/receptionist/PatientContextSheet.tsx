import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import clsx from 'clsx';
import type { QueuePatient } from './types';
import { api } from '@/lib/api';
import { webBrand } from '@/lib/brand';
import { logger } from '@/lib/logger';

interface PatientContextSheetProps {
  isOpen: boolean;
  patient: QueuePatient | null;
  onClose: () => void;
  onMarkEmergency?: (id: string) => void;
  onRemove?: (id: string) => void;
  onPhoneUpdated?: () => void;
}

const actions = [
  { key: 'emergency', icon: 'emergency', iconBg: '#FDF0ED', iconColor: '#D94F3B' },
  { key: 'copy-url', icon: 'link', iconBg: '#EDF3FC', iconColor: '#3B7DD9' },
  { key: 'whatsapp', icon: 'whatsapp', iconBg: '#E8F7EE', iconColor: '#25D366' },
  { key: 'remove', icon: 'person_remove', iconBg: '#FDF0ED', iconColor: '#D94F3B' },
] as const;

function WhatsAppIcon({ color }: { color: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill={color} aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.126.553 4.122 1.523 5.857L.057 23.882a.5.5 0 0 0 .613.613l6.101-1.459A11.945 11.945 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.885 0-3.65-.52-5.16-1.426l-.37-.22-3.827.916.933-3.74-.242-.386A9.944 9.944 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" />
    </svg>
  );
}

export default function PatientContextSheet({
  isOpen,
  patient,
  onClose,
  onMarkEmergency,
  onRemove,
  onPhoneUpdated,
}: PatientContextSheetProps) {
  const { t } = useTranslation();

  const actionLabels: Record<string, { label: string; desc: string }> = {
    emergency: { label: t('receptionist.patientContext.emergency', 'Urgence'), desc: t('receptionist.patientContext.emergencyDesc', 'Passe en priorité absolue') },
    'copy-url': { label: t('receptionist.patientContext.copyUrl', 'Copier URL'), desc: t('receptionist.patientContext.copyUrlDesc', 'Lien de suivi de la position') },
    whatsapp: { label: t('receptionist.patientContext.whatsapp', 'Envoyer via WhatsApp'), desc: t('receptionist.patientContext.whatsappDesc', 'Partager le lien de suivi') },
    remove: { label: t('receptionist.patientContext.removePatient'), desc: t('receptionist.patientContext.removePatientDesc') },
  };

  const [showPhoneInput, setShowPhoneInput] = useState(false);
  const [phoneValue, setPhoneValue] = useState('');
  const [isSavingPhone, setIsSavingPhone] = useState(false);

  // Reset phone input when sheet opens/closes or patient changes
  useEffect(() => {
    setShowPhoneInput(false);
    setPhoneValue('');
    setIsSavingPhone(false);
    setCopied(false);
  }, [isOpen, patient?.id]);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '');
    setPhoneValue(raw.slice(0, webBrand.phone.localDigits));
  };

  const phoneDisplay = phoneValue.length > 0
    ? phoneValue.replace(/(\d{2})(\d{3})?(\d{3})?/, (_: string, a: string, b?: string, c?: string) =>
        [a, b, c].filter(Boolean).join(' ')
      )
    : '';

  const handleSavePhone = async () => {
    if (!patient || phoneValue.length < webBrand.phone.localDigits) return;
    setIsSavingPhone(true);
    try {
      const fullPhone = `${webBrand.phone.countryCode}${phoneValue}`;
      await api.updatePatient(patient.id, { patientPhone: fullPhone });
      onPhoneUpdated?.();
      onClose();
    } catch (err) {
      logger.error('Failed to update phone:', err);
    } finally {
      setIsSavingPhone(false);
    }
  };

  const [copied, setCopied] = useState(false);

  const handleAction = (key: string) => {
    if (!patient) return;
    switch (key) {
      case 'emergency':
        onMarkEmergency?.(patient.id);
        break;
      case 'copy-url': {
        const statusUrl = `${window.location.origin}/patient/${patient.id}`;
        navigator.clipboard.writeText(statusUrl).then(() => {
          setCopied(true);
          setTimeout(() => { setCopied(false); onClose(); }, 800);
        }).catch(() => onClose());
        return; // don't close immediately — show feedback first
      }
      case 'whatsapp': {
        const statusUrl = `${window.location.origin}/patient/${patient.id}`;
        const text = encodeURIComponent(`Voici le lien pour suivre votre position en file d'attente : ${statusUrl}`);
        window.open(`https://wa.me/?text=${text}`, '_blank', 'noopener,noreferrer');
        break;
      }
      case 'add-phone':
        setShowPhoneInput(true);
        return; // don't close sheet
      case 'remove':
        onRemove?.(patient.id);
        break;
    }
    onClose();
  };

  return (
    <>
      {/* Overlay */}
      <div
        className={clsx(
          'absolute inset-0 z-[99] transition-opacity duration-300',
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
        )}
        style={{ background: 'rgba(0,0,0,0.3)' }}
        onClick={onClose}
      />

      {/* Sheet panel */}
      <div
        className={clsx(
          'bs-sheet absolute bottom-0 left-0 right-0 z-[100] bg-bs-surface',
        )}
        style={{
          borderRadius: '20px 20px 0 0',
          padding: '8px 20px 36px',
          boxShadow: '0 -4px 32px rgba(0,0,0,0.12)',
          transform: isOpen ? 'translateY(0)' : 'translateY(100%)',
        }}
      >
        {/* Handle */}
        <div className="w-9 h-1 bg-bs-border rounded-full mx-auto mt-2 mb-4" />

        {/* Patient name header */}
        {patient && (
          <div className="pb-3 mb-1 border-b border-bs-border">
            <div className="text-bs-text-primary font-bold" style={{ fontSize: 16 }}>
              {patient.name}
            </div>
            <div className="text-bs-text-tertiary mt-0.5" style={{ fontSize: 12 }}>
              {t('receptionist.patientContext.positionInfo', { position: patient.position, minutes: patient.waitMinutes })}
            </div>
          </div>
        )}

        {/* Action rows */}
        <div className="flex flex-col">
          {actions.map((action) => {
            return (
              <button
                key={action.key}
                onClick={() => handleAction(action.key)}
                className="flex items-center gap-3 text-left transition-colors duration-150 active:bg-bs-surface-alt"
                style={{ padding: '14px 12px' }}
              >
                {/* Colored icon square */}
                <div
                  className="flex items-center justify-center shrink-0"
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    backgroundColor: action.iconBg,
                  }}
                >
                  {action.key === 'whatsapp' ? (
                    <WhatsAppIcon color={action.iconColor} />
                  ) : (
                    <span
                      className="material-symbols-rounded"
                      style={{ fontSize: 20, color: action.iconColor }}
                    >
                      {action.icon}
                    </span>
                  )}
                </div>

                {/* Label + description */}
                <div className="flex-1 min-w-0">
                  <div className="text-bs-text-primary font-semibold" style={{ fontSize: 15 }}>
                    {action.key === 'copy-url' && copied
                      ? t('receptionist.patientContext.copied', 'Copié !')
                      : actionLabels[action.key]?.label}
                  </div>
                  <div className="text-bs-text-tertiary" style={{ fontSize: 12 }}>
                    {actionLabels[action.key]?.desc}
                  </div>
                </div>

                {/* Chevron */}
                <span
                  className="material-symbols-rounded text-bs-text-tertiary shrink-0"
                  style={{ fontSize: 18 }}
                >
                  chevron_right
                </span>
              </button>
            );
          })}

          {/* Add phone number action — only for patients without phone */}
          {!patient?.hasPhone && !showPhoneInput && (
            <button
              onClick={() => handleAction('add-phone')}
              className="flex items-center gap-3 text-left transition-colors duration-150 active:bg-bs-surface-alt"
              style={{ padding: '14px 12px' }}
            >
              <div
                className="flex items-center justify-center shrink-0"
                style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: '#EDF3FC' }}
              >
                <span className="material-symbols-rounded" style={{ fontSize: 20, color: '#3B7DD9' }}>
                  add_call
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-bs-text-primary font-semibold" style={{ fontSize: 15 }}>
                  {t('receptionist.patientContext.addPhone')}
                </div>
                <div className="text-bs-text-tertiary" style={{ fontSize: 12 }}>
                  {t('receptionist.patientContext.addPhoneDesc')}
                </div>
              </div>
              <span className="material-symbols-rounded text-bs-text-tertiary shrink-0" style={{ fontSize: 18 }}>
                chevron_right
              </span>
            </button>
          )}

          {/* Inline phone input */}
          {!patient?.hasPhone && showPhoneInput && (
            <div style={{ padding: '10px 12px' }}>
              <div
                className="flex items-center"
                dir="ltr"
                style={{
                  border: '1.5px solid #3B7DD9',
                  borderRadius: 10,
                  overflow: 'hidden',
                  background: '#FFFFFF',
                }}
              >
                <div
                  style={{
                    padding: '10px 10px 10px 14px',
                    fontSize: 15,
                    fontWeight: 600,
                    color: '#9E9B90',
                    borderRight: '1px solid #E8E6DF',
                    background: '#F6F5F0',
                  }}
                >
                  {webBrand.phone.countryCode}
                </div>
                <input
                  type="tel"
                  inputMode="numeric"
                  autoFocus
                  placeholder={webBrand.phone.placeholder.replace(webBrand.phone.countryCode + ' ', '')}
                  value={phoneDisplay}
                  onChange={handlePhoneChange}
                  style={{
                    flex: 1,
                    padding: '10px 14px',
                    fontSize: 15,
                    border: 'none',
                    outline: 'none',
                    background: 'transparent',
                    color: '#1A1A1A',
                    fontFamily: 'inherit',
                  }}
                />
              </div>
              <button
                onClick={handleSavePhone}
                disabled={phoneValue.length < webBrand.phone.localDigits || isSavingPhone}
                className="flex items-center justify-center gap-2 w-full"
                style={{
                  marginTop: 10,
                  padding: 12,
                  background: phoneValue.length >= webBrand.phone.localDigits ? '#3B7DD9' : '#E8E6DF',
                  border: 'none',
                  borderRadius: 10,
                  fontSize: 14,
                  fontWeight: 600,
                  color: phoneValue.length >= webBrand.phone.localDigits ? 'white' : '#9E9B90',
                  cursor: phoneValue.length >= webBrand.phone.localDigits ? 'pointer' : 'not-allowed',
                }}
              >
                <span className="material-symbols-rounded" style={{ fontSize: 18 }}>save</span>
                {isSavingPhone ? t('receptionist.patientContext.saving') : t('receptionist.patientContext.save')}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
