import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import type { QueueEntry, QueueStats as QueueStatsType, Clinic } from '@/types';
import { QueueStatus } from '@/types';
import { api } from '@/lib/api';
import { formatTime, getWaitingMinutes } from '@/lib/time';
import { useQueueStore } from '@/stores/queueStore';
import { useAuthStore } from '@/stores/authStore';
import { useQueueFilter } from '@/hooks/useQueueFilter';
import { useToast } from '@/hooks/useToast';
import QueueTableHeader from '@/components/desktop/QueueTableHeader';
import QueueTableRowNew from '@/components/desktop/QueueTableRow';
import PatientContextMenu from '@/components/desktop/PatientContextMenu';
import CallNextBar from '@/components/desktop/CallNextBar';
import DesktopTopBar from '@/components/DesktopTopBar';
import DesktopSettingsDrawer, { type SettingsPane } from './DesktopSettingsDrawer';
import './desktop-dashboard.css';

// ─── Props ───────────────────────────────────────────────────────────────────

interface DesktopDashboardProps {
  clinic: Clinic | null;
  queue: QueueEntry[];
  stats: QueueStatsType | null;
  waitingCount: number;
  isDoctorPresent: boolean;
  isCallingNext: boolean;
  isTogglingPresence: boolean;
  exitingPatientId: string | null;
  announcement: string | null;
  subscriptionExpired: boolean;
  onCallNext: () => void;
  onRemovePatient: (id: string) => void;
  onReorderPatient: (id: string, newPosition: number) => void;
  onEmergency: (id: string) => void;
  onCompleteConsultation: () => void;
  onToggleDoctorPresent: () => void;
  onOpenAddModal: () => void;
  onOpenAnnouncementModal: () => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

// ─── ConsultationTimer ───────────────────────────────────────────────────────

function ConsultationTimer({ startedAt }: { startedAt: string }) {
  const [minutes, setMinutes] = useState(() =>
    Math.max(0, Math.floor((Date.now() - new Date(startedAt).getTime()) / 60000))
  );

  useEffect(() => {
    const id = setInterval(() => {
      setMinutes(Math.max(0, Math.floor((Date.now() - new Date(startedAt).getTime()) / 60000)));
    }, 10000);
    return () => clearInterval(id);
  }, [startedAt]);

  return (
    <div className="db-timer-row">
      <span className="db-tv" aria-live="polite" aria-atomic="true">{minutes}</span>
      <span className="db-tu">min</span>
    </div>
  );
}


// ─── AddPatientSection ───────────────────────────────────────────────────────

type VisitType = 'walk-in' | 'rdv';

function AddPatientSection() {
  const { t } = useTranslation();
  const { addPatient } = useQueueStore();
  const phoneRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState('');
  const [expanded, setExpanded] = useState(false);
  const [phone, setPhone] = useState('');
  const [visitType, setVisitType] = useState<VisitType>('walk-in');
  const [rdvHour, setRdvHour] = useState('');
  const [rdvMinute, setRdvMinute] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const rdvHours = Array.from({ length: 13 }, (_, i) => (i + 7).toString().padStart(2, '0'));
  const rdvMinutes = ['00', '15', '30', '45'];

  const resetForm = () => {
    setName('');
    setPhone('');
    setVisitType('walk-in');
    setRdvHour('');
    setRdvMinute('');
    setExpanded(false);
  };

  const handleNameSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!name.trim()) return;
    setExpanded(true);
    setTimeout(() => phoneRef.current?.focus(), 80);
  };

  const handleFullSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!name.trim() || isSubmitting) return;

    const phoneDigits = phone.replace(/\D/g, '');
    const appointmentTime =
      visitType === 'rdv' && rdvHour && rdvMinute ? `${rdvHour}:${rdvMinute}` : undefined;

    setIsSubmitting(true);
    try {
      await addPatient({
        patientName: name.trim(),
        patientPhone: phoneDigits,
        appointmentTime,
      });
      resetForm();
    } catch {
      // Error handled by store
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => resetForm();

  // Format phone with spaces: XX XXX XXX
  const handlePhoneChange = (raw: string) => {
    const digits = raw.replace(/\D/g, '').slice(0, 8);
    if (digits.length <= 2) setPhone(digits);
    else if (digits.length <= 5) setPhone(`${digits.slice(0, 2)} ${digits.slice(2)}`);
    else setPhone(`${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5)}`);
  };

  if (!expanded) {
    return (
      <div className="db-section">
        <div className="db-section-label">{t('dashboard.addPatient.label')}</div>
        <form onSubmit={handleNameSubmit}>
          <div className="db-add-input-wrap">
            <input
              className="db-add-input"
              type="text"
              placeholder={t('dashboard.addPatient.placeholder')}
              value={name}
              onChange={(e) => setName(e.target.value)}
              aria-label={t('dashboard.addPatient.placeholder')}
            />
            <button
              type="submit"
              className="db-add-btn"
              disabled={!name.trim()}
              aria-label={t('dashboard.addPatient.addButton')}
            >
              +
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="db-section db-add-expanded">
      <div className="db-section-label">{t('dashboard.addPatient.label')}</div>
      <form onSubmit={handleFullSubmit} className="db-add-form">
        {/* Name (pre-filled, editable) */}
        <input
          className="db-add-field"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t('dashboard.addPatient.placeholder')}
        />

        {/* Phone */}
        <input
          ref={phoneRef}
          className="db-add-field"
          type="tel"
          inputMode="numeric"
          value={phone}
          onChange={(e) => handlePhoneChange(e.target.value)}
          placeholder={t('dashboard.addPatient.phonePlaceholder')}
        />
        {phone.length > 0 && phone.replace(/\D/g, '').length < 8 && (
          <span className="db-add-hint">{t('dashboard.addPatient.phoneHint')}</span>
        )}

        {/* Visit type toggle */}
        <div className="db-add-visit-toggle">
          <button
            type="button"
            className={`db-add-visit-opt ${visitType === 'walk-in' ? 'db-add-visit-active' : ''}`}
            onClick={() => setVisitType('walk-in')}
          >
            {t('dashboard.addPatient.walkIn')}
          </button>
          <button
            type="button"
            className={`db-add-visit-opt ${visitType === 'rdv' ? 'db-add-visit-active' : ''}`}
            onClick={() => setVisitType('rdv')}
          >
            {t('dashboard.addPatient.withRdv')}
          </button>
        </div>

        {/* RDV time selectors */}
        {visitType === 'rdv' && (
          <div className="db-add-rdv-row">
            <span className="db-add-rdv-label">{t('dashboard.addPatient.rdvTime')}</span>
            <select
              className="db-add-select"
              value={rdvHour}
              onChange={(e) => setRdvHour(e.target.value)}
            >
              <option value="">--</option>
              {rdvHours.map(h => <option key={h} value={h}>{h}</option>)}
            </select>
            <span className="db-add-rdv-sep">:</span>
            <select
              className="db-add-select"
              value={rdvMinute}
              onChange={(e) => setRdvMinute(e.target.value)}
            >
              <option value="">--</option>
              {rdvMinutes.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
        )}

        {/* Actions */}
        <div className="db-add-actions">
          <button
            type="button"
            className="db-add-cancel"
            onClick={handleCancel}
          >
            {t('dashboard.addPatient.cancel')}
          </button>
          <button
            type="submit"
            className="db-add-submit"
            disabled={!name.trim() || isSubmitting}
          >
            {isSubmitting
              ? t('dashboard.addPatient.submitting')
              : t('dashboard.addPatient.submit')}
          </button>
        </div>
      </form>
    </div>
  );
}

// ─── ConsultationCard ────────────────────────────────────────────────────────

function ConsultationCard({
  currentPatient,
  onEnd,
}: {
  currentPatient: QueueEntry | null;
  onEnd: () => void;
}) {
  const { t } = useTranslation();

  if (!currentPatient) {
    return (
      <div className="db-section">
        <div className="db-section-label">{t('dashboard.consultation.label')}</div>
        <div className="db-no-consult">{t('dashboard.consultation.noConsultation')}</div>
      </div>
    );
  }

  const arrivalTime = formatTime(currentPatient.arrivedAt);
  const consultStarted = currentPatient.calledAt || currentPatient.arrivedAt;

  return (
    <div className="db-section">
      <div className="db-section-label">{t('dashboard.consultation.label')}</div>
      <div className="db-consult-card">
        <div className="db-consult-tag">
          <span className="db-consult-pulse" />
          {t('dashboard.consultation.currentPatient')}
        </div>

        <div className="db-consult-body">
          <div>
            <div className="db-consult-name">{currentPatient.patientName || '—'}</div>
            <div className="db-consult-meta">
              {t('dashboard.consultation.arrivedAt', { time: arrivalTime })}
            </div>
          </div>
          <ConsultationTimer startedAt={consultStarted} />
        </div>

        <div className="db-consult-actions">
          <button className="db-consult-end-btn" onClick={onEnd}>
            {t('dashboard.consultation.endButton')}
          </button>
          <button
            className="db-consult-phone-btn"
            disabled={!currentPatient.patientPhone}
            onClick={() => currentPatient.patientPhone && window.open(`tel:${currentPatient.patientPhone}`)}
            aria-label={t('dashboard.consultation.callButton')}
          >
            <span className="material-symbols-rounded" style={{ fontSize: 18 }}>call</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── CallNextButton ──────────────────────────────────────────────────────────

function CallNextButton({
  nextPatient,
  waitingCount,
  isCallingNext,
  onCallNext,
}: {
  nextPatient: QueueEntry | null;
  waitingCount: number;
  isCallingNext: boolean;
  onCallNext: () => void;
}) {
  const { t } = useTranslation();
  const [calledState, setCalledState] = useState<string | null>(null);

  const handleClick = () => {
    if (!nextPatient || isCallingNext) return;
    onCallNext();
    const firstName = (nextPatient.patientName || '').split(' ')[0];
    setCalledState(firstName);
    setTimeout(() => setCalledState(null), 2200);
  };

  const disabled = waitingCount === 0 || isCallingNext;

  return (
    <div className="db-call-next-wrap">
      <button
        className={`db-call-next-btn ${calledState ? 'db-call-confirmed' : ''}`}
        disabled={disabled}
        onClick={handleClick}
      >
        {calledState ? (
          <>&#10003; {t('dashboard.callNext.confirmed', { name: calledState })}</>
        ) : (
          <>
            <span className="material-symbols-rounded" style={{ fontSize: 16 }}>arrow_forward</span>
            {t('dashboard.callNext.button')}
          </>
        )}
      </button>
      {nextPatient && !calledState && (
        <div className="db-call-next-sub">
          {t('dashboard.callNext.next')} :{' '}
          <strong>{nextPatient.patientName || '—'}</strong>
          {' · '}{t('dashboard.callNext.pos')} {nextPatient.position}
          {' · '}{getWaitingMinutes(nextPatient.arrivedAt)} min
        </div>
      )}
    </div>
  );
}

// ─── QrShareSection ──────────────────────────────────────────────────────────

function QrShareSection({ clinicQrUrl, qrFullUrl }: { clinicQrUrl: string; qrFullUrl: string }) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(qrFullUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* clipboard unavailable */ }
  };

  const waLink = `https://wa.me/?text=${encodeURIComponent(
    t('dashboard.qr.waMessage', { url: qrFullUrl })
  )}`;

  return (
    <div className="db-section">
      <div className="db-section-label">{t('dashboard.qr.label')}</div>
      <div className="db-qr-buttons">
        {/* Copy */}
        <button
          className={`db-qr-btn ${copied ? 'db-qr-btn-copied' : ''}`}
          onClick={handleCopy}
          aria-label={t('dashboard.qr.copy')}
        >
          <span className="material-symbols-rounded db-qr-icon" style={{ color: 'var(--db-accent)' }}>
            content_copy
          </span>
          <span className="db-qr-btn-label">{copied ? t('dashboard.qr.copied') : t('dashboard.qr.copy')}</span>
        </button>

        {/* WhatsApp */}
        <a
          className="db-qr-btn"
          href={waLink}
          target="_blank"
          rel="noopener noreferrer"
          role="button"
          aria-label={t('dashboard.qr.whatsapp')}
        >
          <svg className="db-qr-icon" width="18" height="18" viewBox="0 0 24 24" fill="#1A7A3C">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
          <span className="db-qr-btn-label">{t('dashboard.qr.whatsapp')}</span>
        </a>

        {/* Display QR */}
        <button
          className="db-qr-btn"
          onClick={() => setQrModalOpen(true)}
          aria-label={t('dashboard.qr.display')}
        >
          <span className="material-symbols-rounded db-qr-icon" style={{ color: 'var(--db-accent)' }}>
            qr_code_2
          </span>
          <span className="db-qr-btn-label">{t('dashboard.qr.display')}</span>
        </button>
      </div>

      {qrModalOpen && (
        <QrModal
          clinicQrUrl={clinicQrUrl}
          qrFullUrl={qrFullUrl}
          onClose={() => setQrModalOpen(false)}
        />
      )}
    </div>
  );
}

// ─── QrModal ─────────────────────────────────────────────────────────────────

function QrModal({
  clinicQrUrl,
  qrFullUrl,
  onClose,
}: {
  clinicQrUrl: string;
  qrFullUrl: string;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const qrRef = useRef<HTMLDivElement>(null);

  const handleDownload = () => {
    const svg = qrRef.current?.querySelector('svg');
    if (!svg) return;

    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 400;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const img = new Image();
    img.onload = () => {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 400, 400);
      ctx.drawImage(img, 0, 0, 400, 400);
      const a = document.createElement('a');
      a.download = `qr-blesaf.png`;
      a.href = canvas.toDataURL('image/png');
      a.click();
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  return (
    <div className="db-qr-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="db-qr-card" role="dialog" aria-modal="true" aria-label={t('dashboard.qr.modalTitle')}>
        <div className="db-qr-modal-title">{t('dashboard.qr.modalTitle')}</div>
        <div className="db-qr-code-wrap" ref={qrRef}>
          <QRCodeSVG value={qrFullUrl} size={148} fgColor="#2D5A3D" />
        </div>
        <div className="db-qr-url-pill">{clinicQrUrl}</div>
        <div className="db-qr-modal-buttons">
          <button className="db-qr-modal-close" onClick={onClose}>
            {t('dashboard.qr.close')}
          </button>
          <button className="db-qr-modal-download" onClick={handleDownload}>
            {t('dashboard.qr.download')}
          </button>
        </div>
      </div>
    </div>
  );
}

// Old QueueFilterBar, QueueTableRow, QueueTable removed — replaced by desktop/ components

// ─── StatsGrid ───────────────────────────────────────────────────────────────

function StatsGrid({
  waitingCount,
  seenToday,
  avgWait,
  consultMinutes,
}: {
  waitingCount: number;
  seenToday: number;
  avgWait: number;
  consultMinutes: number;
}) {
  const { t } = useTranslation();

  return (
    <div className="db-r-section">
      <div className="db-section-label">{t('dashboard.statsPanel.label')}</div>
      <div className="db-stats-grid">
        <div className="db-stat-card db-stat-card-accent">
          <div className="db-stat-value">{waitingCount}</div>
          <div className="db-stat-label">{t('dashboard.statsPanel.waiting')}</div>
        </div>
        <div className="db-stat-card">
          <div className="db-stat-value">{seenToday}</div>
          <div className="db-stat-label">{t('dashboard.statsPanel.seen')}</div>
        </div>
        <div className="db-stat-card">
          <div className="db-stat-value">{avgWait}</div>
          <div className="db-stat-label">{t('dashboard.statsPanel.avgWait')}</div>
        </div>
        <div className="db-stat-card">
          <div className="db-stat-value">{consultMinutes}</div>
          <div className="db-stat-label">{t('dashboard.statsPanel.consultMin')}</div>
        </div>
      </div>
    </div>
  );
}

// ─── WaitTimeBars ────────────────────────────────────────────────────────────

function WaitTimeBars({ entries }: { entries: QueueEntry[] }) {
  const { t } = useTranslation();

  const waitingEntries = useMemo(() =>
    entries
      .filter(e => e.status === QueueStatus.WAITING || e.status === QueueStatus.NOTIFIED)
      .map(e => ({ ...e, waitMins: getWaitingMinutes(e.arrivedAt) }))
      .sort((a, b) => b.waitMins - a.waitMins)
      .slice(0, 8),
    [entries]
  );

  const maxWait = waitingEntries.length > 0 ? Math.max(...waitingEntries.map(e => e.waitMins)) : 0;

  if (waitingEntries.length === 0) return null;

  return (
    <div className="db-r-section">
      <div className="db-section-label">{t('dashboard.waitTimes.label')}</div>
      {waitingEntries.map(entry => {
        const pct = maxWait > 0 ? Math.max(2, (entry.waitMins / maxWait) * 100) : 2;
        return (
          <div key={entry.id} className="db-wait-row">
            <div className="db-wait-row-header">
              <span className="db-wait-row-name">{entry.patientName || '—'}</span>
              <span className="db-wait-row-value">{entry.waitMins} min</span>
            </div>
            <div className="db-wait-row-track">
              <div className="db-wait-row-fill" style={{ width: `${pct}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── RightPanel ──────────────────────────────────────────────────────────────

function RightPanel({
  waitingCount,
  seenToday,
  avgWait,
  consultMinutes,
  entries,
}: {
  waitingCount: number;
  seenToday: number;
  avgWait: number;
  consultMinutes: number;
  entries: QueueEntry[];
}) {
  return (
    <div className="db-right">
      <StatsGrid
        waitingCount={waitingCount}
        seenToday={seenToday}
        avgWait={avgWait}
        consultMinutes={consultMinutes}
      />
      <WaitTimeBars entries={entries} />
    </div>
  );
}

// ─── Main DesktopDashboard ───────────────────────────────────────────────────

export default function DesktopDashboard({
  clinic,
  queue,
  stats,
  waitingCount,
  isDoctorPresent,
  isCallingNext,
  isTogglingPresence: _isTogglingPresence,
  exitingPatientId,
  announcement: _announcement,
  subscriptionExpired,
  onCallNext,
  onRemovePatient,
  onReorderPatient: _onReorderPatient,
  onEmergency,
  onCompleteConsultation,
  onToggleDoctorPresent,
  onOpenAddModal: _onOpenAddModal,
  onOpenAnnouncementModal: _onOpenAnnouncementModal,
}: DesktopDashboardProps) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { checkAuth, logout } = useAuthStore();
  const toast = useToast();

  // QR code data
  const [qrData, setQrData] = useState<{ url: string; qrCode: string } | null>(null);
  useEffect(() => { api.getQRCode().then(setQrData).catch(() => {}); }, []);

  // Settings drawer
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsMounted, setSettingsMounted] = useState(false);
  const [settingsPane, setSettingsPane] = useState<SettingsPane>('profil');
  const openSettingsPane = useCallback((pane: string) => {
    setSettingsPane(pane as SettingsPane);
    setSettingsMounted(true);
    setIsSettingsOpen(true);
  }, []);
  const closeSettings = () => { setIsSettingsOpen(false); setTimeout(() => setSettingsMounted(false), 300); };

  // Derived data
  const currentPatient = useMemo(() =>
    queue.find(e => e.status === QueueStatus.IN_CONSULTATION) ?? null,
    [queue]
  );

  const nextPatient = useMemo(() =>
    queue
      .filter(e => e.status === QueueStatus.WAITING || e.status === QueueStatus.NOTIFIED)
      .sort((a, b) => a.position - b.position)[0] ?? null,
    [queue]
  );


  const consultMinutes = useMemo(() => {
    if (!currentPatient?.calledAt) return 0;
    return Math.max(0, Math.floor((Date.now() - new Date(currentPatient.calledAt).getTime()) / 60000));
  }, [currentPatient]);

  const seenToday = stats?.seen ?? 0;
  const avgWait = stats?.avgWait ?? 0;

  // QR URL derivation
  const clinicQrUrl = qrData?.url
    ? qrData.url.replace(/^https?:\/\//, '')
    : '';
  const qrFullUrl = qrData?.url || '';

  // Subscription status for top bar (derived from the prop)
  const subscriptionStatus: 'trial' | 'active' | 'expired' = subscriptionExpired ? 'expired' : 'active';

  // Top bar QR action handlers
  const [qrModalOpen, setQrModalOpen] = useState(false);

  const handleQrDisplay = useCallback(() => setQrModalOpen(true), []);
  const handleQrCopy = useCallback(async () => {
    if (!qrFullUrl) return;
    try {
      await navigator.clipboard.writeText(qrFullUrl);
      toast.show(t('dashboard.qr.copied'), 'teal');
    } catch { /* clipboard unavailable */ }
  }, [qrFullUrl, t, toast]);

  const handleQrWhatsApp = useCallback(() => {
    if (!qrFullUrl) return;
    const waLink = `https://wa.me/?text=${encodeURIComponent(t('dashboard.qr.waMessage', { url: qrFullUrl }))}`;
    window.open(waLink, '_blank', 'noopener,noreferrer');
  }, [qrFullUrl, t]);

  const handleToggleLanguage = useCallback(() => {
    const newLang = i18n.language === 'fr' ? 'ar' : 'fr';
    i18n.changeLanguage(newLang);
  }, [i18n]);

  const handleLogout = useCallback(() => {
    logout();
    navigate('/login');
  }, [logout, navigate]);

  // Queue filter hook
  const { filtered, counts, activeFilter, setActiveFilter, searchQuery, setSearchQuery } = useQueueFilter(queue);

  // Context menu state (single shared instance)
  const [menuState, setMenuState] = useState<{
    open: boolean;
    entry: QueueEntry | null;
    anchorRect: DOMRect | null;
  }>({ open: false, entry: null, anchorRect: null });

  const handleKebabClick = useCallback((e: React.MouseEvent, entry: QueueEntry) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setMenuState(prev =>
      prev.open && prev.entry?.id === entry.id
        ? { open: false, entry: null, anchorRect: null }
        : { open: true, entry, anchorRect: rect }
    );
  }, []);

  const closeMenu = useCallback(() => {
    setMenuState({ open: false, entry: null, anchorRect: null });
  }, []);

  // Action handlers
  const handleCall = useCallback((entry: QueueEntry) => {
    if (!entry.patientPhone) return;
    window.open(`tel:${entry.patientPhone}`, '_blank');
  }, []);

  const handleWhatsApp = useCallback((entry: QueueEntry) => {
    if (!entry.patientPhone) return;
    const phone = entry.patientPhone.replace(/\D/g, '');
    window.open(`https://wa.me/${phone}`, '_blank');
  }, []);

  const handleCopyLink = useCallback((entry: QueueEntry) => {
    const url = `${window.location.origin}/patient/${entry.id}`;
    navigator.clipboard.writeText(url).catch(() => {});
    toast.show(t('queue.toast.linkCopied'), 'teal');
  }, [t, toast]);

  const handleEmergency = useCallback((entry: QueueEntry) => {
    onEmergency(entry.id);
    toast.show(t('queue.toast.emergency'), 'orange');
  }, [onEmergency, t, toast]);

  const handleRemove = useCallback((entry: QueueEntry) => {
    if (!window.confirm(t('queue.confirm.remove', { name: entry.patientName || '—' }))) return;
    onRemovePatient(entry.id);
  }, [onRemovePatient, t]);

  return (
    <div className="desktop-dashboard">
      <DesktopTopBar
        clinicName={clinic?.name || ''}
        isDoctorPresent={isDoctorPresent}
        isQueueOpen={true}
        currentLang={i18n.language as 'fr' | 'ar'}
        waitingCount={waitingCount}
        subscriptionStatus={subscriptionStatus}
        avgConsultationMins={clinic?.avgConsultationMins}
        clinic={clinic}
        onClinicUpdated={checkAuth}
        onToggleDoctorPresence={onToggleDoctorPresent}
        onToggleQueue={() => {/* TODO: wire up queue toggle */}}
        onToggleLanguage={handleToggleLanguage}
        onOpenSettingsPane={openSettingsPane}
        onNavigateToSupport={() => navigate('/settings')}
        onLogout={handleLogout}
        onQrDisplay={handleQrDisplay}
        onQrCopy={handleQrCopy}
        onQrWhatsApp={handleQrWhatsApp}
      />

      <div className="db-layout">
        {/* Left Panel */}
        <div className="db-left">
          <AddPatientSection />
          <ConsultationCard
            currentPatient={currentPatient}
            onEnd={onCompleteConsultation}
          />
          <CallNextButton
            nextPatient={nextPatient}
            waitingCount={waitingCount}
            isCallingNext={isCallingNext}
            onCallNext={onCallNext}
          />
          {clinicQrUrl && (
            <QrShareSection clinicQrUrl={clinicQrUrl} qrFullUrl={qrFullUrl} />
          )}
        </div>

        {/* Center — Redesigned Queue Table */}
        <div className="db-center" style={{ padding: "16px 16px 0" }}>
          <div className="db-section-label">{t('queue.title')}</div>
          <QueueTableHeader
            activeFilter={activeFilter}
            onFilterChange={setActiveFilter}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            counts={counts}
          />

          <div className="bg-white border border-[#DDE2DC] rounded-[14px] shadow-sm overflow-x-auto">
            <table className="w-full border-collapse" style={{ minWidth: 580 }}>
              <thead>
                <tr className="bg-[#F4F5F1] border-b-[1.5px] border-[#DDE2DC]">
                  <th className="text-[9px] font-semibold tracking-[0.6px] uppercase text-[#94A49A] px-3 py-2.5 text-left w-[44px]">#</th>
                  <th className="text-[9px] font-semibold tracking-[0.6px] uppercase text-[#94A49A] px-3 py-2.5 text-left">{t('queue.col.patient')}</th>
                  <th className="text-[9px] font-semibold tracking-[0.6px] uppercase text-[#94A49A] px-3 py-2.5 text-left">{t('queue.col.arrival')}</th>
                  <th className="text-[9px] font-semibold tracking-[0.6px] uppercase text-[#94A49A] px-3 py-2.5 text-left">{t('queue.col.wait')}</th>
                  <th className="text-[9px] font-semibold tracking-[0.6px] uppercase text-[#94A49A] px-3 py-2.5 text-left">{t('queue.col.eta')}</th>
                  <th className="text-[9px] font-semibold tracking-[0.6px] uppercase text-[#94A49A] px-3 py-2.5 text-left">{t('queue.col.contact')}</th>
                  <th className="w-[44px]" />
                </tr>
              </thead>
              <tbody>
                {filtered.map(entry => (
                  <QueueTableRowNew
                    key={entry.id}
                    entry={entry}
                    isMenuOpen={menuState.entry?.id === entry.id && menuState.open}
                    isExiting={entry.id === exitingPatientId}
                    onKebabClick={handleKebabClick}
                  />
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-[#94A49A] text-[14px]">
                      {t('queue.empty')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Panel */}
        <RightPanel
          waitingCount={waitingCount}
          seenToday={seenToday}
          avgWait={avgWait}
          consultMinutes={consultMinutes}
          entries={queue}
        />
      </div>

      {/* Floating call-next bar */}
      {waitingCount > 0 && (
        <CallNextBar
          nextPatientName={nextPatient?.patientName ?? null}
          onCallNext={onCallNext}
          disabled={waitingCount === 0 || isCallingNext}
        />
      )}

      {/* Context menu (single shared instance) */}
      <PatientContextMenu
        open={menuState.open}
        anchorRect={menuState.anchorRect}
        entry={menuState.entry}
        onClose={closeMenu}
        onCall={() => { if (menuState.entry) handleCall(menuState.entry); closeMenu(); }}
        onWhatsApp={() => { if (menuState.entry) handleWhatsApp(menuState.entry); closeMenu(); }}
        onCopyLink={() => { if (menuState.entry) handleCopyLink(menuState.entry); closeMenu(); }}
        onEmergency={() => { if (menuState.entry) handleEmergency(menuState.entry); closeMenu(); }}
        onRemove={() => { if (menuState.entry) handleRemove(menuState.entry); closeMenu(); }}
      />

      {/* QR Modal (from top bar dropdown) */}
      {qrModalOpen && clinicQrUrl && (
        <QrModal
          clinicQrUrl={clinicQrUrl}
          qrFullUrl={qrFullUrl}
          onClose={() => setQrModalOpen(false)}
        />
      )}

      {/* Settings Drawer */}
      {settingsMounted && (
        <DesktopSettingsDrawer
          isOpen={isSettingsOpen}
          onClose={closeSettings}
          clinic={clinic}
          onClinicUpdated={checkAuth}
          initialPane={settingsPane}
        />
      )}
    </div>
  );
}
