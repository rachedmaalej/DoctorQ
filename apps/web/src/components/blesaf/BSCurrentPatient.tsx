import type { QueueEntry } from '@/types';
import { formatTimeShort, getConsultationMinutes } from './utils';

interface BSCurrentPatientProps {
  patient: QueueEntry;
  onCallNext: () => void;
  isCallingNext: boolean;
  canCallNext: boolean;
}

export default function BSCurrentPatient({
  patient,
  onCallNext,
  isCallingNext,
  canCallNext,
}: BSCurrentPatientProps) {
  const arrivedTime = formatTimeShort(patient.arrivedAt);
  const consultMins = patient.calledAt ? getConsultationMinutes(patient.calledAt) : 0;

  return (
    <>
      <div className="bs-section-header bs-animate-in bs-delay-3">
        <span className="bs-section-title">En consultation</span>
      </div>
      <div className="bs-current-patient bs-animate-in bs-delay-3">
        <div className="bs-cp-label">Patient actuel</div>
        <div className="bs-cp-name">{patient.patientName || 'Patient'}</div>
        <div className="bs-cp-meta">
          Arrivé à {arrivedTime} · Consultation depuis {consultMins} min
        </div>
        <div className="bs-cp-actions">
          <button
            className="bs-cp-btn primary"
            onClick={onCallNext}
            disabled={isCallingNext || !canCallNext}
          >
            <span className="material-symbols-rounded">arrow_forward</span>
            Suivant
          </button>
          {patient.patientPhone && (
            <a
              href={`tel:${patient.patientPhone}`}
              className="bs-cp-btn"
              aria-label="Appeler le patient"
            >
              <span className="material-symbols-rounded">phone</span>
            </a>
          )}
        </div>
      </div>
    </>
  );
}
