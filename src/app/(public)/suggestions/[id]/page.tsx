import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'
import { getSuggestion, getTags } from '@/lib/actions/suggestions'
import { SITE_NAME, SITE_URL } from '@/lib/constants'
import { getComments } from '@/lib/actions/comments'
import { getFollowStatus } from '@/lib/actions/follows'
import { getUser } from '@/lib/actions/auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { VoteButton } from '@/components/suggestions/vote-button'
import { FollowButton } from '@/components/suggestions/follow-button'
import { SuggestionLinks } from '@/components/suggestions/suggestion-links'
import { SuggestionPlaceholder } from '@/components/suggestions/suggestion-placeholder'
import { CommentSection } from '@/components/suggestions/comment-section'
import { AdminEditButton } from '@/components/suggestions/admin-edit-button'
import { t } from '@/lib/i18n'
import { getTagColor } from '@/lib/constants'

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const suggestion = await getSuggestion(id)
  
  if (!suggestion) {
    return {
      title: 'Suggestion introuvable',
    }
  }
  
  const title = suggestion.title
  const description = suggestion.description 
    ? suggestion.description.slice(0, 160) 
    : `Suggestion par @${suggestion.author_username} - ${suggestion.vote_count} votes`
  
  const ogImageUrl = `${SITE_URL}/api/og?title=${encodeURIComponent(title)}&votes=${suggestion.vote_count}&author=${encodeURIComponent(suggestion.author_username || '')}&status=${suggestion.status}`
  
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'article',
      url: `${SITE_URL}/suggestions/${id}`,
      siteName: SITE_NAME,
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImageUrl],
    },
  }
}

export default async function SuggestionDetailPage({ params }: PageProps) {
  const { id } = await params
  const [suggestion, comments, user, tags, followStatus] = await Promise.all([
    getSuggestion(id),
    getComments(id),
    getUser(),
    getTags(),
    getFollowStatus(id),
  ])
  const i18n = t()
  const isAdmin = user?.is_admin

  if (!suggestion) {
    notFound()
  }

  const isDone = suggestion.status === 'done'
  
  const avatarUrl = suggestion.author_avatar_url || null
  
  const thumbnailUrl = suggestion.links?.[0]?.thumbnail_url || null

  const suggestionTags = suggestion.tags || []

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <Link href="/" className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
          {i18n.suggestion.backToList}
        </Link>
        <div className="flex items-center gap-2">
          {!isDone && (
            <FollowButton
              suggestionId={suggestion.id}
              initialIsFollowing={followStatus.isFollowing}
              initialFollowerCount={followStatus.followerCount}
              isLoggedIn={!!user}
            />
          )}
          {isAdmin && (
            <AdminEditButton suggestion={suggestion} tags={tags} />
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-start gap-4">
            <VoteButton
              suggestionId={suggestion.id}
              initialVoteCount={suggestion.vote_count ?? 0}
              initialHasVoted={suggestion.has_voted}
            />
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <CardTitle className="text-xl">{suggestion.title}</CardTitle>
                {isDone && <Badge variant="success">{i18n.suggestion.status.done}</Badge>}
              </div>
              {suggestionTags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {suggestionTags.map((tag, index) => (
                    <span
                      key={tag.id}
                      className={`px-2 py-0.5 text-xs rounded-full ${getTagColor(index)}`}
                    >
                      {tag.icon && <span className="mr-0.5">{tag.icon}</span>}
                      {tag.name}
                    </span>
                  ))}
                </div>
              )}
              
              <div className="mt-2 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                {avatarUrl && (
                  <Image
                    src={avatarUrl}
                    alt=""
                    width={20}
                    height={20}
                    className="rounded-full"
                    unoptimized
                  />
                )}
                <span>@{suggestion.author_username}</span>
                <span>·</span>
                <span>{new Date(suggestion.created_at).toLocaleDateString('fr-FR')}</span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg overflow-hidden relative">
            {thumbnailUrl ? (
              <div className="relative w-full h-64">
                <Image
                  src={thumbnailUrl}
                  alt={suggestion.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 800px"
                  unoptimized
                />
              </div>
            ) : (
              <SuggestionPlaceholder 
                icon={suggestion.icon}
                tagIcon={suggestionTags[0]?.icon} 
                size="lg" 
                className="w-full h-48"
              />
            )}
          </div>

          {suggestion.description ? (
            <p className="text-gray-600 dark:text-gray-300 whitespace-pre-wrap">{suggestion.description}</p>
          ) : (
            <p className="text-gray-400 dark:text-gray-500 italic">Aucune description fournie</p>
          )}

          {suggestion.links && suggestion.links.length > 0 && (
            <SuggestionLinks links={suggestion.links} />
          )}
        </CardContent>
      </Card>

      <CommentSection
        suggestionId={suggestion.id}
        comments={comments}
        currentUser={user}
      />
    </div>
  )
}
