import { createClient, SupabaseClient } from '@supabase/supabase-js'
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
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) return null

  return {
    id: user.id,
    email: user.email!,
    username: profile.username,
    avatar_url: profile.avatar_url,
    is_admin: profile.is_admin,
    is_banned: profile.is_banned,
    created_at: profile.created_at,
    updated_at: profile.updated_at,
  }
}

export async function isAdmin(): Promise<boolean> {
  const user = await getCurrentUser()
  return user?.is_admin === true
}
