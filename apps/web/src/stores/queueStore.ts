import { create } from 'zustand';
import type { QueueEntry, QueueStats, AddPatientData, UpdateStatusData } from '@/types';
import { api } from '@/lib/api';

interface QueueState {
  queue: QueueEntry[];
  stats: QueueStats | null;
  isLoading: boolean;
  error: string | null;
  fetchQueue: () => Promise<void>;
  addPatient: (data: AddPatientData) => Promise<void>;
  callNext: () => Promise<void>;
  updatePatientStatus: (id: string, data: UpdateStatusData) => Promise<void>;
  removePatient: (id: string) => Promise<void>;
  reorderPatient: (id: string, newPosition: number) => Promise<void>;
  clearQueue: () => Promise<void>;
  resetStats: () => Promise<void>;
  setQueue: (queue: QueueEntry[], stats: QueueStats) => void;
}

export const useQueueStore = create<QueueState>((set, get) => ({
  queue: [],
  stats: null,
  isLoading: false,
  error: null,

  fetchQueue: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.getQueue();
      set({
        queue: response.queue,
        stats: response.stats,
        isLoading: false,
      });
    } catch (error: any) {
      set({
        error: error.message || 'Failed to fetch queue',
        isLoading: false,
      });
    }
  },

  addPatient: async (data) => {
    set({ isLoading: true, error: null });
    try {
      await api.addPatient(data);
      set({ isLoading: false });
      // Always fetch to ensure sync across devices (Socket.io is backup)
      get().fetchQueue();
    } catch (error: any) {
      set({
        error: error.message || 'Failed to add patient',
        isLoading: false,
      });
      throw error;
    }
  },

  callNext: async () => {
    set({ isLoading: true, error: null });
    try {
      await api.callNext();
      set({ isLoading: false });
      // Always fetch to ensure sync across devices (Socket.io is backup)
      get().fetchQueue();
    } catch (error: any) {
      set({
        error: error.message || 'Failed to call next patient',
        isLoading: false,
      });
      throw error;
    }
  },

  updatePatientStatus: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      await api.updatePatientStatus(id, data);
      set({ isLoading: false });
      // Always fetch to ensure sync across devices (Socket.io is backup)
      get().fetchQueue();
    } catch (error: any) {
      set({
        error: error.message || 'Failed to update patient status',
        isLoading: false,
      });
      throw error;
    }
  },

  removePatient: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await api.removePatient(id);
      set({ isLoading: false });
      // Always fetch to ensure sync across devices (Socket.io is backup)
      get().fetchQueue();
    } catch (error: any) {
      set({
        error: error.message || 'Failed to remove patient',
        isLoading: false,
      });
      throw error;
    }
  },

  reorderPatient: async (id, newPosition) => {
    set({ isLoading: true, error: null });
    try {
      await api.reorderQueue(id, newPosition);
      set({ isLoading: false });
      // Always fetch to ensure sync across devices (Socket.io is backup)
      get().fetchQueue();
    } catch (error: any) {
      set({
        error: error.message || 'Failed to reorder patient',
        isLoading: false,
      });
      throw error;
    }
  },

  clearQueue: async () => {
    set({ isLoading: true, error: null });
    try {
      await api.clearQueue();
      set({ isLoading: false });
      // Always fetch to ensure sync across devices (Socket.io is backup)
      get().fetchQueue();
    } catch (error: any) {
      set({
        error: error.message || 'Failed to clear queue',
        isLoading: false,
      });
      throw error;
    }
  },

  resetStats: async () => {
    set({ isLoading: true, error: null });
    try {
      await api.resetStats();
      set({ isLoading: false });
      // Always fetch to ensure sync across devices (Socket.io is backup)
      get().fetchQueue();
    } catch (error: any) {
      set({
        error: error.message || 'Failed to reset statistics',
        isLoading: false,
      });
      throw error;
    }
  },

  // For real-time updates via Socket.io
  setQueue: (queue, stats) => {
    set({ queue, stats });
  },
}));
