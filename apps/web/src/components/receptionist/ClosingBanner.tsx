import { useTranslation } from 'react-i18next';

export default function ClosingBanner() {
  const { t } = useTranslation();

  return (
    <div
      className="mx-5 mb-2 flex items-center gap-2.5 bg-bs-amber-light text-bs-amber font-semibold rounded-bs-sm"
      style={{
        padding: '10px 14px',
        fontSize: 13,
        border: '1px solid rgba(212,146,11,0.15)',
      }}
    >
      <span className="material-symbols-rounded" style={{ fontSize: 18 }}>info</span>
      {t('receptionist.closingBanner')}
    </div>
  );
}
