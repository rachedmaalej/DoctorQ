import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import '@/components/receptionist/receptionist.css';

interface BSSecurityPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

function getPasswordStrength(pw: string): { level: 'weak' | 'medium' | 'strong'; label: string; color: string; percent: number } {
  if (pw.length === 0) return { level: 'weak', label: '', color: '#E8E6DF', percent: 0 };
  const hasLetter = /[a-zA-Z]/.test(pw);
  const hasDigit = /\d/.test(pw);
  const isLong = pw.length >= 10;
  const isVeryLong = pw.length >= 14;
  const hasSpecial = /[^a-zA-Z0-9]/.test(pw);

  if (!isLong || !hasLetter || !hasDigit) {
    return { level: 'weak', label: 'Faible', color: '#D94F3B', percent: 33 };
  }
  if (isVeryLong && hasSpecial) {
    return { level: 'strong', label: 'Fort', color: '#2D8B4E', percent: 100 };
  }
  return { level: 'medium', label: 'Correct', color: '#D4920B', percent: 66 };
}

export default function BSSecurityPanel({ isOpen, onClose }: BSSecurityPanelProps) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Reset form when opening
  useEffect(() => {
    if (isOpen) {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setMessage(null);
    }
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape' && isOpen) onClose(); };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [isOpen, onClose]);

  const strength = getPasswordStrength(newPassword);
  const hasLetter = /[a-zA-Z]/.test(newPassword);
  const hasDigit = /\d/.test(newPassword);
  const isLongEnough = newPassword.length >= 10;
  const passwordsMatch = newPassword === confirmPassword && confirmPassword.length > 0;
  const canSubmit = currentPassword.length > 0 && isLongEnough && hasLetter && hasDigit && passwordsMatch;

  const handleSubmit = useCallback(async () => {
    if (!canSubmit) return;
    setMessage(null);
    setSaving(true);
    try {
      await api.changePassword(currentPassword, newPassword);
      setMessage({ type: 'success', text: 'Mot de passe modifié avec succès. Un email de confirmation a été envoyé.' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      if (err?.code === 'INVALID_PASSWORD') {
        setMessage({ type: 'error', text: 'Mot de passe actuel incorrect' });
      } else if (err?.code === 'RATE_LIMIT') {
        setMessage({ type: 'error', text: 'Trop de tentatives. Réessayez dans une heure.' });
      } else {
        setMessage({ type: 'error', text: 'Erreur lors de la modification du mot de passe' });
      }
    } finally {
      setSaving(false);
    }
  }, [canSubmit, currentPassword, newPassword]);

  return (
    <>
      {isOpen && <div className="bs-panel-backdrop" onClick={onClose} />}

      <div className={`bs-right-panel ${isOpen ? 'open' : ''}`} style={{ zIndex: 220, maxWidth: 430, width: '100%' }}>
        {/* Header */}
        <div className="bs-panel-header">
          <button onClick={onClose} className="bs-panel-back">
            <span className="material-symbols-rounded" style={{ fontSize: 22 }}>arrow_back</span>
          </button>
          <span className="bs-panel-title">Sécurité</span>
        </div>

        <div className="bs-panel-body">
          {/* Password change form */}
          <div className="bs-settings-label">Changer le mot de passe</div>
          <div style={{
            background: '#FFF', border: '1px solid #E8E6DF', borderRadius: 12,
            padding: 20, marginBottom: 20,
          }}>
            {/* Current password */}
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#6B6960', marginBottom: 6 }}>
              Mot de passe actuel
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
              placeholder="••••••••"
              className="bs-profile-input"
              style={{ marginBottom: 16 }}
              autoComplete="current-password"
            />

            {/* New password */}
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#6B6960', marginBottom: 6 }}>
              Nouveau mot de passe
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder="Min. 10 caractères, 1 lettre + 1 chiffre"
              className="bs-profile-input"
              autoComplete="new-password"
            />

            {/* Strength indicator */}
            {newPassword.length > 0 && (
              <div style={{ marginTop: 8, marginBottom: 12 }}>
                {/* Bar */}
                <div style={{
                  height: 4, borderRadius: 2, background: '#F0EFEA',
                  overflow: 'hidden', marginBottom: 6,
                }}>
                  <div style={{
                    height: '100%', width: `${strength.percent}%`,
                    background: strength.color, borderRadius: 2,
                    transition: 'width 0.3s, background 0.3s',
                  }} />
                </div>

                {/* Requirements checklist */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <RequirementRow met={isLongEnough} text="Au moins 10 caractères" />
                  <RequirementRow met={hasLetter} text="Au moins 1 lettre" />
                  <RequirementRow met={hasDigit} text="Au moins 1 chiffre" />
                </div>
              </div>
            )}

            {/* Confirm password */}
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#6B6960', marginBottom: 6, marginTop: newPassword.length > 0 ? 0 : 16 }}>
              Confirmer le nouveau mot de passe
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="Retapez le nouveau mot de passe"
              className="bs-profile-input"
              autoComplete="new-password"
            />
            {confirmPassword.length > 0 && !passwordsMatch && (
              <div style={{ fontSize: 11, color: '#D94F3B', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                <span className="material-symbols-rounded" style={{ fontSize: 14 }}>error</span>
                Les mots de passe ne correspondent pas
              </div>
            )}

            {/* Submit button */}
            <button
              onClick={handleSubmit}
              disabled={!canSubmit || saving}
              style={{
                width: '100%', height: 44, borderRadius: 10, border: 'none',
                background: canSubmit && !saving ? '#0F7B6C' : '#E8E6DF',
                color: canSubmit && !saving ? 'white' : '#9E9B90',
                fontFamily: 'inherit', fontSize: 14, fontWeight: 600,
                cursor: canSubmit && !saving ? 'pointer' : 'not-allowed',
                marginTop: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                transition: 'all 0.15s',
              }}
            >
              {saving ? (
                <span className="material-symbols-rounded animate-spin" style={{ fontSize: 18 }}>progress_activity</span>
              ) : (
                <span className="material-symbols-rounded" style={{ fontSize: 18 }}>lock</span>
              )}
              {saving ? 'Modification...' : 'Modifier le mot de passe'}
            </button>

            {/* Result message */}
            {message && (
              <div style={{
                marginTop: 12, padding: '10px 12px', borderRadius: 8,
                background: message.type === 'success' ? '#EDF7F0' : '#FDF0ED',
                color: message.type === 'success' ? '#2D8B4E' : '#D94F3B',
                fontSize: 13, fontWeight: 500, lineHeight: 1.4,
                display: 'flex', alignItems: 'flex-start', gap: 8,
              }}>
                <span className="material-symbols-rounded" style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>
                  {message.type === 'success' ? 'check_circle' : 'error'}
                </span>
                {message.text}
              </div>
            )}
          </div>

          {/* Security info */}
          <div style={{
            display: 'flex', alignItems: 'flex-start', gap: 8,
            padding: '12px 14px', background: '#F6F5F0', borderRadius: 10,
          }}>
            <span className="material-symbols-rounded" style={{ fontSize: 16, color: '#9E9B90', flexShrink: 0, marginTop: 1 }}>
              info
            </span>
            <span style={{ fontSize: 11, color: '#9E9B90', lineHeight: 1.5 }}>
              Après un changement de mot de passe, toutes vos autres sessions seront déconnectées par mesure de sécurité.
            </span>
          </div>
        </div>
      </div>
    </>
  );
}

function RequirementRow({ met, text }: { met: boolean; text: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: met ? '#2D8B4E' : '#9E9B90' }}>
      <span className="material-symbols-rounded" style={{ fontSize: 14 }}>
        {met ? 'check_circle' : 'circle'}
      </span>
      {text}
    </div>
  );
}
