'use client'

import { useState, useCallback } from 'react'
import { useActionState } from 'react'
import { createSuggestion, CreateSuggestionState } from '@/lib/actions/suggestions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Turnstile } from '@/components/ui/turnstile'
import { RelatedContent } from './related-content'
import { SUGGESTION_TITLE_MIN, SUGGESTION_TITLE_MAX, SUGGESTION_DESC_MAX, getTagColor } from '@/lib/constants'
import { t } from '@/lib/i18n'
import type { Tag } from '@/lib/types'

interface SuggestionFormProps {
  tags?: Tag[]
}

export function SuggestionForm({ tags = [] }: SuggestionFormProps) {
  const [state, formAction, isPending] = useActionState<CreateSuggestionState, FormData>(
    createSuggestion,
    {}
  )
  const [titleValue, setTitleValue] = useState('')
  const [turnstileToken, setTurnstileToken] = useState('')
  const tr = t()

  const handleTurnstileVerify = useCallback((token: string) => {
    setTurnstileToken(token)
  }, [])

  return (
    <Card>
      <CardHeader>
        <CardTitle>{tr.form.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          {state.errors?._form && (
            <div className="p-3 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-md text-sm">
              {state.errors._form.join(', ')}
            </div>
          )}

          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
              {tr.form.titleLabel} *
            </label>
            <Input
              id="title"
              name="title"
              placeholder={tr.form.titlePlaceholder}
              minLength={SUGGESTION_TITLE_MIN}
              maxLength={SUGGESTION_TITLE_MAX}
              required
              error={state.errors?.title?.[0]}
              value={titleValue}
              onChange={(e) => setTitleValue(e.target.value)}
            />
            <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
              {tr.form.titleHint}
            </p>
            <RelatedContent query={titleValue} />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
              {tr.form.descriptionLabel}
            </label>
            <Textarea
              id="description"
              name="description"
              placeholder={tr.form.descriptionPlaceholder}
              maxLength={SUGGESTION_DESC_MAX}
              error={state.errors?.description?.[0]}
            />
            <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
              {tr.form.descriptionHint}
            </p>
          </div>

          {tags.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                Tags (optionnel)
              </label>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag, index) => (
                  <label
                    key={tag.id}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium cursor-pointer transition-all has-[:checked]:ring-2 has-[:checked]:ring-indigo-500 has-[:checked]:ring-offset-1 ${getTagColor(index)}`}
                  >
                    <input
                      type="checkbox"
                      name="tags"
                      value={tag.id}
                      className="sr-only"
                    />
                    {tag.icon && <span className="mr-1">{tag.icon}</span>}
                    {tag.name}
                  </label>
                ))}
              </div>
            </div>
          )}

          <input type="hidden" name="turnstileToken" value={turnstileToken} />
          <Turnstile onVerify={handleTurnstileVerify} />

          <Button type="submit" disabled={isPending} className="w-full">
            {isPending ? tr.form.submitting : tr.form.submit}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
