import { CheckCircle, Pause } from 'lucide-react';

interface ASSessionControlsProps {
  isDoctorPresent: boolean;
  onToggle: () => void;
  isToggling: boolean;
}

export default function ASSessionControls({ isDoctorPresent, onToggle, isToggling }: ASSessionControlsProps) {
  return (
    <div
      className="as-fade-up as-fade-up-2"
      style={{
        padding: '10px 20px',
        background: 'var(--surface)',
      }}
    >
      <div className="flex gap-2">
        {/* Consultations actives */}
        <button
          onClick={() => { if (!isDoctorPresent) onToggle(); }}
          disabled={isToggling}
          className="flex-1 flex items-center justify-center gap-1.5 transition-colors"
          style={{
            padding: 10,
            borderRadius: 'var(--radius-sm)',
            border: `1px solid ${isDoctorPresent ? 'rgba(27,107,74,0.2)' : 'var(--border)'}`,
            background: isDoctorPresent ? 'var(--accent-light)' : 'var(--surface)',
            color: isDoctorPresent ? 'var(--accent)' : 'var(--text-secondary)',
            fontSize: 13,
            fontWeight: 500,
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          <CheckCircle size={16} />
          Consultations actives
        </button>

        {/* Mettre en pause */}
        <button
          onClick={() => { if (isDoctorPresent) onToggle(); }}
          disabled={isToggling}
          className="flex-1 flex items-center justify-center gap-1.5 transition-colors"
          style={{
            padding: 10,
            borderRadius: 'var(--radius-sm)',
            border: `1px solid ${!isDoctorPresent ? 'rgba(27,107,74,0.2)' : 'var(--border)'}`,
            background: !isDoctorPresent ? 'var(--accent-light)' : 'var(--surface)',
            color: !isDoctorPresent ? 'var(--accent)' : 'var(--text-secondary)',
            fontSize: 13,
            fontWeight: 500,
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          <Pause size={16} />
          Mettre en pause
        </button>
      </div>
    </div>
  );
}
