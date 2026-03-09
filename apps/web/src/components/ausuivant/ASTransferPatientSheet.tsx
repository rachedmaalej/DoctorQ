import ASIcon from './ASIcon';
import { useState } from 'react';

import type { Doctor, QueueEntry } from '@/types';
import { getDoctorColor } from './ASPatientRow';
import { formatDoctorName } from './utils';

interface ASTransferPatientSheetProps {
  isOpen: boolean;
  onClose: () => void;
  patient: QueueEntry | null;
  doctors: Doctor[];
  waitingByDoctor: Map<string, number>;
  onTransfer: (patientId: string, targetDoctorId: string) => void;
}

export default function ASTransferPatientSheet({
  isOpen,
  onClose,
  patient,
  doctors,
  waitingByDoctor,
  onTransfer,
}: ASTransferPatientSheetProps) {
  const [selectedDoctorId, setSelectedDoctorId] = useState<string | null>(null);

  if (!isOpen || !patient) return null;

  // Available doctors: active, not the current doctor
  const availableDoctors = doctors.filter(
    (d) => d.isActive && d.id !== patient.doctorId && d.state !== 'absent_today' && d.state !== 'inactive',
  );

  const handleTransfer = () => {
    if (selectedDoctorId) {
      onTransfer(patient.id, selectedDoctorId);
      setSelectedDoctorId(null);
      onClose();
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0"
        style={{
          background: 'rgba(44,74,62,0.4)',
          zIndex: 200,
        }}
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        className="fixed bottom-0 left-0 right-0"
        style={{
          maxWidth: 430,
          margin: '0 auto',
          background: 'var(--color-bg)',
          borderRadius: 'var(--radius-xl) var(--radius-xl) 0 0',
          zIndex: 210,
          maxHeight: '70dvh',
          overflowY: 'auto',
        }}
      >
        {/* Drag handle */}
        <div className="flex justify-center" style={{ padding: '10px 0 4px' }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--color-border-subtle)' }} />
        </div>

        {/* Header */}
        <div
          className="flex items-center justify-between"
          style={{ padding: '8px 18px 12px' }}
        >
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text-primary)' }}>
              Transferer {patient.patientName || 'Patient'}
            </div>
            <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
              Choisir le medecin destinataire
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 32,
              height: 32,
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              background: 'var(--color-surface-alt)',
              color: 'var(--color-text-muted)',
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
        <div style={{ padding: '0 18px 18px' }}>
          {availableDoctors.length === 0 ? (
            <div
              style={{
                padding: 24,
                textAlign: 'center',
                color: 'var(--color-text-muted)',
                fontSize: 13,
              }}
            >
              Aucun medecin disponible pour le transfert
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {availableDoctors.map((doc) => {
                const color = getDoctorColor(doc.id, doctors);
                const waiting = waitingByDoctor.get(doc.id) || 0;
                const isSelected = selectedDoctorId === doc.id;

                return (
                  <button
                    key={doc.id}
                    onClick={() => setSelectedDoctorId(doc.id)}
                    className="flex items-center gap-3"
                    style={{
                      padding: '12px 14px',
                      borderRadius: 'var(--radius)',
                      border: `1.5px solid ${isSelected ? 'var(--color-primary)' : 'var(--color-border-subtle)'}`,
                      background: isSelected ? 'var(--color-primary-light)' : 'var(--color-surface)',
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      textAlign: 'left',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 'var(--radius-sm)',
                        background: color.bg,
                        color: color.fg,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: 13,
                        flexShrink: 0,
                      }}
                    >
                      {doc.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)' }}>
                        {formatDoctorName(doc.name)}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                        {waiting} en attente
                      </div>
                    </div>
                    {isSelected && (
                      <div
                        style={{
                          width: 20,
                          height: 20,
                          borderRadius: 10,
                          background: 'var(--color-primary)',
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 12,
                          fontWeight: 700,
                        }}
                      >
                        &#10003;
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Confirm button */}
          {selectedDoctorId && (
            <button
              onClick={handleTransfer}
              style={{
                marginTop: 12,
                width: '100%',
                padding: 14,
                borderRadius: 'var(--radius)',
                border: 'none',
                background: 'var(--color-primary)',
                color: 'white',
                fontSize: 14,
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              Confirmer le transfert
            </button>
          )}
        </div>
      </div>
    </>
  );
}
