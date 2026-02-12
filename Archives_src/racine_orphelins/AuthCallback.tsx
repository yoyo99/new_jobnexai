import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export function AuthCallback() {
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Récupérer le hash de l'URL
        const hash = window.location.hash

        // Traiter le callback d'authentification
        const { data, error } = await supabase.auth.getSession()

        if (error) {
          throw error
        }

        if (data.session) {
          // Rediriger vers le dashboard
          navigate('/dashboard')
        } else {
          // Si pas de session, rediriger vers la page de connexion
          navigate('/login')
        }
      } catch (error: any) {
        console.error('Error handling auth callback:', error)
        setError(error.message || 'Une erreur est survenue lors de l\'authentification')
      }
    }

    handleAuthCallback()
  }, [navigate])

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 text-center">
        {error ? (
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
              Erreur d'authentification
            </h2>
            <p className="mt-2 text-center text-sm text-red-400">
              {error}
            </p>
            <div className="mt-6">
              <button
                onClick={() => navigate('/login')}
                className="btn-primary"
              >
                Retour à la connexion
              </button>
            </div>
          </div>
        ) : (
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
              Authentification en cours...
            </h2>
            <div className="mt-6 flex justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-400"></div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}