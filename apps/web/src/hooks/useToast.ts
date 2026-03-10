import { useCallback } from 'react';

type ToastVariant = 'teal' | 'green' | 'orange' | 'red';

const TOAST_STYLES: Record<ToastVariant, { bg: string; text: string; border: string }> = {
  teal:   { bg: '#EBF2EE', text: '#356B58', border: '#356B5833' },
  green:  { bg: '#E8F5EE', text: '#2D7A5A', border: '#2D7A5A33' },
  orange: { bg: '#FDF1E8', text: '#E07B39', border: '#E07B3933' },
  red:    { bg: '#FDEEEC', text: '#C0392B', border: '#C0392B33' },
};

export function useToast() {
  const show = useCallback((message: string, variant: ToastVariant = 'teal') => {
    const styles = TOAST_STYLES[variant];
    const el = document.createElement('div');
    el.textContent = message;
    Object.assign(el.style, {
      position: 'fixed',
      bottom: '90px',
      left: '50%',
      transform: 'translateX(-50%) translateY(8px)',
      background: styles.bg,
      color: styles.text,
      border: `1.5px solid ${styles.border}`,
      borderRadius: '9999px',
      padding: '8px 20px',
      fontSize: '13.5px',
      fontWeight: '500',
      fontFamily: 'DM Sans, system-ui, sans-serif',
      zIndex: '9999',
      opacity: '0',
      transition: 'opacity 0.2s ease, transform 0.2s ease',
      pointerEvents: 'none',
      whiteSpace: 'nowrap',
      boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
    });
    document.body.appendChild(el);

    requestAnimationFrame(() => {
      el.style.opacity = '1';
      el.style.transform = 'translateX(-50%) translateY(0)';
    });

    setTimeout(() => {
      el.style.opacity = '0';
      el.style.transform = 'translateX(-50%) translateY(8px)';
      setTimeout(() => el.remove(), 200);
    }, 2200);
  }, []);

  return { show };
}
