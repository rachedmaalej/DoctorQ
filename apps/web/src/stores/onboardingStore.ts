import { create } from 'zustand';

export type SetupPhase = 'welcome' | 'addPatient' | 'ready';

interface OnboardingState {
  clinicName: string;
  clinicId: string | null;
  qrCodeDataUrl: string | null;
  qrCodeUrl: string | null;
  setupPhase: SetupPhase;
  testPatientId: string | null;
  setClinicInfo: (id: string, name: string) => void;
  setQrCode: (dataUrl: string, url: string) => void;
  setSetupPhase: (phase: SetupPhase) => void;
  setTestPatientId: (id: string | null) => void;
  reset: () => void;
}

export const useOnboardingStore = create<OnboardingState>((set) => ({
  clinicName: '',
  clinicId: null,
  qrCodeDataUrl: null,
  qrCodeUrl: null,
  setupPhase: 'welcome',
  testPatientId: null,

  setClinicInfo: (id: string, name: string) => set({ clinicId: id, clinicName: name }),

  setQrCode: (dataUrl: string, url: string) => set({ qrCodeDataUrl: dataUrl, qrCodeUrl: url }),

  setSetupPhase: (phase: SetupPhase) => set({ setupPhase: phase }),

  setTestPatientId: (id: string | null) => set({ testPatientId: id }),

  reset: () =>
    set({
      clinicName: '',
      clinicId: null,
      qrCodeDataUrl: null,
      qrCodeUrl: null,
      setupPhase: 'welcome',
      testPatientId: null,
    }),
}));
