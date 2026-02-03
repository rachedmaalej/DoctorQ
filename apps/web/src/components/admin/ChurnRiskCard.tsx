/**
 * ChurnRiskCard - Churn risk analysis panel
 * Categorizes clinics by risk level to help with proactive retention
 */

import { useNavigate } from 'react-router-dom';
import type { ChurnRiskClinic } from '../../types';

interface ChurnRiskCardProps {
  clinics: ChurnRiskClinic[];
}

export default function ChurnRiskCard({ clinics }: ChurnRiskCardProps) {
  const navigate = useNavigate();

  const highRisk = clinics.filter((c) => c.riskLevel === 'high');
  const mediumRisk = clinics.filter((c) => c.riskLevel === 'medium');

  const getRiskBadge = (level: 'high' | 'medium' | 'low') => {
    const styles = {
      high: 'bg-red-100 text-red-700',
      medium: 'bg-yellow-100 text-yellow-700',
      low: 'bg-green-100 text-green-700',
    };
    const labels = {
      high: 'High Risk',
      medium: 'Medium Risk',
      low: 'Low Risk',
    };
    return (
      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${styles[level]}`}>
        {labels[level]}
      </span>
    );
  };

  const formatDaysSince = (days: number | null) => {
    if (days === null) return 'Never logged in';
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    return `${days} days ago`;
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider flex items-center gap-2">
          <span className="text-lg">⚠️</span>
          Churn Risk
        </h3>
        <span className="text-xs text-gray-400">
          {highRisk.length + mediumRisk.length} clinics need attention
        </span>
      </div>

      {clinics.length === 0 ? (
        <div className="text-center py-6">
          <span className="text-3xl mb-2">✨</span>
          <p className="text-green-600 font-medium">All clinics are healthy!</p>
          <p className="text-gray-500 text-sm">No churn risks detected</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* High Risk Section */}
          {highRisk.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                <span className="text-xs font-medium text-red-700 uppercase">
                  High Risk ({highRisk.length})
                </span>
              </div>
              <div className="space-y-2">
                {highRisk.map((clinic) => (
                  <div
                    key={clinic.id}
                    className="flex items-center justify-between p-2 bg-red-50 rounded-lg hover:bg-red-100 cursor-pointer transition-colors"
                    onClick={() => navigate(`/admin/clinic/${clinic.id}`)}
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{clinic.name}</p>
                      <p className="text-xs text-gray-500">
                        Last login: {formatDaysSince(clinic.daysSinceLogin)} • {clinic.lastPatientCount} patients this month
                      </p>
                    </div>
                    <button
                      className="ml-2 px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        // In future: trigger send reminder action
                        navigate(`/admin/clinic/${clinic.id}`);
                      }}
                    >
                      View
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Medium Risk Section */}
          {mediumRisk.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                <span className="text-xs font-medium text-yellow-700 uppercase">
                  Medium Risk ({mediumRisk.length})
                </span>
              </div>
              <div className="space-y-2">
                {mediumRisk.map((clinic) => (
                  <div
                    key={clinic.id}
                    className="flex items-center justify-between p-2 bg-yellow-50 rounded-lg hover:bg-yellow-100 cursor-pointer transition-colors"
                    onClick={() => navigate(`/admin/clinic/${clinic.id}`)}
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{clinic.name}</p>
                      <p className="text-xs text-gray-500">
                        Last login: {formatDaysSince(clinic.daysSinceLogin)} • {clinic.lastPatientCount} patients this month
                      </p>
                    </div>
                    {getRiskBadge(clinic.riskLevel)}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
