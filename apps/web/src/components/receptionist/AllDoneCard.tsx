import type { DaySummaryBrief } from './types';

interface AllDoneCardProps {
  summary: DaySummaryBrief;
  onEndDay?: () => void;
  onReopen?: () => void;
}

export default function AllDoneCard({ summary, onEndDay, onReopen }: AllDoneCardProps) {
  return (
    <div
      className="mx-5 bg-bs-surface border border-bs-border rounded-bs text-center"
      style={{ marginTop: 40, padding: '32px 24px' }}
    >
      {/* Success icon */}
      <div className="w-14 h-14 rounded-full text-white flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#2D8B4E' }}>
        <span
          className="material-symbols-rounded"
          style={{ fontSize: 28, fontVariationSettings: "'FILL' 1" }}
        >
          check_circle
        </span>
      </div>

      <div className="text-bs-text-primary font-bold" style={{ fontSize: 18 }}>
        Tous les patients ont été vus
      </div>

      {/* Stats row */}
      <div className="flex justify-center gap-6 my-4">
        <StatBlock value={String(summary.totalPatients)} label="Patients" />
        <StatBlock value={`${summary.avgWaitMinutes} min`} label="Attente moy." />
        <StatBlock value={`${summary.avgConsultMinutes} min`} label="Consult. moy." />
      </div>

      {/* Action buttons */}
      <div className="flex flex-col gap-2.5 mt-5">
        <button
          onClick={onEndDay}
          className="w-full h-[52px] rounded-bs text-white font-bold flex items-center justify-center gap-2 transition-all duration-150 active:scale-[0.97]"
          style={{ fontSize: 15, backgroundColor: '#0F7B6C', boxShadow: '0 6px 24px rgba(15,123,108,0.25)', border: 'none' }}
        >
          <span className="material-symbols-rounded" style={{ fontSize: 20 }}>summarize</span>
          Terminer la journée
        </button>
        <button
          onClick={onReopen}
          className="w-full h-[52px] rounded-bs bg-transparent text-bs-text-secondary font-bold flex items-center justify-center gap-2 transition-all duration-150 active:scale-[0.97]"
          style={{ fontSize: 15, border: '1.5px solid #E8E6DF' }}
        >
          <span className="material-symbols-rounded" style={{ fontSize: 20 }}>refresh</span>
          Rouvrir la file
        </button>
      </div>
    </div>
  );
}

function StatBlock({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div
        className="text-bs-accent font-bold"
        style={{ fontSize: 24, letterSpacing: '-0.02em' }}
      >
        {value}
      </div>
      <div
        className="text-bs-text-tertiary uppercase mt-0.5"
        style={{ fontSize: 11, letterSpacing: '0.04em' }}
      >
        {label}
      </div>
    </div>
  );
}
