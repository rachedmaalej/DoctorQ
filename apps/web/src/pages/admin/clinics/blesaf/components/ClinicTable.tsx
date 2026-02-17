import { useNavigate } from 'react-router-dom';
import type { ClinicHealth } from '@/types';
import type { DirectorySort } from '../../shared/types';

const STATUS_PILLS: Record<string, { bg: string; color: string; label: string }> = {
  TRIAL: { bg: '#fef3c7', color: '#92400e', label: 'TRIAL' },
  ACTIVE: { bg: '#dcfce7', color: '#166534', label: 'Active' },
  EXPIRED: { bg: '#f3f4f6', color: '#6b7280', label: 'Churned' },
  CANCELLED: { bg: '#f3f4f6', color: '#6b7280', label: 'Churned' },
  PAST_DUE: { bg: '#fee2e2', color: '#991b1b', label: 'At Risk' },
};

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatRelativeDate(dateStr: string | null): string {
  if (!dateStr) return 'Never';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return hours === 1 ? '1 hour ago' : `${hours} hours ago`;
  const days = Math.floor(hours / 24);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-GB');
}

interface ClinicTableProps {
  clinics: ClinicHealth[];
  totalCount: number;
  sort: DirectorySort;
  onToggleSort: (field: DirectorySort['field']) => void;
  onExtend: (clinicId: string, clinicName: string) => void;
  onUpgrade: (clinicId: string, clinicName: string) => void;
}

export default function ClinicTable({ clinics, totalCount, sort, onToggleSort, onExtend, onUpgrade }: ClinicTableProps) {
  const navigate = useNavigate();

  const getSortIcon = (field: string) => {
    if (sort.field !== field) return '↕';
    return sort.direction === 'asc' ? '↑' : '↓';
  };

  const thStyle: React.CSSProperties = {
    padding: '0.65rem 1.2rem',
    fontSize: '0.66rem',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    color: '#999',
    fontWeight: 500,
    borderBottom: '1px solid #e8e5df',
    fontFamily: "'DM Sans', sans-serif",
    textAlign: 'left',
    whiteSpace: 'nowrap',
  };

  const tdStyle: React.CSSProperties = {
    padding: '0.75rem 1.2rem',
    fontSize: '0.82rem',
    fontFamily: "'DM Sans', sans-serif",
    color: '#1a1a2e',
  };

  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 14,
        border: '1px solid #e8e5df',
        overflow: 'hidden',
      }}
    >
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th
              style={{ ...thStyle, cursor: 'pointer' }}
              onClick={() => onToggleSort('name')}
            >
              Clinic {getSortIcon('name')}
            </th>
            <th style={thStyle}>Subscription</th>
            <th style={thStyle}>Trial Ends</th>
            <th
              style={{ ...thStyle, cursor: 'pointer' }}
              onClick={() => onToggleSort('lastActive')}
            >
              Last Active {getSortIcon('lastActive')}
            </th>
            <th
              style={{ ...thStyle, cursor: 'pointer' }}
              onClick={() => onToggleSort('patients')}
            >
              Patients {getSortIcon('patients')}
            </th>
            <th
              style={{ ...thStyle, cursor: 'pointer' }}
              onClick={() => onToggleSort('joined')}
            >
              Joined {getSortIcon('joined')}
            </th>
            <th style={thStyle}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {clinics.length === 0 ? (
            <tr>
              <td colSpan={7} style={{ ...tdStyle, textAlign: 'center', color: '#999', padding: '2rem' }}>
                {totalCount === 0 ? 'No clinics yet.' : 'No clinics match filters.'}
              </td>
            </tr>
          ) : (
            clinics.map((clinic, i) => {
              const pill = STATUS_PILLS[clinic.subscriptionStatus] || STATUS_PILLS.TRIAL;
              return (
                <tr
                  key={clinic.id}
                  style={{
                    borderBottom: i < clinics.length - 1 ? '1px solid #f3f0ec' : 'none',
                    cursor: 'pointer',
                    transition: 'background 150ms',
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#faf8f5'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                  onClick={() => navigate(`/admin/clinics/${clinic.id}`)}
                >
                  {/* Clinic */}
                  <td style={tdStyle}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontWeight: 600, fontSize: '0.82rem', color: '#1a1a2e' }}>
                        {clinic.name}
                      </span>
                      <span style={{ fontSize: '0.7rem', color: '#999' }}>{clinic.email}</span>
                    </div>
                  </td>

                  {/* Subscription pill */}
                  <td style={tdStyle}>
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
                  </td>

                  {/* Trial Ends */}
                  <td style={{ ...tdStyle, color: '#1a1a2e' }}>
                    {formatDate(clinic.trialEndsAt)}
                  </td>

                  {/* Last Active */}
                  <td style={{ ...tdStyle, color: '#1a1a2e' }}>
                    {formatRelativeDate(clinic.lastLoginAt)}
                  </td>

                  {/* Patients */}
                  <td style={{ ...tdStyle, color: '#1a1a2e' }}>
                    {clinic.patientsToday}
                  </td>

                  {/* Joined */}
                  <td style={{ ...tdStyle, color: '#1a1a2e' }}>
                    {formatDate(clinic.createdAt)}
                  </td>

                  {/* Actions */}
                  <td style={tdStyle} onClick={(e) => e.stopPropagation()}>
                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                      {clinic.subscriptionStatus === 'TRIAL' && (
                        <button
                          onClick={() => onExtend(clinic.id, clinic.name)}
                          style={{
                            padding: '0.25rem 0.5rem',
                            borderRadius: 5,
                            fontSize: '0.7rem',
                            border: '1px solid #2a9d6e',
                            background: '#fff',
                            color: '#2a9d6e',
                            cursor: 'pointer',
                            fontWeight: 500,
                          }}
                        >
                          Extend
                        </button>
                      )}
                      {(clinic.subscriptionStatus === 'TRIAL' || clinic.subscriptionStatus === 'EXPIRED') && (
                        <button
                          onClick={() => onUpgrade(clinic.id, clinic.name)}
                          style={{
                            padding: '0.25rem 0.5rem',
                            borderRadius: 5,
                            fontSize: '0.7rem',
                            border: '1px solid #e8e5df',
                            background: '#fff',
                            color: '#1a1a2e',
                            cursor: 'pointer',
                            fontWeight: 500,
                          }}
                        >
                          Upgrade
                        </button>
                      )}
                      <button
                        onClick={() => navigate(`/admin/clinics/${clinic.id}`)}
                        style={{
                          padding: '0.25rem 0.5rem',
                          borderRadius: 5,
                          fontSize: '0.7rem',
                          border: '1px solid #e8e5df',
                          background: '#fff',
                          color: '#1a1a2e',
                          cursor: 'pointer',
                          fontWeight: 500,
                        }}
                      >
                        View
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
      <div
        style={{
          padding: '0.7rem 1.2rem',
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
