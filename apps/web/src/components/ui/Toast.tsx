import { useEffect, useState, useCallback } from 'react';

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

/**
 * Floating Badge Toast Component
 * Colorful gradient badge with bounce animation
 * Color changes based on action type
 */
export function Toast({ message, type = 'success', duration = 3000, isVisible, onClose }: ToastProps) {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setIsAnimating(true);
      const timer = setTimeout(() => {
        setIsAnimating(false);
        setTimeout(onClose, 300);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  if (!isVisible && !isAnimating) return null;

  // Color schemes for each action type
  // Appeler (green), Monter (blue), Descendre (purple), Urgence (orange), Retirer (red)
  const typeStyles: Record<ToastType, { gradient: string; shadow: string; icon: string }> = {
    success: {
      gradient: 'from-emerald-500 to-green-500',
      shadow: 'shadow-emerald-500/40',
      icon: 'check_circle',
    },
    error: {
      gradient: 'from-red-500 to-rose-500',
      shadow: 'shadow-red-500/40',
      icon: 'error',
    },
    call: {
      // Green for calling patient
      gradient: 'from-emerald-500 to-green-600',
      shadow: 'shadow-emerald-500/40',
      icon: 'directions_walk',
    },
    moveUp: {
      // Blue for moving up
      gradient: 'from-blue-500 to-indigo-500',
      shadow: 'shadow-blue-500/40',
      icon: 'arrow_upward',
    },
    moveDown: {
      // Purple for moving down
      gradient: 'from-purple-500 to-violet-500',
      shadow: 'shadow-purple-500/40',
      icon: 'arrow_downward',
    },
    emergency: {
      // Orange for emergency
      gradient: 'from-orange-500 to-amber-500',
      shadow: 'shadow-orange-500/40',
      icon: 'e911_emergency',
    },
    remove: {
      // Red for removing patient
      gradient: 'from-red-500 to-rose-600',
      shadow: 'shadow-red-500/40',
      icon: 'person_remove',
    },
  };

  const { gradient, shadow, icon } = typeStyles[type];
  const showToast = isAnimating && isVisible;

  return (
    <>
      {/* Global styles for animation - Zoom In from Large (300%) */}
      <style>{`
        @keyframes toastZoomIn {
          0% {
            opacity: 0.5;
            transform: scale(3);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }
        @keyframes toastZoomOut {
          0% {
            opacity: 1;
            transform: scale(1);
          }
          100% {
            opacity: 0;
            transform: scale(2);
          }
        }
      `}</style>

      {/* Fixed container for centering */}
      <div
        className="fixed bottom-6 left-0 right-0 z-[100] flex justify-center pointer-events-none"
      >
        <div
          className={`
            bg-gradient-to-r ${gradient}
            text-white px-5 py-3 rounded-xl
            flex items-center gap-3
            shadow-lg ${shadow}
            pointer-events-auto
          `}
          style={{
            animation: showToast
              ? 'toastZoomIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards'
              : 'toastZoomOut 0.3s ease-in forwards',
          }}
        >
          <span
            className="material-symbols-outlined text-[22px]"
            style={{ fontVariationSettings: "'FILL' 1, 'wght' 500" }}
          >
            {icon}
          </span>
          <span className="font-medium text-sm sm:text-[15px] whitespace-nowrap">{message}</span>
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
