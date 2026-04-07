/**
 * Specialty color configuration for the multi-doctor panel.
 * Maps doctor specialties to their display labels and color classes.
 */

export type DoctorSpecialty =
  | 'general'
  | 'cardio'
  | 'dermato'
  | 'pediatre'
  | 'orl'
  | 'ophtalmologie'
  | 'dentiste';

export interface SpecialtyStyle {
  label: string;
  labelAr: string;
  /** Solid color for avatar bg & color bar */
  color: string;
  /** Light tint for tag & badge backgrounds */
  lightBg: string;
}

export const SPECIALTY_CONFIG: Record<DoctorSpecialty, SpecialtyStyle> = {
  general: {
    label: 'Général',
    labelAr: 'عام',
    color: '#2D8B4E',
    lightBg: '#EDF7F0',
  },
  cardio: {
    label: 'Cardio',
    labelAr: 'قلب',
    color: '#D94F3B',
    lightBg: '#FDF0ED',
  },
  dermato: {
    label: 'Dermato',
    labelAr: 'جلد',
    color: '#7C3AED',
    lightBg: '#EDE9FE',
  },
  pediatre: {
    label: 'Pédiatre',
    labelAr: 'أطفال',
    color: '#3B7DD9',
    lightBg: '#EDF3FC',
  },
  orl: {
    label: 'ORL',
    labelAr: 'أنف وأذن',
    color: '#D4920B',
    lightBg: '#FEF7E6',
  },
  ophtalmologie: {
    label: 'Ophtalmo',
    labelAr: 'عيون',
    color: '#0E7490',
    lightBg: '#ECFEFF',
  },
  dentiste: {
    label: 'Dentiste',
    labelAr: 'أسنان',
    color: '#0D9488',
    lightBg: '#F0FDFA',
  },
};

const DEFAULT_SPECIALTY: SpecialtyStyle = SPECIALTY_CONFIG.general;

export function getSpecialtyStyle(specialty: string | null | undefined): SpecialtyStyle {
  if (!specialty) return DEFAULT_SPECIALTY;
  const key = specialty.toLowerCase().replace(/é/g, 'e') as DoctorSpecialty;
  return SPECIALTY_CONFIG[key] || DEFAULT_SPECIALTY;
}
