import Link from 'next/link'
import Image from 'next/image'
import { SuggestionWithVotes } from '@/lib/types'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { VoteButton } from './vote-button'
import { SuggestionPlaceholder } from './suggestion-placeholder'
import { cn } from '@/lib/utils/cn'
import { getTagColor } from '@/lib/constants'

interface SuggestionCardProps {
  suggestion: SuggestionWithVotes
  hasVoted: boolean
}

export function SuggestionCard({ suggestion, hasVoted }: SuggestionCardProps) {
  const isDone = suggestion.status === 'done'
  const hasThumbnail = suggestion.links && suggestion.links.length > 0 && suggestion.links[0].thumbnail_url
  const thumbnailUrl = suggestion.links?.[0]?.thumbnail_url || null

  const avatarUrl = suggestion.author_avatar_url || null

  const firstTagIcon = suggestion.tags?.[0]?.icon

  const displayIcon = suggestion.icon || firstTagIcon || '💡'

  return (
    <Card className={cn(
      "transition-all duration-200 hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-800 group overflow-hidden",
      isDone ? 'bg-gradient-to-r from-green-50/50 to-white dark:from-green-900/20 dark:to-gray-800' : 'bg-white dark:bg-gray-800'
    )}>
      <CardContent className="p-0">
        <div className="flex">
          <Link 
            href={`/suggestions/${suggestion.id}`} 
            className={cn(
              "flex-shrink-0 relative bg-slate-100 dark:bg-gray-700",
              hasThumbnail ? "w-20 sm:w-32 md:w-40" : "hidden sm:block sm:w-24 md:w-32"
            )}
          >
            <div className="relative h-full min-h-[80px] sm:min-h-[100px]">
              {hasThumbnail && thumbnailUrl ? (
                <Image
                  src={thumbnailUrl}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 80px, (max-width: 768px) 128px, 160px"
                  unoptimized
                />
              ) : (
                <SuggestionPlaceholder 
                  icon={suggestion.icon}
                  tagIcon={firstTagIcon} 
                  size="sm" 
                  className="absolute inset-0 w-full h-full"
                />
              )}
              {isDone && (
                <div className="absolute inset-0 bg-green-600/20 flex items-center justify-center">
                  <Badge variant="success" className="shadow-lg text-xs">Terminé</Badge>
                </div>
              )}
            </div>
          </Link>
          
          <div className="flex-1 p-3 sm:p-4 flex gap-3 sm:gap-4">
            <div className="flex-shrink-0 pt-0.5">
              <VoteButton
                suggestionId={suggestion.id}
                initialVoteCount={suggestion.vote_count ?? 0}
                initialHasVoted={hasVoted}
              />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start gap-2">
                {!hasThumbnail && (
                  <span className="sm:hidden text-xl flex-shrink-0">{displayIcon}</span>
                )}
                <Link
                  href={`/suggestions/${suggestion.id}`}
                  className="text-sm sm:text-base font-semibold text-slate-900 dark:text-white leading-snug hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors line-clamp-2"
                >
                  {suggestion.title}
                </Link>
                {isDone && !hasThumbnail && (
                  <Badge variant="success" className="sm:hidden flex-shrink-0 text-xs">✓</Badge>
                )}
              </div>

              {suggestion.description && (
                <p className="mt-1 sm:mt-1.5 text-xs sm:text-sm text-slate-500 dark:text-gray-400 line-clamp-2">
                  {suggestion.description}
                </p>
              )}

              {suggestion.tags && suggestion.tags.length > 0 && (
                <div className="mt-1.5 sm:mt-2 flex flex-wrap gap-1">
                  {suggestion.tags.map((tag, index) => (
                    <span
                      key={tag.id}
                      className={`px-1.5 sm:px-2 py-0.5 rounded-full text-xs font-medium ${getTagColor(index)}`}
                    >
                      {tag.icon && <span className="mr-0.5">{tag.icon}</span>}
                      {tag.name}
                    </span>
                  ))}
                </div>
              )}

              <div className="mt-2 sm:mt-3 flex items-center gap-1.5 sm:gap-2 text-xs text-slate-400 dark:text-gray-500">
                <div className="flex items-center gap-1">
                  {avatarUrl ? (
                    <Image src={avatarUrl} alt="" width={16} height={16} className="rounded-full" unoptimized />
                  ) : (
                    <div className="w-4 h-4 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 text-[8px] font-bold">
                      {suggestion.author_username?.charAt(0).toUpperCase() || '?'}
                    </div>
                  )}
                  <span className="text-slate-500 dark:text-gray-400">@{suggestion.author_username || 'unknown'}</span>
                </div>
                <span>•</span>
                <span>
                  {suggestion.created_at 
                    ? new Date(suggestion.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
                    : ''}
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
