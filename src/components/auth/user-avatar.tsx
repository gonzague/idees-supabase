import Image from 'next/image'
import { User } from '@/lib/types'
import { cn } from '@/lib/utils/cn'

interface UserAvatarProps {
  profile: User
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeClasses = {
  sm: 'w-6 h-6 text-xs',
  md: 'w-8 h-8 text-sm',
  lg: 'w-12 h-12 text-lg',
}

const sizePx = {
  sm: 24,
  md: 32,
  lg: 48,
}

export function UserAvatar({ profile, size = 'md', className }: UserAvatarProps) {
  const avatarUrl = profile.avatar_url || null

  return (
    <div className={cn(sizeClasses[size], 'rounded-full overflow-hidden bg-gradient-to-br from-indigo-100 to-indigo-200 flex-shrink-0 relative', className)}>
      {avatarUrl ? (
        <Image
          src={avatarUrl}
          alt={profile.username || 'Avatar'}
          width={sizePx[size]}
          height={sizePx[size]}
          className="w-full h-full object-cover"
          unoptimized
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-indigo-600 font-semibold">
          {profile.username?.charAt(0).toUpperCase() || '?'}
        </div>
      )}
    </div>
  )
}
