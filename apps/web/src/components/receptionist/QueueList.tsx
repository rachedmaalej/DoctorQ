import type { QueuePatient } from './types';
import QueueItem from './QueueItem';

interface QueueListProps {
  patients: QueuePatient[];
  onContextOpen?: (patient: QueuePatient) => void;
}

export default function QueueList({ patients, onContextOpen }: QueueListProps) {
  return (
    <div className="px-5 flex flex-col gap-0.5">
      {patients.map((patient, i) => (
        <QueueItem
          key={patient.id}
          patient={patient}
          isFirst={i === 0}
          isLast={i === patients.length - 1}
          onContextOpen={onContextOpen}
        />
      ))}
    </div>
  );
}
