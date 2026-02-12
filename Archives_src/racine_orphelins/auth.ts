import { supabase } from './supabase'
import { trackError, trackEvent } from './monitoring'

interface AuthError {
  message: string
  status?: number
}

export async function signIn(email: string, password: string) {
  try {
    const { data: { user }, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) throw error

    trackEvent('auth.signin.success', {
      userId: user?.id,
    })

    return { user, error: null }
  } catch (error) {
    const authError = error as AuthError
    trackError(new Error(authError.message), {
      context: 'auth.signin',
      email,
    })

    return {
      user: null,
      error: {
        message: getErrorMessage(authError),
        status: authError.status,
      },
    }
  }
}

export async function signUp(email: string, password: string) {
  try {
    // Vérifier la force du mot de passe
    if (!isStrongPassword(password)) {
      throw new Error('Le mot de passe ne respecte pas les critères de sécurité')
    }

    const { data: { user }, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: {
          full_name: email.split('@')[0],
          trial_ends_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24h trial
        }
      },
    })

    if (error) throw error

    // Créer l'abonnement d'essai
    if (user) {
      const { error: subscriptionError } = await supabase
        .from('subscriptions')
        .insert({
          user_id: user.id,
          status: 'trialing',
          plan: 'pro',
          current_period_end: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        })

      if (subscriptionError) throw subscriptionError
    }

    trackEvent('auth.signup.success', {
      userId: user?.id,
    })

    return { user, error: null }
  } catch (error) {
    const authError = error as AuthError
    trackError(new Error(authError.message), {
      context: 'auth.signup',
      email,
    })

    return {
      user: null,
      error: {
        message: getErrorMessage(authError),
        status: authError.status,
      },
    }
  }
}

export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut()
    if (error) throw error

    trackEvent('auth.signout.success')
    return { error: null }
  } catch (error) {
    const authError = error as AuthError
    trackError(new Error(authError.message), {
      context: 'auth.signout',
    })

    return {
      error: {
        message: getErrorMessage(authError),
        status: authError.status,
      },
    }
  }
}

export async function resetPassword(email: string) {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })

    if (error) throw error

    trackEvent('auth.reset_password.requested', {
      email,
    })

    return { error: null }
  } catch (error) {
    const authError = error as AuthError
    trackError(new Error(authError.message), {
      context: 'auth.reset_password',
      email,
    })

    return {
      error: {
        message: getErrorMessage(authError),
        status: authError.status,
      },
    }
  }
}

export async function updatePassword(password: string) {
  try {
    // Vérifier la force du mot de passe
    if (!isStrongPassword(password)) {
      throw new Error('Le mot de passe ne respecte pas les critères de sécurité')
    }

    const { error } = await supabase.auth.updateUser({
      password,
    })

    if (error) throw error

    trackEvent('auth.password.updated')

    return { error: null }
  } catch (error) {
    const authError = error as AuthError
    trackError(new Error(authError.message), {
      context: 'auth.update_password',
    })

    return {
      error: {
        message: getErrorMessage(authError),
        status: authError.status,
      },
    }
  }
}

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

function getErrorMessage(error: AuthError): string {
  switch (error.message) {
    case 'Invalid login credentials':
      return 'Email ou mot de passe incorrect'
    case 'Email not confirmed':
      return 'Veuillez confirmer votre adresse email'
    case 'Password should be at least 12 characters':
      return 'Le mot de passe doit contenir au moins 12 caractères'
    case 'Email already registered':
      return 'Cette adresse email est déjà utilisée'
    case 'Too many requests':
      return 'Trop de tentatives de connexion. Veuillez réessayer plus tard'
    default:
      return 'Une erreur est survenue. Veuillez réessayer'
  }
}