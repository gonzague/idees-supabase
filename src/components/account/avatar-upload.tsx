'use client'

import { useState, useRef, useTransition } from 'react'
import { User } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { updateAvatar, removeAvatar } from '@/lib/actions/profile'
import { t } from '@/lib/i18n'

interface AvatarUploadProps {
  user: User
}

export function AvatarUpload({ user }: AvatarUploadProps) {
  const tr = t()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const currentAvatarUrl = user.avatar_url || null

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      setError('Le fichier est trop volumineux (max 5 Mo)')
      return
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      setError('Type de fichier non autorisé')
      return
    }

    setError(null)
    setPreviewUrl(URL.createObjectURL(file))

    const formData = new FormData()
    formData.append('avatar', file)

    startTransition(async () => {
      const result = await updateAvatar(formData)
      if (!result.success) {
        setError(result.error || 'Échec du téléchargement')
        setPreviewUrl(null)
      } else {
        setPreviewUrl(null)
      }
    })
  }

  const handleRemove = () => {
    setError(null)
    startTransition(async () => {
      const result = await removeAvatar()
      if (!result.success) {
        setError(result.error || 'Échec de la suppression')
      }
    })
  }

  const displayUrl = previewUrl || currentAvatarUrl

  return (
    <div className="flex items-center gap-4">
      <div className="relative">
        {displayUrl ? (
          <img
            src={displayUrl}
            alt="Avatar"
            className="w-20 h-20 rounded-full object-cover border-2 border-gray-200 dark:border-gray-700"
          />
        ) : (
          <div className="w-20 h-20 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 text-2xl font-bold border-2 border-gray-200 dark:border-gray-700">
            {user.username?.charAt(0).toUpperCase() || '?'}
          </div>
        )}
        {isPending && (
          <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          onChange={handleFileChange}
          className="hidden"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={isPending}
        >
          {tr.account.uploadAvatar}
        </Button>
        {currentAvatarUrl && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleRemove}
            disabled={isPending}
            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
          >
            {tr.account.removeAvatar}
          </Button>
        )}
        {error && (
          <p className="text-xs text-red-600">{error}</p>
        )}
      </div>
    </div>
  )
}
