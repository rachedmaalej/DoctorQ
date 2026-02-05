import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../components/ui/LanguageSwitcher';

export default function LandingPage() {
  const { t } = useTranslation();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faqs = [
    { q: t('landing.faq.q1'), a: t('landing.faq.a1') },
    { q: t('landing.faq.q2'), a: t('landing.faq.a2') },
    { q: t('landing.faq.q3'), a: t('landing.faq.a3') },
    { q: t('landing.faq.q4'), a: t('landing.faq.a4') },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-sm border-b border-gray-100 z-50">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
              <span className="text-white font-bold text-lg">B</span>
            </div>
            <span className="font-bold text-xl text-gray-900">BleSaf</span>
          </div>
          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            <Link
              to="/login"
              className="text-gray-600 hover:text-gray-900 font-medium"
            >
              {t('landing.nav.login')}
            </Link>
            <Link
              to="/signup"
              className="bg-primary-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-700 transition-colors"
            >
              {t('landing.nav.signup')}
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-primary-50 to-white">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
            {t('landing.hero.title')}
          </h1>
          <p className="text-xl sm:text-2xl text-gray-600 mb-8 max-w-2xl mx-auto">
            {t('landing.hero.subtitle')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/signup"
              className="bg-primary-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-primary-700 transition-colors shadow-lg shadow-primary-600/25"
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
          <p className="mt-4 text-sm text-gray-500">{t('landing.hero.noCard')}</p>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            {t('landing.problem.title')}
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
              <div className="text-4xl mb-4">😫</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {t('landing.problem.item1Title')}
              </h3>
              <p className="text-gray-600">{t('landing.problem.item1Desc')}</p>
            </div>
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
              <div className="text-4xl mb-4">🏥</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {t('landing.problem.item2Title')}
              </h3>
              <p className="text-gray-600">{t('landing.problem.item2Desc')}</p>
            </div>
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
              <div className="text-4xl mb-4">🚶</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {t('landing.problem.item3Title')}
              </h3>
              <p className="text-gray-600">{t('landing.problem.item3Desc')}</p>
            </div>
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
              <div className="text-4xl mb-4">😤</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {t('landing.problem.item4Title')}
              </h3>
              <p className="text-gray-600">{t('landing.problem.item4Desc')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">
            {t('landing.solution.title')}
          </h2>
          <p className="text-xl text-gray-600 text-center mb-12 max-w-2xl mx-auto">
            {t('landing.solution.subtitle')}
          </p>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">📱</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">{t('landing.solution.step1Title')}</h3>
              <p className="text-gray-600 text-sm">{t('landing.solution.step1Desc')}</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">👀</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">{t('landing.solution.step2Title')}</h3>
              <p className="text-gray-600 text-sm">{t('landing.solution.step2Desc')}</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">💬</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">{t('landing.solution.step3Title')}</h3>
              <p className="text-gray-600 text-sm">{t('landing.solution.step3Desc')}</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">☕</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">{t('landing.solution.step4Title')}</h3>
              <p className="text-gray-600 text-sm">{t('landing.solution.step4Desc')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            {t('landing.howItWorks.title')}
          </h2>
          <div className="space-y-8">
            <div className="flex items-start gap-6">
              <div className="flex-shrink-0 w-12 h-12 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold text-xl">
                1
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {t('landing.howItWorks.step1Title')}
                </h3>
                <p className="text-gray-600">{t('landing.howItWorks.step1Desc')}</p>
              </div>
            </div>
            <div className="flex items-start gap-6">
              <div className="flex-shrink-0 w-12 h-12 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold text-xl">
                2
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {t('landing.howItWorks.step2Title')}
                </h3>
                <p className="text-gray-600">{t('landing.howItWorks.step2Desc')}</p>
              </div>
            </div>
            <div className="flex items-start gap-6">
              <div className="flex-shrink-0 w-12 h-12 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold text-xl">
                3
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {t('landing.howItWorks.step3Title')}
                </h3>
                <p className="text-gray-600">{t('landing.howItWorks.step3Desc')}</p>
              </div>
            </div>
            <div className="flex items-start gap-6">
              <div className="flex-shrink-0 w-12 h-12 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold text-xl">
                4
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {t('landing.howItWorks.step4Title')}
                </h3>
                <p className="text-gray-600">{t('landing.howItWorks.step4Desc')}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">
            {t('landing.pricing.title')}
          </h2>
          <p className="text-xl text-gray-600 text-center mb-12">
            {t('landing.pricing.subtitle')}
          </p>

          {/* Subscription Cards */}
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            {/* Monthly */}
            <div className="bg-white rounded-2xl p-8 border-2 border-gray-200 relative">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {t('landing.pricing.monthly')}
              </h3>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl font-bold text-gray-900">50</span>
                <span className="text-xl text-gray-600">TND/mois</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-2 text-gray-600">
                  <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {t('landing.pricing.feature1')}
                </li>
                <li className="flex items-center gap-2 text-gray-600">
                  <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {t('landing.pricing.feature2')}
                </li>
                <li className="flex items-center gap-2 text-gray-600">
                  <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {t('landing.pricing.feature3')}
                </li>
                <li className="flex items-center gap-2 text-gray-600">
                  <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {t('landing.pricing.feature4')}
                </li>
              </ul>
              <Link
                to="/signup"
                className="block w-full text-center bg-gray-100 text-gray-900 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
              >
                {t('landing.pricing.selectMonthly')}
              </Link>
            </div>

            {/* Yearly */}
            <div className="bg-white rounded-2xl p-8 border-2 border-primary-500 relative">
              <div className="absolute -top-3 right-6 bg-primary-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                {t('landing.pricing.popular')}
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {t('landing.pricing.yearly')}
              </h3>
              <div className="flex items-baseline gap-1 mb-2">
                <span className="text-4xl font-bold text-gray-900">500</span>
                <span className="text-xl text-gray-600">TND/an</span>
              </div>
              <p className="text-green-600 font-medium mb-6">{t('landing.pricing.yearlySavings')}</p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-2 text-gray-600">
                  <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {t('landing.pricing.feature1')}
                </li>
                <li className="flex items-center gap-2 text-gray-600">
                  <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {t('landing.pricing.feature2')}
                </li>
                <li className="flex items-center gap-2 text-gray-600">
                  <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {t('landing.pricing.feature3')}
                </li>
                <li className="flex items-center gap-2 text-gray-600">
                  <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {t('landing.pricing.feature4')}
                </li>
              </ul>
              <Link
                to="/signup"
                className="block w-full text-center bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors"
              >
                {t('landing.pricing.selectYearly')}
              </Link>
            </div>
          </div>

          {/* SMS Packages */}
          <div className="bg-gray-50 rounded-2xl p-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-6 text-center">
              {t('landing.pricing.smsTitle')}
            </h3>
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="bg-white rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-gray-900">100 SMS</div>
                <div className="text-gray-600">10 TND</div>
                <div className="text-sm text-gray-400">0.10 TND/SMS</div>
              </div>
              <div className="bg-white rounded-xl p-4 text-center border-2 border-primary-200">
                <div className="text-2xl font-bold text-gray-900">300 SMS</div>
                <div className="text-gray-600">25 TND</div>
                <div className="text-sm text-green-600">0.08 TND/SMS</div>
              </div>
              <div className="bg-white rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-gray-900">1000 SMS</div>
                <div className="text-gray-600">70 TND</div>
                <div className="text-sm text-green-600">0.07 TND/SMS</div>
              </div>
            </div>
          </div>

          {/* Trial CTA */}
          <div className="text-center mt-8">
            <p className="text-lg text-gray-600 mb-4">{t('landing.pricing.trialNote')}</p>
            <Link
              to="/signup"
              className="inline-block bg-primary-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-primary-700 transition-colors"
            >
              {t('landing.pricing.startTrial')}
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            {t('landing.faq.title')}
          </h2>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="bg-white rounded-xl overflow-hidden border border-gray-200"
              >
                <button
                  className="w-full px-6 py-4 text-left flex items-center justify-between"
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                >
                  <span className="font-medium text-gray-900">{faq.q}</span>
                  <svg
                    className={`w-5 h-5 text-gray-500 transition-transform ${
                      openFaq === index ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {openFaq === index && (
                  <div className="px-6 pb-4 text-gray-600">{faq.a}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-primary-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
            {t('landing.cta.title')}
          </h2>
          <p className="text-xl text-primary-100 mb-8">
            {t('landing.cta.subtitle')}
          </p>
          <Link
            to="/signup"
            className="inline-block bg-white text-primary-600 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-primary-50 transition-colors"
          >
            {t('landing.cta.button')}
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 bg-gray-900 text-gray-400">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                <span className="text-white font-bold text-lg">B</span>
              </div>
              <span className="font-bold text-xl text-white">BleSaf</span>
            </div>
            <div className="flex gap-6 text-sm">
              <a href="#" className="hover:text-white transition-colors">
                {t('landing.footer.privacy')}
              </a>
              <a href="#" className="hover:text-white transition-colors">
                {t('landing.footer.terms')}
              </a>
              <a href="#" className="hover:text-white transition-colors">
                {t('landing.footer.contact')}
              </a>
            </div>
            <p className="text-sm">
              &copy; {new Date().getFullYear()} BleSaf. {t('landing.footer.rights')}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
