'use client'

import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Turnstile } from '@/components/ui/turnstile'
import { signIn, signUp } from '@/lib/actions/auth'
import { t } from '@/lib/i18n'

interface SuggestButtonProps {
  isLoggedIn: boolean
}

export function SuggestButton({ isLoggedIn }: SuggestButtonProps) {
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)
  const [error, setError] = useState<string | null>(null)
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

  const handleAuthSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    if (turnstileToken) {
      formData.set('turnstileToken', turnstileToken)
    }
    const result = isSignUp ? await signUp(formData) : await signIn(formData)

    if (result.error) {
      setError(result.error)
      setLoading(false)
    } else {
      setShowLoginModal(false)
      setLoading(false)
      router.push('/suggest/new')
    }
  }

  const handleCloseModal = () => {
    setShowLoginModal(false)
    setError(null)
    setIsSignUp(false)
  }

  const handleClick = () => {
    if (isLoggedIn) {
      router.push('/suggest/new')
    } else {
      setShowLoginModal(true)
    }
  }

  const loginModal = showLoginModal && mounted ? createPortal(
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[100]"
      onClick={(e) => e.target === e.currentTarget && handleCloseModal()}
    >
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-sm w-full p-6 shadow-xl animate-in fade-in zoom-in-95 duration-200">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          {isSignUp ? tr.auth.signUp : tr.auth.signIn}
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Connectez-vous pour proposer un nouveau sujet à la communauté.
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleAuthSubmit} className="space-y-3">
          {isSignUp && (
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
          <Input
            name="password"
            type="password"
            placeholder={tr.auth.password}
            required
            minLength={8}
            autoComplete={isSignUp ? 'new-password' : 'current-password'}
          />
          {isSignUp && (
            <Input
              name="passwordConfirm"
              type="password"
              placeholder={tr.auth.confirmPassword}
              required
              minLength={8}
              autoComplete="new-password"
            />
          )}

          <Turnstile onVerify={handleTurnstileVerify} />

          <div className="flex gap-2 pt-2">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? tr.auth.loading : isSignUp ? tr.auth.signUp : tr.auth.signIn}
            </Button>
            <Button type="button" variant="outline" onClick={handleCloseModal}>
              {tr.auth.cancel}
            </Button>
          </div>
        </form>

        <button
          type="button"
          onClick={() => {
            setIsSignUp(!isSignUp)
            setError(null)
            setTurnstileToken(null)
          }}
          className="mt-4 text-sm text-slate-500 hover:text-indigo-600 w-full text-center transition-colors"
        >
          {isSignUp ? tr.auth.hasAccount : tr.auth.noAccount}
        </button>
      </div>
    </div>,
    document.body
  ) : null

  return (
    <>
      <button
        onClick={handleClick}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 text-sm font-medium text-white bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full shadow-md shadow-indigo-500/20 hover:shadow-lg hover:shadow-indigo-500/30 transition-all hover:scale-105"
      >
        <span className="hidden sm:inline">✨</span>
        <span className="sm:hidden">+</span>
        <span className="hidden sm:inline">{tr.home.suggestTopic}</span>
        <span className="sm:hidden">Proposer</span>
      </button>
      {loginModal}
    </>
  )
}
