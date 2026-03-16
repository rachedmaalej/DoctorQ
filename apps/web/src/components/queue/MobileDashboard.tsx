import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { QueueEntry, QueueStats } from '@/types';
import { QueueStatus } from '@/types';
import { useAuthStore } from '@/stores/authStore';
import { useUILabels } from '@/hooks/useUILabels';
import { webBrand } from '@/lib/brand';
import Logo from '@/components/ui/Logo';
import { formatTime, getWaitingMinutes } from '@/lib/time';
import MorningHeroCard from './MorningHeroCard';
import CollapsedQueueBar from './CollapsedQueueBar';

interface MobileDashboardProps {
  queue: QueueEntry[];
  stats: QueueStats | null;
  onCallNext: () => void;
  onAddPatient: () => void;
  onRemovePatient: (id: string) => void;
  onReorder: (id: string, newPosition: number) => void;
  onEmergency: (id: string) => void;
  onShowQR: () => void;
  onCompleteConsultation?: () => void;
  isCallingNext: boolean;
  isDoctorPresent: boolean;
  onToggleDoctorPresent: () => void;
  announcement?: string | null;
  onAnnouncementClick?: () => void;
  onAnnouncementClear?: () => void;
}


/**
 * Queue-First Mobile Dashboard (v3 — Ocean Blue redesign)
 *
 * Layout order:
 * 1. Header
 * 2. Compact stats bar (sticky)
 * 3. Estimates bar (avg wait, next, end)
 * 4. Presence toggle
 * 5. Action buttons (add patient, QR, announce, settings)
 * 6. Consultation area + Call Next
 * 7. Redesigned queue cards
 */
export default function MobileDashboard({
  queue,
  stats,
  onCallNext,
  onAddPatient,
  onRemovePatient,
  onReorder,
  onEmergency,
  onShowQR,
  onCompleteConsultation,
  isCallingNext,
  isDoctorPresent,
  onToggleDoctorPresent,
  announcement,
  onAnnouncementClick,
  onAnnouncementClear,
}: MobileDashboardProps) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { clinic, logout } = useAuthStore();
  const { labels, isMedical, showAppointments } = useUILabels();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const toggleLanguage = () => {
    const newLang = i18n.language === 'fr' ? 'ar' : 'fr';
    i18n.changeLanguage(newLang);
  };

  // Separate queue into different sections
  // When doctor is not present, treat IN_CONSULTATION as just another waiting patient
  const inConsultation = isDoctorPresent ? queue.find(p => p.status === QueueStatus.IN_CONSULTATION) : null;
  const waitingQueue = isDoctorPresent
    ? queue.filter(p =>
        p.status === QueueStatus.WAITING ||
        p.status === QueueStatus.NOTIFIED
      )
    : queue.filter(p =>
        p.status === QueueStatus.WAITING ||
        p.status === QueueStatus.NOTIFIED ||
        p.status === QueueStatus.IN_CONSULTATION
      );

  // Morning empty state: no patients at all today
  const showMorningState = !isDoctorPresent && queue.length === 0 && (stats?.seen ?? 0) === 0;

  // Count for disabled state - also disabled when doctor is not present
  const canCallNext = isDoctorPresent && queue.some(p => p.status === QueueStatus.WAITING || p.status === QueueStatus.NOTIFIED);

  // Estimates calculations — use the smart effective avg from backend (same source as patient page)
  const avgConsultMins = stats?.effectiveAvgMins ?? clinic?.avgConsultationMins ?? 10;
  const now = new Date();

  // How long the current consultation has been running
  const elapsedConsultMins = inConsultation?.calledAt
    ? (now.getTime() - new Date(inConsultation.calledAt).getTime()) / 60000
    : 0;
  // Remaining time for the current consultation (can't be negative)
  const remainingCurrentMins = inConsultation
    ? Math.max(0, avgConsultMins - elapsedConsultMins)
    : 0;

  // "Attente moy" — show the average consultation duration (what patients care about)
  const avgWaitMins = avgConsultMins;

  // Next estimate: when the next patient will be called
  const nextEstTime = new Date(now.getTime() + remainingCurrentMins * 60000);
  const nextEstStr = `~${String(nextEstTime.getHours()).padStart(2, '0')}:${String(nextEstTime.getMinutes()).padStart(2, '0')}`;

  // End estimate: when the last patient in queue will be seen
  const endEstTime = new Date(
    now.getTime() + remainingCurrentMins * 60000 + (waitingQueue.length > 0 ? (waitingQueue.length - 1) * avgConsultMins * 60000 : 0)
  );
  const endEstStr = `~${String(endEstTime.getHours()).padStart(2, '0')}:${String(endEstTime.getMinutes()).padStart(2, '0')}`;

  // Wait time color helper
  const waitColorClass = (mins: number) => {
    if (mins >= 30) return 'text-red-500';
    if (mins >= 15) return 'text-amber-600';
    return 'text-green-600';
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-6">
      {/* Mobile Header */}
      <header className="bg-white px-4 py-3 border-b border-gray-200">
        <div className="flex justify-between items-center">
          {/* Left: Logo only */}
          <div>
            <Logo size="xs" />
          </div>

          {/* Center: Clinic/Store name */}
          {clinic && (
            <div className="text-center">
              {isMedical && <p className="text-[10px] text-gray-500 font-medium">Cabinet</p>}
              <h1 className="text-sm font-bold text-gray-900">{clinic.doctorName || clinic.name}</h1>
            </div>
          )}

          {/* Right: Language toggle and logout */}
          <div className="flex items-center gap-1">
            {webBrand.supportedLanguages.length > 1 && (
              <button
                onClick={toggleLanguage}
                className="px-2 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label={i18n.language === 'fr' ? 'Switch to Arabic' : 'Basculer vers le français'}
              >
                {i18n.language === 'fr' ? 'عربي' : 'FR'}
              </button>
            )}
            <button
              onClick={handleLogout}
              className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
              title={t('auth.logout')}
              aria-label={t('auth.logout')}
            >
              <span
                className="material-symbols-outlined text-lg"
                style={{ fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 20" }}
              >
                logout
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Compact Stats Bar */}
      <div className="bg-white px-4 py-3 border-b border-gray-100 flex items-center justify-around sticky top-0 z-10 shadow-sm">
        <div className="text-center">
          <p className="text-2xl font-bold text-primary-700">
            {(stats?.waiting || 0) + (!isDoctorPresent && queue.some(p => p.status === QueueStatus.IN_CONSULTATION) ? 1 : 0)}
          </p>
          <p className="text-xs text-gray-500">{t('queue.waiting')}</p>
        </div>
        <div className="w-px h-10 bg-gray-200"></div>
        <div className="text-center">
          <p className="text-2xl font-bold text-green-600">{isDoctorPresent && inConsultation ? 1 : 0}</p>
          <p className="text-xs text-gray-500">{t('queue.inConsultation')}</p>
        </div>
        <div className="w-px h-10 bg-gray-200"></div>
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-400">{stats?.seen || 0}</p>
          <p className="text-xs text-gray-500">{t('queue.seenToday', { count: stats?.seen || 0 }).replace(/\d+/, '').trim()}</p>
        </div>
      </div>

      {/* Estimates Bar */}
      {waitingQueue.length > 0 && (
        <div className="bg-white px-4 py-2.5 border-b border-gray-100 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <span
              className="material-symbols-outlined text-sm text-gray-400"
              style={{ fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 20" }}
            >
              avg_pace
            </span>
            {t('queue.avgWaitShort')}: <strong className="text-gray-800 font-semibold">{Math.round(avgWaitMins)} min</strong>
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <span
              className="material-symbols-outlined text-sm text-gray-400"
              style={{ fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 20" }}
            >
              schedule
            </span>
            {t('queue.nextEstimate')}: <strong className="text-gray-800 font-semibold">{nextEstStr}</strong>
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <span
              className="material-symbols-outlined text-sm text-gray-400"
              style={{ fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 20" }}
            >
              flag
            </span>
            {t('queue.endEstimate')}: <strong className="text-gray-800 font-semibold">{endEstStr}</strong>
          </div>
        </div>
      )}

      {/* Presence & Announcement Toggles */}
      <div className="px-4 py-3 flex gap-2">
        {/* Doctor Presence Toggle */}
        <button
          onClick={onToggleDoctorPresent}
          className={`flex-1 flex items-center justify-between px-3 py-3 rounded-xl font-medium transition-all ${
            isDoctorPresent
              ? 'bg-green-100 text-green-800 border-2 border-green-300'
              : 'bg-gray-100 text-gray-600 border-2 border-gray-200'
          }`}
          aria-label={isDoctorPresent ? labels.presenceOn : labels.presenceOff}
          aria-pressed={isDoctorPresent}
        >
          <div className="flex items-center gap-2 min-w-0">
            <span
              className={`material-symbols-outlined text-xl shrink-0 ${isDoctorPresent ? 'text-green-600' : 'text-gray-400'}`}
              style={{ fontVariationSettings: isDoctorPresent ? "'FILL' 1" : "'FILL' 0" }}
            >
              {isMedical ? 'stethoscope' : 'storefront'}
            </span>
            <span className="text-xs font-semibold truncate">
              {isDoctorPresent ? labels.presenceOn : labels.presenceOff}
            </span>
          </div>
          <div className={`w-10 h-6 rounded-full p-0.5 transition-colors shrink-0 ${isDoctorPresent ? 'bg-green-500' : 'bg-gray-300'}`}>
            <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${isDoctorPresent ? 'ltr:translate-x-4 rtl:-translate-x-4' : 'translate-x-0'}`} />
          </div>
        </button>

        {/* Announcement Toggle */}
        {onAnnouncementClick && (
          <button
            onClick={announcement ? onAnnouncementClear : onAnnouncementClick}
            className={`flex-1 flex items-center justify-between px-3 py-3 rounded-xl font-medium transition-all ${
              announcement
                ? 'bg-blue-50 text-blue-800 border-2 border-blue-300'
                : 'bg-gray-100 text-gray-600 border-2 border-gray-200'
            }`}
            aria-label={announcement ? t('announcement.toggleOn') : t('announcement.toggleOff')}
            aria-pressed={!!announcement}
          >
            <div className="flex items-center gap-2 min-w-0">
              <span
                className={`material-symbols-outlined text-xl shrink-0 ${announcement ? 'text-blue-600' : 'text-gray-400'}`}
                style={{ fontVariationSettings: announcement ? "'FILL' 1" : "'FILL' 0" }}
              >
                campaign
              </span>
              <span className="text-xs font-semibold truncate">
                {announcement ? t('announcement.toggleOn') : t('announcement.toggleOff')}
              </span>
            </div>
            <div className={`w-10 h-6 rounded-full p-0.5 transition-colors shrink-0 ${announcement ? 'bg-blue-500' : 'bg-gray-300'}`}>
              <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${announcement ? 'ltr:translate-x-4 rtl:-translate-x-4' : 'translate-x-0'}`} />
            </div>
          </button>
        )}
      </div>

      {/* Action Buttons — below presence toggle, no container */}
      <div className="mx-4 mb-3 flex gap-2">
        <button
          onClick={onAddPatient}
          className="flex-1 bg-white border border-gray-200 text-gray-700 font-semibold py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 active:bg-gray-50 shadow-sm transition-colors text-sm"
        >
          <span
            className="material-symbols-outlined text-xl"
            style={{ fontVariationSettings: "'FILL' 0, 'wght' 500, 'GRAD' 0, 'opsz' 20" }}
          >
            person_add
          </span>
          {labels.addCustomer}
        </button>
        <button
          onClick={onShowQR}
          className="bg-white border border-gray-200 text-gray-500 py-2.5 px-3 rounded-xl flex items-center justify-center active:bg-gray-50 shadow-sm transition-colors"
          title={t('qrCode.show')}
          aria-label={t('qrCode.show')}
        >
          <span
            className="material-symbols-outlined text-xl"
            style={{ fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 20" }}
          >
            qr_code_2
          </span>
        </button>
        <button
          onClick={() => navigate('/settings')}
          className="bg-white border border-gray-200 text-gray-500 py-2.5 px-3 rounded-xl flex items-center justify-center active:bg-gray-50 shadow-sm transition-colors"
          title={t('settings.title')}
          aria-label={t('settings.title')}
        >
          <span
            className="material-symbols-outlined text-xl"
            style={{ fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 20" }}
          >
            settings
          </span>
        </button>
      </div>

      {/* Side-by-side: En Consultation (33%) + Call Next Button (66%) */}
      {inConsultation && waitingQueue.length > 0 && (
        <div className="px-4 pt-5 pb-5">
          {/* Headers row - aligned */}
          <div className="flex gap-3 mb-2">
            <p className="flex-1 text-xs font-medium text-gray-500 uppercase tracking-wide flex items-center gap-1">
              <span
                className="material-symbols-outlined text-sm text-green-600"
                style={{ fontVariationSettings: "'FILL' 1, 'wght' 500, 'GRAD' 0, 'opsz' 20" }}
              >
                stethoscope
              </span>
              {t('queue.inConsultation')}
            </p>
            <p className="flex-[2] text-xs font-medium text-gray-500 uppercase tracking-wide flex items-center gap-1">
              <span
                className="material-symbols-outlined text-sm text-primary-600"
                style={{ fontVariationSettings: "'FILL' 1, 'wght' 500, 'GRAD' 0, 'opsz' 20" }}
              >
                arrow_forward
              </span>
              {t('queue.callNext')}
            </p>
          </div>

          {/* Cards row - aligned */}
          <div className="flex gap-3 items-stretch">
            {/* En Consultation - Compact Card (33%) */}
            <div className="flex-1 bg-green-50 border-2 border-green-200 rounded-2xl p-3 flex flex-col justify-center">
              <div className="flex flex-col items-center text-center">
                <div className="w-10 h-10 bg-green-200 rounded-full flex items-center justify-center mb-2">
                  <span
                    className="material-symbols-outlined text-green-700"
                    style={{ fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}
                  >
                    person
                  </span>
                </div>
                <p className="font-semibold text-gray-900 text-sm truncate w-full">{inConsultation.patientName || t('queue.patientName')}</p>
                <div className="flex items-center gap-1 text-xs text-green-600 mt-1">
                  <span
                    className="material-symbols-outlined text-sm"
                    style={{ fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 20" }}
                  >
                    schedule
                  </span>
                  {inConsultation.calledAt ? getWaitingMinutes(inConsultation.calledAt) : 0} min
                </div>
              </div>
            </div>

            {/* Call Next - Elevated Button (66%) */}
            <button
              onClick={onCallNext}
              disabled={isCallingNext || !canCallNext}
              className="flex-[2] bg-primary-600 text-white font-semibold rounded-2xl flex items-center justify-center gap-3 active:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary-600/30 transition-all"
            >
              <span
                className="material-symbols-outlined text-2xl"
                style={{ fontVariationSettings: "'FILL' 1, 'wght' 500, 'GRAD' 0, 'opsz' 24" }}
              >
                {isCallingNext ? 'sync' : 'directions_walk'}
              </span>
              <span className="text-base">
                {isCallingNext ? t('common.loading') : t('queue.callNext')}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Current Consultation Section - Full width when queue is empty */}
      {inConsultation && waitingQueue.length === 0 && (
        <div className="px-4 pt-5 pb-5">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1">
            <span
              className="material-symbols-outlined text-sm text-green-600"
              style={{ fontVariationSettings: "'FILL' 1, 'wght' 500, 'GRAD' 0, 'opsz' 20" }}
            >
              stethoscope
            </span>
            {t('queue.inConsultation')}
            {waitingQueue.length === 0 && (
              <span className="ml-2 text-xs font-normal text-gray-400">
                ({t('queue.lastPatient')})
              </span>
            )}
          </p>
          <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-200 rounded-full flex items-center justify-center">
                  <span
                    className="material-symbols-outlined text-green-700"
                    style={{ fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}
                  >
                    person
                  </span>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{inConsultation.patientName || t('queue.patientName')}</p>
                  <div className="flex items-center gap-3 text-sm text-green-600">
                    <span className="flex items-center gap-1">
                      <span
                        className="material-symbols-outlined text-base"
                        style={{ fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 20" }}
                      >
                        schedule
                      </span>
                      {inConsultation.calledAt ? getWaitingMinutes(inConsultation.calledAt) : 0} min
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {waitingQueue.length === 0 && onCompleteConsultation ? (
                  <button
                    onClick={onCompleteConsultation}
                    className="p-2 text-green-600 hover:bg-green-100 rounded-full transition-colors"
                    aria-label={t('queue.completeConsultation')}
                    title={t('queue.completeConsultation')}
                  >
                    <span
                      className="material-symbols-outlined text-xl"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      check_circle
                    </span>
                  </button>
                ) : (
                  <a
                    href={`/patient/${inConsultation.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-green-600 hover:bg-green-100 rounded-full transition-colors"
                    aria-label={t('queue.viewPatientStatus')}
                  >
                    <span className="material-symbols-outlined text-xl">open_in_new</span>
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Call Next - Full width when no one in consultation but there are waiting patients */}
      {!inConsultation && waitingQueue.length > 0 && (
        <div className="px-4 pt-5 pb-5">
          <button
            onClick={onCallNext}
            disabled={isCallingNext || !canCallNext}
            className="w-full bg-primary-600 text-white font-semibold py-4 rounded-2xl flex items-center justify-center gap-2 active:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary-600/20 transition-all"
          >
            <span
              className="material-symbols-outlined text-xl"
              style={{ fontVariationSettings: "'FILL' 1, 'wght' 500, 'GRAD' 0, 'opsz' 24" }}
            >
              {isCallingNext ? 'sync' : 'directions_walk'}
            </span>
            {isCallingNext ? t('common.loading') : t('queue.callNext')}
          </button>
        </div>
      )}

      {/* Remaining Queue — Redesigned Patient Cards */}
      {waitingQueue.length > 0 && (
        <div className="px-4 pb-6">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2.5 flex items-center gap-1.5">
            <span
              className="material-symbols-outlined text-base"
              style={{ fontVariationSettings: "'FILL' 0, 'wght' 500, 'GRAD' 0, 'opsz' 20" }}
            >
              groups
            </span>
            {t('queue.title')}
          </p>
          <div className="space-y-3">
            {waitingQueue.map((entry) => {
              // When doctor is present: position - 1 (since #1 is in consultation)
              // When doctor is absent: show actual position (first = #1)
              const displayPosition = isDoctorPresent ? entry.position - 1 : entry.position;
              const waitingMins = getWaitingMinutes(entry.arrivedAt);
              const isNotified = entry.status === QueueStatus.NOTIFIED;
              const hasAppointment = !!entry.appointmentTime;
              const isFirstInQueue = displayPosition === 1;
              const isLastInQueue = entry.position >= queue.filter(p =>
                p.status === QueueStatus.WAITING || p.status === QueueStatus.NOTIFIED
              ).length + (inConsultation ? 1 : 0);

              return (
                <div key={entry.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  {/* Top section: position badge + name + details */}
                  <div className="p-3.5 pb-2.5 flex items-start gap-3">
                    {/* Position badge */}
                    <span className="w-11 h-11 bg-primary-100 rounded-xl flex items-center justify-center text-base font-bold text-primary-700 flex-shrink-0">
                      #{displayPosition}
                    </span>

                    {/* Patient info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-[15px] truncate">
                        {entry.patientName || t('queue.patientName')}
                      </p>
                      {/* Details inline */}
                      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1">
                        {/* Arrival time */}
                        <div className="flex items-center gap-1 text-[13px] text-gray-600">
                          <span
                            className="material-symbols-outlined text-[15px] text-gray-400"
                            style={{ fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 20" }}
                          >
                            login
                          </span>
                          {formatTime(entry.arrivedAt)}
                        </div>
                        {/* Appointment time — only for medical with appointment */}
                        {showAppointments && hasAppointment && (
                          <div className="flex items-center gap-1 text-[13px]">
                            <span
                              className="material-symbols-outlined text-[15px] text-purple-400"
                              style={{ fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 20" }}
                            >
                              event
                            </span>
                            <span className="text-purple-700 font-medium">{formatTime(entry.appointmentTime!)}</span>
                          </div>
                        )}
                        {/* Wait time — color-coded */}
                        <div className="flex items-center gap-1 text-[13px]">
                          <span
                            className="material-symbols-outlined text-[15px] text-gray-400"
                            style={{ fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 20" }}
                          >
                            hourglass_empty
                          </span>
                          <span className={`font-medium ${waitColorClass(waitingMins)}`}>{waitingMins} min</span>
                        </div>
                      </div>
                      {/* Notified badge */}
                      {isNotified && (
                        <div className="inline-flex items-center gap-1 mt-1 text-[11px] font-semibold text-primary-600 bg-primary-50 px-2 py-0.5 rounded-md">
                          <span
                            className="material-symbols-outlined text-[13px] text-primary-500"
                            style={{ fontVariationSettings: "'FILL' 1" }}
                          >
                            notifications_active
                          </span>
                          {t('queue.notified')}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Bottom action row: status icons (left) + action buttons (right) */}
                  <div className="flex items-center justify-between px-3.5 py-2 border-t border-gray-100">
                    {/* Status icons — walk-in/appointment first, then SMS */}
                    <div className="flex gap-1.5">
                      {/* Walk-in or Appointment icon */}
                      {showAppointments && (
                        hasAppointment ? (
                          <div
                            className="w-7 h-7 rounded-lg bg-purple-600 flex items-center justify-center"
                            title={`${t('queue.scheduled')} ${formatTime(entry.appointmentTime!)}`}
                          >
                            <span
                              className="material-symbols-outlined text-white text-sm"
                              style={{ fontVariationSettings: "'FILL' 1" }}
                            >
                              event
                            </span>
                          </div>
                        ) : (
                          <div
                            className="w-7 h-7 rounded-lg bg-purple-50 flex items-center justify-center"
                            title={t('queue.walkIn')}
                          >
                            <span className="material-symbols-outlined text-purple-400 text-base">
                              directions_walk
                            </span>
                          </div>
                        )
                      )}
                    </div>

                    {/* Action buttons — icon-only squares */}
                    <div className="flex gap-1.5">
                      {/* Priority / Emergency */}
                      {!isFirstInQueue && (
                        <button
                          onClick={() => onEmergency(entry.id)}
                          className="w-9 h-9 rounded-[10px] bg-amber-50 text-amber-600 hover:bg-amber-100 inline-flex items-center justify-center transition-colors"
                          title={t('queue.priority')}
                          aria-label={t('queue.priority')}
                        >
                          <span
                            className="material-symbols-outlined text-lg"
                            style={{ fontVariationSettings: "'FILL' 1" }}
                          >
                            star
                          </span>
                        </button>
                      )}
                      {/* Move up */}
                      {!isFirstInQueue && (
                        <button
                          onClick={() => onReorder(entry.id, entry.position - 1)}
                          className="w-9 h-9 rounded-[10px] bg-gray-100 text-gray-600 hover:bg-gray-200 inline-flex items-center justify-center transition-colors"
                          title={t('queue.moveUp')}
                          aria-label={t('queue.moveUp')}
                        >
                          <span className="material-symbols-outlined text-lg">arrow_upward</span>
                        </button>
                      )}
                      {/* Move down */}
                      {!isLastInQueue && (
                        <button
                          onClick={() => onReorder(entry.id, entry.position + 1)}
                          className="w-9 h-9 rounded-[10px] bg-gray-100 text-gray-600 hover:bg-gray-200 inline-flex items-center justify-center transition-colors"
                          title={t('queue.moveDown')}
                          aria-label={t('queue.moveDown')}
                        >
                          <span className="material-symbols-outlined text-lg">arrow_downward</span>
                        </button>
                      )}
                      {/* Remove */}
                      <button
                        onClick={() => onRemovePatient(entry.id)}
                        className="w-9 h-9 rounded-[10px] bg-red-50 text-red-500 hover:bg-red-100 inline-flex items-center justify-center transition-colors"
                        title={t('queue.remove')}
                        aria-label={t('queue.remove')}
                      >
                        <span className="material-symbols-outlined text-lg">close</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Morning Empty State */}
      {showMorningState ? (
        <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
          <MorningHeroCard
            waitingCount={0}
            seenCount={0}
            variant="mobile"
            onAddPatientClick={onAddPatient}
          />
          {/* Share shortcuts */}
          <div style={{ display: 'flex', gap: 8 }}>
            {[
              { icon: 'qr_code_2', label: t('dashboard.share.showQr', 'Afficher QR'), onClick: onShowQR },
              { icon: 'chat', label: t('dashboard.share.whatsapp', 'WhatsApp'), onClick: onShowQR },
              { icon: 'content_copy', label: t('dashboard.share.copyLink', 'Copier lien'), onClick: onShowQR },
            ].map((btn) => (
              <button
                key={btn.icon}
                type="button"
                onClick={btn.onClick}
                style={{
                  flex: 1,
                  background: '#fff',
                  border: '1px solid #E8E6DF',
                  borderRadius: 10,
                  padding: '10px 8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  fontSize: 12,
                  fontWeight: 500,
                  color: '#6B6960',
                  cursor: 'pointer',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>{btn.icon}</span>
                {btn.label}
              </button>
            ))}
          </div>
          <CollapsedQueueBar patientCount={0} variant="mobile" />
        </div>
      ) : queue.length === 0 ? (
        <div className="px-4 py-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span
              className="material-symbols-outlined text-3xl text-gray-400"
              style={{ fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}
            >
              groups
            </span>
          </div>
          <p className="text-gray-500">{labels.noCustomers}</p>
        </div>
      ) : null}
    </div>
  );
}
