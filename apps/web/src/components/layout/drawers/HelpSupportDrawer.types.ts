export type TutorialBadgeType = 'DEMARRAGE' | 'QUOTIDIEN' | 'AVANCE';
export type Lang = 'fr' | 'ar';

export type FaqCluster =
  | 'mise-en-route'
  | 'gestion-file'
  | 'qr-code'
  | 'whatsapp-notifications'
  | 'abonnement-compte';

export interface FaqItem {
  id: string;
  cluster: FaqCluster;
  question: Record<Lang, string>;
  answer: Record<Lang, string>;
}

export interface FaqClusterMeta {
  id: FaqCluster;
  icon: string;
  label: Record<Lang, string>;
}

export interface TutorialItem {
  id: string;
  icon: string;
  iconBg: string;
  iconColor: string;
  title: Record<Lang, string>;
  duration: Record<Lang, string>;
  badge: TutorialBadgeType;
  videoUrl?: string;
}

export interface BadgeConfig {
  bg: string;
  color: string;
  label: Record<Lang, string>;
}

export interface HelpSupportDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onFaqSelect?: (faqId: string) => void;
  onTutorialSelect?: (tutorialId: string) => void;
}
