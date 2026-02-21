import { useEffect, useState, useCallback, useRef } from 'react';

/**
 * Toast action types for different queue operations
 * Each type has its own color scheme and icon
 */
export type ToastType =
  | 'success'    // Generic success (green)
  | 'error'      // Error state (red)
  | 'call'       // Patient called (green)
  | 'moveUp'     // Patient moved up (blue)
  | 'moveDown'   // Patient moved down (purple)
  | 'emergency'  // Emergency priority (orange)
  | 'remove';    // Patient removed (red)

interface ToastProps {
  message: string;
  type?: ToastType;
  duration?: number;
  isVisible: boolean;
  onClose: () => void;
}

const TYPE_CONFIG: Record<ToastType, { color: string; icon: string; label: string }> = {
  success: { color: '#0F7B6C', icon: 'check_circle', label: 'Succès' },
  error:   { color: '#D94F3B', icon: 'error', label: 'Erreur' },
  call:    { color: '#0F7B6C', icon: 'directions_walk', label: 'Au suivant' },
  moveUp:  { color: '#3B7DD9', icon: 'arrow_upward', label: 'Déplacé' },
  moveDown:{ color: '#7C3AED', icon: 'arrow_downward', label: 'Déplacé' },
  emergency:{ color: '#D4920B', icon: 'e911_emergency', label: 'Urgence' },
  remove:  { color: '#D94F3B', icon: 'person_remove', label: 'Retiré' },
};

// SVG circle geometry
const CIRCLE_R = 18;
const CIRCLE_CIRCUMFERENCE = 2 * Math.PI * CIRCLE_R;

/**
 * Floating Pill Toast (Option B)
 * Dark pill with colored icon, circular progress countdown, spring-up animation
 */
export function Toast({ message, type = 'success', duration = 1000, isVisible, onClose }: ToastProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [progress, setProgress] = useState(1); // 1 = full, 0 = empty
  const rafRef = useRef<number>(0);
  const startRef = useRef<number>(0);

  useEffect(() => {
    if (isVisible) {
      setIsAnimating(true);
      setProgress(1);
      startRef.current = performance.now();

      // Animate progress with requestAnimationFrame for smooth circle
      const animate = (now: number) => {
        const elapsed = now - startRef.current;
        const remaining = Math.max(0, 1 - elapsed / duration);
        setProgress(remaining);
        if (remaining > 0) {
          rafRef.current = requestAnimationFrame(animate);
        }
      };
      rafRef.current = requestAnimationFrame(animate);

      const timer = setTimeout(() => {
        setIsAnimating(false);
        setTimeout(onClose, 300);
      }, duration);

      return () => {
        clearTimeout(timer);
        cancelAnimationFrame(rafRef.current);
      };
    }
  }, [isVisible, duration, onClose]);

  if (!isVisible && !isAnimating) return null;

  const { color, icon, label } = TYPE_CONFIG[type];
  const showToast = isAnimating && isVisible;
  const dashOffset = CIRCLE_CIRCUMFERENCE * (1 - progress);

  return (
    <>
      <style>{`
        @keyframes toastPillIn {
          from { opacity: 0; transform: translateX(-50%) translateY(24px) scale(0.92); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
        }
        @keyframes toastPillOut {
          from { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
          to   { opacity: 0; transform: translateX(-50%) translateY(16px) scale(0.92); }
        }
      `}</style>

      <div
        className="fixed z-[100] pointer-events-none"
        style={{
          bottom: 88,
          left: '50%',
          transform: 'translateX(-50%)',
          animation: showToast
            ? 'toastPillIn 0.4s cubic-bezier(0.22, 1, 0.36, 1) both'
            : 'toastPillOut 0.3s ease-in forwards',
        }}
      >
        <div
          className="pointer-events-auto flex items-center gap-3 whitespace-nowrap"
          style={{
            background: '#1A1A1A',
            color: '#fff',
            padding: '10px 20px 10px 12px',
            borderRadius: 28,
            boxShadow: '0 8px 32px rgba(0,0,0,0.22)',
          }}
        >
          {/* Icon with circular progress ring */}
          <div className="relative flex-shrink-0" style={{ width: 40, height: 40 }}>
            {/* Colored circle background */}
            <div
              className="absolute flex items-center justify-center"
              style={{
                width: 32,
                height: 32,
                top: 4,
                left: 4,
                borderRadius: '50%',
                background: color,
              }}
            >
              <span
                className="material-symbols-rounded text-white"
                style={{ fontSize: 18, fontVariationSettings: "'FILL' 1" }}
              >
                {icon}
              </span>
            </div>
            {/* SVG progress ring */}
            <svg
              width={40}
              height={40}
              className="absolute inset-0"
              style={{ transform: 'rotate(-90deg)' }}
            >
              {/* Track (dim) */}
              <circle
                cx={20}
                cy={20}
                r={CIRCLE_R}
                fill="none"
                stroke="rgba(255,255,255,0.1)"
                strokeWidth={2.5}
              />
              {/* Progress (colored) */}
              <circle
                cx={20}
                cy={20}
                r={CIRCLE_R}
                fill="none"
                stroke={color}
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeDasharray={CIRCLE_CIRCUMFERENCE}
                strokeDashoffset={dashOffset}
              />
            </svg>
          </div>

          {/* Text */}
          <div className="flex flex-col min-w-0">
            <span
              className="font-medium leading-none"
              style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}
            >
              {label}
            </span>
            <span
              className="font-semibold leading-snug truncate"
              style={{ fontSize: 14, letterSpacing: -0.2 }}
            >
              {message}
            </span>
          </div>
        </div>
      </div>
    </>
  );
}

// ============================================
// Toast Hook for easy state management
// ============================================

interface ToastState {
  isVisible: boolean;
  message: string;
  type: ToastType;
}

export function useToast() {
  const [toast, setToast] = useState<ToastState>({
    isVisible: false,
    message: '',
    type: 'success',
  });

  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    setToast({ isVisible: true, message, type });
  }, []);

  const hideToast = useCallback(() => {
    setToast((prev) => ({ ...prev, isVisible: false }));
  }, []);

  return {
    toast,
    showToast,
    hideToast,
  };
}
