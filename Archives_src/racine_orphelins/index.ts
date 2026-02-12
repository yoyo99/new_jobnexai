// Import necessary modules and functions
import { createClient } from 'npm:@supabase/supabase-js@2.39.3';
import { load } from 'npm:cheerio@1.0.0-rc.12';
import { verify } from 'npm:djwt@2.4.0';
import { Status } from 'https://deno.land/std@0.208.0/http/http_status.ts';

// Define a constant for default location
const DEFAULT_LOCATION = 'France';
// Define a const for full time job type
const FULL_TIME_JOB_TYPE = 'FULL_TIME';

// Retrieve Supabase URL and service role key from environment variables

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Create a Supabase client
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Define CORS headers for handling cross-origin requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Define headers for web scraping requests
const WEB_SCRAPING_HEADERS = {
  'Accept': 'text/html', // Accept HTML content
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' // Mimic a web browser
};

// Define header for WTTJ api
const WTTJ_HEADER = { 'Accept': 'application/json' };
// Define a constant for default location
const DEFAULT_LOCATION = 'France';

interface ErrorResponse {
  error: string
  code?: number
  details?: any;
}

// Function to validate JWT token and extract user ID
const validateToken = async (req: Request): Promise<string> => {
  // Retrieve the Authorization header from the request
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw { error: 'Missing Authorization header', code: Status.Unauthorized };
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    throw { error: 'Missing token', code: Status.Unauthorized };
  }

  try {
    const payload = await verify(
      token,
      Deno.env.get('JWT_SECRET')!,
      'HS256'
    );
    return payload.userId;
  } catch (err) {
    console.error('Token verification error:', err);
    throw { error: 'Invalid token', code: Status.Unauthorized };
  }
};

// Function to check if the user is an admin
const checkAdmin = async (userId: string): Promise<void> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', userId).single();

  if (error) throw error
  if (!data?.is_admin) {
    throw { error: 'Forbidden', code: Status.Forbidden }
  }
}

// Function to map the job type for Welcome to the Jungle
function mapWTTJJobType(type: string): string {
  const typeMap: Record<string, string> = {
    'full-time': 'FULL_TIME',
    'part-time': 'PART_TIME',
    'internship': 'INTERNSHIP',
    'freelance': 'FREELANCE',
    'apprenticeship': 'INTERNSHIP',
  };
  return typeMap[type.toLowerCase()] || 'FULL_TIME';
}

// Function to map data from Welcome to the Jungle
function mapWTTJJobData(job: any, sourceId: string): any {
  return {
    source_id: sourceId,
    title: job.title,
    company: job.company.name,
    location: job.office.city || DEFAULT_LOCATION,
    description: job.description,
    job_type: mapWTTJJobType(job.contract_type),
    url: `https://www.welcometothejungle.com/fr/companies/${job.company.slug}/jobs/${job.slug}`,
    posted_at: job.published_at,
  };
}

// Function to map data from LinkedIn
function mapLinkedInJobData(element: any, sourceId: string): any {
  const $el = load(element);
  const title = $el.find('.job-search-card__title').text().trim();
  const company = $el.find('.job-search-card__company-name').text().trim();
  const location = $el.find('.job-search-card__location').text().trim();
  const url = $el.find('a.job-search-card__link').attr('href') || '';
  const postedDate = $el.find('time').attr('datetime') || new Date().toISOString();

  return {
    source_id: sourceId,
    title,
    company,
    location,
    description: '',
    job_type: FULL_TIME_JOB_TYPE,
    url,
    posted_at: postedDate,
  };
}

// Function to map data from Indeed
function mapIndeedJobData(element: any, sourceId: string): any {
  const $el = load(element);
  const title = $el.find('.jobTitle').text().trim();
  const company = $el.find('.companyName').text().trim();
  const location = $el.find('.companyLocation').text().trim();
  const url = 'https://fr.indeed.com' + ($el.find('.jobTitle a').attr('href') || '');

  return {
    source_id: sourceId,
    title,
    company,
    location,
    description: '',
    job_type: FULL_TIME_JOB_TYPE,
    url,
    posted_at: new Date().toISOString(),
  };
}

// Function to scrape jobs from a given URL
async function scrapeJobs(url: string, sourceId: string, mapJobData: (job: any, sourceId: string) => any, selector?: string): Promise<any[]> {
 try {
    // Define specific headers for the request
    const specificHeaders = url.includes('welcometothejungle') ? { 'Accept': 'application/json' } : scrapingHeaders;

    // Fetch data from the URL
    const response = await fetch(url, {
      headers: {
        ...specificHeaders
      }
    });
    
    // Check if the request was successful
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    // Parse the response data
    const data = url.includes('welcometothejungle') ? await response.json() : await response.text();

    // Handle data based on its type
    if (typeof data === 'string') {
      const $ = load(data);
      const jobs: any[] = [];
      $(selector).each((_, element) => {
        jobs.push(mapJobData(element, sourceId));
      });
      return jobs;
    } else {
      return data.jobs.map((job: any) => mapJobData(job, sourceId));
    }
  } catch (error) {
    console.error(`Error scraping from ${url}:`, error);
    return [];
  }
};

// Define job sources and their scraping parameters
const jobSources: Record<string, { url: string; mapData: (job: any, sourceId: string) => any; selector?: string }> = {
  'welcome to the jungle': {
    url: 'https://api.welcometothejungle.com/api/v1/jobs?page=1&per_page=30&query=developer&language=fr',
    mapData: mapWTTJJobData,
  },
  'linkedin': {
    url: 'https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search?keywords=developer&location=France&start=0',
    mapData: mapLinkedInJobData,
    selector: '.job-search-card'
  },
  'indeed': {
    url: 'https://fr.indeed.com/jobs?q=developer&l=France&sort=date',
    mapData: mapIndeedJobData,
    selector: '.job_seen_beacon'
  },
};

// Main function to handle requests
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Authenticate the request
    const userId = await validateToken(req)
    // Check if the user is an admin
    try {
      await checkAdmin(userId)
    } catch (adminError) {
        console.error('Admin check error:', adminError);
        return new Response(JSON.stringify({ error: "Forbidden", code: Status.Forbidden, details: adminError }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: Status.Forbidden,
        })
      }

    // Get active job sources
    const { data: sources, error: sourcesError } = await supabase
      .from('job_sources')
      .select('*')
      .eq('is_active', true)

    if (sourcesError) { // Handle Supabase errors during source fetching
      console.error('Supabase error fetching job sources:', sourcesError);
      const errorResponse: ErrorResponse = { error: 'Failed to fetch job sources', code: Status.InternalServerError, details: sourcesError };
      return new Response(JSON.stringify(errorResponse), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: Status.InternalServerError,
      });
    };

    if (!sources?.length) {
      const errorResponse: ErrorResponse = { error: 'No active job sources found', code: Status.NotFound }
      return new Response(JSON.stringify(errorResponse), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: Status.NotFound,
      })
    };

    const allJobs: any[] = []; // Array to store all scraped jobs
    const errors: any[] = []; // Array to store errors from scraping

    // Scrape jobs from each active source
    for (const source of sources) {
      try {
        // Get the scraping parameters for the current source
        const sourceParams = jobSources[source.name.toLowerCase()];
        // Scrape jobs from the current source
        const jobs = await scrapeJobs(sourceParams.url, source.id, sourceParams.mapData, sourceParams.selector);
        allJobs.push(...jobs); // Add scraped jobs to the allJobs array
      } catch (scrapeError) { // Handle errors during scraping
        console.error(`Error scraping from ${source.name}:`, scrapeError);
        errors.push({source: source.name, error: scrapeError}); // Log the error
      }
    };

    // Insert jobs into the database if there are any
    if (allJobs.length > 0) {
      const { error: upsertError } = await supabase.from('jobs').upsert(allJobs, { onConflict: 'url' })

      if (upsertError) { // Handle Supabase errors during job insertion
        console.error('Supabase error inserting jobs:', upsertError)
        const errorResponse: ErrorResponse = { error: 'Failed to insert jobs', code: Status.InternalServerError, details: upsertError }
        return new Response(JSON.stringify(errorResponse), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: Status.InternalServerError,
        })
      }
    }
    // Return the results
    return new Response(
      JSON.stringify({
        message: 'Jobs scraped successfully',
        count: allJobs.length,
        sources: sources.map((s) => s.name),
        errors: errors.length > 0 ? errors: undefined,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: Status.OK,
      }
    )
  } catch (error) {
    console.error('Unhandled error:', error);
    const errorResponse: ErrorResponse = { error: 'Internal Server Error', code: Status.InternalServerError, details: error }
    return new Response(
      JSON.stringify(errorResponse),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: Status.InternalServerError,
      }
    );
  }
});