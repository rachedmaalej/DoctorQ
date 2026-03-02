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

  // Auto-close confirmation after 3 seconds
  useEffect(() => {
    if (step !== 'confirm' || !isOpen) return;
    const timer = setTimeout(handleDone, 3000);
    return () => clearTimeout(timer);
  }, [step, isOpen]);

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

  const handleSendWhatsApp = () => {
    if (!addedEntry || !phoneDigits) return;
    const statusUrl = `${window.location.origin}/patient/${addedEntry.id}`;
    const message = t('whatsapp.message', { clinicName, url: statusUrl });
    const waUrl = `https://wa.me/${webBrand.phone.countryCode.replace('+', '')}${phoneDigits}?text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank');
    onWhatsAppSent?.(addedEntry.id);
  };

  // ─── Helpers ───

  const firstName = name.trim().split(' ')[0];

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
            {/* Success card */}
            <div className="bs-confirm-card">
              {/* SVG check icon with pop-in animation */}
              <div
                className="bs-confirm-check bs-pop-in"
                style={{ boxShadow: '0 0 0 8px rgba(15,123,108,0.15)' }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M5 12l5 5L19 7" stroke="white" strokeWidth="2.5"
                        strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className="bs-confirm-name">{name.trim()}</div>
              {addedEntry && (
                <div className="bs-confirm-pos">
                  Position #{addedEntry.position}
                </div>
              )}
              {/* Returning patient badge */}
              {selectedPatient && (
                <div className="bs-confirm-returning">
                  <Icon name="history" size={12} />
                  {t('blesaf.addPatient.returningBadge', { position: addedEntry?.position ?? '' })}
                </div>
              )}
            </div>

            {/* WhatsApp CTA — only when phone was provided */}
            {phoneDigits.length > 0 && addedEntry && (
              <button
                type="button"
                className="bs-whatsapp-btn"
                onClick={handleSendWhatsApp}
              >
                <div className="bs-whatsapp-icon">
                  <Icon name="smartphone" size={16} />
                </div>
                <div style={{ flex: 1, textAlign: 'left' }}>
                  <div className="bs-whatsapp-title">
                    {t('blesaf.addPatient.whatsappTitle', { name: firstName })}
                  </div>
                  <div className="bs-whatsapp-sub">
                    {t('blesaf.addPatient.whatsappSub')}
                  </div>
                </div>
                <Icon name="chevron_right" size={18} className="bs-whatsapp-arrow" />
              </button>
            )}

            {/* Add another patient */}
            <button
              type="button"
              className="bs-add-another-btn"
              onClick={handleAddAnother}
            >
              <Icon name="add" size={16} />
              {t('blesaf.addPatient.addAnother')}
            </button>

            {/* Done with countdown ring */}
            <button
              type="button"
              className="bs-dismiss-btn"
              onClick={handleDone}
            >
              <svg width="16" height="16" viewBox="0 0 14 14" style={{ flexShrink: 0 }}>
                <circle cx="7" cy="7" r="5.5" fill="none" stroke="#d1fae5" strokeWidth="2"/>
                <circle
                  cx="7" cy="7" r="5.5" fill="none"
                  stroke="var(--accent, #0F7B6C)"
                  strokeWidth="2"
                  strokeDasharray="34.6"
                  strokeDashoffset="0"
                  strokeLinecap="round"
                  style={{
                    transformOrigin: 'center',
                    transform: 'rotate(-90deg)',
                    animation: 'bs-drain 3s linear forwards',
                  }}
                />
              </svg>
              {t('blesaf.addPatient.done')}
            </button>
          </>
        )}
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
