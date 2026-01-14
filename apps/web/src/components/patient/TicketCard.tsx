import { useTranslation } from 'react-i18next';
import clsx from 'clsx';

export type TicketColorScheme = 'calm' | 'teal' | 'amber' | 'green';

interface TicketCardProps {
  position: number;
  clinicName?: string;
  colorScheme: TicketColorScheme;
  animate?: boolean;
  estimatedWait?: number;
}

const colorSchemeStyles: Record<TicketColorScheme, {
  card: string;
  stub: string;
  stubText: string;
  positionText: string;
  secondaryText: string;
  accent: string;
  stars: string;
  perforation: string;
}> = {
  calm: {
    card: 'from-blue-400 via-blue-500 to-blue-600',
    stub: 'from-blue-500 to-blue-600',
    stubText: 'text-blue-900/60',
    positionText: 'text-blue-900',
    secondaryText: 'text-blue-800',
    accent: 'text-blue-100',
    stars: 'text-blue-700/40',
    perforation: 'bg-gray-100',
  },
  teal: {
    card: 'from-teal-400 via-teal-500 to-teal-600',
    stub: 'from-teal-500 to-teal-600',
    stubText: 'text-teal-900/60',
    positionText: 'text-teal-900',
    secondaryText: 'text-teal-800',
    accent: 'text-teal-100',
    stars: 'text-teal-700/40',
    perforation: 'bg-gray-100',
  },
  amber: {
    card: 'from-amber-400 via-yellow-400 to-amber-500',
    stub: 'from-amber-500 to-amber-600',
    stubText: 'text-amber-900/60',
    positionText: 'text-amber-900',
    secondaryText: 'text-amber-800',
    accent: 'text-amber-900/70',
    stars: 'text-amber-700/50',
    perforation: 'bg-gray-100',
  },
  green: {
    card: 'from-emerald-400 via-green-500 to-emerald-600',
    stub: 'from-emerald-500 to-emerald-600',
    stubText: 'text-emerald-900/60',
    positionText: 'text-emerald-900',
    secondaryText: 'text-emerald-800',
    accent: 'text-emerald-100',
    stars: 'text-emerald-700/40',
    perforation: 'bg-gray-100',
  },
};

export default function TicketCard({
  position,
  clinicName,
  colorScheme,
  animate = false,
  estimatedWait,
}: TicketCardProps) {
  const { t } = useTranslation();
  const styles = colorSchemeStyles[colorScheme];

  return (
    <div className="flex justify-center">
      <div className="relative">
        {/* Main ticket body */}
        <div
          className={clsx(
            'bg-gradient-to-br rounded-lg shadow-xl overflow-hidden flex relative',
            styles.card,
            animate && 'animate-pulse'
          )}
          style={{ width: '340px', height: '160px' }}
        >
          {/* Star pattern overlay */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: `
                radial-gradient(circle at 10% 20%, rgba(255,255,255,0.1) 2px, transparent 2px),
                radial-gradient(circle at 90% 80%, rgba(255,255,255,0.1) 2px, transparent 2px),
                radial-gradient(circle at 85% 15%, rgba(255,255,255,0.08) 3px, transparent 3px),
                radial-gradient(circle at 15% 85%, rgba(255,255,255,0.08) 3px, transparent 3px)
              `
            }}
          />

          {/* Left stub with vertical text */}
          <div
            className={clsx(
              'w-14 bg-gradient-to-b flex items-center justify-center relative',
              styles.stub
            )}
          >
            {/* Dashed divider line */}
            <div className="absolute inset-y-0 right-0 w-px border-r-2 border-dashed opacity-30" style={{ borderColor: 'currentColor' }} />
            <span
              className={clsx(
                'font-black text-xs tracking-widest transform -rotate-90 whitespace-nowrap',
                styles.stubText
              )}
            >
              TICKET
            </span>
          </div>

          {/* Main content area */}
          <div className="flex-1 p-4 flex flex-col justify-between relative">
            <div className="flex justify-between items-start">
              <div>
                <p className={clsx('text-xs font-medium uppercase tracking-wide', styles.accent)}>
                  {t('patient.yourPosition') ? 'Votre position' : 'Your position'}
                </p>
                <p className={clsx('text-5xl font-black', styles.positionText)}>
                  #{position}
                </p>
              </div>
              {clinicName && (
                <div className="text-right">
                  <p className={clsx('text-xs font-medium', styles.accent)}>Cabinet</p>
                  <p className={clsx('text-sm font-semibold', styles.secondaryText)}>{clinicName}</p>
                </div>
              )}
            </div>

            <div className="flex justify-between items-end">
              {estimatedWait !== undefined ? (
                <div className={clsx('flex items-center gap-2', styles.secondaryText)}>
                  <span className="material-symbols-outlined text-lg">schedule</span>
                  <span className="text-sm font-medium">~{estimatedWait} min d'attente</span>
                </div>
              ) : (
                <div />
              )}
              {/* Decorative stars */}
              <div className="flex gap-1">
                <span className={clsx('text-xl', styles.stars)}>★</span>
                <span className={clsx('text-xl opacity-75', styles.stars)}>★</span>
                <span className={clsx('text-xl', styles.stars)}>★</span>
              </div>
            </div>
          </div>

          {/* Perforation circles on right edge */}
          <div className="w-3 flex flex-col justify-around py-2">
            <div className={clsx('w-2.5 h-2.5 rounded-full', styles.perforation)} />
            <div className={clsx('w-2.5 h-2.5 rounded-full', styles.perforation)} />
            <div className={clsx('w-2.5 h-2.5 rounded-full', styles.perforation)} />
            <div className={clsx('w-2.5 h-2.5 rounded-full', styles.perforation)} />
            <div className={clsx('w-2.5 h-2.5 rounded-full', styles.perforation)} />
          </div>
        </div>

        {/* Decorative notches on sides */}
        <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-8 bg-gray-100 rounded-r-full" />
        <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-8 bg-gray-100 rounded-l-full" />
      </div>
    </div>
  );
}
