interface PSHeaderProps {
  clinicName?: string;
  specialty?: string;
}

export default function PSHeader({ clinicName, specialty }: PSHeaderProps) {
  return (
    <div
      className="ps-fade-up"
      style={{ padding: '16px 20px 12px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}
    >
      <div>
        {clinicName && (
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.2px' }}>
            {clinicName}
          </div>
        )}
        {specialty && (
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 1 }}>
            {specialty}
          </div>
        )}
      </div>
      <div className="ps-conn-dot" aria-label="Connexion active" />
    </div>
  );
}
