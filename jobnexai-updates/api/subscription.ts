/**
 * Client API pour la gestion des abonnements
 */

export interface Subscription {
  id: string
  plan: 'trial' | 'pro' | 'enterprise'
  status: 'active' | 'cancelled' | 'expired'
  trialEndsAt: string | null
  currentPeriodEnd: string | null
}

export interface SubscriptionStatus {
  success: boolean
  hasSubscription: boolean
  subscription?: {
    id: string
    plan: string
    status: string
    trialEndsAt: string | null
    currentPeriodEnd: string | null
    isExpired: boolean
    remainingTimeHours: number | null
  }
}

export interface LimitCheck {
  success: boolean
  plan: string
  limits: {
    applications: number | null
    jobSearches: number | null
    cvOptimizations: number | null
  }
  usage: {
    applications: number
  }
  check: {
    canProceed: boolean
    current: number
    limit: number | null
    remaining: number | null
    reason?: string
  }
}

export const subscriptionApi = {
  /**
   * Démarrer un essai de 24h
   */
  async startTrial(userId: string, email: string, name?: string) {
    const response = await fetch('/api/subscription/start-trial', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, email, name })
    })

    return response.json()
  },

  /**
   * Vérifier le statut de l'abonnement
   */
  async getStatus(userId: string): Promise<SubscriptionStatus> {
    const response = await fetch(`/api/subscription/status?userId=${userId}`)
    return response.json()
  },

  /**
   * Upgrader vers un plan payant
   */
  async upgrade(userId: string, plan: 'pro' | 'enterprise') {
    const response = await fetch('/api/subscription/upgrade', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, plan })
    })

    return response.json()
  },

  /**
   * Vérifier les limites (candidatures, etc.)
   */
  async checkLimit(userId: string, action: string = 'apply'): Promise<LimitCheck> {
    const response = await fetch(`/api/subscription/check-limit?userId=${userId}&action=${action}`)
    return response.json()
  }
}

export const jobApplicationApi = {
  /**
   * Créer une candidature
   */
  async create(userId: string, jobId: string) {
    const response = await fetch('/api/job-application', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, jobId })
    })

    return response.json()
  },

  /**
   * Récupérer les candidatures d'un utilisateur
   */
  async list(userId: string) {
    const response = await fetch(`/api/job-application?userId=${userId}`)
    return response.json()
  }
}
