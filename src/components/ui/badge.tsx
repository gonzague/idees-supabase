import { cn } from '@/lib/utils/cn'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'success' | 'warning' | 'error'
  className?: string
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        {
          'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200': variant === 'default',
          'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300': variant === 'success',
          'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300': variant === 'warning',
          'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300': variant === 'error',
        },
        className
      )}
    >
      {children}
    </span>
  )
}
