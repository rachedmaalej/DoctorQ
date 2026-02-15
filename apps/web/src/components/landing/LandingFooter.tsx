import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Logo from '../ui/Logo';
import { webBrand } from '../../lib/brand';

export default function LandingFooter() {
  const { t } = useTranslation();

  return (
    <footer className="py-12 px-4 sm:px-6 lg:px-8 bg-gray-900 text-gray-400">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <Logo size="sm" className="!text-white" />
          <div className="flex gap-6 text-sm">
            <Link to="/privacy" className="hover:text-white transition-colors">
              {t('landing.footer.privacy')}
            </Link>
            <Link to="/terms" className="hover:text-white transition-colors">
              {t('landing.footer.terms')}
            </Link>
            <a href={`mailto:${webBrand.supportEmail}`} className="hover:text-white transition-colors">
              {t('landing.footer.contact')}
            </a>
          </div>
          <p className="text-sm">
            &copy; {new Date().getFullYear()} {webBrand.name}. {t('landing.footer.rights')}
          </p>
        </div>
      </div>
    </footer>
  );
}
