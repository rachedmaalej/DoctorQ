import { useNavigate } from 'react-router-dom';
import type { ClinicRanking } from '../../types';

interface ClinicRankingCardProps {
  rankings: ClinicRanking[];
}

export default function ClinicRankingCard({ rankings }: ClinicRankingCardProps) {
  const navigate = useNavigate();

  const getTrendDisplay = (trend: ClinicRanking['trend']) => {
    if (trend.direction === 'flat') {
      return <span className="text-[#8AADAA] text-xs">steady</span>;
    }
    const isGood = trend.direction === 'up' ? trend.isPositive : !trend.isPositive;
    const colorClass = isGood ? 'text-[#337023]' : 'text-[#E15720]';
    const arrow = trend.direction === 'up' ? '↑' : '↓';
    return (
      <span className={`${colorClass} text-xs font-medium`}>
        {arrow} {Math.abs(trend.value)}%
      </span>
    );
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[13px] font-bold text-[#132E2C] uppercase tracking-wider">Clinic Performance</h3>
        <span className="text-xs text-[#8AADAA]">by patients this month</span>
      </div>

      {rankings.length === 0 ? (
        <p className="text-[#8AADAA] text-center py-4 text-sm">No clinic data available</p>
      ) : (
        <div className="space-y-0">
          {rankings.map((clinic, index) => (
            <div
              key={clinic.id}
              className="flex items-center gap-3 py-2 border-b border-[#E6F2F0] last:border-b-0 cursor-pointer hover:bg-[#F3FAF9] transition-colors"
              onClick={() => navigate(`/admin/clinic/${clinic.id}`)}
            >
              <div className="w-5 text-xs font-bold text-[#8AADAA] text-right">
                {index + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#132E2C] truncate">{clinic.name}</p>
                {clinic.doctorName && (
                  <p className="text-xs text-[#8AADAA] truncate">{clinic.doctorName}</p>
                )}
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-[#132E2C]">{clinic.patientsThisMonth}</p>
                {getTrendDisplay(clinic.trend)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
