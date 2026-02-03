/**
 * MetricCardWithTrend - Dashboard metric card with trend indicator
 * Shows current value with comparison to previous period
 */

interface MetricCardWithTrendProps {
  label: string;
  value: string | number;
  subtext: string;
  trend?: {
    value: number;      // Percentage change
    direction: 'up' | 'down' | 'flat';
    isPositive: boolean; // Whether up is good (e.g., patients) or bad (e.g., overdue)
  };
  color: 'green' | 'blue' | 'indigo' | 'purple' | 'yellow' | 'red' | 'gray';
  onClick?: () => void;
}

export default function MetricCardWithTrend({
  label,
  value,
  subtext,
  trend,
  color,
  onClick,
}: MetricCardWithTrendProps) {
  const colorClasses: Record<string, string> = {
    green: 'bg-green-50 border-green-200 hover:bg-green-100',
    blue: 'bg-blue-50 border-blue-200 hover:bg-blue-100',
    indigo: 'bg-indigo-50 border-indigo-200 hover:bg-indigo-100',
    purple: 'bg-purple-50 border-purple-200 hover:bg-purple-100',
    yellow: 'bg-yellow-50 border-yellow-200 hover:bg-yellow-100',
    red: 'bg-red-50 border-red-200 hover:bg-red-100',
    gray: 'bg-gray-50 border-gray-200 hover:bg-gray-100',
  };

  const textClasses: Record<string, string> = {
    green: 'text-green-900',
    blue: 'text-blue-900',
    indigo: 'text-indigo-900',
    purple: 'text-purple-900',
    yellow: 'text-yellow-900',
    red: 'text-red-900',
    gray: 'text-gray-900',
  };

  const getTrendIcon = () => {
    if (!trend) return null;

    if (trend.direction === 'flat') {
      return <span className="text-gray-500">→</span>;
    }

    const isGood = trend.direction === 'up' ? trend.isPositive : !trend.isPositive;
    const colorClass = isGood ? 'text-green-600' : 'text-red-600';

    return (
      <span className={colorClass}>
        {trend.direction === 'up' ? '↑' : '↓'}
      </span>
    );
  };

  const getTrendText = () => {
    if (!trend) return null;

    if (trend.direction === 'flat') {
      return <span className="text-gray-500 text-xs ml-1">steady</span>;
    }

    const isGood = trend.direction === 'up' ? trend.isPositive : !trend.isPositive;
    const colorClass = isGood ? 'text-green-600' : 'text-red-600';

    return (
      <span className={`${colorClass} text-xs ml-1`}>
        {Math.abs(trend.value)}%
      </span>
    );
  };

  return (
    <div
      className={`rounded-lg border p-4 transition-colors ${colorClasses[color]} ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{label}</p>
      <div className="flex items-baseline gap-2 mt-1">
        <p className={`text-2xl font-bold ${textClasses[color]}`}>{value}</p>
        {trend && (
          <div className="flex items-center">
            {getTrendIcon()}
            {getTrendText()}
          </div>
        )}
      </div>
      <p className="text-xs text-gray-500 mt-1">{subtext}</p>
    </div>
  );
}
