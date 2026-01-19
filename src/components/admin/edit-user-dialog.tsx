'use client'

import { useState, useTransition } from 'react'
import { User } from '@/lib/types'
import { updateUser } from '@/lib/actions/admin'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface EditUserDialogProps {
  user: User
  onClose: () => void
}

export function EditUserDialog({ user, onClose }: EditUserDialogProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [username, setUsername] = useState(user.username || '')
  const [isAdmin, setIsAdmin] = useState(user.is_admin)
  const [isBanned, setIsBanned] = useState(user.is_banned || false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const trimmedUsername = username.trim()
    
    startTransition(async () => {
      const result = await updateUser(user.id, {
        username: trimmedUsername,
        is_admin: isAdmin,
        is_banned: isBanned,
      })
      if (result.success) {
        onClose()
      } else {
        setError(result.error ?? 'Erreur lors de la mise à jour')
      }
    })
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
          Modifier l&apos;utilisateur
        </h2>

        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-md text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nom d&apos;utilisateur
            </label>
            <Input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <input
                type="checkbox"
                checked={isAdmin}
                onChange={(e) => setIsAdmin(e.target.checked)}
                className="rounded border-gray-300 dark:border-gray-600"
              />
              Admin
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <input
                type="checkbox"
                checked={isBanned}
                onChange={(e) => setIsBanned(e.target.checked)}
                className="rounded border-gray-300 dark:border-gray-600"
              />
              Banni
            </label>
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
              Annuler
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
