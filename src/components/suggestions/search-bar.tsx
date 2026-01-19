'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useTransition, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { searchRelatedContent, type RelatedContentResult } from '@/lib/actions/external-search'
import { getBlogLabel } from '@/lib/config'

interface SearchBarProps {
  initialValue?: string
}

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => clearTimeout(handler)
  }, [value, delay])

  return debouncedValue
}

export function SearchBar({ initialValue = '' }: SearchBarProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [value, setValue] = useState(initialValue)
  const [isOpen, setIsOpen] = useState(false)
  const [results, setResults] = useState<RelatedContentResult | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const debouncedValue = useDebounce(value, 300)

  const allResults = results ? [
    ...results.suggestions.map(s => ({ type: 'suggestion' as const, ...s })),
    ...results.external.map(e => ({ type: 'external' as const, ...e }))
  ] : []

  useEffect(() => {
    const fetchResults = async () => {
      if (debouncedValue.trim().length < 2) {
        setResults(null)
        setIsOpen(false)
        return
      }

      setIsSearching(true)
      try {
        const data = await searchRelatedContent(debouncedValue)
        setResults(data)
        setIsOpen(true)
        setSelectedIndex(-1)
      } catch {
        setResults(null)
      } finally {
        setIsSearching(false)
      }
    }

    fetchResults()
  }, [debouncedValue])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSearch = useCallback((searchValue: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (searchValue.trim()) {
      params.set('search', searchValue.trim())
    } else {
      params.delete('search')
    }
    params.delete('page')
    
    startTransition(() => {
      router.push(`/?${params.toString()}`)
    })
    setIsOpen(false)
  }, [router, searchParams])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleSearch(value)
  }

  const handleClear = () => {
    setValue('')
    setResults(null)
    setIsOpen(false)
    const params = new URLSearchParams(searchParams.toString())
    params.delete('search')
    params.delete('page')
    startTransition(() => {
      router.push(`/?${params.toString()}`)
    })
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || allResults.length === 0) {
      if (e.key === 'Escape') {
        setIsOpen(false)
      }
      return
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => Math.min(prev + 1, allResults.length - 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => Math.max(prev - 1, -1))
        break
      case 'Enter':
        if (selectedIndex >= 0) {
          e.preventDefault()
          const selected = allResults[selectedIndex]
          if (selected.type === 'suggestion') {
            router.push(`/suggestions/${selected.id}`)
            setIsOpen(false)
          } else {
            window.open(selected.url, '_blank')
            setIsOpen(false)
          }
        }
        break
      case 'Escape':
        setIsOpen(false)
        break
    }
  }

  const hasSuggestions = results && results.suggestions.length > 0
  const hasExternal = results && results.external.length > 0

  return (
    <div className="relative">
      <form onSubmit={handleSubmit} className="relative">
        <Input
          ref={inputRef}
          type="search"
          placeholder="Rechercher suggestions et articles..."
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onFocus={() => value.trim().length >= 2 && results && setIsOpen(true)}
          onKeyDown={handleKeyDown}
          className="pr-20"
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1 items-center">
          {isSearching && (
            <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          )}
          {value && !isSearching && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
          <button
            type="submit"
            disabled={isPending}
            className="p-1 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors disabled:opacity-50"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
        </div>
      </form>

      {isOpen && (hasSuggestions || hasExternal) && (
        <div 
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl z-50 overflow-hidden max-h-[70vh] overflow-y-auto"
        >
          {hasSuggestions && (
            <div>
              <div className="px-3 py-2 text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-700">
                💡 Suggestions
              </div>
              {results.suggestions.map((suggestion, index) => (
                <Link
                  key={suggestion.id}
                  href={`/suggestions/${suggestion.id}`}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors ${
                    selectedIndex === index ? 'bg-indigo-50 dark:bg-indigo-900/30' : ''
                  }`}
                >
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/50 dark:to-purple-900/50 flex items-center justify-center">
                    <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">{suggestion.voteCount}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                      {suggestion.title}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                      <span className={suggestion.status === 'done' ? 'text-green-600 dark:text-green-400' : ''}>
                        {suggestion.status === 'done' ? '✓ Terminé' : 'En cours'}
                      </span>
                      {suggestion.hasContent && <span>• 🔗 Contenu</span>}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {hasExternal && (
            <div>
              <div className="px-3 py-2 text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-700 border-t">
                📝 Articles du blog
              </div>
              {results.external.map((item, index) => {
                const resultIndex = (results.suggestions?.length || 0) + index
                return (
                  <a
                    key={item.url}
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors ${
                      selectedIndex === resultIndex ? 'bg-indigo-50 dark:bg-indigo-900/30' : ''
                    }`}
                  >
                    {item.thumbnailUrl ? (
                      <img 
                        src={item.thumbnailUrl} 
                        alt="" 
                        className="w-12 h-8 object-cover rounded flex-shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-8 rounded bg-gradient-to-br from-orange-100 to-amber-100 dark:from-orange-900/50 dark:to-amber-900/50 flex items-center justify-center flex-shrink-0">
                        <span>{item.platform === 'youtube' ? '🎬' : '📝'}</span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                        {item.title}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                        <span className={item.platform === 'youtube' ? 'text-red-500' : 'text-orange-500'}>
                          {item.platform === 'youtube' ? 'YouTube' : getBlogLabel()}
                        </span>
                        {item.publishedAt && (
                          <>
                            <span>•</span>
                            <span>{new Date(item.publishedAt).toLocaleDateString('fr-FR')}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <svg className="w-4 h-4 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                )
              })}
            </div>
          )}

          <div className="px-3 py-2 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
            <button
              onClick={() => handleSearch(value)}
              className="w-full text-left text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"
            >
              🔍 Voir tous les résultats pour "{value}"
            </button>
          </div>
        </div>
      )}

      {isOpen && value.trim().length >= 2 && !isSearching && !hasSuggestions && !hasExternal && (
        <div 
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl z-50 p-4 text-center"
        >
          <p className="text-sm text-slate-500 dark:text-slate-400">Aucun résultat pour "{value}"</p>
        </div>
      )}
    </div>
  )
}
