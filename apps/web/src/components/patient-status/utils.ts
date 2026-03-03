// ─── Types ───

export type Phase = 'relax' | 'ready' | 'go' | 'done';

// ─── Phase Derivation (Three-Phase Emotional Arc) ───
// Relax (>3 ahead) → Get Ready (2-3 ahead) → Go Now (0-1 ahead / called)

export function derivePhase(status: string, peopleAhead: number): Phase {
  if (status === 'COMPLETED') return 'done';
  if (status === 'IN_CONSULTATION' || status === 'NOTIFIED') return 'go';
  if (peopleAhead <= 1) return 'go';
  if (peopleAhead <= 3) return 'ready';
  return 'relax'; // >= 4
}

// ─── Called State Helper ───

export function isCalledState(status: string): boolean {
  return status === 'IN_CONSULTATION';
}

// ─── Eyebrow Text ───
// Returns i18n key for status label

export function deriveEyebrowKey(phase: Phase, peopleAhead: number, status: string): string {
  if (status === 'IN_CONSULTATION') return 'status.cestVotreTour';
  if (phase === 'go') return 'status.vousPassezApres';
  if (phase === 'ready') return peopleAhead === 2 ? 'status.preparez' : 'status.bientotVotreTour';
  return 'status.attenteEstimee'; // relax
}

// ─── Ring Progress Calculation ───
// Returns 0-1 fraction representing how far through the queue the patient has progressed

export function calculateRingProgress(peopleAhead: number, initialPeopleAhead: number): number {
  if (initialPeopleAhead <= 0) return 1;
  return Math.min(1, Math.max(0, 1 - (peopleAhead / initialPeopleAhead)));
}

// Ring circumference for r=48: 2 * PI * 48 ≈ 301.59
export const RING_CIRCUMFERENCE = 301.59;

export function ringDashOffset(progress: number): number {
  return RING_CIRCUMFERENCE * (1 - progress);
}

// ─── Doctor Title ───

export function deriveDoctorTitle(doctorName?: string | null, doctorGender?: string | null): string {
  if (!doctorName) {
    if (doctorGender === 'F') return 'La docteure';
    if (doctorGender === 'M') return 'Le docteur';
    return 'Le médecin';
  }
  // If doctorName is already "Dr. Trabelsi", use it directly
  return doctorName;
}

export function deriveDoctorWaiting(doctorGender?: string | null): string {
  if (doctorGender === 'F') return 'La docteure attend depuis';
  if (doctorGender === 'M') return 'Le docteur attend depuis';
  return 'Le médecin attend depuis';
}

export function deriveDoctorNarrative(doctorGender?: string | null): string {
  if (doctorGender === 'F') return 'La docteure vous attend.\nDirigez-vous vers la salle de consultation.';
  if (doctorGender === 'M') return 'Le docteur vous attend.\nDirigez-vous vers la salle de consultation.';
  return 'On vous attend.\nDirigez-vous vers la salle de consultation.';
}

// ─── Time Size ───

export function deriveTimeSize(minutes: number): 'size-xl' | 'size-lg' | 'size-md' {
  if (minutes >= 60) return 'size-xl';
  if (minutes >= 15) return 'size-lg';
  return 'size-md';
}

// ─── Time Format ───

export interface HeroTimeParts {
  prefix: string;       // "~"
  hours?: number;
  minutes: number;
  hasHours: boolean;
}

export function parseHeroTime(totalMinutes: number): HeroTimeParts {
  const m = Math.max(0, Math.round(totalMinutes));
  if (m >= 60) {
    const h = Math.floor(m / 60);
    const rem = m % 60;
    return { prefix: '~', hours: h, minutes: rem, hasHours: true };
  }
  return { prefix: '~', minutes: m, hasHours: false };
}

// ─── Toast Message ───

export function deriveToastMessage(peopleAhead: number): string | null {
  if (peopleAhead > 3) return `Vous avancez — encore ${peopleAhead} personnes`;
  if (peopleAhead === 3) return `Vous avancez — encore 3 personnes`;
  if (peopleAhead === 2) return 'Plus que 2 personnes devant vous';
  if (peopleAhead === 1) return 'Vous êtes le prochain !';
  return null;
}

// ─── Estimate Smoothing ───
// Never show estimate increasing by more than maxIncrease minutes in a single update

export function smoothEstimate(
  newMins: number,
  prevDisplayedMins: number | null,
  confidence?: 'high' | 'medium' | 'low'
): number {
  if (prevDisplayedMins === null) return Math.max(0, Math.round(newMins));

  const rounded = Math.max(0, Math.round(newMins));

  // If estimate decreased, show the new lower value immediately
  if (rounded <= prevDisplayedMins) return rounded;

  // Cap visible increases — wider cap for low confidence (inherently uncertain)
  const maxIncrease = confidence === 'low' ? 10 : 5;
  const increase = rounded - prevDisplayedMins;
  if (increase > maxIncrease) {
    return prevDisplayedMins + maxIncrease;
  }

  return rounded;
}

// ─── Wait Time Aria Label ───

export function waitTimeAriaLabel(totalMinutes: number): string {
  const m = Math.max(0, Math.round(totalMinutes));
  if (m >= 60) {
    const h = Math.floor(m / 60);
    const rem = m % 60;
    if (rem === 0) return `environ ${h} heure${h > 1 ? 's' : ''}`;
    return `environ ${h} heure${h > 1 ? 's' : ''} ${rem} minutes`;
  }
  return `environ ${m} minutes`;
}

// ─── Format Consultation Time ───

export function formatConsultationTime(dateStr: string): string {
  const d = new Date(dateStr);
  const h = d.getHours();
  const m = d.getMinutes();
  return `${h}h${m.toString().padStart(2, '0')}`;
}

// ─── Compute Wait Duration ───

export function computeWaitDuration(arrivedAt: string, calledAt: string | null): number {
  if (!calledAt) return 0;
  const diff = new Date(calledAt).getTime() - new Date(arrivedAt).getTime();
  return Math.max(0, Math.round(diff / 60000));
}

// ─── Format Appointment Time ───

export function formatAppointmentTime(apptTime: string | null): string | null {
  if (!apptTime) return null;
  // appointmentTime is HH:MM or ISO — extract hours/minutes
  if (apptTime.includes(':') && apptTime.length <= 5) {
    const [h, m] = apptTime.split(':');
    return `${parseInt(h)}h${m}`;
  }
  const d = new Date(apptTime);
  if (isNaN(d.getTime())) return apptTime;
  return `${d.getHours()}h${d.getMinutes().toString().padStart(2, '0')}`;
}
