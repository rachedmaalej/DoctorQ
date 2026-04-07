import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/stores/authStore';
import { api } from '@/lib/api';
import { webBrand } from '@/lib/brand';
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
    // France legal fields
    siret: '', tvaIntracomNumber: '', postalCode: '', city: '',
    tvaRegime: 'VAT_EXEMPT_293B' as 'VAT_APPLIED' | 'VAT_EXEMPT_293B',
  });

  const isFrance = webBrand.country === 'FR';

  // ── Password ──
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

  // ── UI state ──
  const [savingPassword, setSavingPassword] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  // Track last-saved snapshot for dirty detection
  const savedRef = useRef({
    name: '', doctorName: '', doctorGender: '' as string, phone: '', address: '',
    siret: '', tvaIntracomNumber: '', postalCode: '', city: '', tvaRegime: 'VAT_EXEMPT_293B' as string,
  });

  const getSnapshot = useCallback(() => ({
    name: clinicForm.name, doctorName: clinicForm.doctorName,
    doctorGender: clinicForm.doctorGender, phone: clinicForm.phone,
    address: clinicForm.address,
    siret: clinicForm.siret, tvaIntracomNumber: clinicForm.tvaIntracomNumber,
    postalCode: clinicForm.postalCode, city: clinicForm.city,
    tvaRegime: clinicForm.tvaRegime,
  }), [clinicForm]);

  const hasChanges = useCallback(() => {
    const s = savedRef.current;
    const c = getSnapshot();
    return s.name !== c.name || s.doctorName !== c.doctorName || s.doctorGender !== c.doctorGender
      || s.phone !== c.phone || s.address !== c.address
      || s.siret !== c.siret || s.tvaIntracomNumber !== c.tvaIntracomNumber
      || s.postalCode !== c.postalCode || s.city !== c.city
      || s.tvaRegime !== c.tvaRegime;
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
        siret: clinicForm.siret || null,
        tvaIntracomNumber: clinicForm.tvaIntracomNumber || null,
        postalCode: clinicForm.postalCode || null,
        city: clinicForm.city || null,
        tvaRegime: clinicForm.tvaRegime,
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
        siret: (clinic as any).siret || '',
        tvaIntracomNumber: (clinic as any).tvaIntracomNumber || '',
        postalCode: (clinic as any).postalCode || '',
        city: (clinic as any).city || '',
        tvaRegime: ((clinic as any).tvaRegime as 'VAT_APPLIED' | 'VAT_EXEMPT_293B') || 'VAT_EXEMPT_293B',
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

  const cc = webBrand.phone.countryCode;         // "+216" or "+33"
  const ccDigits = webBrand.phone.countryCodeDigits; // "216" or "33"
  const maxLocal = webBrand.phone.localDigits;     // 8 or 9

  // Extract local digits from any phone format
  const getLocalDigits = (raw: string): string => {
    if (!raw) return '';
    if (raw.startsWith(cc)) {
      return raw.slice(cc.length).replace(/\D/g, '').slice(0, maxLocal);
    }
    const digits = raw.replace(/\D/g, '');
    if (digits.startsWith(ccDigits) && digits.length > maxLocal) {
      return digits.slice(ccDigits.length).slice(0, maxLocal);
    }
    return digits.slice(0, maxLocal);
  };

  // Format phone for display
  const formatPhone = (raw: string): string => {
    if (!raw) return '';
    const local = getLocalDigits(raw);
    if (!local) return `${cc} `;
    if (webBrand.country === 'FR') {
      // FR: +33 6 12 34 56 78
      if (local.length <= 1) return `${cc} ${local}`;
      if (local.length <= 3) return `${cc} ${local.slice(0, 1)} ${local.slice(1)}`;
      if (local.length <= 5) return `${cc} ${local.slice(0, 1)} ${local.slice(1, 3)} ${local.slice(3)}`;
      if (local.length <= 7) return `${cc} ${local.slice(0, 1)} ${local.slice(1, 3)} ${local.slice(3, 5)} ${local.slice(5)}`;
      return `${cc} ${local.slice(0, 1)} ${local.slice(1, 3)} ${local.slice(3, 5)} ${local.slice(5, 7)} ${local.slice(7)}`;
    }
    // TN: +216 XX XXX XXX
    if (local.length <= 2) return `${cc} ${local}`;
    if (local.length <= 5) return `${cc} ${local.slice(0, 2)} ${local.slice(2)}`;
    return `${cc} ${local.slice(0, 2)} ${local.slice(2, 5)} ${local.slice(5, 8)}`;
  };

  const handlePhoneChange = (input: string) => {
    const digits = input.replace(/\D/g, '');
    const local = digits.startsWith(ccDigits) ? digits.slice(ccDigits.length).slice(0, maxLocal) : digits.slice(0, maxLocal);
    setClinicForm({ ...clinicForm, phone: local ? `${cc}${local}` : '' });
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
      {isOpen && <div className="bs-panel-backdrop" onClick={handleClose} style={{ zIndex: 219 }} />}

      {/* Panel */}
      <div className={`bs-right-panel ${isOpen ? 'open' : ''}`} style={{ zIndex: 220, maxWidth: 430, width: '100%' }}>
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
                <span className="material-symbols-rounded" style={{ fontSize: 20 }}>home</span>
              </div>
              <div className="bs-settings-txt">
                <div className="bs-settings-name">{t('settingsBs.clinicProfile.clinicName')}</div>
                <div className="bs-settings-desc">{t('settingsBs.clinicProfile.clinicNameDesc')}</div>
              </div>
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
                <span className="material-symbols-rounded" style={{ fontSize: 20 }}>person</span>
              </div>
              <div className="bs-settings-txt">
                <div className="bs-settings-name">{t('settingsBs.clinicProfile.doctor')}</div>
                <div className="bs-settings-desc">{t('settingsBs.clinicProfile.doctorDesc')}</div>
              </div>
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
                <span className="material-symbols-rounded" style={{ fontSize: 20 }}>phone</span>
              </div>
              <div className="bs-settings-txt">
                <div className="bs-settings-name">{t('settingsBs.clinicProfile.phone')}</div>
                <div className="bs-settings-desc">{t('settingsBs.clinicProfile.phoneDesc')}</div>
              </div>
              <span className="material-symbols-rounded bs-settings-chev">chevron_right</span>
            </button>
            <div className={`bs-expand ${expandedRow === 'phone' ? 'open' : ''}`}>
              <input
                className="bs-profile-input"
                type="tel"
                dir="ltr"
                value={formatPhone(clinicForm.phone)}
                onChange={e => handlePhoneChange(e.target.value)}
                placeholder={webBrand.phone.placeholder}
              />
            </div>

            {/* Address */}
            <button className="bs-settings-item" onClick={() => toggleRow('address')}>
              <div className="bs-settings-ico" style={{ background: '#EDF3FC', color: '#3B7DD9' }}>
                <span className="material-symbols-rounded" style={{ fontSize: 20 }}>location_on</span>
              </div>
              <div className="bs-settings-txt">
                <div className="bs-settings-name">{t('settingsBs.clinicProfile.address')}</div>
                <div className="bs-settings-desc">{t('settingsBs.clinicProfile.addressDesc')}</div>
              </div>
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
              {isFrance && (
                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                  <input
                    className="bs-profile-input"
                    type="text"
                    inputMode="numeric"
                    maxLength={5}
                    value={clinicForm.postalCode}
                    onChange={e => setClinicForm({ ...clinicForm, postalCode: e.target.value.replace(/\D/g, '').slice(0, 5) })}
                    placeholder="Code postal"
                    style={{ width: 120 }}
                  />
                  <input
                    className="bs-profile-input"
                    type="text"
                    value={clinicForm.city}
                    onChange={e => setClinicForm({ ...clinicForm, city: e.target.value })}
                    placeholder="Ville"
                    style={{ flex: 1 }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* ── INFORMATIONS LÉGALES (France only) ── */}
          {isFrance && (
            <>
              <div className="bs-settings-label">Informations légales</div>
              <div className="bs-settings-group">
                {/* SIRET */}
                <button className="bs-settings-item" onClick={() => toggleRow('siret')}>
                  <div className="bs-settings-ico" style={{ background: '#EDE9FE', color: '#7C3AED' }}>
                    <span className="material-symbols-rounded" style={{ fontSize: 20 }}>fingerprint</span>
                  </div>
                  <div className="bs-settings-txt">
                    <div className="bs-settings-name">SIRET</div>
                    <div className="bs-settings-desc">14 chiffres — obligatoire pour les factures</div>
                  </div>
                  <span className="material-symbols-rounded bs-settings-chev">chevron_right</span>
                </button>
                <div className={`bs-expand ${expandedRow === 'siret' ? 'open' : ''}`}>
                  <input
                    className="bs-profile-input"
                    type="text"
                    inputMode="numeric"
                    maxLength={14}
                    value={clinicForm.siret}
                    onChange={e => setClinicForm({ ...clinicForm, siret: e.target.value.replace(/\D/g, '').slice(0, 14) })}
                    placeholder="12345678901234"
                  />
                </div>

                {/* TVA Regime */}
                <button className="bs-settings-item" onClick={() => toggleRow('tvaRegime')}>
                  <div className="bs-settings-ico" style={{ background: '#FEF7E6', color: '#D4920B' }}>
                    <span className="material-symbols-rounded" style={{ fontSize: 20 }}>percent</span>
                  </div>
                  <div className="bs-settings-txt">
                    <div className="bs-settings-name">Régime TVA</div>
                    <div className="bs-settings-desc">
                      {clinicForm.tvaRegime === 'VAT_APPLIED' ? 'TVA 20% appliquée' : 'Franchise en base (art. 293 B)'}
                    </div>
                  </div>
                  <span className="material-symbols-rounded bs-settings-chev">chevron_right</span>
                </button>
                <div className={`bs-expand ${expandedRow === 'tvaRegime' ? 'open' : ''}`}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '8px 0' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', border: `1.5px solid ${clinicForm.tvaRegime === 'VAT_EXEMPT_293B' ? '#0F7B6C' : '#E8E6DF'}`, borderRadius: 8, cursor: 'pointer' }}>
                      <input type="radio" name="tvaRegime" checked={clinicForm.tvaRegime === 'VAT_EXEMPT_293B'} onChange={() => setClinicForm({ ...clinicForm, tvaRegime: 'VAT_EXEMPT_293B' })} />
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>Franchise en base</div>
                        <div style={{ fontSize: 11, color: '#6B6960' }}>Micro-entreprise — "TVA non applicable, art. 293 B du CGI"</div>
                      </div>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', border: `1.5px solid ${clinicForm.tvaRegime === 'VAT_APPLIED' ? '#0F7B6C' : '#E8E6DF'}`, borderRadius: 8, cursor: 'pointer' }}>
                      <input type="radio" name="tvaRegime" checked={clinicForm.tvaRegime === 'VAT_APPLIED'} onChange={() => setClinicForm({ ...clinicForm, tvaRegime: 'VAT_APPLIED' })} />
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>TVA 20% appliquée</div>
                        <div style={{ fontSize: 11, color: '#6B6960' }}>Taux normal — factures HT/TTC</div>
                      </div>
                    </label>
                  </div>
                </div>

                {/* TVA intracom (only if VAT_APPLIED) */}
                {clinicForm.tvaRegime === 'VAT_APPLIED' && (
                  <>
                    <button className="bs-settings-item" onClick={() => toggleRow('tva')}>
                      <div className="bs-settings-ico" style={{ background: '#FEF7E6', color: '#D4920B' }}>
                        <span className="material-symbols-rounded" style={{ fontSize: 20 }}>receipt</span>
                      </div>
                      <div className="bs-settings-txt">
                        <div className="bs-settings-name">N° TVA intracommunautaire</div>
                        <div className="bs-settings-desc">FR + 11 chiffres</div>
                      </div>
                      <span className="material-symbols-rounded bs-settings-chev">chevron_right</span>
                    </button>
                    <div className={`bs-expand ${expandedRow === 'tva' ? 'open' : ''}`}>
                      <input
                        className="bs-profile-input"
                        type="text"
                        maxLength={13}
                        value={clinicForm.tvaIntracomNumber}
                        onChange={e => setClinicForm({ ...clinicForm, tvaIntracomNumber: e.target.value.toUpperCase().replace(/[^FR0-9]/g, '').slice(0, 13) })}
                        placeholder="FR12345678901"
                      />
                    </div>
                  </>
                )}
              </div>
            </>
          )}

          {/* ── SÉCURITÉ ── */}
          <div className="bs-settings-label">{t('settingsBs.clinicProfile.security')}</div>
          <div className="bs-settings-group">
            <button className="bs-settings-item" onClick={() => toggleRow('password')}>
              <div className="bs-settings-ico" style={{ background: '#FDF0ED', color: '#D94F3B' }}>
                <span className="material-symbols-rounded" style={{ fontSize: 20 }}>lock</span>
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
