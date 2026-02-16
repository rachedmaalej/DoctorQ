interface PSAlertBannerProps {
  visible: boolean;
  announcement?: string | null;
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

export default function PSAlertBanner({ visible, announcement }: PSAlertBannerProps) {
  return (
    <div className={`ps-alert ps-fade-up-d1 ${visible ? '' : 'hidden'}`} role="alert">
      <InfoCircleIcon />
      <span>{announcement}</span>
    </div>
  );
}
