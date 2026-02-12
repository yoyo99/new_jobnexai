import { supabase } from './supabase'
import { trackError, trackEvent } from './monitoring'

export interface AuthError {
  message: string
  status?: number
}

export interface AuthResponse {
  user: any | null
  error: AuthError | null
}

/**
 * Service d'authentification pour gérer toutes les opérations liées à l'authentification
 */
export const AuthService = {
  /**
   * Connecte un utilisateur avec son email et son mot de passe
   */
  async signIn(email: string, password: string): Promise<AuthResponse> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      trackEvent('auth.signin.success', {
        userId: data.user?.id,
      })

      return { user: data.user, error: null }
    } catch (error: any) {
      trackError(new Error(error.message), {
        context: 'auth.signin',
        email,
      })

      return {
        user: null,
        error: {
          message: getErrorMessage(error),
          status: error.status,
        },
      }
    }
  },

  /**
   * Inscrit un nouvel utilisateur avec son email et son mot de passe
   */
  async signUp(email: string, password: string, fullName: string): Promise<AuthResponse> {
    try {
      // Vérifier la force du mot de passe
      if (!isStrongPassword(password)) {
        return {
          user: null,
          error: {
            message: 'Le mot de passe doit contenir au moins 12 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial',
            status: 400,
          }
        }
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            full_name: fullName || email.split('@')[0],
            trial_ends_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24h trial
          }
        },
      })

      if (error) throw error

      // Si l'utilisateur existe déjà
      if (data.user?.identities?.length === 0) {
        return {
          user: null,
          error: {
            message: 'Cette adresse email est déjà utilisée',
            status: 400,
          }
        }
      }

      trackEvent('auth.signup.success', {
        userId: data.user?.id,
      })

      return { user: data.user, error: null }
    } catch (error: any) {
      trackError(new Error(error.message), {
        context: 'auth.signup',
        email,
      })

      return {
        user: null,
        error: {
          message: getErrorMessage(error),
          status: error.status,
        },
      }
    }
  },

  /**
   * Déconnecte l'utilisateur actuel
   */
  async signOut(): Promise<{ error: AuthError | null }> {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error

      trackEvent('auth.signout.success')
      return { error: null }
    } catch (error: any) {
      trackError(new Error(error.message), {
        context: 'auth.signout',
      })

      return {
        error: {
          message: getErrorMessage(error),
          status: error.status,
        },
      }
    }
  },

  /**
   * Envoie un email de réinitialisation de mot de passe
   */
  async resetPassword(email: string): Promise<{ error: AuthError | null }> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })

      if (error) throw error

      trackEvent('auth.reset_password.requested', {
        email,
      })

      return { error: null }
    } catch (error: any) {
      trackError(new Error(error.message), {
        context: 'auth.reset_password',
        email,
      })

      return {
        error: {
          message: getErrorMessage(error),
          status: error.status,
        },
      }
    }
  },

  /**
   * Met à jour le mot de passe de l'utilisateur
   */
  async updatePassword(password: string): Promise<{ error: AuthError | null }> {
    try {
      // Vérifier la force du mot de passe
      if (!isStrongPassword(password)) {
        return {
          error: {
            message: 'Le mot de passe doit contenir au moins 12 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial',
            status: 400,
          }
        }
      }

      const { error } = await supabase.auth.updateUser({
        password,
      })

      if (error) throw error

      trackEvent('auth.password.updated')

      return { error: null }
    } catch (error: any) {
      trackError(new Error(error.message), {
        context: 'auth.update_password',
      })

      return {
        error: {
          message: getErrorMessage(error),
          status: error.status,
        },
      }
    }
  },

  /**
   * Récupère l'utilisateur actuellement connecté
   */
  async getCurrentUser() {
    try {
      const { data, error } = await supabase.auth.getUser()
      if (error) throw error
      
      return { user: data.user, error: null }
    } catch (error: any) {
      return {
        user: null,
        error: {
          message: getErrorMessage(error),
          status: error.status,
        },
      }
    }
  },

  /**
   * Récupère la session actuelle
   */
  async getSession() {
    try {
      const { data, error } = await supabase.auth.getSession()
      if (error) throw error
      
      return { session: data.session, error: null }
    } catch (error: any) {
      return {
        session: null,
        error: {
          message: getErrorMessage(error),
          status: error.status,
        },
      }
    }
  },

  /**
   * Met à jour le profil de l'utilisateur
   */
  async updateProfile(profile: { full_name?: string, avatar_url?: string }) {
    try {
      const { data, error } = await supabase.auth.updateUser({
        data: profile
      })

      if (error) throw error
      
      return { user: data.user, error: null }
    } catch (error: any) {
      return {
        user: null,
        error: {
          message: getErrorMessage(error),
          status: error.status,
        },
      }
    }
  }
}

/**
 * Vérifie si un mot de passe est suffisamment fort
 */
function isStrongPassword(password: string): boolean {
  const minLength = 12
  const hasUpperCase = /[A-Z]/.test(password)
  const hasLowerCase = /[a-z]/.test(password)
  const hasNumbers = /\d/.test(password)
  const hasSpecialChars = /[!@#$%^&*(),.?":{}|<>]/.test(password)

  return (
    password.length >= minLength &&
    hasUpperCase &&
    hasLowerCase &&
    hasNumbers &&
    hasSpecialChars
  )
}

/**
 * Traduit les messages d'erreur de Supabase en messages plus compréhensibles
 */
function getErrorMessage(error: any): string {
  if (!error || !error.message) {
    return 'Une erreur est survenue. Veuillez réessayer.'
  }

  const errorMessage = error.message.toLowerCase()
  
  switch (true) {
    case errorMessage.includes('invalid login credentials'):
      return 'Email ou mot de passe incorrect. Veuillez vérifier vos informations et réessayer.'
    case errorMessage.includes('email not confirmed'):
      return 'Veuillez confirmer votre adresse email avant de vous connecter.'
    case errorMessage.includes('password should be at least'):
      return 'Le mot de passe doit contenir au moins 12 caractères.'
    case errorMessage.includes('email already registered'):
      return 'Cette adresse email est déjà utilisée. Essayez de vous connecter ou utilisez la récupération de mot de passe.'
    case errorMessage.includes('too many requests'):
      return 'Trop de tentatives de connexion. Veuillez réessayer plus tard ou réinitialiser votre mot de passe.'
    case errorMessage.includes('user not found'):
      return 'Aucun compte trouvé avec cette adresse email. Vérifiez l\'orthographe ou créez un compte.'
    case errorMessage.includes('jwt expired'):
      return 'Votre session a expiré. Veuillez vous reconnecter.'
    default:
      return 'Une erreur est survenue. Veuillez réessayer ou contacter le support.'
  }
}