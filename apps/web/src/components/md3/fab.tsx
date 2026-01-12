import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const md3FABVariants = cva(
  'inline-flex items-center justify-center gap-3 font-medium transition-all duration-200 ease-out focus-visible:outline-none disabled:pointer-events-none disabled:opacity-40',
  {
    variants: {
      variant: {
        surface:
          'bg-gray-100 text-primary-600 shadow-lg hover:shadow-xl active:shadow-lg',
        primary:
          'bg-primary-100 text-primary-700 shadow-lg hover:shadow-xl active:shadow-lg',
        secondary:
          'bg-secondary-100 text-secondary-700 shadow-lg hover:shadow-xl active:shadow-lg',
        tertiary:
          'bg-accent-100 text-accent-700 shadow-lg hover:shadow-xl active:shadow-lg',
      },
      size: {
        small: 'h-10 w-10 rounded-xl [&_.material-symbols-outlined]:text-2xl',
        default: 'h-14 w-14 rounded-2xl [&_.material-symbols-outlined]:text-2xl',
        large: 'h-24 w-24 rounded-[28px] [&_.material-symbols-outlined]:text-4xl',
        extended: 'h-14 px-4 rounded-2xl [&_.material-symbols-outlined]:text-2xl',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'default',
    },
  }
)

export interface MD3FABProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof md3FABVariants> {
  icon: React.ReactNode
  label?: string
  lowered?: boolean
}

const MD3FAB = React.forwardRef<HTMLButtonElement, MD3FABProps>(
  ({ className, variant, size, icon, label, lowered, ...props }, ref) => {
    const isExtended = size === 'extended' || (label && size !== 'small')

    return (
      <button
        className={cn(
          md3FABVariants({
            variant,
            size: isExtended ? 'extended' : size
          }),
          lowered && 'shadow-md hover:shadow-lg',
          className
        )}
        ref={ref}
        {...props}
      >
        <span className="flex-shrink-0">{icon}</span>
        {label && <span className="font-medium text-sm">{label}</span>}
      </button>
    )
  }
)
MD3FAB.displayName = 'MD3FAB'

export { MD3FAB, md3FABVariants }
