interface SuggestionPlaceholderProps {
  icon?: string | null
  tagIcon?: string | null
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function SuggestionPlaceholder({ icon, tagIcon, size = 'md', className = '' }: SuggestionPlaceholderProps) {
  const sizeClasses = {
    sm: 'text-3xl',
    md: 'text-4xl',
    lg: 'text-6xl',
  }

  const displayIcon = icon || tagIcon || '💡'

  return (
    <div className={`bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 flex items-center justify-center ${className}`}>
      <span className={sizeClasses[size]}>
        {displayIcon}
      </span>
    </div>
  )
}
