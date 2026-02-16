interface PSCalledHeroProps {
  doctorName?: string | null;
}

function LogInIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M13.8 12H3" />
    </svg>
  );
}

export default function PSCalledHero({ doctorName }: PSCalledHeroProps) {
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
      {/* Breathing icon circle */}
      <div className="ps-called-circle">
        <LogInIcon />
      </div>

      {/* Title */}
      <div
        style={{
          fontFamily: "'Fraunces', Georgia, serif",
          fontSize: 32,
          fontWeight: 600,
          color: 'var(--accent)',
          letterSpacing: '-1px',
          marginBottom: 8,
        }}
      >
        Vous pouvez entrer
      </div>

      {/* Subtitle */}
      <div style={{ fontSize: 16, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
        {doctorName ? (
          <>
            Le {doctorName} vous attend.
            <br />
            Rendez-vous dans le cabinet.
          </>
        ) : (
          <>
            On vous attend.
            <br />
            Rendez-vous dans le cabinet.
          </>
        )}
      </div>
    </div>
  );
}
