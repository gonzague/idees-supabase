'use client'

import { Component, ReactNode } from 'react'
import { Button } from '@/components/ui/button'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-[400px] flex items-center justify-center">
          <div className="text-center p-8 max-w-md">
            <div className="text-6xl mb-4">😵</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Oups, quelque chose s'est mal passé
            </h2>
            <p className="text-gray-500 mb-4">
              Une erreur inattendue s'est produite. Veuillez réessayer.
            </p>
            <Button
              onClick={() => {
                this.setState({ hasError: false, error: undefined })
                window.location.reload()
              }}
            >
              Recharger la page
            </Button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
