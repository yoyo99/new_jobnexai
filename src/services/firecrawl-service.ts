/**
 * Firecrawl Service - Web scraping via Firecrawl API
 * Hébergé sur VPS Coolify
 */

const FIRECRAWL_API_URL = process.env.FIRECRAWL_API_URL || process.env.VITE_FIRECRAWL_API_URL || '';
const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY || process.env.VITE_FIRECRAWL_API_KEY || '';

export interface ScrapeOptions {
  formats?: ('markdown' | 'html' | 'rawHtml' | 'links' | 'screenshot')[];
  onlyMainContent?: boolean;
  waitFor?: number;
  timeout?: number;
  includeTags?: string[];
  excludeTags?: string[];
}

export interface ScrapeResult {
  success: boolean;
  data?: {
    markdown?: string;
    html?: string;
    rawHtml?: string;
    links?: string[];
    metadata: {
      title: string;
      description: string;
      sourceURL: string;
      statusCode: number;
    };
  };
  error?: string;
}

export interface CrawlOptions {
  limit?: number;
  maxDepth?: number;
  includePaths?: string[];
  excludePaths?: string[];
  scrapeOptions?: ScrapeOptions;
}

export interface CrawlResult {
  success: boolean;
  id?: string;
  data?: ScrapeResult[];
  error?: string;
}

export interface MapResult {
  success: boolean;
  links?: string[];
  error?: string;
}

export class FirecrawlService {
  private static getHeaders() {
    return {
      'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
      'Content-Type': 'application/json'
    };
  }

  /**
   * Vérifie si Firecrawl est configuré
   */
  static isConfigured(): boolean {
    return Boolean(FIRECRAWL_API_URL && FIRECRAWL_API_KEY);
  }

  /**
   * Scrape une page unique et retourne le contenu
   */
  static async scrapePage(url: string, options?: ScrapeOptions): Promise<ScrapeResult> {
    if (!this.isConfigured()) {
      return { success: false, error: 'Firecrawl not configured' };
    }

    try {
      const response = await fetch(`${FIRECRAWL_API_URL}/v1/scrape`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          url,
          formats: options?.formats || ['markdown'],
          onlyMainContent: options?.onlyMainContent ?? true,
          waitFor: options?.waitFor || 2000,
          timeout: options?.timeout || 30000,
          includeTags: options?.includeTags,
          excludeTags: options?.excludeTags
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Firecrawl scrape error:', response.status, errorText);
        return { success: false, error: `HTTP ${response.status}: ${errorText}` };
      }

      return await response.json();
    } catch (error) {
      console.error('Firecrawl scrape exception:', error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Scrape une offre d'emploi et retourne le contenu Markdown
   */
  static async scrapeJobPage(jobUrl: string): Promise<ScrapeResult> {
    return this.scrapePage(jobUrl, {
      formats: ['markdown'],
      onlyMainContent: true,
      waitFor: 3000, // Attendre le chargement JS
      excludeTags: ['nav', 'footer', 'header', 'aside', '.sidebar', '.ads']
    });
  }

  /**
   * Crawl multiple pages (liste de résultats de recherche)
   */
  static async crawlJobListings(searchUrl: string, options?: CrawlOptions): Promise<CrawlResult> {
    if (!this.isConfigured()) {
      return { success: false, error: 'Firecrawl not configured' };
    }

    try {
      const response = await fetch(`${FIRECRAWL_API_URL}/v1/crawl`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          url: searchUrl,
          limit: options?.limit || 20,
          maxDepth: options?.maxDepth || 2,
          includePaths: options?.includePaths,
          excludePaths: options?.excludePaths,
          scrapeOptions: {
            formats: ['markdown'],
            onlyMainContent: true,
            ...options?.scrapeOptions
          }
        })
      });

      if (!response.ok) {
        return { success: false, error: `HTTP ${response.status}` };
      }

      return await response.json();
    } catch (error) {
      console.error('Firecrawl crawl exception:', error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Map d'un site pour découvrir les URLs d'offres
   */
  static async mapJobSite(siteUrl: string, limit = 100): Promise<MapResult> {
    if (!this.isConfigured()) {
      return { success: false, error: 'Firecrawl not configured' };
    }

    try {
      const response = await fetch(`${FIRECRAWL_API_URL}/v1/map`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          url: siteUrl,
          limit
        })
      });

      if (!response.ok) {
        return { success: false, error: `HTTP ${response.status}` };
      }

      return await response.json();
    } catch (error) {
      console.error('Firecrawl map exception:', error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Scrape les résultats de recherche d'Indeed
   */
  static async scrapeIndeed(query: string, location: string, limit = 10): Promise<ScrapeResult[]> {
    const searchUrl = `https://fr.indeed.com/emplois?q=${encodeURIComponent(query)}&l=${encodeURIComponent(location)}`;

    // D'abord, récupérer la page de résultats
    const searchResult = await this.scrapePage(searchUrl, {
      formats: ['links', 'markdown'],
      waitFor: 3000
    });

    if (!searchResult.success || !searchResult.data?.links) {
      return [];
    }

    // Filtrer les liens d'offres
    const jobLinks = searchResult.data.links
      .filter(link => link.includes('/viewjob') || link.includes('/rc/clk'))
      .slice(0, limit);

    // Scraper chaque offre
    const results: ScrapeResult[] = [];
    for (const link of jobLinks) {
      const jobResult = await this.scrapeJobPage(link);
      if (jobResult.success) {
        results.push(jobResult);
      }
    }

    return results;
  }

  /**
   * Scrape les résultats de recherche de Welcome to the Jungle
   */
  static async scrapeWTTJ(query: string, location: string, limit = 10): Promise<ScrapeResult[]> {
    const searchUrl = `https://www.welcometothejungle.com/fr/jobs?query=${encodeURIComponent(query)}&aroundQuery=${encodeURIComponent(location)}`;

    const crawlResult = await this.crawlJobListings(searchUrl, {
      limit,
      includePaths: ['/fr/companies/*/jobs/*'],
      excludePaths: ['/fr/articles', '/fr/pages']
    });

    return crawlResult.data || [];
  }

  /**
   * Scrape les missions Malt
   */
  static async scrapeMalt(query: string, location: string, limit = 10): Promise<ScrapeResult[]> {
    const searchUrl = `https://www.malt.fr/s?q=${encodeURIComponent(query)}&searchCity=${encodeURIComponent(location)}`;

    const crawlResult = await this.crawlJobListings(searchUrl, {
      limit,
      includePaths: ['/project/*'],
      excludePaths: ['/profile', '/freelance']
    });

    return crawlResult.data || [];
  }

  /**
   * Scrape les offres Free-Work
   */
  static async scrapeFreeWork(query: string, location: string, limit = 10): Promise<ScrapeResult[]> {
    const searchUrl = `https://www.free-work.com/fr/tech-it/jobs?query=${encodeURIComponent(query)}&localisation=${encodeURIComponent(location)}`;

    const crawlResult = await this.crawlJobListings(searchUrl, {
      limit,
      includePaths: ['/fr/tech-it/job/*']
    });

    return crawlResult.data || [];
  }
}

export default FirecrawlService;
