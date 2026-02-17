import { useEffect, useRef } from 'react';

interface PSProgressToastProps {
  message: string | null;
  visible: boolean;
  onHide: () => void;
}

export default function PSProgressToast({ message, visible, onHide }: PSProgressToastProps) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (visible) {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        onHide();
      }, 2500);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [visible, onHide]);

  return (
    <div className={`ps-toast ${visible ? 'visible' : ''}`} role="status" aria-live="polite">
      <span className="material-symbols-rounded">arrow_upward</span>
      {message}
    </div>
  );
}
