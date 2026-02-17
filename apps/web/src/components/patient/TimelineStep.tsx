interface TimelineStepProps {
  status: 'completed' | 'active' | 'future';
  icon: string;
  title: string;
  description?: string;
  timestamp?: string;
  isLast?: boolean;
  /** Use green palette instead of primary (for yourTurn/done states) */
  green?: boolean;
  children?: React.ReactNode;
}

export default function TimelineStep({
  status,
  icon,
  title,
  description,
  timestamp,
  isLast = false,
  green = false,
  children,
}: TimelineStepProps) {
  const dotStyles = {
    completed: green
      ? 'bg-green-500 text-white'
      : 'bg-primary-500 text-white',
    active: green
      ? 'bg-white border-[3px] border-green-500 text-green-500'
      : 'bg-white border-[3px] border-primary-500 text-primary-500',
    future: 'bg-gray-100 border-2 border-gray-200 text-gray-400',
  };

  const lineStyles = {
    completed: green ? 'bg-green-500' : 'bg-primary-500',
    active: green
      ? 'bg-gradient-to-b from-green-500 to-gray-200'
      : 'bg-gradient-to-b from-primary-500 to-gray-200',
    future: 'bg-gray-200',
  };

  const titleStyles = {
    completed: 'text-gray-800 font-semibold',
    active: green ? 'text-green-800 font-bold' : 'text-primary-800 font-bold',
    future: 'text-gray-400 font-medium',
  };

  const descStyles = {
    completed: 'text-gray-500',
    active: green ? 'text-green-600' : 'text-primary-600',
    future: 'text-gray-300',
  };

  return (
    <div className="flex gap-4">
      {/* Track: dot + line */}
      <div className="flex flex-col items-center flex-shrink-0" style={{ width: 36 }}>
        <div
          className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 z-10 transition-all duration-300 ${dotStyles[status]}`}
          style={status === 'active' ? { animation: 'timeline-pulse 2s ease-in-out infinite' } : undefined}
        >
          <span
            className="material-symbols-outlined"
            style={{
              fontSize: 18,
              fontVariationSettings: status === 'completed'
                ? "'FILL' 1, 'wght' 500"
                : "'FILL' 0, 'wght' 400",
            }}
          >
            {status === 'completed' ? 'check' : icon}
          </span>
        </div>
        {!isLast && (
          <div className={`w-0.5 flex-1 min-h-[20px] mt-1 ${lineStyles[status]}`} />
        )}
      </div>

      {/* Content */}
      <div className={`flex-1 ${isLast ? 'pb-0' : 'pb-6'} pt-1.5`}>
        <div className="flex items-center justify-between">
          <span className={`text-sm ${titleStyles[status]}`}>{title}</span>
          {timestamp && (
            <span className="text-xs text-gray-400 font-medium">{timestamp}</span>
          )}
        </div>
        {description && (
          <p className={`text-xs mt-0.5 ${descStyles[status]}`}>{description}</p>
        )}
        {status === 'active' && children && (
          <div className="mt-3">{children}</div>
        )}
      </div>
    </div>
  );
}
