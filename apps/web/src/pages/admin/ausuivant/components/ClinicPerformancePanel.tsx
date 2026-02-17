import { useNavigate } from 'react-router-dom';
import type { AdminClinicVM } from '../../shared/types';

interface ClinicPerformancePanelProps {
  clinics: AdminClinicVM[];
  loading: boolean;
}

function ClinicAvatar({ initials }: { initials: string }) {
  return (
    <div
      aria-hidden="true"
      className="flex items-center justify-center flex-shrink-0 font-dm font-semibold"
      style={{
        width: 32,
        height: 32,
        borderRadius: '50%',
        background: '#e5e0d8',
        color: '#777777',
        fontSize: '0.65rem',
      }}
    >
      {initials}
    </div>
  );
}

function getStatusLabel(status: string): string {
  switch (status) {
    case 'ACTIVE': return 'Actif';
    case 'TRIAL': return 'Essai';
    case 'EXPIRED': return 'Expire';
    case 'PAST_DUE': return 'En retard';
    case 'CANCELLED': return 'Annule';
    default: return status;
  }
}

export default function ClinicPerformancePanel({ clinics, loading }: ClinicPerformancePanelProps) {
  const navigate = useNavigate();

  if (loading) {
    return (
      <div
        className="flex items-center justify-center"
        style={{ background: '#fff', borderRadius: 14, border: '1px solid #e5e0d8', padding: '3rem' }}
      >
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#c0392b]" />
      </div>
    );
  }

  return (
    <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e5e0d8', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '1rem 1.3rem', borderBottom: '1px solid #e5e0d8' }}>
        <h2 className="font-playfair font-semibold" style={{ fontSize: '0.92rem', color: '#1a1a2e' }}>
          Performance Cabinets
        </h2>
      </div>

      {/* Rows */}
      {clinics.length === 0 ? (
        <div className="text-center font-dm" style={{ padding: '2rem', color: '#999999', fontSize: '0.82rem' }}>
          Aucun cabinet
        </div>
      ) : (
        <div>
          {clinics.slice(0, 10).map((clinic, i) => (
            <div
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
              className="flex items-center cursor-pointer transition-colors duration-100 hover:bg-[#faf8f5]"
              style={{
                padding: '0.7rem 1.3rem',
                gap: '0.8rem',
                borderBottom: i < Math.min(clinics.length, 10) - 1 ? '1px solid #f0ebe4' : 'none',
              }}
            >
              <ClinicAvatar initials={clinic.initials} />
              <div className="flex-1 min-w-0">
                <div className="font-dm font-medium truncate" style={{ fontSize: '0.82rem', color: '#1a1a2e' }}>
                  {clinic.name}
                </div>
                <div className="font-dm truncate" style={{ fontSize: '0.68rem', color: '#999999' }}>
                  {getStatusLabel(clinic.subscriptionStatus)}
                  {clinic.doctorName ? ` \u00B7 ${clinic.doctorName}` : ''}
                </div>
              </div>
              <div className="font-dm font-semibold flex-shrink-0" style={{ fontSize: '0.85rem', color: '#1a1a2e' }}>
                {clinic.patientsThisMonth} pts
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
