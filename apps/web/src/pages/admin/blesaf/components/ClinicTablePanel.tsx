import { useNavigate } from 'react-router-dom';
import type { AdminClinicVM } from '../../shared/types';
import { formatRelativeTime } from '../../shared/utils';

interface ClinicTablePanelProps {
  clinics: AdminClinicVM[];
  loading: boolean;
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { bg: string; text: string; label: string }> = {
    ACTIVE: { bg: '#dcfce7', text: '#166534', label: 'Active' },
    TRIAL: { bg: '#fef3c7', text: '#92400e', label: 'Trial' },
    EXPIRED: { bg: '#f3f4f6', text: '#6b7280', label: 'Churned' },
    PAST_DUE: { bg: '#fee2e2', text: '#991b1b', label: 'At Risk' },
    CANCELLED: { bg: '#f3f4f6', text: '#6b7280', label: 'Churned' },
  };
  const c = config[status] || config.TRIAL;

  return (
    <span
      className="font-dm font-semibold inline-block"
      style={{
        background: c.bg,
        color: c.text,
        borderRadius: 100,
        padding: '0.2rem 0.6rem',
        fontSize: '0.7rem',
      }}
    >
      {c.label}
    </span>
  );
}

export default function ClinicTablePanel({ clinics, loading }: ClinicTablePanelProps) {
  const navigate = useNavigate();

  if (loading) {
    return (
      <div
        className="flex items-center justify-center"
        style={{ background: '#fff', borderRadius: 16, border: '1px solid #e8e5df', padding: '3rem' }}
      >
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#2a9d6e]" />
      </div>
    );
  }

  return (
    <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e8e5df', overflow: 'hidden' }}>
      {/* Header */}
      <div
        className="flex items-center justify-between"
        style={{ padding: '1rem 1.3rem', borderBottom: '1px solid #e8e5df' }}
      >
        <h2 className="font-outfit font-semibold" style={{ fontSize: '0.95rem', color: '#1a1a2e' }}>
          Clinic Directory
        </h2>
      </div>

      {/* Table */}
      <table className="w-full" style={{ borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #e8e5df' }}>
            {['Clinic', 'Status', 'Patients', 'Last Active'].map((col) => (
              <th
                key={col}
                scope="col"
                className="text-left font-dm font-medium uppercase"
                style={{
                  padding: '0.7rem 1.3rem',
                  fontSize: '0.68rem',
                  letterSpacing: '0.06em',
                  color: '#999999',
                  fontWeight: 500,
                }}
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {clinics.slice(0, 10).map((clinic, i) => (
            <tr
              key={clinic.id}
              tabIndex={0}
              role="link"
              onClick={() => navigate(`/admin/clinics/${clinic.id}`)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  navigate(`/admin/clinics/${clinic.id}`);
                }
              }}
              className="cursor-pointer transition-colors duration-100 hover:bg-[#faf8f5]"
              style={{
                borderBottom: i < clinics.length - 1 ? '1px solid #f3f0ec' : 'none',
              }}
            >
              <td className="font-dm font-semibold" style={{ padding: '0.75rem 1.3rem', fontSize: '0.84rem', color: '#1a1a2e' }}>
                {clinic.name}
              </td>
              <td style={{ padding: '0.75rem 1.3rem' }}>
                <StatusBadge status={clinic.subscriptionStatus} />
              </td>
              <td className="font-dm" style={{ padding: '0.75rem 1.3rem', fontSize: '0.84rem', color: '#1a1a2e' }}>
                {clinic.patientsThisMonth}
              </td>
              <td className="font-dm" style={{ padding: '0.75rem 1.3rem', fontSize: '0.84rem', color: '#999999' }}>
                {clinic.lastActiveAt ? formatRelativeTime(clinic.lastActiveAt, 'en') : 'Never'}
              </td>
            </tr>
          ))}
          {clinics.length === 0 && (
            <tr>
              <td colSpan={4} className="text-center font-dm" style={{ padding: '2rem', color: '#8a8a9a', fontSize: '0.84rem' }}>
                No clinics found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
