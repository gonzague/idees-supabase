'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { searchContent } from '@/lib/actions/external-search'
import type { ExternalSearchResult } from '@/lib/external-search/types'
import { PLATFORM_ICONS } from '@/lib/constants'
import { t } from '@/lib/i18n'

interface ContentSearchProps {
  initialQuery?: string
  onSelect: (result: ExternalSearchResult) => void
}

export function ContentSearch({ initialQuery = '', onSelect }: ContentSearchProps) {
  const [query, setQuery] = useState(initialQuery)
  const [results, setResults] = useState<ExternalSearchResult[]>([])
  const [isPending, startTransition] = useTransition()
  const [hasSearched, setHasSearched] = useState(false)
  const i18n = t()

  const handleSearch = () => {
    if (!query.trim()) return
    
    startTransition(async () => {
      const searchResults = await searchContent(query)
      setResults(searchResults.all)
      setHasSearched(true)
    })
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSearch()
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={i18n.admin.contentSearch.placeholder}
          className="flex-1"
        />
        <Button 
          type="button" 
          onClick={handleSearch} 
          disabled={isPending || !query.trim()}
          variant="outline"
        >
          {isPending ? i18n.admin.contentSearch.searching : i18n.admin.contentSearch.search}
        </Button>
      </div>

      {hasSearched && results.length === 0 && (
        <p className="text-sm text-gray-500 italic">{i18n.admin.contentSearch.noResults}</p>
      )}

      {results.length > 0 && (
        <div className="max-h-64 overflow-y-auto space-y-2 border rounded-md p-2">
          {results.map((result) => (
            <button
              key={`${result.platform}-${result.id}`}
              type="button"
              onClick={() => onSelect(result)}
              className="w-full flex items-start gap-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md text-left transition-colors"
            >
              {result.thumbnailUrl ? (
                <img 
                  src={result.thumbnailUrl} 
                  alt="" 
                  className="w-16 h-12 object-cover rounded flex-shrink-0"
                />
              ) : (
                <div className="w-16 h-12 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center flex-shrink-0">
                  <span className="text-xl">{PLATFORM_ICONS[result.platform] || '🔗'}</span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <span className="text-sm">{PLATFORM_ICONS[result.platform] || '🔗'}</span>
                  <span className="text-sm font-medium line-clamp-1">{result.title}</span>
                </div>
                <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">
                  {result.description}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(result.publishedAt).toLocaleDateString('fr-FR')}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
