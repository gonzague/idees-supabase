const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

interface RateLimitOptions {
  interval: number
  maxRequests: number
}

export function rateLimit(
  key: string,
  options: RateLimitOptions = { interval: 60000, maxRequests: 60 }
): { success: boolean; remaining: number; reset: number } {
  const now = Date.now()
  const record = rateLimitMap.get(key)

  if (!record || now > record.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + options.interval })
    return { success: true, remaining: options.maxRequests - 1, reset: now + options.interval }
  }

  if (record.count >= options.maxRequests) {
    return { success: false, remaining: 0, reset: record.resetTime }
  }

  record.count++
  return { success: true, remaining: options.maxRequests - record.count, reset: record.resetTime }
}

export function getRateLimitKey(ip: string, action: string): string {
  return `${ip}:${action}`
}

setInterval(() => {
  const now = Date.now()
  for (const [key, record] of rateLimitMap.entries()) {
    if (now > record.resetTime) {
      rateLimitMap.delete(key)
    }
  }
}, 60000)
