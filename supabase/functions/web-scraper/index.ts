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

function buildSearchUrls(site: JobSite, criteria: ScrapingCriteria): string[] {
  const allKeywords = [...criteria.keywords, ...criteria.jobTitles];
  const keywordCombinations = allKeywords.length > 0 ? allKeywords : [''];
  const locations = criteria.cities.length > 0 ? criteria.cities : [''];
  const urls: string[] = [];
  
  for (const keywords of keywordCombinations) {
    for (const location of locations) {
      urls.push(site.searchUrl
        .replace('{keywords}', encodeURIComponent(keywords))
        .replace('{location}', encodeURIComponent(location)));
    }
  }
  return urls.slice(0, 10);
}

async function scrapeSite(site: JobSite, searchUrl: string, criteria: ScrapingCriteria): Promise<any[]> {
  console.log(`Simulating scraping for URL: ${searchUrl}`);
  await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 500));

  const generatedJobs = Array.from({ length: Math.floor(Math.random() * 15) + 5 }).map((_, i) => {
    const postedDate = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000);
    const jobTitle = criteria.jobTitles[i % criteria.jobTitles.length] || 'Développeur';

    return {
      id: crypto.randomUUID(),
      title: `${jobTitle} - ${site.name} (${i + 1})`,
      company: `Entreprise ${String.fromCharCode(65 + i)}`,
      location: criteria.cities[i % criteria.cities.length] || 'Paris',
      url: `${site.baseUrl}/job/${i + 1}`,
      description: `Description pour le poste de ${jobTitle}.`,
      posted_date: postedDate.toISOString(),
      site_name: site.name,
      contract_type: criteria.contractTypes[0] || 'CDI',
      remote: criteria.remote,
      freshness_score: calculateFreshnessScore(postedDate)
    };
  });

  return generatedJobs;
}

function calculateFreshnessScore(publishedDate: Date): number {
  const daysSincePublished = (Date.now() - publishedDate.getTime()) / (1000 * 60 * 60 * 24);
  if (daysSincePublished <= 1) return 1.0;
  if (daysSincePublished <= 7) return 0.8;
  if (daysSincePublished <= 30) return 0.5;
  return 0.1;
}

function filterJobsByFreshness(jobs: any[], criteria: ScrapingCriteria): any[] {
  if (!criteria.freshnessFilter.enabled) return jobs;
  const cutoffDate = new Date(Date.now() - (criteria.freshnessFilter.maxDays * 24 * 60 * 60 * 1000));
  return jobs.filter(job => new Date(job.posted_date) >= cutoffDate);
}

serve(async (req: Request) => {
  console.log(`[web-scraper] RUNNING LATEST VERSION - ${new Date().toISOString()}`);
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
      case 'start_scraping': {
        return await startScraping(criteria, sites, sessionId, req);
      }
      case 'get_scraped_jobs': {
        return await getScrapedJobs(sessionId, req);
      }
      case 'get_session_status': {
        return await getSessionStatus(sessionId, req);
      }
      case 'get_available_sites': {
        return await getAvailableSites();
      }
      case 'health_check': {
        return new Response(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      default: {
        return new Response(
          JSON.stringify({ error: 'Action non supportée', receivedAction: action }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
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
  const authHeader = req.headers.get('Authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.substring('Bearer '.length) : '';
  if (!token) {
    return new Response(JSON.stringify({ error: 'Non autorisé' }), { status: 401, headers: corsHeaders });
  }
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) {
    return new Response(JSON.stringify({ error: 'Non autorisé' }), { status: 401, headers: corsHeaders });
  }

  const userSupabaseClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  );

  await userSupabaseClient.from('scraping_sessions').upsert({
    id: sessionId, criteria, selected_sites: siteIds, status: 'running', user_id: user.id
  });

  const scrapedJobs: any[] = [];
  const errors: string[] = [];

  for (const siteId of siteIds) {
    const site = JOB_SITES.find(s => s.id === siteId);
    if (!site || !site.active) {
      errors.push(`Site ${siteId} not found or inactive`);
      continue;
    }
    try {
      const searchUrls = buildSearchUrls(site, criteria);
      for (const searchUrl of searchUrls) {
        const jobs = await scrapeSite(site, searchUrl, criteria);
        scrapedJobs.push(...jobs);
      }
      await new Promise(resolve => setTimeout(resolve, site.rateLimit));
    } catch (siteError) {
      errors.push(`${site.name}: ${(siteError as Error).message}`);
    }
  }

  const freshJobs = filterJobsByFreshness(scrapedJobs, criteria);
  const sortedJobs = freshJobs.sort((a, b) => {
      const dateA = new Date(a.posted_date).getTime();
      const dateB = new Date(b.posted_date).getTime();
      return dateB - dateA;
  });

  if (sortedJobs.length > 0) {
    const jobsToInsert = sortedJobs.map(job => ({ ...job, session_id: sessionId }));
    const { error: jobsError } = await supabase.from('scraped_jobs').insert(jobsToInsert);
    if (jobsError) {
      errors.push('Failed to save scraped jobs to database.');
      console.error(`[Job ${sessionId}] Error saving scraped jobs:`, jobsError);
    }
  }

  await supabase.from('scraping_sessions').update({
    status: 'completed',
    total_jobs: sortedJobs.length,
    errors,
  }).eq('id', sessionId);

  return new Response(JSON.stringify({ success: true, sessionId, message: 'Scraping terminé' }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
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

    // Récupérer les offres associées à la session
    const { data: jobs, error: jobsError } = await supabase
      .from('scraped_jobs')
      .select('*')
      .eq('session_id', sessionId)
      .order('posted_date', { ascending: false });

    if (jobsError) {
      console.error('Erreur get_scraped_jobs:', jobsError);
      return new Response(JSON.stringify({ error: 'Impossible de récupérer les offres' }), { status: 500, headers: corsHeaders });
    }

    return new Response(JSON.stringify({ jobs }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

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
