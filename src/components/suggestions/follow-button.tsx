'use client'

import { useState, useTransition, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Turnstile } from '@/components/ui/turnstile'
import { followSuggestion, unfollowSuggestion } from '@/lib/actions/follows'
import { signIn, signUp } from '@/lib/actions/auth'
import { t } from '@/lib/i18n'

interface FollowButtonProps {
  suggestionId: string
  initialIsFollowing: boolean
  initialFollowerCount: number
  isLoggedIn: boolean
}

export function FollowButton({ 
  suggestionId, 
  initialIsFollowing, 
  initialFollowerCount,
  isLoggedIn 
}: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing)
  const [followerCount, setFollowerCount] = useState(initialFollowerCount)
  const [isPending, startTransition] = useTransition()
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
      router.refresh()
      setShowLoginModal(false)
      setLoading(false)
    }
  }

  const handleCloseModal = () => {
    setShowLoginModal(false)
    setError(null)
    setIsSignUp(false)
  }

  const handleClick = () => {
    startTransition(async () => {
      if (isFollowing) {
        const result = await unfollowSuggestion(suggestionId)
        if (result.success) {
          setIsFollowing(false)
          setFollowerCount(prev => Math.max(0, prev - 1))
        }
      } else {
        const result = await followSuggestion(suggestionId)
        if (result.success) {
          setIsFollowing(true)
          setFollowerCount(prev => prev + 1)
        }
      }
    })
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
          Connectez-vous pour suivre cette suggestion et recevoir une notification quand elle sera réalisée.
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

  if (!isLoggedIn) {
    return (
      <>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowLoginModal(true)}
          className="gap-1.5"
        >
          <span>🔔</span>
          <span>Suivre</span>
          {followerCount > 0 && (
            <span className="text-xs bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded-full">
              {followerCount}
            </span>
          )}
        </Button>
        {loginModal}
      </>
    )
  }

  return (
    <Button
      variant={isFollowing ? "default" : "outline"}
      size="sm"
      onClick={handleClick}
      disabled={isPending}
      className={`gap-1.5 ${isFollowing ? 'bg-indigo-600 hover:bg-indigo-700' : ''}`}
    >
      <span>{isFollowing ? '🔔' : '🔕'}</span>
      <span>{isFollowing ? 'Suivi' : 'Suivre'}</span>
      {followerCount > 0 && (
        <span className={`text-xs px-1.5 py-0.5 rounded-full ${
          isFollowing 
            ? 'bg-indigo-500 text-white' 
            : 'bg-gray-100 dark:bg-gray-700'
        }`}>
          {followerCount}
        </span>
      )}
    </Button>
  )
}
