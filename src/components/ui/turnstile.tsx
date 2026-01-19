'use client'

import { useEffect, useRef, useCallback } from 'react'

declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement, options: TurnstileOptions) => string
      reset: (widgetId: string) => void
      remove: (widgetId: string) => void
    }
    onTurnstileLoad?: () => void
  }
}

interface TurnstileOptions {
  sitekey: string
  callback: (token: string) => void
  'error-callback'?: () => void
  'expired-callback'?: () => void
  theme?: 'light' | 'dark' | 'auto'
  size?: 'normal' | 'compact' | 'flexible'
}

interface TurnstileProps {
  onVerify: (token: string) => void
  onError?: () => void
  onExpire?: () => void
}

export function Turnstile({ onVerify, onError, onExpire }: TurnstileProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const widgetIdRef = useRef<string | null>(null)

  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY

  const renderWidget = useCallback(() => {
    if (!containerRef.current || !window.turnstile || !siteKey) return
    if (widgetIdRef.current) return

    widgetIdRef.current = window.turnstile.render(containerRef.current, {
      sitekey: siteKey,
      callback: onVerify,
      'error-callback': onError,
      'expired-callback': onExpire,
      theme: 'auto',
      size: 'flexible',
    })
  }, [siteKey, onVerify, onError, onExpire])

  useEffect(() => {
    if (!siteKey) return

    if (window.turnstile) {
      renderWidget()
      return
    }

    const existingScript = document.querySelector('script[src*="turnstile"]')
    if (!existingScript) {
      const script = document.createElement('script')
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onTurnstileLoad'
      script.async = true
      document.head.appendChild(script)
    }

    window.onTurnstileLoad = renderWidget

    return () => {
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current)
        widgetIdRef.current = null
      }
    }
  }, [siteKey, renderWidget])

  if (!siteKey) {
    return null
  }

  return <div ref={containerRef} />
}
