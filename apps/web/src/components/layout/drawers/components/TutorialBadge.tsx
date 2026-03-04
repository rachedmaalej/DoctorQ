import type { TutorialBadgeType, Lang } from '../HelpSupportDrawer.types';
import { BADGE_CONFIG } from '@/data/helpSupport';

interface TutorialBadgeProps {
  type: TutorialBadgeType;
  lang: Lang;
}

export function TutorialBadge({ type, lang }: TutorialBadgeProps) {
  const config = BADGE_CONFIG[type];
  if (!config) return null;

  return (
    <span
      style={{
        fontSize: 9,
        fontWeight: 700,
        letterSpacing: '0.4px',
        textTransform: 'uppercase' as const,
        padding: '2px 5px',
        borderRadius: 4,
        background: config.bg,
        color: config.color,
      }}
    >
      {config.label[lang]}
    </span>
  );
}
