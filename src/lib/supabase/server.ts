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
    .select('id, is_admin, is_banned, created_at, updated_at')
    .eq('id', user.id)
    .single()

  const profile = profileData as { is_admin: boolean; is_banned: boolean; created_at: string; updated_at: string } | null
  const metadata = user.user_metadata || {}
  
  return {
    id: user.id,
    email: user.email!,
    username: metadata.username || user.email?.split('@')[0] || null,
    avatar_url: metadata.avatar_url || null,
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
 * Fetch user metadata (username, avatar_url) for multiple users from auth.users
 * This uses the service role client to access auth.admin APIs
 */
export async function getUsersMetadata(userIds: string[]): Promise<Map<string, { username: string | null; avatar_url: string | null }>> {
  const result = new Map<string, { username: string | null; avatar_url: string | null }>()
  
  if (userIds.length === 0) return result
  
  try {
    const supabase = await createServiceClient()
    const { data: { users }, error } = await supabase.auth.admin.listUsers()
    
    if (error || !users) {
      console.error('Error fetching users metadata:', error)
      return result
    }
    
    const userIdSet = new Set(userIds)
    for (const user of users) {
      if (userIdSet.has(user.id)) {
        const metadata = user.user_metadata || {}
        result.set(user.id, {
          username: metadata.username || user.email?.split('@')[0] || null,
          avatar_url: metadata.avatar_url || null,
        })
      }
    }
    
    return result
  } catch (error) {
    console.error('Error fetching users metadata:', error)
    return result
  }
}
