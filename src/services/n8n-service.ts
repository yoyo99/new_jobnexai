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
}
