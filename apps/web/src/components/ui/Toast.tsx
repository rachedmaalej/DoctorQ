import { useEffect, useState, useCallback } from 'react';

/**
 * Toast action types for different queue operations
 * Each type has its own color scheme and icon
 */
export type ToastType =
  | 'success'    // Generic success (green)
  | 'error'      // Error state (red)
  | 'call'       // Patient called (purple/primary)
  | 'moveUp'     // Patient moved up (emerald)
  | 'moveDown'   // Patient moved down (cyan)
  | 'emergency'  // Emergency priority (red)
  | 'remove';    // Patient removed (gray)

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
      gradient: 'from-violet-500 to-purple-500',
      shadow: 'shadow-violet-500/40',
      icon: 'directions_walk',
    },
    moveUp: {
      gradient: 'from-emerald-500 to-teal-500',
      shadow: 'shadow-emerald-500/40',
      icon: 'arrow_upward',
    },
    moveDown: {
      gradient: 'from-cyan-500 to-sky-500',
      shadow: 'shadow-cyan-500/40',
      icon: 'arrow_downward',
    },
    emergency: {
      gradient: 'from-red-500 to-orange-500',
      shadow: 'shadow-red-500/40',
      icon: 'e911_emergency',
    },
    remove: {
      gradient: 'from-stone-500 to-gray-500',
      shadow: 'shadow-stone-500/40',
      icon: 'person_remove',
    },
  };

  const { gradient, shadow, icon } = typeStyles[type];

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100]">
      <div
        className={`
          bg-gradient-to-r ${gradient}
          text-white px-5 py-3 rounded-xl
          flex items-center gap-3
          shadow-lg ${shadow}
          transition-all duration-300 ease-out
          ${isAnimating && isVisible
            ? 'opacity-100 translate-y-0 scale-100'
            : 'opacity-0 translate-y-4 scale-95'
          }
        `}
        style={{
          animation: isAnimating && isVisible ? 'bounceIn 0.5s cubic-bezier(0.68, -0.3, 0.265, 1.25)' : 'none',
        }}
      >
        <span
          className="material-symbols-outlined text-[22px]"
          style={{ fontVariationSettings: "'FILL' 1, 'wght' 500" }}
        >
          {icon}
        </span>
        <span className="font-medium text-sm sm:text-[15px]">{message}</span>
      </div>

      {/* Bounce animation keyframes */}
      <style>{`
        @keyframes bounceIn {
          0% {
            transform: translateX(-50%) scale(0.3);
            opacity: 0;
          }
          50% {
            transform: translateX(-50%) scale(1.05);
          }
          70% {
            transform: translateX(-50%) scale(0.95);
          }
          100% {
            transform: translateX(-50%) scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
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
