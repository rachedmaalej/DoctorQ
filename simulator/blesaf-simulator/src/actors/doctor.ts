/**
 * DoctorActor — Simulates a doctor's behavior throughout a clinic day.
 *
 * Behaviors:
 * - Arrives (possibly late)
 * - Marks self as present
 * - Calls next patient at realistic intervals
 * - Takes lunch break
 * - Occasionally makes mistakes (rarely)
 * - Closes day when queue is empty or workday ends
 */

import { ApiClient } from '../api-client';
import { SimClock } from '../clock';
import { MetricsCollector } from '../metrics/collector';

interface DoctorProfile {
  consultationMinutes: { min: number; max: number };
  lunchBreak: { start: string; end: string };
  doctorLateStart: { probability: number; maxMinutes: number };
}

export class DoctorActor {
  private api: ApiClient;
  private clock: SimClock;
  private metrics: MetricsCollector;
  private profile: DoctorProfile;
  private clinicId: string;
  private isPresent = false;
  private patientsSeenToday = 0;
  private log: (msg: string) => void;

  constructor(
    api: ApiClient,
    clock: SimClock,
    metrics: MetricsCollector,
    profile: DoctorProfile,
    clinicId: string,
    logger: (msg: string) => void
  ) {
    this.api = api;
    this.clock = clock;
    this.metrics = metrics;
    this.profile = profile;
    this.clinicId = clinicId;
    this.log = logger;
  }

  /** Simulate the doctor arriving at work */
  async arrive(): Promise<void> {
    // Maybe arrive late
    if (Math.random() < this.profile.doctorLateStart.probability) {
      const lateMinutes = Math.floor(Math.random() * this.profile.doctorLateStart.maxMinutes) + 1;
      this.log(`Doctor arriving ${lateMinutes} min late...`);
      await this.clock.sleep(lateMinutes);
    }

    // Mark as present
    try {
      await this.api.setDoctorPresent(true);
      this.isPresent = true;
      this.log(`Doctor is now present at ${this.clock.formatSimTime()}`);
    } catch (err: any) {
      this.log(`ERROR: Failed to mark doctor present: ${err.message}`);
    }
  }

  /**
   * Main consultation loop — runs until workday ends or queue is empty.
   * Returns when the doctor's day is done.
   */
  async runConsultations(): Promise<void> {
    let consecutiveEmptyChecks = 0;
    let consecutiveErrors = 0;
    const MAX_EMPTY_BEFORE_IDLE = 3;

    while (this.clock.isWorkday()) {
      // Check for lunch break
      if (this.clock.isLunchBreak(this.profile.lunchBreak.start, this.profile.lunchBreak.end)) {
        this.log(`Doctor on lunch break at ${this.clock.formatSimTime()}`);
        // Sleep until lunch ends (check every simulated 5 minutes)
        while (this.clock.isLunchBreak(this.profile.lunchBreak.start, this.profile.lunchBreak.end) && this.clock.isWorkday()) {
          await this.clock.sleep(5);
        }
        if (!this.clock.isWorkday()) break;
        this.log(`Doctor back from lunch at ${this.clock.formatSimTime()}`);
        consecutiveEmptyChecks = 0;
        consecutiveErrors = 0;
        continue;
      }

      // Try to call next patient
      try {
        const patient = await this.api.callNextPatient();
        consecutiveErrors = 0; // Reset on any successful response (including null)

        if (patient) {
          consecutiveEmptyChecks = 0;
          this.patientsSeenToday++;
          this.log(`[${this.clock.formatSimTime()}] Called patient: ${patient.patientName} (position was ${patient.position})`);

          // Record in metrics
          this.metrics.recordPatientCalled(patient.id, this.clock.formatSimTime());

          // Simulate consultation duration
          const duration = this.randomConsultationTime();
          this.log(`  Consulting for ~${duration} simulated minutes...`);
          await this.clock.sleep(duration);

          // Mark patient as completed
          try {
            await this.api.completePatient(patient.id);
            this.metrics.recordPatientCompleted(patient.id, this.clock.formatSimTime());
            this.log(`  Patient ${patient.patientName} completed at ${this.clock.formatSimTime()}`);
          } catch (err: any) {
            this.log(`  ERROR completing patient: ${err.message}`);
          }

        } else {
          // Queue is empty (404) or doctor not present (400)
          consecutiveEmptyChecks++;
          if (consecutiveEmptyChecks >= MAX_EMPTY_BEFORE_IDLE) {
            this.log(`[${this.clock.formatSimTime()}] Queue empty, doctor idle. Checking again in 5 min...`);
            await this.clock.sleep(5);
          } else {
            // Brief pause before checking again
            await this.clock.sleep(1);
          }
        }
      } catch (err: any) {
        consecutiveErrors++;
        // On timeout/server errors, use exponential backoff to avoid hammering the API
        // Wait 3 sim-min on first error, then 5, then cap at 10 min
        const backoffMinutes = Math.min(3 + consecutiveErrors * 2, 10);
        if (consecutiveErrors <= 3) {
          this.log(`WARNING: /next failed (attempt ${consecutiveErrors}): ${err.message}. Retrying in ${backoffMinutes} sim-min...`);
        }
        await this.clock.sleep(backoffMinutes);
      }
    }

    // End of day
    try {
      await this.api.setDoctorPresent(false);
      this.isPresent = false;
    } catch {
      // Ignore end-of-day errors
    }

    this.log(`Doctor finished at ${this.clock.formatSimTime()}. Saw ${this.patientsSeenToday} patients today.`);
  }

  private randomConsultationTime(): number {
    const { min, max } = this.profile.consultationMinutes;
    // Use a slight bell curve (average of two random values) for more realistic distribution
    const r1 = Math.random() * (max - min) + min;
    const r2 = Math.random() * (max - min) + min;
    return Math.round((r1 + r2) / 2);
  }

  getPatientsSeenToday(): number {
    return this.patientsSeenToday;
  }
}
