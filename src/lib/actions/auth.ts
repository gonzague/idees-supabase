'use server'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { createServerClient, getCurrentUser } from '@/lib/supabase/server'
import { verifyTurnstileToken } from '@/lib/utils/turnstile'
import { checkRateLimit } from '@/lib/utils/rate-limit'
import type { User } from '@/lib/types'

async function getClientIP(): Promise<string> {
  const headersList = await headers()
  return headersList.get('cf-connecting-ip')
    || headersList.get('x-real-ip')
    || headersList.get('x-forwarded-for')?.split(',')[0]?.trim()
    || 'unknown'
}

export async function signIn(formData: FormData): Promise<{ error?: string }> {
  const clientIP = await getClientIP()
  const rateLimit = checkRateLimit(`signin:${clientIP}`, { maxRequests: 5, windowMs: 60000 })
  if (!rateLimit.allowed) {
    return { error: 'Trop de tentatives. Réessayez dans une minute.' }
  }

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const turnstileToken = formData.get('turnstileToken') as string

  const isValidToken = await verifyTurnstileToken(turnstileToken)
  if (!isValidToken) {
    return { error: 'Vérification anti-spam échouée. Veuillez réessayer.' }
  }

  if (!email || !password) {
    return { error: 'Email et mot de passe requis' }
  }

  const supabase = await createServerClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return { error: 'Email ou mot de passe incorrect' }
  }

  return {}
}

export async function signUp(formData: FormData): Promise<{ error?: string }> {
  const clientIP = await getClientIP()
  const rateLimit = checkRateLimit(`signup:${clientIP}`, { maxRequests: 3, windowMs: 300000 })
  if (!rateLimit.allowed) {
    return { error: 'Trop de tentatives. Réessayez dans quelques minutes.' }
  }

  const email = formData.get('email') as string
  const username = formData.get('username') as string
  const password = formData.get('password') as string
  const passwordConfirm = formData.get('passwordConfirm') as string
  const turnstileToken = formData.get('turnstileToken') as string

  const isValidToken = await verifyTurnstileToken(turnstileToken)
  if (!isValidToken) {
    return { error: 'Vérification anti-spam échouée. Veuillez réessayer.' }
  }

  if (!email || !username || !password) {
    return { error: 'Tous les champs sont requis' }
  }

  if (password !== passwordConfirm) {
    return { error: 'Les mots de passe ne correspondent pas' }
  }

  const supabase = await createServerClient()

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { username }
    }
  })

  if (error) {
    if (error.message.includes('email')) {
      return { error: 'Cet email est déjà utilisé' }
    }
    return { error: 'Erreur lors de l\'inscription' }
  }

  return {}
}

export async function signOut() {
  const supabase = await createServerClient()
  await supabase.auth.signOut()
  redirect('/')
}

export async function getUser(): Promise<User | null> {
  return getCurrentUser()
}

export async function getProfile(): Promise<User | null> {
  return getCurrentUser()
}

export async function requestPasswordReset(formData: FormData): Promise<{ error?: string; success?: boolean }> {
  const clientIP = await getClientIP()
  const rateLimit = checkRateLimit(`reset:${clientIP}`, { maxRequests: 3, windowMs: 300000 })
  if (!rateLimit.allowed) {
    return { error: 'Trop de tentatives. Réessayez dans quelques minutes.' }
  }

  const email = formData.get('email') as string
  if (!email) {
    return { error: 'Email requis' }
  }

  const supabase = await createServerClient()
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteUrl}/reset-password`,
  })

  return { success: true }
}

export async function confirmPasswordReset(
  password: string,
  passwordConfirm: string
): Promise<{ error?: string; success?: boolean }> {
  if (!password || !passwordConfirm) {
    return { error: 'Tous les champs sont requis' }
  }

  if (password !== passwordConfirm) {
    return { error: 'Les mots de passe ne correspondent pas' }
  }

  if (password.length < 8) {
    return { error: 'Le mot de passe doit contenir au moins 8 caractères' }
  }

  const supabase = await createServerClient()
  const { error } = await supabase.auth.updateUser({ password })

  if (error) {
    return { error: 'Erreur lors de la mise à jour du mot de passe' }
  }

  return { success: true }
}
