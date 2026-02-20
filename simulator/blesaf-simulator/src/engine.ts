/**
 * ClinicSimulation — Orchestrates a full day simulation for one clinic.
 *
 * Coordinates:
 * - Patient arrivals on schedule
 * - Doctor consultation loop
 * - Periodic queue snapshots
 * - Proper startup and teardown
 */

import { ApiClient } from './api-client';
import { SimClock } from './clock';
import { MetricsCollector } from './metrics/collector';
import { DoctorActor } from './actors/doctor';
import { PatientActor } from './actors/patient';
import { generateArrivals, summarizeArrivals } from './patterns/arrival';

interface ClinicConfig {
  id: string;
  name: string;
  specialty: string;
  credentials: { email: string; password: string };
  profile: {
    dailyPatients: { min: number; max: number };
    consultationMinutes: { min: number; max: number };
    rushHours: Array<{ start: string; end: string; weight: number }>;
    lunchBreak: { start: string; end: string };
    patientNoShowRate: number;
    patientLeaveRate: number;
    doctorLateStart: { probability: number; maxMinutes: number };
  };
}

export class ClinicSimulation {
  private config: ClinicConfig;
  private clock: SimClock;
  private metrics: MetricsCollector;
  private api: ApiClient;
  private logBuffer: string[] = [];

  constructor(
    config: ClinicConfig,
    apiBaseUrl: string,
    socketUrl: string,
    compression: number
  ) {
    this.config = config;
    this.clock = new SimClock('08:00', '16:00', compression);
    this.metrics = new MetricsCollector(config.name);
    this.api = new ApiClient(apiBaseUrl, socketUrl, this.metrics);
  }

  private log(msg: string): void {
    const prefix = `[${this.config.specialty.toUpperCase().padEnd(13)}]`;
    const formatted = `${prefix} ${msg}`;
    console.log(formatted);
    this.logBuffer.push(`${new Date().toISOString()} ${formatted}`);
  }

  async run(): Promise<MetricsCollector> {
    this.log(`═══ Starting simulation: ${this.config.name} ═══`);
    this.log(`Real duration: ~${Math.round(this.clock.totalRealDurationMs / 1000)}s`);

    // ── Step 1: Login ────────────────────────────────────────────────────
    this.log('Logging in...');
    try {
      const loginResult = await this.api.login(
        this.config.credentials.email,
        this.config.credentials.password
      );
      this.log(`Logged in. Clinic ID: ${this.api.currentClinicId || this.config.id}`);
    } catch (err: any) {
      this.log(`FATAL: Login failed — ${err.message}`);
      this.log(`Make sure test credentials exist for ${this.config.credentials.email}`);
      this.metrics.finalize();
      return this.metrics;
    }

    // ── Step 2: Connect Socket.io ────────────────────────────────────────
    const clinicId = this.api.currentClinicId || this.config.id;
    try {
      await this.api.connectSocket(clinicId);
      this.log('Socket.io connected');
    } catch (err: any) {
      this.log(`WARNING: Socket.io connection failed — ${err.message}. Continuing without real-time tracking.`);
    }

    // ── Step 3: Generate arrival schedule ────────────────────────────────
    const arrivals = generateArrivals(
      this.config.profile.rushHours,
      this.config.profile.dailyPatients,
      this.config.profile.patientNoShowRate,
      this.config.profile.patientLeaveRate
    );

    const summary = summarizeArrivals(arrivals);
    this.log(`Generated ${summary.total} patients (${summary.noShows} no-shows, ${summary.willLeave} will leave early)`);
    for (const [hour, count] of summary.byHour) {
      this.log(`  ${hour}: ${'█'.repeat(count)} (${count})`);
    }

    // ── Step 4: Start the clock ──────────────────────────────────────────
    this.clock.start();
    this.log(`Simulation clock started at ${this.clock.formatSimTime()}`);

    // ── Step 5: Launch concurrent processes ──────────────────────────────

    const patientActors: PatientActor[] = [];

    // Process 1: Patient arrival scheduler
    const arrivalProcess = this.runArrivalScheduler(arrivals, patientActors, clinicId);

    // Process 2: Doctor consultation loop
    const doctor = new DoctorActor(
      this.api,
      this.clock,
      this.metrics,
      {
        consultationMinutes: this.config.profile.consultationMinutes,
        lunchBreak: this.config.profile.lunchBreak,
        doctorLateStart: this.config.profile.doctorLateStart,
      },
      clinicId,
      (msg) => this.log(msg)
    );
    const doctorProcess = doctor.arrive().then(() => doctor.runConsultations());

    // Process 3: Periodic queue snapshots
    const snapshotProcess = this.runSnapshotCollector();

    // Wait for all processes to complete
    await Promise.all([arrivalProcess, doctorProcess, snapshotProcess]);

    // ── Step 6: Cleanup ──────────────────────────────────────────────────

    // Mark any remaining patients as done
    for (const actor of patientActors) {
      actor.markDone();
    }

    this.api.disconnectSocket();
    this.metrics.finalize();

    const pm = this.metrics.getPatientMetrics();
    this.log(`═══ Simulation complete ═══`);
    this.log(`  Patients seen: ${pm.completed}/${pm.total}`);
    this.log(`  Left queue: ${pm.left}`);
    this.log(`  API calls: ${this.metrics.getTotalApiCalls()}`);
    this.log(`  Errors: ${this.metrics.getTotalErrors()}`);
    this.log(`  Duration: ${this.metrics.getSimulationDuration().realSeconds}s real time`);

    return this.metrics;
  }

  /**
   * Schedules patient arrivals at their designated simulated times.
   */
  private async runArrivalScheduler(
    arrivals: ReturnType<typeof generateArrivals>,
    actors: PatientActor[],
    clinicId: string
  ): Promise<void> {
    let lastArrivalMinute = 0;

    for (const arrival of arrivals) {
      // Wait until it's this patient's arrival time
      const waitMinutes = arrival.arrivalMinute - lastArrivalMinute;
      if (waitMinutes > 0) {
        await this.clock.sleep(waitMinutes);
      }
      lastArrivalMinute = arrival.arrivalMinute;

      if (!this.clock.isWorkday()) break;

      // Create and check in the patient
      const patient = new PatientActor(
        this.api,
        this.clock,
        this.metrics,
        {
          name: arrival.name,
          phone: arrival.phone,
          clinicId,
          willLeave: arrival.willLeave,
          willNoShow: arrival.willNoShow,
        },
        (msg) => this.log(msg)
      );

      actors.push(patient);

      const checkedIn = await patient.checkIn();
      if (checkedIn) {
        // Start patient lifecycle in background (status checking, possible leaving)
        patient.runLifecycle().catch(() => {});
      }
    }

    this.log(`All ${arrivals.length} patient arrivals processed.`);
  }

  /**
   * Takes periodic snapshots of queue state for the timeline report.
   */
  private async runSnapshotCollector(): Promise<void> {
    while (this.clock.isWorkday()) {
      try {
        const data = await this.api.getQueue();
        const stats = data.stats;
        this.metrics.recordQueueSnapshot(
          this.clock.formatSimTime(),
          stats?.waiting || 0,
          stats?.inConsultation || 0,
          stats?.seen || 0,
          data.queue?.length || 0
        );
      } catch {
        // Snapshot failure is non-critical
      }

      // Take a snapshot every 15 simulated minutes
      await this.clock.sleep(15);
    }
  }

  getLogBuffer(): string[] {
    return [...this.logBuffer];
  }
}
