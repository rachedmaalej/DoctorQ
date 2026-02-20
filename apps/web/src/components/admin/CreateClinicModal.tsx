import { useState } from 'react';
import { api } from '@/lib/api';
import { formatPhone, extractPhoneDigits, DEFAULT_PHONE_VALUE } from '@/lib/phone';
import { webBrand } from '@/lib/brand';

interface CreateClinicModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}

const SPECIALTIES = [
  { value: 'general', label: 'Médecine Générale' },
  { value: 'gynecology', label: 'Gynécologie-Obstétrique' },
  { value: 'pediatrics', label: 'Pédiatrie' },
  { value: 'ophthalmology', label: 'Ophtalmologie' },
  { value: 'cardiology', label: 'Cardiologie' },
  { value: 'dermatology', label: 'Dermatologie' },
  { value: 'orthopedics', label: 'Orthopédie et Traumatologie' },
  { value: 'radiology', label: 'Radiologie' },
  { value: 'gastroenterology', label: 'Gastro-Entérologie' },
  { value: 'other', label: 'Autres' },
];

const STEP_LABELS = ['Identity', 'Contact', 'Account', 'Review'];

/* ── inline styles using CSS variables from index.css ── */
const s = {
  backdrop: {
    position: 'fixed' as const, inset: 0,
    background: 'rgba(0,0,0,0.35)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 50, backdropFilter: 'blur(2px)',
    animation: 'fadeIn 0.2s ease',
  },
  card: {
    background: 'var(--surface)',
    borderRadius: 16,
    width: 520, maxWidth: 'calc(100% - 32px)',
    maxHeight: '90vh', overflow: 'hidden',
    boxShadow: '0 16px 48px rgba(0,0,0,0.18)',
    display: 'flex', flexDirection: 'column' as const,
    animation: 'scaleIn 0.25s ease',
  },
  /* step indicator */
  stepIndicator: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '24px 32px 0', gap: 0,
  },
  stepDot: {
    width: 32, height: 32, borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 13, fontWeight: 700,
    transition: 'all 0.3s ease', flexShrink: 0,
    background: 'var(--surface-2)', color: 'var(--text-muted)',
    border: '2px solid var(--border)',
  },
  stepDotActive: {
    background: 'var(--brand)', color: '#fff', borderColor: 'var(--brand)',
    transform: 'scale(1.1)',
  },
  stepDotCompleted: {
    background: 'var(--success)', color: '#fff', borderColor: 'var(--success)',
  },
  stepLine: {
    height: 2, flex: 1, maxWidth: 60,
    background: 'var(--border)', transition: 'background 0.3s ease',
  },
  stepLineCompleted: { background: 'var(--success)' },
  stepLabels: {
    display: 'flex', justifyContent: 'space-between',
    padding: '8px 24px 0', maxWidth: 360, margin: '0 auto',
  },
  stepLabel: {
    fontSize: 10.5, fontWeight: 600, color: 'var(--text-muted)',
    textAlign: 'center' as const, width: 70, transition: 'color 0.3s',
  },
  stepLabelActive: { color: 'var(--brand)' },
  stepLabelCompleted: { color: 'var(--success)' },
  /* body */
  body: {
    padding: '20px 28px', flex: 1, overflowY: 'auto' as const,
    minHeight: 260, position: 'relative' as const,
  },
  sectionLabel: {
    fontSize: 11, fontWeight: 700, textTransform: 'uppercase' as const,
    letterSpacing: 0.7, color: 'var(--text-muted)',
    marginBottom: 16, paddingBottom: 8,
    borderBottom: '1px solid var(--border-subtle)',
  },
  fields: { display: 'flex', flexDirection: 'column' as const, gap: 16 },
  row: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
  /* form fields */
  label: {
    display: 'block', fontSize: 10.5, fontWeight: 700,
    textTransform: 'uppercase' as const, letterSpacing: 0.6,
    color: 'var(--text-muted)', marginBottom: 6,
  },
  input: {
    width: '100%', padding: '10px 12px',
    border: '1px solid var(--border)', borderRadius: 7,
    fontSize: 14, fontWeight: 500,
    color: 'var(--text-primary)', background: 'var(--surface)',
    outline: 'none', transition: 'border-color 0.15s, box-shadow 0.15s',
  },
  inputError: {
    borderColor: 'var(--danger)',
    boxShadow: '0 0 0 3px rgba(192,57,43,0.08)',
  },
  select: {
    width: '100%', padding: '10px 12px',
    border: '1px solid var(--border)', borderRadius: 7,
    fontSize: 14, fontWeight: 500,
    color: 'var(--text-primary)', background: 'var(--surface)',
    outline: 'none', cursor: 'pointer',
  },
  errorText: { fontSize: 12, color: 'var(--danger)', marginTop: 4 },
  phonePrefix: {
    display: 'flex', alignItems: 'center', padding: '0 10px',
    background: 'var(--surface-2)', border: '1px solid var(--border)',
    borderRight: 'none', borderRadius: '7px 0 0 7px',
    fontSize: 13, fontFamily: 'var(--mono)', color: 'var(--text-secondary)',
    whiteSpace: 'nowrap' as const,
  },
  /* strength bar */
  strengthBar: { display: 'flex', gap: 3, marginTop: 8 },
  strengthSeg: {
    height: 3, flex: 1, borderRadius: 2,
    background: 'var(--border)', transition: 'background 0.3s',
  },
  strengthText: { fontSize: 11, fontWeight: 600, marginTop: 4, color: 'var(--text-muted)' },
  /* review grid */
  reviewGrid: {
    display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
    border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden',
  },
  reviewCell: {
    padding: '14px 16px',
    borderRight: '1px solid var(--border-subtle)',
    borderBottom: '1px solid var(--border-subtle)',
  },
  reviewCellLabel: {
    fontSize: 10, fontWeight: 700, textTransform: 'uppercase' as const,
    letterSpacing: 0.5, color: 'var(--text-muted)', marginBottom: 4,
  },
  reviewCellValue: {
    fontSize: 13, fontWeight: 500, color: 'var(--text-primary)',
    fontFamily: 'var(--mono)', wordBreak: 'break-all' as const,
  },
  reviewCellEmpty: {
    color: 'var(--text-muted)', fontStyle: 'italic' as const, fontFamily: 'var(--font-admin)',
  },
  reviewEditBtn: {
    display: 'inline-flex', alignItems: 'center', gap: 3,
    padding: '4px 10px', borderRadius: 6,
    background: 'var(--brand-pale)', color: 'var(--brand)',
    border: 'none', fontSize: 11, fontWeight: 600,
    cursor: 'pointer', transition: 'all 0.15s',
    marginTop: 14,
  },
  /* footer */
  footer: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '16px 28px 20px',
    borderTop: '1px solid var(--border-subtle)',
  },
  btnPrimary: {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
    padding: '11px 20px', background: 'var(--brand)', color: '#fff',
    border: 'none', borderRadius: 8,
    fontSize: 14, fontWeight: 600, cursor: 'pointer',
    transition: 'all 0.15s',
  },
  btnSecondary: {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
    padding: '11px 20px', background: 'var(--surface)', color: 'var(--text-primary)',
    border: '1.5px solid var(--border)', borderRadius: 8,
    fontSize: 14, fontWeight: 550, cursor: 'pointer',
    transition: 'all 0.15s',
  },
  errorBanner: {
    background: 'var(--danger-pale)', border: '1px solid #E8AAAA',
    borderRadius: 8, padding: '10px 14px',
    fontSize: 13, color: 'var(--danger)', fontWeight: 500,
    marginBottom: 12,
  },
  /* success */
  successIcon: {
    width: 64, height: 64, borderRadius: '50%', background: 'var(--success-pale)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    margin: '0 auto 16px',
  },
  credBox: {
    background: 'var(--surface-2)', border: '1px solid var(--border)',
    borderRadius: 10, padding: '4px 0', marginBottom: 16, textAlign: 'left' as const,
  },
  credRow: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '10px 16px', fontSize: 13,
    borderBottom: '1px solid var(--border-subtle)',
  },
  credLabel: {
    fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase' as const,
    letterSpacing: 0.6, color: 'var(--text-muted)',
  },
  credValue: {
    fontFamily: 'var(--mono)', fontWeight: 500, color: 'var(--text-primary)',
    userSelect: 'all' as const,
  },
  copyBtn: {
    display: 'inline-flex', alignItems: 'center', gap: 4,
    padding: '8px 16px', background: 'transparent', color: 'var(--brand)',
    border: '1px solid var(--brand-pale-2)', borderRadius: 7,
    fontSize: 13, fontWeight: 600, cursor: 'pointer',
    transition: 'all 0.15s', marginBottom: 12,
  },
};

/* small SVG icons */
const IconArrow = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14"/><path d="M12 5l7 7-7 7"/>
  </svg>
);
const IconArrowBack = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/>
  </svg>
);
const IconCheck = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 6L9 17l-5-5"/>
  </svg>
);
const IconCheckSmall = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 6L9 17l-5-5"/>
  </svg>
);
const IconCopy = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
  </svg>
);
const IconEdit = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
  </svg>
);

function getPasswordStrength(pw: string): { level: number; label: string; color: string } {
  if (pw.length === 0) return { level: 0, label: '', color: 'var(--text-muted)' };
  if (pw.length < 4) return { level: 1, label: 'Weak', color: 'var(--danger)' };
  if (pw.length < 6) return { level: 2, label: 'Fair', color: 'var(--warning)' };
  if (pw.length < 10) return { level: 3, label: 'Good', color: 'var(--accent)' };
  return { level: 4, label: 'Strong', color: 'var(--success)' };
}

const STRENGTH_COLORS = ['var(--danger)', 'var(--warning)', 'var(--accent)', 'var(--success)'];

export default function CreateClinicModal({ isOpen, onClose, onCreated }: CreateClinicModalProps) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [doctorName, setDoctorName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [language, setLanguage] = useState('fr');
  const [businessType, setBusinessType] = useState('general');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdClinic, setCreatedClinic] = useState<{ id: string; name: string; email: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, boolean>>({});

  const resetForm = () => {
    setStep(1);
    setName('');
    setDoctorName('');
    setEmail('');
    setPassword('');
    setPhone('');
    setLanguage('fr');
    setBusinessType('general');
    setError(null);
    setCreatedClinic(null);
    setCopied(false);
    setFieldErrors({});
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const validateStep = (stepNum: number): boolean => {
    const errors: Record<string, boolean> = {};
    if (stepNum === 1) {
      if (!name.trim()) errors.name = true;
    } else if (stepNum === 3) {
      if (!email.includes('@')) errors.email = true;
      if (password.length < 6) errors.password = true;
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = async () => {
    if (!validateStep(step)) return;

    if (step === 4) {
      // Submit
      setError(null);
      setIsSubmitting(true);
      try {
        const e164Phone = extractPhoneDigits(phone);
        const clinic = await api.createClinic({
          name,
          email,
          password,
          doctorName: doctorName || undefined,
          phone: e164Phone || undefined,
          language,
          businessType,
        });
        setCreatedClinic(clinic);
        onCreated();
      } catch (err: any) {
        setError(err.message || 'Failed to create clinic');
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleCopy = () => {
    if (!createdClinic) return;
    navigator.clipboard.writeText(
      `Clinic: ${createdClinic.name}\nEmail: ${createdClinic.email}\nPassword: ${password}`
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  if (!isOpen) return null;

  const strength = getPasswordStrength(password);
  const specialtyLabel = SPECIALTIES.find(sp => sp.value === businessType)?.label || businessType;
  const langLabel = language === 'ar' ? 'العربية' : 'Français';

  /* ── Success State ── */
  if (createdClinic) {
    return (
      <div style={s.backdrop} onClick={handleClose}>
        <div style={s.card} onClick={e => e.stopPropagation()}>
          {/* All dots completed */}
          <div style={s.stepIndicator}>
            {STEP_LABELS.map((_, i) => (
              <span key={i} style={{ display: 'contents' }}>
                {i > 0 && <div style={{ ...s.stepLine, ...s.stepLineCompleted }} />}
                <div style={{ ...s.stepDot, ...s.stepDotCompleted }}>
                  <IconCheckSmall />
                </div>
              </span>
            ))}
          </div>
          <div style={s.stepLabels}>
            {STEP_LABELS.map((label, i) => (
              <div key={i} style={{ ...s.stepLabel, ...s.stepLabelCompleted }}>{label}</div>
            ))}
          </div>

          <div style={{ ...s.body, textAlign: 'center' as const, padding: '28px 28px' }}>
            <div style={s.successIcon}><IconCheck /></div>
            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
              Clinic Created!
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>
              Share these credentials with the clinic owner
            </div>
            <div style={s.credBox}>
              <div style={s.credRow}>
                <span style={s.credLabel}>Clinic</span>
                <span style={s.credValue}>{createdClinic.name}</span>
              </div>
              <div style={s.credRow}>
                <span style={s.credLabel}>Email</span>
                <span style={s.credValue}>{createdClinic.email}</span>
              </div>
              <div style={{ ...s.credRow, borderBottom: 'none' }}>
                <span style={s.credLabel}>Password</span>
                <span style={s.credValue}>{password}</span>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <button
                style={{ ...s.copyBtn, color: copied ? 'var(--success)' : 'var(--brand)' }}
                onClick={handleCopy}
              >
                <IconCopy /> {copied ? 'Copied!' : 'Copy to Clipboard'}
              </button>
              <button style={{ ...s.btnPrimary, width: '100%' }} onClick={handleClose}>
                Done
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ── Wizard Form ── */
  return (
    <div style={s.backdrop} onClick={handleClose}>
      <div style={s.card} onClick={e => e.stopPropagation()}>
        {/* Step indicator dots */}
        <div style={s.stepIndicator}>
          {STEP_LABELS.map((_, i) => {
            const stepNum = i + 1;
            const isActive = stepNum === step;
            const isCompleted = stepNum < step;
            return (
              <span key={i} style={{ display: 'contents' }}>
                {i > 0 && (
                  <div style={{
                    ...s.stepLine,
                    ...(isCompleted ? s.stepLineCompleted : {}),
                  }} />
                )}
                <div style={{
                  ...s.stepDot,
                  ...(isActive ? s.stepDotActive : {}),
                  ...(isCompleted ? s.stepDotCompleted : {}),
                }}>
                  {isCompleted ? <IconCheckSmall /> : stepNum}
                </div>
              </span>
            );
          })}
        </div>
        <div style={s.stepLabels}>
          {STEP_LABELS.map((label, i) => {
            const stepNum = i + 1;
            return (
              <div key={i} style={{
                ...s.stepLabel,
                ...(stepNum === step ? s.stepLabelActive : {}),
                ...(stepNum < step ? s.stepLabelCompleted : {}),
              }}>{label}</div>
            );
          })}
        </div>

        {/* Body */}
        <div style={s.body}>
          {error && <div style={s.errorBanner}>{error}</div>}

          {/* Step 1: Clinic Identity */}
          {step === 1 && (
            <div>
              <div style={s.sectionLabel}>Clinic Identity</div>
              <div style={s.fields}>
                <div>
                  <label style={s.label}>
                    Clinic Name <span style={{ color: 'var(--danger)', marginLeft: 2 }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => { setName(e.target.value); setFieldErrors(prev => ({ ...prev, name: false })); }}
                    placeholder="Cabinet Dr. Kammoun"
                    style={{ ...s.input, ...(fieldErrors.name ? s.inputError : {}) }}
                    onFocus={e => { e.currentTarget.style.borderColor = 'var(--brand-mid)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(28,74,59,0.1)'; }}
                    onBlur={e => { if (!fieldErrors.name) { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none'; } }}
                    autoFocus
                  />
                  {fieldErrors.name && <div style={s.errorText}>Clinic name is required</div>}
                </div>
                <div style={s.row}>
                  <div>
                    <label style={s.label}>Specialty</label>
                    <select value={businessType} onChange={e => setBusinessType(e.target.value)} style={s.select}>
                      {SPECIALTIES.map(sp => (
                        <option key={sp.value} value={sp.value}>{sp.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={s.label}>Language</label>
                    <select value={language} onChange={e => setLanguage(e.target.value)} style={s.select}>
                      <option value="fr">Français</option>
                      {webBrand.supportedLanguages.includes('ar') && (
                        <option value="ar">العربية</option>
                      )}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Doctor & Contact */}
          {step === 2 && (
            <div>
              <div style={s.sectionLabel}>Doctor & Contact</div>
              <div style={s.fields}>
                <div>
                  <label style={s.label}>Doctor Name</label>
                  <input
                    type="text"
                    value={doctorName}
                    onChange={e => setDoctorName(e.target.value)}
                    placeholder="Dr. Ahmed Kammoun"
                    style={s.input}
                    onFocus={e => { e.currentTarget.style.borderColor = 'var(--brand-mid)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(28,74,59,0.1)'; }}
                    onBlur={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none'; }}
                    autoFocus
                  />
                </div>
                <div>
                  <label style={s.label}>Phone</label>
                  <div style={{ display: 'flex' }}>
                    <div style={s.phonePrefix}>{webBrand.phone.countryCode}</div>
                    <input
                      type="tel"
                      value={phone}
                      onChange={e => setPhone(formatPhone(e.target.value))}
                      onFocus={e => { if (!phone) setPhone(DEFAULT_PHONE_VALUE); e.currentTarget.style.borderColor = 'var(--brand-mid)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(28,74,59,0.1)'; }}
                      onBlur={e => { if (phone === DEFAULT_PHONE_VALUE || phone === webBrand.phone.countryCode) setPhone(''); e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none'; }}
                      placeholder={webBrand.phone.placeholder}
                      style={{ ...s.input, borderRadius: '0 7px 7px 0' }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Account Setup */}
          {step === 3 && (
            <div>
              <div style={s.sectionLabel}>Account Setup</div>
              <div style={s.fields}>
                <div>
                  <label style={s.label}>
                    Email <span style={{ color: 'var(--danger)', marginLeft: 2 }}>*</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => { setEmail(e.target.value); setFieldErrors(prev => ({ ...prev, email: false })); }}
                    placeholder="clinic@email.com"
                    style={{ ...s.input, ...(fieldErrors.email ? s.inputError : {}) }}
                    onFocus={e => { e.currentTarget.style.borderColor = 'var(--brand-mid)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(28,74,59,0.1)'; }}
                    onBlur={e => { if (!fieldErrors.email) { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none'; } }}
                    autoFocus
                  />
                  {fieldErrors.email && <div style={s.errorText}>Valid email is required</div>}
                </div>
                <div>
                  <label style={s.label}>
                    Password <span style={{ color: 'var(--danger)', marginLeft: 2 }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={password}
                    onChange={e => { setPassword(e.target.value); setFieldErrors(prev => ({ ...prev, password: false })); }}
                    placeholder="Min 6 characters"
                    style={{ ...s.input, ...(fieldErrors.password ? s.inputError : {}) }}
                    onFocus={e => { e.currentTarget.style.borderColor = 'var(--brand-mid)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(28,74,59,0.1)'; }}
                    onBlur={e => { if (!fieldErrors.password) { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none'; } }}
                  />
                  {fieldErrors.password && <div style={s.errorText}>Password must be at least 6 characters</div>}
                </div>
                {/* Password strength bar */}
                <div style={s.strengthBar}>
                  {[0, 1, 2, 3].map(i => (
                    <div
                      key={i}
                      style={{
                        ...s.strengthSeg,
                        background: i < strength.level ? STRENGTH_COLORS[strength.level - 1] : 'var(--border)',
                      }}
                    />
                  ))}
                </div>
                {strength.label && (
                  <div style={{ ...s.strengthText, color: strength.color }}>{strength.label}</div>
                )}
              </div>
            </div>
          )}

          {/* Step 4: Review */}
          {step === 4 && (
            <div>
              <div style={s.sectionLabel}>Review & Confirm</div>
              <div style={s.reviewGrid}>
                {/* Row 1 */}
                <div style={s.reviewCell}>
                  <div style={s.reviewCellLabel}>Clinic</div>
                  <div style={s.reviewCellValue}>{name}</div>
                </div>
                <div style={s.reviewCell}>
                  <div style={s.reviewCellLabel}>Specialty</div>
                  <div style={s.reviewCellValue}>{specialtyLabel}</div>
                </div>
                <div style={{ ...s.reviewCell, borderRight: 'none' }}>
                  <div style={s.reviewCellLabel}>Language</div>
                  <div style={s.reviewCellValue}>{langLabel}</div>
                </div>
                {/* Row 2 */}
                <div style={{ ...s.reviewCell, borderBottom: 'none' }}>
                  <div style={s.reviewCellLabel}>Doctor</div>
                  <div style={doctorName ? s.reviewCellValue : { ...s.reviewCellValue, ...s.reviewCellEmpty }}>
                    {doctorName || 'Not specified'}
                  </div>
                </div>
                <div style={{ ...s.reviewCell, borderBottom: 'none' }}>
                  <div style={s.reviewCellLabel}>Phone</div>
                  <div style={phone ? s.reviewCellValue : { ...s.reviewCellValue, ...s.reviewCellEmpty }}>
                    {phone || 'Not specified'}
                  </div>
                </div>
                <div style={{ ...s.reviewCell, borderRight: 'none', borderBottom: 'none' }}>
                  <div style={s.reviewCellLabel}>Email</div>
                  <div style={s.reviewCellValue}>{email}</div>
                </div>
              </div>
              <button style={s.reviewEditBtn} onClick={() => setStep(1)}>
                <IconEdit /> Edit details
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={s.footer}>
          <button
            style={{ ...s.btnSecondary, visibility: step === 1 ? 'hidden' : 'visible' } as React.CSSProperties}
            onClick={handleBack}
          >
            <IconArrowBack /> Back
          </button>
          <button
            style={{ ...s.btnPrimary, opacity: isSubmitting ? 0.5 : 1 }}
            disabled={isSubmitting}
            onClick={handleNext}
          >
            {isSubmitting ? 'Creating...' : step === 4 ? (
              <>Create Clinic <IconCheckSmall /></>
            ) : (
              <>Next <IconArrow /></>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
