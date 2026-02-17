import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import HeroPhones from './HeroPhones';

export default function HeroSection() {
  const { t } = useTranslation();

  return (
    <section className="pt-24 pb-16 sm:pt-28 sm:pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-primary-50 to-white overflow-hidden">
      <div className="max-w-5xl mx-auto flex flex-col items-center text-center">
        {/* Dual phone mockups — above the title */}
        <div className="hero-stagger-1 mb-10 sm:mb-12">
          <HeroPhones />
        </div>

        {/* Title with colored accent */}
        <h1 className="hero-stagger-2 text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 mb-4 leading-tight max-w-3xl">
          {t('landing.hero.titleLine1')}{' '}
          <span className="text-primary-600">{t('landing.hero.titleLine2')}</span>
        </h1>

        <p className="hero-stagger-2 text-lg sm:text-xl text-gray-600 mb-8 max-w-2xl">
          {t('landing.hero.subtitle')}
        </p>

        <div className="hero-stagger-3 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/signup"
            className="bg-primary-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-primary-700 transition-all shadow-lg shadow-primary-600/25 hover:scale-105 duration-200"
          >
            {t('landing.hero.cta')}
          </Link>
          <a
            href="#how-it-works"
            className="bg-white text-gray-700 px-8 py-4 rounded-xl font-semibold text-lg border border-gray-200 hover:border-gray-300 transition-colors"
          >
            {t('landing.hero.learnMore')}
          </a>
        </div>

        <p className="hero-stagger-3 mt-4 text-sm text-gray-500">
          {t('landing.hero.noCard')}
        </p>
        <p className="hero-stagger-4 mt-3 text-sm text-gray-400">
          {t('landing.hero.socialProof', { count: 10 })}
        </p>
      </div>
    </section>
  );
}
