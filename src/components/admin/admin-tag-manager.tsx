'use client'

import { useState, useTransition } from 'react'
import { Tag } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createTag, deleteTag, updateTagIcon } from '@/lib/actions/suggestions'
import { getTagColor } from '@/lib/constants'
import { TagIconPicker } from './tag-icon-picker'

interface AdminTagManagerProps {
  tags: Tag[]
}

export function AdminTagManager({ tags }: AdminTagManagerProps) {
  const [isPending, startTransition] = useTransition()
  const [newTagName, setNewTagName] = useState('')
  const [newTagIcon, setNewTagIcon] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTagName.trim()) return
    
    setError(null)
    startTransition(async () => {
      const result = await createTag(newTagName.trim(), newTagIcon || undefined)
      if (result.error) {
        setError(result.error)
      } else {
        setNewTagName('')
        setNewTagIcon('')
      }
    })
  }

  const handleDelete = (tagId: string) => {
    startTransition(async () => {
      await deleteTag(tagId)
    })
  }

  const handleIconChange = (tagId: string, icon: string) => {
    startTransition(async () => {
      await updateTagIcon(tagId, icon)
    })
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg border dark:border-slate-700 p-6 space-y-6">
      <form onSubmit={handleCreate} className="flex gap-3 items-center">
        <TagIconPicker value={newTagIcon} onChange={setNewTagIcon} />
        <Input
          placeholder="Nouveau tag..."
          value={newTagName}
          onChange={(e) => setNewTagName(e.target.value)}
          className="max-w-xs"
        />
        <Button type="submit" disabled={isPending || !newTagName.trim()}>
          Ajouter
        </Button>
      </form>

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      <div className="flex flex-wrap gap-2">
        {tags.map((tag, index) => (
          <div
            key={tag.id}
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${getTagColor(index)}`}
          >
            <TagIconPicker 
              value={tag.icon ?? undefined} 
              onChange={(icon) => handleIconChange(tag.id, icon)} 
            />
            <span>{tag.name}</span>
            <button
              onClick={() => handleDelete(tag.id)}
              disabled={isPending}
              className="w-4 h-4 rounded-full bg-black/10 hover:bg-black/20 flex items-center justify-center transition-colors"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
      </div>

      {tags.length === 0 && (
        <p className="text-slate-500 text-sm">Aucun tag créé</p>
      )}
    </div>
  )
}
