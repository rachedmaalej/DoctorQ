/**
 * PatientActor — Simulates a single patient's lifecycle in the queue.
 *
 * Behaviors:
 * - Checks in at assigned arrival time
 * - Periodically checks their status (like refreshing the status page)
 * - May leave the queue after waiting too long
 * - Stops checking once completed or left
 */

import { ApiClient } from '../api-client';
import { SimClock } from '../clock';
import { MetricsCollector } from '../metrics/collector';

interface PatientConfig {
  name: string;
  phone: string;
  clinicId: string;
  willLeave: boolean;
  willNoShow: boolean;
}

export class PatientActor {
  private api: ApiClient;
  private clock: SimClock;
  private metrics: MetricsCollector;
  private config: PatientConfig;
  private entryId: string = '';
  private done = false;
  private log: (msg: string) => void;

  constructor(
    api: ApiClient,
    clock: SimClock,
    metrics: MetricsCollector,
    config: PatientConfig,
    logger: (msg: string) => void
  ) {
    this.api = api;
    this.clock = clock;
    this.metrics = metrics;
    this.config = config;
    this.log = logger;
  }

  /** Check in to the clinic queue */
  async checkIn(): Promise<boolean> {
    // No-show patients never arrive
    if (this.config.willNoShow) {
      this.log(`  [NO-SHOW] ${this.config.name} did not arrive`);
      return false;
    }

    try {
      const result = await this.api.checkIn(
        this.config.name,
        this.config.phone,
        this.config.clinicId
      );
      this.entryId = result.id;

      this.metrics.recordCheckIn(
        result.id,
        this.config.name,
        this.config.phone,
        this.config.clinicId,
        result.position,
        this.clock.formatSimTime()
      );

      this.log(`  [CHECK-IN] ${this.config.name} → Position #${result.position}`);
      return true;
    } catch (err: any) {
      this.log(`  [ERROR] ${this.config.name} check-in failed: ${err.message}`);
      return false;
    }
  }

  /**
   * Simulate periodic status checking and possible queue leaving.
   * Runs in the background until patient is done (completed, left, or workday ends).
   */
  async runLifecycle(): Promise<void> {
    if (!this.entryId || this.config.willNoShow) return;

    // Patients check their status every 3-8 simulated minutes
    const checkInterval = Math.floor(Math.random() * 6) + 3;
    let waitedMinutes = 0;
    // If patient will leave, decide when (after 20-60 simulated minutes)
    const leaveAfterMinutes = this.config.willLeave
      ? Math.floor(Math.random() * 40) + 20
      : Infinity;

    while (!this.done && this.clock.isWorkday()) {
      await this.clock.sleep(checkInterval);
      waitedMinutes += checkInterval;

      if (this.done) break;

      // Check status
      try {
        const status = await this.api.getPatientStatus(this.entryId);
        this.metrics.recordStatusCheck(this.entryId);

        if (status.status === 'COMPLETED' || status.status === 'IN_CONSULTATION') {
          this.done = true;
          break;
        }

        // Patient gets impatient and leaves
        if (this.config.willLeave && waitedMinutes >= leaveAfterMinutes) {
          this.log(`  [LEFT] ${this.config.name} left after ~${waitedMinutes} sim-min wait`);
          try {
            await this.api.leaveQueue(this.entryId);
            this.metrics.recordPatientLeft(this.entryId, this.clock.formatSimTime());
          } catch {
            // May already be completed
          }
          this.done = true;
          break;
        }
      } catch (err: any) {
        // Patient might have been completed between checks — that's fine
        if (err.response?.status === 404) {
          this.done = true;
          break;
        }
        // Otherwise just keep waiting
      }
    }
  }

  markDone(): void {
    this.done = true;
  }

  getEntryId(): string {
    return this.entryId;
  }
}
