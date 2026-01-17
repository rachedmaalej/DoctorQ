/**
 * Eye-related fun facts for the patient waiting page
 * These will be shown to patients while they wait
 */

export interface EyeFunFact {
  key: string;
  emoji: string;
}

// Fun facts about eyes and vision
export const eyeFunFacts: EyeFunFact[] = [
  { key: 'blinkRate', emoji: '👁️' },
  { key: 'eyeColors', emoji: '🌈' },
  { key: 'eyeMuscles', emoji: '💪' },
  { key: 'nightVision', emoji: '🌙' },
  { key: 'tearProduction', emoji: '💧' },
  { key: 'eyeSize', emoji: '👀' },
  { key: 'colorPerception', emoji: '🎨' },
  { key: 'eyeHealing', emoji: '✨' },
  { key: 'peripheralVision', emoji: '🔭' },
  { key: 'readingSpeed', emoji: '📚' },
];

/**
 * Get a random selection of eye fun facts
 * @param count Number of facts to return
 */
export function getEyeFunFacts(count: number = 3): EyeFunFact[] {
  const shuffled = [...eyeFunFacts].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, eyeFunFacts.length));
}

/**
 * Get a single random eye fun fact
 */
export function getRandomEyeFunFact(): EyeFunFact {
  return eyeFunFacts[Math.floor(Math.random() * eyeFunFacts.length)];
}
