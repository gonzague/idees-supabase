'use client'

import { linkifyText } from '@/lib/utils/linkify'

interface LinkifiedTextProps {
  text: string
  className?: string
}

export function LinkifiedText({ text, className }: LinkifiedTextProps) {
  const parts = linkifyText(text)

  return (
    <span className={className}>
      {parts.map((part, index) => {
        if (part.type === 'link') {
          return (
            <a
              key={index}
              href={part.content}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline break-all"
            >
              {part.content}
            </a>
          )
        }
        return <span key={index}>{part.content}</span>
      })}
    </span>
  )
}
