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

  // Extract local 8-digit part from any phone format
  const getLocalDigits = (raw: string): string => {
    if (!raw) return '';
    // Properly stored with +216 prefix → extract directly
    if (raw.startsWith('+216')) {
      return raw.slice(4).replace(/\D/g, '').slice(0, 8);
    }
    const digits = raw.replace(/\D/g, '');
    // Starts with 216 and too long to be local only → strip country code
    if (digits.startsWith('216') && digits.length > 8) {
      return digits.slice(3).slice(0, 8);
    }
    // Otherwise treat all digits as local
    return digits.slice(0, 8);
  };

  // Format phone for display: +216 XX XXX XXX
  const formatPhone = (raw: string): string => {
    if (!raw) return '';
    const local = getLocalDigits(raw);
    if (!local) return '+216 ';
    if (local.length <= 2) return `+216 ${local}`;
    if (local.length <= 5) return `+216 ${local.slice(0, 2)} ${local.slice(2)}`;
    return `+216 ${local.slice(0, 2)} ${local.slice(2, 5)} ${local.slice(5, 8)}`;
  };

  const handlePhoneChange = (input: string) => {
    const digits = input.replace(/\D/g, '');
    // Strip country code if present (from displayed +216 prefix)
    const local = digits.startsWith('216') ? digits.slice(3).slice(0, 8) : digits.slice(0, 8);
    // Always store in +216XXXXXXXX format
    setClinicForm({ ...clinicForm, phone: local ? `+216${local}` : '' });
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
          <span className="bs-panel-title">{t('settingsBs.clinicProfile.title')}</span>
        </div>

        <div className="bs-panel-body">
          {/* ── MON CABINET ── */}
          <div className="bs-settings-label">{t('settingsBs.clinicProfile.myClinic')}</div>
          <div className="bs-settings-group">
            {/* Clinic name */}
            <button className="bs-settings-item" onClick={() => toggleRow('name')}>
              <div className="bs-settings-ico" style={{ background: '#E8F5F1', color: '#0F7B6C' }}>
                <span className="material-symbols-rounded" style={{ fontSize: 18 }}>home</span>
              </div>
              <div className="bs-settings-txt">
                <div className="bs-settings-name">{t('settingsBs.clinicProfile.clinicName')}</div>
                <div className="bs-settings-desc">{t('settingsBs.clinicProfile.clinicNameDesc')}</div>
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
                placeholder={t('settingsBs.clinicProfile.clinicName')}
              />
            </div>

            {/* Doctor name */}
            <button className="bs-settings-item" onClick={() => toggleRow('doctor')}>
              <div className="bs-settings-ico" style={{ background: '#E8F5F1', color: '#0F7B6C' }}>
                <span className="material-symbols-rounded" style={{ fontSize: 18 }}>person</span>
              </div>
              <div className="bs-settings-txt">
                <div className="bs-settings-name">{t('settingsBs.clinicProfile.doctor')}</div>
                <div className="bs-settings-desc">{t('settingsBs.clinicProfile.doctorDesc')}</div>
              </div>
              <span className="bs-settings-value">
                {clinicForm.doctorGender ? `${clinicForm.doctorGender === 'M' ? t('settingsBs.clinicProfile.mr') : t('settingsBs.clinicProfile.mrs')} ` : ''}
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
                  >{t('settingsBs.clinicProfile.mr')}</button>
                  <button
                    className={`bs-gender-btn ${clinicForm.doctorGender === 'F' ? 'active' : ''}`}
                    onClick={() => setClinicForm({ ...clinicForm, doctorGender: 'F' })}
                  >{t('settingsBs.clinicProfile.mrs')}</button>
                </div>
                <input
                  className="bs-profile-input"
                  type="text"
                  value={clinicForm.doctorName}
                  onChange={e => setClinicForm({ ...clinicForm, doctorName: e.target.value })}
                  placeholder={t('settingsBs.clinicProfile.doctorNamePlaceholder')}
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
                <div className="bs-settings-name">{t('settingsBs.clinicProfile.phone')}</div>
                <div className="bs-settings-desc">{t('settingsBs.clinicProfile.phoneDesc')}</div>
              </div>
              <span className="bs-settings-value">{clinicForm.phone ? formatPhone(clinicForm.phone) : '—'}</span>
              <span className="material-symbols-rounded bs-settings-chev">chevron_right</span>
            </button>
            <div className={`bs-expand ${expandedRow === 'phone' ? 'open' : ''}`}>
              <input
                className="bs-profile-input"
                type="tel"
                dir="ltr"
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
                <div className="bs-settings-name">{t('settingsBs.clinicProfile.address')}</div>
                <div className="bs-settings-desc">{t('settingsBs.clinicProfile.addressDesc')}</div>
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
                placeholder={t('settingsBs.clinicProfile.addressPlaceholder')}
              />
            </div>
          </div>

          {/* ── SÉCURITÉ ── */}
          <div className="bs-settings-label">{t('settingsBs.clinicProfile.security')}</div>
          <div className="bs-settings-group">
            <button className="bs-settings-item" onClick={() => toggleRow('password')}>
              <div className="bs-settings-ico" style={{ background: '#FDF0ED', color: '#D94F3B' }}>
                <span className="material-symbols-rounded" style={{ fontSize: 18 }}>lock</span>
              </div>
              <div className="bs-settings-txt">
                <div className="bs-settings-name">{t('settingsBs.clinicProfile.changePassword')}</div>
                <div className="bs-settings-desc">{t('settingsBs.clinicProfile.changePasswordDesc')}</div>
              </div>
              <span className="material-symbols-rounded bs-settings-chev">chevron_right</span>
            </button>
            <div className={`bs-expand ${expandedRow === 'password' ? 'open' : ''}`}>
              <div className="bs-expand-form">
                <label className="bs-form-label">{t('settingsBs.clinicProfile.currentPassword')}</label>
                <input
                  className="bs-profile-input"
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={e => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  placeholder="••••••••"
                />
                <label className="bs-form-label">{t('settingsBs.clinicProfile.newPassword')}</label>
                <input
                  className="bs-profile-input"
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={e => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  placeholder={t('settingsBs.clinicProfile.minChars')}
                  minLength={8}
                />
                <label className="bs-form-label">{t('settingsBs.clinicProfile.confirmPassword')}</label>
                <input
                  className="bs-profile-input"
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={e => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  placeholder={t('settingsBs.clinicProfile.retypePassword')}
                  minLength={8}
                />
                <button
                  className="bs-btn-primary compact"
                  disabled={savingPassword || !passwordForm.currentPassword || !passwordForm.newPassword}
                  onClick={handleChangePassword}
                  style={{ marginTop: 10 }}
                >
                  <span className="material-symbols-rounded" style={{ fontSize: 16 }}>lock</span>
                  {savingPassword ? t('settingsBs.clinicProfile.changingPassword') : t('settingsBs.clinicProfile.changePasswordBtn')}
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
              {autoSaveStatus === 'saving' && t('settingsBs.autoSave.saving')}
              {autoSaveStatus === 'saved' && t('settingsBs.autoSave.saved')}
              {autoSaveStatus === 'error' && t('settingsBs.autoSave.error')}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
