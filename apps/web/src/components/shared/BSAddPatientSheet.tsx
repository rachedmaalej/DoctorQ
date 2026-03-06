import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useQueueStore } from '@/stores/queueStore';
import { webBrand } from '@/lib/brand';
import { api } from '@/lib/api';
import { Icon } from '@/components/ui/Icon';
import { logger } from '@/lib/logger';
import type { PatientSuggestion, QueueEntry } from '@/types';

interface BSAddPatientSheetProps {
  isOpen: boolean;
  onClose: () => void;
  prefilledName: string;
  clinicName: string;
  onWhatsAppSent?: (id: string) => void;
}

type SheetStep = 'form' | 'confirm';
type VisitType = 'walk-in' | 'appointment';

export default function BSAddPatientSheet({
  isOpen,
  onClose,
  prefilledName,
  clinicName,
  onWhatsAppSent,
}: BSAddPatientSheetProps) {
  const { t } = useTranslation();
  const { addPatient } = useQueueStore();
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [step, setStep] = useState<SheetStep>('form');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [visitType, setVisitType] = useState<VisitType>('walk-in');
  const [priority, setPriority] = useState(false);
  const [rdvHour, setRdvHour] = useState('');
  const [rdvMinute, setRdvMinute] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Autocomplete state
  const [suggestions, setSuggestions] = useState<PatientSuggestion[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<PatientSuggestion | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [phoneAutoFilled, setPhoneAutoFilled] = useState(false);

  // Confirm state
  const [addedEntry, setAddedEntry] = useState<QueueEntry | null>(null);

  // RDV selectors
  const rdvHours = Array.from({ length: 13 }, (_, i) => (i + 7).toString().padStart(2, '0'));
  const rdvMinutes = ['00', '15', '30', '45'];
  const rdvTime = rdvHour && rdvMinute ? `${rdvHour}:${rdvMinute}` : '';

  // Phone derived state
  const phoneDigits = phone.replace(/\D/g, '');
  const digitCount = phoneDigits.length;
  const isPhoneComplete = digitCount === webBrand.phone.localDigits;

  // ─── Effects ───

  // Reset form when opening
  useEffect(() => {
    if (isOpen) {
      setStep('form');
      setName(prefilledName);
      setPhone('');
      setVisitType('walk-in');
      setPriority(false);
      setRdvHour('');
      setRdvMinute('');
      setError(null);
      setSuggestions([]);
      setSelectedPatient(null);
      setPhoneAutoFilled(false);
      setAddedEntry(null);
      // Auto-focus name input after sheet animation
      setTimeout(() => nameInputRef.current?.focus(), 150);
    }
  }, [isOpen, prefilledName]);

  // Escape key to close
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleDone();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen]);

  // Debounced autocomplete search
  useEffect(() => {
    if (selectedPatient || name.length < 2) {
      setSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const results = await api.searchPatients(name);
        setSuggestions(results || []);
        if (results && results.length > 0) setShowSuggestions(true);
      } catch {
        setSuggestions([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [name, selectedPatient]);

  // Debounce confirmation button presses to prevent double-fires
  const confirmActionRef = useRef(false);
  const guardAction = (fn: () => void) => {
    if (confirmActionRef.current) return;
    confirmActionRef.current = true;
    fn();
    setTimeout(() => { confirmActionRef.current = false; }, 200);
  };

  // Auto-dismiss confirmation after 4 seconds
  const autoDismissRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (step === 'confirm') {
      autoDismissRef.current = setTimeout(() => handleDone(), 4000);
      return () => {
        if (autoDismissRef.current) clearTimeout(autoDismissRef.current);
      };
    }
  }, [step]);

  // ─── Handlers ───

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setName(value);
    setError(null);
    // If user clears name, reset auto-filled data
    if (!value.trim()) {
      setSelectedPatient(null);
      if (phoneAutoFilled) {
        setPhone('');
        setPhoneAutoFilled(false);
      }
    }
    // If user modifies name after selecting, deselect
    if (selectedPatient && value !== selectedPatient.name) {
      setSelectedPatient(null);
    }
  };

  const selectSuggestion = useCallback((s: PatientSuggestion) => {
    setName(s.name);
    setSelectedPatient(s);
    setShowSuggestions(false);
    setSuggestions([]);
    // Auto-fill phone if available
    if (s.phone) {
      const localDigits = s.phone.replace(webBrand.phone.countryCode, '').replace(/\D/g, '');
      setPhone(formatPhoneDisplay(localDigits));
      setPhoneAutoFilled(true);
    }
  }, []);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, webBrand.phone.localDigits);
    setPhone(formatPhoneDisplay(raw));
    if (phoneAutoFilled) setPhoneAutoFilled(false);
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError(t('blesaf.addPatient.nameRequired'));
      return;
    }
    setError(null);
    setIsSubmitting(true);

    try {
      let patientPhone = '';
      if (phoneDigits.length > 0) {
        patientPhone = `${webBrand.phone.countryCode}${phoneDigits}`;
      }

      const entry = await addPatient({
        patientName: name.trim(),
        patientPhone,
        appointmentTime: visitType === 'appointment' && rdvTime ? rdvTime : undefined,
        isEmergency: priority,
      });

      setAddedEntry(entry);
      setStep('confirm');
    } catch (err: any) {
      logger.error('BSAddPatientSheet submit error:', err);
      if (err.code === 'ALREADY_CHECKED_IN') {
        setError(t('queue.patientAlreadyInQueue'));
      } else {
        setError(err.message || t('blesaf.addPatient.addError'));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDone = () => {
    onClose();
    setTimeout(() => {
      setStep('form');
      setName('');
      setPhone('');
      setVisitType('walk-in');
      setPriority(false);
      setRdvHour('');
      setRdvMinute('');
      setError(null);
      setSuggestions([]);
      setSelectedPatient(null);
      setPhoneAutoFilled(false);
      setAddedEntry(null);
    }, 400);
  };

  const handleAddAnother = () => {
    setStep('form');
    setName('');
    setPhone('');
    setVisitType('walk-in');
    setPriority(false);
    setRdvHour('');
    setRdvMinute('');
    setError(null);
    setSuggestions([]);
    setSelectedPatient(null);
    setPhoneAutoFilled(false);
    setAddedEntry(null);
    setTimeout(() => nameInputRef.current?.focus(), 100);
  };

  const whatsAppUrl = addedEntry && phoneDigits
    ? (() => {
        const statusUrl = `${window.location.origin}/patient/${addedEntry.id}`;
        const message = t('whatsapp.message', { clinicName, url: statusUrl });
        return `https://wa.me/${webBrand.phone.countryCode.replace('+', '')}${phoneDigits}?text=${encodeURIComponent(message)}`;
      })()
    : undefined;

  const handleSendWhatsApp = () => {
    if (!whatsAppUrl || !addedEntry) return;
    window.open(whatsAppUrl, '_blank', 'noopener,noreferrer');
    onWhatsAppSent?.(addedEntry.id);
  };

  // ─── Helpers ───

  function formatRelativeDate(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return t('common.today', "aujourd'hui");
    if (diffDays === 1) return t('common.yesterday', 'hier');
    if (diffDays < 30) return `${diffDays}j`;
    const months = Math.floor(diffDays / 30);
    return `${months} mois`;
  }

  return (
    <>
      {/* Backdrop overlay */}
      <div
        className={`bs-sheet-overlay ${isOpen ? 'open' : ''}`}
        onClick={handleDone}
      />

      {/* Sheet */}
      <div className={`bs-add-sheet ${isOpen ? 'open' : ''}`}>
        <div className="bs-sheet-handle" />

        <div key={step} className="bs-sheet-step">
        {step === 'form' ? (
          /* ─── FORM STEP ─── */
          <>
            <div className="bs-sheet-title">{t('blesaf.addPatient.title')}</div>

            {error && <div className="bs-error">{error}</div>}

            {/* Patient name with autocomplete */}
            <div className="bs-form-group">
              <div className="bs-form-label">
                <Icon name="person" size={16} />
                {t('blesaf.addPatient.nameLabel')}
              </div>
              <div className="bs-name-input-wrap">
                <input
                  ref={nameInputRef}
                  type="text"
                  className={`bs-form-input ${selectedPatient ? 'filled' : ''}`}
                  value={name}
                  onChange={handleNameChange}
                  onFocus={() => name.length >= 2 && suggestions.length > 0 && setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                  placeholder={t('blesaf.addPatient.namePlaceholder')}
                  autoComplete="off"
                />
                <Icon name="search" size={18} className="bs-name-search-icon" />
              </div>

              {/* Autocomplete dropdown */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="bs-autocomplete-dropdown">
                  {suggestions.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      className="bs-autocomplete-item"
                      onMouseDown={() => selectSuggestion(s)}
                    >
                      <div className="bs-autocomplete-avatar">
                        {s.name.charAt(0).toUpperCase()}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="bs-autocomplete-name">{s.name}</div>
                        <div className="bs-autocomplete-meta">
                          {s.phone && (
                            <>
                              <Icon name="phone" size={11} />
                              {s.phone.replace(/(\+\d{3})(\d{2})(\d{3})(\d{3})/, '$1 $2 $3 $4')}
                              {' · '}
                            </>
                          )}
                          {t('blesaf.addPatient.lastVisit')} {formatRelativeDate(s.lastVisitAt)}
                        </div>
                      </div>
                      <span className="bs-returning-badge">
                        <Icon name="history" size={10} />
                        {t('blesaf.addPatient.returning')}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Visit type segmented control */}
            <div className="bs-rdv-toggle" role="group" aria-label={t('blesaf.addPatient.visitTypeLabel')}>
              <button
                type="button"
                className={`bs-rdv-option ${visitType === 'walk-in' ? 'active' : ''}`}
                onClick={() => setVisitType('walk-in')}
              >
                <Icon name="directions_walk" size={16} fill={visitType === 'walk-in'} />
                {t('blesaf.addPatient.walkIn')}
              </button>
              <button
                type="button"
                className={`bs-rdv-option ${visitType === 'appointment' ? 'active' : ''}`}
                onClick={() => setVisitType('appointment')}
              >
                <Icon name="calendar_today" size={16} fill={visitType === 'appointment'} />
                {t('blesaf.addPatient.withAppointment')}
              </button>
            </div>

            {/* Appointment time (conditional) */}
            <div className={`bs-rdv-time-group ${visitType === 'appointment' ? 'visible' : ''}`}>
              <div className="bs-form-label">
                <Icon name="schedule" size={16} />
                {t('blesaf.addPatient.appointmentTime')}
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <select
                  className="bs-form-input"
                  value={rdvHour}
                  onChange={(e) => setRdvHour(e.target.value)}
                  style={{ flex: 1, fontVariantNumeric: 'tabular-nums' }}
                >
                  <option value="">HH</option>
                  {rdvHours.map((h) => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
                <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-secondary)' }}>:</span>
                <select
                  className="bs-form-input"
                  value={rdvMinute}
                  onChange={(e) => setRdvMinute(e.target.value)}
                  style={{ flex: 1, fontVariantNumeric: 'tabular-nums' }}
                >
                  <option value="">MM</option>
                  {rdvMinutes.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Phone field */}
            <div className="bs-form-group">
              <div className="bs-form-label">
                <Icon name="phone" size={16} />
                {t('blesaf.addPatient.phoneLabel')}
                <span className="optional">{t('blesaf.addPatient.phoneOptional')}</span>
              </div>
              <div className="bs-phone-input-row">
                <div className="bs-phone-prefix">{webBrand.phone.countryCode}</div>
                <div className="bs-phone-input-wrap">
                  <input
                    type="tel"
                    inputMode="numeric"
                    className="bs-form-input"
                    placeholder="XX XXX XXX"
                    value={phone}
                    onChange={handlePhoneChange}
                  />
                  <span className={`bs-phone-counter ${isPhoneComplete ? 'complete' : ''}`}>
                    {digitCount} / {webBrand.phone.localDigits}
                  </span>
                </div>
              </div>
              <div className="bs-form-hint">
                <Icon name="info" size={14} />
                {t('blesaf.addPatient.phoneHelp')}
              </div>
            </div>

            {/* Priority toggle */}
            <div className="bs-priority-row">
              <div className="bs-priority-info">
                <Icon name="priority_high" size={18} className="bs-priority-icon" />
                <div>
                  <div className="bs-priority-label">{t('blesaf.addPatient.priorityLabel')}</div>
                  <div className="bs-priority-sub">{t('blesaf.addPatient.prioritySub')}</div>
                </div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={priority}
                className={`bs-priority-switch ${priority ? 'active' : ''}`}
                onClick={() => setPriority((p) => !p)}
              >
                <span className="bs-priority-knob" />
              </button>
            </div>

            {/* Submit button */}
            <button
              className="bs-submit-btn"
              onClick={handleSubmit}
              disabled={isSubmitting || !name.trim()}
            >
              {isSubmitting ? (
                <span
                  style={{
                    width: 20,
                    height: 20,
                    border: '2px solid rgba(255,255,255,0.4)',
                    borderTopColor: '#fff',
                    borderRadius: '50%',
                    animation: 'spin 0.6s linear infinite',
                    display: 'inline-block',
                  }}
                />
              ) : (
                <Icon name="arrow_forward" size={18} />
              )}
              {isSubmitting ? t('blesaf.addPatient.submitting') : t('blesaf.addPatient.submit')}
            </button>
          </>
        ) : (
          /* ─── CONFIRMATION STEP ─── */
          <>
            {/* Header row */}
            <div className="bs-confirm-header">
              <div className="bs-confirm-identity">
                <div className="bs-check-circle">
                  <Icon name="check" size={16} fill />
                </div>
                <div>
                  <p className="bs-confirm-name">{name.trim()}</p>
                  <p className="bs-confirm-sub">
                    {visitType === 'walk-in'
                      ? t('confirmation.sub_walk_in')
                      : t('confirmation.sub_appointment')}
                  </p>
                </div>
              </div>
              {addedEntry && (
                <div className="bs-position-pill">
                  <span className="bs-position-label">{t('confirmation.position_label')}</span>
                  <span className="bs-position-number" aria-label={`${t('confirmation.position_label')} ${addedEntry.position}`}>
                    {addedEntry.position}
                  </span>
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="bs-action-buttons">
              {/* WhatsApp */}
              <button
                className="bs-action-btn bs-action-btn--wa"
                onClick={() => guardAction(handleSendWhatsApp)}
                disabled={!whatsAppUrl}
                aria-label={t('confirmation.btn_whatsapp_label')}
                title={!whatsAppUrl
                  ? t('confirmation.btn_whatsapp_tooltip_no_phone')
                  : t('confirmation.btn_whatsapp_label')}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
              </button>

              {/* Add another */}
              <button
                className="bs-action-btn bs-action-btn--add"
                onClick={() => guardAction(handleAddAnother)}
                aria-label={t('confirmation.btn_add_another_label')}
                title={t('confirmation.btn_add_another_label')}
              >
                <Icon name="person_add" size={22} />
              </button>

              {/* Dismiss — with ring countdown */}
              <button
                className="bs-action-btn bs-action-btn--back"
                onClick={() => guardAction(handleDone)}
                aria-label={t('confirmation.btn_dismiss_label')}
                title={t('confirmation.btn_dismiss_label')}
              >
                <div className="bs-dismiss-ring-wrap">
                  <svg className="bs-dismiss-ring" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r="15" fill="none" stroke="var(--border, #E8E6DF)" strokeWidth="2.5" />
                    <circle
                      className="bs-dismiss-ring-progress"
                      cx="18" cy="18" r="15"
                      fill="none"
                      stroke="var(--text-tertiary, #9E9B90)"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeDasharray="94.25"
                      strokeDashoffset="94.25"
                    />
                  </svg>
                  <Icon name="undo" size={16} className="bs-dismiss-ring-icon" />
                </div>
              </button>
            </div>
          </>
        )}
        </div>
      </div>
    </>
  );
}

// Format raw digits as "XX XXX XXX"
function formatPhoneDisplay(raw: string): string {
  let formatted = raw;
  if (raw.length > 2) formatted = raw.slice(0, 2) + ' ' + raw.slice(2);
  if (raw.length > 5) formatted = formatted.slice(0, 6) + ' ' + formatted.slice(6);
  return formatted;
}
