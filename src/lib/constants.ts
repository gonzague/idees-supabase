import { t } from '@/lib/i18n'

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
export const SITE_NAME = t().site.name
export const SITE_DESCRIPTION = t().site.description

export const SUGGESTION_TITLE_MIN = 5
export const SUGGESTION_TITLE_MAX = 200
export const SUGGESTION_DESC_MAX = 2000

export const PLATFORM_LABELS: Record<string, string> = {
  youtube: 'YouTube',
  twitter: 'Twitter/X',
  blog: 'Blog',
  other: 'Autre',
}

export const PLATFORM_ICONS: Record<string, string> = {
  youtube: '📺',
  twitter: '🐦',
  blog: '📝',
  other: '🔗',
}

export const TAG_COLORS = [
  'bg-blue-100 text-blue-700',
  'bg-green-100 text-green-700',
  'bg-purple-100 text-purple-700',
  'bg-orange-100 text-orange-700',
  'bg-pink-100 text-pink-700',
  'bg-cyan-100 text-cyan-700',
  'bg-yellow-100 text-yellow-700',
] as const

export function getTagColor(index: number): string {
  return TAG_COLORS[index % TAG_COLORS.length]
}
