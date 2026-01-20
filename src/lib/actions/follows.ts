'use server'

import { revalidatePath } from 'next/cache'
import { createServerClient, getCurrentUser } from '@/lib/supabase/server'

export async function followSuggestion(suggestionId: string): Promise<{ success: boolean; error?: string }> {
  const user = await getCurrentUser()
  if (!user) {
    return { success: false, error: 'Vous devez être connecté' }
  }

  try {
    const supabase = await createServerClient()
    
    const { data: existing } = await supabase
      .from('suggestion_follows')
      .select('id')
      .eq('user_id', user.id)
      .eq('suggestion_id', suggestionId)
      .maybeSingle()

    if (existing) {
      return { success: true }
    }

    const { error } = await supabase
      .from('suggestion_follows')
      .insert({
        user_id: user.id,
        suggestion_id: suggestionId,
      })

    if (error) throw error

    revalidatePath(`/suggestions/${suggestionId}`)
    return { success: true }
  } catch (error) {
    console.error('Follow suggestion error:', error)
    return { success: false, error: 'Erreur lors du suivi' }
  }
}

export async function unfollowSuggestion(suggestionId: string): Promise<{ success: boolean; error?: string }> {
  const user = await getCurrentUser()
  if (!user) {
    return { success: false, error: 'Vous devez être connecté' }
  }

  try {
    const supabase = await createServerClient()
    
    const { error } = await supabase
      .from('suggestion_follows')
      .delete()
      .eq('user_id', user.id)
      .eq('suggestion_id', suggestionId)

    if (error) throw error

    revalidatePath(`/suggestions/${suggestionId}`)
    return { success: true }
  } catch (error) {
    console.error('Unfollow suggestion error:', error)
    return { success: false, error: 'Erreur lors du désabonnement' }
  }
}

export async function getFollowStatus(suggestionId: string): Promise<{ isFollowing: boolean; followerCount: number }> {
  try {
    const supabase = await createServerClient()
    const user = await getCurrentUser()

    const { data: allFollows, count } = await supabase
      .from('suggestion_follows')
      .select('user_id', { count: 'exact' })
      .eq('suggestion_id', suggestionId)

    const isFollowing = user 
      ? allFollows?.some(f => f.user_id === user.id) || false
      : false

    return {
      isFollowing,
      followerCount: count || 0,
    }
  } catch (error) {
    console.error('Get follow status error:', error)
    return { isFollowing: false, followerCount: 0 }
  }
}

export async function getFollowersWithEmail(
  suggestionId: string
): Promise<{ id: string; email: string; username: string }[]> {
  try {
    const supabase = await createServerClient()
    
    const { data: follows } = await supabase
      .from('suggestion_follows')
      .select('user_id')
      .eq('suggestion_id', suggestionId)

    if (!follows || follows.length === 0) {
      return []
    }

    const userIds = follows.map(f => f.user_id)

    const { data: { users }, error } = await supabase.auth.admin.listUsers()
    
    if (error || !users) {
      console.error('Error fetching user emails:', error)
      return []
    }

    const userIdSet = new Set(userIds)
    
    return users
      .filter(u => userIdSet.has(u.id) && u.email)
      .map(u => ({
        id: u.id,
        email: u.email!,
        username: u.user_metadata?.username || u.email?.split('@')[0] || '',
      }))
  } catch (error) {
    console.error('Get followers with email error:', error)
    return []
  }
}
