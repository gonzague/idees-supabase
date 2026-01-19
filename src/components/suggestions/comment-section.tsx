'use client'

import { useState, useTransition, useCallback, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Turnstile } from '@/components/ui/turnstile'
import { LinkifiedText } from '@/components/ui/linkified-text'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { createComment, deleteComment } from '@/lib/actions/comments'
import { signIn, signUp } from '@/lib/actions/auth'
import Image from 'next/image'
import { t } from '@/lib/i18n'
import type { CommentWithUser, User } from '@/lib/types'

interface CommentSectionProps {
  suggestionId: string
  comments: CommentWithUser[]
  currentUser: User | null
}

export function CommentSection({ suggestionId, comments, currentUser }: CommentSectionProps) {
  const router = useRouter()
  const [content, setContent] = useState('')
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [localComments, setLocalComments] = useState(comments)
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)
  const [authLoading, setAuthLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [authTurnstileToken, setAuthTurnstileToken] = useState<string | null>(null)
  const i18n = t()

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleTurnstileVerify = useCallback((token: string) => {
    setTurnstileToken(token)
  }, [])

  const handleAuthTurnstileVerify = useCallback((token: string) => {
    setAuthTurnstileToken(token)
  }, [])

  const handleAuthSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setAuthError(null)
    setAuthLoading(true)

    const formData = new FormData(e.currentTarget)
    if (authTurnstileToken) {
      formData.set('turnstileToken', authTurnstileToken)
    }
    const result = isSignUp ? await signUp(formData) : await signIn(formData)

    if (result.error) {
      setAuthError(result.error)
      setAuthLoading(false)
    } else {
      setShowLoginModal(false)
      setAuthLoading(false)
      router.refresh()
    }
  }

  const handleCloseModal = () => {
    setShowLoginModal(false)
    setAuthError(null)
    setIsSignUp(false)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return
    setError(null)

    const commentContent = content.trim()
    
    startTransition(async () => {
      const result = await createComment(suggestionId, commentContent, turnstileToken || undefined)
      if (result.success) {
        const newComment: CommentWithUser = {
          id: `temp-${Date.now()}`,
          user_id: currentUser!.id,
          suggestion_id: suggestionId,
          content: commentContent,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          author_username: currentUser!.username,
          author_avatar_url: currentUser!.avatar_url,
          author_id: currentUser!.id,
        }
        setLocalComments(prev => [...prev, newComment])
        setContent('')
        setTurnstileToken(null)
        router.refresh()
      } else if (result.errors) {
        setError(result.errors.content?.[0] || result.errors._form?.[0] || 'Erreur')
      }
    })
  }

  const handleDeleteClick = (commentId: string) => {
    setDeleteTarget(commentId)
  }

  const handleDeleteConfirm = () => {
    if (!deleteTarget) return
    const commentId = deleteTarget
    setDeleteTarget(null)

    startTransition(async () => {
      const result = await deleteComment(commentId, suggestionId)
      if (result.success) {
        setLocalComments(prev => prev.filter(c => c.id !== commentId))
      }
    })
  }

  return (
    <div className="mt-8 space-y-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{i18n.comments.title} ({localComments.length})</h3>

      {currentUser ? (
        <form onSubmit={handleSubmit} className="space-y-3">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={i18n.comments.placeholder}
            rows={3}
            maxLength={2000}
          />
          {error && (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          )}
          <Turnstile onVerify={handleTurnstileVerify} />
          <Button type="submit" disabled={isPending || !content.trim()}>
            {isPending ? i18n.comments.submitting : i18n.comments.submit}
          </Button>
        </form>
      ) : (
        <button
          onClick={() => setShowLoginModal(true)}
          className="w-full p-3 text-left text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 rounded-lg border border-dashed border-gray-300 dark:border-gray-600 hover:border-indigo-400 dark:hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
        >
          {i18n.comments.loginToComment}
        </button>
      )}

      <div className="space-y-4">
        {localComments.length === 0 ? (
          <p className="text-gray-400 dark:text-gray-500 italic">{i18n.comments.empty}</p>
        ) : (
          localComments.map((comment) => {
            const avatarUrl = comment.author_avatar_url || null
            const isOwner = currentUser?.id === comment.user_id
            const isAdmin = currentUser?.is_admin

            return (
              <div key={comment.id} className="flex gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex-shrink-0">
                  {avatarUrl ? (
                    <Image src={avatarUrl} alt="" width={32} height={32} className="rounded-full" unoptimized />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-xs font-medium text-gray-600 dark:text-gray-300">
                      {comment.author_username?.[0]?.toUpperCase() || '?'}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium text-gray-900 dark:text-white">@{comment.author_username}</span>
                    <span className="text-gray-400 dark:text-gray-500">·</span>
                    {comment.created_at && (
                      <span className="text-gray-400 dark:text-gray-500">
                        {new Date(comment.created_at).toLocaleDateString('fr-FR')}
                      </span>
                    )}
                    {comment.created_at && comment.updated_at && comment.updated_at !== comment.created_at && (
                      <span className="text-gray-400 dark:text-gray-500 text-xs">({i18n.comments.edited})</span>
                    )}
                  </div>
                  <p className="mt-1 text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words">
                    <LinkifiedText text={comment.content} />
                  </p>
                </div>
                {(isOwner || isAdmin) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteClick(comment.id)}
                    disabled={isPending}
                    className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/30 flex-shrink-0"
                  >
                    ×
                  </Button>
                )}
              </div>
            )
          })
        )}
      </div>

      <ConfirmDialog
        isOpen={deleteTarget !== null}
        title={i18n.comments.deleteTitle}
        message={i18n.comments.deleteConfirm}
        confirmText={i18n.comments.deleteButton}
        cancelText={i18n.comments.cancelButton}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />

      {showLoginModal && mounted && createPortal(
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[100]"
          onClick={(e) => e.target === e.currentTarget && handleCloseModal()}
        >
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-sm w-full p-6 shadow-xl animate-in fade-in zoom-in-95 duration-200">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              {isSignUp ? i18n.auth.signUp : i18n.auth.signIn}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Connectez-vous pour laisser un commentaire.
            </p>

            {authError && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg text-sm">
                {authError}
              </div>
            )}

            <form onSubmit={handleAuthSubmit} className="space-y-3">
              {isSignUp && (
                <Input
                  name="username"
                  type="text"
                  placeholder={i18n.auth.username}
                  required
                  minLength={3}
                  autoComplete="username"
                />
              )}
              <Input
                name="email"
                type="email"
                placeholder={i18n.auth.email}
                required
                autoComplete="email"
              />
              <Input
                name="password"
                type="password"
                placeholder={i18n.auth.password}
                required
                minLength={8}
                autoComplete={isSignUp ? 'new-password' : 'current-password'}
              />
              {isSignUp && (
                <Input
                  name="passwordConfirm"
                  type="password"
                  placeholder={i18n.auth.confirmPassword}
                  required
                  minLength={8}
                  autoComplete="new-password"
                />
              )}

              <Turnstile onVerify={handleAuthTurnstileVerify} />

              <div className="flex gap-2 pt-2">
                <Button type="submit" disabled={authLoading} className="flex-1">
                  {authLoading ? i18n.auth.loading : isSignUp ? i18n.auth.signUp : i18n.auth.signIn}
                </Button>
                <Button type="button" variant="outline" onClick={handleCloseModal}>
                  {i18n.auth.cancel}
                </Button>
              </div>
            </form>

            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp)
                setAuthError(null)
                setAuthTurnstileToken(null)
              }}
              className="mt-4 text-sm text-slate-500 hover:text-indigo-600 w-full text-center transition-colors"
            >
              {isSignUp ? i18n.auth.hasAccount : i18n.auth.noAccount}
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
