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
export default function WaitEstimateCard({ position, avgConsultationMins = 10 }: WaitEstimateCardProps) {
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
    <div className="bg-white/80 backdrop-blur border border-primary-100 rounded-xl p-4 h-full flex flex-col">
      {/* Top row: icon + label */}
      <div className="flex items-center gap-2 mb-2">
        <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
          <span
            className="material-symbols-outlined text-lg text-primary-600"
            style={{ fontVariationSettings: "'FILL' 1" }}
            aria-hidden="true"
          >
            schedule
          </span>
        </div>
        <p className="text-xs font-medium text-primary-600 uppercase tracking-wide">
          {t('patient.estimatedWait')}
        </p>
      </div>
      {/* Bottom: large time display */}
      <div className="flex-1 flex items-center justify-center">
        <p className="text-2xl font-bold text-gray-800 text-center w-full">
          {formatWaitTime(estimatedMinutes)}
        </p>
      </div>
    </div>
  );
}
