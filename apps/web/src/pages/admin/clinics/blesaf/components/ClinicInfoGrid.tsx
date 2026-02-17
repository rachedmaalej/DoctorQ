import type { ClinicDetail } from '@/types';
import { useIsMobile } from '../../useIsMobile';
import { ONBOARDING_STEPS } from '../../shared/types';

interface ClinicInfoGridProps {
  clinic: ClinicDetail['clinic'];
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'Never';
  return new Date(dateStr).toLocaleDateString('en-GB');
}

export default function ClinicInfoGrid({ clinic }: ClinicInfoGridProps) {
  const isMobile = useIsMobile();

  const stepName = ONBOARDING_STEPS[clinic.onboardingStep]?.en || 'Unknown';

  const fields = [
    { label: 'Email', value: clinic.email, breakAll: true },
    { label: 'Phone', value: clinic.phone || '—' },
    { label: 'Language', value: clinic.language === 'ar' ? 'Arabic' : 'French' },
    { label: 'Spécialité', value: clinic.businessType || '—' },
    { label: isMobile ? 'Avg Consult.' : 'Avg Consultation', value: `${clinic.avgConsultationMins} Min` },
    { label: isMobile ? 'Notify at' : 'Notify at Position', value: `#${clinic.notifyAtPosition}` },
    { label: 'Created', value: formatDate(clinic.createdAt) },
    { label: isMobile ? 'Last Login' : 'Last Login', value: formatDate(clinic.lastLoginAt) },
  ];

  // Desktop-only fields
  if (!isMobile) {
    fields.push(
      { label: 'Onboarding', value: `Step ${clinic.onboardingStep}/4 — ${stepName}`, breakAll: false },
      { label: 'Address', value: clinic.address || '—' },
    );
  }

  const labelStyle: React.CSSProperties = {
    fontSize: '0.62rem',
    color: '#2a9d6e',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: '0.15rem',
    fontWeight: 500,
    fontFamily: "'DM Sans', sans-serif",
  };

  const valueStyle: React.CSSProperties = {
    fontFamily: "'DM Sans', sans-serif",
    fontWeight: 500,
    fontSize: '0.85rem',
    color: '#1a1a2e',
  };

  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 14,
        border: '1px solid #e8e5df',
        padding: '1.3rem',
        marginBottom: '1.2rem',
      }}
    >
      {/* Section label */}
      <div
        style={{
          fontFamily: "'Outfit', sans-serif",
          fontSize: '0.72rem',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: '#999',
          marginBottom: '0.8rem',
        }}
      >
        Clinic Info
      </div>

      {/* Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
          gap: '1rem 1.5rem',
        }}
      >
        {fields.map((f) => (
          <div key={f.label}>
            <div style={labelStyle}>{f.label}</div>
            <div style={{ ...valueStyle, ...(f.breakAll ? { wordBreak: 'break-all', fontSize: isMobile ? '0.78rem' : '0.85rem' } : {}) }}>
              {f.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
