export function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/shorts\/([^&\n?#]+)/,
  ]
  
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return match[1]
  }
  
  return null
}

export function getYouTubeThumbnail(videoId: string, quality: 'default' | 'medium' | 'high' | 'maxres' = 'high'): string {
  const qualityMap = {
    default: 'default',
    medium: 'mqdefault',
    high: 'hqdefault',
    maxres: 'maxresdefault',
  }
  return `https://img.youtube.com/vi/${videoId}/${qualityMap[quality]}.jpg`
}

export function extractTwitterId(url: string): string | null {
  const match = url.match(/(?:twitter\.com|x\.com)\/\w+\/status\/(\d+)/)
  return match ? match[1] : null
}

export function detectPlatform(url: string): 'youtube' | 'twitter' | 'blog' | 'other' {
  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    return 'youtube'
  }
  if (url.includes('twitter.com') || url.includes('x.com')) {
    return 'twitter'
  }
  const { isBlogUrl } = require('@/lib/config')
  if (isBlogUrl(url)) {
    return 'blog'
  }
  return 'other'
}

export async function fetchThumbnailFromUrl(url: string): Promise<string | null> {
  const platform = detectPlatform(url)
  
  if (platform === 'youtube') {
    const videoId = extractYouTubeId(url)
    if (videoId) {
      return getYouTubeThumbnail(videoId, 'high')
    }
  }
  
  return fetchOGImage(url)
}

async function fetchOGImage(url: string): Promise<string | null> {
  try {
    const { isInternalUrl } = await import('./sanitize')
    if (isInternalUrl(url)) {
      return null
    }
    
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; IdéesBot/1.0)' },
      signal: AbortSignal.timeout(5000)
    })

    if (!response.ok) return null

    const html = await response.text()
    
    const ogImage = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i)
      || html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i)
    
    if (ogImage) return ogImage[1]

    const twitterImage = html.match(/<meta[^>]*name=["']twitter:image["'][^>]*content=["']([^"']+)["']/i)
      || html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']twitter:image["']/i)
    
    return twitterImage ? twitterImage[1] : null
  } catch {
    return null
  }
}

export function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

export interface LinkMetadata {
  thumbnailUrl: string | null
  title: string | null
}

export async function fetchLinkMetadata(url: string): Promise<LinkMetadata> {
  const platform = detectPlatform(url)
  
  if (platform === 'youtube') {
    const videoId = extractYouTubeId(url)
    if (videoId) {
      return {
        thumbnailUrl: getYouTubeThumbnail(videoId, 'high'),
        title: null
      }
    }
  }
  
  return fetchOGMetadata(url)
}

async function fetchOGMetadata(url: string): Promise<LinkMetadata> {
  try {
    const { isInternalUrl } = await import('./sanitize')
    if (isInternalUrl(url)) {
      return { thumbnailUrl: null, title: null }
    }
    
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; IdéesBot/1.0)' },
      signal: AbortSignal.timeout(5000)
    })

    if (!response.ok) return { thumbnailUrl: null, title: null }

    const html = await response.text()
    
    const ogImage = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i)
      || html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i)
    
    const twitterImage = html.match(/<meta[^>]*name=["']twitter:image["'][^>]*content=["']([^"']+)["']/i)
      || html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']twitter:image["']/i)
    
    const ogTitle = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i)
      || html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:title["']/i)
    
    const titleTag = html.match(/<title>([^<]+)<\/title>/i)
    
    const thumbnailUrl = ogImage?.[1] || twitterImage?.[1] || null
    const title = ogTitle?.[1] || titleTag?.[1]?.trim() || null

    return {
      thumbnailUrl,
      title: title ? decodeHTMLEntities(title) : null
    }
  } catch {
    return { thumbnailUrl: null, title: null }
  }
}

function decodeHTMLEntities(text: string): string {
  return text
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(dec))
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&apos;/g, "'")
}
