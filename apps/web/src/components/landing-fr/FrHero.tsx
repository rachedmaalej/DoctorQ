import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function FrHero() {
  const { t } = useTranslation();

  return (
    <section className="pt-28 pb-20 sm:pt-36 sm:pb-28 px-4 sm:px-6 lg:px-8 bg-fr-cream">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="fr-hero-enter-1 text-4xl sm:text-5xl lg:text-6xl font-bold text-fr-navy leading-tight mb-6">
          {t('landingFr.hero.titleLine1')}{' '}
          <span className="text-fr-gold">{t('landingFr.hero.titleAccent')}</span>{' '}
          {t('landingFr.hero.titleLine2')}
        </h1>

        <p className="fr-hero-enter-2 text-lg sm:text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
          {t('landingFr.hero.subtitle')}
        </p>

        <div className="fr-hero-enter-3 flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/signup"
            className="bg-fr-gold text-fr-navy px-8 py-4 rounded-xl font-semibold text-lg hover:bg-fr-gold-light transition-all hover:scale-[1.02] duration-200 shadow-lg shadow-fr-gold/20"
          >
            {t('landingFr.hero.cta')}
          </Link>
          <a
            href="#how-it-works"
            className="border-2 border-fr-navy/20 text-fr-navy px-8 py-4 rounded-xl font-semibold text-lg hover:border-fr-navy/40 transition-colors"
          >
            {t('landingFr.hero.ctaSecondary')}
          </a>
        </div>

        <p className="fr-hero-enter-4 mt-5 text-sm text-gray-400">
          {t('landingFr.hero.noCard')}
        </p>
      </div>
    </section>
  );
}
