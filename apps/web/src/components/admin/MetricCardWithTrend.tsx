/**
 * MetricCardWithTrend — Teal Clinical palette
 * Label → large teal value → colored delta
 */

interface MetricCardWithTrendProps {
  label: string;
  value: string | number;
  subtext: string;
  trend?: {
    value: number;
    direction: 'up' | 'down' | 'flat';
    isPositive: boolean;
  };
  color: 'green' | 'blue' | 'indigo' | 'purple' | 'yellow' | 'red' | 'gray';
  onClick?: () => void;
}

export default function MetricCardWithTrend({
  label,
  value,
  trend,
  onClick,
}: MetricCardWithTrendProps) {
  const getTrendDisplay = () => {
    if (!trend) return null;

    if (trend.direction === 'flat') {
      return <span className="text-[#8AADAA] text-xs font-medium">steady</span>;
    }

    const isGood = trend.direction === 'up' ? trend.isPositive : !trend.isPositive;
    const colorClass = isGood ? 'text-[#337023]' : 'text-[#E15720]';
    const sign = trend.direction === 'up' ? '+' : '-';

    return (
      <span className={`${colorClass} text-xs font-medium`}>
        {sign}{Math.abs(trend.value)}%
      </span>
    );
  };

  return (
    <div
      className={`px-6 first:pl-0 border-r border-[#E6F2F0] last:border-r-0 ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      <p className="text-xs font-medium text-[#4E7572] uppercase tracking-wide">{label}</p>
      <p className="text-[26px] font-bold text-[#132E2C] tracking-tight leading-tight mt-1 mb-1">{value}</p>
      {getTrendDisplay()}
    </div>
  );
}
