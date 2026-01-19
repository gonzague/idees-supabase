import Link from 'next/link'
import { Tag } from '@/lib/types'
import { getTagColor } from '@/lib/constants'

interface TagFilterProps {
  tags: Tag[]
  selectedTagId?: string
  currentParams: Record<string, string | undefined>
}

export function TagFilter({ tags, selectedTagId, currentParams }: TagFilterProps) {
  const buildUrl = (tagId?: string) => {
    const params = new URLSearchParams()
    if (currentParams.search) params.set('search', currentParams.search)
    if (currentParams.filter) params.set('filter', currentParams.filter)
    if (currentParams.sort) params.set('sort', currentParams.sort)
    if (tagId) params.set('tag', tagId)
    return `/?${params.toString()}`
  }

  return (
    <div className="flex gap-2 items-center overflow-x-auto pb-2 scrollbar-hide">
      <span className="text-sm text-slate-500 dark:text-slate-400 shrink-0">Tags:</span>
      {selectedTagId && (
        <Link
          href={buildUrl()}
          className="px-2 py-1 rounded-full text-xs font-medium bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
        >
          Tous ×
        </Link>
      )}
      {tags.map((tag, index) => (
        <Link
          key={tag.id}
          href={buildUrl(tag.id === selectedTagId ? undefined : tag.id)}
          className={`px-2 py-1 rounded-full text-xs font-medium transition-colors shrink-0 ${
            tag.id === selectedTagId
              ? 'bg-indigo-600 text-white'
              : `${getTagColor(index)} hover:opacity-80`
          }`}
        >
          {tag.icon && <span className="mr-1">{tag.icon}</span>}
          {tag.name}
        </Link>
      ))}
    </div>
  )
}
