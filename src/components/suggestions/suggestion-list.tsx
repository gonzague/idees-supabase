import { SuggestionWithVotes } from '@/lib/types'
import { SuggestionCard } from './suggestion-card'
import { t } from '@/lib/i18n'

interface SuggestionListProps {
  suggestions: SuggestionWithVotes[]
  votedIds: Set<string>
}

export function SuggestionList({ suggestions, votedIds }: SuggestionListProps) {
  const tr = t()

  if (suggestions.length === 0) {
    return (
      <div className="text-center py-16 text-slate-500">
        <div className="text-4xl mb-3">💡</div>
        <p>{tr.home.noSuggestions}</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {suggestions.map((suggestion) => (
        <SuggestionCard
          key={suggestion.id}
          suggestion={suggestion}
          hasVoted={votedIds.has(suggestion.id)}
        />
      ))}
    </div>
  )
}
