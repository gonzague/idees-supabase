'use client'

import { useTransition, useOptimistic } from 'react'
import { toggleVote } from '@/lib/actions/votes'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils/cn'

interface VoteButtonProps {
  suggestionId: string
  initialVoteCount: number
  initialHasVoted: boolean
}

export function VoteButton({
  suggestionId,
  initialVoteCount,
  initialHasVoted,
}: VoteButtonProps) {
  const [isPending, startTransition] = useTransition()
  const [optimisticState, setOptimisticState] = useOptimistic(
    { voteCount: initialVoteCount, hasVoted: initialHasVoted },
    (state, newHasVoted: boolean) => ({
      voteCount: state.voteCount + (newHasVoted ? 1 : -1),
      hasVoted: newHasVoted,
    })
  )

  const handleClick = () => {
    startTransition(async () => {
      setOptimisticState(!optimisticState.hasVoted)
      await toggleVote(suggestionId)
    })
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleClick}
      disabled={isPending}
      className={cn(
        'flex flex-col items-center justify-center gap-0.5 h-auto py-2 min-w-[60px] rounded-xl border transition-all duration-200',
        optimisticState.hasVoted 
          ? 'bg-indigo-50 border-indigo-200 text-indigo-600 hover:bg-indigo-100 hover:border-indigo-300 dark:bg-indigo-950 dark:border-indigo-800 dark:text-indigo-400' 
          : 'bg-white border-slate-200 text-slate-500 hover:border-indigo-300 hover:bg-slate-50 hover:text-indigo-600 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:border-indigo-700 dark:hover:bg-gray-700'
      )}
    >
      <span className={cn("text-xl leading-none transition-transform duration-200", optimisticState.hasVoted && "scale-110")}>
        ▲
      </span>
      <span className="font-bold text-sm">{optimisticState.voteCount}</span>
    </Button>
  )
}
