import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { getUser } from '@/lib/actions/auth'
import { AccountForm } from '@/components/account/account-form'
import { t } from '@/lib/i18n'

export const metadata: Metadata = {
  title: t().account.title,
  robots: { index: false, follow: false },
}

export default async function AccountPage() {
  const user = await getUser()

  if (!user) {
    redirect('/?error=auth_required')
  }

  const tr = t()

  return (
    <div className="max-w-xl mx-auto py-8">
      <Link 
        href="/" 
        className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 mb-4 inline-block"
      >
        ← Retour aux suggestions
      </Link>
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
        {tr.account.title}
      </h1>
      <AccountForm user={user} />
    </div>
  )
}
