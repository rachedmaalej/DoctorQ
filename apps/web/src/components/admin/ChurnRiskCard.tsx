import { useNavigate } from 'react-router-dom';
import type { ChurnRiskClinic } from '../../types';

interface ChurnRiskCardProps {
  clinics: ChurnRiskClinic[];
}

export default function ChurnRiskCard({ clinics }: ChurnRiskCardProps) {
  const navigate = useNavigate();

  const highRisk = clinics.filter((c) => c.riskLevel === 'high');
  const mediumRisk = clinics.filter((c) => c.riskLevel === 'medium');

  const formatDaysSince = (days: number | null) => {
    if (days === null) return 'Never logged in';
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    return `${days} days ago`;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[13px] font-bold text-[#132E2C] uppercase tracking-wider">Churn Risk</h3>
        <span className="text-xs text-[#8AADAA]">{highRisk.length + mediumRisk.length} need attention</span>
      </div>

      {clinics.length === 0 ? (
        <div className="text-center py-6">
          <p className="text-[#337023] font-medium text-sm">All clinics are healthy!</p>
          <p className="text-[#8AADAA] text-xs mt-1">No churn risks detected</p>
        </div>
      ) : (
        <div className="space-y-4">
          {highRisk.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[#E15720]"></div>
                <span className="text-xs font-bold text-[#E15720] uppercase">
                  High Risk ({highRisk.length})
                </span>
              </div>
              <div className="space-y-0">
                {highRisk.map((clinic) => (
                  <div
                    key={clinic.id}
                    className="flex items-center justify-between py-2 border-b border-[#E6F2F0] last:border-b-0 cursor-pointer hover:bg-[#F3FAF9] transition-colors"
                    onClick={() => navigate(`/admin/clinics/${clinic.id}`)}
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[#132E2C] truncate">{clinic.name}</p>
                      <p className="text-xs text-[#8AADAA]">
                        Last login: {formatDaysSince(clinic.daysSinceLogin)} &middot; {clinic.lastPatientCount} patients
                      </p>
                    </div>
                    <button
                      className="ml-2 px-2 py-1 text-xs text-[#E15720] border border-[#E15720] rounded hover:bg-[#E15720] hover:text-white transition-colors"
                      onClick={(e) => { e.stopPropagation(); navigate(`/admin/clinics/${clinic.id}`); }}
                    >
                      View
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {mediumRisk.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div>
                <span className="text-xs font-bold text-amber-600 uppercase">
                  Medium Risk ({mediumRisk.length})
                </span>
              </div>
              <div className="space-y-0">
                {mediumRisk.map((clinic) => (
                  <div
                    key={clinic.id}
                    className="flex items-center justify-between py-2 border-b border-[#E6F2F0] last:border-b-0 cursor-pointer hover:bg-[#F3FAF9] transition-colors"
                    onClick={() => navigate(`/admin/clinics/${clinic.id}`)}
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[#132E2C] truncate">{clinic.name}</p>
                      <p className="text-xs text-[#8AADAA]">
                        Last login: {formatDaysSince(clinic.daysSinceLogin)} &middot; {clinic.lastPatientCount} patients
                      </p>
                    </div>
                    <span className="text-xs text-amber-600 font-medium">Medium</span>
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
