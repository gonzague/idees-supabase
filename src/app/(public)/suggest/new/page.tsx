import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { getUser } from '@/lib/actions/auth'
import { getTags } from '@/lib/actions/suggestions'
import { SuggestionForm } from '@/components/suggestions/suggestion-form'
import { t } from '@/lib/i18n'

export const metadata: Metadata = {
  title: t().form.title,
  description: 'Proposez une nouvelle idée de sujet à la communauté',
}

export default async function NewSuggestionPage() {
  const user = await getUser()

  if (!user) {
    redirect('/?error=auth_required')
  }

  const tags = await getTags()

  return (
    <div className="max-w-xl mx-auto py-8">
      <Link 
        href="/" 
        className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 mb-4 inline-block"
      >
        ← Retour aux suggestions
      </Link>
      <SuggestionForm tags={tags} />
    </div>
  )
}
