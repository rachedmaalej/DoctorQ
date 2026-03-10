export interface DesktopTopBarProps {
  clinicName: string;
  isDoctorPresent: boolean;
  isQueueOpen: boolean;
  currentLang: 'fr' | 'ar';
  waitingCount: number;
  subscriptionStatus: 'trial' | 'active' | 'expired';
  trialDaysRemaining?: number;
  avgConsultationMins?: number;
  clinic: import('@/types').Clinic | null;
  onClinicUpdated: () => Promise<void>;
  onToggleDoctorPresence: () => void;
  onToggleQueue: () => void;
  onToggleLanguage: () => void;
  onOpenSettingsPane: (pane: string) => void;
  onNavigateToSupport: () => void;
  onLogout: () => void;
  onQrDisplay: () => void;
  onQrCopy: () => void;
  onQrWhatsApp: () => void;
}

export interface DropdownState {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
  triggerRef: React.RefObject<HTMLButtonElement>;
  panelRef: React.RefObject<HTMLDivElement>;
}
