import { useEffect, useRef } from 'react';

interface PSProgressToastProps {
  message: string | null;
  visible: boolean;
  onHide: () => void;
}

function ChevronUpIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <polyline points="18 15 12 9 6 15" />
    </svg>
  );
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
      <ChevronUpIcon />
      {message}
    </div>
  );
}
