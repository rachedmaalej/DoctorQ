import { useState, useEffect } from 'react';
import { useQueueStore } from '@/stores/queueStore';
import { webBrand } from '@/lib/brand';

import { logger } from '@/lib/logger';

interface BSAddPatientSheetProps {
  isOpen: boolean;
  onClose: () => void;
  prefilledName: string;
  estimatedPosition: number;
  estimatedWait: string;
  clinicName: string;
  onWhatsAppSent?: (id: string) => void;
}

type SheetStep = 'form' | 'confirm';

export default function BSAddPatientSheet({
  isOpen,
  onClose,
  prefilledName,
  estimatedPosition,
  estimatedWait,
  clinicName,
  onWhatsAppSent,
}: BSAddPatientSheetProps) {
  const { addPatient } = useQueueStore();

  const [step, setStep] = useState<SheetStep>('form');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [isRdv, setIsRdv] = useState(false);
  const [rdvHour, setRdvHour] = useState('');
  const [rdvMinute, setRdvMinute] = useState('');

  // 24h format: 07-19, 15-min increments
  const rdvHours = Array.from({ length: 13 }, (_, i) => (i + 7).toString().padStart(2, '0'));
  const rdvMinutes = ['00', '15', '30', '45'];
  const rdvTime = rdvHour && rdvMinute ? `${rdvHour}:${rdvMinute}` : '';
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Track the added patient info for confirmation
  const [addedName, setAddedName] = useState('');
  const [addedPosition, setAddedPosition] = useState(0);
  const [addedHasPhone, setAddedHasPhone] = useState(false);
  const [addedEntryId, setAddedEntryId] = useState<string | null>(null);
  const [addedPhone, setAddedPhone] = useState('');

  // Reset form when opening with new prefilled name
  useEffect(() => {
    if (isOpen) {
      setStep('form');
      setName(prefilledName);
      setPhone('');
      setIsRdv(false);
      setRdvHour('');
      setRdvMinute('');
      setError(null);
    }
  }, [isOpen, prefilledName]);

  // Auto-close confirmation step after 4 seconds
  useEffect(() => {
    if (step === 'confirm' && isOpen) {
      const timer = setTimeout(handleDone, 4000);
      return () => clearTimeout(timer);
    }
  }, [step, isOpen]);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow digits, format on the fly
    const raw = e.target.value.replace(/\D/g, '');
    setPhone(raw.slice(0, webBrand.phone.localDigits));
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError('Le nom du patient est requis');
      return;
    }
    setError(null);
    setIsSubmitting(true);

    try {
      // Build phone number: only submit if digits were entered
      let patientPhone = '';
      if (phone.length > 0) {
        patientPhone = `${webBrand.phone.countryCode}${phone}`;
      }

      const entry = await addPatient({
        patientName: name.trim(),
        patientPhone,
        appointmentTime: isRdv && rdvTime ? rdvTime : undefined,
      });

      // Store info for confirmation step
      setAddedName(name.trim());
      setAddedPosition(estimatedPosition);
      setAddedHasPhone(phone.length > 0);
      setAddedEntryId(entry.id);
      setAddedPhone(patientPhone);
      setStep('confirm');
    } catch (err: any) {
      logger.error('BSAddPatientSheet submit error:', err);
      if (err.code === 'ALREADY_CHECKED_IN') {
        setError('Ce patient est déjà dans la file d\'attente');
      } else {
        setError(err.message || 'Erreur lors de l\'ajout');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDone = () => {
    onClose();
    // Reset after animation
    setTimeout(() => {
      setStep('form');
      setName('');
      setPhone('');
      setIsRdv(false);
      setRdvHour('');
      setRdvMinute('');
      setError(null);
      setAddedEntryId(null);
      setAddedPhone('');
    }, 400);
  };

  // Format phone display in the input
  const phoneDisplay = phone.length > 0
    ? phone.replace(/(\d{2})(\d{3})?(\d{3})?/, (_, a, b, c) =>
        [a, b, c].filter(Boolean).join(' ')
      )
    : '';

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
            <div className="bs-sheet-title">Nouveau patient</div>
            <div className="bs-sheet-sub">
              Sera en position #{estimatedPosition} · Attente estimée {estimatedWait}
            </div>

            {error && <div className="bs-error">{error}</div>}

            {/* RDV Toggle */}
            <div className="bs-rdv-toggle">
              <button
                className={`bs-rdv-option ${!isRdv ? 'active' : ''}`}
                onClick={() => setIsRdv(false)}
              >
                <span className="material-symbols-rounded">queue</span>
                Sans rendez-vous
              </button>
              <button
                className={`bs-rdv-option ${isRdv ? 'active' : ''}`}
                onClick={() => setIsRdv(true)}
              >
                <span className="material-symbols-rounded">calendar_today</span>
                Avec rendez-vous
              </button>
            </div>

            {/* Name field */}
            <div className="bs-form-group">
              <div className="bs-form-label">
                <span className="material-symbols-rounded">person</span>
                Nom du patient
              </div>
              <input
                type="text"
                className={`bs-form-input ${prefilledName && name === prefilledName ? 'filled' : ''}`}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nom du patient"
                autoFocus={!prefilledName}
              />
            </div>

            {/* Appointment time (conditional) */}
            <div className={`bs-rdv-time-group ${isRdv ? 'visible' : ''}`}>
              <div className="bs-form-label">
                <span className="material-symbols-rounded">schedule</span>
                Heure du rendez-vous
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
                <span className="material-symbols-rounded">phone</span>
                Numéro de téléphone
                <span className="optional">(optionnel)</span>
              </div>
              <div className="bs-phone-input-row">
                <div className="bs-phone-prefix">{webBrand.phone.countryCode}</div>
                <input
                  type="tel"
                  className="bs-form-input"
                  placeholder={webBrand.phone.placeholder.replace(webBrand.phone.countryCode + ' ', '')}
                  value={phoneDisplay}
                  onChange={handlePhoneChange}
                  inputMode="numeric"
                />
              </div>
              <div className="bs-form-hint">
                <span className="material-symbols-rounded">info</span>
                Permet d'appeler le patient et de suivre sa position
              </div>
            </div>

            {/* QR Fallback Card */}
            <div className="bs-qr-fallback">
              <div className="bs-qr-icon">
                <span className="material-symbols-rounded">qr_code_2</span>
              </div>
              <div className="bs-qr-text">
                <strong>Pas de numéro ?</strong> Le patient peut scanner le QR du comptoir pour s'inscrire lui-même.
              </div>
            </div>

            {/* Submit button */}
            <button
              className="bs-submit-btn"
              onClick={handleSubmit}
              disabled={isSubmitting || !name.trim()}
            >
              <span className="material-symbols-rounded">check</span>
              {isSubmitting ? 'Ajout en cours...' : 'Ajouter à la file'}
            </button>
          </>
        ) : (
          /* ─── CONFIRMATION STEP ─── */
          <>
            {/* Success card */}
            <div className="bs-confirm-card">
              <div className="bs-confirm-check">
                <span className="material-symbols-rounded">check_circle</span>
              </div>
              <div className="bs-confirm-name">{addedName}</div>
              <div className="bs-confirm-pos">
                Position #{addedPosition} · Attente estimée {estimatedWait}
              </div>
            </div>

            {/* WhatsApp send card (when phone was entered) */}
            {addedHasPhone && addedEntryId && (
              <div
                className="bs-link-card"
                onClick={() => {
                  const statusUrl = `${window.location.origin}/patient/${addedEntryId}`;
                  const message = `${clinicName} - Suivez votre position dans la file d'attente: ${statusUrl}`;
                  const waUrl = `https://wa.me/${addedPhone.replace('+', '')}?text=${encodeURIComponent(message)}`;
                  window.open(waUrl, '_blank');
                  onWhatsAppSent?.(addedEntryId);
                }}
                style={{ cursor: 'pointer' }}
              >
                <div className="bs-link-icon icon-green">
                  <span className="material-symbols-rounded">chat</span>
                </div>
                <div className="bs-link-text">
                  <div className="bs-link-title">Envoyer le lien par WhatsApp</div>
                  <div className="bs-link-desc">Envoyer le lien de suivi au patient</div>
                </div>
                <div className="bs-link-arrow">
                  <span className="material-symbols-rounded">chevron_right</span>
                </div>
              </div>
            )}

            {/* Phone linking options (when no phone was entered) */}
            {!addedHasPhone && (
              <>
                <div className="bs-section-subtitle">
                  Aucun numéro renseigné. Pour lier le patient :
                </div>

                <div className="bs-link-card">
                  <div className="bs-link-icon icon-accent">
                    <span className="material-symbols-rounded">qr_code_2</span>
                  </div>
                  <div className="bs-link-text">
                    <div className="bs-link-title">Montrer le QR code</div>
                    <div className="bs-link-desc">Le patient scanne pour suivre sa position</div>
                  </div>
                  <div className="bs-link-arrow">
                    <span className="material-symbols-rounded">chevron_right</span>
                  </div>
                </div>

                <div className="bs-link-card">
                  <div className="bs-link-icon icon-blue">
                    <span className="material-symbols-rounded">phone</span>
                  </div>
                  <div className="bs-link-text">
                    <div className="bs-link-title">Ajouter le numéro plus tard</div>
                    <div className="bs-link-desc">Via le menu du patient dans la file</div>
                  </div>
                  <div className="bs-link-arrow">
                    <span className="material-symbols-rounded">chevron_right</span>
                  </div>
                </div>
              </>
            )}

            {/* Done button with progress bar */}
            <button
              className="bs-submit-btn secondary"
              onClick={handleDone}
              style={{ marginTop: '8px', position: 'relative', overflow: 'hidden' }}
            >
              Terminé — Retour à la file
              <span
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  height: 3,
                  background: 'var(--accent, #0F7B6C)',
                  borderRadius: '0 0 12px 12px',
                  animation: 'bs-confirm-progress 4s linear forwards',
                }}
              />
            </button>
          </>
        )}
      </div>
    </>
  );
}
