import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { Doctor, QueueEntry } from '@/types';
import { QueueStatus } from '@/types';
import { formatDoctorName, formatDisplayName } from '@/components/ausuivant/utils';
import DoctorPanel from './DoctorPanel';
import type { DoctorPanelData } from './DoctorPanel';

interface DoctorsPanelSectionProps {
  doctors: Doctor[];
  queue: QueueEntry[];
  waitingByDoctor: Map<string, number>;
  onDoctorClick: (doctorId: string) => void;
  onCallNext: (doctorId: string) => void;
}

export default function DoctorsPanelSection({
  doctors,
  queue,
  waitingByDoctor,
  onDoctorClick,
  onCallNext,
}: DoctorsPanelSectionProps) {
  const { t } = useTranslation();

  // Accordion state — only one panel open at a time
  const [openDoctorId, setOpenDoctorId] = useState<string | null>(null);

  const visibleDoctors = useMemo(
    () => doctors.filter((d) => d.state !== 'inactive' && d.isActive),
    [doctors],
  );

  // Count unassigned waiting patients
  const unassignedWaiting = useMemo(() => {
    return queue.filter(
      (e) => !e.doctorId && (e.status === QueueStatus.WAITING || e.status === QueueStatus.NOTIFIED),
    ).length;
  }, [queue]);

  // Derive DoctorPanelData from raw data
  const panelData: DoctorPanelData[] = useMemo(() => {
    return visibleDoctors.map((doc) => {
      const assignedWaiting = waitingByDoctor.get(doc.id) || 0;
      const totalWaiting = assignedWaiting + unassignedWaiting;

      // Find current patient in consultation
      const inConsult = queue.find(
        (e) => e.doctorId === doc.id && e.status === QueueStatus.IN_CONSULTATION,
      );

      // Compute seen count
      let seenCount = 0;
      let totalWaitMs = 0;
      let waitSamples = 0;

      for (const e of queue) {
        if (e.doctorId !== doc.id) continue;
        if (e.status === QueueStatus.COMPLETED || e.status === QueueStatus.IN_CONSULTATION) {
          seenCount++;
        }
        if (e.calledAt && e.arrivedAt) {
          const wait = new Date(e.calledAt).getTime() - new Date(e.arrivedAt).getTime();
          if (wait > 0) {
            totalWaitMs += wait;
            waitSamples++;
          }
        }
      }

      const avgWaitMinutes = waitSamples > 0 ? Math.round(totalWaitMs / waitSamples / 60000) : null;

      let currentPatient: DoctorPanelData['currentPatient'] = null;
      if (inConsult) {
        const elapsed = inConsult.calledAt
          ? Math.round((Date.now() - new Date(inConsult.calledAt).getTime()) / 60000)
          : 0;
        currentPatient = {
          name: formatDisplayName(inConsult.patientName),
          elapsedMinutes: elapsed,
        };
      }

      return {
        id: doc.id,
        name: formatDoctorName(doc.name),
        specialty: doc.specialty,
        isPresent: doc.state === 'consulting' || doc.state === 'free',
        currentPatient,
        waitingCount: totalWaiting,
        seenCount,
        avgWaitMinutes,
      };
    });
  }, [visibleDoctors, queue, waitingByDoctor, unassignedWaiting]);

  // Auto-expand if single doctor
  const effectiveOpenId =
    panelData.length === 1 && openDoctorId === null ? panelData[0].id : openDoctorId;

  const handleToggle = (doctorId: string) => {
    setOpenDoctorId((prev) => (prev === doctorId ? null : doctorId));
  };

  if (visibleDoctors.length === 0) return null;

  return (
    <div
      className="as-fade-up as-fade-up-2"
      style={{
        background: 'var(--color-surface, #fff)',
        border: '1px solid var(--color-border-subtle, #E8E6DF)',
        borderRadius: 'var(--radius, 12px)',
        overflow: 'hidden',
      }}
    >
      {/* Section header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 7,
          padding: '12px 14px 8px',
        }}
      >
        <span
          style={{
            width: 7,
            height: 7,
            borderRadius: '50%',
            background: 'var(--section-doctors-accent, #0F7B6C)',
            display: 'inline-block',
          }}
        />
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: 'var(--section-doctors-accent, #0F7B6C)',
          }}
        >
          {t('queue.doctors.title', 'Médecins')}
        </span>
        {/* Count badge */}
        <span
          style={{
            marginLeft: 'auto',
            width: 22,
            height: 22,
            borderRadius: 5,
            background: 'var(--accent-light, #E8F5F1)',
            color: 'var(--section-doctors-accent, #0F7B6C)',
            fontFamily: 'monospace',
            fontSize: 11,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {visibleDoctors.length}
        </span>
      </div>

      {/* Doctor panels */}
      {panelData.map((doc, idx) => (
        <DoctorPanel
          key={doc.id}
          doctor={doc}
          isOpen={effectiveOpenId === doc.id}
          onToggle={() => {
            handleToggle(doc.id);
            onDoctorClick(doc.id);
          }}
          onCallNext={onCallNext}
          isLast={idx === panelData.length - 1}
        />
      ))}
    </div>
  );
}
