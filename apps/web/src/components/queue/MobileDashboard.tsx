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
  onFillQueue?: () => void;
  isCallingNext: boolean;
  isDoctorPresent: boolean;
  onToggleDoctorPresent: () => void;
  isFillingQueue?: boolean;
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
  onFillQueue,
  isCallingNext,
  isDoctorPresent,
  onToggleDoctorPresent,
  isFillingQueue,
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
          {/* Toggle switch */}
          <div className={`w-12 h-7 rounded-full p-0.5 transition-colors ${isDoctorPresent ? 'bg-green-500' : 'bg-gray-300'}`}>
            <div className={`w-6 h-6 rounded-full bg-white shadow transition-transform ${isDoctorPresent ? 'translate-x-5' : 'translate-x-0'}`} />
          </div>
        </button>
      </div>

      {/* Side-by-side: En Consultation (33%) + Appeler Suivant (66%) */}
      {inConsultation && nextPatient && (
        <div className="px-4 pt-5 pb-5 flex gap-3">
          {/* En Consultation - Compact Card (33%) */}
          <div className="flex-1">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1">
              <span
                className="material-symbols-outlined text-sm text-green-600"
                style={{ fontVariationSettings: "'FILL' 1, 'wght' 500, 'GRAD' 0, 'opsz' 20" }}
              >
                stethoscope
              </span>
              {t('queue.inConsultation')}
            </p>
            <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-3 h-[calc(100%-1.75rem)]">
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
          </div>

          {/* Appeler Suivant - Main Card (66%) */}
          <div className="flex-[2]">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1">
              <span
                className="material-symbols-outlined text-sm text-primary-600"
                style={{ fontVariationSettings: "'FILL' 1, 'wght' 500, 'GRAD' 0, 'opsz' 20" }}
              >
                arrow_forward
              </span>
              {t('queue.callNext')}
            </p>
            <div className="bg-primary-50 border-2 border-primary-300 rounded-2xl p-3">
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
                <a
                  href={`/patient/${inConsultation.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 text-green-600 hover:bg-green-100 rounded-full transition-colors"
                  aria-label={t('queue.viewPatientStatus')}
                >
                  <span className="material-symbols-outlined text-xl">open_in_new</span>
                </a>
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

      {/* Fill Queue Demo Button */}
      {onFillQueue && (
        <div className="px-4 pb-6">
          <button
            onClick={onFillQueue}
            disabled={isFillingQueue}
            className="w-full bg-purple-50 border border-purple-200 text-purple-700 font-medium py-2.5 rounded-xl flex items-center justify-center gap-2 active:bg-purple-100 transition-colors disabled:opacity-50"
          >
            <span
              className="material-symbols-outlined text-lg"
              style={{ fontVariationSettings: "'FILL' 0, 'wght' 500, 'GRAD' 0, 'opsz' 20" }}
            >
              {isFillingQueue ? 'hourglass_empty' : 'group_add'}
            </span>
            {isFillingQueue ? t('queue.fillingQueue') : t('queue.fillQueue')}
          </button>
        </div>
      )}

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
          <div className="bg-white rounded-2xl shadow-sm divide-y divide-gray-100 overflow-hidden">
            {waitingQueue.map((entry) => {
              // When doctor is present: position - 1 (since #1 is in consultation)
              // When doctor is absent: show actual position (first = #1)
              const displayPosition = isDoctorPresent ? entry.position - 1 : entry.position;
              const waitingMins = getWaitingMinutes(entry.arrivedAt);

              return (
                <div key={entry.id} className="p-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center text-sm font-bold text-gray-600">
                      #{displayPosition}
                    </span>
                    <div>
                      <p className="font-medium text-gray-900">{entry.patientName || t('queue.patientName')}</p>
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span className="flex items-center gap-0.5">
                          <span
                            className="material-symbols-outlined text-sm"
                            style={{ fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 20" }}
                            title={t('queue.arrivedAt')}
                          >
                            login
                          </span>
                          {formatTime(entry.arrivedAt)}
                        </span>
                        <span className="flex items-center gap-0.5">
                          <span
                            className="material-symbols-outlined text-sm"
                            style={{ fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 20" }}
                            title={t('queue.avgWaitLabel')}
                          >
                            hourglass_top
                          </span>
                          {waitingMins} min
                        </span>
                        {entry.appointmentTime && (
                          <span className="flex items-center gap-0.5 text-purple-600">
                            <span
                              className="material-symbols-outlined text-sm"
                              style={{ fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 20" }}
                              title={t('queue.appointmentTime')}
                            >
                              calendar_clock
                            </span>
                            {formatTime(entry.appointmentTime)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5">
                    {/* Move up button */}
                    {entry.position > 1 && (
                      <button
                        onClick={() => onReorder(entry.id, entry.position - 1)}
                        className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-full transition-colors"
                        title={t('queue.moveUp')}
                        aria-label={t('queue.moveUp')}
                      >
                        <span className="material-symbols-outlined text-lg">arrow_upward</span>
                      </button>
                    )}
                    {/* Move down button */}
                    {entry.position < queue.length && (
                      <button
                        onClick={() => onReorder(entry.id, entry.position + 1)}
                        className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-full transition-colors"
                        title={t('queue.moveDown')}
                        aria-label={t('queue.moveDown')}
                      >
                        <span className="material-symbols-outlined text-lg">arrow_downward</span>
                      </button>
                    )}
                    {/* Emergency button - move patient to see doctor immediately */}
                    {entry.position > 1 && (
                      <button
                        onClick={() => onEmergency(entry.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                        title={t('queue.emergency')}
                        aria-label={t('queue.emergency')}
                      >
                        <span className="material-symbols-outlined text-lg">e911_emergency</span>
                      </button>
                    )}
                    {/* Delete button */}
                    <button
                      onClick={() => onRemovePatient(entry.id)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                      title={t('common.delete')}
                      aria-label={t('common.delete')}
                    >
                      <span className="material-symbols-outlined text-lg">close</span>
                    </button>
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
