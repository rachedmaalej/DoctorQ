interface MorningCardProps {
  doctorLastName: string;
  preRegisteredCount: number;
}

export default function MorningCard({ doctorLastName, preRegisteredCount }: MorningCardProps) {
  const hasPatients = preRegisteredCount > 0;

  return (
    <div className="mx-5 mt-5 bg-bs-surface border border-bs-border rounded-bs text-center" style={{ padding: '28px 24px' }}>
      <div style={{ fontSize: 36, marginBottom: 12 }}>&#9728;&#65039;</div>
      <div
        className="text-bs-text-primary font-bold"
        style={{ fontSize: 20, letterSpacing: '-0.02em' }}
      >
        Bonjour, Dr. {doctorLastName}
      </div>
      <div
        className="text-bs-text-secondary mt-1.5"
        style={{ fontSize: 14, lineHeight: 1.5 }}
      >
        Votre journée va commencer
      </div>
      {hasPatients && (
        <div
          className="inline-flex items-center gap-1.5 bg-bs-accent-light text-bs-accent rounded-full font-bold mt-4"
          style={{ padding: '6px 14px', fontSize: 13 }}
        >
          <span className="material-symbols-rounded" style={{ fontSize: 16 }}>group</span>
          {preRegisteredCount} patients pré-inscrits
        </div>
      )}
    </div>
  );
}
