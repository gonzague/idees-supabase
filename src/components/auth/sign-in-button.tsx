'use client'

import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { signIn, signUp, requestPasswordReset } from '@/lib/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Turnstile } from '@/components/ui/turnstile'
import { t } from '@/lib/i18n'

type AuthMode = 'signIn' | 'signUp' | 'forgotPassword'

export function SignInButton() {
  const [isOpen, setIsOpen] = useState(false)
  const [mode, setMode] = useState<AuthMode>('signIn')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)
  const router = useRouter()
  const tr = t()

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleTurnstileVerify = useCallback((token: string) => {
    setTurnstileToken(token)
  }, [])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    if (turnstileToken) {
      formData.set('turnstileToken', turnstileToken)
    }

    if (mode === 'forgotPassword') {
      const result = await requestPasswordReset(formData)
      if (result.error) {
        setError(result.error)
      } else {
        setSuccess('Si un compte existe avec cet email, vous recevrez un lien de réinitialisation.')
      }
      setLoading(false)
      return
    }

    const result = mode === 'signUp' ? await signUp(formData) : await signIn(formData)

    if (result.error) {
      setError(result.error)
      setLoading(false)
    } else {
      router.refresh()
      setIsOpen(false)
      setLoading(false)
    }
  }

  const handleClose = () => {
    setIsOpen(false)
    setError(null)
    setSuccess(null)
    setMode('signIn')
  }

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode)
    setError(null)
    setSuccess(null)
    setTurnstileToken(null)
  }

  const getTitle = () => {
    switch (mode) {
      case 'signUp': return tr.auth.signUp
      case 'forgotPassword': return 'Mot de passe oublié'
      default: return tr.auth.signIn
    }
  }

  const modal = isOpen && mounted ? createPortal(
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[100]"
      onClick={(e) => e.target === e.currentTarget && handleClose()}
    >
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-sm w-full p-6 shadow-xl animate-in fade-in zoom-in-95 duration-200">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          {getTitle()}
        </h2>

        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg text-sm">
            {success}
          </div>
        )}

        {mode === 'forgotPassword' && success ? (
          <Button onClick={() => switchMode('signIn')} className="w-full">
            Retour à la connexion
          </Button>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            {mode === 'signUp' && (
              <Input
                name="username"
                type="text"
                placeholder={tr.auth.username}
                required
                minLength={3}
                autoComplete="username"
              />
            )}
            <Input
              name="email"
              type="email"
              placeholder={tr.auth.email}
              required
              autoComplete="email"
            />
            {mode !== 'forgotPassword' && (
              <Input
                name="password"
                type="password"
                placeholder={tr.auth.password}
                required
                minLength={8}
                autoComplete={mode === 'signUp' ? 'new-password' : 'current-password'}
              />
            )}
            {mode === 'signUp' && (
              <Input
                name="passwordConfirm"
                type="password"
                placeholder={tr.auth.confirmPassword}
                required
                minLength={8}
                autoComplete="new-password"
              />
            )}

            {mode !== 'forgotPassword' && (
              <Turnstile onVerify={handleTurnstileVerify} />
            )}

            <div className="flex gap-2 pt-2">
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? tr.auth.loading : mode === 'forgotPassword' ? 'Envoyer le lien' : mode === 'signUp' ? tr.auth.signUp : tr.auth.signIn}
              </Button>
              <Button type="button" variant="outline" onClick={handleClose}>
                {tr.auth.cancel}
              </Button>
            </div>
          </form>
        )}

        {mode === 'signIn' && (
          <button
            type="button"
            onClick={() => switchMode('forgotPassword')}
            className="mt-3 text-sm text-slate-500 hover:text-indigo-600 w-full text-center transition-colors"
          >
            Mot de passe oublié ?
          </button>
        )}

        {mode !== 'forgotPassword' && (
          <button
            type="button"
            onClick={() => switchMode(mode === 'signUp' ? 'signIn' : 'signUp')}
            className="mt-3 text-sm text-slate-500 hover:text-indigo-600 w-full text-center transition-colors"
          >
            {mode === 'signUp' ? tr.auth.hasAccount : tr.auth.noAccount}
          </button>
        )}

        {mode === 'forgotPassword' && !success && (
          <button
            type="button"
            onClick={() => switchMode('signIn')}
            className="mt-3 text-sm text-slate-500 hover:text-indigo-600 w-full text-center transition-colors"
          >
            Retour à la connexion
          </button>
        )}
      </div>
    </div>,
    document.body
  ) : null

  return (
    <>
      <Button onClick={() => setIsOpen(true)} variant="default" size="sm">
        {tr.nav.signIn}
      </Button>
      {modal}
    </>
  )
}
