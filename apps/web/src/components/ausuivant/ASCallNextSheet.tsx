import ASIcon from './ASIcon';

import type { Doctor } from '@/types';
import { getDoctorColor } from './ASPatientRow';
import { formatDoctorName } from './utils';

interface ASCallNextSheetProps {
  isOpen: boolean;
  onClose: () => void;
  doctors: Doctor[];
  waitingByDoctor: Map<string, number>;
  unassignedWaiting?: number;
  onCallNextForDoctor: (doctorId: string) => void;
  onCallNextGlobal: () => void;
  isCallingNext: boolean;
}

export default function ASCallNextSheet({
  isOpen,
  onClose,
  doctors,
  waitingByDoctor,
  unassignedWaiting = 0,
  onCallNextForDoctor,
  onCallNextGlobal,
  isCallingNext,
}: ASCallNextSheetProps) {
  if (!isOpen) return null;

  const activeDoctors = doctors.filter(d => d.isActive);
  const hasDoctors = activeDoctors.length > 0;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0"
        style={{ background: 'rgba(44,74,62,0.4)', zIndex: 50 }}
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        className="fixed bottom-0 left-0 right-0"
        style={{
          background: 'var(--color-surface)',
          borderTopLeftRadius: 'var(--radius-xl)',
          borderTopRightRadius: 'var(--radius-xl)',
          boxShadow: 'var(--shadow-modal)',
          zIndex: 51,
          maxWidth: 430,
          margin: '0 auto',
          paddingBottom: 'max(16px, env(safe-area-inset-bottom))',
        }}
      >
        {/* Drag handle */}
        <div className="flex justify-center" style={{ padding: '10px 0 0' }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--color-border-subtle)' }} />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between" style={{ padding: '16px 18px 8px' }}>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: 'var(--color-text-primary)' }}>
              Appeler le suivant
            </h3>
            <p style={{ fontSize: 12, color: 'var(--color-text-muted)', margin: '2px 0 0' }}>
              {hasDoctors ? 'Pour quel m\u00e9decin ?' : "Confirmer l'appel"}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 32,
              height: 32,
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              background: 'var(--color-surface-alt)',
              color: 'var(--color-text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ASIcon name="close" size={16} />
          </button>
        </div>

        {/* Doctor list */}
        <div style={{ padding: '8px 18px' }}>
          {hasDoctors ? (
            <div className="flex flex-col gap-2">
              {activeDoctors.map((doctor) => {
                const assigned = waitingByDoctor.get(doctor.id) || 0;
                const waiting = assigned + unassignedWaiting;
                const color = getDoctorColor(doctor.id, doctors);
                const hasPatients = waiting > 0;

                return (
                  <button
                    key={doctor.id}
                    onClick={() => {
                      if (hasPatients) {
                        onCallNextForDoctor(doctor.id);
                        onClose();
                      }
                    }}
                    disabled={!hasPatients || isCallingNext}
                    className="flex items-center gap-3 w-full"
                    style={{
                      padding: '12px',
                      borderRadius: 'var(--radius)',
                      border: `1.5px solid ${hasPatients ? color.fg + '30' : 'var(--color-border-subtle)'}`,
                      background: hasPatients ? color.bg : 'var(--color-surface-alt)',
                      cursor: hasPatients ? 'pointer' : 'default',
                      opacity: hasPatients ? 1 : 0.5,
                      fontFamily: 'inherit',
                      textAlign: 'left',
                    }}
                  >
                    {/* Doctor initial */}
                    <div
                      className="flex items-center justify-center flex-shrink-0"
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 'var(--radius-sm)',
                        background: color.fg,
                        color: 'white',
                        fontWeight: 700,
                        fontSize: 14,
                      }}
                    >
                      {doctor.name.replace(/^Dr\.?\s*/i, '').charAt(0).toUpperCase()}
                    </div>

                    {/* Doctor info */}
                    <div className="flex-1 min-w-0">
                      <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--color-text-primary)' }}>
                        {formatDoctorName(doctor.name)}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                        {hasPatients
                          ? `${waiting} en attente`
                          : 'Aucun patient en attente'}
                      </div>
                    </div>

                    {/* Arrow */}
                    {hasPatients && (
                      <ASIcon name="chevron_right" size={18} style={{ color: color.fg, flexShrink: 0 }} />
                    )}
                  </button>
                );
              })}
            </div>
          ) : (
            <button
              onClick={() => { onCallNextGlobal(); onClose(); }}
              disabled={isCallingNext}
              className="flex items-center justify-center gap-2 w-full"
              style={{
                padding: '14px',
                borderRadius: 'var(--radius)',
                border: 'none',
                background: 'var(--section-waiting-accent)',
                color: 'white',
                fontWeight: 700,
                fontSize: 15,
                cursor: 'pointer',
                fontFamily: 'inherit',
                opacity: isCallingNext ? 0.7 : 1,
              }}
            >
              Appeler le prochain patient
              <ASIcon name="chevron_right" size={18} />
            </button>
          )}
        </div>
      </div>
    </>
  );
}
