import { create } from 'zustand';

interface OnboardingState {
  clinicName: string;
  clinicId: string | null;
  qrCodeDataUrl: string | null;
  qrCodeUrl: string | null;
  simulationComplete: boolean;
  setClinicInfo: (id: string, name: string) => void;
  setQrCode: (dataUrl: string, url: string) => void;
  setSimulationComplete: () => void;
  reset: () => void;
}

export const useOnboardingStore = create<OnboardingState>((set) => ({
  clinicName: '',
  clinicId: null,
  qrCodeDataUrl: null,
  qrCodeUrl: null,
  simulationComplete: false,

  setClinicInfo: (id: string, name: string) => set({ clinicId: id, clinicName: name }),

  setQrCode: (dataUrl: string, url: string) => set({ qrCodeDataUrl: dataUrl, qrCodeUrl: url }),

  setSimulationComplete: () => set({ simulationComplete: true }),

  reset: () =>
    set({
      clinicName: '',
      clinicId: null,
      qrCodeDataUrl: null,
      qrCodeUrl: null,
      simulationComplete: false,
    }),
}));
