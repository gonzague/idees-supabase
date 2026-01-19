'use client'

import { useState, useEffect, useTransition } from 'react'
import Link from 'next/link'
import { searchRelatedContent, type RelatedContentResult } from '@/lib/actions/external-search'
import { PLATFORM_ICONS } from '@/lib/constants'
import { t } from '@/lib/i18n'

interface RelatedContentProps {
  query: string
}

export function RelatedContent({ query }: RelatedContentProps) {
  const [results, setResults] = useState<RelatedContentResult | null>(null)
  const [isPending, startTransition] = useTransition()
  const i18n = t()

  useEffect(() => {
    if (query.length < 3) {
      setResults(null)
      return
    }

    const timeoutId = setTimeout(() => {
      startTransition(async () => {
        const data = await searchRelatedContent(query)
        setResults(data)
      })
    }, 400)

    return () => clearTimeout(timeoutId)
  }, [query])

  const hasResults = results && (results.suggestions.length > 0 || results.external.length > 0)

  if (!hasResults && !isPending) {
    return null
  }

  return (
    <div className="mt-3 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
      <h4 className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-3 flex items-center gap-2">
        <span>💡</span>
        {i18n.form.relatedContent}
      </h4>

      {isPending && (
        <p className="text-sm text-amber-600 dark:text-amber-400">{i18n.form.searching}</p>
      )}

      {results && results.suggestions.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-medium text-amber-700 dark:text-amber-300 mb-2">
            {i18n.form.existingSuggestions}
          </p>
          <ul className="space-y-2">
            {results.suggestions.map(suggestion => (
              <li key={suggestion.id}>
                <Link
                  href={`/suggestions/${suggestion.id}`}
                  className="flex items-center gap-2 text-sm text-amber-900 dark:text-amber-100 hover:underline"
                >
                  <span className={suggestion.status === 'done' ? 'text-green-600' : 'text-gray-400'}>
                    {suggestion.status === 'done' ? '✓' : '○'}
                  </span>
                  <span className="flex-1 line-clamp-1">{suggestion.title}</span>
                  <span className="text-xs text-amber-600 dark:text-amber-400">
                    {suggestion.voteCount} {i18n.suggestion.votes}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {results && results.external.length > 0 && (
        <div>
          <p className="text-xs font-medium text-amber-700 dark:text-amber-300 mb-2">
            {i18n.form.existingContent}
          </p>
          <ul className="space-y-2">
            {results.external.map(item => (
              <li key={item.id}>
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-amber-900 dark:text-amber-100 hover:underline"
                >
                  <span>{PLATFORM_ICONS[item.platform] || '🔗'}</span>
                  <span className="flex-1 line-clamp-1">{item.title}</span>
                  <span className="text-xs">↗</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="mt-3 text-xs text-amber-600 dark:text-amber-400">
        {i18n.form.relatedContentHint}
      </p>
    </div>
  )
}
