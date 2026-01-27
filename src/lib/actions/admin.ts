'use server'

import { revalidatePath } from 'next/cache'
import { createServiceClient, getCurrentUser, isAdmin, getUsersMetadata } from '@/lib/supabase/server'
import { fetchLinkMetadata, detectPlatform } from '@/lib/utils/thumbnails'
import { sendEmail, generateIdeaCompletedEmail, generateFollowedIdeaCompletedEmail } from '@/lib/utils/email'
import { getFollowersWithEmail } from '@/lib/actions/follows'
import type { LinkPlatform, User, AdminStats, SuggestionLink, CommentWithUser } from '@/lib/types'

export interface MarkDoneState {
  success?: boolean
  error?: string
}

export async function markSuggestionDone(
  suggestionId: string,
  links: { platform: LinkPlatform; url: string }[],
  doneComment?: string
): Promise<MarkDoneState> {
  const user = await getCurrentUser()
  if (!user) {
    return { error: 'Vous devez être connecté' }
  }

  const admin = await isAdmin()
  if (!admin) {
    return { error: 'Accès administrateur requis' }
  }

  try {
    const supabase = await createServiceClient()

    const { data: suggestion, error: fetchError } = await supabase
      .from('suggestions')
      .select('id, title, user_id')
      .eq('id', suggestionId)
      .single()

    if (fetchError || !suggestion) {
      return { error: 'Suggestion non trouvée' }
    }

    const { data: authorProfile } = await supabase
      .from('profiles')
      .select('username, email')
      .eq('id', suggestion.user_id)
      .single()

    const { error: updateError } = await supabase
      .from('suggestions')
      .update({
        status: 'done' as const,
        done_at: new Date().toISOString(),
        done_by: user.id,
        done_comment: doneComment?.trim() || null,
      })
      .eq('id', suggestionId)

    if (updateError) throw updateError

    const validLinks = links.filter(link => link.url.trim())
    
    const linkMetadataResults = await Promise.all(
      validLinks.map(async (link) => {
        const metadata = await fetchLinkMetadata(link.url)
        const platform = detectPlatform(link.url)
        return { link, metadata, platform }
      })
    )

    const createdLinks: { platform: string; url: string }[] = []
    
    await Promise.all(
      linkMetadataResults.map(async ({ link, metadata, platform }) => {
        const { error: linkError } = await supabase
          .from('suggestion_links')
          .insert({
            suggestion_id: suggestionId,
            platform,
            url: link.url.trim(),
            thumbnail_url: metadata.thumbnailUrl || null,
            title: metadata.title || null,
            created_by: user.id,
          })

        if (linkError) {
          console.error('Error creating link:', linkError)
        } else {
          createdLinks.push({ platform, url: link.url.trim() })
        }
      })
    )

    const { SITE_URL } = await import('@/lib/config')
    const ideaUrl = `${SITE_URL}/suggestions/${suggestionId}`
    
    const emailPromises: Promise<boolean | void>[] = []

    if (authorProfile?.email) {
      const emailHtml = generateIdeaCompletedEmail(
        authorProfile.username || 'Utilisateur',
        suggestion.title,
        ideaUrl,
        createdLinks
      )
      
      emailPromises.push(
        sendEmail({
          to: authorProfile.email,
          subject: `Votre suggestion "${suggestion.title}" a été réalisée !`,
          html: emailHtml,
        }).catch(err => console.error('Failed to send author notification email:', err))
      )
    }

    const followers = await getFollowersWithEmail(suggestionId)
    
    for (const follower of followers) {
      if (follower.id === suggestion.user_id) continue
      
      const followerEmailHtml = generateFollowedIdeaCompletedEmail(
        follower.username,
        suggestion.title,
        ideaUrl,
        createdLinks
      )
      
      emailPromises.push(
        sendEmail({
          to: follower.email,
          subject: `"${suggestion.title}" a été réalisée !`,
          html: followerEmailHtml,
        }).catch(err => console.error('Failed to send follower notification email:', err))
      )
    }

    await Promise.all(emailPromises)

    revalidatePath('/')
    revalidatePath(`/suggestions/${suggestionId}`)
    revalidatePath('/admin')
    
    return { success: true }
  } catch (error) {
    console.error('Mark done error:', error)
    return { error: 'Échec de la mise à jour' }
  }
}

export async function reopenSuggestion(suggestionId: string): Promise<MarkDoneState> {
  const user = await getCurrentUser()
  if (!user) {
    return { error: 'Vous devez être connecté' }
  }

  const admin = await isAdmin()
  if (!admin) {
    return { error: 'Accès administrateur requis' }
  }

  try {
    const supabase = await createServiceClient()

    await supabase
      .from('suggestion_links')
      .delete()
      .eq('suggestion_id', suggestionId)

    const { error } = await supabase
      .from('suggestions')
      .update({
        status: 'open',
        done_at: null,
        done_by: null,
        done_comment: null,
      })
      .eq('id', suggestionId)

    if (error) throw error

    revalidatePath('/')
    revalidatePath(`/suggestions/${suggestionId}`)
    revalidatePath('/admin')
    
    return { success: true }
  } catch (error) {
    console.error('Reopen error:', error)
    return { error: 'Échec de la réouverture' }
  }
}

export async function addLinkToSuggestion(
  suggestionId: string,
  url: string
): Promise<{ success: boolean; link?: SuggestionLink; error?: string }> {
  const user = await getCurrentUser()
  if (!user?.is_admin) {
    return { success: false, error: 'Admin requis' }
  }

  try {
    // Use service client to bypass RLS (admin check already done above)
    const supabase = await createServiceClient()
    const metadata = await fetchLinkMetadata(url)
    const platform = detectPlatform(url)

    const { data: link, error } = await supabase
      .from('suggestion_links')
      .insert({
        suggestion_id: suggestionId,
        platform,
        url: url.trim(),
        thumbnail_url: metadata.thumbnailUrl || null,
        title: metadata.title || null,
        created_by: user.id,
      })
      .select()
      .single()

    if (error) throw error

    revalidatePath(`/suggestions/${suggestionId}`)
    revalidatePath('/admin')
    
    return { success: true, link }
  } catch (error) {
    console.error('Add link error:', error)
    return { success: false, error: 'Échec de l\'ajout du lien' }
  }
}

export async function deleteLinkFromSuggestion(linkId: string): Promise<{ success: boolean; error?: string }> {
  const user = await getCurrentUser()
  if (!user?.is_admin) {
    return { success: false, error: 'Admin requis' }
  }

  try {
    const supabase = await createServiceClient()
    const { error } = await supabase
      .from('suggestion_links')
      .delete()
      .eq('id', linkId)

    if (error) throw error
    
    revalidatePath('/')
    revalidatePath('/admin')
    
    return { success: true }
  } catch (error) {
    console.error('Delete link error:', error)
    return { success: false, error: 'Échec de la suppression' }
  }
}

export async function updateDoneComment(
  suggestionId: string,
  doneComment: string | null
): Promise<{ success: boolean; error?: string }> {
  const user = await getCurrentUser()
  if (!user?.is_admin) {
    return { success: false, error: 'Admin requis' }
  }

  try {
    const supabase = await createServiceClient()
    const { error } = await supabase
      .from('suggestions')
      .update({ done_comment: doneComment?.trim() || null })
      .eq('id', suggestionId)

    if (error) throw error

    revalidatePath(`/suggestions/${suggestionId}`)
    revalidatePath('/admin')
    
    return { success: true }
  } catch (error) {
    console.error('Update done comment error:', error)
    return { success: false, error: 'Échec de la mise à jour' }
  }
}

export async function getAdminStats(): Promise<AdminStats> {
  try {
    const supabase = await createServiceClient()

    const { count: totalSuggestions } = await supabase
      .from('suggestions')
      .select('*', { count: 'exact', head: true })

    const { count: openSuggestions } = await supabase
      .from('suggestions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'open')

    const { count: doneSuggestions } = await supabase
      .from('suggestions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'done')

    const { count: totalVotes } = await supabase
      .from('votes')
      .select('*', { count: 'exact', head: true })

    const { count: totalUsers } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })

    return {
      totalSuggestions: totalSuggestions || 0,
      openSuggestions: openSuggestions || 0,
      doneSuggestions: doneSuggestions || 0,
      totalVotes: totalVotes || 0,
      totalUsers: totalUsers || 0,
    }
  } catch (error) {
    console.error('Get admin stats error:', error)
    return {
      totalSuggestions: 0,
      openSuggestions: 0,
      doneSuggestions: 0,
      totalVotes: 0,
      totalUsers: 0,
    }
  }
}

export async function getUsers(): Promise<User[]> {
  const user = await getCurrentUser()
  if (!user?.is_admin) {
    return []
  }

  try {
    const supabase = await createServiceClient()
    
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, username, avatar_url, email, is_admin, is_banned, created_at, updated_at')
      .order('created_at', { ascending: false })

    if (!profiles) return []

    return profiles.map(profile => ({
      id: profile.id,
      email: profile.email || '',
      username: profile.username || profile.email?.split('@')[0] || null,
      avatar_url: profile.avatar_url || null,
      is_admin: profile.is_admin,
      is_banned: profile.is_banned,
      created_at: profile.created_at,
      updated_at: profile.updated_at,
    }))
  } catch (error) {
    console.error('Get users error:', error)
    return []
  }
}

export async function toggleUserAdmin(userId: string): Promise<{ success: boolean; error?: string }> {
  const currentUser = await getCurrentUser()
  if (!currentUser?.is_admin) {
    return { success: false, error: 'Admin requis' }
  }

  if (currentUser.id === userId) {
    return { success: false, error: 'Vous ne pouvez pas modifier votre propre statut admin' }
  }

  try {
    const supabase = await createServiceClient()
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', userId)
      .single()

    if (!profile) {
      return { success: false, error: 'Utilisateur non trouvé' }
    }
    
    const { error } = await supabase
      .from('profiles')
      .update({ is_admin: !profile.is_admin })
      .eq('id', userId)

    if (error) throw error

    revalidatePath('/admin')
    return { success: true }
  } catch (error) {
    console.error('Toggle admin error:', error)
    return { success: false, error: 'Échec de la modification' }
  }
}

export async function deleteUser(userId: string): Promise<{ success: boolean; error?: string }> {
  const currentUser = await getCurrentUser()
  if (!currentUser?.is_admin) {
    return { success: false, error: 'Admin requis' }
  }

  if (currentUser.id === userId) {
    return { success: false, error: 'Vous ne pouvez pas supprimer votre propre compte' }
  }

  try {
    const supabase = await createServiceClient()
    
    const { error } = await supabase.auth.admin.deleteUser(userId)
    
    if (error) throw error

    revalidatePath('/admin')
    return { success: true }
  } catch (error) {
    console.error('Delete user error:', error)
    const message = error instanceof Error ? error.message : 'Échec de la suppression'
    return { success: false, error: message }
  }
}

export interface UpdateUserData {
  username?: string
  is_admin?: boolean
  is_banned?: boolean
}

export async function updateUser(
  userId: string,
  data: UpdateUserData
): Promise<{ success: boolean; error?: string }> {
  const currentUser = await getCurrentUser()
  if (!currentUser?.is_admin) {
    return { success: false, error: 'Admin requis' }
  }

  try {
    const supabase = await createServiceClient()
    const { error } = await supabase
      .from('profiles')
      .update(data)
      .eq('id', userId)

    if (error) throw error

    revalidatePath('/admin')
    return { success: true }
  } catch (error) {
    console.error('Update user error:', error)
    return { success: false, error: 'Échec de la mise à jour' }
  }
}

export async function toggleUserBan(userId: string): Promise<{ success: boolean; error?: string }> {
  const currentUser = await getCurrentUser()
  if (!currentUser?.is_admin) {
    return { success: false, error: 'Admin requis' }
  }

  if (currentUser.id === userId) {
    return { success: false, error: 'Vous ne pouvez pas vous bannir vous-même' }
  }

  try {
    const supabase = await createServiceClient()
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_banned')
      .eq('id', userId)
      .single()

    if (!profile) {
      return { success: false, error: 'Utilisateur non trouvé' }
    }
    
    const { error } = await supabase
      .from('profiles')
      .update({ is_banned: !profile.is_banned })
      .eq('id', userId)

    if (error) throw error

    revalidatePath('/admin')
    return { success: true }
  } catch (error) {
    console.error('Toggle ban error:', error)
    return { success: false, error: 'Échec de la modification' }
  }
}

export async function getAllComments(): Promise<(CommentWithUser & { suggestion_title?: string })[]> {
  const user = await getCurrentUser()
  if (!user?.is_admin) {
    return []
  }

  try {
    const supabase = await createServiceClient()
    
    const { data: comments, error } = await supabase
      .from('comments')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    if (!comments) return []

    const userIds = [...new Set(comments.map(c => c.user_id))]
    const usersMetadata = await getUsersMetadata(userIds)

    const suggestionIds = [...new Set(comments.map(c => c.suggestion_id))]
    const { data: suggestions } = await supabase
      .from('suggestions')
      .select('id, title')
      .in('id', suggestionIds)
    
    const suggestionTitleMap = new Map(suggestions?.map(s => [s.id, s.title]) || [])

    return comments.map(comment => {
      const userMeta = usersMetadata.get(comment.user_id)
      return {
        id: comment.id,
        user_id: comment.user_id,
        suggestion_id: comment.suggestion_id,
        content: comment.content,
        created_at: comment.created_at,
        updated_at: comment.updated_at,
        author_username: userMeta?.username,
        author_avatar_url: userMeta?.avatar_url,
        author_id: comment.user_id,
        suggestion_title: suggestionTitleMap.get(comment.suggestion_id),
      }
    })
  } catch (error) {
    console.error('Get all comments error:', error)
    return []
  }
}

export async function adminDeleteComment(commentId: string): Promise<{ success: boolean; error?: string }> {
  const currentUser = await getCurrentUser()
  if (!currentUser?.is_admin) {
    return { success: false, error: 'Admin requis' }
  }

  try {
    const supabase = await createServiceClient()
    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', commentId)

    if (error) throw error

    revalidatePath('/admin')
    return { success: true }
  } catch (error) {
    console.error('Admin delete comment error:', error)
    return { success: false, error: 'Échec de la suppression' }
  }
}

export async function backfillLinkMetadata(): Promise<{ success: boolean; updated: number; error?: string }> {
  const currentUser = await getCurrentUser()
  if (!currentUser?.is_admin) {
    return { success: false, updated: 0, error: 'Admin requis' }
  }

  try {
    const supabase = await createServiceClient()
    
    const { data: links, error: fetchError } = await supabase
      .from('suggestion_links')
      .select('*')

    if (fetchError) throw fetchError
    if (!links) return { success: true, updated: 0 }
    
    let updated = 0
    for (const link of links) {
      if (!link.thumbnail_url || !link.title) {
        const metadata = await fetchLinkMetadata(link.url)
        const updates: { thumbnail_url?: string; title?: string } = {}
        
        if (!link.thumbnail_url && metadata.thumbnailUrl) {
          updates.thumbnail_url = metadata.thumbnailUrl
        }
        if (!link.title && metadata.title) {
          updates.title = metadata.title
        }
        
        if (Object.keys(updates).length > 0) {
          const { error } = await supabase
            .from('suggestion_links')
            .update(updates)
            .eq('id', link.id)

          if (!error) updated++
        }
      }
    }

    revalidatePath('/')
    return { success: true, updated }
  } catch (error) {
    console.error('Backfill link metadata error:', error)
    return { success: false, updated: 0, error: 'Échec de la mise à jour' }
  }
}
