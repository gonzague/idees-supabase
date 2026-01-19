import Link from 'next/link'
import { AuthButton } from '@/components/auth/auth-button'
import { ThemeToggle } from '@/components/theme-toggle'
import { SuggestButton } from '@/components/layout/suggest-button'
import { getProfile } from '@/lib/actions/auth'
import { t } from '@/lib/i18n'

export async function Header() {
  const profile = await getProfile()
  const tr = t()

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-gray-900/60">
      <div className="container mx-auto flex h-14 items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
          <div className="size-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
            💡
          </div>
          <span className="text-lg font-bold text-slate-900 dark:text-white">
            {tr.site.name}
          </span>
        </Link>

        <div className="flex items-center gap-2 sm:gap-3">
          <SuggestButton isLoggedIn={!!profile} />
          {profile?.is_admin && (
            <Link 
              href="/admin" 
              className="text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              {tr.nav.admin}
            </Link>
          )}
          <ThemeToggle />
          <AuthButton />
        </div>
      </div>
    </header>
  )
}
