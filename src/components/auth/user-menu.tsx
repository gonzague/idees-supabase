'use client'

import Link from 'next/link'
import { signOut } from '@/lib/actions/auth'
import { User } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { UserAvatar } from './user-avatar'
import { t } from '@/lib/i18n'

interface UserMenuProps {
  profile: User
}

export function UserMenu({ profile }: UserMenuProps) {
  const tr = t()
  
  return (
    <div className="flex items-center gap-2">
      <Link href="/account" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
        <UserAvatar profile={profile} size="sm" />
        <span className="text-sm font-medium hidden sm:inline text-slate-700 dark:text-slate-300">
          @{profile.username}
        </span>
      </Link>
      <form action={signOut}>
        <Button type="submit" variant="ghost" size="sm" className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200">
          {tr.nav.signOut}
        </Button>
      </form>
    </div>
  )
}
