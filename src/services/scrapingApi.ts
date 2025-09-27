// src/services/scrapingApi.ts
// Service pour connecter JobNexAI au VPS de scraping N8N

const SCRAPING_API_BASE_URL = 'http://38.242.238.205:8000';

export interface ScrapingRequest {
  query: string;
  location?: string;
  max_results?: number;
  user_email?: string;
}

export interface ScrapingResponse {
  status: 'started' | 'cached' | 'queue_full' | 'error';
  job_id?: string;
  scraper: string;
  message: string;
  estimated_time?: string;
  jobs_count?: number;
  jobs?: JobResult[];
}

export interface JobResult {
  title: string;
  company: string;
  location: string;
  url: string;
  description?: string;
  salary?: string;
  source: string;
  scraped_at: string;
}

export interface ScraperInfo {
  name: string;
  description: string;
  cache_ttl: number;
  max_concurrent: number;
  webhook: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface AvailableScrapers {
  scrapers: Record<string, ScraperInfo>;
  total: number;
  categories: {
    freelance: string[];
    cdi_cdd: string[];
    difficulty: {
      easy: string[];
      medium: string[];
      hard: string[];
    };
  };
}

class ScrapingApiService {
  private baseUrl: string;

  constructor(baseUrl: string = SCRAPING_API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Récupère la liste des scrapers disponibles
   */
  async getAvailableScrapers(): Promise<AvailableScrapers> {
    try {
      const response = await fetch(`${this.baseUrl}/scrapers`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Failed to fetch available scrapers:', error);
      throw new Error('Service de scraping indisponible');
    }
  }

  /**
   * Déclenche le scraping pour un site donné
   */
  async triggerScraping(
    scraperId: string, 
    request: ScrapingRequest
  ): Promise<ScrapingResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/scrape/${scraperId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: request.query,
          location: request.location || 'France',
          max_results: request.max_results || 50,
          user_email: request.user_email,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Failed to trigger scraping for ${scraperId}:`, error);
      throw error;
    }
  }

  /**
   * Vérifie le statut d'un job de scraping
   */
  async getJobStatus(jobId: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/status/${jobId}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`Failed to get job status for ${jobId}:`, error);
      throw error;
    }
  }

  /**
   * Ouvre une connexion WebSocket pour suivre un job en temps réel
   */
  connectToJob(jobId: string, onMessage: (data: any) => void, onError?: (error: Event) => void): WebSocket {
    const wsUrl = `ws://38.242.238.205:8000/ws/${jobId}`;
    const ws = new WebSocket(wsUrl);

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onMessage(data);
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      if (onError) onError(error);
    };

    ws.onclose = () => {
      console.log('WebSocket connection closed');
    };

    return ws;
  }

  /**
   * Vérifie la santé du service de scraping
   */
  async checkHealth(): Promise<{ status: string; redis: string; timestamp: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/health`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Health check failed:', error);
      throw error;
    }
  }

  /**
   * Démarre un scraping multi-sites (lance plusieurs scrapers en parallèle)
   */
  async triggerMultiScraping(
    scraperIds: string[],
    request: ScrapingRequest
  ): Promise<Record<string, ScrapingResponse>> {
    const results: Record<string, ScrapingResponse> = {};

    // Lance tous les scrapers en parallèle
    const promises = scraperIds.map(async (scraperId) => {
      try {
        const response = await this.triggerScraping(scraperId, request);
        results[scraperId] = response;
      } catch (error) {
        results[scraperId] = {
          status: 'error',
          scraper: scraperId,
          message: error instanceof Error ? error.message : 'Erreur inconnue',
        };
      }
    });

    await Promise.allSettled(promises);
    return results;
  }
}

// Instance singleton
export const scrapingApi = new ScrapingApiService();

// Export pour tests
export { ScrapingApiService };
