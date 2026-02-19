/**
 * MetricsCollector — Captures all timing, error, and event data during simulation.
 */

export interface ApiCallRecord {
  method: string;
  endpoint: string;
  responseTimeMs: number;
  statusCode: number;
  timestamp: Date;
}

export interface ApiErrorRecord {
  method: string;
  endpoint: string;
  statusCode: number;
  message: string;
  timestamp: Date;
}

export interface SocketEventRecord {
  event: string;
  data?: any;
  timestamp: Date;
}

export interface PatientJourney {
  patientName: string;
  phone: string;
  entryId: string;
  clinicId: string;
  checkedInAt: Date;
  simCheckedInAt: string;      // Simulated time string
  calledAt?: Date;
  simCalledAt?: string;
  completedAt?: Date;
  simCompletedAt?: string;
  leftAt?: Date;
  simLeftAt?: string;
  positionAtCheckIn: number;
  finalStatus: 'COMPLETED' | 'LEFT' | 'WAITING' | 'IN_CONSULTATION';
  statusChecks: number;        // How many times patient polled status
}

export interface QueueSnapshot {
  timestamp: Date;
  simTime: string;
  waiting: number;
  inConsultation: number;
  completed: number;
  totalInQueue: number;
}

export class MetricsCollector {
  private clinicName: string;
  private apiCalls: ApiCallRecord[] = [];
  private apiErrors: ApiErrorRecord[] = [];
  private socketEvents: SocketEventRecord[] = [];
  private patientJourneys: Map<string, PatientJourney> = new Map();
  private queueSnapshots: QueueSnapshot[] = [];
  private startTime: Date = new Date();
  private endTime: Date | null = null;

  constructor(clinicName: string) {
    this.clinicName = clinicName;
  }

  // ─── API Tracking ──────────────────────────────────────────────────────

  recordApiCall(method: string, endpoint: string, responseTimeMs: number, statusCode: number): void {
    this.apiCalls.push({ method, endpoint, responseTimeMs, statusCode, timestamp: new Date() });
  }

  recordApiError(method: string, endpoint: string, statusCode: number, message: string): void {
    this.apiErrors.push({ method, endpoint, statusCode, message, timestamp: new Date() });
  }

  // ─── Socket Tracking ──────────────────────────────────────────────────

  recordSocketEvent(event: string, data?: any): void {
    this.socketEvents.push({ event, data, timestamp: new Date() });
  }

  // ─── Patient Journey Tracking ──────────────────────────────────────────

  recordCheckIn(
    entryId: string,
    patientName: string,
    phone: string,
    clinicId: string,
    position: number,
    simTime: string
  ): void {
    this.patientJourneys.set(entryId, {
      patientName,
      phone,
      entryId,
      clinicId,
      checkedInAt: new Date(),
      simCheckedInAt: simTime,
      positionAtCheckIn: position,
      finalStatus: 'WAITING',
      statusChecks: 0,
    });
  }

  recordPatientCalled(entryId: string, simTime: string): void {
    const journey = this.patientJourneys.get(entryId);
    if (journey) {
      journey.calledAt = new Date();
      journey.simCalledAt = simTime;
      journey.finalStatus = 'IN_CONSULTATION';
    }
  }

  recordPatientCompleted(entryId: string, simTime: string): void {
    const journey = this.patientJourneys.get(entryId);
    if (journey) {
      journey.completedAt = new Date();
      journey.simCompletedAt = simTime;
      journey.finalStatus = 'COMPLETED';
    }
  }

  recordPatientLeft(entryId: string, simTime: string): void {
    const journey = this.patientJourneys.get(entryId);
    if (journey) {
      journey.leftAt = new Date();
      journey.simLeftAt = simTime;
      journey.finalStatus = 'LEFT';
    }
  }

  recordStatusCheck(entryId: string): void {
    const journey = this.patientJourneys.get(entryId);
    if (journey) {
      journey.statusChecks++;
    }
  }

  // ─── Queue Snapshots ──────────────────────────────────────────────────

  recordQueueSnapshot(simTime: string, waiting: number, inConsultation: number, completed: number, total: number): void {
    this.queueSnapshots.push({
      timestamp: new Date(),
      simTime,
      waiting,
      inConsultation,
      completed,
      totalInQueue: total,
    });
  }

  // ─── Finalization ─────────────────────────────────────────────────────

  finalize(): void {
    this.endTime = new Date();
  }

  // ─── Computed Metrics ─────────────────────────────────────────────────

  getClinicName(): string {
    return this.clinicName;
  }

  getTotalApiCalls(): number {
    return this.apiCalls.length;
  }

  getTotalErrors(): number {
    return this.apiErrors.length;
  }

  getApiCallsByEndpoint(): Map<string, { count: number; avgMs: number; maxMs: number; errors: number }> {
    const grouped = new Map<string, { times: number[]; errors: number }>();

    for (const call of this.apiCalls) {
      const key = `${call.method} ${call.endpoint.replace(/\/[a-f0-9-]{36}/g, '/:id')}`;
      if (!grouped.has(key)) grouped.set(key, { times: [], errors: 0 });
      const entry = grouped.get(key)!;
      entry.times.push(call.responseTimeMs);
      // Count real errors only (not expected 404/400 on /next which mean "empty queue" / "doctor not present")
      const isExpectedNextStatus = call.endpoint === '/api/queue/next' && (call.statusCode === 404 || call.statusCode === 400);
      if ((call.statusCode >= 400 || call.statusCode === 0) && !isExpectedNextStatus) entry.errors++;
    }

    const result = new Map<string, { count: number; avgMs: number; maxMs: number; errors: number }>();
    for (const [key, val] of grouped) {
      const avg = val.times.reduce((a, b) => a + b, 0) / val.times.length;
      const max = Math.max(...val.times);
      result.set(key, { count: val.times.length, avgMs: Math.round(avg), maxMs: max, errors: val.errors });
    }

    return result;
  }

  getPatientMetrics(): {
    total: number;
    completed: number;
    left: number;
    stillWaiting: number;
    avgWaitMinutes: number;
    medianWaitMinutes: number;
    maxWaitMinutes: number;
    avgStatusChecks: number;
  } {
    const journeys = Array.from(this.patientJourneys.values());
    const completed = journeys.filter(j => j.finalStatus === 'COMPLETED');
    const left = journeys.filter(j => j.finalStatus === 'LEFT');
    const stillWaiting = journeys.filter(j => j.finalStatus === 'WAITING' || j.finalStatus === 'IN_CONSULTATION');

    // Calculate wait times (check-in to called) for completed patients
    const waitTimes = completed
      .filter(j => j.calledAt)
      .map(j => (j.calledAt!.getTime() - j.checkedInAt.getTime()) / (1000 * 60));

    const sorted = [...waitTimes].sort((a, b) => a - b);
    const avg = waitTimes.length > 0 ? waitTimes.reduce((a, b) => a + b, 0) / waitTimes.length : 0;
    const median = sorted.length > 0 ? sorted[Math.floor(sorted.length / 2)] : 0;
    const max = sorted.length > 0 ? sorted[sorted.length - 1] : 0;

    const avgChecks = journeys.length > 0
      ? journeys.reduce((a, j) => a + j.statusChecks, 0) / journeys.length
      : 0;

    return {
      total: journeys.length,
      completed: completed.length,
      left: left.length,
      stillWaiting: stillWaiting.length,
      avgWaitMinutes: Math.round(avg * 10) / 10,
      medianWaitMinutes: Math.round(median * 10) / 10,
      maxWaitMinutes: Math.round(max * 10) / 10,
      avgStatusChecks: Math.round(avgChecks * 10) / 10,
    };
  }

  getSocketMetrics(): { total: number; byEvent: Map<string, number> } {
    const byEvent = new Map<string, number>();
    for (const evt of this.socketEvents) {
      byEvent.set(evt.event, (byEvent.get(evt.event) || 0) + 1);
    }
    return { total: this.socketEvents.length, byEvent };
  }

  getQueueSnapshots(): QueueSnapshot[] {
    return [...this.queueSnapshots];
  }

  getErrors(): ApiErrorRecord[] {
    return [...this.apiErrors];
  }

  getSimulationDuration(): { realSeconds: number } {
    const end = this.endTime || new Date();
    return { realSeconds: Math.round((end.getTime() - this.startTime.getTime()) / 1000) };
  }

  getAllJourneys(): PatientJourney[] {
    return Array.from(this.patientJourneys.values());
  }
}
