import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { createServerClient as createSSRClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/lib/types/database'
import type { User } from '@/lib/types'

export type SupabaseClientType = SupabaseClient<Database>

export async function createServerClient(): Promise<SupabaseClientType> {
  const cookieStore = await cookies()

  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          cookie: cookieStore.getAll().map(c => `${c.name}=${c.value}`).join('; ')
        }
      },
      auth: {
        flowType: 'pkce',
        autoRefreshToken: false,
        detectSessionInUrl: false,
        persistSession: false,
      }
    }
  )
}

export async function createAuthClient() {
  const cookieStore = await cookies()
  
  return createSSRClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch { /* Server Component context */ }
        },
      },
    }
  )
}

export async function createServiceClient(): Promise<SupabaseClientType> {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      }
    }
  )
}

export async function getCurrentUser(): Promise<User | null> {
  const supabase = await createAuthClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profileData } = await supabase
    .from('profiles')
    .select('id, username, avatar_url, is_admin, is_banned, created_at, updated_at')
    .eq('id', user.id)
    .single()

  const profile = profileData as {
    id: string
    username: string | null
    avatar_url: string | null
    is_admin: boolean
    is_banned: boolean
    created_at: string
    updated_at: string
  } | null

  return {
    id: user.id,
    email: user.email!,
    username: profile?.username || user.email?.split('@')[0] || null,
    avatar_url: profile?.avatar_url || null,
    is_admin: profile?.is_admin ?? false,
    is_banned: profile?.is_banned ?? false,
    created_at: profile?.created_at || user.created_at,
    updated_at: profile?.updated_at || user.updated_at || user.created_at,
  }
}

export async function isAdmin(): Promise<boolean> {
  const user = await getCurrentUser()
  return user?.is_admin === true
}

/**
 * Fetch user metadata (username, avatar_url) for multiple users from profiles table
 * This queries only the requested users instead of fetching all users
 */
export async function getUsersMetadata(userIds: string[]): Promise<Map<string, { username: string | null; avatar_url: string | null }>> {
  const result = new Map<string, { username: string | null; avatar_url: string | null }>()
  
  if (userIds.length === 0) return result
  
  try {
    const supabase = await createServerClient()
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, username, avatar_url')
      .in('id', userIds)
    
    if (error || !profiles) {
      console.error('Error fetching users metadata:', error)
      return result
    }
    
    for (const profile of profiles) {
      result.set(profile.id, {
        username: profile.username || null,
        avatar_url: profile.avatar_url || null,
      })
    }
    
    return result
  } catch (error) {
    console.error('Error fetching users metadata:', error)
    return result
  }
}
