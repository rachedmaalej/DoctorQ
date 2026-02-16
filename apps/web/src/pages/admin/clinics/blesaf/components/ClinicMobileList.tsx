import { useNavigate } from 'react-router-dom';
import type { ClinicHealth } from '@/types';

const STATUS_PILLS: Record<string, { bg: string; color: string; label: string }> = {
  TRIAL: { bg: '#fef3c7', color: '#92400e', label: 'TRIAL' },
  ACTIVE: { bg: '#dcfce7', color: '#166534', label: 'Active' },
  EXPIRED: { bg: '#f3f4f6', color: '#6b7280', label: 'Churned' },
  CANCELLED: { bg: '#f3f4f6', color: '#6b7280', label: 'Churned' },
  PAST_DUE: { bg: '#fee2e2', color: '#991b1b', label: 'At Risk' },
};

interface ClinicMobileListProps {
  clinics: ClinicHealth[];
  totalCount: number;
}

export default function ClinicMobileList({ clinics, totalCount }: ClinicMobileListProps) {
  const navigate = useNavigate();

  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 14,
        border: '1px solid #e8e5df',
        overflow: 'hidden',
      }}
    >
      {clinics.length === 0 ? (
        <div style={{ padding: '2rem', textAlign: 'center', color: '#999', fontSize: '0.82rem' }}>
          {totalCount === 0 ? 'No clinics yet.' : 'No clinics match filters.'}
        </div>
      ) : (
        clinics.map((clinic, i) => {
          const pill = STATUS_PILLS[clinic.subscriptionStatus] || STATUS_PILLS.TRIAL;
          return (
            <div
              key={clinic.id}
              role="link"
              tabIndex={0}
              onClick={() => navigate(`/admin/clinics/${clinic.id}`)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  navigate(`/admin/clinics/${clinic.id}`);
                }
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.85rem 1rem',
                borderBottom: i < clinics.length - 1 ? '1px solid #f3f0ec' : 'none',
                cursor: 'pointer',
                transition: 'background 100ms',
              }}
              onTouchStart={(e) => { (e.currentTarget as HTMLElement).style.background = '#f0ede7'; }}
              onTouchEnd={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
            >
              {/* Left: name + email */}
              <div style={{ minWidth: 0, flex: 1 }}>
                <div
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontWeight: 600,
                    fontSize: '0.88rem',
                    color: '#1a1a2e',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {clinic.name}
                </div>
                <div
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: '0.72rem',
                    color: '#999',
                  }}
                >
                  {clinic.email}
                </div>
              </div>

              {/* Right: pill + chevron */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                <span
                  style={{
                    display: 'inline-block',
                    padding: '0.15rem 0.55rem',
                    borderRadius: 100,
                    fontSize: '0.66rem',
                    fontWeight: 600,
                    background: pill.bg,
                    color: pill.color,
                    textTransform: 'uppercase',
                    letterSpacing: '0.03em',
                  }}
                >
                  {pill.label}
                </span>
                <span style={{ color: '#ccc', fontSize: '0.85rem' }}>›</span>
              </div>
            </div>
          );
        })
      )}
      <div
        style={{
          padding: '0.7rem 1rem',
          fontSize: '0.75rem',
          color: '#999',
          borderTop: '1px solid #e8e5df',
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        Showing {clinics.length} of {totalCount} clinics
      </div>
    </div>
  );
}
