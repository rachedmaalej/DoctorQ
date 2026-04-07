import { useState, useEffect, useCallback } from 'react';
import '@/components/receptionist/receptionist.css';

interface BSHelpSupportPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const SUPPORT_EMAIL = 'support@ausuivant.fr';
const FAQ_URL = 'https://ausuivant.fr/aide';
const TUTORIALS_URL = 'https://ausuivant.fr/tutoriels';

export default function BSHelpSupportPanel({ isOpen, onClose }: BSHelpSupportPanelProps) {
  // Bug report form
  const [reportSubject, setReportSubject] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [sending, setSending] = useState(false);
  const [reportStatus, setReportStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Reset form on open
  useEffect(() => {
    if (isOpen) {
      setReportSubject('');
      setReportDescription('');
      setReportStatus('idle');
    }
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape' && isOpen) onClose(); };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [isOpen, onClose]);

  const handleSendReport = useCallback(async () => {
    if (!reportSubject.trim() || !reportDescription.trim()) return;
    setSending(true);
    setReportStatus('idle');
    try {
      // Send bug report via mailto as a quick Phase 9 implementation
      // Phase 2 upgrade: POST /api/clinic/support/bug-report with rate limiting
      const subject = encodeURIComponent(`[Bug Report] ${reportSubject}`);
      const body = encodeURIComponent(`Description:\n${reportDescription}\n\n---\nEnvoyé depuis l'application AuSuivant`);
      window.open(`mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`, '_self');
      setReportStatus('success');
      setReportSubject('');
      setReportDescription('');
    } catch {
      setReportStatus('error');
    } finally {
      setSending(false);
    }
  }, [reportSubject, reportDescription]);

  return (
    <>
      {isOpen && <div className="bs-panel-backdrop" onClick={onClose} />}

      <div className={`bs-right-panel ${isOpen ? 'open' : ''}`} style={{ zIndex: 220, maxWidth: 430, width: '100%' }}>
        {/* Header */}
        <div className="bs-panel-header">
          <button onClick={onClose} className="bs-panel-back">
            <span className="material-symbols-rounded" style={{ fontSize: 22 }}>arrow_back</span>
          </button>
          <span className="bs-panel-title">Aide & support</span>
        </div>

        <div className="bs-panel-body">
          {/* Quick links */}
          <div className="bs-settings-label">Ressources</div>
          <div className="bs-settings-group" style={{ marginBottom: 20 }}>
            {/* Contact support */}
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
            >
              <LinkRow
                icon="mail"
                iconBg="#E8F5F1"
                iconColor="#0F7B6C"
                title="Contacter le support"
                description={SUPPORT_EMAIL}
              />
            </a>

            {/* FAQ / Help center */}
            <a
              href={FAQ_URL}
              target="_blank"
              rel="noopener noreferrer"
              style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
            >
              <LinkRow
                icon="help_center"
                iconBg="#EDF3FC"
                iconColor="#3B7DD9"
                title="Centre d'aide"
                description="FAQ et guides d'utilisation"
              />
            </a>

            {/* Tutorials */}
            <a
              href={TUTORIALS_URL}
              target="_blank"
              rel="noopener noreferrer"
              style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
            >
              <LinkRow
                icon="play_circle"
                iconBg="#FEF7E6"
                iconColor="#D4920B"
                title="Tutoriels vidéo"
                description="Apprenez à utiliser AuSuivant"
                isLast
              />
            </a>
          </div>

          {/* Bug report form */}
          <div className="bs-settings-label">Signaler un problème</div>
          <div style={{
            background: '#FFF', border: '1px solid #E8E6DF', borderRadius: 12,
            padding: 16, marginBottom: 20,
          }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#6B6960', marginBottom: 6 }}>
              Objet
            </label>
            <input
              type="text"
              value={reportSubject}
              onChange={e => setReportSubject(e.target.value)}
              placeholder="Ex: Bug lors de l'ajout d'un patient"
              maxLength={100}
              className="bs-profile-input"
              style={{ marginBottom: 12 }}
            />

            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#6B6960', marginBottom: 6 }}>
              Description du problème
            </label>
            <textarea
              value={reportDescription}
              onChange={e => setReportDescription(e.target.value)}
              placeholder="Décrivez le problème en détail..."
              maxLength={2000}
              rows={5}
              style={{
                width: '100%', background: '#F6F5F0',
                border: '1.5px solid #E8E6DF', borderRadius: 8,
                padding: '10px 12px', fontFamily: 'inherit', fontSize: 13,
                color: '#1A1A1A', resize: 'vertical', outline: 'none',
                boxSizing: 'border-box',
              }}
              onFocus={e => { e.currentTarget.style.borderColor = '#0F7B6C'; }}
              onBlur={e => { e.currentTarget.style.borderColor = '#E8E6DF'; }}
            />

            <button
              onClick={handleSendReport}
              disabled={!reportSubject.trim() || !reportDescription.trim() || sending}
              style={{
                width: '100%', height: 40, borderRadius: 8, border: 'none',
                background: reportSubject.trim() && reportDescription.trim() && !sending ? '#0F7B6C' : '#E8E6DF',
                color: reportSubject.trim() && reportDescription.trim() && !sending ? 'white' : '#9E9B90',
                fontFamily: 'inherit', fontSize: 13, fontWeight: 600,
                cursor: reportSubject.trim() && reportDescription.trim() && !sending ? 'pointer' : 'not-allowed',
                marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              }}
            >
              <span className="material-symbols-rounded" style={{ fontSize: 16 }}>send</span>
              Envoyer
            </button>

            {reportStatus === 'success' && (
              <div style={{
                marginTop: 10, padding: '8px 12px', borderRadius: 8,
                background: '#EDF7F0', color: '#2D8B4E',
                fontSize: 12, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6,
              }}>
                <span className="material-symbols-rounded" style={{ fontSize: 14 }}>check_circle</span>
                Merci ! Nous reviendrons vers vous rapidement.
              </div>
            )}
          </div>

          {/* App version */}
          <div style={{
            textAlign: 'center', padding: '12px 0', fontSize: 12, color: '#9E9B90',
          }}>
            AuSuivant v1.0.0
          </div>
        </div>
      </div>
    </>
  );
}

function LinkRow({
  icon,
  iconBg,
  iconColor,
  title,
  description,
  isLast = false,
}: {
  icon: string;
  iconBg: string;
  iconColor: string;
  title: string;
  description: string;
  isLast?: boolean;
}) {
  return (
    <div
      style={{
        display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px',
        borderBottom: isLast ? 'none' : '1px solid rgba(228,226,221,0.5)',
        cursor: 'pointer',
      }}
    >
      <div style={{
        width: 36, height: 36, borderRadius: 10,
        background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <span className="material-symbols-rounded" style={{ fontSize: 20, color: iconColor }}>
          {icon}
        </span>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 500, color: '#1A1A1A' }}>{title}</div>
        <div style={{ fontSize: 12, color: '#9E9B90', marginTop: 1 }}>{description}</div>
      </div>
      <span className="material-symbols-rounded" style={{ fontSize: 16, color: '#D4D2CC' }}>
        open_in_new
      </span>
    </div>
  );
}
