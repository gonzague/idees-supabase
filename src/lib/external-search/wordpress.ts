import { ExternalSearchResult, SearchOptions } from './types'
import { WORDPRESS_API_URL, isWordPressEnabled } from '@/lib/config'

interface WPPost {
  id: number
  date: string
  link: string
  title: { rendered: string }
  excerpt: { rendered: string }
  _embedded?: {
    'wp:featuredmedia'?: Array<{
      source_url: string
    }>
  }
}

export async function searchWordPress(options: SearchOptions): Promise<ExternalSearchResult[]> {
  if (!isWordPressEnabled()) {
    return []
  }

  const { query, limit = 5 } = options
  
  try {
    const params = new URLSearchParams({
      search: query,
      per_page: limit.toString(),
      _embed: 'true'
    })

    const response = await fetch(`${WORDPRESS_API_URL}?${params.toString()}`, {
      next: { revalidate: 3600 }
    })

    if (!response.ok) {
      console.error('WordPress API error:', response.statusText)
      return []
    }

    const posts: WPPost[] = await response.json()

    return posts.map(post => ({
      id: post.id.toString(),
      title: decodeHTMLEntities(post.title.rendered),
      description: stripHtml(post.excerpt.rendered),
      url: post.link,
      thumbnailUrl: post._embedded?.['wp:featuredmedia']?.[0]?.source_url,
      platform: 'blog',
      publishedAt: post.date
    }))
  } catch (error) {
    console.error('WordPress search failed:', error)
    return []
  }
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>?/gm, '').trim()
}

function decodeHTMLEntities(text: string): string {
  return text.replace(/&#(\d+);/g, (match, dec) => String.fromCharCode(dec))
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
}
