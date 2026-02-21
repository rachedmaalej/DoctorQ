import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/stores/authStore';
import { api } from '@/lib/api';
import '@/components/receptionist/receptionist.css';

interface BSClinicProfilePanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function BSClinicProfilePanel({ isOpen, onClose }: BSClinicProfilePanelProps) {
  const { t } = useTranslation();
  const { clinic } = useAuthStore();

  // ── Clinic info ──
  const [clinicForm, setClinicForm] = useState({
    name: '', doctorName: '', doctorGender: '' as 'M' | 'F' | '', phone: '', address: '',
  });

  // ── Password ──
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

  // ── UI state ──
  const [savingPassword, setSavingPassword] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  // Track last-saved snapshot for dirty detection
  const savedRef = useRef({ name: '', doctorName: '', doctorGender: '' as string, phone: '', address: '' });

  const getSnapshot = useCallback(() => ({
    name: clinicForm.name, doctorName: clinicForm.doctorName,
    doctorGender: clinicForm.doctorGender, phone: clinicForm.phone,
    address: clinicForm.address,
  }), [clinicForm]);

  const hasChanges = useCallback(() => {
    const s = savedRef.current;
    const c = getSnapshot();
    return s.name !== c.name || s.doctorName !== c.doctorName || s.doctorGender !== c.doctorGender
      || s.phone !== c.phone || s.address !== c.address;
  }, [getSnapshot]);

  // Auto-save: fire-and-forget when there are dirty changes
  // Does NOT call checkAuth() to avoid re-render cascade that resets the panel
  const autoSave = useCallback(async () => {
    if (!hasChanges()) return;
    setAutoSaveStatus('saving');
    try {
      await api.updateClinic({
        name: clinicForm.name,
        doctorName: clinicForm.doctorName || undefined,
        doctorGender: clinicForm.doctorGender || undefined,
        phone: clinicForm.phone || undefined,
        address: clinicForm.address || undefined,
      });
      savedRef.current = getSnapshot();
      setAutoSaveStatus('saved');
      setTimeout(() => setAutoSaveStatus('idle'), 2000);
    } catch {
      setAutoSaveStatus('error');
      setTimeout(() => setAutoSaveStatus('idle'), 3000);
    }
  }, [clinicForm, hasChanges, getSnapshot]);

  // Sync clinic data
  useEffect(() => {
    if (clinic) {
      const form = {
        name: clinic.name || '',
        doctorName: clinic.doctorName || '',
        doctorGender: (clinic.doctorGender as 'M' | 'F') || '',
        phone: (clinic as any).phone || '',
        address: (clinic as any).address || '',
      };
      setClinicForm(form);
      savedRef.current = { ...form };
    }
  }, [clinic]);

  // Auto-save when panel closes, then navigate back
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

  // Toggle row — auto-save when leaving a saveable field
  const toggleRow = (id: string) => {
    if (expandedRow && expandedRow !== 'password' && expandedRow !== id) {
      autoSave();
    }
    setExpandedRow(expandedRow === id ? null : id);
  };

  // Format phone: +216XXXXXXXX → +216 XX XXX XXX (8 digits max)
  const formatPhone = (raw: string) => {
    const digits = raw.replace(/\D/g, '');
    if (digits.startsWith('216') && digits.length >= 4) {
      const local = digits.slice(3, 11); // max 8 digits
      if (local.length <= 2) return `+216 ${local}`;
      if (local.length <= 5) return `+216 ${local.slice(0, 2)} ${local.slice(2)}`;
      return `+216 ${local.slice(0, 2)} ${local.slice(2, 5)} ${local.slice(5, 8)}`;
    }
    return raw;
  };

  const handlePhoneChange = (input: string) => {
    // Store only digits with leading +, limit to +216 + 8 digits
    let stripped = input.replace(/[^\d+]/g, '');
    if (stripped.startsWith('+216')) {
      stripped = '+216' + stripped.slice(4).replace(/\D/g, '').slice(0, 8);
    } else if (stripped.startsWith('216')) {
      stripped = '+216' + stripped.slice(3).replace(/\D/g, '').slice(0, 8);
    }
    setClinicForm({ ...clinicForm, phone: stripped });
  };


  const handleChangePassword = async () => {
    setPasswordMessage(null);
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordMessage({ type: 'error', text: t('settings.passwordMismatch') });
      return;
    }
    setSavingPassword(true);
    try {
      await api.changePassword(passwordForm.currentPassword, passwordForm.newPassword);
      setPasswordMessage({ type: 'success', text: t('settings.passwordChanged') });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      setPasswordMessage({
        type: 'error',
        text: err.code === 'INVALID_PASSWORD' ? t('settings.wrongPassword') : t('settings.passwordError'),
      });
    } finally {
      setSavingPassword(false);
    }
  };


  return (
    <>
      {/* Backdrop */}
      {isOpen && <div className="bs-panel-backdrop" onClick={handleClose} />}

      {/* Panel */}
      <div className={`bs-right-panel ${isOpen ? 'open' : ''}`} style={{ zIndex: 95 }}>
        {/* Header */}
        <div className="bs-panel-header">
          <button onClick={handleClose} className="bs-panel-back">
            <span className="material-symbols-rounded" style={{ fontSize: 22 }}>arrow_back</span>
          </button>
          <span className="bs-panel-title">Profil du cabinet</span>
        </div>

        <div className="bs-panel-body">
          {/* ── MON CABINET ── */}
          <div className="bs-settings-label">Mon cabinet</div>
          <div className="bs-settings-group">
            {/* Clinic name */}
            <button className="bs-settings-item" onClick={() => toggleRow('name')}>
              <div className="bs-settings-ico" style={{ background: '#E8F5F1', color: '#0F7B6C' }}>
                <span className="material-symbols-rounded" style={{ fontSize: 18 }}>home</span>
              </div>
              <div className="bs-settings-txt">
                <div className="bs-settings-name">Nom du cabinet</div>
                <div className="bs-settings-desc">Nom affiché aux patients</div>
              </div>
              <span className="bs-settings-value">{clinicForm.name || '—'}</span>
              <span className="material-symbols-rounded bs-settings-chev">chevron_right</span>
            </button>
            <div className={`bs-expand ${expandedRow === 'name' ? 'open' : ''}`}>
              <input
                className="bs-profile-input"
                type="text"
                value={clinicForm.name}
                onChange={e => setClinicForm({ ...clinicForm, name: e.target.value })}
                placeholder="Nom du cabinet"
              />
            </div>

            {/* Doctor name */}
            <button className="bs-settings-item" onClick={() => toggleRow('doctor')}>
              <div className="bs-settings-ico" style={{ background: '#E8F5F1', color: '#0F7B6C' }}>
                <span className="material-symbols-rounded" style={{ fontSize: 18 }}>person</span>
              </div>
              <div className="bs-settings-txt">
                <div className="bs-settings-name">Médecin</div>
                <div className="bs-settings-desc">Nom et civilité</div>
              </div>
              <span className="bs-settings-value">
                {clinicForm.doctorGender ? `${clinicForm.doctorGender === 'M' ? 'M.' : 'Mme'} ` : ''}
                {clinicForm.doctorName ? clinicForm.doctorName.split(' ').map(w => w[0]).join('. ') + '.' : '—'}
              </span>
              <span className="material-symbols-rounded bs-settings-chev">chevron_right</span>
            </button>
            <div className={`bs-expand ${expandedRow === 'doctor' ? 'open' : ''}`}>
              <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <div className="bs-gender-toggle">
                  <button
                    className={`bs-gender-btn ${clinicForm.doctorGender === 'M' ? 'active' : ''}`}
                    onClick={() => setClinicForm({ ...clinicForm, doctorGender: 'M' })}
                  >M.</button>
                  <button
                    className={`bs-gender-btn ${clinicForm.doctorGender === 'F' ? 'active' : ''}`}
                    onClick={() => setClinicForm({ ...clinicForm, doctorGender: 'F' })}
                  >Mme</button>
                </div>
                <input
                  className="bs-profile-input"
                  type="text"
                  value={clinicForm.doctorName}
                  onChange={e => setClinicForm({ ...clinicForm, doctorName: e.target.value })}
                  placeholder="Nom du médecin"
                  style={{ flex: 1 }}
                />
              </div>
            </div>

            {/* Phone */}
            <button className="bs-settings-item" onClick={() => toggleRow('phone')}>
              <div className="bs-settings-ico" style={{ background: '#EDF3FC', color: '#3B7DD9' }}>
                <span className="material-symbols-rounded" style={{ fontSize: 18 }}>phone</span>
              </div>
              <div className="bs-settings-txt">
                <div className="bs-settings-name">Téléphone</div>
                <div className="bs-settings-desc">Numéro de contact</div>
              </div>
              <span className="bs-settings-value">{clinicForm.phone ? formatPhone(clinicForm.phone) : '—'}</span>
              <span className="material-symbols-rounded bs-settings-chev">chevron_right</span>
            </button>
            <div className={`bs-expand ${expandedRow === 'phone' ? 'open' : ''}`}>
              <input
                className="bs-profile-input"
                type="tel"
                value={formatPhone(clinicForm.phone)}
                onChange={e => handlePhoneChange(e.target.value)}
                placeholder="+216 XX XXX XXX"
              />
            </div>

            {/* Address */}
            <button className="bs-settings-item" onClick={() => toggleRow('address')}>
              <div className="bs-settings-ico" style={{ background: '#EDF3FC', color: '#3B7DD9' }}>
                <span className="material-symbols-rounded" style={{ fontSize: 18 }}>location_on</span>
              </div>
              <div className="bs-settings-txt">
                <div className="bs-settings-name">Adresse</div>
                <div className="bs-settings-desc">Adresse du cabinet</div>
              </div>
              <span className="bs-settings-value">{clinicForm.address || '—'}</span>
              <span className="material-symbols-rounded bs-settings-chev">chevron_right</span>
            </button>
            <div className={`bs-expand ${expandedRow === 'address' ? 'open' : ''}`}>
              <input
                className="bs-profile-input"
                type="text"
                value={clinicForm.address}
                onChange={e => setClinicForm({ ...clinicForm, address: e.target.value })}
                placeholder="Adresse complète"
              />
            </div>
          </div>

          {/* ── SÉCURITÉ ── */}
          <div className="bs-settings-label">Sécurité</div>
          <div className="bs-settings-group">
            <button className="bs-settings-item" onClick={() => toggleRow('password')}>
              <div className="bs-settings-ico" style={{ background: '#FDF0ED', color: '#D94F3B' }}>
                <span className="material-symbols-rounded" style={{ fontSize: 18 }}>lock</span>
              </div>
              <div className="bs-settings-txt">
                <div className="bs-settings-name">Changer le mot de passe</div>
                <div className="bs-settings-desc">Sécurisez votre compte</div>
              </div>
              <span className="material-symbols-rounded bs-settings-chev">chevron_right</span>
            </button>
            <div className={`bs-expand ${expandedRow === 'password' ? 'open' : ''}`}>
              <div className="bs-expand-form">
                <label className="bs-form-label">Mot de passe actuel</label>
                <input
                  className="bs-profile-input"
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={e => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  placeholder="••••••••"
                />
                <label className="bs-form-label">Nouveau</label>
                <input
                  className="bs-profile-input"
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={e => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  placeholder="Min. 8 caractères"
                  minLength={8}
                />
                <label className="bs-form-label">Confirmer</label>
                <input
                  className="bs-profile-input"
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={e => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  placeholder="Retapez le mot de passe"
                  minLength={8}
                />
                <button
                  className="bs-btn-primary compact"
                  disabled={savingPassword || !passwordForm.currentPassword || !passwordForm.newPassword}
                  onClick={handleChangePassword}
                  style={{ marginTop: 10 }}
                >
                  <span className="material-symbols-rounded" style={{ fontSize: 16 }}>lock</span>
                  {savingPassword ? 'Enregistrement...' : 'Changer le mot de passe'}
                </button>
                {passwordMessage && (
                  <div className={`bs-msg ${passwordMessage.type}`}>{passwordMessage.text}</div>
                )}
              </div>
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
              {autoSaveStatus === 'error' && 'Erreur lors de l\'enregistrement'}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
