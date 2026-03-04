import { useTranslation } from 'react-i18next';
import { Icon } from '@/components/ui/Icon';
import { TutorialBadge } from './TutorialBadge';
import { TUTORIAL_ITEMS } from '@/data/helpSupport';
import type { Lang } from '../HelpSupportDrawer.types';

interface TutorialSectionProps {
  onTutorialSelect?: (tutorialId: string) => void;
}

export function TutorialSection({ onTutorialSelect }: TutorialSectionProps) {
  const { i18n } = useTranslation();
  const lang = i18n.language as Lang;
  const isRtl = lang === 'ar';

  return (
    <div>
      {TUTORIAL_ITEMS.map((tutorial, i) => (
        <div
          key={tutorial.id}
          role="button"
          tabIndex={0}
          onClick={() => onTutorialSelect?.(tutorial.id)}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onTutorialSelect?.(tutorial.id); } }}
          className="help-drawer-row"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            padding: '12px 16px',
            borderBottom: i < TUTORIAL_ITEMS.length - 1 ? '1px solid #F0EFEA' : 'none',
            background: '#FFFFFF',
            cursor: 'pointer',
          }}
        >
          {/* Icon container */}
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              background: tutorial.iconBg,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Icon name={tutorial.icon} size={20} style={{ color: tutorial.iconColor }} />
          </div>

          {/* Text block */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: '#1A1A1A',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {tutorial.title[lang]}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 2 }}>
              <span style={{ fontSize: 10, fontWeight: 400, color: '#9E9B90' }}>
                {tutorial.duration[lang]}
              </span>
              <TutorialBadge type={tutorial.badge} lang={lang} />
            </div>
          </div>

          {/* Chevron */}
          <Icon
            name={isRtl ? 'chevron_left' : 'chevron_right'}
            size={16}
            style={{ color: '#C5C3BC', flexShrink: 0 }}
          />
        </div>
      ))}
    </div>
  );
}
