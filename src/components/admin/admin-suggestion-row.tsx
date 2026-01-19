'use client'

import { useState, useTransition, useEffect } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { SuggestionWithVotes, Tag } from '@/lib/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { reopenSuggestion } from '@/lib/actions/admin'
import { deleteSuggestion } from '@/lib/actions/suggestions'
import { MarkDoneDialog } from './mark-done-dialog'
import { AdminLinkManager } from './admin-link-manager'
import { EditSuggestionModal } from '@/components/suggestions/edit-suggestion-modal'
import { t } from '@/lib/i18n'

interface AdminSuggestionRowProps {
  suggestion: SuggestionWithVotes
  tags: Tag[]
}

export function AdminSuggestionRow({ suggestion, tags }: AdminSuggestionRowProps) {
  const [showMarkDone, setShowMarkDone] = useState(false)
  const [showLinkManager, setShowLinkManager] = useState(false)
  const [showConfirmDelete, setShowConfirmDelete] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [mounted, setMounted] = useState(false)
  const tr = t()
  
  useEffect(() => {
    setMounted(true)
  }, [])
  
  const linkCount = suggestion.links?.length || 0

  const isDone = suggestion.status === 'done'

  const handleReopen = () => {
    setShowMenu(false)
    startTransition(async () => {
      await reopenSuggestion(suggestion.id)
    })
  }

  const handleDelete = () => {
    startTransition(async () => {
      await deleteSuggestion(suggestion.id)
      setShowConfirmDelete(false)
    })
  }

  return (
    <>
      <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
        <td className="py-3 px-4">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-slate-900 dark:text-slate-100">{suggestion.vote_count}</span>
            <span className="text-indigo-400">▲</span>
          </div>
        </td>
        <td className="py-3 px-4">
          <Link href={`/suggestions/${suggestion.id}`} className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
            <div className="font-medium text-slate-900 dark:text-slate-100 line-clamp-1 max-w-xs lg:max-w-md">{suggestion.title}</div>
            <div className="text-xs text-slate-400 dark:text-slate-500">@{suggestion.author_username}</div>
          </Link>
        </td>
        <td className="py-3 px-4">
          <Badge variant={isDone ? 'success' : 'default'}>
            {isDone ? tr.suggestion.status.done : tr.suggestion.status.open}
          </Badge>
        </td>
        <td className="py-3 px-4 text-sm text-slate-500 dark:text-slate-400 hidden sm:table-cell">
          {suggestion.created_at ? new Date(suggestion.created_at).toLocaleDateString('fr-FR') : '-'}
        </td>
        <td className="py-3 px-4">
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowEdit(true)}
              title={tr.admin.actions.edit}
              className="h-8 w-8 p-0"
            >
              <span className="text-base">✏️</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowLinkManager(true)}
              title="Liens"
              className="h-8 w-8 p-0 relative"
            >
              <span className="text-base">🔗</span>
              {linkCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                  {linkCount}
                </span>
              )}
            </Button>
            
            {isDone ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReopen}
                disabled={isPending}
                title={tr.admin.actions.reopen}
                className="h-8 w-8 p-0"
              >
                <span className="text-base">{isPending ? '...' : '🔄'}</span>
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowMarkDone(true)}
                title={tr.admin.actions.markDone}
                className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20"
              >
                <span className="text-base">✅</span>
              </Button>
            )}
            
            {showConfirmDelete ? (
              <div className="flex items-center gap-1 ml-1">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDelete}
                  disabled={isPending}
                  className="h-7 text-xs px-2"
                >
                  Oui
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowConfirmDelete(false)}
                  className="h-7 text-xs px-2"
                >
                  Non
                </Button>
              </div>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowConfirmDelete(true)}
                title={tr.admin.actions.delete}
                className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                <span className="text-base">🗑️</span>
              </Button>
            )}
          </div>
        </td>
      </tr>

      {mounted && showMarkDone && createPortal(
        <MarkDoneDialog
          suggestionId={suggestion.id}
          suggestionTitle={suggestion.title}
          onClose={() => setShowMarkDone(false)}
        />,
        document.body
      )}

      {mounted && showLinkManager && createPortal(
        <AdminLinkManager
          suggestionId={suggestion.id}
          suggestionTitle={suggestion.title}
          links={suggestion.links || []}
          onClose={() => setShowLinkManager(false)}
        />,
        document.body
      )}

      {mounted && showEdit && createPortal(
        <EditSuggestionModal
          suggestion={suggestion}
          tags={tags}
          onClose={() => setShowEdit(false)}
        />,
        document.body
      )}
    </>
  )
}
