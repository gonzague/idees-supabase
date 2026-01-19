const URL_REGEX = /(https?:\/\/[^\s<]+[^\s<.,;:!?)"'\]])/gi

export function linkifyText(text: string): { type: 'text' | 'link'; content: string }[] {
  const parts: { type: 'text' | 'link'; content: string }[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null

  const regex = new RegExp(URL_REGEX)
  
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', content: text.slice(lastIndex, match.index) })
    }
    parts.push({ type: 'link', content: match[0] })
    lastIndex = regex.lastIndex
  }

  if (lastIndex < text.length) {
    parts.push({ type: 'text', content: text.slice(lastIndex) })
  }

  return parts.length > 0 ? parts : [{ type: 'text', content: text }]
}
