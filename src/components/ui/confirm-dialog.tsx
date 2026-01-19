'use client'

import { useEffect, useRef, useCallback } from 'react'
import { Button } from './button'

interface ConfirmDialogProps {
  isOpen: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  onConfirm: () => void
  onCancel: () => void
  variant?: 'danger' | 'default'
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = 'Confirmer',
  cancelText = 'Annuler',
  onConfirm,
  onCancel,
  variant = 'danger',
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const confirmButtonRef = useRef<HTMLButtonElement>(null)

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onCancel()
    } else if (e.key === 'Enter') {
      e.preventDefault()
      onConfirm()
    }
  }, [onCancel, onConfirm])

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      confirmButtonRef.current?.focus()
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [isOpen, handleKeyDown])

  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onCancel}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200" />
      
      <div
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-message"
        className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-sm w-full p-6 animate-in zoom-in-95 fade-in duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 
          id="confirm-title" 
          className="text-lg font-semibold text-gray-900 dark:text-white"
        >
          {title}
        </h2>
        <p 
          id="confirm-message" 
          className="mt-2 text-sm text-gray-600 dark:text-gray-300"
        >
          {message}
        </p>
        
        <div className="mt-6 flex gap-3 justify-end">
          <Button
            variant="outline"
            onClick={onCancel}
          >
            {cancelText}
          </Button>
          <Button
            ref={confirmButtonRef}
            variant={variant === 'danger' ? 'destructive' : 'default'}
            onClick={onConfirm}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  )
}
