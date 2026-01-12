import { useTranslation } from 'react-i18next';
import clsx from 'clsx';

export type TicketColorScheme = 'calm' | 'teal' | 'amber' | 'green';

interface TicketCardProps {
  position: number;
  clinicName?: string;
  estimatedWaitMins?: number;
  colorScheme: TicketColorScheme;
  animate?: boolean;
  patientsAhead?: number;
}

const colorSchemeStyles: Record<TicketColorScheme, {
  card: string;
  position: string;
  text: string;
  accent: string;
}> = {
  calm: {
    card: 'bg-white border-primary-200',
    position: 'text-primary-700 bg-primary-50',
    text: 'text-gray-600',
    accent: 'text-primary-600',
  },
  teal: {
    card: 'bg-white border-teal-300',
    position: 'text-teal-700 bg-teal-50',
    text: 'text-gray-600',
    accent: 'text-teal-600',
  },
  amber: {
    card: 'bg-amber-50 border-amber-400',
    position: 'text-amber-800 bg-amber-100',
    text: 'text-amber-700',
    accent: 'text-amber-700',
  },
  green: {
    card: 'bg-green-50 border-green-400',
    position: 'text-green-800 bg-green-100',
    text: 'text-green-700',
    accent: 'text-green-700',
  },
};

export default function TicketCard({
  position,
  clinicName,
  estimatedWaitMins,
  colorScheme,
  animate = false,
  patientsAhead,
}: TicketCardProps) {
  const { t } = useTranslation();
  const styles = colorSchemeStyles[colorScheme];

  return (
    <div
      className={clsx(
        'relative rounded-2xl border-2 shadow-lg overflow-hidden',
        styles.card,
        animate && 'animate-pulse-urgent'
      )}
    >
      {/* Ticket notches */}
      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-8 bg-gray-100 rounded-r-full -ml-2" />
      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-8 bg-gray-100 rounded-l-full -mr-2" />

      <div className="px-8 py-6">
        {/* Position number */}
        <div className="text-center mb-4">
          <div
            className={clsx(
              'inline-flex items-center justify-center rounded-xl px-6 py-3',
              styles.position
            )}
          >
            <span className="text-5xl font-bold">#{position}</span>
          </div>
        </div>

        {/* Perforation line */}
        <div className="ticket-perforation my-4" />

        {/* Details */}
        <div className="space-y-2 text-center">
          {clinicName && (
            <p className={clsx('font-medium', styles.text)}>{clinicName}</p>
          )}

          {patientsAhead !== undefined && patientsAhead > 0 && (
            <p className={clsx('text-sm', styles.text)}>
              {t('patient.patientsAhead', { count: patientsAhead })}
            </p>
          )}

          {estimatedWaitMins !== undefined && estimatedWaitMins > 0 && (
            <div className={clsx('flex items-center justify-center gap-2', styles.accent)}>
              <span className="material-symbols-outlined text-xl">schedule</span>
              <span className="text-sm font-medium">
                ~{estimatedWaitMins} {t('patient.minutes')}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
