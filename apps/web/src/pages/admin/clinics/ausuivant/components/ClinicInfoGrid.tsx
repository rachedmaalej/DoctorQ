import type { ClinicDetail } from '@/types';
import { useIsMobile } from '../../useIsMobile';
import { ONBOARDING_STEPS } from '../../shared/types';

interface ClinicInfoGridProps {
  clinic: ClinicDetail['clinic'];
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'Jamais';
  return new Date(dateStr).toLocaleDateString('fr-FR');
}

export default function ClinicInfoGrid({ clinic }: ClinicInfoGridProps) {
  const isMobile = useIsMobile();

  const stepName = ONBOARDING_STEPS[clinic.onboardingStep]?.fr || 'Inconnu';

  const fields = [
    { label: 'Email', value: clinic.email, breakAll: true },
    { label: 'Téléphone', value: clinic.phone || '—' },
    { label: 'Langue', value: clinic.language === 'ar' ? 'Arabe' : 'Français' },
    { label: 'Spécialité', value: clinic.businessType || '—' },
    { label: isMobile ? 'Consult. Moy.' : 'Consultation Moy.', value: `${clinic.avgConsultationMins} Min` },
    { label: isMobile ? 'Notifier à' : 'Notifier à la Position', value: `#${clinic.notifyAtPosition}` },
    { label: 'Créé le', value: formatDate(clinic.createdAt) },
    { label: isMobile ? 'Connexion' : 'Dernière Connexion', value: formatDate(clinic.lastLoginAt) },
  ];

  if (!isMobile) {
    fields.push(
      { label: 'Onboarding', value: `Étape ${clinic.onboardingStep}/4 — ${stepName}`, breakAll: false },
      { label: 'Adresse', value: clinic.address || '—' },
    );
  }

  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 12,
        border: '1px solid #e5e0d8',
        padding: '1.3rem',
        marginBottom: '1.2rem',
      }}
    >
      <div
        style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: '0.72rem',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: '#999',
          marginBottom: '0.8rem',
        }}
      >
        Informations du Cabinet
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
          gap: '1rem 1.5rem',
        }}
      >
        {fields.map((f) => (
          <div key={f.label}>
            <div
              style={{
                fontSize: '0.62rem',
                color: '#c0392b',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '0.15rem',
                fontWeight: 500,
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              {f.label}
            </div>
            <div
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontWeight: 500,
                fontSize: f.breakAll && isMobile ? '0.78rem' : '0.85rem',
                color: '#1a1a2e',
                ...(f.breakAll ? { wordBreak: 'break-all' as const } : {}),
              }}
            >
              {f.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
