'use server'

import { revalidatePath } from 'next/cache'
import { cookies, headers } from 'next/headers'
import { createServerClient, getCurrentUser } from '@/lib/supabase/server'
import { checkRateLimit } from '@/lib/utils/rate-limit'

const VISITOR_ID_COOKIE = 'visitor_id'

async function getClientIP(): Promise<string> {
  const headersList = await headers()
  return headersList.get('cf-connecting-ip')
    || headersList.get('x-real-ip')
    || headersList.get('x-forwarded-for')?.split(',')[0]?.trim() 
    || 'unknown'
}

async function getVisitorId(): Promise<string | null> {
  const cookieStore = await cookies()
  const existing = cookieStore.get(VISITOR_ID_COOKIE)
  return existing?.value || null
}

async function createVisitorId(): Promise<string> {
  const cookieStore = await cookies()
  const existing = cookieStore.get(VISITOR_ID_COOKIE)
  
  if (existing?.value) {
    return existing.value
  }
  
  const newId = `anon_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`
  cookieStore.set(VISITOR_ID_COOKIE, newId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
  })
  
  return newId
}

export interface VoteResult {
  success: boolean
  hasVoted: boolean
  error?: string
}

export async function toggleVote(suggestionId: string): Promise<VoteResult> {
  const clientIP = await getClientIP()
  const rateLimit = checkRateLimit(`vote:${clientIP}`, { maxRequests: 30, windowMs: 60000 })
  if (!rateLimit.allowed) {
    return { success: false, hasVoted: false, error: 'Trop de votes. Réessayez dans une minute.' }
  }

  const user = await getCurrentUser()
  const visitorId = await createVisitorId()
  const voterId = user?.id || visitorId

  try {
    const supabase = await createServerClient()

    const { data: existing } = await supabase
      .from('votes')
      .select('id')
      .eq('voter_id', voterId)
      .eq('suggestion_id', suggestionId)
      .maybeSingle()

    if (existing) {
      await supabase
        .from('votes')
        .delete()
        .eq('id', existing.id)
      
      revalidatePath('/')
      revalidatePath(`/suggestions/${suggestionId}`)
      return { success: true, hasVoted: false }
    } else {
      await supabase
        .from('votes')
        .insert({
          user_id: user?.id || null,
          voter_id: voterId,
          suggestion_id: suggestionId,
        })
      
      revalidatePath('/')
      revalidatePath(`/suggestions/${suggestionId}`)
      return { success: true, hasVoted: true }
    }
  } catch (error) {
    console.error('Toggle vote error:', error)
    return { success: false, hasVoted: false, error: 'Failed to update vote' }
  }
}

export async function getUserVotes(suggestionIds: string[]): Promise<Set<string>> {
  if (suggestionIds.length === 0) return new Set()

  const user = await getCurrentUser()
  const visitorId = await getVisitorId()
  const voterId = user?.id || visitorId
  
  if (!voterId) return new Set()

  try {
    const supabase = await createServerClient()
    
    const { data: votes } = await supabase
      .from('votes')
      .select('suggestion_id')
      .eq('voter_id', voterId)
      .in('suggestion_id', suggestionIds)

    if (!votes) return new Set()

    return new Set(votes.map(v => v.suggestion_id))
  } catch (error) {
    console.error('Get user votes error:', error)
    return new Set()
  }
}
