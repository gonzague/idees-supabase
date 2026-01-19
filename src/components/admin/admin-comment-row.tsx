'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { adminDeleteComment } from '@/lib/actions/admin'
import type { CommentWithUser } from '@/lib/types'

interface AdminCommentRowProps {
  comment: CommentWithUser & { suggestion_title?: string }
}

export function AdminCommentRow({ comment }: AdminCommentRowProps) {
  const [isPending, startTransition] = useTransition()
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const handleDeleteConfirm = () => {
    setShowDeleteDialog(false)
    startTransition(async () => {
      await adminDeleteComment(comment.id)
    })
  }

  return (
    <tr className={isPending ? 'opacity-50' : ''}>
      <td className="py-3 px-4">
        <div className="text-sm">@{comment.author_username || 'inconnu'}</div>
      </td>
      <td className="py-3 px-4">
        <div className="text-sm text-gray-600 truncate max-w-xs" title={comment.suggestion_title}>
          {comment.suggestion_title || comment.suggestion_id}
        </div>
      </td>
      <td className="py-3 px-4">
        <div className="text-sm max-w-md truncate" title={comment.content}>
          {comment.content}
        </div>
      </td>
      <td className="py-3 px-4 text-sm text-gray-500">
        {new Date(comment.created_at).toLocaleDateString('fr-FR')}
      </td>
      <td className="py-3 px-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowDeleteDialog(true)}
          disabled={isPending}
          className="text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          Supprimer
        </Button>

        <ConfirmDialog
          isOpen={showDeleteDialog}
          title="Supprimer le commentaire"
          message="Cette action est irréversible. Voulez-vous vraiment supprimer ce commentaire ?"
          confirmText="Supprimer"
          cancelText="Annuler"
          onConfirm={handleDeleteConfirm}
          onCancel={() => setShowDeleteDialog(false)}
        />
      </td>
    </tr>
  )
}
