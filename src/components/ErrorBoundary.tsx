import { Component, ErrorInfo, ReactNode } from 'react'
import { trackError } from '../lib/monitoring'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo?: ErrorInfo | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    }
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error
    }
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Track the error in monitoring system
    trackError(error, { 
      componentStack: errorInfo.componentStack,
      context: 'ErrorBoundary'
    })
    
    // Call onError callback if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }
    // Store errorInfo for rendering stack traces
    this.setState({ errorInfo })
  }

  override render(): ReactNode {
    if (this.state.hasError) {
      // Render custom fallback UI if provided
      if (this.props.fallback) {
        return this.props.fallback
      }
      
      // Default fallback UI with detailed diagnostic info
      return (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="card max-w-md w-full text-center p-8">
            <h2 className="text-xl font-bold text-white mb-4">
              Une erreur est survenue
            </h2>
            <p className="text-gray-400 mb-6">
              Nous sommes désolés, une erreur inattendue s'est produite. Notre équipe a été notifiée.
            </p>
            <div className="bg-white/10 rounded-lg p-4 mb-4 text-left overflow-auto max-h-56">
              <p className="text-red-400 text-sm font-mono break-words">
                {this.state.error?.message || this.state.error?.toString() || 'Unknown error'}
              </p>
            </div>
            {this.state.error?.stack && (
              <details className="text-left mb-4">
                <summary className="cursor-pointer text-sm text-gray-300">Voir la stack</summary>
                <pre className="mt-2 p-3 bg-black/40 rounded text-xs text-gray-200 overflow-auto max-h-56 whitespace-pre-wrap">{this.state.error.stack}</pre>
              </details>
            )}
            {this.state.errorInfo?.componentStack && (
              <details className="text-left mb-6">
                <summary className="cursor-pointer text-sm text-gray-300">Voir la component stack</summary>
                <pre className="mt-2 p-3 bg-black/40 rounded text-xs text-gray-200 overflow-auto max-h-56 whitespace-pre-wrap">{this.state.errorInfo.componentStack}</pre>
              </details>
            )}
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