import { useTranslation } from 'react-i18next';
import { Icon } from '@/components/ui/Icon';

interface SupportBannerProps {
  whatsappNumber: string;
}

export function SupportBanner({ whatsappNumber }: SupportBannerProps) {
  const { t } = useTranslation();

  const handleClick = () => {
    const msg = encodeURIComponent(t('helpSupport.support.whatsappMessage'));
    window.open(`https://wa.me/${whatsappNumber}?text=${msg}`, '_blank', 'noopener');
  };

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={t('helpSupport.support.title')}
      onClick={handleClick}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleClick(); } }}
      style={{
        margin: 0,
        borderRadius: 16,
        cursor: 'pointer',
        overflow: 'hidden',
        background: 'linear-gradient(135deg, #0F7B6C 0%, #0A5C50 100%)',
        padding: 14,
        display: 'flex',
        alignItems: 'flex-start',
        gap: 10,
        transition: 'opacity 150ms ease',
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = '0.92'; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = '1'; }}
    >
      {/* Icon container */}
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          background: 'rgba(255,255,255,0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Icon name="chat" size={17} style={{ color: '#FFFFFF' }} />
      </div>

      {/* Text block */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#FFFFFF' }}>
          {t('helpSupport.support.title')}
        </div>
        <div
          style={{
            fontSize: 11,
            fontWeight: 400,
            color: 'rgba(255,255,255,0.75)',
            marginTop: 3,
            lineHeight: 1.4,
          }}
        >
          {t('helpSupport.support.subtitle')}
        </div>
      </div>

      {/* External link icon */}
      <Icon
        name="open_in_new"
        size={14}
        style={{ color: 'rgba(255,255,255,0.5)', flexShrink: 0, marginTop: 2 }}
      />
    </div>
  );
}
