import { ExternalSearchResult, SearchOptions } from './types'

const YOUTUBE_API_URL = 'https://www.googleapis.com/youtube/v3/search'

interface YouTubeSearchItem {
  id: {
    kind: string
    videoId?: string
  }
  snippet: {
    publishedAt: string
    channelId: string
    title: string
    description: string
    thumbnails: {
      default?: { url: string }
      medium?: { url: string }
      high?: { url: string }
    }
  }
}

interface YouTubeSearchResponse {
  items: YouTubeSearchItem[]
  pageInfo: {
    totalResults: number
    resultsPerPage: number
  }
}

export async function searchYouTube(options: SearchOptions): Promise<ExternalSearchResult[]> {
  const { query, limit = 5 } = options
  const apiKey = process.env.YOUTUBE_API_KEY
  const channelId = process.env.YOUTUBE_CHANNEL_ID

  if (!apiKey) {
    console.warn('YOUTUBE_API_KEY not configured, skipping YouTube search')
    return []
  }

  if (!channelId) {
    console.warn('YOUTUBE_CHANNEL_ID not configured, skipping YouTube search')
    return []
  }

  try {
    const params = new URLSearchParams({
      part: 'snippet',
      q: query,
      channelId: channelId,
      type: 'video',
      maxResults: limit.toString(),
      order: 'relevance',
      key: apiKey
    })

    const response = await fetch(`${YOUTUBE_API_URL}?${params.toString()}`, {
      next: { revalidate: 3600 }
    })

    if (!response.ok) {
      console.error('YouTube API error:', response.status, await response.text())
      return []
    }

    const data: YouTubeSearchResponse = await response.json()

    return data.items
      .filter(item => item.id.videoId)
      .map(item => ({
        id: item.id.videoId!,
        title: item.snippet.title,
        description: item.snippet.description,
        url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
        thumbnailUrl: item.snippet.thumbnails.high?.url || 
                      item.snippet.thumbnails.medium?.url || 
                      item.snippet.thumbnails.default?.url,
        platform: 'youtube' as const,
        publishedAt: item.snippet.publishedAt
      }))
  } catch (error) {
    console.error('YouTube search failed:', error)
    return []
  }
}
