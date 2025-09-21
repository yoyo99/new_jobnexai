import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

interface JobFilters {
  skills?: string[]
  contract_type?: string[]
  is_remote?: boolean
  location?: string
  source_id?: string[]
  experience_level?: string
  limit?: number
  offset?: number
}

interface ExternalJob {
  id: number
  source_id: string
  url: string
  title: string
  contract_type: string[]
  required_skills: string[]
  salary_range?: string
  is_remote: boolean
  location?: string
  description?: string
  company_name?: string
  experience_level?: string
  last_scraped_at: string
  created_at: string
  source_name?: string
  source_priority?: number
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    const url = new URL(req.url)
    const method = req.method

    switch (method) {
      case 'GET':
        return await handleGetJobs(supabaseClient, url)
      case 'POST':
        return await handleCreateJob(supabaseClient, req)
      case 'PUT':
        return await handleUpdateJob(supabaseClient, req)
      case 'DELETE':
        return await handleDeleteJob(supabaseClient, url)
      default:
        return new Response(
          JSON.stringify({ error: 'Method not allowed' }),
          { 
            status: 405, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
    }
  } catch (error) {
    console.error('Error in external-jobs function:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

async function handleGetJobs(supabaseClient: any, url: URL) {
  const searchParams = url.searchParams
  
  // Parse filters from query parameters
  const filters: JobFilters = {
    skills: searchParams.get('skills')?.split(',').filter(s => s.trim()),
    contract_type: searchParams.get('contract_type')?.split(',').filter(s => s.trim()),
    is_remote: searchParams.get('is_remote') === 'true' ? true : 
                searchParams.get('is_remote') === 'false' ? false : undefined,
    location: searchParams.get('location') || undefined,
    source_id: searchParams.get('source_id')?.split(',').filter(s => s.trim()),
    experience_level: searchParams.get('experience_level') || undefined,
    limit: parseInt(searchParams.get('limit') || '20'),
    offset: parseInt(searchParams.get('offset') || '0')
  }

  // Build query with joins
  let query = supabaseClient
    .from('jobnexai_external_jobs')
    .select(`
      *,
      job_sources!inner(
        name,
        priority
      )
    `)

  // Apply filters
  if (filters.skills && filters.skills.length > 0) {
    query = query.overlaps('required_skills', filters.skills)
  }

  if (filters.contract_type && filters.contract_type.length > 0) {
    query = query.overlaps('contract_type', filters.contract_type)
  }

  if (filters.is_remote !== undefined) {
    query = query.eq('is_remote', filters.is_remote)
  }

  if (filters.location) {
    query = query.ilike('location', `%${filters.location}%`)
  }

  if (filters.source_id && filters.source_id.length > 0) {
    query = query.in('source_id', filters.source_id)
  }

  if (filters.experience_level) {
    query = query.eq('experience_level', filters.experience_level)
  }

  // Apply pagination and ordering
  query = query
    .order('last_scraped_at', { ascending: false })
    .range(filters.offset!, filters.offset! + filters.limit! - 1)

  const { data: jobs, error, count } = await query

  if (error) {
    console.error('Database error:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to fetch jobs', details: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }

  // Transform data to include source info
  const transformedJobs: ExternalJob[] = jobs?.map((job: any) => ({
    ...job,
    source_name: job.job_sources?.name,
    source_priority: job.job_sources?.priority,
    job_sources: undefined // Remove nested object
  })) || []

  // Get total count for pagination
  const { count: totalCount } = await supabaseClient
    .from('jobnexai_external_jobs')
    .select('*', { count: 'exact', head: true })

  return new Response(
    JSON.stringify({
      jobs: transformedJobs,
      pagination: {
        total: totalCount || 0,
        limit: filters.limit,
        offset: filters.offset,
        has_more: (filters.offset! + filters.limit!) < (totalCount || 0)
      },
      filters_applied: filters
    }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  )
}

async function handleCreateJob(supabaseClient: any, req: Request) {
  const jobData = await req.json()

  // Validate required fields
  const requiredFields = ['source_id', 'url', 'title']
  const missingFields = requiredFields.filter(field => !jobData[field])
  
  if (missingFields.length > 0) {
    return new Response(
      JSON.stringify({ 
        error: 'Missing required fields', 
        missing: missingFields 
      }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }

  // Add timestamp
  jobData.last_scraped_at = new Date().toISOString()

  const { data, error } = await supabaseClient
    .from('jobnexai_external_jobs')
    .insert(jobData)
    .select()
    .single()

  if (error) {
    console.error('Insert error:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to create job', details: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }

  return new Response(
    JSON.stringify({ job: data, message: 'Job created successfully' }),
    {
      status: 201,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  )
}

async function handleUpdateJob(supabaseClient: any, req: Request) {
  const url = new URL(req.url)
  const jobId = url.searchParams.get('id')
  
  if (!jobId) {
    return new Response(
      JSON.stringify({ error: 'Job ID is required' }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }

  const updateData = await req.json()
  updateData.last_scraped_at = new Date().toISOString()

  const { data, error } = await supabaseClient
    .from('jobnexai_external_jobs')
    .update(updateData)
    .eq('id', jobId)
    .select()
    .single()

  if (error) {
    console.error('Update error:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to update job', details: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }

  return new Response(
    JSON.stringify({ job: data, message: 'Job updated successfully' }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  )
}

async function handleDeleteJob(supabaseClient: any, url: URL) {
  const jobId = url.searchParams.get('id')
  
  if (!jobId) {
    return new Response(
      JSON.stringify({ error: 'Job ID is required' }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }

  const { error } = await supabaseClient
    .from('jobnexai_external_jobs')
    .delete()
    .eq('id', jobId)

  if (error) {
    console.error('Delete error:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to delete job', details: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }

  return new Response(
    JSON.stringify({ message: 'Job deleted successfully' }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  )
}

/* 
USAGE EXAMPLES:

1. Get all jobs:
GET /functions/v1/external-jobs

2. Filter by skills:
GET /functions/v1/external-jobs?skills=React,TypeScript&limit=10

3. Filter by remote jobs:
GET /functions/v1/external-jobs?is_remote=true&source_id=free-work,pylote

4. Filter by location and experience:
GET /functions/v1/external-jobs?location=Paris&experience_level=Senior

5. Create a new job:
POST /functions/v1/external-jobs
{
  "source_id": "free-work",
  "url": "https://www.free-work.com/offres/123",
  "title": "Développeur React Senior",
  "contract_type": ["mission"],
  "required_skills": ["React", "TypeScript", "Node.js"],
  "salary_range": "500-700€/jour",
  "is_remote": true,
  "location": "Paris",
  "description": "Mission de développement...",
  "company_name": "TechCorp",
  "experience_level": "Senior"
}

6. Update a job:
PUT /functions/v1/external-jobs?id=123
{
  "salary_range": "550-750€/jour",
  "is_remote": false
}

7. Delete a job:
DELETE /functions/v1/external-jobs?id=123
*/
