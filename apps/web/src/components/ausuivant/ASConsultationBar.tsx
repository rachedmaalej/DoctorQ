interface ASConsultationBarProps {
  patientName: string;
  durationMinutes: number;
}

export default function ASConsultationBar({ patientName, durationMinutes }: ASConsultationBarProps) {
  return (
    <div
      className="as-fade-up as-fade-up-3"
      style={{
        margin: '0 20px 8px',
        padding: '14px 16px',
        background: 'var(--blue-light)',
        borderRadius: 'var(--radius)',
        border: '1px solid rgba(44,95,138,0.1)',
      }}
    >
      <div className="flex items-center justify-between">
        {/* Left: dot + name */}
        <div className="flex items-center gap-2.5">
          <span
            className="as-pulse-consultation flex-shrink-0"
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: 'var(--blue)',
              display: 'inline-block',
            }}
          />
          <span style={{ fontSize: 13, color: 'var(--blue)' }}>
            En consultation :{' '}
            <span style={{ fontWeight: 600 }}>{patientName}</span>
          </span>
        </div>

        {/* Right: duration */}
        <span
          style={{
            fontSize: 12,
            color: 'var(--blue)',
            opacity: 0.7,
            fontWeight: 500,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {durationMinutes} min
        </span>
      </div>
    </div>
  );
}
