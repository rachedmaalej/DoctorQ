/**
 * Brand Configuration
 * Centralizes all market-specific values. Reads BRAND env var at startup.
 * Deploy the same codebase with BRAND=blesaf (Tunisia) or BRAND=france.
 */

export type BrandId = 'blesaf' | 'france';

export interface PhoneConfig {
  countryCode: string;
  localDigits: number;
  placeholder: string;
}

export interface CurrencyConfig {
  code: string;
  subunit: string;     // "millimes" or "cents"
  multiplier: number;  // minor units per major unit (1000 for TND, 100 for EUR)
  symbol: string;
}

export interface PricingConfig {
  monthly: number;     // in minor currency units
  yearly: number;
  freeTrialDays: number;
}

export interface BrandConfig {
  id: BrandId;
  name: string;
  legalEntity: string;
  domain: string;
  supportEmail: string;
  fromEmail: string;
  frontendUrl: string;

  // Localization
  country: string;
  timezone: string;
  defaultLanguage: string;
  supportedLanguages: string[];

  // Phone
  phone: PhoneConfig;

  // Currency & Pricing
  currency: CurrencyConfig;
  pricing: PricingConfig;

  // Payment
  payment: {
    provider: 'konnect' | 'stripe';
  };

  // Admin
  adminEmails: string[];
}

type BrandDefaults = Omit<BrandConfig, 'frontendUrl' | 'adminEmails'>;

const brands: Record<BrandId, BrandDefaults> = {
  blesaf: {
    id: 'blesaf',
    name: 'BleSaf',
    legalEntity: 'Blesaf SARL',
    domain: 'blesaf.tn',
    supportEmail: 'support@blesaf.tn',
    fromEmail: 'BleSaf <noreply@blesaf.tn>',
    country: 'TN',
    timezone: 'Africa/Tunis',
    defaultLanguage: 'fr',
    supportedLanguages: ['fr', 'ar'],
    phone: {
      countryCode: '+216',
      localDigits: 8,
      placeholder: '+216 XX XXX XXX',
    },
    currency: {
      code: 'TND',
      subunit: 'millimes',
      multiplier: 1000,
      symbol: 'TND',
    },
    pricing: {
      monthly: 65000,    // 65 TND
      yearly: 650000,    // 650 TND
      freeTrialDays: 30,
    },
    payment: { provider: 'konnect' },
  },
  france: {
    id: 'france',
    name: 'AuSuivant',
    legalEntity: 'AuSuivant SAS',
    domain: 'ausuivant.fr',
    supportEmail: 'support@ausuivant.fr',
    fromEmail: 'AuSuivant <noreply@ausuivant.fr>',
    country: 'FR',
    timezone: 'Europe/Paris',
    defaultLanguage: 'fr',
    supportedLanguages: ['fr'],
    phone: {
      countryCode: '+33',
      localDigits: 9,
      placeholder: '+33 X XX XX XX XX',
    },
    currency: {
      code: 'EUR',
      subunit: 'cents',
      multiplier: 100,
      symbol: 'EUR',
    },
    pricing: {
      monthly: 4900,     // 49 EUR
      yearly: 49000,     // 490 EUR
      freeTrialDays: 30,
    },
    payment: { provider: 'stripe' },
  },
};

// Resolve at startup from BRAND env var
const brandId = (process.env.BRAND || 'blesaf') as BrandId;
const defaults = brands[brandId] || brands.blesaf;

// Legacy admin emails from before the blesaf.tn domain migration
const legacyAdminEmails = ['admin@doctorq.tn', 'rached@doctorq.tn'];
const allBrandAdminEmails = Object.values(brands).map(b => `admin@${b.domain}`);
const envAdminEmails = process.env.ADMIN_EMAILS
  ? process.env.ADMIN_EMAILS.split(',').map(e => e.trim().toLowerCase())
  : [`admin@${defaults.domain}`];
const mergedAdminEmails = [...new Set([
  ...envAdminEmails,
  ...legacyAdminEmails,
  ...(process.env.NODE_ENV !== 'production' ? allBrandAdminEmails : []),
])];

export const brand: BrandConfig = {
  ...defaults,
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5174',
  adminEmails: mergedAdminEmails,
};


/**
 * Format a price from minor units to display string.
 * e.g. 65000 TND -> "65 TND", 4900 EUR -> "49 EUR"
 */
export function formatPrice(amountMinor: number): string {
  const major = amountMinor / brand.currency.multiplier;
  return `${major} ${brand.currency.symbol}`;
}
