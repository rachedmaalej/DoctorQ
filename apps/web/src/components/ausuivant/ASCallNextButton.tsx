import { ArrowRight } from 'lucide-react';
import type { QueueEntry } from '@/types';
import { formatArrivalTime, formatDisplayName } from './utils';

interface ASCallNextButtonProps {
  nextPatient: QueueEntry | null;
  onCallNext: () => void;
  isCallingNext: boolean;
  disabled: boolean;
}

export default function ASCallNextButton({ nextPatient, onCallNext, isCallingNext, disabled }: ASCallNextButtonProps) {
  const hasAppointment = nextPatient?.appointmentTime != null;
  const displayName = nextPatient ? formatDisplayName(nextPatient.patientName) : '';
  const arrivalTime = nextPatient?.arrivedAt ? formatArrivalTime(nextPatient.arrivedAt) : '';

  return (
    <div className="as-fade-up as-fade-up-2" style={{ padding: '16px 20px' }}>
      <button
        onClick={onCallNext}
        disabled={disabled || isCallingNext || !nextPatient}
        className="relative w-full overflow-hidden transition-all"
        style={{
          padding: '18px 24px',
          background: disabled ? 'var(--surface-alt)' : 'var(--accent)',
          color: disabled ? 'var(--text-tertiary)' : 'white',
          borderRadius: 'var(--radius)',
          border: 'none',
          cursor: disabled ? 'not-allowed' : 'pointer',
          boxShadow: disabled ? 'none' : '0 2px 12px rgba(27,107,74,0.2)',
          fontFamily: 'inherit',
          textAlign: 'left',
        }}
      >
        {/* Glass sheen */}
        {!disabled && (
          <span
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 60%)',
            }}
          />
        )}

        <div className="relative flex items-center justify-between">
          {/* Left column */}
          <div className="flex flex-col gap-0.5">
            <span
              style={{
                fontSize: 12,
                textTransform: 'uppercase',
                letterSpacing: '1px',
                opacity: 0.75,
                fontWeight: 500,
              }}
            >
              APPELER LE SUIVANT
            </span>
            {nextPatient && (
              <>
                <span
                  style={{
                    fontSize: 19,
                    fontWeight: 600,
                    letterSpacing: '-0.3px',
                  }}
                >
                  {displayName}
                </span>
                <span style={{ fontSize: 12, opacity: 0.7 }}>
                  Arrivée à {arrivalTime}
                  {hasAppointment && ' · Avec rendez-vous'}
                </span>
              </>
            )}
          </div>

          {/* Right: arrow circle */}
          <div
            className="flex items-center justify-center flex-shrink-0"
            style={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              background: disabled ? 'var(--border)' : 'rgba(255,255,255,0.15)',
            }}
          >
            <ArrowRight size={22} />
          </div>
        </div>
      </button>
    </div>
  );
}
