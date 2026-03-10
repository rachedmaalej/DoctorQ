import { useTranslation } from 'react-i18next';

interface QrCodeSectionProps {
  onQrDisplay: () => void;
  onQrCopy: () => void;
  onQrWhatsApp: () => void;
}

export default function QrCodeSection({ onQrDisplay, onQrCopy, onQrWhatsApp }: QrCodeSectionProps) {
  const { t } = useTranslation();

  const btnClass =
    'flex-1 flex items-center justify-center gap-1.5 h-9 px-2 rounded-lg bg-[#EAECE6] border border-[#E8EDE9] hover:bg-[#E8F2EE] hover:border-[#C5DDD5] transition-colors text-[#4A5A52]';

  return (
    <div className="px-[14px] py-2.5 border-b border-[#E8EDE9]">
      <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#8A9A92] mb-2 px-1">
        {t('desktop_menu.section_qr')}
      </p>

      <div className="flex gap-1.5">
        <button onClick={onQrDisplay} className={btnClass} aria-label={t('desktop_menu.qr_display')}>
          <span className="material-symbols-outlined text-[#356B58] text-[18px] shrink-0">qr_code_2</span>
          <span className="text-[12px] font-medium">{t('desktop_menu.qr_display')}</span>
        </button>

        <button onClick={onQrCopy} className={btnClass} aria-label={t('desktop_menu.qr_copy')}>
          <span className="material-symbols-outlined text-[#356B58] text-[18px] shrink-0">content_copy</span>
          <span className="text-[12px] font-medium">{t('desktop_menu.qr_copy')}</span>
        </button>

        <button onClick={onQrWhatsApp} className={btnClass} aria-label={t('desktop_menu.qr_whatsapp')}>
          <span className="material-symbols-outlined text-[#356B58] text-[18px] shrink-0">chat</span>
          <span className="text-[12px] font-medium">{t('desktop_menu.qr_whatsapp')}</span>
        </button>
      </div>
    </div>
  );
}
