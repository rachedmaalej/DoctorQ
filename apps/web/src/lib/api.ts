import type {
  LoginCredentials,
  LoginResponse,
  Clinic,
  QueueResponse,
  AddPatientData,
  QueueEntry,
  UpdateStatusData,
  ApiError,
} from '@/types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

class ApiClient {
  private token: string | null = null;

  constructor() {
    // Load token from localStorage on initialization
    this.token = localStorage.getItem('auth_token');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // Re-check localStorage for token in case it was set after construction
    if (!this.token) {
      this.token = localStorage.getItem('auth_token');
    }

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    console.log(`[API] ${options.method || 'GET'} ${endpoint}`, { hasToken: !!this.token });

    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        console.error(`[API] Error response:`, data);
        const error: ApiError = data.error || {
          code: 'UNKNOWN_ERROR',
          message: 'An unexpected error occurred',
        };
        throw error;
      }

      console.log(`[API] Success:`, endpoint);
      return data.data;
    } catch (err) {
      console.error(`[API] Request failed:`, err);
      throw err;
    }
  }

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('auth_token', token);
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('auth_token');
  }

  // Auth endpoints
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const response = await this.request<LoginResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    this.setToken(response.token);
    return response;
  }

  async logout(): Promise<void> {
    await this.request('/api/auth/logout', {
      method: 'POST',
    });
    this.clearToken();
  }

  async getMe(): Promise<Clinic> {
    return this.request<Clinic>('/api/auth/me');
  }

  // Queue endpoints
  async getQueue(): Promise<QueueResponse> {
    return this.request<QueueResponse>('/api/queue');
  }

  async addPatient(data: AddPatientData): Promise<QueueEntry> {
    return this.request<QueueEntry>('/api/queue', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async callNext(): Promise<{ called: QueueEntry; notified: QueueEntry[] }> {
    return this.request('/api/queue/next', {
      method: 'POST',
    });
  }

  async updatePatientStatus(
    id: string,
    data: UpdateStatusData
  ): Promise<QueueEntry> {
    return this.request<QueueEntry>(`/api/queue/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async removePatient(id: string): Promise<void> {
    await this.request(`/api/queue/${id}`, {
      method: 'DELETE',
    });
  }

  async clearQueue(): Promise<{ message: string; count: number }> {
    return this.request('/api/queue', {
      method: 'DELETE',
    });
  }

  async resetStats(): Promise<{ message: string; deletedCount: number }> {
    return this.request('/api/queue/reset-stats', {
      method: 'POST',
    });
  }

  // Patient endpoints (public)
  async getPatientStatus(entryId: string): Promise<QueueEntry> {
    return this.request<QueueEntry>(`/api/queue/patient/${entryId}`);
  }

  async checkIn(clinicId: string, data: { patientPhone: string; patientName?: string }): Promise<QueueEntry & { clinicName: string; estimatedWaitMins: number }> {
    return this.request(`/api/queue/checkin/${clinicId}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Clinic endpoints
  async getClinic(): Promise<Clinic> {
    return this.request<Clinic>('/api/clinic');
  }

  async getQRCode(): Promise<{ url: string; qrCode: string; clinicName: string }> {
    return this.request('/api/clinic/qr');
  }
}

export const api = new ApiClient();
