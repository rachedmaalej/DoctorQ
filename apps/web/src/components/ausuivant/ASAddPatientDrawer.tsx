import ASIcon from './ASIcon';
import { useState, useEffect, useRef } from 'react';
import { useQueueStore } from '@/stores/queueStore';
import { webBrand } from '@/lib/brand';
import type { Doctor } from '@/types';
import { formatPhoneInput, formatDoctorName, getTokenColor } from './utils';

interface ASAddPatientDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  doctors?: Doctor[];
  initialFirstName?: string;
  initialLastName?: string;
}

type PatientType = 'rdv' | 'walkin';

/**
 * Desktop right-side drawer for adding a patient.
 * Single-screen layout — no scrolling. Compact spacing to fit all fields.
 */
export default function ASAddPatientDrawer({
  isOpen,
  onClose,
  doctors = [],
  initialFirstName,
  initialLastName,
}: ASAddPatientDrawerProps) {
  const { addPatient } = useQueueStore();
  const [type, setType] = useState<PatientType>('rdv');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedDoctorId, setSelectedDoctorId] = useState<string | null>(null);
  const [appointmentHour, setAppointmentHour] = useState('09');
  const [appointmentMinute, setAppointmentMinute] = useState('00');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [addedPosition, setAddedPosition] = useState<number | null>(null);
  const firstNameRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const activeDoctors = doctors.filter((d) => d.isActive && d.state !== 'inactive');
  const hasMultiDoctor = activeDoctors.length > 1;
  const rdvHours = Array.from({ length: 13 }, (_, i) => (i + 7).toString().padStart(2, '0'));
  const rdvMinutes = ['00', '15', '30', '45'];
  const appointmentTime = `${appointmentHour}:${appointmentMinute}`;

  // Pre-fill from initial props when drawer opens
  useEffect(() => {
    if (isOpen) {
      if (initialFirstName) setFirstName(initialFirstName);
      if (initialLastName) setLastName(initialLastName);
    }
  }, [isOpen, initialFirstName, initialLastName]);

  // Focus first input when opened
  useEffect(() => {
    if (isOpen && !showSuccess) {
      setTimeout(() => firstNameRef.current?.focus(), 250);
    }
  }, [isOpen, showSuccess]);

  // Keyboard: Escape to close, Cmd+Enter to submit
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { handleClose(); return; }
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        formRef.current?.requestSubmit();
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

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
    if (!firstName.trim()) { setError('Le prénom est requis'); return; }

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

      setAddedPosition((result as any)?.position || null);
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

  // Shared label style — compact for desktop
  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: 11, fontWeight: 600,
    textTransform: 'uppercase', letterSpacing: '0.7px',
    color: 'var(--color-text-muted)', marginBottom: 5,
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0"
        style={{
          background: 'rgba(44,74,62,0.18)',
          zIndex: 200,
        }}
        onClick={handleClose}
      />

      {/* Drawer */}
      <div
        className="as-detail-drawer-desktop"
        style={{
          width: 420,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {showSuccess ? (
          /* ─── Success State ─── */
          <div
            className="flex flex-col items-center justify-center"
            style={{ flex: 1, padding: 24 }}
          >
            <div
              className="as-success-pop flex items-center justify-center"
              style={{ width: 52, height: 52, borderRadius: '50%', background: 'var(--color-primary-light)' }}
            >
              <ASIcon name="check" size={26} style={{ color: 'var(--color-primary)' }} />
            </div>
            <div style={{ fontSize: 17, fontWeight: 700, marginTop: 14 }}>Patient ajouté</div>
            <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 3 }}>
              {displayName} a été ajouté(e) à la file
            </div>
            {addedPosition && (
              <div style={{
                background: 'var(--color-surface-alt)', borderRadius: 20,
                padding: '6px 16px', fontSize: 12, fontWeight: 600,
                color: 'var(--color-text-primary)', marginTop: 12,
              }}>
                Position #{addedPosition}
              </div>
            )}
            <button
              onClick={handleClose}
              style={{
                marginTop: 20, background: 'var(--color-surface-alt)',
                color: 'var(--color-text-primary)', borderRadius: 'var(--radius-sm)',
                fontSize: 13, fontWeight: 600, padding: '10px 36px',
                border: 'none', cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              Fermer
            </button>
          </div>
        ) : (
          <>
            {/* Header */}
            <div
              className="flex items-center justify-between"
              style={{
                padding: '16px 20px 12px',
                borderBottom: '1px solid var(--color-border-subtle)',
                flexShrink: 0,
              }}
            >
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text-primary)' }}>
                  Ajouter un patient
                </div>
                <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 1 }}>
                  Nouveau patient dans la file d'attente
                </div>
              </div>
              <button
                onClick={handleClose}
                aria-label="Fermer"
                className="flex items-center justify-center"
                style={{
                  width: 30, height: 30, borderRadius: 'var(--radius-sm)',
                  background: 'var(--color-surface-alt)', border: 'none',
                  cursor: 'pointer', color: 'var(--color-text-secondary)',
                }}
              >
                <ASIcon name="close" size={16} />
              </button>
            </div>

            {/* Form body — flex:1, no overflow, everything fits */}
            <form
              ref={formRef}
              onSubmit={handleSubmit}
              style={{
                flex: 1, display: 'flex', flexDirection: 'column',
                padding: '0 20px',
              }}
            >
              {/* Fields wrapper — centered vertically via auto margins */}
              <div style={{ margin: 'auto 0', flexShrink: 0 }}>

              {/* Type Toggle */}
              <div style={{
                background: 'var(--color-surface-alt)', borderRadius: 'var(--radius-sm)',
                padding: 3, marginBottom: 10, flexShrink: 0,
              }}>
                <div className="flex">
                  {(['rdv', 'walkin'] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setType(t)}
                      className="flex-1 flex items-center justify-center gap-1.5"
                      style={{
                        padding: '8px 10px', borderRadius: 'var(--radius-sm)',
                        border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                        fontSize: 12, fontWeight: type === t ? 600 : 500,
                        color: type === t ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
                        background: type === t ? 'var(--color-surface)' : 'transparent',
                        boxShadow: type === t ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                      }}
                    >
                      {t === 'rdv' ? <ASIcon name="calendar_today" size={13} /> : <ASIcon name="meeting_room" size={13} />}
                      {t === 'rdv' ? 'Avec rendez-vous' : 'Sans rendez-vous'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Name row */}
              <div className="flex gap-2" style={{ marginBottom: 10, flexShrink: 0 }}>
                <div className="flex-1">
                  <label style={labelStyle}>Prénom</label>
                  <input
                    ref={firstNameRef}
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Marie"
                    autoComplete="given-name"
                    style={{ padding: '10px 12px', fontSize: 14 }}
                  />
                </div>
                <div className="flex-1">
                  <label style={labelStyle}>Nom</label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Dupont"
                    autoComplete="family-name"
                    style={{ padding: '10px 12px', fontSize: 14 }}
                  />
                </div>
              </div>

              {/* Doctor selector (multi-doctor only) */}
              {hasMultiDoctor && (
                <div style={{ marginBottom: 10, flexShrink: 0 }}>
                  <label style={labelStyle}>Médecin</label>
                  <div className="flex gap-1.5 flex-wrap">
                    {activeDoctors.map((doc) => {
                      const color = getTokenColor(doc.colorToken);
                      const selected = selectedDoctorId === doc.id;
                      return (
                        <button
                          key={doc.id}
                          type="button"
                          onClick={() => setSelectedDoctorId(selected ? null : doc.id)}
                          className="flex items-center gap-1.5"
                          style={{
                            padding: '6px 10px', borderRadius: 'var(--radius-sm)',
                            border: `1.5px solid ${selected ? color.fg : 'var(--color-border)'}`,
                            background: selected ? color.bg : 'var(--color-surface)',
                            cursor: 'pointer', fontFamily: 'inherit',
                            fontSize: 12, fontWeight: selected ? 600 : 500,
                            color: selected ? color.fg : 'var(--color-text-secondary)',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <div style={{
                            width: 7, height: 7, borderRadius: 4,
                            background: color.fg, flexShrink: 0,
                          }} />
                          {formatDoctorName(doc.name)}
                          {doc.specialty && (
                            <span style={{ fontSize: 9, color: selected ? color.fg : 'var(--color-text-muted)', opacity: 0.8 }}>
                              {doc.specialty}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  {!selectedDoctorId && (
                    <div style={{ fontSize: 10, color: 'var(--color-text-muted)', marginTop: 4 }}>
                      Optionnel — assigné au premier médecin disponible
                    </div>
                  )}
                </div>
              )}

              {/* Phone */}
              <div style={{ marginBottom: 10, flexShrink: 0 }}>
                <label style={labelStyle}>Téléphone</label>
                <div className="flex gap-2">
                  <div
                    className="flex items-center justify-center flex-shrink-0"
                    style={{
                      width: 56, padding: '10px 6px',
                      border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-sm)',
                      background: 'var(--color-surface-alt)', color: 'var(--color-text-secondary)',
                      fontSize: 13, textAlign: 'center',
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
                    style={{ padding: '10px 12px', fontSize: 14 }}
                  />
                </div>
                <div style={{ fontSize: 10, color: 'var(--color-text-muted)', marginTop: 3 }}>
                  {webBrand.phone.localDigits} chiffres · Utilisé pour les notifications
                </div>
              </div>

              {/* Appointment Time (conditional — RDV only) */}
              {type === 'rdv' && (
                <div style={{ marginBottom: 10, flexShrink: 0 }}>
                  <label style={labelStyle}>Heure du rendez-vous</label>
                  <div className="flex gap-2 items-center">
                    <select
                      value={appointmentHour}
                      onChange={(e) => setAppointmentHour(e.target.value)}
                      style={{ flex: 1, fontVariantNumeric: 'tabular-nums', padding: '10px 12px', fontSize: 14 }}
                    >
                      {rdvHours.map((h) => <option key={h} value={h}>{h}</option>)}
                    </select>
                    <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text-muted)' }}>:</span>
                    <select
                      value={appointmentMinute}
                      onChange={(e) => setAppointmentMinute(e.target.value)}
                      style={{ flex: 1, fontVariantNumeric: 'tabular-nums', padding: '10px 12px', fontSize: 14 }}
                    >
                      {rdvMinutes.map((m) => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                </div>
              )}

              {/* Notes — single line on desktop to save space */}
              <div style={{ marginBottom: 0, flexShrink: 0 }}>
                <label style={labelStyle}>
                  Notes <span style={{ textTransform: 'none', fontWeight: 400, letterSpacing: 0 }}>— optionnel</span>
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ex : patient prioritaire, personne âgée…"
                  style={{ padding: '10px 12px', fontSize: 13 }}
                />
              </div>

              {/* Error */}
              {error && (
                <div style={{
                  color: 'var(--color-error)', fontSize: 12,
                  marginTop: 8, textAlign: 'center', flexShrink: 0,
                }}>
                  {error}
                </div>
              )}

              </div>{/* end fields wrapper */}

              {/* Spacer pushes footer to bottom */}
              <div style={{ flex: 1, minHeight: 12 }} />

              {/* Footer — sticky at bottom */}
              <div style={{
                padding: '12px 0 20px',
                borderTop: '1px solid var(--color-border-subtle)',
                flexShrink: 0,
              }}>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleClose}
                    style={{
                      padding: '11px 16px', border: '1.5px solid var(--color-border)',
                      borderRadius: 'var(--radius-sm)', background: 'var(--color-surface)',
                      color: 'var(--color-text-secondary)', fontSize: 13, fontWeight: 600,
                      cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0,
                    }}
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1"
                    style={{
                      padding: '11px 16px', border: 'none',
                      borderRadius: 'var(--radius-sm)', background: 'var(--color-primary)',
                      color: 'white', fontSize: 13, fontWeight: 600,
                      cursor: isSubmitting ? 'not-allowed' : 'pointer',
                      fontFamily: 'inherit', opacity: isSubmitting ? 0.7 : 1,
                      boxShadow: '0 2px 8px rgba(84,159,58,0.2)',
                    }}
                  >
                    {isSubmitting ? 'Ajout en cours…' : 'Ajouter à la file d\'attente'}
                  </button>
                </div>
                <div style={{
                  textAlign: 'center', marginTop: 6,
                  fontSize: 10, color: 'var(--color-text-muted)',
                }}>
                  <kbd style={{
                    display: 'inline-block', padding: '1px 5px', borderRadius: 3,
                    background: 'var(--color-surface-alt)', border: '1px solid var(--color-border)',
                    fontSize: 9, fontWeight: 600, fontFamily: 'inherit',
                  }}>⌘</kbd>
                  {' + '}
                  <kbd style={{
                    display: 'inline-block', padding: '1px 5px', borderRadius: 3,
                    background: 'var(--color-surface-alt)', border: '1px solid var(--color-border)',
                    fontSize: 9, fontWeight: 600, fontFamily: 'inherit',
                  }}>Enter</kbd>
                  {' pour valider · '}
                  <kbd style={{
                    display: 'inline-block', padding: '1px 5px', borderRadius: 3,
                    background: 'var(--color-surface-alt)', border: '1px solid var(--color-border)',
                    fontSize: 9, fontWeight: 600, fontFamily: 'inherit',
                  }}>Esc</kbd>
                  {' fermer'}
                </div>
              </div>
            </form>
          </>
        )}
      </div>
    </>
  );
}
