/**
 * Frontend Brand Configuration
 * Resolved at build time from VITE_BRAND env var.
 */

export type BrandId = 'blesaf' | 'france';

export interface BrandTheme {
  colors: {
    primary: string;
    surface: string;
    impersonation: string;
  };
  logo: {
    parts: [{ text: string; font: string }, { text: string; font: string }];
  };
  dashboard: {
    variant: 'receptionist' | 'compact';
  };
  teaserTagline: string;
}

export interface WebBrandConfig {
  id: BrandId;
  name: string;
  domain: string;
  supportEmail: string;
  analyticsDomain: string;

  country: string;
  defaultLanguage: string;
  supportedLanguages: string[];

  phone: {
    countryCode: string;
    countryCodeDigits: string;  // "216" or "33" (without +)
    localDigits: number;
    placeholder: string;
  };

  currency: {
    code: string;
    symbol: string;
    multiplier: number;
  };

  pricing: {
    monthlyAmount: number;   // in minor currency units (millimes / cents)
    yearlyAmount: number;
    monthlyDisplay: string;
    yearlyDisplay: string;
    monthlyUnit: string;
    yearlyUnit: string;
  };

  legal: {
    entityName: string;
    jurisdiction: string;
  };

  theme: BrandTheme;
}

const brands: Record<BrandId, WebBrandConfig> = {
  blesaf: {
    id: 'blesaf',
    name: 'BleSaf',
    domain: 'blesaf.tn',
    supportEmail: 'support@blesaf.tn',
    analyticsDomain: 'blesaf.tn',
    country: 'TN',
    defaultLanguage: 'fr',
    supportedLanguages: ['fr', 'ar'],
    phone: {
      countryCode: '+216',
      countryCodeDigits: '216',
      localDigits: 8,
      placeholder: '+216 XX XXX XXX',
    },
    currency: {
      code: 'TND',
      symbol: 'TND',
      multiplier: 1000,
    },
    pricing: {
      monthlyAmount: 65000,
      yearlyAmount: 650000,
      monthlyDisplay: '65 TND',
      yearlyDisplay: '650 TND',
      monthlyUnit: 'TND/mois',
      yearlyUnit: 'TND/an',
    },
    legal: {
      entityName: 'Blesaf SARL',
      jurisdiction: 'tribunaux compétents de Tunis',
    },
    theme: {
      colors: {
        primary: '#0D9488',
        surface: '#F5F0E8',
        impersonation: '#E70013',
      },
      logo: {
        parts: [
          { text: 'Blé', font: "'Reem Kufi', sans-serif" },
          { text: 'SAF', font: "'Bebas Neue', sans-serif" },
        ],
      },
      dashboard: {
        variant: 'receptionist',
      },
      teaserTagline: 'Une initiative pour les cabinets médicaux tunisiens.',
    },
  },
  france: {
    id: 'france',
    name: 'AuSuivant',
    domain: 'ausuivant.fr',
    supportEmail: 'support@ausuivant.fr',
    analyticsDomain: 'ausuivant.fr',
    country: 'FR',
    defaultLanguage: 'fr',
    supportedLanguages: ['fr'],
    phone: {
      countryCode: '+33',
      countryCodeDigits: '33',
      localDigits: 9,
      placeholder: '+33 X XX XX XX XX',
    },
    currency: {
      code: 'EUR',
      symbol: 'EUR',
      multiplier: 100,
    },
    pricing: {
      monthlyAmount: 4900,
      yearlyAmount: 49000,
      monthlyDisplay: '49 EUR',
      yearlyDisplay: '490 EUR',
      monthlyUnit: 'EUR/mois',
      yearlyUnit: 'EUR/an',
    },
    legal: {
      entityName: 'AuSuivant SAS',
      jurisdiction: 'tribunaux compétents de Paris',
    },
    theme: {
      colors: {
        primary: '#1B6B4A',
        surface: '#F7F6F3',
        impersonation: '#002395',
      },
      logo: {
        parts: [
          { text: 'Au', font: "'IBM Plex Sans', sans-serif" },
          { text: 'SUIVANT', font: "'Bebas Neue', sans-serif" },
        ],
      },
      dashboard: {
        variant: 'compact',
      },
      teaserTagline: 'Une initiative pour les cabinets médicaux français.',
    },
  },
};

const brandId = (import.meta.env.VITE_BRAND || 'blesaf') as BrandId;

export const webBrand: WebBrandConfig = brands[brandId] || brands.blesaf;
