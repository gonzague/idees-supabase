const HTML_ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
}

export function escapeHtml(str: string): string {
  return str.replace(/[&<>"'/]/g, (char) => HTML_ENTITIES[char] || char)
}

export function sanitizeUserInput(input: string): string {
  return escapeHtml(input.trim())
}

export function stripHtmlTags(str: string): string {
  return str.replace(/<[^>]*>/g, '')
}

export function sanitizeUrl(url: string): string {
  try {
    const parsed = new URL(url)
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return ''
    }
    return parsed.toString()
  } catch {
    return ''
  }
}

export function sanitizePocketBaseFilter(input: string): string {
  return input
    .replace(/['"\\]/g, '')
    .replace(/[(){}[\]]/g, '')
    .replace(/(\|\||&&)/g, '')
    .trim()
    .slice(0, 200)
}

export function isValidPocketBaseId(id: string): boolean {
  return /^[a-z0-9]{15}$/.test(id)
}

export function isInternalUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    const hostname = parsed.hostname.toLowerCase()
    
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '0.0.0.0') {
      return true
    }
    
    if (/^192\.168\./.test(hostname)) return true
    if (/^10\./.test(hostname)) return true
    if (/^172\.(1[6-9]|2\d|3[01])\./.test(hostname)) return true
    if (/^169\.254\./.test(hostname)) return true
    if (hostname.endsWith('.local')) return true
    
    return false
  } catch {
    return true
  }
}
