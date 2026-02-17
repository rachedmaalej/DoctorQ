import type { PreRegisteredPatient } from './types';

interface PreRegisteredListProps {
  patients: PreRegisteredPatient[];
}

export default function PreRegisteredList({ patients }: PreRegisteredListProps) {
  return (
    <div className="px-5">
      {patients.map((patient, i) => (
        <div
          key={patient.id}
          className={`flex items-center gap-3 py-3 ${i < patients.length - 1 ? 'border-b border-bs-border' : ''}`}
        >
          {/* Position circle — all accent in pre-registered list */}
          <div
            className="w-7 h-7 rounded-full bg-bs-accent-light text-bs-accent flex items-center justify-center shrink-0 font-bold"
            style={{ fontSize: 13 }}
          >
            {patient.position}
          </div>

          {/* Info block */}
          <div className="flex-1">
            <div className="text-bs-text-primary font-semibold" style={{ fontSize: 15 }}>
              {patient.name}
            </div>
            <div
              className="text-bs-text-tertiary flex items-center gap-[5px] mt-px"
              style={{ fontSize: 12 }}
            >
              {patient.hasPhone ? `📱 Inscrit${patient.name.endsWith('a') || patient.name.endsWith('i') ? 'e' : ''} à ${patient.registeredAt}` : `Inscrit${patient.name.endsWith('a') || patient.name.endsWith('i') ? 'e' : ''} à ${patient.registeredAt}`}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
