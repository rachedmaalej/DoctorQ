import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { api } from '@/lib/api';
import type { Clinic } from '@/types';

// ─── Design Tokens (mirrors DesktopDashboard.tsx) ────────────────────────────

const C = {
  green800: '#1B3A2D',
  teal: '#0F7B6C',
  tealLight: '#E8F5F1',
  creamBg: '#F5F0E8',
  amber600: '#D4920B',
  amber100: '#FEF7E6',
  red600: '#C0392B',
  textPrimary: '#1A1A1A',
  textSecondary: '#6B6960',
  textMuted: '#9E9B90',
  borderLight: '#E8E6DF',
  white: '#FFFFFF',
  surface2: '#F0EFEA',
};

const body = "'DM Sans', sans-serif";

// ─── Types ────────────────────────────────────────────────────────────────────

type SettingsPane = 'profil' | 'acces' | 'abonnement' | 'duree' | 'langue';

export type { SettingsPane };

interface DesktopSettingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  clinic: Clinic | null;
  onClinicUpdated: () => Promise<void>;
  initialPane?: SettingsPane;
}

// ─── Nav Config ───────────────────────────────────────────────────────────────

const NAV_GROUPS: Array<{
  label: string;
  items: Array<{ id: SettingsPane; icon: string; label: string }>;
}> = [
  {
    label: 'Cabinet',
    items: [
      { id: 'profil', icon: 'person', label: 'Profil' },
      { id: 'acces', icon: 'manage_accounts', label: 'Accès' },
      { id: 'abonnement', icon: 'payments', label: 'Abonnement' },
    ],
  },
  {
    label: "File d'attente",
    items: [
      { id: 'duree', icon: 'timer', label: 'Durée' },
      { id: 'langue', icon: 'language', label: 'Langue' },
    ],
  },
];

// ─── Shared Styles ────────────────────────────────────────────────────────────

const inp: React.CSSProperties = {
  width: '100%', padding: '10px 14px', fontSize: 14, fontFamily: body,
  border: `1px solid ${C.borderLight}`, borderRadius: 10, outline: 'none',
  background: C.white, color: C.textPrimary, boxSizing: 'border-box',
};

const fieldLabel: React.CSSProperties = {
  display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
  letterSpacing: '0.08em', color: C.textMuted, marginBottom: 6,
};

const card: React.CSSProperties = {
  background: C.white, border: `1px solid ${C.borderLight}`,
  borderRadius: 16, padding: '20px 22px', marginBottom: 14,
};

const cardTitle: React.CSSProperties = {
  fontSize: 14, fontWeight: 700, color: C.textPrimary,
  marginBottom: 16, letterSpacing: '-0.01em',
};

const saveBtn = (saving: boolean, success?: boolean): React.CSSProperties => ({
  background: success ? '#2D8B4E' : C.teal, color: C.white, border: 'none',
  borderRadius: 10, padding: '9px 20px', fontSize: 13, fontWeight: 700,
  display: 'inline-flex', alignItems: 'center', gap: 6,
  cursor: saving ? 'wait' : 'pointer', fontFamily: body,
  opacity: saving ? 0.7 : 1, transition: 'background 200ms',
});

// ─── Profil Pane ─────────────────────────────────────────────────────────────

export function ProfilPane({ clinic, onSaved }: { clinic: Clinic | null; onSaved: () => Promise<void> }) {
  const [form, setForm] = useState({
    name: clinic?.name ?? '',
    doctorName: clinic?.doctorName ?? '',
    doctorGender: (clinic?.doctorGender as 'M' | 'F' | '') ?? '',
    phone: (clinic as any)?.phone ?? '',
    address: (clinic as any)?.address ?? '',
  });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' });
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    try {
      await api.updateClinic({
        name: form.name,
        doctorName: form.doctorName || undefined,
        doctorGender: (form.doctorGender as 'M' | 'F') || undefined,
        phone: form.phone || undefined,
        address: form.address || undefined,
      });
      await onSaved();
      setMsg({ type: 'success', text: 'Modifications enregistrées' });
    } catch {
      setMsg({ type: 'error', text: "Erreur lors de l'enregistrement" });
    } finally {
      setSaving(false);
    }
  };

  const handlePwChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pwForm.next !== pwForm.confirm) {
      setPwMsg({ type: 'error', text: 'Les mots de passe ne correspondent pas' });
      return;
    }
    setPwSaving(true);
    setPwMsg(null);
    try {
      await api.changePassword(pwForm.current, pwForm.next);
      setPwMsg({ type: 'success', text: 'Mot de passe modifié avec succès' });
      setPwForm({ current: '', next: '', confirm: '' });
    } catch {
      setPwMsg({ type: 'error', text: 'Mot de passe actuel incorrect' });
    } finally {
      setPwSaving(false);
    }
  };

  const genderBtn = (g: 'M' | 'F', label: string) => (
    <button
      key={g}
      type="button"
      onClick={() => setForm({ ...form, doctorGender: g })}
      style={{
        padding: '9px 14px', fontSize: 13, fontWeight: form.doctorGender === g ? 700 : 400,
        background: form.doctorGender === g ? C.teal : C.white,
        color: form.doctorGender === g ? C.white : C.textSecondary,
        border: `1px solid ${form.doctorGender === g ? C.teal : C.borderLight}`,
        borderRadius: 8, cursor: 'pointer', fontFamily: body, transition: 'all 120ms', flexShrink: 0,
      }}
    >
      {label}
    </button>
  );

  return (
    <div style={{ padding: '20px 24px' }}>

      {/* Clinic info form */}
      <form onSubmit={handleSave}>
        <div style={card}>
          <div style={cardTitle}>Informations du cabinet</div>
          <div style={{ display: 'grid', gap: 14 }}>
            <div>
              <label style={fieldLabel}>Nom du cabinet</label>
              <input style={inp} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label style={fieldLabel}>Médecin</label>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                {genderBtn('M', 'Dr.')}
                {genderBtn('F', 'Dre.')}
                <input
                  style={{ ...inp, flex: 1 }}
                  placeholder="Nom du médecin"
                  value={form.doctorName}
                  onChange={e => setForm({ ...form, doctorName: e.target.value })}
                />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
              <div>
                <label style={fieldLabel}>Téléphone</label>
                <input style={inp} type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div>
                <label style={fieldLabel}>Adresse</label>
                <input style={inp} value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 16 }}>
            <button type="submit" disabled={saving} style={saveBtn(saving)}>
              {saving ? 'Enregistrement…' : 'Enregistrer'}
            </button>
            {msg && (
              <span style={{ fontSize: 12, color: msg.type === 'success' ? '#2D8B4E' : C.red600 }}>
                {msg.text}
              </span>
            )}
          </div>
        </div>
      </form>

      {/* Password form */}
      <form onSubmit={handlePwChange}>
        <div style={card}>
          <div style={cardTitle}>Sécurité</div>
          <div style={{ display: 'grid', gap: 12 }}>
            <div>
              <label style={fieldLabel}>Mot de passe actuel</label>
              <input
                style={inp} type="password"
                value={pwForm.current}
                onChange={e => setPwForm({ ...pwForm, current: e.target.value })}
                required
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
              <div>
                <label style={fieldLabel}>Nouveau mot de passe</label>
                <input
                  style={inp} type="password"
                  value={pwForm.next}
                  onChange={e => setPwForm({ ...pwForm, next: e.target.value })}
                  required minLength={8}
                />
              </div>
              <div>
                <label style={fieldLabel}>Confirmer</label>
                <input
                  style={inp} type="password"
                  value={pwForm.confirm}
                  onChange={e => setPwForm({ ...pwForm, confirm: e.target.value })}
                  required minLength={8}
                />
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 16 }}>
            <button
              type="submit"
              disabled={pwSaving}
              style={{
                ...saveBtn(pwSaving),
                background: C.surface2, color: C.textPrimary,
                border: `1px solid ${C.borderLight}`,
              }}
            >
              {pwSaving ? 'Modification…' : 'Changer le mot de passe'}
            </button>
            {pwMsg && (
              <span style={{ fontSize: 12, color: pwMsg.type === 'success' ? '#2D8B4E' : C.red600 }}>
                {pwMsg.text}
              </span>
            )}
          </div>
        </div>
      </form>

    </div>
  );
}

// ─── Accès Pane ───────────────────────────────────────────────────────────────

function AccesPane({ clinic }: { clinic: Clinic | null }) {
  const doctorName = clinic?.doctorName ?? clinic?.name ?? '—';
  const initials = doctorName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div style={{ padding: '20px 24px' }}>
      <div style={card}>
        <div style={cardTitle}>Médecin principal</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 48, height: 48, borderRadius: '50%', flexShrink: 0,
            background: `linear-gradient(135deg, ${C.teal} 0%, ${C.green800} 100%)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 800, fontSize: 16, color: C.white,
          }}>
            {initials}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.textPrimary }}>{doctorName}</div>
            <div style={{ fontSize: 12, color: C.textMuted }}>Médecin principal</div>
          </div>
          <span style={{
            background: C.tealLight, color: C.teal,
            borderRadius: 999, padding: '3px 10px', fontSize: 11, fontWeight: 700, flexShrink: 0,
          }}>
            Actif
          </span>
        </div>
      </div>

      {/* Multi-doctor coming soon */}
      <div style={{
        border: `1.5px dashed ${C.borderLight}`, borderRadius: 16,
        padding: '28px 22px', textAlign: 'center',
      }}>
        <span className="material-symbols-rounded" style={{ fontSize: 36, color: C.textMuted, display: 'block', marginBottom: 10 }}>
          group_add
        </span>
        <div style={{ fontSize: 14, fontWeight: 700, color: C.textSecondary, marginBottom: 6 }}>
          Gestion multi-médecins
        </div>
        <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 14, maxWidth: 280, margin: '0 auto 14px' }}>
          Ajoutez plusieurs médecins à votre cabinet et gérez chaque file indépendamment
        </div>
        <span style={{
          display: 'inline-block',
          background: C.amber100, color: C.amber600,
          borderRadius: 999, padding: '4px 14px', fontSize: 11, fontWeight: 700,
        }}>
          Bientôt disponible
        </span>
      </div>
    </div>
  );
}

// ─── Abonnement Pane ──────────────────────────────────────────────────────────

type SubInfo = {
  status: string;
  plan: string | null;
  daysRemaining: number | null;
  canUseApp: boolean;
  trialEndsAt: string | null;
  subscriptionEndsAt: string | null;
};

export function AbonnementPane() {
  const navigate = useNavigate();
  const [sub, setSub] = useState<SubInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getSubscription()
      .then(setSub)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ padding: '60px 24px', textAlign: 'center', color: C.textMuted, fontSize: 13 }}>
        Chargement…
      </div>
    );
  }

  const isTrial = sub?.status === 'TRIAL';
  const isActive = sub?.status === 'ACTIVE';
  const isExpired = sub?.status === 'EXPIRED';
  const needsUpgrade = isTrial || isExpired;

  return (
    <div style={{ padding: '20px 24px' }}>

      {/* Status card */}
      <div style={{
        background: `linear-gradient(135deg, ${C.green800} 0%, ${C.teal} 100%)`,
        borderRadius: 16, padding: '20px 22px', marginBottom: 14,
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.55)', marginBottom: 4 }}>
              Plan actuel
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: C.white, letterSpacing: '-0.03em', marginBottom: 4 }}>
              {isTrial ? 'Essai gratuit' : isActive ? (sub?.plan === 'YEARLY' ? 'Annuel' : 'Mensuel') : 'Expiré'}
            </div>
            {(sub?.daysRemaining !== null && sub?.daysRemaining !== undefined) && (
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)' }}>
                {sub.daysRemaining > 0 ? `${sub.daysRemaining} jours restants` : 'Abonnement expiré'}
              </div>
            )}
          </div>
          <span style={{
            background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: 999, padding: '4px 12px', fontSize: 11, fontWeight: 700,
            letterSpacing: '0.08em', color: C.white, flexShrink: 0,
          }}>
            {sub?.status ?? '—'}
          </span>
        </div>

        {isTrial && (
          <div style={{ marginTop: 14 }}>
            <div style={{ height: 4, background: 'rgba(255,255,255,0.2)', borderRadius: 999 }}>
              <div style={{
                height: '100%', borderRadius: 999, background: C.white,
                width: `${Math.max(3, 100 - ((sub?.daysRemaining ?? 0) / 30) * 100)}%`,
                transition: 'width 600ms',
              }} />
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 6 }}>
              {sub?.trialEndsAt ? `Essai jusqu'au ${new Date(sub.trialEndsAt).toLocaleDateString('fr-TN')}` : ''}
            </div>
          </div>
        )}
      </div>

      {/* Upgrade section */}
      {needsUpgrade && (
        <div style={card}>
          <div style={{ ...cardTitle, marginBottom: 12 }}>
            {isExpired ? 'Renouveler votre abonnement' : 'Passer à un plan payant'}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10, marginBottom: 16 }}>
            {[
              { label: 'Mensuel', price: '50', period: '/mois', plan: 'MONTHLY' },
              { label: 'Annuel', price: '500', period: '/an', plan: 'YEARLY', tag: '−100 TND' },
            ].map(opt => (
              <div
                key={opt.plan}
                style={{
                  border: `2px solid ${opt.plan === 'YEARLY' ? C.teal : C.borderLight}`,
                  borderRadius: 12, padding: '14px 16px',
                  background: opt.plan === 'YEARLY' ? C.tealLight : C.white,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: opt.plan === 'YEARLY' ? C.teal : C.textSecondary }}>
                    {opt.label}
                  </span>
                  {opt.tag && (
                    <span style={{ fontSize: 10, background: C.teal, color: C.white, borderRadius: 999, padding: '1px 7px', fontWeight: 700 }}>
                      {opt.tag}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 22, fontWeight: 800, color: C.textPrimary, letterSpacing: '-0.03em' }}>
                  {opt.price}
                  <span style={{ fontSize: 12, fontWeight: 500, color: C.textMuted }}> TND{opt.period}</span>
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={() => navigate('/subscription')}
            style={{
              width: '100%', background: C.teal, color: C.white, border: 'none',
              borderRadius: 10, padding: '11px 20px', fontSize: 14, fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              cursor: 'pointer', fontFamily: body,
            }}
          >
            <span className="material-symbols-rounded" style={{ fontSize: 18 }}>upgrade</span>
            {isExpired ? 'Renouveler maintenant' : 'Passer à un plan payant'}
          </button>
        </div>
      )}

      {/* Active sub details */}
      {isActive && (
        <div style={card}>
          <div style={{ ...cardTitle, marginBottom: 12 }}>Détails de l'abonnement</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
              <span style={{ color: C.textMuted }}>Plan</span>
              <span style={{ fontWeight: 600, color: C.textPrimary }}>
                {sub?.plan === 'YEARLY' ? 'Annuel' : 'Mensuel'}
              </span>
            </div>
            <div style={{ height: 1, background: C.borderLight }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
              <span style={{ color: C.textMuted }}>Renouvellement</span>
              <span style={{ fontWeight: 600, color: C.textPrimary }}>
                {sub?.subscriptionEndsAt
                  ? new Date(sub.subscriptionEndsAt).toLocaleDateString('fr-TN')
                  : '—'}
              </span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// ─── Durée Pane ───────────────────────────────────────────────────────────────

export function DureePane({ clinic, onSaved }: { clinic: Clinic | null; onSaved: () => Promise<void> }) {
  const [mins, setMins] = useState(clinic?.avgConsultationMins ?? 10);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const MIN = 3;
  const MAX = 60;

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.updateClinic({ avgConsultationMins: mins });
      await onSaved();
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      // silently fail
    } finally {
      setSaving(false);
    }
  };

  // SVG ring
  const r = 44, cx = 50, cy = 50;
  const circumference = 2 * Math.PI * r;
  const fraction = Math.min(1, Math.max(0, (mins - MIN) / (MAX - MIN)));
  const dashOffset = circumference * (1 - fraction);

  return (
    <div style={{ padding: '20px 24px' }}>
      <div style={card}>
        <div style={cardTitle}>Durée de consultation</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>

          {/* SVG ring */}
          <div style={{ position: 'relative', width: 100, height: 100, flexShrink: 0 }}>
            <svg viewBox="0 0 100 100" width="100" height="100">
              <circle cx={cx} cy={cy} r={r} fill="none" stroke={C.borderLight} strokeWidth="8" />
              <circle
                cx={cx} cy={cy} r={r}
                fill="none" stroke={C.teal} strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
                transform="rotate(-90 50 50)"
                style={{ transition: 'stroke-dashoffset 150ms' }}
              />
            </svg>
            <div style={{
              position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
            }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: C.textPrimary, letterSpacing: '-0.04em', lineHeight: 1 }}>{mins}</div>
              <div style={{ fontSize: 10, color: C.textMuted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>min</div>
            </div>
          </div>

          {/* Controls */}
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 14 }}>
              <button
                onClick={() => setMins(m => Math.max(MIN, m - 1))}
                disabled={mins <= MIN}
                style={{
                  width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                  background: C.surface2, border: `1px solid ${C.borderLight}`,
                  fontSize: 20, fontWeight: 700, color: C.textPrimary,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: mins <= MIN ? 'not-allowed' : 'pointer',
                  opacity: mins <= MIN ? 0.35 : 1, padding: 0,
                }}
              >
                −
              </button>
              <div style={{ fontWeight: 800, fontSize: 28, color: C.textPrimary, letterSpacing: '-0.04em', textAlign: 'center', minWidth: 80 }}>
                {mins} <span style={{ fontSize: 14, color: C.textMuted, fontWeight: 500 }}>min</span>
              </div>
              <button
                onClick={() => setMins(m => Math.min(MAX, m + 1))}
                disabled={mins >= MAX}
                style={{
                  width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                  background: C.surface2, border: `1px solid ${C.borderLight}`,
                  fontSize: 20, fontWeight: 700, color: C.textPrimary,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: mins >= MAX ? 'not-allowed' : 'pointer',
                  opacity: mins >= MAX ? 0.35 : 1, padding: 0,
                }}
              >
                +
              </button>
            </div>
            <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 16, lineHeight: 1.5 }}>
              Durée estimée par consultation. Impacte les temps d'attente affichés aux patients.
            </div>
            <button
              onClick={handleSave}
              disabled={saving || saved}
              style={saveBtn(saving, saved)}
            >
              {saved ? (
                <><span className="material-symbols-rounded" style={{ fontSize: 16 }}>check</span>Enregistré</>
              ) : saving ? 'Enregistrement…' : 'Enregistrer'}
            </button>
          </div>
        </div>
      </div>

      {/* Impact table */}
      <div style={{ ...card, marginBottom: 0 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>
          Impact sur l'attente
        </div>
        <div style={{ display: 'flex' }}>
          {[1, 2, 3, 5, 10].map((n, i, arr) => (
            <div
              key={n}
              style={{
                flex: 1, textAlign: 'center',
                borderRight: i < arr.length - 1 ? `1px solid ${C.borderLight}` : 'none',
                padding: '0 8px',
              }}
            >
              <div style={{ fontSize: 16, fontWeight: 800, color: C.textPrimary, letterSpacing: '-0.03em' }}>{n * mins}</div>
              <div style={{ fontSize: 10, color: C.textMuted, fontWeight: 600 }}>min</div>
              <div style={{ fontSize: 10, color: C.textMuted, marginTop: 4 }}>{n} pat.</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Langue Pane ──────────────────────────────────────────────────────────────

function LanguePane({ currentLang, onChange }: { currentLang: string; onChange: (lang: string) => void }) {
  const handleChange = async (lang: string) => {
    onChange(lang);
    try { await api.updateClinic({ language: lang as 'fr' | 'ar' }); } catch { /* silent */ }
  };

  const langs = [
    { code: 'fr', label: 'Français', native: 'Français', dir: 'LTR' },
    { code: 'ar', label: 'Arabe', native: 'العربية', dir: 'RTL' },
  ];

  return (
    <div style={{ padding: '20px 24px' }}>
      <div style={card}>
        <div style={cardTitle}>Langue de l'interface</div>
        <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 16, marginTop: -10 }}>
          Langue du tableau de bord et des notifications
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {langs.map(lang => {
            const active = currentLang === lang.code;
            return (
              <button
                key={lang.code}
                onClick={() => handleChange(lang.code)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14, width: '100%',
                  padding: '14px 18px', borderRadius: 12, cursor: 'pointer',
                  border: `2px solid ${active ? C.teal : C.borderLight}`,
                  background: active ? C.tealLight : C.white,
                  fontFamily: body, textAlign: 'left', transition: 'all 120ms',
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: C.textPrimary }}>{lang.native}</div>
                  <div style={{ fontSize: 12, color: C.textMuted }}>{lang.label} · {lang.dir}</div>
                </div>
                {active && (
                  <span
                    className="material-symbols-rounded"
                    style={{ fontSize: 20, color: C.teal, fontVariationSettings: "'FILL' 1", flexShrink: 0 }}
                  >
                    check_circle
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{
        background: C.amber100, border: `1px solid rgba(212,146,11,0.2)`,
        borderRadius: 12, padding: '12px 16px',
        display: 'flex', gap: 10, alignItems: 'flex-start',
      }}>
        <span className="material-symbols-rounded" style={{ fontSize: 18, color: C.amber600, marginTop: 1, flexShrink: 0 }}>info</span>
        <div style={{ fontSize: 12, color: C.amber600, lineHeight: 1.5 }}>
          La langue de la file d'attente patient est gérée séparément via la configuration de l'écran d'accueil.
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function DesktopSettingsDrawer({ isOpen, onClose, clinic, onClinicUpdated, initialPane }: DesktopSettingsDrawerProps) {
  const [activePane, setActivePane] = useState<SettingsPane>(initialPane ?? 'profil');

  // Sync activePane when initialPane changes (opening to a specific pane)
  useEffect(() => {
    if (initialPane && isOpen) setActivePane(initialPane);
  }, [initialPane, isOpen]);
  const { logout } = useAuthStore();
  const navigate = useNavigate();
  const { i18n } = useTranslation();

  const handleLogout = async () => {
    onClose();
    await logout();
    navigate('/login');
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'absolute', inset: 0, zIndex: 99,
          background: 'rgba(0,0,0,0.35)',
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? 'auto' : 'none',
          transition: 'opacity 250ms',
        }}
      />

      {/* Drawer panel */}
      <div style={{
        position: 'absolute', top: 0, right: 0, bottom: 0, zIndex: 100,
        width: 680, background: C.white,
        boxShadow: '-12px 0 48px rgba(0,0,0,0.18)',
        display: 'flex', flexDirection: 'column',
        transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 300ms cubic-bezier(0.32,0,0.15,1)',
        fontFamily: body,
      }}>

        {/* Header */}
        <div style={{
          padding: '0 20px', height: 52,
          background: C.green800,
          display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0,
        }}>
          <span className="material-symbols-rounded" style={{ fontSize: 18, color: 'rgba(255,255,255,0.45)' }}>
            settings
          </span>
          <span style={{ fontWeight: 700, fontSize: 15, color: C.white, letterSpacing: '-0.01em', flex: 1 }}>
            Paramètres
          </span>
          <button
            onClick={onClose}
            style={{
              width: 30, height: 30, borderRadius: 8, padding: 0,
              background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'rgba(255,255,255,0.6)', cursor: 'pointer',
            }}
          >
            <span className="material-symbols-rounded" style={{ fontSize: 16 }}>close</span>
          </button>
        </div>

        {/* Body: sidebar + content */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

          {/* Sidebar */}
          <nav style={{
            width: 192, background: C.green800, flexShrink: 0,
            display: 'flex', flexDirection: 'column',
            padding: '16px 0 12px',
          }}>
            {NAV_GROUPS.map(group => (
              <div key={group.label} style={{ marginBottom: 8 }}>
                <div style={{
                  padding: '0 16px 5px', fontSize: 9, fontWeight: 700,
                  letterSpacing: '0.12em', textTransform: 'uppercase',
                  color: 'rgba(255,255,255,0.28)',
                }}>
                  {group.label}
                </div>
                {group.items.map(item => {
                  const active = activePane === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActivePane(item.id)}
                      style={{
                        width: '100%', display: 'flex', alignItems: 'center', gap: 9,
                        padding: '8px 16px 8px 13px',
                        background: active ? 'rgba(255,255,255,0.11)' : 'transparent',
                        border: 'none', borderLeft: `3px solid ${active ? C.teal : 'transparent'}`,
                        color: active ? C.white : 'rgba(255,255,255,0.5)',
                        fontSize: 13, fontWeight: active ? 600 : 400,
                        cursor: 'pointer', textAlign: 'left', fontFamily: body,
                        transition: 'all 100ms',
                      }}
                    >
                      <span className="material-symbols-rounded" style={{ fontSize: 17, flexShrink: 0 }}>
                        {item.icon}
                      </span>
                      {item.label}
                    </button>
                  );
                })}
              </div>
            ))}

            {/* Push logout to bottom */}
            <div style={{ flex: 1 }} />
            <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', margin: '0 16px 8px' }} />
            <button
              onClick={handleLogout}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 9,
                padding: '8px 16px 8px 13px',
                background: 'transparent', border: 'none', borderLeft: '3px solid transparent',
                color: '#F4706A', fontSize: 13, fontWeight: 500,
                cursor: 'pointer', textAlign: 'left', fontFamily: body,
              }}
            >
              <span className="material-symbols-rounded" style={{ fontSize: 17, flexShrink: 0 }}>logout</span>
              Déconnexion
            </button>
          </nav>

          {/* Content pane */}
          <div style={{ flex: 1, overflowY: 'auto', background: C.creamBg }}>
            {activePane === 'profil' && (
              <ProfilPane clinic={clinic} onSaved={onClinicUpdated} />
            )}
            {activePane === 'acces' && (
              <AccesPane clinic={clinic} />
            )}
            {activePane === 'abonnement' && (
              <AbonnementPane />
            )}
            {activePane === 'duree' && (
              <DureePane clinic={clinic} onSaved={onClinicUpdated} />
            )}
            {activePane === 'langue' && (
              <LanguePane currentLang={i18n.language} onChange={lang => i18n.changeLanguage(lang)} />
            )}
          </div>

        </div>
      </div>
    </>
  );
}
