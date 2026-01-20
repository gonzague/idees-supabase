/**
 * Site Configuration
 * 
 * This file centralizes all site-specific settings that can be customized
 * when self-hosting Idees. All values can be overridden via environment variables.
 */

// =============================================================================
// Site Identity
// =============================================================================

/**
 * The public URL of your Idees instance (used for SEO, OG images, emails)
 * @example "https://idees.example.com"
 */
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

/**
 * The display name of your site
 * @example "My Ideas Platform"
 */
export const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME || 'Idees'

/**
 * GitHub repository URL (for "Powered by" link in footer)
 * Defaults to the original Idees repo, can be overridden for forks
 */
export const GITHUB_REPO_URL = process.env.NEXT_PUBLIC_GITHUB_REPO_URL || 'https://github.com/gonzague/idees-supabase'

// =============================================================================
// Social Links (optional - leave empty to hide)
// =============================================================================

/**
 * Twitter/X profile URL
 * @example "https://twitter.com/username"
 */
export const TWITTER_URL = process.env.NEXT_PUBLIC_TWITTER_URL || ''

/**
 * YouTube channel URL
 * @example "https://youtube.com/@channelname"
 */
export const YOUTUBE_URL = process.env.NEXT_PUBLIC_YOUTUBE_URL || ''

/**
 * Blog/Website URL
 * @example "https://blog.example.com"
 */
export const BLOG_URL = process.env.NEXT_PUBLIC_BLOG_URL || ''

// =============================================================================
// External Content Integration (optional)
// =============================================================================

/**
 * WordPress REST API URL for blog search integration
 * Set to empty string to disable WordPress search
 * @example "https://blog.example.com/wp-json/wp/v2/posts"
 */
export const WORDPRESS_API_URL = process.env.WORDPRESS_API_URL || ''

/**
 * Domain to detect as "blog" content in URL detection
 * Used for thumbnail fetching and platform detection
 * @example "blog.example.com"
 */
export const BLOG_DOMAIN = process.env.NEXT_PUBLIC_BLOG_DOMAIN || ''

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Get all configured social links (filters out empty ones)
 */
export function getSocialLinks() {
  const links: Array<{ href: string; label: string; icon: string }> = []
  
  if (TWITTER_URL) {
    links.push({ href: TWITTER_URL, label: 'Twitter', icon: '𝕏' })
  }
  if (YOUTUBE_URL) {
    links.push({ href: YOUTUBE_URL, label: 'YouTube', icon: '▶' })
  }
  if (BLOG_URL) {
    links.push({ href: BLOG_URL, label: 'Blog', icon: '📝' })
  }
  
  return links
}

/**
 * Check if a URL belongs to the configured blog domain
 */
export function isBlogUrl(url: string): boolean {
  if (!BLOG_DOMAIN) return false
  return url.includes(BLOG_DOMAIN)
}

/**
 * Check if WordPress integration is enabled
 */
export function isWordPressEnabled(): boolean {
  return Boolean(WORDPRESS_API_URL)
}

/**
 * Get the blog label for display (domain or "Blog")
 */
export function getBlogLabel(): string {
  if (BLOG_DOMAIN) {
    return BLOG_DOMAIN
  }
  if (BLOG_URL) {
    try {
      return new URL(BLOG_URL).hostname
    } catch {
      return 'Blog'
    }
  }
  return 'Blog'
}
