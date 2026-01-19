import * as React from 'react'
import { cn } from '@/lib/utils/cn'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <div className="w-full">
        <input
          className={cn(
            'flex h-10 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2',
            'text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500',
            'focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-500 focus:border-transparent',
            'disabled:cursor-not-allowed disabled:opacity-50',
            error && 'border-red-500 focus:ring-red-400',
            className
          )}
          ref={ref}
          {...props}
        />
        {error && <p className="mt-1 text-sm text-red-500 dark:text-red-400">{error}</p>}
      </div>
    )
  }
)
Input.displayName = 'Input'
