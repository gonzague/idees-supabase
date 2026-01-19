export interface ExternalSearchResult {
  id: string
  title: string
  description: string
  url: string
  thumbnailUrl?: string
  platform: 'youtube' | 'blog'
  publishedAt: string
}

export interface SearchOptions {
  query: string
  limit?: number
}
