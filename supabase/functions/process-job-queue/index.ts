import { createClient } from '../_shared/deps.ts';
import { corsHeaders } from "../_shared/cors.ts";

// --- TYPES AND CONSTANTS FOR SCRAPING ---
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

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

// --- JOB PROCESSING LOGIC ---

async function processScraping(payload: any) {
  const { criteria, siteIds, sessionId, user_id } = payload;

  if (!criteria || !siteIds || !sessionId || !user_id) {
    throw new Error('Invalid scraping job payload. Missing required fields.');
  }

  const scrapedJobs: any[] = [];
  const errors: string[] = [];

  try {
    for (const siteId of siteIds) {
      const site = JOB_SITES.find(s => s.id === siteId);
      if (!site || !site.active) {
        errors.push(`Site ${siteId} not found or inactive`);
        continue;
      }

      try {
        console.log(`[Job ${sessionId}] Scraping ${site.name}...`);
        const searchUrls = buildSearchUrls(site, criteria);
        
        for (const searchUrl of searchUrls) {
          const jobs = await scrapeSite(site, searchUrl, criteria);
          scrapedJobs.push(...jobs);
        }
        // Appliquer le rate limit une seule fois par site, pas par page
        await new Promise(resolve => setTimeout(resolve, site.rateLimit));
      } catch (siteError) {
        console.error(`[Job ${sessionId}] Error scraping site ${site.name}:`, siteError);
        errors.push(`${site.name}: ${(siteError as Error).message}`);
      }
    }

    const freshJobs = filterJobsByFreshness(scrapedJobs, criteria);
    const sortedJobs = freshJobs.sort((a, b) => {
        const freshnessA = a.freshness_score || 0;
        const freshnessB = b.freshness_score || 0;
        if (freshnessA !== freshnessB) return freshnessB - freshnessA;
        const dateA = new Date(a.posted_date);
        const dateB = new Date(b.posted_date);
        return dateB.getTime() - dateA.getTime();
    });

    if (sortedJobs.length > 0) {
      const jobsToInsert = sortedJobs.map(job => ({
        ...job,
        session_id: sessionId,
        user_id: payload.user_id,
        scraped_at: new Date().toISOString()
      }));

      const { error: jobsError } = await supabase.from('scraped_jobs').insert(jobsToInsert);
      if (jobsError) {
        console.error(`[Job ${sessionId}] Error saving scraped jobs:`, jobsError);
        errors.push('Failed to save scraped jobs to database.');
      }
    }

    const { error: sessionUpdateError } = await supabase
      .from('scraping_sessions')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        total_jobs: sortedJobs.length,
        errors,
        jobs_filtered_out: scrapedJobs.length - sortedJobs.length,
      })
      .eq('id', sessionId);

    if (sessionUpdateError) {
      console.error(`[Job ${sessionId}] Error updating scraping session:`, sessionUpdateError);
    }
    
    console.log(`[Job ${sessionId}] Scraping session completed. Found ${sortedJobs.length} jobs.`);
    return { success: true, jobs_found: sortedJobs.length, errors };

  } catch (error) {
    console.error(`[Job ${sessionId}] General error in scraping session:`, error);
    await supabase
      .from('scraping_sessions')
      .update({
        status: 'failed',
        completed_at: new Date().toISOString(),
        errors: [...errors, (error as Error).message],
      })
      .eq('id', sessionId);
    throw error;
  }
}

function processMatching(payload: unknown) {
  console.log('Processing matching job:', payload);
  return { success: true, message: 'Matching not implemented yet.' };
}

function processApplication(payload: unknown) {
  console.log('Processing application job:', payload);
  return { success: true, message: 'Application not implemented yet.' };
}

// --- SCRAPING HELPER FUNCTIONS ---

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

  // Simule un délai réseau pour rendre le mock plus réaliste et justifier l'async
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
      source: site.name,
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


// --- MAIN SERVER AND JOB RUNNER ---

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  let processedCount = 0;

  try {
    // Tenter de traiter un job spécifique passé en paramètre (pour les déclenchements immédiats)
    if (req.body) {
      try {
        const { jobId } = await req.json();
        if (jobId) {
          console.log(`[Worker] Triggered for specific job ID: ${jobId}`);
          const { data: specificJob, error: specificJobError } = await supabase
            .from('job_queue')
            .select('*')
            .eq('id', jobId)
            .single();
          
          if (specificJobError) console.error(`[Worker] Error fetching specific job ${jobId}:`, specificJobError);

          if (specificJob && specificJob.status === 'pending') {
            await processJob(specificJob);
            processedCount++;
          }
        }
      } catch (_e) {
        // Ignorer l'erreur si le body est vide ou mal formé, et continuer normalement
      }
    }

    // Traiter le reste de la file d'attente (batch normal)
    const { data: pendingJobs, error: fetchError } = await supabase
      .from('job_queue')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_for', new Date().toISOString())
      .limit(10);

    if (fetchError) throw fetchError;

    for (const job of pendingJobs || []) {
      await processJob(job);
      processedCount++;
    }

    return new Response(JSON.stringify({ processed: processedCount }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    const error = e instanceof Error ? e : new Error(String(e));
    console.error('Error processing job queue:', error);
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
});

async function processJob(job: any) {
  console.log(`Processing job ${job.id} of type ${job.type}`);
  await supabase
    .from('job_queue')
    .update({ status: 'processing', updated_at: new Date().toISOString() })
    .eq('id', job.id);

  try {
    let result: unknown;
    switch (job.type) {
      case 'scraping':
        result = await processScraping(job.payload);
        break;
      case 'matching':
        result = processMatching(job.payload);
        break;
      case 'application':
        result = processApplication(job.payload);
        break;
      default:
        throw new Error(`Unknown job type: ${job.type}`);
    }

    await supabase.from('job_results').insert({ job_id: job.id, result });
    await supabase
      .from('job_queue')
      .update({ status: 'completed', updated_at: new Date().toISOString() })
      .eq('id', job.id);
    console.log(`Job ${job.id} completed successfully.`);

  } catch (e) {
    const error = e instanceof Error ? e : new Error(String(e));
    console.error(`Error processing job ${job.id}:`, error);
    await supabase
      .from('job_queue')
      .update({
        status: 'failed',
        attempts: (job.attempts ?? 0) + 1,
        last_error: error.message,
        updated_at: new Date().toISOString(),
      })
      .eq('id', job.id);
  }
}
