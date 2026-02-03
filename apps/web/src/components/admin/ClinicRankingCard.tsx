/**
 * ClinicRankingCard - Performance leaderboard for clinics
 * Shows top clinics by patient count with trend indicators
 */

import { useNavigate } from 'react-router-dom';
import type { ClinicRanking } from '../../types';

interface ClinicRankingCardProps {
  rankings: ClinicRanking[];
}

export default function ClinicRankingCard({ rankings }: ClinicRankingCardProps) {
  const navigate = useNavigate();

  const getTrendDisplay = (trend: ClinicRanking['trend']) => {
    if (trend.direction === 'flat') {
      return <span className="text-gray-400 text-xs">→ steady</span>;
    }

    const isGood = trend.direction === 'up' ? trend.isPositive : !trend.isPositive;
    const colorClass = isGood ? 'text-green-600' : 'text-red-600';
    const arrow = trend.direction === 'up' ? '↑' : '↓';

    return (
      <span className={`${colorClass} text-xs font-medium`}>
        {arrow} {Math.abs(trend.value)}%
      </span>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider flex items-center gap-2">
          <span className="text-lg">🏆</span>
          Clinic Performance
        </h3>
        <span className="text-xs text-gray-400">by patients this month</span>
      </div>

      {rankings.length === 0 ? (
        <p className="text-gray-500 text-center py-4">No clinic data available</p>
      ) : (
        <div className="space-y-3">
          {rankings.map((clinic, index) => (
            <div
              key={clinic.id}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
              onClick={() => navigate(`/admin/clinic/${clinic.id}`)}
            >
              {/* Rank */}
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                index === 0 ? 'bg-yellow-100 text-yellow-700' :
                index === 1 ? 'bg-gray-200 text-gray-600' :
                index === 2 ? 'bg-orange-100 text-orange-700' :
                'bg-gray-100 text-gray-500'
              }`}>
                {index + 1}
              </div>

              {/* Clinic Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{clinic.name}</p>
                {clinic.doctorName && (
                  <p className="text-xs text-gray-500 truncate">{clinic.doctorName}</p>
                )}
              </div>

              {/* Patients Count */}
              <div className="text-right">
                <p className="text-sm font-semibold text-indigo-600">{clinic.patientsThisMonth}</p>
                {getTrendDisplay(clinic.trend)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
