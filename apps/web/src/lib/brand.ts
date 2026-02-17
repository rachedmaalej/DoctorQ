/**
 * Frontend Brand Configuration
 * Resolved at build time from VITE_BRAND env var.
 */

export type BrandId = 'blesaf' | 'france';

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
  },
  france: {
    id: 'france',
    name: 'FiloSoin',
    domain: 'filosoin.fr',
    supportEmail: 'support@filosoin.fr',
    analyticsDomain: 'filosoin.fr',
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
      entityName: 'FiloSoin SAS',
      jurisdiction: 'tribunaux compétents de Paris',
    },
  },
};

const brandId = (import.meta.env.VITE_BRAND || 'blesaf') as BrandId;

export const webBrand: WebBrandConfig = brands[brandId] || brands.blesaf;
