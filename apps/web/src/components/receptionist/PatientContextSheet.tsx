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
  onMarkPriority?: (id: string) => void;
  onMarkSteppedOut?: (id: string) => void;
  onRemove?: (id: string) => void;
  onWhatsAppSend?: (id: string) => void;
  onPhoneUpdated?: () => void;
  clinicName?: string;
}

const actions = [
  { key: 'priority', icon: 'priority_high', iconBg: '#FEF7E6', iconColor: '#D4920B' },
  { key: 'stepped-out', icon: 'directions_walk', iconBg: '#EDF3FC', iconColor: '#3B7DD9' },
  { key: 'phone', icon: 'phone', iconBg: '#EDF7F0', iconColor: '#2D8B4E' },
  { key: 'whatsapp', icon: 'chat', iconBg: '#E8F8EE', iconColor: '#25D366' },
  { key: 'remove', icon: 'person_remove', iconBg: '#FDF0ED', iconColor: '#D94F3B' },
] as const;

export default function PatientContextSheet({
  isOpen,
  patient,
  onClose,
  onMarkPriority,
  onMarkSteppedOut,
  onRemove,
  onWhatsAppSend,
  onPhoneUpdated,
  clinicName,
}: PatientContextSheetProps) {
  const { t } = useTranslation();

  const actionLabels: Record<string, { label: string; desc: string }> = {
    priority: { label: t('receptionist.patientContext.priority'), desc: t('receptionist.patientContext.priorityDesc') },
    'stepped-out': { label: t('receptionist.patientContext.steppedOut'), desc: t('receptionist.patientContext.steppedOutDesc') },
    phone: { label: t('receptionist.patientContext.callPatient'), desc: t('receptionist.patientContext.callPatientDesc') },
    whatsapp: { label: t('receptionist.patientContext.sendWhatsApp'), desc: t('receptionist.patientContext.sendWhatsAppDesc') },
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

  const handleAction = (key: string) => {
    if (!patient) return;
    switch (key) {
      case 'priority':
        onMarkPriority?.(patient.id);
        break;
      case 'stepped-out':
        onMarkSteppedOut?.(patient.id);
        break;
      case 'phone':
        if (patient.phone) {
          window.open(`tel:${patient.phone}`, '_self');
        }
        return; // don't close sheet after phone tap
      case 'whatsapp':
        if (patient.phone) {
          const statusUrl = `${window.location.origin}/patient/${patient.id}`;
          const message = `${clinicName ?? ''} - Suivez votre position: ${statusUrl}`;
          const waUrl = `https://wa.me/${patient.phone.replace('+', '')}?text=${encodeURIComponent(message)}`;
          window.open(waUrl, '_blank');
          onWhatsAppSend?.(patient.id);
        }
        return; // don't close sheet
      case 'add-phone':
        setShowPhoneInput(true);
        return; // don't close sheet
      case 'remove':
        onRemove?.(patient.id);
        break;
    }
    onClose();
  };

  const isPhoneDisabled = !patient?.hasPhone;

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
            // Hide phone/whatsapp actions for no-phone patients; show add-phone instead
            if ((action.key === 'phone' || action.key === 'whatsapp') && isPhoneDisabled) return null;
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
                  <span
                    className="material-symbols-rounded"
                    style={{ fontSize: 20, color: action.iconColor }}
                  >
                    {action.icon}
                  </span>
                </div>

                {/* Label + description */}
                <div className="flex-1 min-w-0">
                  <div className="text-bs-text-primary font-semibold" style={{ fontSize: 15 }}>
                    {actionLabels[action.key]?.label}
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
          {isPhoneDisabled && !showPhoneInput && (
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
          {isPhoneDisabled && showPhoneInput && (
            <div style={{ padding: '10px 12px' }}>
              <div
                className="flex items-center"
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
