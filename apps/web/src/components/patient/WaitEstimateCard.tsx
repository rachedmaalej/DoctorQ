import { useTranslation } from 'react-i18next';

interface WaitEstimateCardProps {
  position: number;
  avgConsultationMins?: number;
}

/**
 * WaitEstimateCard - Displays estimated wait time based on queue position
 * Shows dynamic wait estimate that updates as patient moves through queue
 * More useful to anxious patients than random fun facts
 */
export default function WaitEstimateCard({ position, avgConsultationMins = 15 }: WaitEstimateCardProps) {
  const { t } = useTranslation();

  // Calculate estimated wait: (people ahead) * avg consultation time
  const patientsAhead = Math.max(0, position - 1);
  const estimatedMinutes = patientsAhead * avgConsultationMins;

  // Format time display
  const formatWaitTime = (minutes: number): string => {
    if (minutes < 5) return t('patient.estimatedWaitVeryShort') || '< 5 min';
    if (minutes < 60) return `~${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const remainingMins = minutes % 60;
    if (remainingMins === 0) {
      return `~${hours}h`;
    }
    return `~${hours}h ${remainingMins}min`;
  };

  return (
    <div className="bg-white/80 backdrop-blur border border-primary-100 rounded-xl p-4">
      <div className="flex items-start gap-3">
        <span
          className="material-symbols-outlined text-2xl text-primary-500 flex-shrink-0"
          style={{ fontVariationSettings: "'FILL' 1" }}
          aria-hidden="true"
        >
          schedule
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-primary-600 uppercase tracking-wide mb-1">
            {t('patient.estimatedWait')}
          </p>
          <p className="text-lg font-semibold text-gray-800">
            {formatWaitTime(estimatedMinutes)}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            {t('patient.patientsAhead', { count: patientsAhead })}
          </p>
        </div>
      </div>
    </div>
  );
}
