'use server'

import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import { createServerClient, getCurrentUser } from '@/lib/supabase/server'
import { checkRateLimit } from '@/lib/utils/rate-limit'

async function getClientIP(): Promise<string> {
  const headersList = await headers()
  return headersList.get('cf-connecting-ip')
    || headersList.get('x-real-ip')
    || headersList.get('x-forwarded-for')?.split(',')[0]?.trim() 
    || 'unknown'
}

export async function updateUsername(username: string): Promise<{ success: boolean; error?: string }> {
  const clientIP = await getClientIP()
  const rateLimit = checkRateLimit(`profile:${clientIP}`, { maxRequests: 10, windowMs: 60000 })
  if (!rateLimit.allowed) {
    return { success: false, error: 'Trop de modifications. Réessayez dans une minute.' }
  }

  const user = await getCurrentUser()
  if (!user) {
    return { success: false, error: 'Non autorisé' }
  }

  if (!username || username.length < 3) {
    return { success: false, error: 'Le nom d\'utilisateur doit contenir au moins 3 caractères' }
  }

  if (username.length > 50) {
    return { success: false, error: 'Le nom d\'utilisateur doit contenir moins de 50 caractères' }
  }

  try {
    const supabase = await createServerClient()
    
    const { error } = await supabase
      .from('profiles')
      .update({ username })
      .eq('id', user.id)

    if (error) throw error

    revalidatePath('/account')
    revalidatePath('/')
    return { success: true }
  } catch (error) {
    console.error('Update username error:', error)
    return { success: false, error: 'Échec de la mise à jour' }
  }
}

export async function updateEmail(email: string): Promise<{ success: boolean; error?: string }> {
  const user = await getCurrentUser()
  if (!user) {
    return { success: false, error: 'Non autorisé' }
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!email || !emailRegex.test(email)) {
    return { success: false, error: 'Email invalide' }
  }

  try {
    const supabase = await createServerClient()
    const { error } = await supabase.auth.updateUser({ email })

    if (error) throw error

    return { success: true }
  } catch (error) {
    console.error('Update email error:', error)
    return { success: false, error: 'Échec de la mise à jour' }
  }
}

export async function updatePassword(
  currentPassword: string,
  newPassword: string,
  confirmPassword: string
): Promise<{ success: boolean; error?: string }> {
  const clientIP = await getClientIP()
  const rateLimit = checkRateLimit(`password:${clientIP}`, { maxRequests: 5, windowMs: 300000 })
  if (!rateLimit.allowed) {
    return { success: false, error: 'Trop de tentatives. Réessayez dans quelques minutes.' }
  }

  const user = await getCurrentUser()
  if (!user) {
    return { success: false, error: 'Non autorisé' }
  }

  if (!currentPassword) {
    return { success: false, error: 'Le mot de passe actuel est requis' }
  }

  if (!newPassword || newPassword.length < 8) {
    return { success: false, error: 'Le nouveau mot de passe doit contenir au moins 8 caractères' }
  }

  if (newPassword !== confirmPassword) {
    return { success: false, error: 'Les mots de passe ne correspondent pas' }
  }

  try {
    const supabase = await createServerClient()
    
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    })

    if (signInError) {
      return { success: false, error: 'Mot de passe actuel incorrect' }
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword })

    if (error) throw error

    return { success: true }
  } catch (error) {
    console.error('Update password error:', error)
    return { success: false, error: 'Échec de la mise à jour du mot de passe' }
  }
}

export async function updateAvatar(formData: FormData): Promise<{ success: boolean; error?: string }> {
  const user = await getCurrentUser()
  if (!user) {
    return { success: false, error: 'Non autorisé' }
  }

  const file = formData.get('avatar') as File
  if (!file || file.size === 0) {
    return { success: false, error: 'Aucun fichier sélectionné' }
  }

  if (file.size > 5 * 1024 * 1024) {
    return { success: false, error: 'Le fichier est trop volumineux (max 5 Mo)' }
  }

  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  if (!allowedTypes.includes(file.type)) {
    return { success: false, error: 'Type de fichier non autorisé' }
  }

  try {
    const supabase = await createServerClient()
    
    const fileExt = file.name.split('.').pop()
    const fileName = `${user.id}/avatar.${fileExt}`

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, file, { upsert: true })

    if (uploadError) throw uploadError

    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName)

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url: publicUrl })
      .eq('id', user.id)

    if (updateError) throw updateError

    revalidatePath('/account')
    revalidatePath('/')
    return { success: true }
  } catch (error) {
    console.error('Update avatar error:', error)
    return { success: false, error: 'Échec du téléchargement' }
  }
}

export async function removeAvatar(): Promise<{ success: boolean; error?: string }> {
  const user = await getCurrentUser()
  if (!user) {
    return { success: false, error: 'Non autorisé' }
  }

  try {
    const supabase = await createServerClient()
    
    const { data: files } = await supabase.storage
      .from('avatars')
      .list(user.id)

    if (files && files.length > 0) {
      const filesToRemove = files.map(f => `${user.id}/${f.name}`)
      await supabase.storage.from('avatars').remove(filesToRemove)
    }

    const { error } = await supabase
      .from('profiles')
      .update({ avatar_url: null })
      .eq('id', user.id)

    if (error) throw error

    revalidatePath('/account')
    revalidatePath('/')
    return { success: true }
  } catch (error) {
    console.error('Remove avatar error:', error)
    return { success: false, error: 'Échec de la suppression' }
  }
}
