'use server'

import { searchExternalContent, type UnifiedSearchResult, type ExternalSearchResult } from '@/lib/external-search'
import { createServerClient } from '@/lib/supabase/server'
import type { SuggestionLink } from '@/lib/types'

export async function searchContent(query: string): Promise<UnifiedSearchResult> {
  if (!query || query.trim().length < 2) {
    return { youtube: [], blog: [], all: [] }
  }

  return searchExternalContent({ query: query.trim(), limit: 5 })
}

export interface RelatedContentResult {
  suggestions: RelatedSuggestion[]
  external: ExternalSearchResult[]
}

export interface RelatedSuggestion {
  id: string
  title: string
  status: 'open' | 'done'
  voteCount: number
  hasContent: boolean
}

export async function searchRelatedContent(query: string): Promise<RelatedContentResult> {
  if (!query || query.trim().length < 3) {
    return { suggestions: [], external: [] }
  }

  const searchTerm = query.trim()
  
  const [suggestionsResult, externalResult] = await Promise.all([
    searchSuggestions(searchTerm),
    searchExternalContent({ query: searchTerm, limit: 4 })
  ])

  return {
    suggestions: suggestionsResult,
    external: externalResult.all.slice(0, 6)
  }
}

async function searchSuggestions(query: string): Promise<RelatedSuggestion[]> {
  try {
    const supabase = await createServerClient()
    
    const { data: suggestions, error } = await supabase
      .from('suggestions')
      .select('id, title, status')
      .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
      .order('created_at', { ascending: false })
      .limit(5)

    if (error || !suggestions || suggestions.length === 0) {
      return []
    }

    const suggestionIds = suggestions.map(s => s.id)

    const [votesResult, linksResult] = await Promise.all([
      supabase
        .from('votes')
        .select('suggestion_id')
        .in('suggestion_id', suggestionIds),
      supabase
        .from('suggestion_links')
        .select('suggestion_id')
        .in('suggestion_id', suggestionIds)
    ])

    const voteCountMap = new Map<string, number>()
    if (votesResult.data) {
      for (const vote of votesResult.data) {
        voteCountMap.set(vote.suggestion_id, (voteCountMap.get(vote.suggestion_id) || 0) + 1)
      }
    }

    const hasLinksMap = new Set(linksResult.data?.map((l) => l.suggestion_id) || [])

    return suggestions.map(s => ({
      id: s.id,
      title: s.title,
      status: s.status as 'open' | 'done',
      voteCount: voteCountMap.get(s.id) || 0,
      hasContent: hasLinksMap.has(s.id)
    }))
  } catch (error) {
    console.error('Search suggestions error:', error)
    return []
  }
}
