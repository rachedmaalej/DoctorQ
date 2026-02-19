/**
 * SimClock — Manages compressed simulation time.
 *
 * In compressed mode (32x), 1 real second = 32 simulated seconds.
 * An 8-hour workday (480 min) completes in ~15 real minutes.
 */

export interface SimTime {
  simulated: Date;     // The "pretend" time in the clinic's day
  real: Date;          // Actual wall-clock time
  elapsed: number;     // Simulated minutes since workday start
}

export class SimClock {
  private compression: number;
  private realStart: number = 0;
  private simStart: Date;
  private simEnd: Date;
  private running = false;

  constructor(
    workdayStart: string = '08:00',
    workdayEnd: string = '16:00',
    compression: number = 32
  ) {
    this.compression = compression;

    // Build today's simulated start/end times
    const today = new Date();
    const [startH, startM] = workdayStart.split(':').map(Number);
    const [endH, endM] = workdayEnd.split(':').map(Number);

    this.simStart = new Date(today.getFullYear(), today.getMonth(), today.getDate(), startH, startM);
    this.simEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate(), endH, endM);
  }

  start(): void {
    this.realStart = Date.now();
    this.running = true;
  }

  now(): SimTime {
    if (!this.running) {
      return { simulated: this.simStart, real: new Date(), elapsed: 0 };
    }

    const realElapsedMs = Date.now() - this.realStart;
    const simElapsedMs = realElapsedMs * this.compression;
    const simulated = new Date(this.simStart.getTime() + simElapsedMs);
    const elapsed = simElapsedMs / (1000 * 60); // simulated minutes

    return { simulated, real: new Date(), elapsed };
  }

  /** Is the simulated workday still ongoing? */
  isWorkday(): boolean {
    if (!this.running) return true;
    return this.now().simulated.getTime() < this.simEnd.getTime();
  }

  /** Is the doctor on lunch break? */
  isLunchBreak(lunchStart: string, lunchEnd: string): boolean {
    const sim = this.now().simulated;
    const h = sim.getHours();
    const m = sim.getMinutes();
    const current = h * 60 + m;

    const [lsH, lsM] = lunchStart.split(':').map(Number);
    const [leH, leM] = lunchEnd.split(':').map(Number);

    return current >= lsH * 60 + lsM && current < leH * 60 + leM;
  }

  /** Convert simulated minutes to real milliseconds for setTimeout */
  simMinutesToRealMs(simMinutes: number): number {
    return (simMinutes * 60 * 1000) / this.compression;
  }

  /** Get a formatted simulated time string */
  formatSimTime(): string {
    const sim = this.now().simulated;
    return sim.toLocaleTimeString('fr-TN', { hour: '2-digit', minute: '2-digit' });
  }

  /** Total simulated workday duration in minutes */
  get workdayMinutes(): number {
    return (this.simEnd.getTime() - this.simStart.getTime()) / (1000 * 60);
  }

  /** Total real duration for the compressed simulation in ms */
  get totalRealDurationMs(): number {
    return this.simMinutesToRealMs(this.workdayMinutes);
  }

  /** Helper: sleep for N simulated minutes */
  sleep(simMinutes: number): Promise<void> {
    const realMs = this.simMinutesToRealMs(simMinutes);
    return new Promise(resolve => setTimeout(resolve, realMs));
  }
}
