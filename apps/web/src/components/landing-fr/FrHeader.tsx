import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Logo from '../ui/Logo';

export default function FrHeader() {
  const { t } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);

  const navLinks = [
    { href: '#how-it-works', label: t('landingFr.nav.howItWorks') },
    { href: '#benefits', label: t('landingFr.nav.benefits') },
    { href: '#pricing', label: t('landingFr.nav.pricing') },
    { href: '#faq', label: t('landingFr.nav.faq') },
  ];

  return (
    <>
      <header className="fixed top-0 left-0 right-0 bg-fr-navy/95 backdrop-blur-sm border-b border-white/10 z-50">
        <nav className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Logo size="sm" className="!text-fr-cream" />

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-gray-300 hover:text-white transition-colors"
              >
                {link.label}
              </a>
            ))}
            <Link
              to="/login"
              className="text-sm font-medium text-gray-300 hover:text-white transition-colors"
            >
              {t('landingFr.nav.login')}
            </Link>
            <Link
              to="/signup"
              className="bg-fr-gold text-fr-navy px-5 py-2 rounded-lg text-sm font-semibold hover:bg-fr-gold-light transition-colors"
            >
              {t('landingFr.nav.cta')}
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden text-fr-cream p-2"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Menu"
          >
            {menuOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </nav>
      </header>

      {/* Mobile menu overlay */}
      <div
        className="fr-menu-overlay fixed inset-0 bg-fr-navy z-40 flex flex-col items-center justify-center gap-8 md:hidden"
        data-open={menuOpen ? 'true' : 'false'}
      >
        {navLinks.map((link) => (
          <a
            key={link.href}
            href={link.href}
            className="text-xl font-medium text-gray-200 hover:text-white transition-colors"
            onClick={() => setMenuOpen(false)}
          >
            {link.label}
          </a>
        ))}
        <Link
          to="/login"
          className="text-xl font-medium text-gray-200 hover:text-white transition-colors"
          onClick={() => setMenuOpen(false)}
        >
          {t('landingFr.nav.login')}
        </Link>
        <Link
          to="/signup"
          className="bg-fr-gold text-fr-navy px-8 py-3 rounded-lg text-lg font-semibold hover:bg-fr-gold-light transition-colors"
          onClick={() => setMenuOpen(false)}
        >
          {t('landingFr.nav.cta')}
        </Link>
      </div>
    </>
  );
}
