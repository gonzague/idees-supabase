'use server'

import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import { createServerClient, getCurrentUser, getUsersMetadata } from '@/lib/supabase/server'
import { checkRateLimit } from '@/lib/utils/rate-limit'
import { verifyTurnstileToken } from '@/lib/utils/turnstile'
import type { CommentWithUser } from '@/lib/types'

const COMMENT_MAX_LENGTH = 2000

async function getClientIP(): Promise<string> {
  const headersList = await headers()
  return headersList.get('cf-connecting-ip')
    || headersList.get('x-real-ip')
    || headersList.get('x-forwarded-for')?.split(',')[0]?.trim() 
    || 'unknown'
}

export async function getComments(suggestionId: string): Promise<CommentWithUser[]> {
  try {
    const supabase = await createServerClient()
    
    const { data: comments, error } = await supabase
      .from('comments')
      .select('*')
      .eq('suggestion_id', suggestionId)
      .order('created_at', { ascending: true })

    if (error) throw error
    if (!comments) return []

    const userIds = [...new Set(comments.map(c => c.user_id))]
    const usersMetadata = await getUsersMetadata(userIds)

    return comments.map(comment => {
      const userMeta = usersMetadata.get(comment.user_id)
      return {
        ...comment,
        author_username: userMeta?.username,
        author_avatar_url: userMeta?.avatar_url,
        author_id: comment.user_id,
      }
    })
  } catch (error) {
    console.error('Get comments error:', error)
    return []
  }
}

export interface CreateCommentState {
  errors?: {
    content?: string[]
    _form?: string[]
  }
  success?: boolean
}

export async function createComment(
  suggestionId: string,
  content: string,
  turnstileToken?: string
): Promise<CreateCommentState> {
  const clientIP = await getClientIP()
  const rateLimit = checkRateLimit(`comment:${clientIP}`, { maxRequests: 10, windowMs: 60000 })
  if (!rateLimit.allowed) {
    return { errors: { _form: ['Trop de commentaires. Réessayez dans une minute.'] } }
  }

  const isValidToken = await verifyTurnstileToken(turnstileToken || '')
  if (!isValidToken) {
    return { errors: { _form: ['Vérification anti-spam échouée. Veuillez réessayer.'] } }
  }

  const user = await getCurrentUser()
  if (!user) {
    return { errors: { _form: ['Vous devez être connecté pour commenter'] } }
  }

  if (user.is_banned) {
    return { errors: { _form: ['Votre compte a été suspendu'] } }
  }

  if (!content || content.trim().length === 0) {
    return { errors: { content: ['Le commentaire ne peut pas être vide'] } }
  }

  if (content.length > COMMENT_MAX_LENGTH) {
    return { errors: { content: [`Le commentaire doit contenir moins de ${COMMENT_MAX_LENGTH} caractères`] } }
  }

  try {
    const supabase = await createServerClient()
    
    const { error } = await supabase
      .from('comments')
      .insert({
        user_id: user.id,
        suggestion_id: suggestionId,
        content: content.trim(),
      })

    if (error) throw error
    
    revalidatePath(`/suggestions/${suggestionId}`)
    return { success: true }
  } catch (error) {
    console.error('Create comment error:', error)
    return { errors: { _form: ['Échec de la création du commentaire. Veuillez réessayer.'] } }
  }
}

export async function deleteComment(
  commentId: string,
  suggestionId: string
): Promise<{ success: boolean; error?: string }> {
  const user = await getCurrentUser()
  if (!user) {
    return { success: false, error: 'Non autorisé' }
  }

  try {
    const supabase = await createServerClient()
    
    const { data: comment } = await supabase
      .from('comments')
      .select('user_id')
      .eq('id', commentId)
      .single()
    
    if (!comment) {
      return { success: false, error: 'Commentaire non trouvé' }
    }
    
    if (comment.user_id !== user.id && !user.is_admin) {
      return { success: false, error: 'Non autorisé' }
    }

    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', commentId)

    if (error) throw error

    revalidatePath(`/suggestions/${suggestionId}`)
    return { success: true }
  } catch (error) {
    console.error('Delete comment error:', error)
    return { success: false, error: 'Échec de la suppression' }
  }
}

export async function updateComment(
  commentId: string,
  content: string,
  suggestionId: string
): Promise<{ success: boolean; error?: string }> {
  const user = await getCurrentUser()
  if (!user) {
    return { success: false, error: 'Non autorisé' }
  }

  if (!content || content.trim().length === 0) {
    return { success: false, error: 'Le commentaire ne peut pas être vide' }
  }

  if (content.length > COMMENT_MAX_LENGTH) {
    return { success: false, error: `Le commentaire doit contenir moins de ${COMMENT_MAX_LENGTH} caractères` }
  }

  try {
    const supabase = await createServerClient()
    
    const { data: comment } = await supabase
      .from('comments')
      .select('user_id')
      .eq('id', commentId)
      .single()
    
    if (!comment) {
      return { success: false, error: 'Commentaire non trouvé' }
    }
    
    if (comment.user_id !== user.id) {
      return { success: false, error: 'Non autorisé' }
    }

    const { error } = await supabase
      .from('comments')
      .update({ content: content.trim() })
      .eq('id', commentId)

    if (error) throw error
    
    revalidatePath(`/suggestions/${suggestionId}`)
    return { success: true }
  } catch (error) {
    console.error('Update comment error:', error)
    return { success: false, error: 'Échec de la mise à jour' }
  }
}
