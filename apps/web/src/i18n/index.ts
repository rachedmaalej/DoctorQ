import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { webBrand } from '../lib/brand';
import fr from './locales/fr.json';
import ar from './locales/ar.json';
import frFR from './locales/fr-FR.json';

// Deep merge helper: overrides base with market-specific translations
function deepMerge<T extends Record<string, unknown>>(base: T, override: Record<string, unknown>): T {
  const result = { ...base } as Record<string, unknown>;
  for (const key of Object.keys(override)) {
    if (
      override[key] &&
      typeof override[key] === 'object' &&
      !Array.isArray(override[key]) &&
      base[key] &&
      typeof base[key] === 'object' &&
      !Array.isArray(base[key])
    ) {
      result[key] = deepMerge(
        base[key] as Record<string, unknown>,
        override[key] as Record<string, unknown>
      );
    } else {
      result[key] = override[key];
    }
  }
  return result as T;
}

// Apply market-specific overrides based on brand
const frTranslations = webBrand.id === 'france' ? deepMerge(fr, frFR) : fr;

// Build resources — only include Arabic if supported by brand
const resources: Record<string, { translation: typeof fr }> = {
  fr: { translation: frTranslations },
};

if (webBrand.supportedLanguages.includes('ar')) {
  resources.ar = { translation: ar as typeof fr };
}

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: webBrand.defaultLanguage,
    fallbackLng: 'fr',
    interpolation: {
      escapeValue: false,
    },
  });

// Update document direction and language when language changes
i18n.on('languageChanged', (lng) => {
  const isRTL = lng === 'ar';
  document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
  document.documentElement.lang = lng;
});

export default i18n;
