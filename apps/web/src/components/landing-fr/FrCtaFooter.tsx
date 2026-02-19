import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useInView } from '../../hooks/useInView';
import Logo from '../ui/Logo';
import { webBrand } from '../../lib/brand';

export default function FrCtaFooter() {
  const { t } = useTranslation();
  const { ref, isInView } = useInView();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      navigate(`/signup?email=${encodeURIComponent(email.trim())}`);
    } else {
      navigate('/signup');
    }
  };

  return (
    <>
      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-fr-navy">
        <div ref={ref} className={`reveal ${isInView ? 'visible' : ''} max-w-4xl mx-auto text-center`}>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
            {t('landingFr.cta.title')}
          </h2>
          <p className="text-lg text-gray-400 mb-8">
            {t('landingFr.cta.subtitle')}
          </p>
          <form
            onSubmit={handleSubmit}
            className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
          >
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('landingFr.cta.emailPlaceholder')}
              className="flex-1 px-4 py-3.5 rounded-xl text-fr-navy placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-fr-gold/50 bg-white font-inter text-sm"
            />
            <button
              type="submit"
              className="bg-fr-gold text-fr-navy px-6 py-3.5 rounded-xl font-semibold hover:bg-fr-gold-light transition-all hover:scale-[1.02] duration-200 whitespace-nowrap text-sm"
            >
              {t('landingFr.cta.button')}
            </button>
          </form>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 px-4 sm:px-6 lg:px-8 bg-fr-navy border-t border-white/10">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <Logo size="sm" className="!text-fr-cream" />
            <div className="flex gap-6 text-sm">
              <Link to="/privacy" className="text-gray-400 hover:text-white transition-colors">
                {t('landingFr.footer.privacy')}
              </Link>
              <Link to="/terms" className="text-gray-400 hover:text-white transition-colors">
                {t('landingFr.footer.terms')}
              </Link>
              <a href={`mailto:${webBrand.supportEmail}`} className="text-gray-400 hover:text-white transition-colors">
                {t('landingFr.footer.contact')}
              </a>
            </div>
            <p className="text-sm text-gray-500">
              &copy; {new Date().getFullYear()} {webBrand.legal.entityName}. {t('landingFr.footer.rights')}
            </p>
          </div>
        </div>
      </footer>
    </>
  );
}
