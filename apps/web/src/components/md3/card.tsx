import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const md3CardVariants = cva(
  'overflow-hidden transition-all duration-200 ease-out',
  {
    variants: {
      variant: {
        elevated:
          'bg-white shadow-md hover:shadow-lg active:shadow-md',
        filled: 'bg-gray-100 shadow-none',
        outlined: 'border border-gray-300 bg-white shadow-none',
      },
      shape: {
        default: 'rounded-xl',
        large: 'rounded-2xl',
      },
    },
    defaultVariants: {
      variant: 'elevated',
      shape: 'default',
    },
  }
)

export interface MD3CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof md3CardVariants> {
  interactive?: boolean
}

const MD3Card = React.forwardRef<HTMLDivElement, MD3CardProps>(
  ({ className, variant, shape, interactive, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        md3CardVariants({ variant, shape }),
        interactive && 'cursor-pointer hover:bg-gray-50',
        className
      )}
      {...props}
    />
  )
)
MD3Card.displayName = 'MD3Card'

const MD3CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex flex-col space-y-1.5 p-6', className)}
    {...props}
  />
))
MD3CardHeader.displayName = 'MD3CardHeader'

const MD3CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn('text-lg font-semibold text-gray-900', className)}
    {...props}
  />
))
MD3CardTitle.displayName = 'MD3CardTitle'

const MD3CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-sm text-gray-600', className)}
    {...props}
  />
))
MD3CardDescription.displayName = 'MD3CardDescription'

const MD3CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
))
MD3CardContent.displayName = 'MD3CardContent'

const MD3CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex items-center gap-2 p-6 pt-0', className)}
    {...props}
  />
))
MD3CardFooter.displayName = 'MD3CardFooter'

export {
  MD3Card,
  MD3CardHeader,
  MD3CardFooter,
  MD3CardTitle,
  MD3CardDescription,
  MD3CardContent,
  md3CardVariants,
}
