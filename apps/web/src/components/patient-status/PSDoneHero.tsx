interface PSDoneHeroProps {
  doctorName?: string | null;
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

export default function PSDoneHero({ doctorName }: PSDoneHeroProps) {
  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '40px 20px',
        minHeight: 280,
      }}
    >
      {/* Icon circle */}
      <div className="ps-done-circle">
        <CheckIcon />
      </div>

      {/* Title */}
      <div
        style={{
          fontFamily: "'Fraunces', Georgia, serif",
          fontSize: 24,
          fontWeight: 500,
          color: 'var(--text-primary)',
          letterSpacing: '-0.5px',
          marginBottom: 6,
        }}
      >
        Merci pour votre visite
      </div>

      {/* Subtitle */}
      {doctorName && (
        <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
          Chez le {doctorName}
        </div>
      )}
    </div>
  );
}
