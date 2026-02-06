/**
 * Shared types for the specialty-based fun facts system.
 * Each specialty defines its own categories and 50 bilingual facts.
 */

export interface SpecialtyCategory {
  key: string;
  icon: string;       // Material Symbols icon name
  labelFr: string;
  labelAr: string;
}

export interface SpecialtyFunFact {
  id: number;
  category: string;   // Must match a SpecialtyCategory.key
  emoji: string;
  fr: string;          // Max ~30 words
  ar: string;
}

export interface SpecialtyFunFacts {
  key: string;
  labelFr: string;
  labelAr: string;
  icon: string;        // Material Symbols icon name
  categories: SpecialtyCategory[];
  facts: SpecialtyFunFact[];
}
