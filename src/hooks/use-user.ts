'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@/lib/types'
import type { Tables } from '@/lib/types/database'

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
          .select('*')
          .eq('id', authUser.id)
          .single<Tables<'profiles'>>()

        if (profile) {
          setUser({
            id: authUser.id,
            email: authUser.email!,
            username: profile.username,
            avatar_url: profile.avatar_url,
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
