import Image from 'next/image'
import { SuggestionLink } from '@/lib/types'
import { PLATFORM_LABELS, PLATFORM_ICONS } from '@/lib/constants'
import { t } from '@/lib/i18n'

interface SuggestionLinksProps {
  links: SuggestionLink[]
}

const PLATFORM_COLORS: Record<string, string> = {
  youtube: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  twitter: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400',
  blog: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  other: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
}

export function SuggestionLinks({ links }: SuggestionLinksProps) {
  if (links.length === 0) return null

  const i18n = t()

  return (
    <div className="mt-6">
      <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
        <span className="text-green-600">✓</span>
        {i18n.suggestion.contentAvailable}
      </h4>
      <div className="grid gap-3 sm:grid-cols-2">
        {links.map((link) => (
          <LinkCard key={link.id} link={link} />
        ))}
      </div>
    </div>
  )
}

function LinkCard({ link }: { link: SuggestionLink }) {
  const hasImage = !!link.thumbnail_url
  const displayTitle = link.title || PLATFORM_LABELS[link.platform] || 'Lien'
  const platformColor = PLATFORM_COLORS[link.platform] || PLATFORM_COLORS.other
  
  return (
    <a
      href={link.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex flex-col overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600 transition-all"
    >
      <div className="relative aspect-video bg-gray-100 dark:bg-gray-700 overflow-hidden">
        {hasImage && link.thumbnail_url ? (
          <Image
            src={link.thumbnail_url}
            alt=""
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 640px) 100vw, 50vw"
            unoptimized
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-4xl opacity-50">
              {PLATFORM_ICONS[link.platform] || '🔗'}
            </span>
          </div>
        )}
        <span className={`absolute top-2 left-2 px-2 py-0.5 text-xs font-medium rounded ${platformColor}`}>
          {PLATFORM_ICONS[link.platform]} {PLATFORM_LABELS[link.platform]}
        </span>
      </div>
      <div className="p-3">
        <p className="font-medium text-gray-900 dark:text-gray-100 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
          {displayTitle}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
          {new URL(link.url).hostname}
        </p>
      </div>
    </a>
  )
}
