// ─── Types ───

export type Phase = 'far' | 'mid' | 'soon' | 'next' | 'called' | 'done';
export type ContextType = 'leave' | 'stay' | 'ready' | null;

// ─── Phase Derivation (Spec §8.2) ───

export function derivePhase(status: string, peopleAhead: number): Phase {
  if (status === 'COMPLETED') return 'done';
  if (status === 'IN_CONSULTATION' || status === 'NOTIFIED') {
    // NOTIFIED = position #2 (next), IN_CONSULTATION = called
    if (status === 'IN_CONSULTATION') return 'called';
  }
  if (peopleAhead <= 1) return 'next';
  if (peopleAhead <= 2) return 'soon';
  if (peopleAhead <= 4) return 'mid';
  return 'far';
}

// ─── Context Card Derivation (Spec §8.3) ───

export function deriveContextCard(phase: Phase): ContextType {
  if (phase === 'called' || phase === 'done') return null;
  if (phase === 'next') return 'ready';
  if (phase === 'soon') return 'stay';
  return 'leave'; // far, mid
}

// ─── Eyebrow Text (Spec §8.4) ───

export function deriveEyebrow(phase: Phase): string {
  if (phase === 'next') return 'Vous êtes le prochain';
  if (phase === 'soon') return 'Bientôt votre tour';
  return 'Attente estimée'; // far, mid
}

// ─── Time Size (Spec §8.5) ───

export function deriveTimeSize(minutes: number): 'size-xl' | 'size-lg' | 'size-md' {
  if (minutes >= 60) return 'size-xl';
  if (minutes >= 15) return 'size-lg';
  return 'size-md';
}

// ─── Time Format (Spec §8.6) ───
// Returns a structure for rendering, not raw HTML

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

// ─── Subtext (Spec §4.4.3) ───

export function deriveSubtext(peopleAhead: number): { count: number; text: string } {
  if (peopleAhead <= 1) {
    return { count: 1, text: 'personne devant vous' };
  }
  return { count: peopleAhead, text: 'personnes devant vous' };
}

// ─── Toast Message (Spec §9.3) ───

export function deriveToastMessage(peopleAhead: number): string | null {
  if (peopleAhead > 3) return `Vous avancez — encore ${peopleAhead} personnes`;
  if (peopleAhead === 3) return `Vous avancez — encore 3 personnes`;
  if (peopleAhead === 2) return 'Plus que 2 personnes devant vous';
  if (peopleAhead === 1) return 'Vous êtes le prochain !';
  return null;
}

// ─── Estimate Smoothing (Spec §9.2) ───
// Never show estimate increasing by more than 5 minutes in a single update

export function smoothEstimate(newMins: number, prevDisplayedMins: number | null): number {
  if (prevDisplayedMins === null) return Math.max(0, Math.round(newMins));

  const rounded = Math.max(0, Math.round(newMins));

  // If estimate decreased, show the new lower value immediately
  if (rounded <= prevDisplayedMins) return rounded;

  // If estimate increased by more than 5 min, cap the visible increase
  const increase = rounded - prevDisplayedMins;
  if (increase > 5) {
    return prevDisplayedMins + 5;
  }

  return rounded;
}

// ─── Context Card Content (Spec §5) ───

export interface ContextCardContent {
  variant: ContextType;
  title: string;
  body: string;
  bodyStrong?: string;  // text to make bold within body
  iconType: 'exit' | 'location' | 'check';
  showNotify: boolean;
}

export function deriveContextContent(phase: Phase, peopleAhead: number, estimatedMins: number): ContextCardContent | null {
  const ctx = deriveContextCard(phase);
  if (!ctx) return null;

  if (phase === 'far') {
    return {
      variant: 'leave',
      title: 'Vous avez le temps de sortir',
      body: 'Nous vous enverrons une notification 15 minutes avant votre tour. Restez joignable.',
      bodyStrong: '15 minutes avant votre tour',
      iconType: 'exit',
      showNotify: true,
    };
  }

  if (phase === 'mid') {
    if (peopleAhead > 3) {
      return {
        variant: 'leave',
        title: 'Vous pouvez encore sortir',
        body: `Il reste environ ${estimatedMins >= 60 ? Math.floor(estimatedMins / 60) + ' heure' + (Math.floor(estimatedMins / 60) > 1 ? 's' : '') : estimatedMins + ' minutes'} avant votre passage. Notification automatique activée.`,
        bodyStrong: estimatedMins >= 60 ? `${Math.floor(estimatedMins / 60)} heure` : `${estimatedMins} minutes`,
        iconType: 'exit',
        showNotify: true,
      };
    }
    return {
      variant: 'leave',
      title: 'Restez à proximité',
      body: 'Votre tour approche. Évitez de trop vous éloigner du cabinet.',
      iconType: 'location',
      showNotify: true,
    };
  }

  if (phase === 'soon') {
    return {
      variant: 'stay',
      title: 'Restez à proximité du cabinet',
      body: 'Votre tour arrive bientôt. Préparez votre carte vitale et vos documents.',
      bodyStrong: 'carte vitale',
      iconType: 'location',
      showNotify: false,
    };
  }

  if (phase === 'next') {
    return {
      variant: 'ready',
      title: 'Préparez-vous',
      body: 'Vous serez appelé(e) dans quelques minutes. Restez dans la salle d\'attente.',
      iconType: 'check',
      showNotify: false,
    };
  }

  return null;
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
