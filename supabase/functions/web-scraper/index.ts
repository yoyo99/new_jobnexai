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

    // Créer un client Supabase authentifié pour cette requête spécifique
    const userSupabaseClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: `Bearer ${token}` } } }
    );

    const { error: sessionError } = await userSupabaseClient
      .from('scraping_sessions')
      .upsert(session);

    if (sessionError) {
      console.error('Supabase session upsert error (raw):', sessionError);
      console.error('Supabase session upsert error (stringified):', JSON.stringify(sessionError, null, 2));
      return new Response(
        JSON.stringify({
          error: 'Database error during session creation.',
          details: sessionError.message || 'No details available',
          code: sessionError.code || 'N/A',
          rawError: sessionError,
        }),
        { status: 500, headers: corsHeaders }
      );
    }

    // Insérer une tâche dans la file d'attente des tâches
    const { data: jobQueueData, error: jobQueueError } = await userSupabaseClient
      .from('job_queue')
      .insert({
        user_id: user.id,
        session_id: sessionId,
        type: 'scraping',
        payload: { criteria, siteIds, sessionId, user_id: user.id },
        status: 'pending',
        scheduled_for: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (jobQueueError) {
      console.error('Supabase job_queue insert error:', jobQueueError);
      return new Response(
        JSON.stringify({
          error: 'Failed to queue scraping job.',
          details: jobQueueError.message,
        }),
        { status: 500, headers: corsHeaders }
      );
    }

    // Déclencher le worker de manière asynchrone (fire and forget)
    const processUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/process-job-queue`;
    if (jobQueueData) {
      fetch(processUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ jobId: jobQueueData.id })
      }).catch(err => console.error('[web-scraper] Failed to trigger process-job-queue:', err));
    }

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
