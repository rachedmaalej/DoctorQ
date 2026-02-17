interface PSAlertBannerProps {
  visible: boolean;
  announcement?: string | null;
  isDoctorPresent?: boolean;
}

function InfoCircleIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

function HourglassIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 4h14" />
      <path d="M5 20h14" />
      <path d="M17 4v2a8 8 0 0 1-3.36 6.5" />
      <path d="M7 4v2a8 8 0 0 0 3.36 6.5" />
      <path d="M17 20v-2a8 8 0 0 0-3.36-6.5" />
      <path d="M7 20v-2a8 8 0 0 1 3.36-6.5" />
    </svg>
  );
}

export default function PSAlertBanner({ visible, announcement, isDoctorPresent }: PSAlertBannerProps) {
  const doctorAbsent = isDoctorPresent === false;

  // Rich banner for doctor-absent state
  if (doctorAbsent && visible) {
    return (
      <div className={`ps-alert-rich ps-fade-up-d1 ${visible ? '' : 'hidden'}`} role="alert">
        <div className="ps-alert-rich-icon">
          <HourglassIcon />
        </div>
        <div>
          <div className="ps-alert-rich-title">
            Consultations pas encore commencées
          </div>
          <div className="ps-alert-rich-body">
            {announcement || 'Votre place est réservée. Vous serez prévenu dès que les consultations commencent.'}
          </div>
        </div>
      </div>
    );
  }

  // Default simple banner (for announcements when doctor IS present)
  return (
    <div className={`ps-alert ps-fade-up-d1 ${visible ? '' : 'hidden'}`} role="alert">
      <InfoCircleIcon />
      <span>{announcement}</span>
    </div>
  );
}
