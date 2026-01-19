'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { confirmPasswordReset, requestPasswordReset } from '@/lib/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function ResetPasswordPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [isValidSession, setIsValidSession] = useState<boolean | null>(null)
  const [urlError, setUrlError] = useState<string | null>(null)
  const [requestSent, setRequestSent] = useState(false)

  useEffect(() => {
    const errorCode = searchParams.get('error_code')
    if (errorCode === 'otp_expired') {
      setUrlError('expired')
      setIsValidSession(false)
      return
    }
    if (searchParams.get('error') === 'access_denied') {
      setUrlError('denied')
      setIsValidSession(false)
      return
    }

    const supabase = createClient()
    
    supabase.auth.onAuthStateChange(async (event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsValidSession(true)
      }
    })

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setIsValidSession(true)
      } else {
        setIsValidSession(false)
      }
    })
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    setError(null)
    setLoading(true)

    const result = await confirmPasswordReset(password, passwordConfirm)
    
    if (result.error) {
      setError(result.error)
    } else {
      setSuccess(true)
    }
    setLoading(false)
  }

  if (isValidSession === null) {
    return (
      <div className="max-w-md mx-auto mt-16 p-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
          <div className="flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          </div>
        </div>
      </div>
    )
  }

  const handleRequestNewLink = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    
    setLoading(true)
    setError(null)
    
    const formData = new FormData()
    formData.append('email', email)
    const result = await requestPasswordReset(formData)
    
    if (result.error) {
      setError(result.error)
    } else {
      setRequestSent(true)
    }
    setLoading(false)
  }

  if (isValidSession === false) {
    const isExpired = urlError === 'expired'
    
    if (requestSent) {
      return (
        <div className="max-w-md mx-auto mt-16 p-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Email envoyé
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Si un compte existe avec cette adresse, vous recevrez un nouveau lien de réinitialisation.
            </p>
            <Button onClick={() => router.push('/')}>
              Retour à l&apos;accueil
            </Button>
          </div>
        </div>
      )
    }
    
    return (
      <div className="max-w-md mx-auto mt-16 p-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            {isExpired ? 'Lien expiré' : 'Lien invalide'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {isExpired 
              ? 'Ce lien de réinitialisation a expiré. Demandez un nouveau lien ci-dessous.'
              : 'Ce lien de réinitialisation est invalide ou a expiré.'}
          </p>
          
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg text-sm">
              {error}
            </div>
          )}
          
          <form onSubmit={handleRequestNewLink} className="space-y-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Votre email
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@exemple.com"
                required
              />
            </div>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Envoi...' : 'Recevoir un nouveau lien'}
            </Button>
          </form>
          
          <Button variant="ghost" onClick={() => router.push('/')} className="w-full">
            Retour à l&apos;accueil
          </Button>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="max-w-md mx-auto mt-16 p-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Mot de passe modifié
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Votre mot de passe a été modifié avec succès. Vous pouvez maintenant vous connecter.
          </p>
          <Button onClick={() => router.push('/')}>
            Retour à l&apos;accueil
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto mt-16 p-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Nouveau mot de passe
        </h1>

        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nouveau mot de passe
            </label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Confirmer le mot de passe
            </label>
            <Input
              type="password"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
            />
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Modification...' : 'Modifier le mot de passe'}
          </Button>
        </form>
      </div>
    </div>
  )
}
