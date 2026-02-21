import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'

function AuthCallback() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        setLoading(true)
        
        // Vérifier s'il y a des fragments d'URL d'erreur OAuth
        const hashParams = new URLSearchParams(location.hash.substring(1))
        const errorDescription = hashParams.get('error_description')
        
        if (errorDescription) {
          throw new Error(errorDescription)
        }

        // Utiliser getSession() pour une récupération plus rapide
        const { data, error } = await supabase.auth.getSession()

        if (error) {
          throw error
        }

        if (data.session) {
          // Vérifier si c'est une nouvelle connexion OAuth
          const urlParams = new URLSearchParams(location.search)
          const isOAuth = urlParams.get('code') || hashParams.get('access_token')
          
          if (isOAuth) {
            console.log('OAuth authentication successful')
            // Créer ou mettre à jour le profil utilisateur de manière asynchrone (non bloquant)
            supabase
              .from('profiles')
              .upsert({
                id: data.session.user.id,
                email: data.session.user.email,
                full_name: data.session.user.user_metadata?.full_name || data.session.user.user_metadata?.name,
                avatar_url: data.session.user.user_metadata?.avatar_url,
                updated_at: new Date().toISOString()
              })
              .then(({ error: profileError }) => {
                if (profileError) {
                  console.warn('Profile creation/update failed:', profileError)
                }
              })
          }
          
          // Rediriger immédiatement sans attendre la mise à jour du profil
          const from = location.state?.from?.pathname || '/app/dashboard'
          navigate(from, { replace: true })
        } else {
          // Si pas de session, rediriger vers la page de connexion
          navigate('/login', { replace: true })
        }
      } catch (error: any) {
        console.error('Error handling auth callback:', error)
        setError(error.message || 'Une erreur est survenue lors de l\'authentification')
      } finally {
        setLoading(false)
      }
    }

    // Exécuter immédiatement sans délai
    handleAuthCallback()
  }, [navigate, location])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 text-center">
          <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
            Authentification en cours...
          </h2>
          <div className="mt-6 flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-400"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 text-center">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
            Erreur d'authentification
          </h2>
          <p className="mt-2 text-center text-sm text-red-400">
            {error}
          </p>
          <div className="mt-6">
            <button
              onClick={() => navigate('/login', { replace: true })}
              className="btn-primary"
            >
              Retour à la connexion
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AuthCallback;