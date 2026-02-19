/**
 * ApiClient — Wraps all BleSaf API endpoints and Socket.io connections.
 *
 * Endpoint paths and response shapes match the actual BleSaf API.
 * All successful API responses are wrapped in { data: ... }.
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import { io, Socket } from 'socket.io-client';
import { MetricsCollector } from './metrics/collector';

// ─── Response types (match actual API responses) ─────────────────────────────

export interface LoginResponse {
  token: string;
  clinic: {
    id: string;
    name: string;
    email: string;
    doctorName: string;
    isDoctorPresent: boolean;
    subscriptionStatus: string;
  };
}

export interface CheckInResponse {
  id: string;           // queue entry ID
  position: number;
  status: string;
  patientName?: string;
  patientPhone?: string;
  clinicId: string;
  clinicName?: string;
  estimatedWaitMins?: number;
}

export interface QueueEntry {
  id: string;
  position: number;
  status: 'WAITING' | 'NOTIFIED' | 'IN_CONSULTATION' | 'COMPLETED' | 'NO_SHOW' | 'CANCELLED';
  patientName: string;
  patientPhone: string;
  arrivedAt: string;
  completedAt?: string;
}

export interface QueueStats {
  waiting: number;
  inConsultation: number;
  completed: number;
  seen: number;
  avgWait: number | null;
}

export interface QueueState {
  queue: QueueEntry[];
  stats: QueueStats;
}

export interface PatientStatus {
  id: string;
  position: number;
  status: string;
  estimatedWaitMins?: number;
}

// ─── API Client ──────────────────────────────────────────────────────────────

export class ApiClient {
  private http: AxiosInstance;
  private socket: Socket | null = null;
  private token: string = '';
  private clinicId: string = '';
  private metrics: MetricsCollector;
  private baseUrl: string;
  private socketUrl: string;
  private socketEvents: Array<{ event: string; data: any; timestamp: Date }> = [];

  constructor(baseUrl: string, socketUrl: string, metrics: MetricsCollector) {
    this.baseUrl = baseUrl;
    this.socketUrl = socketUrl;
    this.metrics = metrics;

    this.http = axios.create({
      baseURL: baseUrl,
      timeout: 10000,
      headers: { 'Content-Type': 'application/json' },
    });

    // Intercept responses to track errors (skip expected non-fatal codes)
    this.http.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        const url = error.config?.url || 'unknown';
        const status = error.response?.status || 0;

        // Don't record expected error codes as errors:
        // - 404 on /next = queue is empty (normal)
        // - 400 on /next = doctor not present (normal during lunch)
        const isExpectedNextError = url.endsWith('/next') && (status === 404 || status === 400);
        if (!isExpectedNextError) {
          this.metrics.recordApiError(
            error.config?.method?.toUpperCase() || 'UNKNOWN',
            url,
            status,
            error.message
          );
        }
        throw error;
      }
    );
  }

  // ─── Auth ──────────────────────────────────────────────────────────────

  async login(email: string, password: string): Promise<LoginResponse> {
    const start = Date.now();
    try {
      const { data: resp } = await this.http.post('/api/auth/login', {
        email,
        password,
      });

      // API wraps response in { data: { token, clinic } }
      const payload = resp.data;
      this.token = payload.token;
      this.clinicId = payload.clinic?.id || '';
      this.http.defaults.headers.common['Authorization'] = `Bearer ${this.token}`;

      this.metrics.recordApiCall('POST', '/api/auth/login', Date.now() - start, 200);
      return payload;
    } catch (err) {
      this.metrics.recordApiCall('POST', '/api/auth/login', Date.now() - start, 0);
      throw err;
    }
  }

  // ─── Doctor Actions ────────────────────────────────────────────────────

  async setDoctorPresent(present: boolean): Promise<void> {
    const start = Date.now();
    const endpoint = `/api/clinic/doctor-presence`;
    try {
      await this.http.post(endpoint, { isDoctorPresent: present });
      this.metrics.recordApiCall('POST', endpoint, Date.now() - start, 200);
    } catch (err) {
      this.metrics.recordApiCall('POST', endpoint, Date.now() - start, 0);
      throw err;
    }
  }

  async callNextPatient(): Promise<QueueEntry | null> {
    const start = Date.now();
    const endpoint = `/api/queue/next`;
    try {
      const { data: resp } = await this.http.post(endpoint);
      this.metrics.recordApiCall('POST', endpoint, Date.now() - start, 200);
      // API wraps response in { data: entry }
      return resp.data;
    } catch (err: any) {
      const status = err.response?.status || 0;
      // 404 = empty queue, 400 = doctor not present — expected, record as normal calls
      if (status === 404 || status === 400) {
        this.metrics.recordApiCall('POST', endpoint, Date.now() - start, status);
        return null;
      }
      // Actual errors (timeout, 500, etc.)
      this.metrics.recordApiCall('POST', endpoint, Date.now() - start, status);
      throw err;
    }
  }

  async getQueue(): Promise<QueueState> {
    const start = Date.now();
    const endpoint = `/api/queue`;
    try {
      const { data: resp } = await this.http.get(endpoint);
      this.metrics.recordApiCall('GET', endpoint, Date.now() - start, 200);
      // API wraps response in { data: { queue, stats } }
      return resp.data;
    } catch (err) {
      this.metrics.recordApiCall('GET', endpoint, Date.now() - start, 0);
      throw err;
    }
  }

  async completePatient(entryId: string): Promise<void> {
    const start = Date.now();
    const endpoint = `/api/queue/${entryId}/status`;
    try {
      await this.http.patch(endpoint, { status: 'COMPLETED' });
      this.metrics.recordApiCall('PATCH', endpoint, Date.now() - start, 200);
    } catch (err) {
      this.metrics.recordApiCall('PATCH', endpoint, Date.now() - start, 0);
      throw err;
    }
  }

  // ─── Patient Actions ───────────────────────────────────────────────────

  async checkIn(patientName: string, phone: string, clinicId?: string): Promise<CheckInResponse> {
    const start = Date.now();
    const cid = clinicId || this.clinicId;
    const endpoint = `/api/queue/checkin/${cid}`;
    try {
      const { data: resp } = await this.http.post(endpoint, {
        patientName,
        patientPhone: phone,
      });
      this.metrics.recordApiCall('POST', '/api/queue/checkin/:clinicId', Date.now() - start, 200);
      // API wraps response in { data: { ...entry, clinicName, estimatedWaitMins } }
      return resp.data;
    } catch (err) {
      this.metrics.recordApiCall('POST', '/api/queue/checkin/:clinicId', Date.now() - start, 0);
      throw err;
    }
  }

  async getPatientStatus(entryId: string): Promise<PatientStatus> {
    const start = Date.now();
    const endpoint = `/api/queue/patient/${entryId}`;
    try {
      const { data: resp } = await this.http.get(endpoint);
      this.metrics.recordApiCall('GET', '/api/queue/patient/:id', Date.now() - start, 200);
      // API wraps response in { data: status }
      return resp.data;
    } catch (err) {
      this.metrics.recordApiCall('GET', '/api/queue/patient/:id', Date.now() - start, 0);
      throw err;
    }
  }

  async leaveQueue(entryId: string): Promise<void> {
    const start = Date.now();
    const endpoint = `/api/queue/patient/${entryId}/leave`;
    try {
      await this.http.post(endpoint);
      this.metrics.recordApiCall('POST', '/api/queue/patient/:id/leave', Date.now() - start, 200);
    } catch (err) {
      this.metrics.recordApiCall('POST', '/api/queue/patient/:id/leave', Date.now() - start, 0);
      throw err;
    }
  }

  // ─── Socket.io ─────────────────────────────────────────────────────────

  connectSocket(clinicId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.socket = io(this.socketUrl, {
        transports: ['websocket'],
        auth: { token: this.token },
      });

      const timeout = setTimeout(() => {
        reject(new Error('Socket connection timeout'));
      }, 10000);

      this.socket.on('connect', () => {
        clearTimeout(timeout);
        // Join the clinic room
        this.socket!.emit('join:clinic', { clinicId, token: this.token });
        this.metrics.recordSocketEvent('connect');
        resolve();
      });

      this.socket.on('disconnect', (reason) => {
        this.metrics.recordSocketEvent('disconnect', { reason });
      });

      // Listen for queue update events
      this.socket.on('queue:updated', (data) => {
        this.metrics.recordSocketEvent('queue:updated', data);
        this.socketEvents.push({ event: 'queue:updated', data, timestamp: new Date() });
      });

      this.socket.on('patient:called', (data) => {
        this.metrics.recordSocketEvent('patient:called', data);
        this.socketEvents.push({ event: 'patient:called', data, timestamp: new Date() });
      });

      this.socket.on('connect_error', (err) => {
        clearTimeout(timeout);
        this.metrics.recordApiError('SOCKET', 'connect', 0, err.message);
        reject(err);
      });
    });
  }

  disconnectSocket(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  getSocketEvents(): Array<{ event: string; data: any; timestamp: Date }> {
    return [...this.socketEvents];
  }

  get currentClinicId(): string {
    return this.clinicId;
  }
}
