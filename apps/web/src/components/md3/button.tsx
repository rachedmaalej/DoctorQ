import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const md3ButtonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-all duration-200 ease-out focus-visible:outline-none disabled:pointer-events-none disabled:opacity-40',
  {
    variants: {
      variant: {
        filled:
          'bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-800',
        outlined:
          'border border-gray-300 text-primary-600 bg-transparent hover:bg-primary-50 active:bg-primary-100',
        text: 'text-primary-600 bg-transparent hover:bg-primary-50 active:bg-primary-100',
        elevated:
          'bg-white text-primary-600 shadow-md hover:shadow-lg active:shadow-md',
        tonal:
          'bg-primary-100 text-primary-700 hover:bg-primary-200 active:bg-primary-300',
      },
      size: {
        default: 'h-10 px-6 py-2.5 rounded-full text-sm',
        sm: 'h-9 px-4 py-2 rounded-full text-sm',
        lg: 'h-12 px-8 py-3 rounded-full text-base',
        icon: 'h-10 w-10 rounded-full',
      },
    },
    defaultVariants: {
      variant: 'filled',
      size: 'default',
    },
  }
)

export interface MD3ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof md3ButtonVariants> {
  icon?: React.ReactNode
  trailingIcon?: React.ReactNode
}

const MD3Button = React.forwardRef<HTMLButtonElement, MD3ButtonProps>(
  (
    { className, variant, size, icon, trailingIcon, children, ...props },
    ref
  ) => {
    return (
      <button
        className={cn(md3ButtonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      >
        {icon && <span className="flex-shrink-0">{icon}</span>}
        {children}
        {trailingIcon && <span className="flex-shrink-0">{trailingIcon}</span>}
      </button>
    )
  }
)
MD3Button.displayName = 'MD3Button'

export { MD3Button, md3ButtonVariants }
