import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import i18n from '@/i18n'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Translate a specialty key (e.g. "ophthalmology") to its localized label.
 * Falls back to the raw key with first letter capitalized if no translation found.
 */
export function getSpecialtyLabel(key: string | null | undefined): string {
  if (!key) return '';
  const translated = i18n.t(`specialties.${key}`, { defaultValue: '' });
  if (translated) return translated;
  return key.charAt(0).toUpperCase() + key.slice(1);
}
