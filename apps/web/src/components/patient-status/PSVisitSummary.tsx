import { computeWaitDuration, formatConsultationTime } from './utils';

interface PSVisitSummaryProps {
  arrivedAt: string;
  calledAt: string | null;
  doctorName?: string | null;
}

export default function PSVisitSummary({ arrivedAt, calledAt, doctorName }: PSVisitSummaryProps) {
  const waitMins = computeWaitDuration(arrivedAt, calledAt);
  const consultTime = calledAt ? formatConsultationTime(calledAt) : null;

  return (
    <div className="ps-summary ps-fade-up-d3">
      <div className="ps-summary-header">Votre visite aujourd'hui</div>

      <div style={{ display: 'flex', gap: 20, marginBottom: 16 }}>
        {/* Wait time stat */}
        <div>
          <div className="ps-summary-value">{waitMins} min</div>
          <div className="ps-summary-label">temps d'attente</div>
        </div>

        {/* Consultation time stat */}
        {consultTime && (
          <div>
            <div className="ps-summary-value">{consultTime}</div>
            <div className="ps-summary-label">heure de consultation</div>
          </div>
        )}
      </div>

      {/* Re-booking CTA */}
      {doctorName && (
        <button className="ps-summary-cta">
          Reprendre RDV avec le {doctorName}
        </button>
      )}
    </div>
  );
}
