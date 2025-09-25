import { Buffer } from 'buffer'

interface FranceTravailToken {
  access_token: string
  token_type: string
  expires_in: number
  scope: string
}

interface FranceTravailConfig {
  clientId: string
  clientSecret: string
  baseUrl: string
  tokenUrl: string
  scope: string
  rateLimitPerMinute: number
}

class FranceTravailClient {
  private config: FranceTravailConfig
  private token: FranceTravailToken | null = null
  private tokenExpiry: number = 0
  private requestQueue: Array<() => void> = []
  private isRefreshing = false

  constructor() {
    const clientId = process.env.FRANCE_TRAVAIL_CLIENT_ID
    const clientSecret = process.env.FRANCE_TRAVAIL_CLIENT_SECRET
    const baseUrl = process.env.FRANCE_TRAVAIL_BASE_URL || 'https://api.francetravail.io'
    const tokenUrl = process.env.FRANCE_TRAVAIL_TOKEN_URL || 'https://entreprise.francetravail.fr/connexion/oauth2/access_token'
    const scope = process.env.FRANCE_TRAVAIL_SCOPE || 'api_offresdemploiv2'
    const rateLimitPerMinute = Number(process.env.FRANCE_TRAVAIL_RATE_LIMIT_PER_MINUTE || 30)

    if (!clientId || !clientSecret) {
      throw new Error('FRANCE_TRAVAIL_CLIENT_ID et FRANCE_TRAVAIL_CLIENT_SECRET doivent être définis')
    }

    this.config = {
      clientId,
      clientSecret,
      baseUrl,
      tokenUrl,
      scope,
      rateLimitPerMinute,
    }

    // Rate limiting : 1 requête par 2 secondes (30/minute)
    this.setupRateLimiting()
  }

  private setupRateLimiting(): void {
    const interval = (60 / this.config.rateLimitPerMinute) * 1000
    setInterval(() => {
      if (this.requestQueue.length > 0) {
        const nextRequest = this.requestQueue.shift()
        nextRequest?.()
      }
    }, interval)
  }

  private async getAccessToken(): Promise<string> {
    // Si token existe et n'est pas expiré (avec marge de 5 minutes)
    if (this.token && Date.now() < this.tokenExpiry - 5 * 60 * 1000) {
      return this.token.access_token
    }

    // Si refresh en cours, attendre
    if (this.isRefreshing) {
      return new Promise((resolve, reject) => {
        const checkToken = () => {
          if (this.token) {
            resolve(this.token.access_token)
          } else {
            setTimeout(checkToken, 100)
          }
        }
        checkToken()
      })
    }

    this.isRefreshing = true

    try {
      const response = await fetch(this.config.tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${Buffer.from(`${this.config.clientId}:${this.config.clientSecret}`).toString('base64')}`,
        },
        body: new URLSearchParams({
          grant_type: 'client_credentials',
          scope: this.config.scope,
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Erreur OAuth2: ${response.status} ${response.statusText} - ${errorText}`)
      }

      this.token = await response.json()
      this.tokenExpiry = Date.now() + (this.token.expires_in * 1000)

      console.log('[France Travail] Token renouvelé')
      return this.token.access_token
    } catch (error) {
      console.error('[France Travail] Erreur renouvellement token:', error)
      throw error
    } finally {
      this.isRefreshing = false
    }
  }

  async makeRequest<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    // Ajouter à la queue pour rate limiting
    return new Promise((resolve, reject) => {
      this.requestQueue.push(async () => {
        try {
          const token = await this.getAccessToken()
          const url = new URL(`${this.config.baseUrl}${endpoint}`)

          if (params) {
            Object.entries(params).forEach(([key, value]) => {
              if (value !== undefined && value !== null) {
                url.searchParams.append(key, String(value))
              }
            })
          }

          const response = await fetch(url.toString(), {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Accept': 'application/json',
            },
          })

          if (!response.ok) {
            const errorText = await response.text()
            throw new Error(`Erreur API France Travail: ${response.status} ${response.statusText} - ${errorText}`)
          }

          const data = await response.json()
          resolve(data)
        } catch (error) {
          reject(error)
        }
      })
    })
  }

  // Méthode principale pour rechercher des offres
  async searchJobs(params: {
    motsCles?: string
    commune?: string
    departement?: string
    region?: string
    pays?: string
    typeContrat?: string[]
    experience?: string[]
    salaireMin?: number
    tempsPlein?: boolean
    teletravail?: boolean
    range?: number // rayon en km
    limit?: number
    offset?: number
  }): Promise<any> {
    const queryParams: Record<string, any> = {
      ...params,
      range: params.range || 20,
      limit: params.limit || 10,
      offset: params.offset || 0,
    }

    return this.makeRequest('/partenaire/offresdemploiv2/search', queryParams)
  }

  // Récupérer les détails d'une offre spécifique
  async getJobDetails(jobId: string): Promise<any> {
    return this.makeRequest(`/partenaire/offresdemploiv2/offre/${jobId}`)
  }
}

// Instance singleton
let franceTravailClient: FranceTravailClient | null = null

export function getFranceTravailClient(): FranceTravailClient {
  if (!franceTravailClient) {
    franceTravailClient = new FranceTravailClient()
  }
  return franceTravailClient
}

// Export pour tests avec mock
export { FranceTravailClient }
