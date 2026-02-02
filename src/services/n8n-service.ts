import { supabase } from '../lib/supabase';

// Configuration N8N
const N8N_BASE_URL = import.meta.env.VITE_N8N_URL || 'https://n8n.jobnexai.com';

// Types
export interface CVAnalysisRequest {
  cvFile: File;
  jobUrl: string;
  userEmail: string;
}

export interface CVAnalysisResult {
  id: string;
  matching_score: number;
  strengths: string[];
  weaknesses: string[];
  skills_match: {
    matched: string[];
    missing: string[];
  };
  experience_match: string;
  recommendation: string;
  key_insights: string[];
  interview_questions: string[];
  analyzed_at: string;
}

export interface JobScrapingRequest {
  searchQuery: string;
  location?: string;
  source: 'linkedin' | 'indeed' | 'wttj' | 'malt';
}

export type JobSource = 'indeed' | 'linkedin' | 'malt' | 'free-work' | 'wttj';

export interface MultiSourceScrapingRequest {
  query: string;
  location?: string;
  contractType?: 'all' | 'cdi' | 'cdd' | 'freelance' | 'stage' | 'alternance';
  experienceLevel?: 'all' | 'junior' | 'confirme' | 'senior' | 'lead';
  remote?: boolean;
  salaryMin?: number;
  salaryMax?: number;
  maxResults?: number;
  selectedSites?: JobSource[];
  userId?: string;
  userEmail?: string;
}

export interface MultiSourceScrapingResponse {
  sessionId: string;
  html: string;
  totalJobs: number;
  jobsBySource: Record<string, number>;
  status: 'success' | 'partial' | 'error';
  errors?: string[];
}

export interface ScrapedJob {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  url: string;
  skills?: string[];
  experience_level?: string;
  remote_type?: string;
  scraped_at: string;
}

/**
 * Service pour interagir avec les workflows N8N
 */
export class N8NService {
  /**
   * Analyser un CV avec Mammouth.ai via N8N
   */
  static async analyzeCVWithJob(request: CVAnalysisRequest): Promise<CVAnalysisResult> {
    try {
      // 1. Upload CV vers Supabase Storage
      const fileName = `${Date.now()}-${request.cvFile.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('cvs')
        .upload(`${request.userEmail}/${fileName}`, request.cvFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // 2. Obtenir URL publique
      const { data: { publicUrl } } = supabase.storage
        .from('cvs')
        .getPublicUrl(uploadData.path);

      // 3. Appeler webhook N8N
      const response = await fetch(`${N8N_BASE_URL}/webhook/cv-screening`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cv_url: publicUrl,
          job_url: request.jobUrl,
          user_email: request.userEmail
        })
      });

      if (!response.ok) {
        throw new Error(`N8N webhook failed: ${response.statusText}`);
      }

      // 4. Attendre que N8N traite (polling Supabase)
      const result = await this.pollForCVAnalysis(request.userEmail);
      
      return result;
    } catch (error) {
      console.error('Error analyzing CV:', error);
      throw error;
    }
  }

  /**
   * Polling pour récupérer résultat analyse CV
   */
  private static async pollForCVAnalysis(
    userEmail: string,
    maxAttempts = 30,
    intervalMs = 2000
  ): Promise<CVAnalysisResult> {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const { data, error } = await supabase
        .from('cv_analyses')
        .select('*')
        .eq('user_email', userEmail)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (data && !error) {
        return data as CVAnalysisResult;
      }

      // Attendre avant prochain essai
      await new Promise(resolve => setTimeout(resolve, intervalMs));
    }

    throw new Error('Timeout waiting for CV analysis');
  }

  /**
   * Récupérer historique analyses CV
   */
  static async getCVAnalysisHistory(userEmail: string): Promise<CVAnalysisResult[]> {
    const { data, error } = await supabase
      .from('cv_analyses')
      .select('*')
      .eq('user_email', userEmail)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as CVAnalysisResult[];
  }

  /**
   * Lancer scraping jobs via N8N
   */
  static async scrapeJobs(request: JobScrapingRequest): Promise<void> {
    try {
      const webhookUrl = this.getScrapingWebhookUrl(request.source);
      
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          search_query: request.searchQuery,
          location: request.location || 'France'
        })
      });

      if (!response.ok) {
        throw new Error(`N8N scraping webhook failed: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error scraping jobs:', error);
      throw error;
    }
  }

  /**
   * Récupérer jobs scrapés récemment
   */
  static async getScrapedJobs(
    source?: string,
    limit = 50
  ): Promise<ScrapedJob[]> {
    let query = supabase
      .from('jobs')
      .select('*')
      .order('scraped_at', { ascending: false })
      .limit(limit);

    if (source) {
      query = query.eq('scraping_source', source);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data as ScrapedJob[];
  }

  /**
   * Obtenir URL webhook selon la source
   */
  private static getScrapingWebhookUrl(source: string): string {
    const webhooks: Record<string, string> = {
      linkedin: `${N8N_BASE_URL}/webhook/linkedin-scraping`,
      indeed: `${N8N_BASE_URL}/webhook/indeed-scraping`,
      wttj: `${N8N_BASE_URL}/webhook/wttj-scraping`,
      malt: `${N8N_BASE_URL}/webhook/malt-scraping`
    };

    return webhooks[source] || `${N8N_BASE_URL}/webhook/linkedin-scraping`;
  }

  /**
   * Vérifier statut N8N
   */
  static async checkN8NHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${N8N_BASE_URL}/healthz`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Obtenir statistiques scraping
   */
  static async getScrapingStats() {
    const { data, error } = await supabase
      .rpc('get_scraping_stats');

    if (error) throw error;
    return data;
  }

  /**
   * Lancer scraping multi-sources via N8N
   * Scrape plusieurs sites d'emploi en parallèle et retourne une page HTML avec les résultats
   */
  static async scrapeJobsMultiSource(
    request: MultiSourceScrapingRequest
  ): Promise<MultiSourceScrapingResponse> {
    try {
      const defaultSites: JobSource[] = ['indeed', 'linkedin', 'malt', 'free-work', 'wttj'];

      const payload = {
        query: request.query,
        location: request.location || 'France',
        contract_type: request.contractType || 'all',
        experience_level: request.experienceLevel || 'all',
        remote: request.remote || false,
        salary_min: request.salaryMin || null,
        salary_max: request.salaryMax || null,
        max_results: request.maxResults || 20,
        selected_sites: request.selectedSites || defaultSites,
        user_id: request.userId || null,
        user_email: request.userEmail || null
      };

      const response = await fetch(`${N8N_BASE_URL}/webhook/job-search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`N8N multi-source scraping failed: ${response.statusText}`);
      }

      // Le workflow retourne directement du HTML
      const contentType = response.headers.get('content-type');

      if (contentType?.includes('text/html')) {
        const html = await response.text();
        const sessionId = response.headers.get('X-Session-Id') || '';
        const totalJobs = parseInt(response.headers.get('X-Total-Jobs') || '0', 10);

        return {
          sessionId,
          html,
          totalJobs,
          jobsBySource: {},
          status: 'success'
        };
      }

      // Fallback si JSON
      const data = await response.json();
      return {
        sessionId: data.session_id || '',
        html: data.html || '',
        totalJobs: data.total_jobs || 0,
        jobsBySource: data.jobs_by_source || {},
        status: data.status || 'success',
        errors: data.errors
      };
    } catch (error) {
      console.error('Error in multi-source scraping:', error);
      throw error;
    }
  }

  /**
   * Récupérer les résultats d'une session de scraping
   */
  static async getScrapingSessionResults(sessionId: string): Promise<ScrapedJob[]> {
    const { data, error } = await supabase
      .from('scraped_jobs')
      .select('*')
      .eq('session_id', sessionId)
      .order('posted_date', { ascending: false });

    if (error) throw error;
    return data as ScrapedJob[];
  }

  /**
   * Récupérer le statut d'une session de scraping
   */
  static async getScrapingSessionStatus(sessionId: string) {
    const { data, error } = await supabase
      .from('scraping_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Récupérer l'historique des sessions de scraping d'un utilisateur
   */
  static async getUserScrapingHistory(userId: string, limit = 10) {
    const { data, error } = await supabase
      .from('scraping_sessions')
      .select(`
        *,
        scraped_jobs (count)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  }

  /**
   * Sites de scraping disponibles avec leurs caractéristiques
   */
  static getAvailableSources(): Record<JobSource, { name: string; category: string; description: string }> {
    return {
      'indeed': {
        name: 'Indeed',
        category: 'cdi_cdd',
        description: 'Agrégateur d\'offres d\'emploi - CDI/CDD'
      },
      'linkedin': {
        name: 'LinkedIn Jobs',
        category: 'cdi_cdd',
        description: 'Réseau professionnel mondial - CDI/CDD'
      },
      'malt': {
        name: 'Malt',
        category: 'freelance',
        description: 'Plateforme freelance française #2'
      },
      'free-work': {
        name: 'Free-Work',
        category: 'freelance',
        description: 'Plateforme freelance française #1'
      },
      'wttj': {
        name: 'Welcome to the Jungle',
        category: 'cdi_cdd',
        description: 'Startups et tech français'
      }
    };
  }
}
