import * as React from 'react'
import { cn } from '@/lib/utils/cn'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost' | 'destructive'
  size?: 'default' | 'sm' | 'lg' | 'icon'
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    return (
      <button
        className={cn(
          'inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
          'disabled:pointer-events-none disabled:opacity-50',
          'active:scale-[0.98]',
          {
            'bg-indigo-600 text-white shadow-sm hover:bg-indigo-700 hover:shadow-indigo-500/25': variant === 'default',
            'border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800 hover:bg-slate-50 dark:hover:bg-gray-700 hover:text-slate-900 dark:text-gray-100 hover:border-slate-300 dark:hover:border-slate-600': variant === 'outline',
            'hover:bg-slate-100 dark:hover:bg-gray-800 text-slate-600 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white': variant === 'ghost',
            'bg-red-600 text-white hover:bg-red-700 shadow-sm hover:shadow-red-500/25': variant === 'destructive',
          },
          {
            'h-10 px-4 py-2': size === 'default',
            'h-8 px-3 text-sm': size === 'sm',
            'h-12 px-6 text-lg': size === 'lg',
            'h-10 w-10': size === 'icon',
          },
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'
