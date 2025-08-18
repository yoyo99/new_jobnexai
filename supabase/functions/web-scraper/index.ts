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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { action, criteria, sites, sessionId } = await req.json();

    switch (action) {
      case 'start_scraping':
        return await startScraping(criteria, sites, sessionId);
      case 'get_session_status':
        return await getSessionStatus(sessionId);
      case 'get_scraped_jobs':
        return await getScrapedJobs(sessionId);
      case 'get_available_sites':
        return await getAvailableSites();
      default:
        return new Response(
          JSON.stringify({ error: 'Action non supportée' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error) {
    console.error('Erreur dans web-scraper:', error);
    return new Response(
      JSON.stringify({ error: 'Erreur interne du serveur', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function startScraping(criteria: ScrapingCriteria, siteIds: string[], sessionId: string) {
  try {
    // Créer une session de scraping
    const session = {
      id: sessionId,
      criteria,
      sites: siteIds,
      status: 'running',
      started_at: new Date().toISOString(),
      total_jobs: 0,
      errors: [],
      user_id: 'system' // TODO: Récupérer l'ID utilisateur depuis le token
    };

    const { error: sessionError } = await supabase
      .from('scraping_sessions')
      .upsert(session);

    if (sessionError) {
      throw sessionError;
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
      JSON.stringify({ error: 'Impossible de démarrer le scraping', details: error.message }),
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
        errors.push(`${site.name}: ${siteError.message}`);
      }
    }

    // Sauvegarder les offres scrapées
    if (scrapedJobs.length > 0) {
      const { error: jobsError } = await supabase
        .from('scraped_jobs')
        .insert(scrapedJobs.map(job => ({
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
        total_jobs: scrapedJobs.length,
        errors
      })
      .eq('id', sessionId);

    console.log(`Scraping terminé: ${scrapedJobs.length} offres trouvées`);

  } catch (error) {
    console.error('Erreur générale lors du scraping:', error);
    
    // Marquer la session comme échouée
    await supabase
      .from('scraping_sessions')
      .update({
        status: 'failed',
        completed_at: new Date().toISOString(),
        total_jobs: scrapedJobs.length,
        errors: [...errors, error.message]
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
      let url = site.searchUrl
        .replace('{keywords}', encodeURIComponent(keywords))
        .replace('{location}', encodeURIComponent(location));
      
      urls.push(url);
    }
  }
  
  return urls.slice(0, 10); // Limiter à 10 URLs par site
}

async function scrapeSite(site: JobSite, searchUrl: string, criteria: ScrapingCriteria): Promise<any[]> {
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

function generateMockJobs(site: JobSite, criteria: ScrapingCriteria): any[] {
  const jobs = [];
  const jobCount = Math.floor(Math.random() * 5) + 1; // 1-5 offres par recherche
  
  for (let i = 0; i < jobCount; i++) {
    const job = {
      title: criteria.jobTitles[Math.floor(Math.random() * criteria.jobTitles.length)] || 'Développeur',
      company: `Entreprise ${Math.floor(Math.random() * 100)}`,
      location: criteria.cities[Math.floor(Math.random() * criteria.cities.length)] || 'Paris',
      salary: criteria.salaryRange.min ? `${criteria.salaryRange.min}-${criteria.salaryRange.max} ${criteria.salaryRange.currency}` : null,
      description: `Offre d'emploi pour ${criteria.jobTitles[0] || 'développeur'} dans une entreprise dynamique.`,
      url: `${site.baseUrl}/job/${Math.random().toString(36).substr(2, 9)}`,
      posted_date: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      source: site.name,
      contract_type: criteria.contractTypes[Math.floor(Math.random() * criteria.contractTypes.length)] || 'CDI',
      remote: criteria.remote
    };
    
    jobs.push(job);
  }
  
  return jobs;
}

async function getSessionStatus(sessionId: string) {
  try {
    const { data, error } = await supabase
      .from('scraping_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (error) throw error;

    return new Response(
      JSON.stringify({ session: data }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Session non trouvée', details: error.message }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

async function getScrapedJobs(sessionId: string) {
  try {
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
      JSON.stringify({ error: 'Impossible de récupérer les offres', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

async function getAvailableSites() {
  const activeSites = JOB_SITES.filter(site => site.active);
  
  return new Response(
    JSON.stringify({ sites: activeSites }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}
