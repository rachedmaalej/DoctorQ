import clsx from 'clsx';

export type TicketColorScheme = 'calm' | 'teal' | 'amber' | 'green';

interface CompactTicketCardProps {
  position: number;
  colorScheme: TicketColorScheme;
  animate?: boolean;
}

const colorSchemeStyles: Record<TicketColorScheme, {
  card: string;
  stub: string;
  stubText: string;
  positionText: string;
  accent: string;
  perforation: string;
}> = {
  calm: {
    card: 'from-blue-400 via-blue-500 to-blue-600',
    stub: 'from-blue-500 to-blue-600',
    stubText: 'text-blue-900/60',
    positionText: 'text-blue-900',
    accent: 'text-blue-100',
    perforation: 'bg-gray-100',
  },
  teal: {
    card: 'from-teal-400 via-teal-500 to-teal-600',
    stub: 'from-teal-500 to-teal-600',
    stubText: 'text-teal-900/60',
    positionText: 'text-teal-900',
    accent: 'text-teal-100',
    perforation: 'bg-gray-100',
  },
  amber: {
    card: 'from-amber-400 via-yellow-400 to-amber-500',
    stub: 'from-amber-500 to-amber-600',
    stubText: 'text-amber-900/60',
    positionText: 'text-amber-900',
    accent: 'text-amber-900/70',
    perforation: 'bg-gray-100',
  },
  green: {
    card: 'from-emerald-400 via-green-500 to-emerald-600',
    stub: 'from-emerald-500 to-emerald-600',
    stubText: 'text-emerald-900/60',
    positionText: 'text-emerald-900',
    accent: 'text-emerald-100',
    perforation: 'bg-gray-100',
  },
};

export default function CompactTicketCard({
  position,
  colorScheme,
  animate = false,
}: CompactTicketCardProps) {
  const styles = colorSchemeStyles[colorScheme];

  return (
    <div className="relative">
      {/* Main ticket body - compact square */}
      <div
        className={clsx(
          'bg-gradient-to-br rounded-xl shadow-lg overflow-hidden relative',
          styles.card,
          animate && 'animate-pulse'
        )}
        style={{ width: '140px', height: '140px' }}
      >
        {/* Star pattern overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `
              radial-gradient(circle at 10% 20%, rgba(255,255,255,0.1) 2px, transparent 2px),
              radial-gradient(circle at 90% 80%, rgba(255,255,255,0.1) 2px, transparent 2px)
            `
          }}
        />

        {/* Main content - centered position number only */}
        <div className="h-full flex items-center justify-center relative">
          <p className={clsx('text-5xl font-black', styles.positionText)}>
            #{position}
          </p>
        </div>

        {/* Perforation circles on right edge */}
        <div className="absolute right-0 top-0 bottom-0 w-2 flex flex-col justify-around py-3">
          <div className={clsx('w-2 h-2 rounded-full', styles.perforation)} />
          <div className={clsx('w-2 h-2 rounded-full', styles.perforation)} />
          <div className={clsx('w-2 h-2 rounded-full', styles.perforation)} />
        </div>
      </div>

      {/* Decorative notches */}
      <div className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-3 h-6 bg-gray-100 rounded-r-full" />
      <div className="absolute -right-1.5 top-1/2 -translate-y-1/2 w-3 h-6 bg-gray-100 rounded-l-full" />
    </div>
  );
}
