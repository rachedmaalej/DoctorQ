import { useNavigate } from 'react-router-dom';
import type { ClinicDetail } from '../../../types';

interface ClinicDetailHeaderProps {
  clinic: ClinicDetail['clinic'];
  actionLoading: string | null;
  onImpersonate: () => void;
  onToggleStatus: () => void;
  onResetPassword: () => void;
  onDelete: () => void;
}

function statusBadge(status: string) {
  const map: Record<string, { bg: string; text: string; label: string }> = {
    TRIAL: { bg: 'bg-[#F3FAF9]', text: 'text-[#267B75]', label: 'Trial' },
    ACTIVE: { bg: 'bg-[#F3FAF9]', text: 'text-[#337023]', label: 'Active' },
    EXPIRED: { bg: 'bg-[#FEF3EE]', text: 'text-[#E15720]', label: 'Expired' },
    CANCELLED: { bg: 'bg-[#F3FAF9]', text: 'text-[#8AADAA]', label: 'Cancelled' },
  };
  const s = map[status] || map.TRIAL;
  return (
    <span className={`px-2 py-0.5 text-xs font-medium rounded ${s.bg} ${s.text}`}>
      {s.label}
    </span>
  );
}

export default function ClinicDetailHeader({
  clinic,
  actionLoading,
  onImpersonate,
  onToggleStatus,
  onResetPassword,
  onDelete,
}: ClinicDetailHeaderProps) {
  const navigate = useNavigate();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center pt-6 pb-4 border-b border-[#E6F2F0]">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/admin?tab=clinics')} className="text-[#8AADAA] hover:text-[#4E7572] transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-xl font-bold text-[#132E2C] tracking-tight">{clinic.name}</h1>
            {clinic.doctorName && <p className="text-sm text-[#4E7572]">{clinic.doctorName}</p>}
          </div>
          <div className="flex items-center gap-2">
            {statusBadge(clinic.subscriptionStatus)}
            <span className={`px-2 py-0.5 text-xs font-medium rounded ${
              clinic.isActive ? 'bg-[#F3FAF9] text-[#337023]' : 'bg-[#FEF3EE] text-[#E15720]'
            }`}>
              {clinic.isActive ? 'Active' : 'Paused'}
            </span>
            {clinic.isDoctorPresent && (
              <span className="px-2 py-0.5 text-xs font-medium rounded bg-[#F3FAF9] text-[#267B75]">
                Doctor Present
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onImpersonate}
            disabled={actionLoading === 'impersonate'}
            className="text-sm px-3 py-1.5 rounded font-medium bg-[#267B75] text-white hover:bg-[#1F6560] disabled:opacity-50 transition-colors"
          >
            {actionLoading === 'impersonate' ? 'Loading...' : 'Login as Clinic'}
          </button>
          <button
            onClick={onToggleStatus}
            disabled={actionLoading === 'status'}
            className={`text-sm px-3 py-1.5 rounded font-medium border transition-colors ${
              clinic.isActive
                ? 'border-[#E15720] text-[#E15720] hover:bg-[#FEF3EE]'
                : 'border-[#337023] text-[#337023] hover:bg-[#F3FAF9]'
            }`}
          >
            {clinic.isActive ? 'Pause' : 'Activate'}
          </button>
          <button
            onClick={onResetPassword}
            disabled={actionLoading === 'password'}
            className="text-sm px-3 py-1.5 rounded font-medium border border-[#D0E8E5] text-[#4E7572] hover:bg-[#F3FAF9] transition-colors"
          >
            Reset Password
          </button>
          <button
            onClick={onDelete}
            disabled={!!actionLoading}
            className="text-sm px-3 py-1.5 rounded font-medium text-[#E15720] hover:bg-[#FEF3EE] transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
