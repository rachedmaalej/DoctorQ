import { create } from 'zustand';
import type { Appointment, CalendarDayView, Doctor, Patient } from '@/types';
import api from '@/lib/api';

interface AppointmentState {
  // Data
  appointments: Appointment[];
  selectedDate: string;
  selectedAppointment: Appointment | null;
  doctors: Doctor[];
  patients: Patient[];
  dayView: CalendarDayView | null;

  // Loading states
  isLoading: boolean;
  error: string | null;

  // Actions
  setSelectedDate: (date: string) => void;
  setSelectedAppointment: (appointment: Appointment | null) => void;
  fetchDayView: (date: string) => Promise<void>;
  fetchDoctors: () => Promise<void>;
  searchPatients: (query: string) => Promise<Patient[]>;
  createAppointment: (data: {
    doctorId: string;
    patientId: string;
    date: string;
    startTime: string;
    duration: number;
    reason?: string;
    notes?: string;
  }) => Promise<Appointment>;
  updateAppointment: (id: string, data: Partial<Appointment>) => Promise<void>;
  cancelAppointment: (id: string, reason?: string) => Promise<void>;
  checkInAppointment: (id: string) => Promise<{ queueEntryId: string; position: number }>;

  // Socket.io updates
  handleAppointmentCreated: (appointment: Appointment) => void;
  handleAppointmentUpdated: (appointment: Appointment) => void;
  handleAppointmentCancelled: (appointmentId: string) => void;
}

// Get today's date in YYYY-MM-DD format
const getTodayString = () => {
  return new Date().toISOString().split('T')[0];
};

export const useAppointmentStore = create<AppointmentState>((set, get) => ({
  // Initial state
  appointments: [],
  selectedDate: getTodayString(),
  selectedAppointment: null,
  doctors: [],
  patients: [],
  dayView: null,
  isLoading: false,
  error: null,

  // Actions
  setSelectedDate: (date) => {
    set({ selectedDate: date });
    get().fetchDayView(date);
  },

  setSelectedAppointment: (appointment) => {
    set({ selectedAppointment: appointment });
  },

  fetchDayView: async (date) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.getCalendarDay(date) as { data: CalendarDayView };
      set({
        dayView: response.data,
        appointments: response.data.appointments,
        isLoading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch appointments',
        isLoading: false,
      });
    }
  },

  fetchDoctors: async () => {
    try {
      const response = await api.getDoctors() as { data: Doctor[] };
      set({ doctors: response.data });
    } catch (error) {
      console.error('Failed to fetch doctors:', error);
    }
  },

  searchPatients: async (query) => {
    try {
      const response = await api.getPatients(query) as { data: Patient[] };
      set({ patients: response.data });
      return response.data;
    } catch (error) {
      console.error('Failed to search patients:', error);
      return [];
    }
  },

  createAppointment: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.createAppointment(data) as { data: Appointment };
      // Refresh day view after creating
      get().fetchDayView(get().selectedDate);
      return response.data;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create appointment';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  updateAppointment: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      await api.updateAppointment(id, data);
      // Refresh day view after updating
      get().fetchDayView(get().selectedDate);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update appointment';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  cancelAppointment: async (id, reason) => {
    set({ isLoading: true, error: null });
    try {
      await api.cancelAppointment(id, reason);
      // Refresh day view after cancelling
      get().fetchDayView(get().selectedDate);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to cancel appointment';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  checkInAppointment: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.checkInAppointment(id) as {
        data: { queueEntryId: string; position: number };
      };
      // Refresh day view after check-in
      get().fetchDayView(get().selectedDate);
      return response.data;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to check in';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  // Socket.io handlers
  handleAppointmentCreated: (appointment) => {
    const { selectedDate, appointments } = get();
    if (appointment.date === selectedDate) {
      set({ appointments: [...appointments, appointment] });
    }
  },

  handleAppointmentUpdated: (appointment) => {
    const { appointments } = get();
    set({
      appointments: appointments.map((a) =>
        a.id === appointment.id ? appointment : a
      ),
    });
  },

  handleAppointmentCancelled: (appointmentId) => {
    const { appointments } = get();
    set({
      appointments: appointments.map((a) =>
        a.id === appointmentId ? { ...a, status: 'CANCELLED' as const } : a
      ),
    });
  },
}));
