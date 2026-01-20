'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@/lib/types'

export function useUser() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()

    const fetchUser = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      
      if (authUser) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_admin, is_banned, created_at, updated_at')
          .eq('id', authUser.id)
          .single<{ is_admin: boolean; is_banned: boolean; created_at: string; updated_at: string }>()

        const metadata = authUser.user_metadata || {}
        
        if (profile) {
          setUser({
            id: authUser.id,
            email: authUser.email!,
            username: metadata.username || authUser.email?.split('@')[0] || null,
            avatar_url: metadata.avatar_url || null,
            is_admin: profile.is_admin,
            is_banned: profile.is_banned,
            created_at: profile.created_at,
            updated_at: profile.updated_at,
          })
        } else {
          setUser(null)
        }
      } else {
        setUser(null)
      }
      setLoading(false)
    }

    fetchUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchUser()
    })

    return () => subscription.unsubscribe()
  }, [])

  return { user, loading, isAdmin: user?.is_admin ?? false }
}
