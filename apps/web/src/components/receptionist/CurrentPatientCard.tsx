import { useTranslation } from 'react-i18next';
import clsx from 'clsx';
import type { CurrentPatientData } from './types';

interface CurrentPatientCardProps {
  patient: CurrentPatientData;
  onNext?: () => void;
}

export default function CurrentPatientCard({ patient, onNext }: CurrentPatientCardProps) {
  const { t } = useTranslation();

  const handleCall = () => {
    if (patient.phone) {
      window.open(`tel:${patient.phone}`, '_self');
    }
  };

  return (
    <div
      className="bs-cp-card mx-5 rounded-bs p-4 text-white relative overflow-hidden"
      style={{ backgroundColor: '#0F7B6C' }}
    >
      <div
        className="uppercase font-semibold opacity-70 mb-1.5"
        style={{ fontSize: 11, letterSpacing: '0.08em' }}
      >
        {t('receptionist.currentPatient.label')}
      </div>
      <div
        className="font-bold"
        style={{ fontSize: 20, letterSpacing: '-0.02em' }}
      >
        {patient.name}
      </div>
      <div className="opacity-70 mt-0.5" style={{ fontSize: 13 }}>
        {t('receptionist.currentPatient.meta', { arrivedAt: patient.arrivedAt, minutes: patient.consultingSinceMinutes })}
      </div>
      <div className="flex gap-2 mt-3.5">
        {/* Primary: Terminer */}
        <button
          onClick={onNext}
          className="h-9 px-3.5 rounded-full font-semibold flex items-center gap-1.5 transition-all duration-150 active:opacity-90"
          style={{ fontSize: 13, backgroundColor: '#fff', color: '#0F7B6C', border: '1.5px solid #fff' }}
        >
          <span className="material-symbols-rounded" style={{ fontSize: 16, fontVariationSettings: "'FILL' 1" }}>check_circle</span>
          {t('receptionist.currentPatient.finish')}
        </button>
        {/* Secondary: Phone */}
        <button
          onClick={handleCall}
          className={clsx(
            'h-9 px-3.5 rounded-full text-white font-semibold flex items-center transition-all duration-150 active:bg-white/20',
            !patient.phone && 'opacity-30 pointer-events-none',
          )}
          style={{ fontSize: 13, backgroundColor: 'rgba(255,255,255,0.1)', border: '1.5px solid rgba(255,255,255,0.3)' }}
        >
          <span className="material-symbols-rounded" style={{ fontSize: 16 }}>phone</span>
        </button>
      </div>
    </div>
  );
}
