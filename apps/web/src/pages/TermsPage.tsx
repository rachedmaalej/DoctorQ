import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function TermsPage() {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';

  return (
    <div className={`min-h-screen bg-gray-50 ${isRtl ? 'rtl' : ''}`} dir={isRtl ? 'rtl' : 'ltr'}>
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link to="/" className="text-gray-500 hover:text-gray-700">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-xl font-bold text-gray-900">{t('legal.terms.title')}</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm prose prose-gray max-w-none">
          <p className="text-sm text-gray-500 mb-6">{t('legal.lastUpdated')}: 12 février 2026</p>

          <h2>{t('legal.terms.section1.title')}</h2>
          <p>{t('legal.terms.section1.content')}</p>

          <h2>{t('legal.terms.section2.title')}</h2>
          <p>{t('legal.terms.section2.content')}</p>

          <h2>{t('legal.terms.section3.title')}</h2>
          <p>{t('legal.terms.section3.content')}</p>

          <h2>{t('legal.terms.section4.title')}</h2>
          <p>{t('legal.terms.section4.content')}</p>

          <h2>{t('legal.terms.section5.title')}</h2>
          <p>{t('legal.terms.section5.content')}</p>

          <h2>{t('legal.terms.section6.title')}</h2>
          <p>{t('legal.terms.section6.content')}</p>

          <h2>{t('legal.terms.section7.title')}</h2>
          <p>{t('legal.terms.section7.content')}</p>

          <h2>{t('legal.terms.section8.title')}</h2>
          <p>{t('legal.terms.section8.content')}</p>
        </div>
      </main>
    </div>
  );
}
