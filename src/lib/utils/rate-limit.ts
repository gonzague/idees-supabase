const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

interface RateLimitConfig {
  maxRequests: number
  windowMs: number
}

export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig = { maxRequests: 5, windowMs: 60000 }
): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now()
  const key = identifier
  
  const existing = rateLimitMap.get(key)
  
  if (!existing || now > existing.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + config.windowMs })
    return { allowed: true, remaining: config.maxRequests - 1, resetIn: config.windowMs }
  }
  
  if (existing.count >= config.maxRequests) {
    return { 
      allowed: false, 
      remaining: 0, 
      resetIn: existing.resetAt - now 
    }
  }
  
  existing.count++
  return { 
    allowed: true, 
    remaining: config.maxRequests - existing.count, 
    resetIn: existing.resetAt - now 
  }
}

setInterval(() => {
  const now = Date.now()
  for (const [key, value] of rateLimitMap.entries()) {
    if (now > value.resetAt) {
      rateLimitMap.delete(key)
    }
  }
}, 60000)
