import { useTranslation } from 'react-i18next';
import Logo from '../ui/Logo';

export default function LandingFooter() {
  const { t } = useTranslation();

  return (
    <footer className="py-12 px-4 sm:px-6 lg:px-8 bg-gray-900 text-gray-400">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <Logo size="sm" className="!text-white" />
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
  );
}
