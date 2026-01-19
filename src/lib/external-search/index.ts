import { ExternalSearchResult, SearchOptions } from './types'
import { searchWordPress } from './wordpress'
import { searchYouTube } from './youtube'

export type { ExternalSearchResult, SearchOptions }

export interface UnifiedSearchResult {
  youtube: ExternalSearchResult[]
  blog: ExternalSearchResult[]
  all: ExternalSearchResult[]
}

export async function searchExternalContent(options: SearchOptions): Promise<UnifiedSearchResult> {
  const [youtubeResults, blogResults] = await Promise.all([
    searchYouTube(options),
    searchWordPress(options)
  ])

  const all = [...youtubeResults, ...blogResults].sort((a, b) => 
    new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  )

  return {
    youtube: youtubeResults,
    blog: blogResults,
    all
  }
}

export { searchWordPress } from './wordpress'
export { searchYouTube } from './youtube'
