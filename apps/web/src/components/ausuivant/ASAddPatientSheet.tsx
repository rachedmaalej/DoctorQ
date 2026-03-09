import ASIcon from './ASIcon';
import { useState, useEffect, useRef } from 'react';

import { useQueueStore } from '@/stores/queueStore';
import { webBrand } from '@/lib/brand';
import type { Doctor } from '@/types';
import { formatPhoneInput, formatDoctorName, getTokenColor } from './utils';

interface ASAddPatientSheetProps {
  isOpen: boolean;
  onClose: () => void;
  doctors?: Doctor[];
  initialFirstName?: string;
  initialLastName?: string;
}

type PatientType = 'rdv' | 'walkin';

export default function ASAddPatientSheet({ isOpen, onClose, doctors = [], initialFirstName, initialLastName }: ASAddPatientSheetProps) {
  const { addPatient } = useQueueStore();
  const [type, setType] = useState<PatientType>('rdv');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedDoctorId, setSelectedDoctorId] = useState<string | null>(null);

  const activeDoctors = doctors.filter((d) => d.isActive && d.state !== 'inactive');
  const hasMultiDoctor = activeDoctors.length > 1;
  const [appointmentHour, setAppointmentHour] = useState('09');
  const [appointmentMinute, setAppointmentMinute] = useState('00');

  // 24h format: 07-19, 15-min increments
  const rdvHours = Array.from({ length: 13 }, (_, i) => (i + 7).toString().padStart(2, '0'));
  const rdvMinutes = ['00', '15', '30', '45'];
  const appointmentTime = `${appointmentHour}:${appointmentMinute}`;
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [addedPosition, setAddedPosition] = useState<number | null>(null);
  const firstNameRef = useRef<HTMLInputElement>(null);

  // Pre-fill from initial props when sheet opens
  useEffect(() => {
    if (isOpen) {
      if (initialFirstName) setFirstName(initialFirstName);
      if (initialLastName) setLastName(initialLastName);
    }
  }, [isOpen, initialFirstName, initialLastName]);

  // Focus first input when opened
  useEffect(() => {
    if (isOpen && !showSuccess) {
      setTimeout(() => firstNameRef.current?.focus(), 400);
    }
  }, [isOpen, showSuccess]);

  // Close on escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const resetForm = () => {
    setType('rdv');
    setFirstName('');
    setLastName('');
    setPhone('');
    setAppointmentHour('09');
    setAppointmentMinute('00');
    setNotes('');
    setSelectedDoctorId(null);
    setError('');
    setShowSuccess(false);
    setAddedPosition(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handlePhoneInput = (value: string) => {
    const digits = value.replace(/\D/g, '');
    setPhone(formatPhoneInput(digits));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!firstName.trim()) {
      setError('Le prénom est requis');
      return;
    }

    setIsSubmitting(true);

    try {
      const phoneDigits = phone.replace(/\D/g, '');
      const fullPhone = phoneDigits ? `${webBrand.phone.countryCode}${phoneDigits}` : undefined;
      const patientName = lastName.trim()
        ? `${firstName.trim()} ${lastName.trim()}`
        : firstName.trim();

      const result = await addPatient({
        patientPhone: fullPhone || '',
        patientName,
        appointmentTime: type === 'rdv' ? appointmentTime : undefined,
        doctorId: selectedDoctorId || undefined,
      });

      // Get position from result or queue length
      const position = (result as any)?.position || null;
      setAddedPosition(position);
      setShowSuccess(true);
    } catch (err: any) {
      if (err?.code === 'ALREADY_CHECKED_IN') {
        setError('Ce patient est déjà dans la file d\'attente');
      } else {
        setError(err?.message || 'Erreur lors de l\'ajout du patient');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayName = firstName.trim()
    ? lastName.trim()
      ? `${firstName.trim()} ${lastName.trim().charAt(0).toUpperCase()}.`
      : firstName.trim()
    : '';

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0"
        style={{
          background: isOpen ? 'rgba(44,74,62,0.4)' : 'rgba(44,74,62,0)',
          zIndex: 200,
          pointerEvents: isOpen ? 'auto' : 'none',
          transition: 'background 0.3s ease',
        }}
        onClick={handleClose}
      />

      {/* Sheet */}
      <div
        className="fixed left-1/2"
        style={{
          bottom: 0,
          transform: `translateX(-50%) translateY(${isOpen ? '0' : '100%'})`,
          width: '100%',
          maxWidth: 430,
          maxHeight: '92dvh',
          overflowY: 'auto',
          overscrollBehavior: 'contain',
          background: 'var(--color-surface)',
          borderRadius: 'var(--radius-xl) var(--radius-xl) 0 0',
          zIndex: 210,
          transition: 'transform 0.4s cubic-bezier(0.22, 1, 0.36, 1)',
        }}
      >
        {/* Drag handle */}
        <div className="flex justify-center" style={{ padding: '10px 0 0' }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--color-border-subtle)' }} />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between" style={{ padding: '16px 20px 0' }}>
          <span style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.3px' }}>
            Ajouter un patient
          </span>
          <button
            onClick={handleClose}
            aria-label="Fermer"
            className="flex items-center justify-center"
            style={{
              width: 32,
              height: 32,
              borderRadius: 'var(--radius-sm)',
              background: 'var(--color-surface-alt)',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--color-text-secondary)',
            }}
          >
            <ASIcon name="close" size={18} />
          </button>
        </div>

        {showSuccess ? (
          /* ─── Success State ─── */
          <div className="flex flex-col items-center" style={{ padding: '40px 20px' }}>
            <div
              className="as-success-pop flex items-center justify-center"
              style={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                background: 'var(--color-primary-light)',
              }}
            >
              <ASIcon name="check" size={28} style={{ color: 'var(--color-primary)' }} />
            </div>

            <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.3px', marginTop: 16 }}>
              Patient ajouté
            </div>

            <div style={{ fontSize: 14, color: 'var(--color-text-secondary)', marginTop: 4 }}>
              {displayName} a été ajouté(e) à la file
            </div>

            {addedPosition && (
              <div
                style={{
                  background: 'var(--color-surface-alt)',
                  borderRadius: 30,
                  padding: '8px 18px',
                  fontSize: 13,
                  fontWeight: 600,
                  color: 'var(--color-text-primary)',
                  marginTop: 16,
                }}
              >
                Position #{addedPosition} dans la file
              </div>
            )}

            <button
              onClick={handleClose}
              style={{
                marginTop: 24,
                background: 'var(--color-surface-alt)',
                color: 'var(--color-text-primary)',
                borderRadius: 'var(--radius-sm)',
                fontSize: 14,
                fontWeight: 600,
                padding: '12px 48px',
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              Fermer
            </button>
          </div>
        ) : (
          /* ─── Form ─── */
          <form onSubmit={handleSubmit} style={{ padding: 20 }}>
            {/* Type Toggle */}
            <div
              style={{
                background: 'var(--color-surface-alt)',
                borderRadius: 'var(--radius-sm)',
                padding: 3,
                marginBottom: 20,
              }}
            >
              <div className="flex">
                <button
                  type="button"
                  onClick={() => setType('rdv')}
                  className="flex-1 flex items-center justify-center gap-1.5"
                  style={{
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-sm)',
                    border: 'none',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    fontSize: 13,
                    fontWeight: type === 'rdv' ? 600 : 500,
                    color: type === 'rdv' ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
                    background: type === 'rdv' ? 'var(--color-surface)' : 'transparent',
                    boxShadow: type === 'rdv' ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                  }}
                >
                  <ASIcon name="calendar_today" size={15} />
                  Avec rendez-vous
                </button>
                <button
                  type="button"
                  onClick={() => setType('walkin')}
                  className="flex-1 flex items-center justify-center gap-1.5"
                  style={{
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-sm)',
                    border: 'none',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    fontSize: 13,
                    fontWeight: type === 'walkin' ? 600 : 500,
                    color: type === 'walkin' ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
                    background: type === 'walkin' ? 'var(--color-surface)' : 'transparent',
                    boxShadow: type === 'walkin' ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                  }}
                >
                  <ASIcon name="meeting_room" size={15} />
                  Sans rendez-vous
                </button>
              </div>
            </div>

            {/* Name Fields */}
            <div className="flex gap-2" style={{ marginBottom: 16 }}>
              <div className="flex-1">
                <label
                  style={{
                    display: 'block',
                    fontSize: 12,
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.8px',
                    color: 'var(--color-text-muted)',
                    marginBottom: 6,
                  }}
                >
                  PRÉNOM
                </label>
                <input
                  ref={firstNameRef}
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Marie"
                  autoComplete="given-name"
                />
              </div>
              <div className="flex-1">
                <label
                  style={{
                    display: 'block',
                    fontSize: 12,
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.8px',
                    color: 'var(--color-text-muted)',
                    marginBottom: 6,
                  }}
                >
                  NOM
                </label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Dupont"
                  autoComplete="family-name"
                />
              </div>
            </div>

            {/* Doctor Selector (multi-doctor only) */}
            {hasMultiDoctor && (
              <div style={{ marginBottom: 16 }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: 12,
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.8px',
                    color: 'var(--color-text-muted)',
                    marginBottom: 6,
                  }}
                >
                  MÉDECIN
                </label>
                <div className="flex gap-2 flex-wrap">
                  {activeDoctors.map((doc) => {
                    const color = getTokenColor(doc.colorToken);
                    const selected = selectedDoctorId === doc.id;
                    return (
                      <button
                        key={doc.id}
                        type="button"
                        onClick={() => setSelectedDoctorId(selected ? null : doc.id)}
                        className="flex items-center gap-2"
                        style={{
                          padding: '8px 12px',
                          borderRadius: 'var(--radius-sm)',
                          border: `1.5px solid ${selected ? color.fg : 'var(--color-border)'}`,
                          background: selected ? color.bg : 'var(--color-surface)',
                          cursor: 'pointer',
                          fontFamily: 'inherit',
                          fontSize: 13,
                          fontWeight: selected ? 600 : 500,
                          color: selected ? color.fg : 'var(--color-text-secondary)',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <div
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: 4,
                            background: color.fg,
                            flexShrink: 0,
                          }}
                        />
                        {formatDoctorName(doc.name)}
                        {doc.specialty && (
                          <span style={{ fontSize: 10, color: selected ? color.fg : 'var(--color-text-muted)', opacity: 0.8 }}>
                            {doc.specialty}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
                {!selectedDoctorId && (
                  <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 5 }}>
                    Optionnel — le patient sera assigné au premier médecin disponible
                  </div>
                )}
              </div>
            )}

            {/* Phone Field */}
            <div style={{ marginBottom: 16 }}>
              <label
                style={{
                  display: 'block',
                  fontSize: 12,
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.8px',
                  color: 'var(--color-text-muted)',
                  marginBottom: 6,
                }}
              >
                TÉLÉPHONE
              </label>
              <div className="flex gap-2">
                <div
                  className="flex items-center justify-center flex-shrink-0"
                  style={{
                    width: 72,
                    padding: '13px 10px',
                    border: '1.5px solid var(--color-border)',
                    borderRadius: 'var(--radius)',
                    background: 'var(--color-surface-alt)',
                    color: 'var(--color-text-secondary)',
                    fontSize: 15,
                    textAlign: 'center',
                  }}
                >
                  {webBrand.phone.countryCode}
                </div>
                <input
                  type="tel"
                  inputMode="numeric"
                  maxLength={14}
                  value={phone}
                  onChange={(e) => handlePhoneInput(e.target.value)}
                  placeholder={webBrand.country === 'FR' ? '6 12 34 56 78' : 'XX XXX XXX'}
                  className="flex-1"
                />
              </div>
              <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 5 }}>
                {webBrand.phone.localDigits} chiffres après l&apos;indicatif · Utilisé pour les notifications
              </div>
            </div>

            {/* Appointment Time (conditional) */}
            <div
              style={{
                maxHeight: type === 'rdv' ? 90 : 0,
                opacity: type === 'rdv' ? 1 : 0,
                overflow: 'hidden',
                marginBottom: type === 'rdv' ? 16 : 0,
                transition: 'max-height 0.3s cubic-bezier(0.22,1,0.36,1), opacity 0.3s ease, margin-bottom 0.3s ease',
              }}
            >
              <label
                style={{
                  display: 'block',
                  fontSize: 12,
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.8px',
                  color: 'var(--color-text-muted)',
                  marginBottom: 6,
                }}
              >
                HEURE DU RENDEZ-VOUS
              </label>
              <div className="flex gap-2 items-center">
                <select
                  value={appointmentHour}
                  onChange={(e) => setAppointmentHour(e.target.value)}
                  style={{ flex: 1, fontVariantNumeric: 'tabular-nums' }}
                >
                  {rdvHours.map((h) => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
                <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-text-muted)' }}>:</span>
                <select
                  value={appointmentMinute}
                  onChange={(e) => setAppointmentMinute(e.target.value)}
                  style={{ flex: 1, fontVariantNumeric: 'tabular-nums' }}
                >
                  {rdvMinutes.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Notes */}
            <div style={{ marginBottom: 20 }}>
              <label
                style={{
                  display: 'block',
                  fontSize: 12,
                  color: 'var(--color-text-muted)',
                  marginBottom: 6,
                }}
              >
                <span style={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                  NOTES
                </span>
                {' '}— optionnel
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ex : patient prioritaire, personne âgée…"
                style={{
                  minHeight: 60,
                  maxHeight: 120,
                  resize: 'vertical',
                  padding: '12px 14px',
                  fontSize: 14,
                }}
              />
            </div>

            {/* Error */}
            {error && (
              <div
                style={{
                  color: 'var(--color-error)',
                  fontSize: 13,
                  marginBottom: 12,
                  textAlign: 'center',
                }}
              >
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full transition-all"
              style={{
                padding: 16,
                background: 'var(--color-primary)',
                color: 'white',
                borderRadius: 'var(--radius)',
                fontSize: 15,
                fontWeight: 600,
                border: 'none',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                boxShadow: '0 2px 10px rgba(126,181,160,0.25)',
                opacity: isSubmitting ? 0.7 : 1,
                fontFamily: 'inherit',
              }}
            >
              {isSubmitting ? 'Ajout en cours…' : 'Ajouter à la file d\'attente'}
            </button>
          </form>
        )}
      </div>
    </>
  );
}
