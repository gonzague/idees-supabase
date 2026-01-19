'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { EditSuggestionModal } from './edit-suggestion-modal'
import type { SuggestionWithVotes, Tag } from '@/lib/types'

interface AdminEditButtonProps {
  suggestion: SuggestionWithVotes
  tags: Tag[]
}

export function AdminEditButton({ suggestion, tags }: AdminEditButtonProps) {
  const [showModal, setShowModal] = useState(false)

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowModal(true)}
        className="gap-1.5"
      >
        <span>✏️</span>
        <span>Modifier</span>
      </Button>

      {showModal && (
        <EditSuggestionModal
          suggestion={suggestion}
          tags={tags}
          onClose={() => {
            setShowModal(false)
            window.location.reload()
          }}
          showLinks
        />
      )}
    </>
  )
}
