import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { useUILabels } from '@/hooks/useUILabels';
import { webBrand } from '@/lib/brand';
import { api } from '@/lib/api';
import { formatTime } from '@/lib/time';
import type { QueueEntry, QueueStats as QueueStatsType, Clinic } from '@/types';
import { QueueStatus } from '@/types';
import { calculateEndEstimate, getConsultationMinutes } from '@/components/blesaf/utils';
import '@/components/blesaf/blesaf.css';
import '@/components/receptionist/receptionist.css';
import { useQueueLifecycle } from '@/components/receptionist/useQueueLifecycle';
import {
  toCurrentPatient,
  toQueuePatient,
  toClosingStatsData,
  toDaySummaryBrief,
  toSummaryData,
  getNextPatientPreview,
} from '@/components/receptionist/adapters';
import type { QueuePatient } from '@/components/receptionist/types';
import WelcomeScreenDesktop from '@/components/queue/WelcomeScreenDesktop';
import DesktopSettingsDrawer from './DesktopSettingsDrawer';
import AllDoneCard from '@/components/receptionist/AllDoneCard';
import SummaryCard from '@/components/receptionist/SummaryCard';
import TimelineBar from '@/components/receptionist/TimelineBar';
import SummaryActionBar from '@/components/receptionist/SummaryActionBar';
import ClosingBanner from '@/components/receptionist/ClosingBanner';
import PatientContextSheet from '@/components/receptionist/PatientContextSheet';
import { useQueueStore } from '@/stores/queueStore';
import { logger } from '@/lib/logger';
import BSWhatsAppSheet from '@/components/blesaf/BSWhatsAppSheet';

// ─── Design Tokens ────────────────────────────────────────────────────────────

const C = {
  green800: '#1B3A2D',
  green700: '#1E5038',
  green600: '#27654A',
  green500: '#2D9F5D',
  green100: '#E6F4EC',
  teal: '#0F7B6C',
  tealLight: '#E8F5F1',
  tealMid: '#C5E3DE',
  creamBg: '#F5F0E8',
  cream100: '#FAF7F2',
  amber600: '#D4920B',
  amber500: '#E8A838',
  amber100: '#FEF7E6',
  red600: '#C0392B',
  red500: '#DC3545',
  red100: '#FDE8E8',
  textPrimary: '#1A1A1A',
  textSecondary: '#6B6960',
  textMuted: '#9E9B90',
  borderLight: '#E8E6DF',
  borderSubtle: '#F0EDE6',
  white: '#FFFFFF',
  surface2: '#F0EFEA',
  blue: '#3B7DD9',
  blue50: '#EDF3FC',
};

const body = "'DM Sans', sans-serif";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getWaitDotColor(minutes: number): string {
  if (minutes <= 20) return '#2D8B4E';
  if (minutes <= 45) return '#D4920B';
  return '#C0392B';
}

function formatWaitMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h${String(m).padStart(2, '0')}`;
}

function getAvatarStyle(isNotified: boolean): React.CSSProperties {
  return {
    width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontWeight: 700, fontSize: 14,
    background: isNotified ? C.amber100 : C.surface2,
    color: isNotified ? C.amber600 : C.textSecondary,
  };
}

// ─── Types ────────────────────────────────────────────────────────────────────

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

// ─── Presence Dropdown ────────────────────────────────────────────────────────

function PresenceDropdown({ isDoctorPresent, isTogglingPresence, onToggle }: {
  isDoctorPresent: boolean;
  isTogglingPresence: boolean;
  onToggle: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const pillStyle: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', gap: 7,
    padding: '5px 13px', borderRadius: 999, fontSize: 13, fontWeight: 600,
    background: isDoctorPresent ? 'rgba(78,201,122,0.15)' : 'rgba(217,79,59,0.15)',
    color: isDoctorPresent ? '#4EC97A' : '#F4706A',
    border: isDoctorPresent ? '1px solid rgba(78,201,122,0.25)' : '1px solid rgba(217,79,59,0.25)',
    cursor: isTogglingPresence ? 'wait' : 'pointer', fontFamily: body,
  };

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button onClick={() => setOpen(!open)} disabled={isTogglingPresence} style={pillStyle}>
        <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'currentColor' }} />
        {isDoctorPresent ? 'Présent' : 'Absent'}
        <span className="material-symbols-rounded" style={{ fontSize: 16, transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'none' }}>
          expand_more
        </span>
      </button>
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', right: 0,
          background: C.white, border: `1px solid ${C.borderLight}`,
          borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          minWidth: 160, zIndex: 60, overflow: 'hidden',
        }}>
          {[
            { label: 'Présent', active: isDoctorPresent, dotColor: '#4EC97A', textColor: '#2D8B4E', bg: '#EDF7F0', border: `1px solid ${C.borderSubtle}` },
            { label: 'Absent',  active: !isDoctorPresent, dotColor: '#D94F3B', textColor: '#D94F3B', bg: '#FDF0ED', border: 'none' },
          ].map(opt => (
            <button
              key={opt.label}
              onClick={() => { if (!opt.active && !isTogglingPresence) onToggle(); setOpen(false); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                padding: '10px 14px', fontSize: 13, fontWeight: opt.active ? 600 : 400,
                color: opt.textColor, background: opt.active ? opt.bg : 'transparent',
                border: 'none', borderBottom: opt.border, cursor: 'pointer',
                textAlign: 'left', fontFamily: body,
              }}
            >
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: opt.dotColor, flexShrink: 0 }} />
              {opt.label}
              {opt.active && <span className="material-symbols-rounded" style={{ fontSize: 16, marginLeft: 'auto' }}>check</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Topbar Icon Button ────────────────────────────────────────────────────────

function TopbarIconBtn({ icon, onClick, label }: { icon: string; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      style={{
        width: 32, height: 32, borderRadius: 8,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)',
        color: 'rgba(255,255,255,0.5)', cursor: 'pointer', padding: 0,
      }}
    >
      <span className="material-symbols-rounded" style={{ fontSize: 17 }}>{icon}</span>
    </button>
  );
}

// ─── Left Panel Stat Card ─────────────────────────────────────────────────────

function LeftStatCard({ value, label, highlighted, small }: {
  value: number | string;
  label: string;
  highlighted?: boolean;
  small?: boolean;
}) {
  return (
    <div style={{
      background: highlighted ? C.tealLight : C.white,
      border: `1px solid ${highlighted ? C.tealMid : C.borderLight}`,
      borderRadius: 12, padding: '12px 10px', textAlign: 'center',
    }}>
      <div style={{
        fontSize: small ? 16 : 22, fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1,
        color: highlighted ? C.teal : C.textPrimary,
      }}>
        {value}
      </div>
      <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: C.textMuted, marginTop: 4 }}>
        {label}
      </div>
    </div>
  );
}

// ─── Queue Badge ──────────────────────────────────────────────────────────────

function QueueBadge({ badge }: { badge: 'priority' | 'emergency' | 'stepped-out' | 'no-phone' }) {
  const styles: Record<string, { bg: string; color: string; label: string }> = {
    emergency:     { bg: '#FEE2E2', color: '#DC2626', label: 'Urgence' },
    priority:      { bg: C.amber100, color: C.amber600, label: 'Prioritaire' },
    'stepped-out': { bg: C.blue50, color: C.blue, label: 'Sorti' },
    'no-phone':    { bg: C.surface2, color: C.textMuted, label: 'Sans tél.' },
  };
  const s = styles[badge];
  return (
    <span style={{
      flexShrink: 0, borderRadius: 999, padding: '2px 8px',
      fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase',
      background: s.bg, color: s.color,
    }}>
      {s.label}
    </span>
  );
}

// ─── Row Action Button ────────────────────────────────────────────────────────

function RowBtn({ icon, label, onClick }: { icon: string; label: string; onClick: () => void }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: 30, height: 30, borderRadius: 8,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        border: `1px solid ${C.borderLight}`,
        background: hovered ? C.surface2 : C.white,
        color: C.textSecondary, cursor: 'pointer', transition: 'all 120ms', padding: 0,
      }}
    >
      <span className="material-symbols-rounded" style={{ fontSize: 16 }}>{icon}</span>
    </button>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function DesktopDashboard({
  clinic, queue, stats, waitingCount, isDoctorPresent, isCallingNext, isTogglingPresence,
  exitingPatientId, announcement, subscriptionExpired,
  onCallNext, onRemovePatient, onCompleteConsultation,
  onToggleDoctorPresent, onOpenAnnouncementModal,
}: DesktopDashboardProps) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { logout, checkAuth } = useAuthStore();
  const { isMedical } = useUILabels();

  // QR code
  const [qrData, setQrData] = useState<{ url: string; qrCode: string } | null>(null);
  useEffect(() => { api.getQRCode().then(setQrData).catch(() => {}); }, []);

  // Settings drawer
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsMounted, setSettingsMounted] = useState(false);
  const openSettings = () => { setSettingsMounted(true); setIsSettingsOpen(true); };
  const closeSettings = () => { setIsSettingsOpen(false); setTimeout(() => setSettingsMounted(false), 300); };

  // Add patient drawer
  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);
  const [drawerMounted, setDrawerMounted] = useState(false);
  const [quickName, setQuickName] = useState('');
  const [drawerPrefill, setDrawerPrefill] = useState('');

  const openAddDrawer = (name: string) => {
    setDrawerPrefill(name);
    setQuickName('');
    setDrawerMounted(true);
    setIsAddDrawerOpen(true);
  };

  const closeAddDrawer = () => {
    setIsAddDrawerOpen(false);
    setTimeout(() => setDrawerMounted(false), 300);
  };

  // WhatsApp sheet
  const [isWhatsAppSheetOpen, setIsWhatsAppSheetOpen] = useState(false);
  const [whatsappSentIds, setWhatsappSentIds] = useState<Set<string>>(new Set());
  const handleWhatsAppSent = useCallback((id: string) => {
    setWhatsappSentIds(prev => new Set(prev).add(id));
  }, []);

  // Patient context sheet
  const [contextPatient, setContextPatient] = useState<QueuePatient | null>(null);
  // Queue lifecycle
  const avgConsultMins = clinic?.avgConsultationMins ?? 10;
  const { queueStatus, isAllDone, closedSummary, openQueue, closeQueue, reopenQueue, endDay, newDay } =
    useQueueLifecycle(clinic?.id, queue, stats, isDoctorPresent);

  const showPreOpen = queueStatus === 'PRE_OPEN';
  const showOpen    = queueStatus === 'OPEN';
  const showClosing = queueStatus === 'CLOSING' && !isAllDone;
  const showAllDone = queueStatus === 'CLOSING' && isAllDone;
  const showClosed  = queueStatus === 'CLOSED';

  // Derived data
  const inConsultEntry  = queue.find(e => e.status === QueueStatus.IN_CONSULTATION);
  const waitingEntries  = queue.filter(e => e.status === QueueStatus.WAITING || e.status === QueueStatus.NOTIFIED);
  const queuePatients   = useMemo(
    () => waitingEntries.map(toQueuePatient),
    [waitingEntries],
  );
  const patientById = useMemo(() => {
    const map = new Map<string, QueuePatient>();
    queuePatients.forEach(p => map.set(p.id, p));
    return map;
  }, [queuePatients]);

  const currentPatient = inConsultEntry ? toCurrentPatient(inConsultEntry) : null;
  const elapsed        = inConsultEntry?.calledAt ? getConsultationMinutes(inConsultEntry.calledAt) : 0;
  const remaining      = Math.max(0, avgConsultMins - elapsed);
  const estimatedEnd   = stats ? calculateEndEstimate(waitingCount, avgConsultMins, remaining) : '--:--';
  const seenCount      = stats?.seen ?? 0;
  const nextPreview    = getNextPatientPreview(queue);

  const closingStats   = stats ? toClosingStatsData(stats, queue, avgConsultMins) : null;
  const summaryBrief   = stats
    ? toDaySummaryBrief(stats)
    : { totalPatients: 0, avgWaitMinutes: 0, avgConsultMinutes: 0 };
  const summaryData    = toSummaryData(clinic, closedSummary);

  // Estimated position/wait for new patient
  const estPosition = waitingEntries.length + 1 + (inConsultEntry ? 1 : 0);
  const estWaitMins = estPosition * avgConsultMins;
  const estWait = estWaitMins >= 60
    ? `${Math.floor(estWaitMins / 60)}h${String(estWaitMins % 60).padStart(2, '0')}`
    : `${estWaitMins} min`;

  const { fetchQueue } = useQueueStore();
  const handleMarkSteppedOut = useCallback(async (id: string) => {
    try {
      await api.toggleSteppedOut(id);
      fetchQueue();
    } catch { /* handled by API layer */ }
  }, [fetchQueue]);
  const handleShare = useCallback(async () => {
    if (navigator.share) {
      try { await navigator.share({ title: 'Résumé de journée', text: `${summaryData.totalPatientsSeen} patients vus.` }); }
      catch { /* cancelled */ }
    }
  }, [summaryData.totalPatientsSeen]);

  const handleLogout = async () => { await logout(); navigate('/login'); };
  const toggleLanguage = () => { i18n.changeLanguage(i18n.language === 'fr' ? 'ar' : 'fr'); };

  const callNextDisabled = waitingCount === 0 || isCallingNext || !isDoctorPresent || subscriptionExpired;

  // ─── RENDER ───────────────────────────────────────────────────────────────

  return (
    <div style={{ background: C.creamBg, height: '100vh', fontFamily: body, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>

      {/* ── Slim Topbar ─────────────────────────────────────────────── */}
      <header style={{
        background: C.green800, height: 52, padding: '0 24px',
        display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0,
      }}>
        {/* Logo */}
        <div style={{ fontWeight: 800, fontSize: 18, letterSpacing: '-0.04em', color: C.white }}>
          BleSaf
        </div>

        {/* Separator */}
        <div style={{ width: 1, height: 18, background: 'rgba(255,255,255,0.12)', flexShrink: 0 }} />

        {/* Clinic */}
        {clinic && (
          <div>
            {isMedical && (
              <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.35)', lineHeight: 1.2 }}>
                Cabinet
              </div>
            )}
            <div style={{ fontSize: 14, fontWeight: 700, color: C.white, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
              {clinic.doctorName || clinic.name}
            </div>
          </div>
        )}

        <div style={{ flex: 1 }} />

        {/* Lifecycle status pill */}
        {showPreOpen && <TopbarStatusPill variant="closed" label="File fermée" />}
        {showOpen && !isDoctorPresent && <TopbarStatusPill variant="red" label="Docteur absent" />}
        {showClosing && <TopbarStatusPill variant="amber" label="En fermeture" />}
        {showAllDone && <TopbarStatusPill variant="open" label="File vide" />}
        {showClosed && <TopbarStatusPill variant="closed" label="Journée terminée" />}

        {/* PRE_OPEN: open queue CTA */}
        {showPreOpen && (
          <button onClick={openQueue} style={{
            background: C.white, color: C.green800, border: 'none',
            borderRadius: 10, padding: '7px 16px', fontSize: 13, fontWeight: 700,
            cursor: 'pointer', fontFamily: body, display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <span className="material-symbols-rounded" style={{ fontSize: 16 }}>play_arrow</span>
            Ouvrir la file
          </button>
        )}

        {/* CLOSED: new day */}
        {showClosed && (
          <button onClick={newDay} style={{
            background: C.white, color: C.green800, border: 'none',
            borderRadius: 10, padding: '7px 16px', fontSize: 13, fontWeight: 700,
            cursor: 'pointer', fontFamily: body,
          }}>
            Nouvelle journée
          </button>
        )}

        {/* Queue open status dot */}
        {showOpen && isDoctorPresent && (
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#4EC97A', flexShrink: 0 }} />
        )}
        <TopbarIconBtn icon="settings" label="Paramètres" onClick={openSettings} />
      </header>

      {/* ═══ PRE_OPEN ════════════════════════════════════════════════ */}
      {showPreOpen && (
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <WelcomeScreenDesktop
            doctorName={clinic?.doctorName ?? clinic?.name ?? ''}
            clinicName={clinic?.name ?? ''}
            onOpenQueue={openQueue}
            isOpening={false}
          />
        </div>
      )}

      {/* ═══ ALL_DONE ════════════════════════════════════════════════ */}
      {showAllDone && (
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
          <div style={{ maxWidth: 640, width: '100%' }}>
            <AllDoneCard summary={summaryBrief} onEndDay={endDay} onReopen={reopenQueue} />
          </div>
        </div>
      )}

      {/* ═══ CLOSED ══════════════════════════════════════════════════ */}
      {showClosed && (
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
          <div style={{ maxWidth: 640, width: '100%' }}>
            <SummaryCard summary={summaryData} onShare={handleShare} />
            <TimelineBar summary={summaryData} />
            <SummaryActionBar onNewDay={newDay} />
          </div>
        </div>
      )}

      {/* ═══ OPEN / CLOSING — Split Focus ════════════════════════════ */}
      {(showOpen || showClosing) && (
        <>
          {showClosing && <ClosingBanner />}

          <div style={{ display: 'grid', gridTemplateColumns: '390px 1fr', flex: 1, overflow: 'hidden' }}>

            {/* ── LEFT: Control Hub ─────────────────────────────── */}
            <div style={{
              background: C.creamBg, borderRight: `1px solid ${C.borderLight}`,
              display: 'flex', flexDirection: 'column', overflow: 'hidden',
            }}>

              {/* Body */}
              <div style={{ flex: 1, overflow: 'hidden', padding: '12px 20px', display: 'flex', flexDirection: 'column' }}>

              {/* Consultation card */}
              {currentPatient ? (
                <div style={{ background: C.teal, borderRadius: 16, padding: '16px 18px', marginBottom: 10, flexShrink: 0 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>
                    En consultation
                  </div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: C.white, letterSpacing: '-0.03em', lineHeight: 1, marginBottom: 4 }}>
                    {currentPatient.name}
                  </div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginBottom: 10 }}>
                    Arrivé à {currentPatient.arrivedAt} · {currentPatient.consultingSinceMinutes} min
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 12 }}>
                    <div style={{ fontSize: 42, fontWeight: 800, color: C.white, letterSpacing: '-0.05em', lineHeight: 1 }}>
                      {elapsed}
                    </div>
                    <div>
                      <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)' }}>min</div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>en salle</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={onCompleteConsultation}
                      style={{
                        flex: 1, background: C.white, color: C.teal, border: 'none',
                        borderRadius: 999, padding: '10px 16px', fontSize: 13, fontWeight: 700,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                        cursor: 'pointer', fontFamily: body,
                      }}
                    >
                      <span className="material-symbols-rounded" style={{ fontSize: 16, fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                      Terminer la consultation
                    </button>
                    {currentPatient.phone && (
                      <button
                        onClick={() => window.open(`tel:${currentPatient.phone}`)}
                        style={{
                          background: 'rgba(255,255,255,0.15)', color: C.white,
                          border: '1.5px solid rgba(255,255,255,0.3)', borderRadius: 999,
                          padding: '10px 14px', display: 'flex', alignItems: 'center',
                          cursor: 'pointer',
                        }}
                      >
                        <span className="material-symbols-rounded" style={{ fontSize: 18 }}>phone</span>
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div style={{
                  background: C.surface2, borderRadius: 16, padding: '16px 20px',
                  marginBottom: 10, textAlign: 'center', flexShrink: 0,
                }}>
                  <span className="material-symbols-rounded" style={{ fontSize: 32, color: C.textMuted, display: 'block', marginBottom: 8 }}>
                    person_outline
                  </span>
                  <div style={{ fontSize: 14, fontWeight: 600, color: C.textSecondary }}>
                    Aucun patient en consultation
                  </div>
                  <div style={{ fontSize: 12, color: C.textMuted, marginTop: 4 }}>
                    Appelez le prochain pour commencer
                  </div>
                </div>
              )}

              {/* Stats grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 10 }}>
                <LeftStatCard
                  value={showClosing ? (closingStats?.remainingCount ?? 0) : waitingCount}
                  label={showClosing ? 'Restants' : 'Attente'}
                  highlighted
                />
                <LeftStatCard value={seenCount} label="Vus" />
                <LeftStatCard value={estimatedEnd} label="Fin est." small />
              </div>

              {/* Primary CTA */}
              <button
                onClick={onCallNext}
                disabled={callNextDisabled}
                style={{
                  width: '100%', background: C.teal, color: C.white, border: 'none',
                  borderRadius: 13, padding: 14, fontSize: 16, fontWeight: 800,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  letterSpacing: '-0.02em', marginBottom: 4, cursor: callNextDisabled ? 'not-allowed' : 'pointer',
                  opacity: callNextDisabled ? 0.5 : 1, transition: 'opacity 150ms', fontFamily: body,
                }}
              >
                {isCallingNext
                  ? <span className="material-symbols-rounded animate-spin" style={{ fontSize: 20 }}>progress_activity</span>
                  : <span className="material-symbols-rounded" style={{ fontSize: 20 }}>arrow_forward</span>
                }
                Appeler Suivant
              </button>

              {/* Next hint */}
              <div style={{ textAlign: 'center', fontSize: 12, color: C.textMuted, marginBottom: 10 }}>
                {nextPreview
                  ? <>Prochain : <strong style={{ color: C.textPrimary, fontWeight: 700 }}>{nextPreview}</strong></>
                  : 'Aucun patient en attente'
                }
              </div>

              {/* Divider + Outils section header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: C.textMuted, whiteSpace: 'nowrap' }}>
                  Outils
                </div>
                <div style={{ flex: 1, height: 1, background: C.borderLight }} />
              </div>

              {/* QR card */}
              {qrData && (
                <div style={{
                  background: C.white, border: `1px solid ${C.borderLight}`,
                  borderRadius: 12, padding: '12px 14px',
                  display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8,
                }}>
                  <div style={{
                    width: 36, height: 36, background: C.surface2, borderRadius: 8,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <span className="material-symbols-rounded" style={{ fontSize: 20, color: C.textMuted }}>qr_code_2</span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: C.textPrimary }}>QR d'enregistrement</div>
                    <div style={{ fontSize: 11, color: C.textMuted }}>Lien pour les patients</div>
                  </div>
                  <button
                    onClick={() => window.open(qrData.url, '_blank')}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 3,
                      background: 'none', border: `1px solid ${C.borderLight}`,
                      borderRadius: 8, padding: '5px 10px', fontSize: 12,
                      color: C.textSecondary, cursor: 'pointer', fontFamily: body, whiteSpace: 'nowrap',
                    }}
                  >
                    <span className="material-symbols-rounded" style={{ fontSize: 14 }}>open_in_new</span>
                    Voir
                  </button>
                  <button
                    onClick={async () => { try { await navigator.clipboard.writeText(qrData.url); } catch { /* clipboard unavailable */ } }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 3,
                      background: 'none', border: `1px solid ${C.borderLight}`,
                      borderRadius: 8, padding: '5px 10px', fontSize: 12,
                      color: C.textSecondary, cursor: 'pointer', fontFamily: body, whiteSpace: 'nowrap',
                    }}
                  >
                    <span className="material-symbols-rounded" style={{ fontSize: 14 }}>content_copy</span>
                    Copier
                  </button>
                </div>
              )}

              {/* Tools row: Annonce + Language toggle */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                <button
                  onClick={onOpenAnnouncementModal}
                  style={{
                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    background: announcement ? C.blue50 : C.white,
                    color: announcement ? C.blue : C.textSecondary,
                    border: `1px solid ${announcement ? 'rgba(59,125,217,0.3)' : C.borderLight}`,
                    borderRadius: 12, padding: '8px 12px', fontSize: 12, fontWeight: 600,
                    cursor: 'pointer', fontFamily: body, position: 'relative',
                  }}
                >
                  <span className="material-symbols-rounded" style={{ fontSize: 16 }}>campaign</span>
                  Annonce
                  {announcement && (
                    <span style={{
                      position: 'absolute', top: -4, right: -4,
                      width: 10, height: 10, borderRadius: '50%',
                      background: '#3B82F6', border: `2px solid ${C.white}`,
                    }} />
                  )}
                </button>
                {webBrand.supportedLanguages.length > 1 && (
                  <button
                    onClick={toggleLanguage}
                    style={{
                      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                      background: C.white, color: C.textSecondary,
                      border: `1px solid ${C.borderLight}`,
                      borderRadius: 12, padding: '8px 12px', fontSize: 12, fontWeight: 600,
                      cursor: 'pointer', fontFamily: body,
                    }}
                  >
                    <span className="material-symbols-rounded" style={{ fontSize: 16 }}>language</span>
                    {i18n.language === 'fr' ? 'عربي' : 'Français'}
                  </button>
                )}
              </div>

              {/* Divider */}
              <div style={{ height: 1, background: C.borderLight, margin: '6px 0 8px' }} />

              {/* Lifecycle action */}
              {showOpen && (
                <button
                  onClick={closeQueue}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    background: C.amber100, color: C.amber600,
                    border: '1px solid rgba(212,146,11,0.2)', borderRadius: 12,
                    padding: '9px 14px', fontSize: 12, fontWeight: 600,
                    cursor: 'pointer', fontFamily: body,
                  }}
                >
                  <span className="material-symbols-rounded" style={{ fontSize: 16 }}>block</span>
                  Fermer la file
                </button>
              )}
              {showClosing && (
                <button
                  onClick={reopenQueue}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    background: C.green100, color: C.green700,
                    border: '1px solid rgba(45,139,78,0.2)', borderRadius: 12,
                    padding: '9px 14px', fontSize: 12, fontWeight: 600,
                    cursor: 'pointer', fontFamily: body,
                  }}
                >
                  <span className="material-symbols-rounded" style={{ fontSize: 16 }}>refresh</span>
                  Reprendre
                </button>
              )}

              {/* Déconnexion */}
              <button
                onClick={handleLogout}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  background: C.red100, color: C.red600,
                  border: '1px solid rgba(192,57,43,0.2)', borderRadius: 12,
                  padding: '9px 14px', fontSize: 12, fontWeight: 600, marginTop: 6,
                  cursor: 'pointer', fontFamily: body,
                }}
              >
                <span className="material-symbols-rounded" style={{ fontSize: 16 }}>logout</span>
                Déconnexion
              </button>

              </div>{/* /scrollable body */}

              {/* Footer: Presence */}
              <div style={{
                padding: '10px 20px', borderTop: `1px solid ${C.borderLight}`,
                flexShrink: 0, display: 'flex', alignItems: 'center',
              }}>
                <PresenceDropdown
                  isDoctorPresent={isDoctorPresent}
                  isTogglingPresence={isTogglingPresence}
                  onToggle={onToggleDoctorPresent}
                />
              </div>

            </div>{/* /left panel */}

            {/* ── RIGHT: Queue List ─────────────────────────────── */}
            <div style={{ background: C.white, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>

              {/* Controls bar */}
              {showOpen && (
                <div style={{
                  padding: '14px 22px', borderBottom: `1px solid ${C.borderLight}`,
                  display: 'flex', gap: 10, alignItems: 'center', flexShrink: 0,
                }}>
                  <input
                    type="text"
                    placeholder="Nom du patient…"
                    value={quickName}
                    onChange={e => setQuickName(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && !subscriptionExpired) {
                        openAddDrawer(quickName);
                      }
                    }}
                    style={{
                      flex: 1, height: 38,
                      border: `1px solid ${C.borderLight}`, borderRadius: 12,
                      background: C.white, padding: '0 14px',
                      fontSize: 13, color: C.textPrimary, outline: 'none', fontFamily: body,
                    }}
                  />
                  <button
                    onClick={() => openAddDrawer(quickName)}
                    disabled={subscriptionExpired}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      background: C.teal, color: C.white, border: 'none',
                      borderRadius: 12, padding: '8px 16px', fontSize: 13, fontWeight: 600,
                      cursor: subscriptionExpired ? 'not-allowed' : 'pointer',
                      fontFamily: body, whiteSpace: 'nowrap',
                      opacity: subscriptionExpired ? 0.5 : 1,
                    }}
                  >
                    <span className="material-symbols-rounded" style={{ fontSize: 16 }}>person_add</span>
                    Ajouter
                  </button>
                </div>
              )}

              {/* Queue list */}
              <div style={{ padding: '20px 22px', flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: C.textMuted }}>
                    {showClosing ? 'Restants' : "File d'attente"}
                  </div>
                  <div style={{ fontSize: 13, color: C.textMuted }}>
                    {waitingEntries.length} patient{waitingEntries.length !== 1 ? 's' : ''}
                  </div>
                </div>

                {waitingEntries.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                    <span className="material-symbols-rounded" style={{ fontSize: 48, color: C.textMuted, opacity: 0.4, display: 'block', marginBottom: 16 }}>
                      group
                    </span>
                    <div style={{ fontWeight: 600, fontSize: 18, color: C.textSecondary, marginBottom: 8 }}>
                      {showClosing ? 'Tous les patients ont été vus' : 'Aucun patient en attente'}
                    </div>
                    <div style={{ fontSize: 14, color: C.textMuted }}>
                      {showClosing ? 'La journée touche à sa fin' : 'Les patients apparaîtront ici dès leur enregistrement'}
                    </div>
                  </div>
                ) : (
                  <ul role="list" aria-live="polite" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                    {waitingEntries.map(entry => {
                      const patient = patientById.get(entry.id);
                      const isNotified = entry.status === QueueStatus.NOTIFIED;
                      const waitMinutes = patient?.waitMinutes ?? 0;
                      const initials = (entry.patientName || '?')[0].toUpperCase();

                      return (
                        <li
                          key={entry.id}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 12,
                            padding: '13px 14px',
                            background: isNotified ? '#FFFDF8' : C.white,
                            border: `1px solid ${isNotified ? 'rgba(212,146,11,0.3)' : C.borderSubtle}`,
                            borderRadius: 12, marginBottom: 8,
                            opacity: entry.id === exitingPatientId ? 0 : 1,
                            transform: entry.id === exitingPatientId ? 'translateX(-20px)' : 'none',
                            transition: 'all 150ms ease',
                          }}
                        >
                          {/* Position bubble */}
                          <div style={{
                            width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontWeight: 700, fontSize: 12,
                            background: isNotified ? C.amber100 : C.surface2,
                            color: isNotified ? C.amber600 : C.textSecondary,
                          }}>
                            {patient?.position ?? '—'}
                          </div>

                          {/* Avatar */}
                          <div style={getAvatarStyle(isNotified)}>
                            {initials}
                          </div>

                          {/* Patient info */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 14, fontWeight: 600, color: C.textPrimary, display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {entry.patientName || t('queue.anonymous')}
                              </span>
                              {whatsappSentIds.has(entry.id) && (
                                <span
                                  className="material-symbols-rounded"
                                  style={{ fontSize: 14, color: '#25D366', flexShrink: 0, fontVariationSettings: "'FILL' 1" }}
                                  title="Lien WhatsApp envoyé"
                                >
                                  check_circle
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: 12, color: C.textMuted, marginTop: 1 }}>
                              Arrivé à {formatTime(entry.arrivedAt)}
                              {entry.appointmentTime ? ` · RDV ${formatTime(entry.appointmentTime)}` : ' · Sans RDV'}
                            </div>
                          </div>

                          {/* Wait dot + time */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
                            <span style={{ width: 8, height: 8, borderRadius: '50%', background: getWaitDotColor(waitMinutes), display: 'inline-block' }} />
                            <span style={{ fontSize: 12, fontWeight: 600, color: C.textSecondary }}>{formatWaitMinutes(waitMinutes)}</span>
                          </div>

                          {/* Notified badge */}
                          {isNotified && (
                            <span style={{
                              borderRadius: 999, padding: '2px 8px', fontSize: 11, fontWeight: 700,
                              background: C.amber100, color: C.amber600, whiteSpace: 'nowrap', flexShrink: 0,
                            }}>
                              Notifié
                            </span>
                          )}

                          {/* Other badges */}
                          {patient?.badge && <QueueBadge badge={patient.badge} />}

                          {/* Actions */}
                          <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                            {entry.patientPhone && (
                              <RowBtn icon="phone" label="Appeler le patient" onClick={() => window.open(`tel:${entry.patientPhone}`)} />
                            )}
                            <RowBtn
                              icon="more_vert"
                              label="Plus d'options"
                              onClick={() => patient && setContextPatient(patient)}
                            />
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>

          </div>
        </>
      )}

      {/* ── Overlays ─────────────────────────────────────────────────── */}
      <PatientContextSheet
        isOpen={contextPatient !== null}
        patient={contextPatient}
        onClose={() => setContextPatient(null)}
        onMarkSteppedOut={handleMarkSteppedOut}
        onRemove={onRemovePatient}
        onPhoneUpdated={() => setContextPatient(null)}
      />
      {settingsMounted && (
        <DesktopSettingsDrawer
          isOpen={isSettingsOpen}
          onClose={closeSettings}
          clinic={clinic}
          onClinicUpdated={checkAuth}
        />
      )}
      {drawerMounted && <DesktopAddDrawer
        isOpen={isAddDrawerOpen}
        onClose={closeAddDrawer}
        prefilledName={drawerPrefill}
        estimatedPosition={estPosition}
        estimatedWait={estWait}
        clinicName={clinic?.name ?? ''}
        onWhatsAppSent={handleWhatsAppSent}
      />}
      <BSWhatsAppSheet
        isOpen={isWhatsAppSheetOpen}
        onClose={() => setIsWhatsAppSheetOpen(false)}
        patients={queuePatients}
        clinicName={clinic?.name ?? ''}
        whatsappSentIds={whatsappSentIds}
        onWhatsAppSent={handleWhatsAppSent}
      />
    </div>
  );
}

// ─── Topbar Status Pill ───────────────────────────────────────────────────────

function TopbarStatusPill({ variant, label }: { variant: 'open' | 'closed' | 'amber' | 'red'; label: string }) {
  const styles = {
    open:   { bg: 'rgba(45,139,78,0.18)',   color: '#4EC97A', border: '1px solid rgba(45,139,78,0.25)' },
    closed: { bg: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)', border: 'none' },
    amber:  { bg: 'rgba(212,146,11,0.2)',   color: '#EFA825', border: '1px solid rgba(212,146,11,0.25)' },
    red:    { bg: 'rgba(217,79,59,0.2)',    color: '#F4706A', border: '1px solid rgba(217,79,59,0.25)' },
  }[variant];

  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '5px 12px', borderRadius: 999, fontSize: 12, fontWeight: 600,
      background: styles.bg, color: styles.color, border: styles.border,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor' }} />
      {label}
    </span>
  );
}

// ─── Desktop Add Patient Drawer ───────────────────────────────────────────────

interface DesktopAddDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  prefilledName: string;
  estimatedPosition: number;
  estimatedWait: string;
  clinicName: string;
  onWhatsAppSent?: (id: string) => void;
}

function DesktopAddDrawer({
  isOpen, onClose, prefilledName, estimatedPosition, estimatedWait, clinicName, onWhatsAppSent,
}: DesktopAddDrawerProps) {
  const { t } = useTranslation();
  const { addPatient } = useQueueStore();

  const [step, setStep] = useState<'form' | 'confirm'>('form');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [isRdv, setIsRdv] = useState(false);
  const [rdvHour, setRdvHour] = useState('');
  const [rdvMinute, setRdvMinute] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addedName, setAddedName] = useState('');
  const [addedPosition, setAddedPosition] = useState(0);
  const [addedHasPhone, setAddedHasPhone] = useState(false);
  const [addedEntryId, setAddedEntryId] = useState<string | null>(null);
  const [addedPhone, setAddedPhone] = useState('');

  const rdvHours = Array.from({ length: 13 }, (_, i) => (i + 7).toString().padStart(2, '0'));
  const rdvMinutes = ['00', '15', '30', '45'];
  const rdvTime = rdvHour && rdvMinute ? `${rdvHour}:${rdvMinute}` : '';

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

  useEffect(() => {
    if (step === 'confirm' && isOpen) {
      const timer = setTimeout(handleClose, 4000);
      return () => clearTimeout(timer);
    }
  }, [step, isOpen]);

  const handleClose = () => {
    onClose();
    setTimeout(() => {
      setStep('form');
      setName('');
      setPhone('');
      setIsRdv(false);
      setRdvHour('');
      setRdvMinute('');
      setError(null);
      setAddedEntryId(null);
    }, 300);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '');
    setPhone(raw.slice(0, webBrand.phone.localDigits));
  };

  const phoneDisplay = phone.length > 0
    ? phone.replace(/(\d{2})(\d{3})?(\d{3})?/, (_, a, b, c) => [a, b, c].filter(Boolean).join(' '))
    : '';

  const handleSubmit = async () => {
    if (!name.trim()) { setError(t('blesaf.addPatient.nameRequired')); return; }
    setError(null);
    setIsSubmitting(true);
    try {
      const patientPhone = phone.length > 0 ? `${webBrand.phone.countryCode}${phone}` : '';
      const entry = await addPatient({
        patientName: name.trim(),
        patientPhone,
        appointmentTime: isRdv && rdvTime ? rdvTime : undefined,
      });
      setAddedName(name.trim());
      setAddedPosition(estimatedPosition);
      setAddedHasPhone(phone.length > 0);
      setAddedEntryId(entry.id);
      setAddedPhone(patientPhone);
      setStep('confirm');
    } catch (err: any) {
      logger.error('DesktopAddDrawer submit error:', err);
      setError(err.code === 'ALREADY_CHECKED_IN' ? t('queue.patientAlreadyInQueue') : err.message || t('blesaf.addPatient.addError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const inp: React.CSSProperties = {
    width: '100%', padding: '10px 14px', fontSize: 14, fontFamily: body,
    border: `1px solid ${C.borderLight}`, borderRadius: 10, outline: 'none',
    background: C.surface2, color: C.textPrimary,
  };
  const label: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: 6,
    fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em',
    color: C.textMuted, marginBottom: 6,
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={handleClose}
        style={{
          position: 'absolute', inset: 0, zIndex: 99,
          background: 'rgba(0,0,0,0.25)',
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? 'auto' : 'none',
          transition: 'opacity 250ms',
        }}
      />

      {/* Drawer panel */}
      <div style={{
        position: 'absolute', top: 0, right: 0, bottom: 0, zIndex: 100,
        width: 420, background: C.white,
        boxShadow: '-8px 0 40px rgba(0,0,0,0.14)',
        display: 'flex', flexDirection: 'column',
        transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 280ms cubic-bezier(0.32,0,0.15,1)',
      }}>

        {/* Header */}
        <div style={{
          padding: '20px 24px 16px', borderBottom: `1px solid ${C.borderLight}`,
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexShrink: 0,
        }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 18, color: C.textPrimary, letterSpacing: '-0.02em' }}>
              {t('blesaf.addPatient.title')}
            </div>
            {step === 'form' && (
              <div style={{ fontSize: 12, color: C.textMuted, marginTop: 3 }}>
                {t('blesaf.addPatient.subtitle', { position: estimatedPosition, wait: estimatedWait })}
              </div>
            )}
          </div>
          <button
            onClick={handleClose}
            style={{
              width: 32, height: 32, borderRadius: 8, border: `1px solid ${C.borderLight}`,
              background: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: C.textMuted, flexShrink: 0,
            }}
          >
            <span className="material-symbols-rounded" style={{ fontSize: 18 }}>close</span>
          </button>
        </div>

        {/* Scrollable body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>

          {step === 'form' ? (
            <>
              {error && (
                <div style={{
                  background: C.red100, color: C.red600, borderRadius: 10,
                  padding: '10px 14px', fontSize: 13, marginBottom: 16,
                }}>
                  {error}
                </div>
              )}

              {/* RDV toggle */}
              <div style={{
                display: 'grid', gridTemplateColumns: '1fr 1fr',
                background: C.surface2, borderRadius: 12, padding: 4,
                marginBottom: 20,
              }}>
                {[
                  { key: false, icon: 'queue', label: t('blesaf.addPatient.walkIn') },
                  { key: true,  icon: 'calendar_today', label: t('blesaf.addPatient.withAppointment') },
                ].map(opt => (
                  <button
                    key={String(opt.key)}
                    onClick={() => setIsRdv(opt.key)}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                      padding: '9px 12px', borderRadius: 9, fontSize: 13, fontWeight: 600,
                      border: 'none', cursor: 'pointer', fontFamily: body, transition: 'all 150ms',
                      background: isRdv === opt.key ? C.white : 'transparent',
                      color: isRdv === opt.key ? C.textPrimary : C.textMuted,
                      boxShadow: isRdv === opt.key ? '0 1px 4px rgba(0,0,0,0.10)' : 'none',
                    }}
                  >
                    <span className="material-symbols-rounded" style={{ fontSize: 15 }}>{opt.icon}</span>
                    {opt.label}
                  </button>
                ))}
              </div>

              {/* Name */}
              <div style={{ marginBottom: 16 }}>
                <div style={label}>
                  <span className="material-symbols-rounded" style={{ fontSize: 14 }}>person</span>
                  {t('blesaf.addPatient.patientName')}
                </div>
                <input
                  type="text"
                  autoFocus={!prefilledName}
                  value={name}
                  onChange={e => setName(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleSubmit(); }}
                  placeholder={t('blesaf.addPatient.patientName')}
                  style={inp}
                />
              </div>

              {/* Appointment time */}
              {isRdv && (
                <div style={{ marginBottom: 16 }}>
                  <div style={label}>
                    <span className="material-symbols-rounded" style={{ fontSize: 14 }}>schedule</span>
                    {t('blesaf.addPatient.appointmentTime')}
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <select value={rdvHour} onChange={e => setRdvHour(e.target.value)} style={{ ...inp, flex: 1 }}>
                      <option value="">HH</option>
                      {rdvHours.map(h => <option key={h} value={h}>{h}</option>)}
                    </select>
                    <span style={{ fontSize: 18, fontWeight: 700, color: C.textMuted }}>:</span>
                    <select value={rdvMinute} onChange={e => setRdvMinute(e.target.value)} style={{ ...inp, flex: 1 }}>
                      <option value="">MM</option>
                      {rdvMinutes.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                </div>
              )}

              {/* Phone */}
              <div style={{ marginBottom: 16 }}>
                <div style={label}>
                  <span className="material-symbols-rounded" style={{ fontSize: 14 }}>phone</span>
                  {t('blesaf.addPatient.phone')}
                  <span style={{ fontSize: 10, color: C.textMuted, fontWeight: 400, textTransform: 'none', letterSpacing: 0, marginLeft: 4 }}>
                    {t('blesaf.addPatient.phoneOptional')}
                  </span>
                </div>
                <div style={{ display: 'flex', borderRadius: 10, overflow: 'hidden', border: `1px solid ${C.borderLight}` }}>
                  <div style={{
                    padding: '10px 12px', fontSize: 14, fontWeight: 600, color: C.textMuted,
                    background: C.white, borderRight: `1px solid ${C.borderLight}`, flexShrink: 0,
                  }}>
                    {webBrand.phone.countryCode}
                  </div>
                  <input
                    type="tel" inputMode="numeric"
                    placeholder={webBrand.phone.placeholder.replace(webBrand.phone.countryCode + ' ', '')}
                    value={phoneDisplay}
                    onChange={handlePhoneChange}
                    style={{ flex: 1, padding: '10px 14px', fontSize: 14, border: 'none', outline: 'none', background: C.surface2, fontFamily: body, color: C.textPrimary }}
                  />
                </div>
                <div style={{ fontSize: 12, color: C.textMuted, marginTop: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span className="material-symbols-rounded" style={{ fontSize: 14 }}>info</span>
                  {t('blesaf.addPatient.phoneHint')}
                </div>
              </div>

              {/* QR fallback hint */}
              <div style={{
                background: C.tealLight, borderRadius: 12, padding: '12px 14px',
                display: 'flex', alignItems: 'flex-start', gap: 10,
              }}>
                <div style={{
                  width: 36, height: 36, background: C.teal, borderRadius: 8, flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <span className="material-symbols-rounded" style={{ fontSize: 20, color: C.white }}>qr_code_2</span>
                </div>
                <div style={{ fontSize: 13, color: C.teal, lineHeight: 1.4 }}>
                  <strong>{t('blesaf.addPatient.qrFallbackTitle')}</strong>{' '}
                  {t('blesaf.addPatient.qrFallbackDesc')}
                </div>
              </div>
            </>
          ) : (
            /* Confirmation step */
            <>
              <div style={{ textAlign: 'center', padding: '24px 0 20px' }}>
                <span className="material-symbols-rounded" style={{ fontSize: 52, color: C.teal, fontVariationSettings: "'FILL' 1", display: 'block', marginBottom: 12 }}>
                  check_circle
                </span>
                <div style={{ fontWeight: 800, fontSize: 22, color: C.textPrimary, letterSpacing: '-0.02em', marginBottom: 4 }}>
                  {addedName}
                </div>
                <div style={{ fontSize: 14, color: C.textMuted }}>
                  {t('blesaf.addPatient.confirmPosition', { position: addedPosition, wait: estimatedWait })}
                </div>
              </div>

              {addedHasPhone && addedEntryId && (
                <button
                  onClick={() => {
                    const statusUrl = `${window.location.origin}/patient/${addedEntryId}`;
                    const msg = `${clinicName} - Suivez votre position dans la file d'attente: ${statusUrl}`;
                    window.open(`https://wa.me/${addedPhone.replace('+', '')}?text=${encodeURIComponent(msg)}`, '_blank');
                    onWhatsAppSent?.(addedEntryId);
                  }}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                    background: '#E8F5E8', border: '1px solid rgba(18,140,126,0.2)',
                    borderRadius: 12, padding: '14px 16px', cursor: 'pointer',
                    marginBottom: 12, textAlign: 'left',
                  }}
                >
                  <div style={{ width: 36, height: 36, background: '#25D366', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span className="material-symbols-rounded" style={{ fontSize: 20, color: C.white }}>chat</span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 14, color: C.textPrimary }}>{t('blesaf.addPatient.sendWhatsApp')}</div>
                    <div style={{ fontSize: 12, color: C.textMuted }}>{t('blesaf.addPatient.sendWhatsAppDesc')}</div>
                  </div>
                  <span className="material-symbols-rounded" style={{ fontSize: 18, color: C.textMuted }}>chevron_right</span>
                </button>
              )}
            </>
          )}
        </div>

        {/* Footer CTA */}
        <div style={{ padding: '16px 24px', borderTop: `1px solid ${C.borderLight}`, flexShrink: 0 }}>
          {step === 'form' ? (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !name.trim()}
              style={{
                width: '100%', background: isSubmitting || !name.trim() ? C.borderLight : C.teal,
                color: isSubmitting || !name.trim() ? C.textMuted : C.white,
                border: 'none', borderRadius: 12, padding: '13px 20px',
                fontSize: 15, fontWeight: 700, cursor: isSubmitting || !name.trim() ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                fontFamily: body, transition: 'all 150ms',
              }}
            >
              <span className="material-symbols-rounded" style={{ fontSize: 18 }}>check</span>
              {isSubmitting ? t('blesaf.addPatient.submitting') : t('blesaf.addPatient.submit')}
            </button>
          ) : (
            <button
              onClick={handleClose}
              style={{
                width: '100%', background: C.surface2, color: C.textPrimary,
                border: `1px solid ${C.borderLight}`, borderRadius: 12, padding: '13px 20px',
                fontSize: 15, fontWeight: 600, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: body, position: 'relative', overflow: 'hidden',
              }}
            >
              {t('blesaf.addPatient.done')}
              <span style={{
                position: 'absolute', bottom: 0, left: 0, height: 3,
                background: C.teal, borderRadius: '0 0 12px 12px',
                animation: 'bs-confirm-progress 4s linear forwards',
              }} />
            </button>
          )}
        </div>
      </div>
    </>
  );
}
