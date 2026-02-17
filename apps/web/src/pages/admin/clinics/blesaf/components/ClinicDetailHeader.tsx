import { useNavigate } from 'react-router-dom';
import type { ClinicDetail } from '@/types';
import { useIsMobile } from '../../useIsMobile';
import OverflowMenu from '../../shared/OverflowMenu';

const STATUS_PILLS: Record<string, { bg: string; color: string; label: string; mobileLabel?: string }> = {
  TRIAL: { bg: '#fef3c7', color: '#92400e', label: 'TRIAL' },
  ACTIVE_SUB: { bg: '#dcfce7', color: '#166534', label: 'Active' },
  DOCTOR: { bg: '#dbeafe', color: '#1e40af', label: 'Doctor Present', mobileLabel: 'Doctor' },
  AT_RISK: { bg: '#fee2e2', color: '#991b1b', label: 'At Risk' },
  CHURNED: { bg: '#f3f4f6', color: '#6b7280', label: 'Churned' },
};

interface ClinicDetailHeaderProps {
  clinic: ClinicDetail['clinic'];
  onLoginAs: () => void;
  onPause: () => void;
  onResetPassword: () => void;
  onDelete: () => void;
  actionLoading: string | null;
}

export default function ClinicDetailHeader({ clinic, onLoginAs, onPause, onResetPassword, onDelete, actionLoading }: ClinicDetailHeaderProps) {
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const pills: Array<{ bg: string; color: string; label: string }> = [];
  if (clinic.subscriptionStatus === 'TRIAL') pills.push(STATUS_PILLS.TRIAL);
  if (clinic.isActive) pills.push(STATUS_PILLS.ACTIVE_SUB);
  if (clinic.isDoctorPresent) {
    const dp = STATUS_PILLS.DOCTOR;
    pills.push({ bg: dp.bg, color: dp.color, label: isMobile && dp.mobileLabel ? dp.mobileLabel : dp.label });
  }

  return (
    <div style={{ display: 'flex', alignItems: isMobile ? 'flex-start' : 'flex-start', gap: isMobile ? '0.5rem' : '0.8rem', flexWrap: 'wrap' }}>
      {/* Back button */}
      <button
        onClick={() => navigate('/admin/clinics')}
        style={{
          width: 30,
          height: 30,
          borderRadius: 7,
          border: '1px solid #e8e5df',
          background: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          color: '#666',
          fontSize: '1rem',
          padding: 0,
          flexShrink: 0,
        }}
        aria-label="Back to clinics"
      >
        ←
      </button>

      {/* Left cluster */}
      <div style={{ flex: 1, minWidth: isMobile ? 0 : 260 }}>
        {/* Title + pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <span
            style={{
              fontFamily: "'Outfit', sans-serif",
              fontWeight: 700,
              fontSize: isMobile ? '1.02rem' : '1.2rem',
              color: '#1a1a2e',
              lineHeight: 1.3,
            }}
          >
            {clinic.name}
          </span>
          {pills.map((pill, i) => (
            <span
              key={i}
              style={{
                display: 'inline-block',
                padding: '0.12rem 0.5rem',
                borderRadius: 100,
                fontSize: '0.62rem',
                fontWeight: 600,
                background: pill.bg,
                color: pill.color,
                textTransform: 'uppercase',
                letterSpacing: '0.03em',
              }}
            >
              {pill.label}
            </span>
          ))}
        </div>
        {/* Subtitle */}
        <div
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '0.78rem',
            color: '#999',
            marginTop: '0.1rem',
          }}
        >
          {clinic.doctorName || 'No doctor assigned'}
        </div>
        {/* Mobile pills row (below name on mobile) */}
      </div>

      {/* Right: Actions */}
      <div style={{ display: 'flex', gap: isMobile ? '0.3rem' : '0.4rem', alignItems: 'center', flexShrink: 0, marginTop: isMobile ? '0.1rem' : 0, marginLeft: isMobile ? 0 : 'auto' }}>
        {/* Login as Clinic */}
        <button
          onClick={onLoginAs}
          disabled={actionLoading === 'impersonate'}
          style={{
            background: '#2a9d6e',
            color: '#fff',
            padding: isMobile ? '0.35rem 0.6rem' : '0.4rem 0.75rem',
            borderRadius: 7,
            fontWeight: 600,
            fontSize: '0.76rem',
            border: 'none',
            cursor: 'pointer',
            fontFamily: "'DM Sans', sans-serif",
            opacity: actionLoading === 'impersonate' ? 0.6 : 1,
          }}
        >
          {isMobile ? 'Login' : 'Login as Clinic'}
        </button>

        {/* Desktop-only buttons */}
        {!isMobile && (
          <>
            <button
              onClick={onPause}
              disabled={actionLoading === 'status'}
              style={{
                border: '1px solid #f59e0b',
                color: '#f59e0b',
                padding: '0.4rem 0.7rem',
                borderRadius: 7,
                fontWeight: 600,
                fontSize: '0.76rem',
                background: 'none',
                cursor: 'pointer',
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              Pause
            </button>
            <button
              onClick={onResetPassword}
              disabled={actionLoading === 'password'}
              style={{
                border: '1px solid #c5c0b8',
                color: '#555',
                padding: '0.4rem 0.7rem',
                borderRadius: 7,
                fontSize: '0.76rem',
                background: 'none',
                cursor: 'pointer',
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              Reset Password
            </button>
            <button
              onClick={onDelete}
              style={{
                background: 'none',
                border: 'none',
                color: '#dc2626',
                fontWeight: 600,
                fontSize: '0.76rem',
                cursor: 'pointer',
                fontFamily: "'DM Sans', sans-serif",
                padding: '0.4rem 0.3rem',
              }}
            >
              Delete
            </button>
          </>
        )}

        {/* Mobile overflow menu */}
        {isMobile && (
          <OverflowMenu
            buttonStyle={{ borderColor: '#e8e5df' }}
            iconColor="#666"
            items={[
              { label: 'Pause', onClick: onPause, color: '#f59e0b' },
              { label: 'Reset Password', onClick: onResetPassword, separator: true },
              { label: 'Delete', onClick: onDelete, color: '#dc2626' },
            ]}
          />
        )}
      </div>
    </div>
  );
}
