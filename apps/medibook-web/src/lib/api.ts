/**
 * API client for MediBook
 * Handles authentication and API requests
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002';

class ApiClient {
  private static instance: ApiClient;
  private token: string | null = null;

  private constructor() {
    this.token = localStorage.getItem('auth_token');
  }

  public static getInstance(): ApiClient {
    if (!ApiClient.instance) {
      ApiClient.instance = new ApiClient();
    }
    return ApiClient.instance;
  }

  public setToken(token: string | null): void {
    this.token = token;
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }
  }

  public getToken(): string | null {
    return this.token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_URL}${endpoint}`;

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      if (response.status === 401) {
        this.setToken(null);
        window.location.href = '/login';
      }

      const error = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Generic CRUD methods
  public get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  public post<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  public patch<T>(endpoint: string, data: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  public delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  // Appointment endpoints
  public getAppointments(params?: Record<string, string>) {
    const query = params ? `?${new URLSearchParams(params)}` : '';
    return this.get(`/api/appointments${query}`);
  }

  public getAppointment(id: string) {
    return this.get(`/api/appointments/${id}`);
  }

  public createAppointment(data: {
    doctorId: string;
    patientId: string;
    date: string;
    startTime: string;
    duration: number;
    reason?: string;
    notes?: string;
  }) {
    return this.post('/api/appointments', data);
  }

  public updateAppointment(id: string, data: Partial<{
    date: string;
    startTime: string;
    duration: number;
    status: string;
    reason: string;
    notes: string;
  }>) {
    return this.patch(`/api/appointments/${id}`, data);
  }

  public cancelAppointment(id: string, reason?: string) {
    return this.delete(`/api/appointments/${id}?reason=${encodeURIComponent(reason || '')}`);
  }

  public checkInAppointment(id: string) {
    return this.post(`/api/appointments/${id}/checkin`);
  }

  // Patient endpoints
  public getPatients(search?: string) {
    const query = search ? `?search=${encodeURIComponent(search)}` : '';
    return this.get(`/api/patients${query}`);
  }

  public getPatient(id: string) {
    return this.get(`/api/patients/${id}`);
  }

  public createPatient(data: {
    name: string;
    phone: string;
    email?: string;
    dateOfBirth?: string;
    gender?: string;
    notes?: string;
  }) {
    return this.post('/api/patients', data);
  }

  public updatePatient(id: string, data: Partial<{
    name: string;
    phone: string;
    email: string;
    dateOfBirth: string;
    gender: string;
    notes: string;
  }>) {
    return this.patch(`/api/patients/${id}`, data);
  }

  public getPatientHistory(id: string) {
    return this.get(`/api/patients/${id}/history`);
  }

  // Doctor endpoints
  public getDoctors() {
    return this.get('/api/doctors');
  }

  public getDoctor(id: string) {
    return this.get(`/api/doctors/${id}`);
  }

  public getDoctorAvailability(id: string, date: string, duration?: number) {
    const query = new URLSearchParams({ date });
    if (duration) query.set('duration', duration.toString());
    return this.get(`/api/doctors/${id}/availability?${query}`);
  }

  // Calendar endpoints
  public getCalendarDay(date: string) {
    return this.get(`/api/calendar/day/${date}`);
  }

  public getCalendarWeek(date: string) {
    return this.get(`/api/calendar/week/${date}`);
  }

  public getCalendarMonth(date: string) {
    return this.get(`/api/calendar/month/${date}`);
  }

  public getAvailableSlots(date: string, doctorId?: string, duration?: number) {
    const query = new URLSearchParams({ date });
    if (doctorId) query.set('doctorId', doctorId);
    if (duration) query.set('duration', duration.toString());
    return this.get(`/api/calendar/slots?${query}`);
  }
}

export const api = ApiClient.getInstance();
export default api;
