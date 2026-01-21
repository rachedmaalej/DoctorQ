import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { QueueEntry, QueueStats } from '@/types';
import { QueueStatus } from '@/types';
import { useAuthStore } from '@/stores/authStore';
import Logo from '@/components/ui/Logo';
import { formatTime, getWaitingMinutes } from '@/lib/time';

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
}


/**
 * Queue-First Mobile Dashboard
 * Prioritizes the queue list with clear hierarchy:
 * 1. Compact stats bar
 * 2. Current patient in consultation (if any)
 * 3. Next patient with prominent call action
 * 4. Remaining queue with icons for time info
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
}: MobileDashboardProps) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { clinic, logout } = useAuthStore();

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
  const nextPatient = isDoctorPresent ? queue.find(p => p.status === QueueStatus.NOTIFIED) : null;
  const waitingQueue = isDoctorPresent
    ? queue.filter(p =>
        p.status === QueueStatus.WAITING ||
        (p.status === QueueStatus.NOTIFIED && p.id !== nextPatient?.id)
      )
    : queue.filter(p =>
        p.status === QueueStatus.WAITING ||
        p.status === QueueStatus.NOTIFIED ||
        p.status === QueueStatus.IN_CONSULTATION
      );

  // Count for disabled state - also disabled when doctor is not present
  const canCallNext = isDoctorPresent && queue.some(p => p.status === QueueStatus.WAITING || p.status === QueueStatus.NOTIFIED);

  return (
    <div className="min-h-screen bg-gray-50 pb-6">
      {/* Mobile Header */}
      <header className="bg-white px-4 py-3 border-b border-gray-200">
        <div className="flex justify-between items-center">
          {/* Left: Logo only */}
          <div>
            <Logo size="xs" />
          </div>

          {/* Center: Clinic name */}
          {clinic && (
            <div className="text-center">
              <p className="text-[10px] text-gray-500 font-medium">Cabinet</p>
              <h1 className="text-sm font-bold text-gray-900">{clinic.doctorName || clinic.name}</h1>
            </div>
          )}

          {/* Right: Language toggle and logout */}
          <div className="flex items-center gap-1">
            <button
              onClick={toggleLanguage}
              className="px-2 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label={i18n.language === 'fr' ? 'Switch to Arabic' : 'Basculer vers le français'}
            >
              {i18n.language === 'fr' ? 'عربي' : 'FR'}
            </button>
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
          {/* When doctor is absent, add the IN_CONSULTATION patient to waiting count */}
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

      {/* Doctor Present Toggle */}
      <div className="px-4 py-3">
        <button
          onClick={onToggleDoctorPresent}
          className={`w-full flex items-center justify-between px-4 py-3 rounded-xl font-medium transition-all ${
            isDoctorPresent
              ? 'bg-green-100 text-green-800 border-2 border-green-300'
              : 'bg-gray-100 text-gray-600 border-2 border-gray-200'
          }`}
          aria-label={isDoctorPresent ? t('queue.doctorPresent') : t('queue.doctorNotPresent')}
          aria-pressed={isDoctorPresent}
        >
          <div className="flex items-center gap-3">
            <span
              className={`material-symbols-outlined text-2xl ${isDoctorPresent ? 'text-green-600' : 'text-gray-400'}`}
              style={{ fontVariationSettings: isDoctorPresent ? "'FILL' 1" : "'FILL' 0" }}
            >
              stethoscope
            </span>
            <span className="text-sm font-semibold">
              {isDoctorPresent ? t('queue.doctorPresent') : t('queue.doctorNotPresent')}
            </span>
          </div>
          {/* Toggle switch - RTL aware */}
          <div className={`w-12 h-7 rounded-full p-0.5 transition-colors ${isDoctorPresent ? 'bg-green-500' : 'bg-gray-300'}`}>
            <div className={`w-6 h-6 rounded-full bg-white shadow transition-transform ${isDoctorPresent ? 'ltr:translate-x-5 rtl:-translate-x-5' : 'translate-x-0'}`} />
          </div>
        </button>
      </div>

      {/* Side-by-side: En Consultation (33%) + Appeler Suivant (66%) */}
      {inConsultation && nextPatient && (
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

            {/* Appeler Suivant - Main Card (66%) */}
            <div className="flex-[2] bg-primary-50 border-2 border-primary-300 rounded-2xl p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-primary-200 rounded-full flex items-center justify-center">
                    <span className="text-primary-700 font-bold text-sm">#1</span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{nextPatient.patientName || t('queue.patientName')}</p>
                    <div className="flex items-center gap-1 text-xs text-primary-600">
                      <span
                        className="material-symbols-outlined text-sm"
                        style={{ fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 20" }}
                      >
                        notifications_active
                      </span>
                      <span>{t('queue.notified')}</span>
                      <span className="mx-0.5">·</span>
                      <span
                        className="material-symbols-outlined text-sm"
                        style={{ fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 20" }}
                      >
                        hourglass_top
                      </span>
                      <span>{getWaitingMinutes(nextPatient.arrivedAt)} min</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => onRemovePatient(nextPatient.id)}
                  className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                  aria-label={t('common.delete')}
                >
                  <span className="material-symbols-outlined text-lg">close</span>
                </button>
              </div>
              <button
                onClick={onCallNext}
                disabled={isCallingNext}
                className="w-full bg-primary-600 text-white font-semibold py-2.5 rounded-xl flex items-center justify-center gap-2 active:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary-600/20 transition-all text-sm"
              >
                <span
                  className="material-symbols-outlined text-lg"
                  style={{ fontVariationSettings: "'FILL' 1, 'wght' 500, 'GRAD' 0, 'opsz' 24" }}
                >
                  {isCallingNext ? 'sync' : 'directions_walk'}
                </span>
                {isCallingNext
                  ? t('common.loading')
                  : `${t('queue.call')} ${nextPatient.patientName || ''}`
                }
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Current Consultation Section - Full width when no next patient */}
      {inConsultation && !nextPatient && (
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
                {/* Show complete button when this is the last patient, otherwise show view status link */}
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

      {/* Next Patient Section - Full width when no one in consultation */}
      {nextPatient && !inConsultation && (
        <div className="px-4 pt-5 pb-5">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1">
            <span
              className="material-symbols-outlined text-sm text-primary-600"
              style={{ fontVariationSettings: "'FILL' 1, 'wght' 500, 'GRAD' 0, 'opsz' 20" }}
            >
              arrow_forward
            </span>
            {t('queue.callNext')}
          </p>
          <div className="bg-primary-50 border-2 border-primary-300 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-primary-200 rounded-full flex items-center justify-center">
                  <span className="text-primary-700 font-bold">#1</span>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{nextPatient.patientName || t('queue.patientName')}</p>
                  <div className="flex items-center gap-1 text-sm text-primary-600">
                    <span
                      className="material-symbols-outlined text-base"
                      style={{ fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 20" }}
                    >
                      notifications_active
                    </span>
                    <span>{t('queue.notified')}</span>
                    <span className="mx-1">·</span>
                    <span
                      className="material-symbols-outlined text-base"
                      style={{ fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 20" }}
                    >
                      hourglass_top
                    </span>
                    <span>{getWaitingMinutes(nextPatient.arrivedAt)} min</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <a
                  href={`/patient/${nextPatient.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 text-primary-600 hover:bg-primary-100 rounded-full transition-colors"
                  aria-label={t('queue.viewPatientStatus')}
                >
                  <span className="material-symbols-outlined text-xl">open_in_new</span>
                </a>
                <button
                  onClick={() => onRemovePatient(nextPatient.id)}
                  className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                  aria-label={t('common.delete')}
                >
                  <span className="material-symbols-outlined text-xl">close</span>
                </button>
              </div>
            </div>
            <button
              onClick={onCallNext}
              disabled={isCallingNext}
              className="w-full bg-primary-600 text-white font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2 active:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary-600/20 transition-all"
            >
              <span
                className="material-symbols-outlined text-xl"
                style={{ fontVariationSettings: "'FILL' 1, 'wght' 500, 'GRAD' 0, 'opsz' 24" }}
              >
                {isCallingNext ? 'sync' : 'directions_walk'}
              </span>
              {isCallingNext
                ? t('common.loading')
                : `${t('queue.call')} ${nextPatient.patientName || ''}`
              }
            </button>
          </div>
        </div>
      )}

      {/* Call Next when no one is notified but there are waiting patients */}
      {!nextPatient && waitingQueue.length > 0 && (
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

      {/* Add Patient & QR Code Buttons - positioned above queue */}
      <div className="px-4 pb-3 flex gap-3">
        <button
          onClick={onAddPatient}
          className="flex-[3] bg-white border border-gray-200 text-gray-700 font-medium py-3 rounded-xl flex items-center justify-center gap-2 active:bg-gray-50 shadow-sm transition-colors"
        >
          <span
            className="material-symbols-outlined text-xl"
            style={{ fontVariationSettings: "'FILL' 0, 'wght' 500, 'GRAD' 0, 'opsz' 24" }}
          >
            person_add
          </span>
          {t('queue.addPatient')}
        </button>
        <button
          onClick={onShowQR}
          className="flex-1 bg-white border border-gray-200 text-gray-500 py-3 rounded-xl flex items-center justify-center active:bg-gray-50 shadow-sm transition-colors"
          title={t('qrCode.show')}
          aria-label={t('qrCode.show')}
        >
          <span
            className="material-symbols-outlined text-xl"
            style={{ fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}
          >
            qr_code_2
          </span>
        </button>
      </div>

      {/* Remaining Queue */}
      {waitingQueue.length > 0 && (
        <div className="px-4 pb-6">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1">
            <span
              className="material-symbols-outlined text-sm"
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

              return (
                <div key={entry.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                  <div className="flex items-center gap-4">
                    {/* Position badge - vertically centered */}
                    <span className="w-14 h-14 bg-primary-100 rounded-2xl flex items-center justify-center text-xl font-bold text-primary-700 flex-shrink-0">
                      #{displayPosition}
                    </span>

                    {/* Patient info - stacked vertically */}
                    <div className="flex-1 min-w-0">
                      {/* Name */}
                      <p className="font-semibold text-gray-900 text-base truncate">
                        {entry.patientName || t('queue.patientName')}
                      </p>

                      {/* Info rows stacked vertically */}
                      <div className="mt-1.5 space-y-0.5">
                        {/* Arrival time */}
                        <div className="flex items-center gap-1.5 text-sm text-gray-600">
                          <span
                            className="material-symbols-outlined text-base text-gray-400"
                            style={{ fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 20" }}
                          >
                            login
                          </span>
                          <span>{formatTime(entry.arrivedAt)}</span>
                        </div>

                        {/* Appointment time */}
                        <div className="flex items-center gap-1.5 text-sm">
                          <span
                            className="material-symbols-outlined text-base text-purple-400"
                            style={{ fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 20" }}
                          >
                            event
                          </span>
                          {entry.appointmentTime ? (
                            <span className="text-purple-700 font-medium">{formatTime(entry.appointmentTime)}</span>
                          ) : (
                            <span className="text-gray-400">{t('queue.walkIn') || 'Sans RDV'}</span>
                          )}
                        </div>

                        {/* Wait time */}
                        <div className="flex items-center gap-1.5 text-sm text-gray-600">
                          <span
                            className="material-symbols-outlined text-base text-gray-400"
                            style={{ fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 20" }}
                          >
                            hourglass_empty
                          </span>
                          <span>{waitingMins} min</span>
                        </div>
                      </div>
                    </div>

                    {/* Action buttons - 2x2 grid: up/emergency on top, down/delete on bottom */}
                    <div className="flex-shrink-0 grid grid-cols-2 gap-2">
                      {/* Row 1: Move up | Emergency */}
                      {entry.position > 1 ? (
                        <button
                          onClick={() => onReorder(entry.id, entry.position - 1)}
                          className="w-11 h-11 rounded-xl bg-gray-100 text-gray-500 hover:text-primary-600 hover:bg-primary-50 transition-colors inline-flex items-center justify-center"
                          title={t('queue.moveUp')}
                          aria-label={t('queue.moveUp')}
                        >
                          <span className="material-symbols-outlined text-xl">arrow_upward</span>
                        </button>
                      ) : (
                        <div className="w-11 h-11" />
                      )}

                      {entry.position > 1 ? (
                        <button
                          onClick={() => onEmergency(entry.id)}
                          className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700 transition-colors inline-flex items-center justify-center"
                          title={t('queue.emergency')}
                          aria-label={t('queue.emergency')}
                        >
                          <span className="material-symbols-outlined text-xl">e911_emergency</span>
                        </button>
                      ) : (
                        <div className="w-11 h-11" />
                      )}

                      {/* Row 2: Move down | Delete */}
                      {entry.position < queue.length ? (
                        <button
                          onClick={() => onReorder(entry.id, entry.position + 1)}
                          className="w-11 h-11 rounded-xl bg-gray-100 text-gray-500 hover:text-primary-600 hover:bg-primary-50 transition-colors inline-flex items-center justify-center"
                          title={t('queue.moveDown')}
                          aria-label={t('queue.moveDown')}
                        >
                          <span className="material-symbols-outlined text-xl">arrow_downward</span>
                        </button>
                      ) : (
                        <div className="w-11 h-11" />
                      )}

                      <button
                        onClick={() => onRemovePatient(entry.id)}
                        className="w-11 h-11 rounded-xl bg-red-50 text-red-600 hover:text-red-700 hover:bg-red-100 transition-colors inline-flex items-center justify-center"
                        title={t('common.delete')}
                        aria-label={t('common.delete')}
                      >
                        <span className="material-symbols-outlined text-xl">close</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty State */}
      {queue.length === 0 && (
        <div className="px-4 py-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span
              className="material-symbols-outlined text-3xl text-gray-400"
              style={{ fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}
            >
              groups
            </span>
          </div>
          <p className="text-gray-500">{t('queue.noPatients')}</p>
        </div>
      )}
    </div>
  );
}
