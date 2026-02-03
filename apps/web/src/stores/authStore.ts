import { create } from 'zustand';
import type { Clinic, LoginCredentials } from '@/types';
import { api } from '@/lib/api';
import { logger } from '@/lib/logger';

interface AuthState {
  clinic: Clinic | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  isImpersonating: boolean;
  impersonatedClinicName: string | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  startImpersonation: (token: string, clinic: Clinic) => void;
  stopImpersonation: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  clinic: null,
  isAuthenticated: false,
  isLoading: true,  // Start as true to show loading until checkAuth completes
  error: null,
  isImpersonating: false,
  impersonatedClinicName: null,

  login: async (credentials) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.login(credentials);
      set({
        clinic: response.clinic,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error: any) {
      set({
        error: error.message || 'Login failed',
        isLoading: false,
      });
      throw error;
    }
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      await api.logout();
      set({
        clinic: null,
        isAuthenticated: false,
        isLoading: false,
      });
    } catch (error) {
      // Still clear local state even if API call fails
      set({
        clinic: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },

  checkAuth: async () => {
    const token = localStorage.getItem('auth_token');
    logger.log('[AuthStore] checkAuth called, token:', token ? 'present' : 'missing');
    if (!token) {
      logger.log('[AuthStore] No token, setting isAuthenticated: false');
      set({ isAuthenticated: false, isLoading: false });
      return;
    }

    // Check if we're in impersonation mode
    const isImpersonating = localStorage.getItem('is_impersonating') === 'true';
    const impersonatedClinicName = localStorage.getItem('impersonated_clinic_name');

    set({ isLoading: true });
    try {
      const clinic = await api.getMe();
      logger.log('[AuthStore] getMe succeeded, clinic:', clinic);
      set({
        clinic,
        isAuthenticated: true,
        isLoading: false,
        isImpersonating,
        impersonatedClinicName,
      });
    } catch (error) {
      logger.error('[AuthStore] checkAuth error:', error);
      // Token is invalid, clear it
      api.clearToken();
      localStorage.removeItem('is_impersonating');
      localStorage.removeItem('impersonated_clinic_name');
      localStorage.removeItem('admin_token');
      set({
        clinic: null,
        isAuthenticated: false,
        isLoading: false,
        isImpersonating: false,
        impersonatedClinicName: null,
      });
    }
  },

  startImpersonation: (token: string, clinic: Clinic) => {
    // Save current admin token
    const currentToken = localStorage.getItem('auth_token');
    if (currentToken) {
      localStorage.setItem('admin_token', currentToken);
    }

    // Set impersonation token and state
    api.setToken(token);
    localStorage.setItem('is_impersonating', 'true');
    localStorage.setItem('impersonated_clinic_name', clinic.name);

    set({
      clinic,
      isAuthenticated: true,
      isImpersonating: true,
      impersonatedClinicName: clinic.name,
    });
  },

  stopImpersonation: () => {
    // Restore admin token
    const adminToken = localStorage.getItem('admin_token');
    if (adminToken) {
      api.setToken(adminToken);
    }

    // Clear impersonation state
    localStorage.removeItem('is_impersonating');
    localStorage.removeItem('impersonated_clinic_name');
    localStorage.removeItem('admin_token');

    set({
      isImpersonating: false,
      impersonatedClinicName: null,
    });
  },
}));
