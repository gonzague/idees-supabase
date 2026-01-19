'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { addLinkToSuggestion, deleteLinkFromSuggestion } from '@/lib/actions/admin'
import { SuggestionLink } from '@/lib/types'
import { PLATFORM_ICONS } from '@/lib/constants'
import { t } from '@/lib/i18n'

interface AdminLinkManagerProps {
  suggestionId: string
  suggestionTitle: string
  links: SuggestionLink[]
  onClose: () => void
}

export function AdminLinkManager({ suggestionId, suggestionTitle, links: initialLinks, onClose }: AdminLinkManagerProps) {
  const [isPending, startTransition] = useTransition()
  const [links, setLinks] = useState<SuggestionLink[]>(initialLinks)
  const [newUrl, setNewUrl] = useState('')
  const [error, setError] = useState<string | null>(null)
  const i18n = t()

  const handleAddLink = () => {
    if (!newUrl.trim()) return
    setError(null)

    startTransition(async () => {
      const result = await addLinkToSuggestion(suggestionId, newUrl.trim())
      if (result.success && result.link) {
        setLinks([...links, result.link])
        setNewUrl('')
      } else {
        setError(result.error || 'Erreur')
      }
    })
  }

  const handleDeleteLink = (linkId: string) => {
    startTransition(async () => {
      const result = await deleteLinkFromSuggestion(linkId)
      if (result.success) {
        setLinks(links.filter(l => l.id !== linkId))
      } else {
        setError(result.error || 'Erreur')
      }
    })
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-lg w-full p-6 max-h-[80vh] overflow-y-auto">
        <h2 className="text-lg font-semibold mb-1">Gérer les liens</h2>
        <p className="text-sm text-gray-500 mb-4 line-clamp-2">{suggestionTitle}</p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
            {error}
          </div>
        )}

        <div className="space-y-3 mb-4">
          <label className="block text-sm font-medium">Liens existants</label>
          
          {links.length === 0 ? (
            <p className="text-sm text-gray-400 italic">Aucun lien</p>
          ) : (
            <div className="space-y-2">
              {links.map((link) => (
                <div key={link.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded-md">
                  <span className="text-lg">{PLATFORM_ICONS[link.platform] || '🔗'}</span>
                  <a 
                    href={link.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex-1 text-sm text-blue-600 hover:underline truncate"
                  >
                    {link.url}
                  </a>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteLink(link.id)}
                    disabled={isPending}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    ×
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-3 mb-4">
          <label className="block text-sm font-medium">Ajouter un lien</label>
          <div className="flex gap-2">
            <Input
              type="url"
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              placeholder="https://youtube.com/watch?v=..."
              className="flex-1"
              onKeyDown={(e) => e.key === 'Enter' && handleAddLink()}
            />
            <Button
              type="button"
              onClick={handleAddLink}
              disabled={isPending || !newUrl.trim()}
            >
              {isPending ? '...' : 'Ajouter'}
            </Button>
          </div>
          <p className="text-xs text-gray-400">
            La miniature YouTube sera récupérée automatiquement
          </p>
        </div>

        <div className="flex justify-end">
          <Button type="button" variant="outline" onClick={onClose}>
            Fermer
          </Button>
        </div>
      </div>
    </div>
  )
}
