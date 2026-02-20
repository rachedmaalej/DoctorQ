/**
 * ArrivalPattern — Generates realistic patient arrival schedules.
 *
 * Uses weighted time slots to create non-uniform distributions that
 * mimic real clinic traffic: morning rushes, lunch lulls, steady afternoons.
 */

import config from '../../config/clinics.json';

interface RushHour {
  start: string;
  end: string;
  weight: number;
}

interface PatientArrival {
  name: string;
  phone: string;
  arrivalMinute: number;    // Minutes since workday start (e.g., 0 = 08:00)
  arrivalTime: string;      // Formatted time string
  willLeave: boolean;       // Will this patient leave before being seen?
  willNoShow: boolean;      // Will this patient not show up?
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateTunisianPhone(): string {
  const prefix = pickRandom(config.tunisianPhonePrefixes);
  const rest = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
  return `+216${prefix}${rest}`;
}

function generateName(): string {
  const first = pickRandom(config.patientNames.firstNames);
  const last = pickRandom(config.patientNames.lastNames);
  return `${first} ${last}`;
}

/**
 * Generate a full day's worth of patient arrivals for a clinic profile.
 */
export function generateArrivals(
  rushHours: RushHour[],
  patientCount: { min: number; max: number },
  noShowRate: number,
  leaveRate: number,
  workdayStart: string = '08:00'
): PatientArrival[] {
  const numPatients = randomBetween(patientCount.min, patientCount.max);
  const workdayStartMin = timeToMinutes(workdayStart);
  const arrivals: PatientArrival[] = [];

  // Build a weighted minute distribution from rush hours
  const weightedMinutes: number[] = [];

  for (const slot of rushHours) {
    const startMin = timeToMinutes(slot.start) - workdayStartMin;
    const endMin = timeToMinutes(slot.end) - workdayStartMin;

    // Add each minute in this slot, repeated by weight (rounded)
    const repeats = Math.max(1, Math.round(slot.weight * 10));
    for (let m = startMin; m < endMin; m++) {
      for (let r = 0; r < repeats; r++) {
        weightedMinutes.push(m);
      }
    }
  }

  // Generate arrival times by sampling from the weighted distribution
  const usedNames = new Set<string>();

  for (let i = 0; i < numPatients; i++) {
    // Pick a random minute from the weighted pool, add some noise
    const baseMinute = pickRandom(weightedMinutes);
    const noise = Math.round((Math.random() - 0.5) * 6); // ±3 min jitter
    const arrivalMinute = Math.max(0, baseMinute + noise);

    // Generate unique name
    let name: string;
    do {
      name = generateName();
    } while (usedNames.has(name));
    usedNames.add(name);

    arrivals.push({
      name,
      phone: generateTunisianPhone(),
      arrivalMinute,
      arrivalTime: minutesToTime(arrivalMinute + workdayStartMin),
      willLeave: Math.random() < leaveRate,
      willNoShow: Math.random() < noShowRate,
    });
  }

  // Sort by arrival time
  arrivals.sort((a, b) => a.arrivalMinute - b.arrivalMinute);

  return arrivals;
}

/**
 * Get a human-readable summary of the arrival distribution.
 */
export function summarizeArrivals(arrivals: PatientArrival[]): {
  total: number;
  noShows: number;
  willLeave: number;
  byHour: Map<string, number>;
} {
  const byHour = new Map<string, number>();

  for (const a of arrivals) {
    const hour = a.arrivalTime.split(':')[0] + ':00';
    byHour.set(hour, (byHour.get(hour) || 0) + 1);
  }

  return {
    total: arrivals.length,
    noShows: arrivals.filter(a => a.willNoShow).length,
    willLeave: arrivals.filter(a => a.willLeave).length,
    byHour,
  };
}
