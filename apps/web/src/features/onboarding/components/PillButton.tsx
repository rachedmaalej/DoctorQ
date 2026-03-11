import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface PillButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'dark' | 'outlined';
  children: ReactNode;
  loading?: boolean;
}

/**
 * Full-width pill-shaped CTA button.
 * Dark variant: --ob-brand-text bg, white text.
 * Outlined variant: transparent bg, border.
 */
export default function PillButton({
  variant = 'dark',
  children,
  loading,
  disabled,
  className = '',
  ...props
}: PillButtonProps) {
  const isDark = variant === 'dark';
  const isDisabled = disabled || loading;

  return (
    <button
      className={`
        w-full flex items-center justify-center gap-2
        py-[14px] px-6 text-[16px] font-semibold
        transition-all duration-200
        ${isDark
          ? 'text-white hover:opacity-90'
          : 'bg-transparent border-2 hover:bg-gray-50'
        }
        ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer active:scale-[0.98]'}
        ${className}
      `}
      style={{
        fontFamily: 'var(--ob-font)',
        borderRadius: 'var(--ob-btn-radius)',
        backgroundColor: isDark ? 'var(--ob-brand-text)' : 'transparent',
        borderColor: isDark ? 'var(--ob-brand-text)' : 'var(--ob-brand-subtle)',
        ...(isDark ? {} : { color: 'var(--ob-brand-text)' }),
      }}
      disabled={isDisabled}
      {...props}
    >
      {loading ? (
        <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
      ) : null}
      {children}
    </button>
  );
}
