import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { useUILabels } from '@/hooks/useUILabels';
import { webBrand } from '@/lib/brand';
import { api } from '@/lib/api';
import { formatTime } from '@/lib/time';
import { formatPhone } from '@/lib/phone';
import type { QueueEntry, QueueStats as QueueStatsType } from '@/types';
import { QueueStatus } from '@/types';
import { calculateEndEstimate, getConsultationMinutes } from '@/components/blesaf/utils';

// ─── Design Tokens (inline for single-file simplicity) ───────────────────

const C = {
  green900: '#112B21',
  green800: '#1B3A2D',
  green700: '#1E5038',
  green600: '#27654A',
  green500: '#2D9F5D',
  green400: '#34B86A',
  green100: '#E6F4EC',
  green50: '#F0F9F4',
  creamBg: '#F5F0E8',
  cream100: '#FAF7F2',
  amber600: '#D4880A',
  amber500: '#E8A838',
  amber100: '#FFF3D6',
  amber50: '#FFFBF0',
  red600: '#C0392B',
  red500: '#DC3545',
  red100: '#FDE8E8',
  textPrimary: '#1A1A1A',
  textSecondary: '#5C6B63',
  textMuted: '#8E9A93',
  borderLight: '#E5E0D8',
  borderSubtle: '#EDE9E2',
  white: '#FFFFFF',
};

const heading = "'Plus Jakarta Sans', sans-serif";
const body = "'DM Sans', sans-serif";

// ─── Helpers ──────────────────────────────────────────────────────────────

function getTimeOfDayEmoji(): string {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return '☀️';
  if (h >= 12 && h < 18) return '🌤️';
  return '🌙';
}

function getGreetingWord(): string {
  const h = new Date().getHours();
  if (h >= 5 && h < 18) return 'Bonjour';
  return 'Bonsoir';
}

function getDisplayPosition(entry: QueueEntry, isDoctorPresent: boolean): number | null {
  if (isDoctorPresent && entry.status === QueueStatus.IN_CONSULTATION) return null;
  return isDoctorPresent ? entry.position - 1 : entry.position;
}

// ─── Types ────────────────────────────────────────────────────────────────

interface DesktopDashboardProps {
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

// ─── Main Component ───────────────────────────────────────────────────────

export default function DesktopDashboard({
  queue, stats, waitingCount, isDoctorPresent, isCallingNext, isTogglingPresence,
  exitingPatientId, announcement, subscriptionExpired,
  onCallNext, onRemovePatient, onReorderPatient, onEmergency, onCompleteConsultation,
  onToggleDoctorPresent, onOpenAddModal, onOpenAnnouncementModal,
}: DesktopDashboardProps) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { clinic, logout } = useAuthStore();
  const { isMedical } = useUILabels();

  // QR code data
  const [qrData, setQrData] = useState<{ url: string; qrCode: string } | null>(null);
  useEffect(() => {
    api.getQRCode().then(setQrData).catch(() => {});
  }, []);

  // Quick add input
  const [quickName, setQuickName] = useState('');

  const handleQuickAdd = () => {
    // Quick add opens the modal — phone is required by the backend
    onOpenAddModal();
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const toggleLanguage = () => {
    i18n.changeLanguage(i18n.language === 'fr' ? 'ar' : 'fr');
  };

  // Compute stats
  const seenCount = stats?.seen ?? 0;
  const avgConsult = stats?.effectiveAvgMins ?? 10;
  const inConsultEntry = queue.find(e => e.status === QueueStatus.IN_CONSULTATION);
  const elapsed = inConsultEntry?.calledAt ? getConsultationMinutes(inConsultEntry.calledAt) : 0;
  const remaining = Math.max(0, avgConsult - elapsed);
  const estimatedEnd = stats ? calculateEndEstimate(waitingCount, avgConsult, remaining) : '--:--';

  // Next patient for CTA bar
  const waitingPatients = queue.filter(e => e.status === QueueStatus.WAITING || e.status === QueueStatus.NOTIFIED);
  const nextPatient = waitingPatients[0];

  // Greeting subtitle
  const getSubtitle = () => {
    if (waitingCount === 0 && seenCount === 0) return 'Votre journée va commencer';
    if (waitingCount === 0) return `${seenCount} patients vus aujourd'hui`;
    if (seenCount > 0) return `${waitingCount} en attente · ${seenCount} patients vus aujourd'hui`;
    return `${waitingCount} patients vous attendent`;
  };

  const doctorName = clinic?.doctorName || clinic?.name || '';
  const lastName = doctorName.split(' ').pop() || doctorName;

  return (
    <div style={{ background: C.creamBg, minHeight: '100vh', fontFamily: body }}>
      {/* ── Topbar ──────────────────────────────────────────── */}
      <header style={{
        background: C.green800, height: 56, padding: '0 28px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ fontFamily: heading, fontWeight: 800, fontSize: 18, color: C.white }}>
          BleSaf
        </div>
        {clinic && (
          <div style={{ textAlign: 'center' }}>
            {isMedical && (
              <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, color: 'rgba(255,255,255,0.5)' }}>
                Cabinet
              </div>
            )}
            <div style={{ fontFamily: heading, fontWeight: 700, fontSize: 16, color: C.white }}>
              {doctorName}
            </div>
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {webBrand.supportedLanguages.length > 1 && (
            <button onClick={toggleLanguage} style={{
              background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)',
              color: C.white, borderRadius: 999, padding: '5px 14px', fontSize: 13,
              cursor: 'pointer', fontFamily: body,
            }}>
              {i18n.language === 'fr' ? 'عربي' : 'Français'}
            </button>
          )}
          <button onClick={() => navigate('/settings')} style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: 0,
            color: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center',
          }}>
            <span className="material-symbols-rounded" style={{ fontSize: 20 }}>settings</span>
          </button>
          <button onClick={handleLogout} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'rgba(255,255,255,0.5)', fontSize: 13, fontFamily: body,
          }}>
            {t('auth.logout')}
          </button>
        </div>
      </header>

      {/* ── Status Bar ─────────────────────────────────────── */}
      <div style={{
        background: C.cream100, borderBottom: `1px solid ${C.borderLight}`,
        padding: '10px 28px', display: 'flex', alignItems: 'center', gap: 16,
      }}>
        {/* Status badges */}
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '4px 12px', borderRadius: 999, fontSize: 12, fontWeight: 600,
          background: C.green100, color: C.green700,
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: C.green500 }} />
          Ouverte
        </span>

        {!isDoctorPresent && (
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '4px 12px', borderRadius: 999, fontSize: 12, fontWeight: 600,
            background: C.red100, color: C.red600,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: C.red500 }} />
            Docteur absent
          </span>
        )}

        <div style={{ flex: 1 }} />

        {/* Toggle */}
        <span style={{ fontSize: 13, color: isDoctorPresent ? C.green700 : C.textSecondary, fontFamily: body }}>
          {isDoctorPresent ? 'Docteur présent' : 'Docteur absent'}
        </span>
        <button
          onClick={onToggleDoctorPresent}
          disabled={isTogglingPresence}
          role="switch"
          aria-checked={isDoctorPresent}
          aria-label={isDoctorPresent ? 'Docteur présent' : 'Docteur absent'}
          style={{
            width: 40, height: 22, borderRadius: 11, padding: 2,
            background: isDoctorPresent ? C.green500 : C.borderLight,
            border: 'none', cursor: isTogglingPresence ? 'wait' : 'pointer',
            position: 'relative', transition: 'background 200ms',
            display: 'flex', alignItems: 'center',
          }}
        >
          <div style={{
            width: 18, height: 18, borderRadius: '50%', background: C.white,
            boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
            transform: isDoctorPresent ? 'translateX(18px)' : 'translateX(0)',
            transition: 'transform 200ms',
          }} />
        </button>
      </div>

      {/* ── Content Area ───────────────────────────────────── */}
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '28px 40px 60px' }}>

        {/* Top Row: Greeting + Stats */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
          {/* Greeting Card */}
          <div style={{
            flex: 1, minWidth: 320,
            background: C.cream100, border: `1px solid ${C.borderSubtle}`,
            borderRadius: 16, padding: '28px 32px',
          }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>{getTimeOfDayEmoji()}</div>
            <div style={{ fontFamily: heading, fontWeight: 700, fontSize: 22, color: C.textPrimary, marginBottom: 4 }}>
              {getGreetingWord()}, Dr. {lastName}
            </div>
            <div style={{ fontSize: 14, color: C.textMuted }}>
              {getSubtitle()}
            </div>
          </div>

          {/* Stat Cards */}
          <div style={{ display: 'flex', gap: 12 }}>
            {/* En attente — highlighted */}
            <div
              aria-label={`${waitingCount} patients en attente`}
              style={{
                background: C.green100, border: `1px solid ${C.green500}`,
                borderRadius: 12, padding: '20px 24px', textAlign: 'center', minWidth: 120,
              }}
            >
              <div style={{ fontFamily: heading, fontWeight: 800, fontSize: 28, color: C.green700, lineHeight: 1.1 }}>
                {waitingCount}
              </div>
              <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, color: C.textMuted, marginTop: 4 }}>
                En attente
              </div>
            </div>
            {/* Vus */}
            <div
              aria-label={`${seenCount} patients vus aujourd'hui`}
              style={{
                background: C.white, border: `1px solid ${C.borderSubtle}`,
                borderRadius: 12, padding: '20px 24px', textAlign: 'center', minWidth: 120,
              }}
            >
              <div style={{ fontFamily: heading, fontWeight: 800, fontSize: 28, color: C.textPrimary, lineHeight: 1.1 }}>
                {seenCount}
              </div>
              <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, color: C.textMuted, marginTop: 4 }}>
                Vus
              </div>
            </div>
            {/* Fin estimée */}
            <div
              aria-label={`Fin estimée ${estimatedEnd}`}
              style={{
                background: C.white, border: `1px solid ${C.borderSubtle}`,
                borderRadius: 12, padding: '20px 24px', textAlign: 'center', minWidth: 120,
              }}
            >
              <div style={{ fontFamily: heading, fontWeight: 800, fontSize: 20, color: C.textPrimary, lineHeight: 1.1 }}>
                {estimatedEnd}
              </div>
              <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, color: C.textMuted, marginTop: 4 }}>
                Fin estimée
              </div>
            </div>
          </div>
        </div>

        {/* Controls Strip */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
          {/* Left: Add patient + Announce */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Add patient input group */}
            <div style={{ display: 'flex', gap: 10, maxWidth: 400 }}>
              <input
                type="text"
                placeholder="Nom du patient..."
                value={quickName}
                onChange={(e) => setQuickName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleQuickAdd(); }}
                style={{
                  padding: '10px 16px', border: `1px solid ${C.borderLight}`,
                  borderRadius: 12, fontSize: 14, fontFamily: body, background: C.white,
                  outline: 'none', flex: 1, minWidth: 180, color: C.textPrimary,
                }}
              />
              <button
                onClick={handleQuickAdd}
                disabled={subscriptionExpired}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  background: C.white, color: C.green800,
                  border: `1px solid ${C.borderLight}`, borderRadius: 12,
                  padding: '10px 20px', fontSize: 14, fontWeight: 500,
                  cursor: subscriptionExpired ? 'not-allowed' : 'pointer', fontFamily: body,
                  transition: 'all 150ms', whiteSpace: 'nowrap',
                }}
              >
                <span className="material-symbols-rounded" style={{ fontSize: 18 }}>person_add</span>
                Ajouter
              </button>
            </div>

            {/* Announce button */}
            <button
              onClick={onOpenAnnouncementModal}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: announcement ? '#EFF6FF' : C.white,
                color: announcement ? '#1E40AF' : C.green800,
                border: `1px solid ${announcement ? '#93C5FD' : C.borderLight}`,
                borderRadius: 12, padding: '10px 20px', fontSize: 14, fontWeight: 500,
                cursor: 'pointer', fontFamily: body, transition: 'all 150ms',
                whiteSpace: 'nowrap', position: 'relative',
              }}
            >
              <span className="material-symbols-rounded" style={{ fontSize: 18 }}>campaign</span>
              Annonce
              {announcement && (
                <span style={{
                  position: 'absolute', top: -4, right: -4,
                  width: 10, height: 10, borderRadius: '50%',
                  background: '#3B82F6', border: `2px solid ${C.white}`,
                }} />
              )}
            </button>
          </div>

          {/* Right: QR Mini Card */}
          {qrData && (
            <div style={{
              background: C.white, border: `1px solid ${C.borderSubtle}`,
              borderRadius: 12, padding: 16, display: 'flex', alignItems: 'center', gap: 16,
            }}>
              <img
                src={qrData.qrCode}
                alt="QR Code"
                style={{ width: 60, height: 60, borderRadius: 8, flexShrink: 0 }}
              />
              <div>
                <div style={{ fontFamily: heading, fontWeight: 700, fontSize: 13 }}>QR d'enregistrement</div>
                <div style={{ fontSize: 12, color: C.textMuted }}>Pour les patients</div>
              </div>
              <button
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(qrData.url);
                  } catch {}
                }}
                style={{
                  marginLeft: 'auto', background: 'none',
                  border: `1px solid ${C.borderLight}`, borderRadius: 8,
                  padding: '6px 12px', fontSize: 12, color: C.textSecondary,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
                  fontFamily: body, whiteSpace: 'nowrap',
                }}
              >
                <span className="material-symbols-rounded" style={{ fontSize: 14 }}>content_copy</span>
                Copier
              </button>
            </div>
          )}
        </div>

        {/* Queue Section Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1.2, color: C.textMuted }}>
            FILE D'ATTENTE
          </div>
          <div style={{ fontSize: 13, color: C.textMuted }}>
            {queue.length} patient{queue.length !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Queue Cards or Empty State */}
        {queue.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <span className="material-symbols-rounded" style={{ fontSize: 48, color: C.textMuted, opacity: 0.4, display: 'block', marginBottom: 16 }}>
              group
            </span>
            <div style={{ fontFamily: heading, fontWeight: 600, fontSize: 18, color: C.textSecondary, marginBottom: 8 }}>
              Aucun patient en attente
            </div>
            <div style={{ fontSize: 14, color: C.textMuted }}>
              Les patients apparaîtront ici dès leur enregistrement
            </div>
          </div>
        ) : (
          <ul role="list" aria-live="polite" style={{ display: 'flex', flexDirection: 'column', gap: 8, listStyle: 'none', margin: 0, padding: 0 }}>
            {queue.map((entry, idx) => {
              const displayPos = getDisplayPosition(entry, isDoctorPresent);
              const isInConsult = entry.status === QueueStatus.IN_CONSULTATION;
              const isNotified = entry.status === QueueStatus.NOTIFIED || (!isDoctorPresent && isInConsult);
              const isFirst = idx === 0;
              const isLastPatient = isInConsult && waitingPatients.length === 0;

              let cardBg = C.white;
              let cardBorder = C.borderSubtle;
              if (isInConsult && isDoctorPresent) { cardBg = C.green50; cardBorder = C.green500; }
              else if (isNotified) { cardBg = C.amber50; cardBorder = C.amber500; }

              let statusPill = { bg: C.green100, color: C.green700, text: 'En Attente' };
              if (isInConsult && isDoctorPresent) statusPill = { bg: C.green100, color: C.green700, text: 'En consultation' };
              else if (isNotified) statusPill = { bg: C.amber100, color: C.amber600, text: 'Notifié' };

              let posCircleBg = C.green50;
              let posCircleColor = C.green600;
              if (isFirst && (isNotified || isInConsult)) { posCircleBg = C.amber100; posCircleColor = C.amber600; }

              return (
                <li
                  key={entry.id}
                  style={{
                    background: cardBg, border: `1px solid ${cardBorder}`,
                    borderRadius: 12, padding: '16px 20px',
                    display: 'flex', alignItems: 'center', gap: 16,
                    transition: 'all 150ms ease',
                    opacity: entry.id === exitingPatientId ? 0 : 1,
                    transform: entry.id === exitingPatientId ? 'translateX(-20px)' : 'none',
                  }}
                >
                  {/* Position circle */}
                  {displayPos !== null ? (
                    <div style={{
                      width: 40, height: 40, borderRadius: '50%',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: heading, fontWeight: 700, fontSize: 16, flexShrink: 0,
                      background: posCircleBg, color: posCircleColor,
                    }}>
                      {displayPos}
                    </div>
                  ) : (
                    <div style={{
                      width: 40, height: 40, borderRadius: '50%',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: C.green100, color: C.green700, flexShrink: 0,
                    }}>
                      <span className="material-symbols-rounded" style={{ fontSize: 20 }}>medical_services</span>
                    </div>
                  )}

                  {/* Patient info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 15, color: C.textPrimary }}>
                      {entry.patientName || t('queue.anonymous')}
                    </div>
                    <div style={{ fontSize: 13, color: C.textMuted, marginTop: 2 }}>
                      {entry.patientPhone ? formatPhone(entry.patientPhone) : ''}
                      {entry.patientPhone ? ' · ' : ''}
                      Arrivé à {formatTime(entry.arrivedAt)}
                      {entry.appointmentTime
                        ? ` · RDV à ${formatTime(entry.appointmentTime)}`
                        : ' · Sans RDV'
                      }
                    </div>
                  </div>

                  {/* Status pill */}
                  <span style={{
                    borderRadius: 999, padding: '4px 12px', fontSize: 12, fontWeight: 600,
                    background: statusPill.bg, color: statusPill.color, whiteSpace: 'nowrap',
                  }}>
                    {statusPill.text}
                  </span>

                  {/* Action buttons */}
                  <div style={{ display: 'flex', gap: 6 }}>
                    {/* Call */}
                    {entry.patientPhone && (
                      <ActionBtn
                        icon="call"
                        label="Appeler le patient"
                        onClick={() => window.open(`tel:${entry.patientPhone}`)}
                      />
                    )}
                    {/* Emergency (priority) */}
                    {!isInConsult && entry.position > 1 && (
                      <ActionBtn
                        icon="priority_high"
                        label="Urgence — placer en premier"
                        onClick={() => onEmergency(entry.id)}
                      />
                    )}
                    {/* Move up */}
                    {entry.position > 1 && (
                      <ActionBtn
                        icon="arrow_upward"
                        label="Monter"
                        onClick={() => onReorderPatient(entry.id, entry.position - 1)}
                      />
                    )}
                    {/* Move down */}
                    {entry.position < queue.length && (
                      <ActionBtn
                        icon="arrow_downward"
                        label="Descendre"
                        onClick={() => onReorderPatient(entry.id, entry.position + 1)}
                      />
                    )}
                    {/* Complete or Remove */}
                    {isLastPatient && (
                      <ActionBtn
                        icon="check_circle"
                        label="Terminer la consultation"
                        onClick={onCompleteConsultation}
                        variant="success"
                      />
                    )}
                    <ActionBtn
                      icon="close"
                      label="Retirer de la file"
                      onClick={() => onRemovePatient(entry.id)}
                      variant="destructive"
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {/* Bottom CTA Bar */}
        <div style={{
          background: queue.length === 0 ? C.textMuted : C.green800,
          borderRadius: 16, padding: '20px 28px', marginTop: 16,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)' }}>
            {nextPatient ? (
              <>
                Prochain patient : <strong style={{ color: C.white, fontWeight: 600 }}>{nextPatient.patientName || t('queue.anonymous')}</strong>
              </>
            ) : (
              'Aucun patient en attente'
            )}
          </div>
          <button
            onClick={onCallNext}
            disabled={waitingCount === 0 || isCallingNext || !isDoctorPresent || subscriptionExpired}
            aria-label={nextPatient ? `Appeler le prochain patient, ${nextPatient.patientName || ''}` : 'Appeler Suivant'}
            style={{
              background: C.white, color: C.green800, border: 'none',
              borderRadius: 12, padding: '12px 28px',
              fontFamily: heading, fontWeight: 700, fontSize: 15,
              cursor: (waitingCount === 0 || isCallingNext || !isDoctorPresent || subscriptionExpired) ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', gap: 8,
              opacity: (waitingCount === 0 || isCallingNext || !isDoctorPresent || subscriptionExpired) ? 0.5 : 1,
              transition: 'all 150ms',
            }}
          >
            Appeler Suivant
            <span className="material-symbols-rounded" style={{ fontSize: 20 }}>arrow_forward</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Action Button ─────────────────────────────────────────────────────────

function ActionBtn({ icon, label, onClick, variant }: {
  icon: string;
  label: string;
  onClick: () => void;
  variant?: 'destructive' | 'success';
}) {
  const [hovered, setHovered] = useState(false);

  let bg = 'none';
  let borderColor = C.borderLight;
  let color = C.textSecondary;

  if (hovered) {
    if (variant === 'destructive') {
      bg = C.red100; borderColor = C.red500; color = C.red500;
    } else if (variant === 'success') {
      bg = C.green100; borderColor = C.green500; color = C.green500;
    } else {
      bg = C.cream100; borderColor = C.textMuted;
    }
  }

  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: 32, height: 32, background: bg,
        border: `1px solid ${borderColor}`, borderRadius: 8,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color, cursor: 'pointer', transition: 'all 150ms', padding: 0,
      }}
    >
      <span className="material-symbols-rounded" style={{ fontSize: 16 }}>{icon}</span>
    </button>
  );
}
