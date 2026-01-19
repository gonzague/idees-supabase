'use client'

import { useState, useTransition } from 'react'
import { createPortal } from 'react-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { TagIconPicker } from '@/components/admin/tag-icon-picker'
import { updateSuggestion } from '@/lib/actions/suggestions'
import { addLinkToSuggestion, deleteLinkFromSuggestion, markSuggestionDone, reopenSuggestion } from '@/lib/actions/admin'
import { SuggestionWithVotes, Tag, SuggestionLink } from '@/lib/types'
import { SUGGESTION_TITLE_MIN, SUGGESTION_TITLE_MAX, SUGGESTION_DESC_MAX, PLATFORM_LABELS } from '@/lib/constants'
import { t } from '@/lib/i18n'

interface EditSuggestionModalProps {
  suggestion: SuggestionWithVotes
  tags: Tag[]
  onClose: () => void
  showLinks?: boolean
}

export function EditSuggestionModal({ suggestion, tags, onClose, showLinks = false }: EditSuggestionModalProps) {
  const [isPending, startTransition] = useTransition()
  const [title, setTitle] = useState(suggestion.title)
  const [description, setDescription] = useState(suggestion.description || '')
  const [selectedTags, setSelectedTags] = useState<string[]>(suggestion.tags?.map(t => t.id) || [])
  const [icon, setIcon] = useState(suggestion.icon || '')
  const [error, setError] = useState<string | null>(null)
  const [links, setLinks] = useState<SuggestionLink[]>(suggestion.links || [])
  const [newLinkUrl, setNewLinkUrl] = useState('')
  const [linkPending, setLinkPending] = useState(false)
  const [status, setStatus] = useState<'open' | 'done'>(suggestion.status)
  const [statusPending, setStatusPending] = useState(false)
  const i18n = t()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (title.length < SUGGESTION_TITLE_MIN || title.length > SUGGESTION_TITLE_MAX) {
      setError(`Le titre doit contenir entre ${SUGGESTION_TITLE_MIN} et ${SUGGESTION_TITLE_MAX} caractères`)
      return
    }

    startTransition(async () => {
      const result = await updateSuggestion(suggestion.id, {
        title,
        description,
        tags: selectedTags,
        icon: icon || undefined,
      })
      
      if (result.success) {
        onClose()
      } else {
        setError(result.error || 'Erreur lors de la mise à jour')
      }
    })
  }

  const toggleTag = (tagId: string) => {
    setSelectedTags(prev =>
      prev.includes(tagId)
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    )
  }

  const handleAddLink = async () => {
    if (!newLinkUrl.trim()) return
    setLinkPending(true)
    
    const result = await addLinkToSuggestion(suggestion.id, newLinkUrl.trim())
    if (result.success && result.link) {
      setLinks(prev => [...prev, result.link!])
      setNewLinkUrl('')
    } else {
      setError(result.error || 'Erreur lors de l\'ajout du lien')
    }
    setLinkPending(false)
  }

  const handleDeleteLink = async (linkId: string) => {
    setLinkPending(true)
    const result = await deleteLinkFromSuggestion(linkId)
    if (result.success) {
      setLinks(prev => prev.filter(l => l.id !== linkId))
    } else {
      setError(result.error || 'Erreur lors de la suppression du lien')
    }
    setLinkPending(false)
  }

  const handleStatusChange = async (newStatus: 'open' | 'done') => {
    if (newStatus === status) return
    setStatusPending(true)
    setError(null)

    const result = newStatus === 'done'
      ? await markSuggestionDone(suggestion.id, [])
      : await reopenSuggestion(suggestion.id)

    if (result.success) {
      setStatus(newStatus)
    } else {
      setError(result.error || 'Erreur lors du changement de statut')
    }
    setStatusPending(false)
  }

  const modal = (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-semibold mb-4">Modifier la suggestion</h2>

        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-md text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-3 items-start">
            <div>
              <label className="block text-sm font-medium mb-1">Icone</label>
              <TagIconPicker value={icon} onChange={setIcon} />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">
                {i18n.form.titleLabel} *
              </label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={i18n.form.titlePlaceholder}
                required
                minLength={SUGGESTION_TITLE_MIN}
                maxLength={SUGGESTION_TITLE_MAX}
              />
              <p className="text-xs text-gray-500 mt-1">{i18n.form.titleHint}</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              {i18n.form.descriptionLabel}
            </label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={i18n.form.descriptionPlaceholder}
              maxLength={SUGGESTION_DESC_MAX}
              rows={4}
            />
            <p className="text-xs text-gray-500 mt-1">{i18n.form.descriptionHint}</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Tags (optionnel)</label>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <label
                  key={tag.id}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium cursor-pointer transition-all ${
                    selectedTags.includes(tag.id)
                      ? 'bg-indigo-100 text-indigo-700 ring-2 ring-indigo-500'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedTags.includes(tag.id)}
                    onChange={() => toggleTag(tag.id)}
                    className="sr-only"
                  />
                  {tag.name}
                </label>
              ))}
            </div>
          </div>

          {showLinks && (
            <>
              <div>
                <label className="block text-sm font-medium mb-2">Liens</label>
                
                {links.length > 0 && (
                  <div className="space-y-2 mb-3">
                    {links.map((link) => (
                      <div key={link.id} className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <span className="text-xs px-2 py-0.5 bg-gray-200 dark:bg-gray-600 rounded">
                          {PLATFORM_LABELS[link.platform] || link.platform}
                        </span>
                        <a 
                          href={link.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex-1 text-sm text-indigo-600 dark:text-indigo-400 hover:underline truncate"
                          title={link.url}
                        >
                          {link.title || link.url}
                        </a>
                        <button
                          type="button"
                          onClick={() => handleDeleteLink(link.id)}
                          disabled={linkPending}
                          className="text-red-500 hover:text-red-700 disabled:opacity-50 p-1"
                          title="Supprimer"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                
                <div className="flex gap-2">
                  <Input
                    value={newLinkUrl}
                    onChange={(e) => setNewLinkUrl(e.target.value)}
                    placeholder="https://..."
                    className="flex-1"
                    disabled={linkPending}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAddLink}
                    disabled={linkPending || !newLinkUrl.trim()}
                  >
                    {linkPending ? '...' : '+'}
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-1">La plateforme est détectée automatiquement</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Statut</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleStatusChange('open')}
                    disabled={statusPending}
                    className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      status === 'open'
                        ? 'bg-blue-100 text-blue-700 ring-2 ring-blue-500 dark:bg-blue-900/30 dark:text-blue-400'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                    } disabled:opacity-50`}
                  >
                    🔵 Ouvert
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStatusChange('done')}
                    disabled={statusPending}
                    className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      status === 'done'
                        ? 'bg-green-100 text-green-700 ring-2 ring-green-500 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                    } disabled:opacity-50`}
                  >
                    ✅ Terminé
                  </button>
                </div>
                {statusPending && <p className="text-xs text-gray-500 mt-1">Mise à jour...</p>}
              </div>
            </>
          )}

          <div className="flex gap-2 justify-end pt-4">
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

  if (typeof window === 'undefined') return null
  return createPortal(modal, document.body)
}
