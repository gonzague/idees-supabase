'use client'

import { useState, useTransition } from 'react'
import { User } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { UserAvatar } from '@/components/auth/user-avatar'
import { toggleUserAdmin, deleteUser, toggleUserBan } from '@/lib/actions/admin'
import { EditUserDialog } from './edit-user-dialog'
import { t } from '@/lib/i18n'

interface AdminUserRowProps {
  user: User
}

export function AdminUserRow({ user }: AdminUserRowProps) {
  const [isPending, startTransition] = useTransition()
  const [showConfirm, setShowConfirm] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const tr = t()

  const handleToggleAdmin = () => {
    startTransition(async () => {
      await toggleUserAdmin(user.id)
    })
  }

  const handleToggleBan = () => {
    startTransition(async () => {
      await toggleUserBan(user.id)
    })
  }

  const handleDelete = () => {
    setError(null)
    startTransition(async () => {
      const result = await deleteUser(user.id)
      if (result.success) {
        setShowConfirm(false)
      } else {
        setError(result.error ?? 'Erreur lors de la suppression')
      }
    })
  }

  return (
    <>
    {showEdit && (
      <EditUserDialog user={user} onClose={() => setShowEdit(false)} />
    )}
    <tr className="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
      <td className="py-3 px-4">
        <div className="flex items-center gap-3">
          <UserAvatar profile={user} size="sm" />
          <div className="flex items-center gap-2">
            <span className="font-medium text-slate-900 dark:text-slate-100">@{user.username}</span>
            {user.is_admin && <Badge variant="success">Admin</Badge>}
            {user.is_banned && <Badge variant="error">Banni</Badge>}
          </div>
        </div>
      </td>
      <td className="py-3 px-4 text-sm text-slate-500 dark:text-slate-400">
        {user.email}
      </td>
      <td className="py-3 px-4 text-sm text-slate-500 dark:text-slate-400">
        {user.created_at ? new Date(user.created_at).toLocaleDateString('fr-FR') : '-'}
      </td>
      <td className="py-3 px-4">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowEdit(true)}
            disabled={isPending}
          >
            Modifier
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleToggleAdmin}
            disabled={isPending}
          >
            {user.is_admin ? 'Retirer admin' : 'Rendre admin'}
          </Button>
          <Button
            variant={user.is_banned ? 'outline' : 'ghost'}
            size="sm"
            onClick={handleToggleBan}
            disabled={isPending}
            className={user.is_banned ? '' : 'text-orange-600 hover:text-orange-700 hover:bg-orange-50'}
          >
            {user.is_banned ? 'Débannir' : 'Bannir'}
          </Button>
          
          {error && (
            <span className="text-sm text-red-600">{error}</span>
          )}
          {showConfirm ? (
            <div className="flex items-center gap-1">
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                disabled={isPending}
              >
                Confirmer
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setShowConfirm(false); setError(null) }}
              >
                Annuler
              </Button>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowConfirm(true)}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              {tr.admin.actions.delete}
            </Button>
          )}
        </div>
      </td>
    </tr>
    </>
  )
}
