import React, { Component, ErrorInfo, ReactNode } from 'react'
import { trackError } from '../lib/monitoring'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null
    }
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Track the error in monitoring system
    trackError(error, { 
      componentStack: errorInfo.componentStack,
      context: 'ErrorBoundary'
    })
    
    // Call onError callback if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }
  }

  render(): ReactNode {
    if (this.state.hasError) {
      // Render custom fallback UI if provided
      if (this.props.fallback) {
        return this.props.fallback
      }
      
      // Default fallback UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="card max-w-md w-full text-center p-8">
            <h2 className="text-xl font-bold text-white mb-4">
              Une erreur est survenue
            </h2>
            <p className="text-gray-400 mb-6">
              Nous sommes désolés, une erreur inattendue s'est produite. Notre équipe a été notifiée.
            </p>
            <div className="bg-white/10 rounded-lg p-4 mb-6 text-left overflow-auto max-h-40">
              <p className="text-red-400 text-sm font-mono">
                {this.state.error?.toString()}
              </p>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="btn-primary w-full"
            >
              Rafraîchir la page
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}