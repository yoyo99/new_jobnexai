import type { Handler } from '@netlify/functions'
import { createClient } from '@supabase/supabase-js'

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json'
}

const supabaseUrl = process.env.SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error('[jobs-search] Missing Supabase credentials in environment variables')
}

const supabase = supabaseUrl && serviceRoleKey
  ? createClient(supabaseUrl, serviceRoleKey)
  : null

type JobFiltersPayload = {
  search?: string
  jobType?: string
  location?: string
  salaryMin?: number
  salaryMax?: number
  remote?: 'remote' | 'hybrid' | 'onsite' | 'all'
  experienceLevel?: 'junior' | 'mid' | 'senior' | 'all'
  sortBy?: 'date' | 'salary'
  currency?: string
}

const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders, body: '' }
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    }
  }

  if (!supabase) {
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Supabase client not configured' })
    }
  }

  try {
    const filters = (event.body ? JSON.parse(event.body) : {}) as JobFiltersPayload

    let query = supabase
      .from('jobs')
      .select('*')
      .limit(120)

    if (filters.sortBy === 'salary') {
      query = query.order('salary_max', { ascending: false })
    } else {
      query = query.order('posted_at', { ascending: false })
    }

    if (filters.search) {
      query = query.textSearch('search_vector', filters.search)
    }
    if (filters.jobType) {
      query = query.eq('job_type', filters.jobType)
    }
    if (filters.location) {
      query = query.ilike('location', `%${filters.location}%`)
    }
    if (typeof filters.salaryMin === 'number') {
      query = query.gte('salary_min', filters.salaryMin)
    }
    if (typeof filters.salaryMax === 'number') {
      query = query.lte('salary_max', filters.salaryMax)
    }
    if (filters.remote && filters.remote !== 'all') {
      query = query.eq('remote_type', filters.remote)
    }
    if (filters.experienceLevel && filters.experienceLevel !== 'all') {
      query = query.eq('experience_level', filters.experienceLevel)
    }
    if (filters.currency) {
      query = query.eq('currency', filters.currency)
    }

    const { data, error } = await query

    if (error) {
      console.error('[jobs-search] Supabase error', error)
      return {
        statusCode: 500,
        headers: corsHeaders,
        body: JSON.stringify({ error: error.message })
      }
    }

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ data: data ?? [] })
    }
  } catch (err) {
    console.error('[jobs-search] Unexpected error', err)
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Internal Server Error' })
    }
  }
}

export { handler }
