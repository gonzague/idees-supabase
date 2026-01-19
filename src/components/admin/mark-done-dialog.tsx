'use client'

import { useState, useTransition } from 'react'
import { markSuggestionDone } from '@/lib/actions/admin'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { LinkPlatform } from '@/lib/types'
import { PLATFORM_LABELS } from '@/lib/constants'
import { t } from '@/lib/i18n'
import { ContentSearch } from './content-search'
import type { ExternalSearchResult } from '@/lib/external-search/types'

interface MarkDoneDialogProps {
  suggestionId: string
  suggestionTitle: string
  onClose: () => void
}

interface LinkInput {
  platform: LinkPlatform
  url: string
}

export function MarkDoneDialog({ suggestionId, suggestionTitle, onClose }: MarkDoneDialogProps) {
  const [isPending, startTransition] = useTransition()
  const [links, setLinks] = useState<LinkInput[]>([{ platform: 'youtube', url: '' }])
  const [error, setError] = useState<string | null>(null)
  const [showSearch, setShowSearch] = useState(false)
  const i18n = t()

  const handleSelectContent = (result: ExternalSearchResult) => {
    const platform = result.platform === 'blog' ? 'other' : result.platform
    setLinks([...links.filter(l => l.url.trim() !== ''), { platform: platform as LinkPlatform, url: result.url }])
    setShowSearch(false)
  }

  const addLink = () => {
    setLinks([...links, { platform: 'youtube', url: '' }])
  }

  const removeLink = (index: number) => {
    setLinks(links.filter((_, i) => i !== index))
  }

  const updateLink = (index: number, field: keyof LinkInput, value: string) => {
    const newLinks = [...links]
    newLinks[index] = { ...newLinks[index], [field]: value }
    setLinks(newLinks)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const validLinks = links.filter(link => link.url.trim() !== '')

    startTransition(async () => {
      const result = await markSuggestionDone(suggestionId, validLinks)
      if (result.error) {
        setError(result.error)
      } else {
        onClose()
      }
    })
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-lg w-full p-6">
        <h2 className="text-lg font-semibold mb-2">{i18n.admin.markDone.title}</h2>
        <p className="text-sm text-gray-500 mb-4 line-clamp-2">{suggestionTitle}</p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="space-y-3 mb-4">
            <label className="block text-sm font-medium">{i18n.admin.markDone.addLinks}</label>
            {links.map((link, index) => (
              <div key={index} className="flex gap-2">
                <select
                  value={link.platform}
                  onChange={(e) => updateLink(index, 'platform', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  {Object.entries(PLATFORM_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
                <Input
                  type="url"
                  value={link.url}
                  onChange={(e) => updateLink(index, 'url', e.target.value)}
                  placeholder="https://..."
                  className="flex-1"
                />
                {links.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeLink(index)}
                  >
                    ×
                  </Button>
                )}
              </div>
            ))}
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" onClick={addLink}>
                {i18n.admin.markDone.addLink}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                onClick={() => setShowSearch(!showSearch)}
              >
                {showSearch ? i18n.admin.markDone.closeSearch : `🔍 ${i18n.admin.markDone.searchContent}`}
              </Button>
            </div>

            {showSearch && (
              <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                <ContentSearch 
                  initialQuery={suggestionTitle}
                  onSelect={handleSelectContent}
                />
              </div>
            )}
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
              {i18n.auth.cancel}
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? i18n.auth.loading : i18n.admin.markDone.confirm}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
