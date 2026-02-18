import type {
  LoginCredentials,
  LoginResponse,
  Clinic,
  QueueResponse,
  AddPatientData,
  QueueEntry,
  UpdateStatusData,
  ApiError,
  PatientStatusResponse,
  AdminMetrics,
  AdminMetricsWithTrends,
  ClinicHealth,
  ClinicDetail,
  CreateClinicData,
  RecordPaymentData,
  Doctor,
  SubscriptionMetrics,
  OnboardingFunnel,
  ActivityItem,
  FinancialAnalytics,
  FeatureAdoption,
  PlatformHealth,
  ClinicEditableFields,
  DailyRecapResponse,
} from '@/types';
import { logger } from './logger';
import { webBrand } from './brand';

// Auto-detect production API URL based on hostname
function getApiUrl(): string {
  // If explicitly set via env var, use that
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }

  // In production (Vercel), detect based on hostname
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    // BleSaf production (Tunisia)
    if (hostname.includes('vercel.app') || hostname.includes('doctor-q') || hostname.includes('blesaf')) {
      return 'https://doctorqapi-production-ac8b.up.railway.app';
    }
    // FiloSoin production (France) — override VITE_API_URL in Vercel env for France deployments
    if (hostname.includes('filosoin')) {
      return import.meta.env.VITE_API_URL || 'https://doctorqapi-production-ac8b.up.railway.app';
    }
  }

  // Default to localhost for development (override with VITE_API_URL in .env)
  return 'http://localhost:3001';
}

const API_URL = getApiUrl();

class ApiClient {
  private token: string | null = null;

  constructor() {
    // Load token from localStorage on initialization
    this.token = localStorage.getItem('auth_token');

    // In dev, validate that frontend brand matches API brand
    if (import.meta.env.DEV) {
      this.validateBrand();
    }
  }

  private async validateBrand(): Promise<void> {
    try {
      const res = await fetch(`${API_URL}/api/brand`);
      const data = await res.json();
      if (data.brand && data.brand !== webBrand.id) {
        const msg = `BRAND MISMATCH: Frontend is "${webBrand.id}" but API is "${data.brand}". Use "pnpm dev:tn" for BleSaf or "pnpm dev:fr" for France.`;
        console.error(`[BRAND] ${msg}`);
        // Show a visible warning banner so it's impossible to miss
        const banner = document.createElement('div');
        banner.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:99999;background:#dc2626;color:white;padding:12px 16px;font:bold 14px/1.4 system-ui;text-align:center;';
        banner.textContent = msg;
        banner.addEventListener('click', () => banner.remove());
        document.body.appendChild(banner);
      }
    } catch {
      // API not ready yet, skip
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    // Re-check localStorage for token in case it was set after construction
    if (!this.token) {
      this.token = localStorage.getItem('auth_token');
    }

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    logger.log(`[API] ${options.method || 'GET'} ${endpoint}`, { hasToken: !!this.token });

    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        logger.error(`[API] Error response:`, data);

        // Auto-logout on 401 (expired/invalid token) — except for login/signup routes
        if (response.status === 401 && this.token && !endpoint.startsWith('/api/auth/login')) {
          this.clearToken();
          window.location.href = '/login';
          throw { code: 'SESSION_EXPIRED', message: 'Session expired. Please log in again.' };
        }

        // Handle subscription expired — let caller handle the error
        if (response.status === 403 && data.error?.code === 'SUBSCRIPTION_EXPIRED') {
          throw { code: 'SUBSCRIPTION_EXPIRED', message: data.error.message };
        }

        // Handle admin access denied — clear redirect to avoid retry loops
        if (response.status === 403 && data.error?.code === 'FORBIDDEN') {
          throw { code: 'FORBIDDEN', message: data.error.message || 'Admin access required' };
        }

        const error: ApiError & { data?: any } = {
          ...(data.error || {
            code: 'UNKNOWN_ERROR',
            message: 'An unexpected error occurred',
          }),
          data: data.data,  // Include data field for cases like ALREADY_CHECKED_IN
        };
        throw error;
      }

      logger.log(`[API] Success:`, endpoint);
      return data.data;
    } catch (err) {
      logger.error(`[API] Request failed:`, err);
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

  // Signup endpoints (public)
  async signup(data: {
    name: string;
    email: string;
    password: string;
    doctorName?: string;
    phone?: string;
    language?: 'fr' | 'ar';
  }): Promise<{ message: string; clinicId: string; email: string }> {
    return this.request('/api/signup', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async verifyEmail(token: string): Promise<{ message: string; email: string }> {
    return this.request('/api/signup/verify-email', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  }

  async resendVerification(email: string): Promise<{ message: string }> {
    return this.request('/api/signup/resend-verification', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async forgotPassword(email: string): Promise<{ message: string }> {
    return this.request('/api/signup/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async resetPassword(token: string, password: string): Promise<{ message: string }> {
    return this.request('/api/signup/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, password }),
    });
  }

  // Doctor endpoints
  async getDoctors(): Promise<Doctor[]> {
    return this.request('/api/clinic/doctors');
  }

  async createDoctor(data: { name: string; specialty?: string; avgConsultationMins?: number }): Promise<Doctor> {
    return this.request('/api/clinic/doctors', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateDoctor(doctorId: string, data: { name?: string; specialty?: string; isActive?: boolean; avgConsultationMins?: number }): Promise<Doctor> {
    return this.request(`/api/clinic/doctors/${doctorId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteDoctor(doctorId: string): Promise<{ message: string }> {
    return this.request(`/api/clinic/doctors/${doctorId}`, {
      method: 'DELETE',
    });
  }

  // Subscription endpoints
  async getSubscription(): Promise<{
    status: string;
    plan: string | null;
    trialEndsAt: string | null;
    subscriptionEndsAt: string | null;
    daysRemaining: number | null;
    canUseApp: boolean;
  }> {
    return this.request('/api/subscription');
  }

  async getPricing(): Promise<{
    subscription: {
      monthly: { amount: number; amountDisplay: number; currency: string; description: string };
      yearly: { amount: number; amountDisplay: number; currency: string; description: string; savings: number };
    };
    trialDays: number;
  }> {
    return this.request('/api/subscription/pricing');
  }

  async createSubscriptionCheckout(plan: 'MONTHLY' | 'YEARLY'): Promise<{ payUrl: string; paymentRef: string }> {
    return this.request('/api/subscription/checkout', {
      method: 'POST',
      body: JSON.stringify({ plan }),
    });
  }

  async getOnboardingStatus(): Promise<{ step: number; completed: boolean; totalSteps: number }> {
    return this.request('/api/subscription/onboarding');
  }

  async updateOnboarding(step: number, completed?: boolean): Promise<{ message: string; step: number; completed: boolean }> {
    return this.request('/api/subscription/onboarding', {
      method: 'POST',
      body: JSON.stringify({ step, completed }),
    });
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

  // Reorder queue (manual override by receptionist)
  async reorderQueue(entryId: string, newPosition: number): Promise<{ message: string }> {
    return this.request('/api/queue/reorder', {
      method: 'POST',
      body: JSON.stringify({ entryId, newPosition }),
    });
  }

  async resetStats(): Promise<{ message: string; deletedCount: number }> {
    return this.request('/api/queue/reset-stats', {
      method: 'POST',
    });
  }

  // Patient endpoints (public)
  async getPatientStatus(entryId: string): Promise<PatientStatusResponse> {
    return this.request<PatientStatusResponse>(`/api/queue/patient/${entryId}`);
  }

  // Patient leave queue (public)
  async leaveQueue(entryId: string): Promise<{ message: string; status: string }> {
    return this.request(`/api/queue/patient/${entryId}/leave`, {
      method: 'POST',
    });
  }

  async checkIn(clinicId: string, data: { patientPhone: string; patientName?: string }): Promise<QueueEntry & { clinicName: string; estimatedWaitMins: number }> {
    return this.request(`/api/queue/checkin/${clinicId}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Public clinic info (for check-in page)
  async getClinicInfo(clinicId: string): Promise<{ name: string; waitingCount: number; avgConsultationMins: number; isDoctorPresent: boolean }> {
    return this.request(`/api/clinic/${clinicId}/info`);
  }

  // Clinic endpoints
  async getClinic(): Promise<Clinic> {
    return this.request<Clinic>('/api/clinic');
  }

  async getQRCode(): Promise<{ url: string; qrCode: string; clinicName: string }> {
    return this.request('/api/clinic/qr');
  }

  async updateClinic(data: {
    name?: string;
    doctorName?: string;
    doctorGender?: 'M' | 'F';
    phone?: string;
    address?: string;
    language?: 'fr' | 'ar';
    avgConsultationMins?: number;
    notifyAtPosition?: number;
    specialty?: string;
    funFactsEnabled?: boolean;
  }): Promise<Clinic> {
    return this.request('/api/clinic', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<{ message: string }> {
    return this.request('/api/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  }

  // Update doctor presence
  async setDoctorPresence(isDoctorPresent: boolean): Promise<{ id: string; isDoctorPresent: boolean }> {
    return this.request('/api/clinic/doctor-presence', {
      method: 'POST',
      body: JSON.stringify({ isDoctorPresent }),
    });
  }

  // Set or clear clinic announcement
  async setAnnouncement(announcement: string | null): Promise<{ id: string; announcement: string | null; announcementAt: string | null }> {
    return this.request('/api/clinic/announcement', {
      method: 'POST',
      body: JSON.stringify({ announcement }),
    });
  }

  // Admin endpoints
  async getAdminMetrics(): Promise<AdminMetrics> {
    return this.request('/api/admin/metrics');
  }

  async getAdminMetricsWithTrends(period: 'today' | '7d' | '30d' | 'all' = '30d'): Promise<AdminMetricsWithTrends> {
    return this.request(`/api/admin/metrics/trends?period=${period}`);
  }

  async getAdminClinics(): Promise<ClinicHealth[]> {
    return this.request('/api/admin/clinics');
  }

  async getAdminClinicDetail(clinicId: string): Promise<ClinicDetail> {
    return this.request(`/api/admin/clinics/${clinicId}`);
  }

  async createClinic(data: CreateClinicData): Promise<{ id: string; name: string; email: string }> {
    return this.request('/api/admin/clinics', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateClinicStatus(clinicId: string, isActive: boolean): Promise<{ id: string; name: string; isActive: boolean }> {
    return this.request(`/api/admin/clinics/${clinicId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ isActive }),
    });
  }

  async resetClinicPassword(clinicId: string, password: string): Promise<{ id: string; name: string }> {
    return this.request(`/api/admin/clinics/${clinicId}/reset-password`, {
      method: 'POST',
      body: JSON.stringify({ password }),
    });
  }

  async deleteClinic(clinicId: string): Promise<{ id: string; name: string }> {
    return this.request(`/api/admin/clinics/${clinicId}`, {
      method: 'DELETE',
    });
  }

  async impersonateClinic(clinicId: string): Promise<{
    token: string;
    clinic: Clinic;
    isImpersonation: boolean;
  }> {
    return this.request(`/api/admin/clinics/${clinicId}/impersonate`, {
      method: 'POST',
    });
  }

  async recordPayment(clinicId: string, data: RecordPaymentData): Promise<unknown> {
    return this.request(`/api/admin/clinics/${clinicId}/payments`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async initKonnectPayment(clinicId: string, month: string): Promise<{ payUrl: string; paymentRef: string }> {
    return this.request(`/api/admin/clinics/${clinicId}/payments/konnect`, {
      method: 'POST',
      body: JSON.stringify({ month }),
    });
  }

  // Admin V2 endpoints
  async getSubscriptionMetrics(): Promise<SubscriptionMetrics> {
    return this.request('/api/admin/subscription-metrics');
  }

  async getOnboardingFunnel(): Promise<OnboardingFunnel> {
    return this.request('/api/admin/onboarding-funnel');
  }

  async getActivityFeed(limit = 20): Promise<ActivityItem[]> {
    return this.request(`/api/admin/activity-feed?limit=${limit}`);
  }

  async getFinancialAnalytics(): Promise<FinancialAnalytics> {
    return this.request('/api/admin/financial');
  }

  async getFeatureAdoption(): Promise<FeatureAdoption> {
    return this.request('/api/admin/feature-adoption');
  }

  async getPlatformHealth(): Promise<PlatformHealth> {
    return this.request('/api/admin/platform-health');
  }

  async extendClinicTrial(clinicId: string, days: number): Promise<{ id: string; name: string; trialEndsAt: string }> {
    return this.request(`/api/admin/clinics/${clinicId}/trial`, {
      method: 'PATCH',
      body: JSON.stringify({ days }),
    });
  }

  async upgradeClinicSubscription(clinicId: string, plan: 'MONTHLY' | 'YEARLY'): Promise<{ id: string; name: string }> {
    return this.request(`/api/admin/clinics/${clinicId}/upgrade`, {
      method: 'PATCH',
      body: JSON.stringify({ plan }),
    });
  }

  // Daily recap
  async getDailyRecap(): Promise<DailyRecapResponse> {
    return this.request('/api/clinic/daily-recap');
  }

  async updateAdminClinicInfo(clinicId: string, data: ClinicEditableFields): Promise<{ id: string; name: string }> {
    return this.request(`/api/admin/clinics/${clinicId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }
}

export const api = new ApiClient();
