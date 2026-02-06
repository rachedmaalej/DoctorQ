import type { SpecialtyFunFacts } from './types';
import { ophthalmology } from './ophthalmology';
import { general_medicine } from './general_medicine';
import { dentistry } from './dentistry';
import { cardiology } from './cardiology';
import { dermatology } from './dermatology';
import { pediatrics } from './pediatrics';
import { gynecology } from './gynecology';

export type { SpecialtyFunFacts, SpecialtyFunFact, SpecialtyCategory } from './types';

/** All available specialty fun facts, keyed by specialty slug */
export const specialtyFunFacts: Record<string, SpecialtyFunFacts> = {
  ophthalmology,
  general_medicine,
  dentistry,
  cardiology,
  dermatology,
  pediatrics,
  gynecology,
};

/** Default specialty used when clinic has no specialty set */
export const defaultSpecialty = 'general_medicine';

/** Ordered list of supported specialties for pickers/dropdowns */
export const SUPPORTED_SPECIALTIES = [
  general_medicine,
  ophthalmology,
  dentistry,
  cardiology,
  dermatology,
  pediatrics,
  gynecology,
] as const;

/**
 * Get fun facts for a given specialty, with fallback chain:
 * specified specialty -> general_medicine -> ophthalmology
 */
export function getFunFactsForSpecialty(specialty?: string | null): SpecialtyFunFacts {
  if (specialty && specialtyFunFacts[specialty]) {
    return specialtyFunFacts[specialty];
  }
  return specialtyFunFacts[defaultSpecialty] || specialtyFunFacts.ophthalmology;
}
