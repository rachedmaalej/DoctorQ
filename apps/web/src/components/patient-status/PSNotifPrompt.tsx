import type { Phase } from './utils';

interface PSNotifPromptProps {
  phase: Phase;
  isEnabled: boolean;
  onClick: () => void;
}

export default function PSNotifPrompt({ phase, isEnabled, onClick }: PSNotifPromptProps) {
  // In Ready phase with notifications already enabled, show confirmed state
  if (phase === 'ready' && isEnabled) {
    return (
      <div className="ps-notif-prompt confirmed ps-fade-up-d4" onClick={onClick}>
        <div className="ps-notif-icon">
          <span className="material-symbols-rounded">vibration</span>
        </div>
        <div className="ps-notif-text">
          Notifications activées — on vous préviendra
        </div>
        <div className="ps-notif-arrow">
          <span className="material-symbols-rounded">check_circle</span>
        </div>
      </div>
    );
  }

  // Default: indigo opt-in prompt (Relax phase)
  return (
    <div className="ps-notif-prompt ps-fade-up-d4" onClick={onClick}>
      <div className="ps-notif-icon">
        <span
          className="material-symbols-rounded"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          notifications_active
        </span>
      </div>
      <div className="ps-notif-text">
        Activez les notifications pour ne pas rater votre tour
      </div>
      <div className="ps-notif-arrow">
        <span className="material-symbols-rounded">chevron_right</span>
      </div>
    </div>
  );
}
