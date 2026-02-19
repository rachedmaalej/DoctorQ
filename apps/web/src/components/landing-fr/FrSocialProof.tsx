import { useTranslation } from 'react-i18next';
import { Building2, Star, ShieldCheck, MessageCircle } from 'lucide-react';

const PROOF_ITEMS = [
  { icon: Building2, key: 'clinics' },
  { icon: Star, key: 'satisfaction' },
  { icon: ShieldCheck, key: 'rgpd' },
  { icon: MessageCircle, key: 'support' },
] as const;

export default function FrSocialProof() {
  const { t } = useTranslation();

  return (
    <section className="py-6 px-4 sm:px-6 lg:px-8 bg-fr-cream-warm border-y border-fr-gold/10">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10">
          {PROOF_ITEMS.map(({ icon: Icon, key }) => (
            <div key={key} className="flex items-center gap-2 text-sm text-gray-600">
              <Icon className="w-4 h-4 text-fr-gold flex-shrink-0" />
              <span className="font-medium">{t(`landingFr.socialProof.${key}`)}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
