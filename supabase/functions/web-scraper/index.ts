import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface ScrapingCriteria {
  countries: string[];
  cities: string[];
  jobTitles: string[];
  salaryRange: {
    min?: number;
    max?: number;
    currency: string;
  };
  experienceLevel: 'junior' | 'mid' | 'senior' | 'all';
  contractTypes: string[];
  remote: boolean | null;
  keywords: string[];
  freshnessFilter: {
    enabled: boolean;
    maxDays: number;
    preset: 'today' | 'week' | 'month' | 'custom';
  };
}

interface JobSite {
  id: string;
  name: string;
  baseUrl: string;
  type: 'job_board' | 'company_site' | 'freelance_platform';
  country: string;
  searchUrl: string;
  rateLimit: number;
  requiresProxy: boolean;
  active: boolean;
}

const JOB_SITES: JobSite[] = [
  {
    id: 'indeed_fr',
    name: 'Indeed France',
    baseUrl: 'https://fr.indeed.com',
    type: 'job_board',
    country: 'FR',
    searchUrl: 'https://fr.indeed.com/jobs?q={keywords}&l={location}',
    rateLimit: 2000,
    requiresProxy: true,
    active: true
  },
  {
    id: 'welcometothejungle_fr',
    name: 'Welcome to the Jungle',
    baseUrl: 'https://www.welcometothejungle.com',
    type: 'job_board',
    country: 'FR',
    searchUrl: 'https://www.welcometothejungle.com/fr/jobs?query={keywords}&refinementList%5Boffices.city%5D%5B0%5D={location}',
    rateLimit: 1500,
    requiresProxy: false,
    active: true
  },
  {
    id: 'malt_fr',
    name: 'Malt',
    baseUrl: 'https://www.malt.fr',
    type: 'freelance_platform',
    country: 'FR',
    searchUrl: 'https://www.malt.fr/projects?q={keywords}&location={location}',
    rateLimit: 2000,
    requiresProxy: false,
    active: true
  }
];

serve(async (req: Request) => {
  console.log(`[web-scraper] Received request: ${req.method} ${req.url}`);

  if (req.method === 'OPTIONS') {
    console.log('[web-scraper] Handling OPTIONS preflight request.');
    return new Response('ok', { headers: corsHeaders });
  }

  // Log all headers for debugging
    const headersObject: { [key: string]: string } = {};
  req.headers.forEach((value, key) => {
    headersObject[key] = value;
  });
  console.log('[web-scraper] Request headers:', JSON.stringify(headersObject, null, 2));

  try {
    let requestData;
    try {
      const textBody = await req.text();
      console.log('[web-scraper] Received raw body:', textBody);
      if (!textBody) {
        throw new Error('Request body is empty.');
      }
      requestData = JSON.parse(textBody);
      console.log('[web-scraper] Successfully parsed JSON body:', requestData);
    } catch (parseError) {
      console.error('[web-scraper] Error parsing JSON body:', parseError);
      return new Response(
        JSON.stringify({ 
          error: 'Invalid or empty JSON in request body.',
          details: (parseError as Error).message 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { action, criteria, sites, sessionId } = requestData;

    switch (action) {
      case 'start_scraping':
        return await startScraping(criteria, sites, sessionId, req);
      case 'get_session_status':
        return await getSessionStatus(sessionId, req);
      case 'get_scraped_jobs':
        return await getScrapedJobs(sessionId, req);
      case 'get_available_sites':
        return await getAvailableSites();
      case 'health_check':
        return new Response(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      default:
        return new Response(
          JSON.stringify({ error: 'Action non supportée', receivedAction: action }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error) {
    console.error('Erreur dans web-scraper:', error);
    return new Response(
      JSON.stringify({ error: 'Erreur interne du serveur', details: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function startScraping(criteria: ScrapingCriteria, siteIds: string[], sessionId: string, req: Request) {
  try {
    // Récupérer l'utilisateur authentifié depuis le header Authorization
    const authHeader = req.headers.get('Authorization') || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.substring('Bearer '.length) : '';
    if (!token) {
      return new Response(
        JSON.stringify({ error: 'Non autorisé', details: 'Jeton manquant' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Non autorisé', details: 'Utilisateur non authentifié' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Créer une session de scraping
    const session = {
      id: sessionId,
      criteria,
      selected_sites: siteIds,
      status: 'running',
      total_jobs: 0,
      user_id: user.id
    };

    const { error: sessionError } = await supabase
      .from('scraping_sessions')
      .upsert(session);

    if (sessionError) {
      console.error('Supabase session upsert error:', sessionError);
      return new Response(
        JSON.stringify({
          error: 'Database error during session creation.',
          details: sessionError.message,
          code: sessionError.code,
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Lancer le scraping en arrière-plan
    scrapeJobsAsync(criteria, siteIds, sessionId);

    return new Response(
      JSON.stringify({
        success: true,
        sessionId,
        message: 'Scraping démarré',
        estimatedDuration: siteIds.length * 30 // 30s par site en moyenne
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erreur lors du démarrage du scraping:', error);
    return new Response(
      JSON.stringify({ error: 'Impossible de démarrer le scraping', details: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

async function scrapeJobsAsync(criteria: ScrapingCriteria, siteIds: string[], sessionId: string) {
  const scrapedJobs: any[] = [];
  const errors: string[] = [];

  try {
    for (const siteId of siteIds) {
      const site = JOB_SITES.find(s => s.id === siteId);
      if (!site || !site.active) {
        errors.push(`Site ${siteId} non trouvé ou inactif`);
        continue;
      }

      try {
        console.log(`Scraping ${site.name}...`);
        
        // Construire les URLs de recherche
        const searchUrls = buildSearchUrls(site, criteria);
        
        for (const searchUrl of searchUrls) {
          const jobs = await scrapeSite(site, searchUrl, criteria);
          scrapedJobs.push(...jobs);
          
          // Respecter le rate limit
          await new Promise(resolve => setTimeout(resolve, site.rateLimit));
        }

      } catch (siteError) {
        console.error(`Erreur lors du scraping de ${site.name}:`, siteError);
        errors.push(`${site.name}: ${(siteError as Error).message}`);
      }
    }

    // Appliquer le filtrage par fraîcheur
    const freshJobs = filterJobsByFreshness(scrapedJobs, criteria);

    // Trier par score de fraîcheur et pertinence
    const sortedJobs = freshJobs.sort((a, b) => {
      // Priorité 1: Score de fraîcheur
      const freshnessA = a.freshness_score || 0;
      const freshnessB = b.freshness_score || 0;
      if (freshnessA !== freshnessB) {
        return freshnessB - freshnessA;
      }
      
      // Priorité 2: Date de publication (plus récent en premier)
      const dateA = new Date(a.posted_date);
      const dateB = new Date(b.posted_date);
      return dateB.getTime() - dateA.getTime();
    });

    // Sauvegarder les offres scrapées (après filtrage)
    if (sortedJobs.length > 0) {
      const { error: jobsError } = await supabase
        .from('scraped_jobs')
        .insert(sortedJobs.map(job => ({
          ...job,
          session_id: sessionId,
          scraped_at: new Date().toISOString()
        })));

      if (jobsError) {
        console.error('Erreur lors de la sauvegarde des jobs:', jobsError);
        errors.push('Erreur de sauvegarde des offres');
      }
    }

    // Mettre à jour la session
    await supabase
      .from('scraping_sessions')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        total_jobs: sortedJobs.length,
        errors,
        jobs_filtered_out: scrapedJobs.length - sortedJobs.length,
        freshness_filter: criteria.freshnessFilter
      })
      .eq('id', sessionId);

    console.log(`Scraping terminé: ${sortedJobs.length} offres fraîches trouvées (${scrapedJobs.length} total avant filtrage)`);

  } catch (error) {
    console.error('Erreur générale lors du scraping:', error);
    
    // Marquer la session comme échouée
    await supabase
      .from('scraping_sessions')
      .update({
        status: 'failed',
        completed_at: new Date().toISOString(),
        total_jobs: scrapedJobs.length,
        errors: [...errors, (error as Error).message]
      })
      .eq('id', sessionId);
  }
}

function buildSearchUrls(site: JobSite, criteria: ScrapingCriteria): string[] {
  const urls: string[] = [];
  
  // Combiner mots-clés et titres de poste
  const allKeywords = [...criteria.keywords, ...criteria.jobTitles];
  const keywordCombinations = allKeywords.length > 0 ? allKeywords : [''];
  
  // Combiner avec les villes
  const locations = criteria.cities.length > 0 ? criteria.cities : [''];
  
  for (const keywords of keywordCombinations) {
    for (const location of locations) {
      const url = site.searchUrl
        .replace('{keywords}', encodeURIComponent(keywords))
        .replace('{location}', encodeURIComponent(location));
      
      urls.push(url);
    }
  }
  
  return urls.slice(0, 10); // Limiter à 10 URLs par site
}

function scrapeSite(site: JobSite, searchUrl: string, criteria: ScrapingCriteria): any[] {
  try {
    // Simulation du scraping (remplacer par du vrai scraping avec Puppeteer/Playwright)
    console.log(`Scraping URL: ${searchUrl}`);
    
    // Pour la démo, générer des offres factices
    const mockJobs = generateMockJobs(site, criteria);
    
    return mockJobs;
    
  } catch (error) {
    console.error(`Erreur lors du scraping de ${searchUrl}:`, error);
    return [];
  }
}

// Fonction pour calculer le score de fraîcheur d'une offre
function calculateFreshnessScore(publishedDate: Date): number {
  const daysSincePublished = (Date.now() - publishedDate.getTime()) / (1000 * 60 * 60 * 24);
  
  if (daysSincePublished <= 1) return 1.0;      // Aujourd'hui = 100%
  if (daysSincePublished <= 7) return 0.8;      // Cette semaine = 80%
  if (daysSincePublished <= 30) return 0.5;     // Ce mois = 50%
  return 0.1; // Plus ancien = 10% (probablement obsolète)
}

// Fonction pour filtrer les offres par fraîcheur
function filterJobsByFreshness(jobs: any[], criteria: ScrapingCriteria): any[] {
  if (!criteria.freshnessFilter.enabled) {
    return jobs;
  }

  const cutoffDate = new Date(Date.now() - (criteria.freshnessFilter.maxDays * 24 * 60 * 60 * 1000));
  
  return jobs
    .filter(job => {
      const jobDate = new Date(job.posted_date);
      return jobDate >= cutoffDate;
    })
    .sort((a, b) => {
      // Trier par fraîcheur (plus récent en premier)
      const dateA = new Date(a.posted_date);
      const dateB = new Date(b.posted_date);
      return dateB.getTime() - dateA.getTime();
    });
}

// Fonction pour détecter automatiquement les dates de publication (pour usage futur avec Puppeteer)
function _detectPublicationDate(element: any): Date | null {
  // Patterns de dates à détecter
  const DATE_PATTERNS = {
    relative: /il y a (\d+) (jour|semaine|mois|heure)s?/i,
    relativeEn: /(\d+) (day|week|month|hour)s? ago/i,
    absolute: /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/,
    textual: /(hier|aujourd'hui|lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche)/i,
    textualEn: /(yesterday|today|monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i
  };

  // Simulation de détection de date (à remplacer par du vrai parsing HTML)
  const text = element.textContent || '';
  
  // Détecter les dates relatives françaises
  const relativeMatch = text.match(DATE_PATTERNS.relative);
  if (relativeMatch) {
    const amount = parseInt(relativeMatch[1]);
    const unit = relativeMatch[2];
    const now = new Date();
    
    switch (unit) {
      case 'heure':
        return new Date(now.getTime() - amount * 60 * 60 * 1000);
      case 'jour':
        return new Date(now.getTime() - amount * 24 * 60 * 60 * 1000);
      case 'semaine':
        return new Date(now.getTime() - amount * 7 * 24 * 60 * 60 * 1000);
      case 'mois':
        return new Date(now.getTime() - amount * 30 * 24 * 60 * 60 * 1000);
    }
  }

  // Détecter les dates absolues
  const absoluteMatch = text.match(DATE_PATTERNS.absolute);
  if (absoluteMatch) {
    const day = parseInt(absoluteMatch[1]);
    const month = parseInt(absoluteMatch[2]) - 1; // Les mois commencent à 0
    const year = parseInt(absoluteMatch[3]);
    return new Date(year, month, day);
  }

  // Si aucune date détectée, retourner null
  return null;
}

function generateMockJobs(site: JobSite, criteria: ScrapingCriteria): any[] {
  const jobs = [];
  const jobCount = Math.floor(Math.random() * 5) + 1; // 1-5 offres par recherche
  
  for (let i = 0; i < jobCount; i++) {
    // Générer une date aléatoire en respectant le filtre de fraîcheur
    let postedDate: Date;
    if (criteria.freshnessFilter.enabled) {
      // Générer une date dans la fenêtre de fraîcheur spécifiée
      const maxAgeMs = criteria.freshnessFilter.maxDays * 24 * 60 * 60 * 1000;
      postedDate = new Date(Date.now() - Math.random() * maxAgeMs);
    } else {
      // Sans filtre, générer des dates jusqu'à 30 jours
      postedDate = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000);
    }

    const job = {
      title: criteria.jobTitles[Math.floor(Math.random() * criteria.jobTitles.length)] || 'Développeur',
      company: `Entreprise ${Math.floor(Math.random() * 100)}`,
      location: criteria.cities[Math.floor(Math.random() * criteria.cities.length)] || 'Paris',
      salary: criteria.salaryRange.min ? `${criteria.salaryRange.min}-${criteria.salaryRange.max} ${criteria.salaryRange.currency}` : null,
      description: `Offre d'emploi pour ${criteria.jobTitles[0] || 'développeur'} dans une entreprise dynamique.`,
      url: `${site.baseUrl}/job/${Math.random().toString(36).substr(2, 9)}`,
      posted_date: postedDate.toISOString(),
      source: site.name,
      contract_type: criteria.contractTypes[Math.floor(Math.random() * criteria.contractTypes.length)] || 'CDI',
      remote: criteria.remote,
      freshness_score: calculateFreshnessScore(postedDate)
    };
    
    jobs.push(job);
  }
  
  return jobs;
}

async function getSessionStatus(sessionId: string, req: Request) {
  try {
    // Authentifier l'utilisateur via le header Authorization
    const authHeader = req.headers.get('Authorization') || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.substring('Bearer '.length) : '';
    if (!token) {
      return new Response(
        JSON.stringify({ error: 'Non autorisé', details: 'Jeton manquant' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Non autorisé', details: 'Utilisateur non authentifié' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Récupérer la session appartenant à l'utilisateur
    const { data, error } = await supabase
      .from('scraping_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('user_id', user.id)
      .single();

    if (error || !data) {
      return new Response(
        JSON.stringify({ error: 'Session non trouvée' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ session: data }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Erreur lors de la récupération du statut', details: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

async function getScrapedJobs(sessionId: string, req: Request) {
  try {
    // Authentifier l'utilisateur via le header Authorization
    const authHeader = req.headers.get('Authorization') || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.substring('Bearer '.length) : '';
    if (!token) {
      return new Response(
        JSON.stringify({ error: 'Non autorisé', details: 'Jeton manquant' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Non autorisé', details: 'Utilisateur non authentifié' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Vérifier que la session appartient à l'utilisateur
    const { data: session, error: sessionError } = await supabase
      .from('scraping_sessions')
      .select('id, user_id')
      .eq('id', sessionId)
      .eq('user_id', user.id)
      .single();

    if (sessionError || !session) {
      return new Response(
        JSON.stringify({ error: 'Session non trouvée' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data, error } = await supabase
      .from('scraped_jobs')
      .select('*')
      .eq('session_id', sessionId)
      .order('scraped_at', { ascending: false });

    if (error) throw error;

    return new Response(
      JSON.stringify({ jobs: data || [] }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Impossible de récupérer les offres', details: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

function getAvailableSites() {
  const activeSites = JOB_SITES.filter(site => site.active);
  
  return new Response(
    JSON.stringify({ sites: activeSites }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}
