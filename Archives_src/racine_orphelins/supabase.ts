import { createClient } from "https://deno.land/x/supabase_js@2.39.4/mod.ts";
import { getEnv } from "./src/lib/env.ts";

const supabaseUrl = getEnv("SUPABASE_URL") || "";
const supabaseAnonKey = getEnv("SUPABASE_ANON_KEY") || "";

const defaultUrl = 'http://localhost:54321'
const defaultAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'

export const supabase = createClient(
  supabaseUrl || defaultUrl,
  supabaseAnonKey || defaultAnonKey
)

export interface Profile {
  id: string
  email: string
  full_name: string | null
  trial_ends_at: string | null
  created_at: string
  updated_at: string
}

export interface Subscription {
  id: string
  user_id: string
  status: 'trialing' | 'active' | 'canceled' | 'incomplete' | 'incomplete_expired' | 'past_due' | 'unpaid'
  plan: 'free' | 'pro' | 'enterprise'
  current_period_end: string | null
  cancel_at: string | null
  created_at: string
  updated_at: string
}

export interface Skill {
  id: string
  name: string
  category: string
  job_skills?: Array<{
    job: {
      id: string
      title: string
      company: string
      created_at: string
    }
  }>
}

export interface UserSkill {
  id: string
  user_id: string
  skill_id: string
  proficiency_level: number
  years_experience: number
  created_at: string
  updated_at: string
  skill: Skill
}

export interface SkillResponse {
  id: string
  user_id: string
  skill_id: string
  proficiency_level: number
  years_experience: number
  created_at: string
  updated_at: string
  skill: {
    id: string
    name: string
    category: string
    job_skills: Array<{
      job: {
        id: string
        title: string
        company: string
        created_at: string
      }
    }>
  }
}

export interface Job {
  id: string
  source_id: string
  title: string
  company: string
  company_logo?: string | null
  location: string
  description: string | null
  salary_min: number | null
  salary_max: number | null
  currency: string | null
  job_type: string
  url: string
  posted_at: string
  created_at: string
  updated_at: string
  remote_type?: 'remote' | 'hybrid' | 'onsite'
  experience_level?: 'junior' | 'mid' | 'senior'
  required_skills?: string[]
  preferred_skills?: string[]
}

export interface JobSuggestion {
  job: Job
  matchScore: number
  matchingSkills: string[]
}

export interface MarketTrend {
  category: string
  count: number
  percentage: number
}

export async function getJobs(filters: {
  search?: string
  jobType?: string
  location?: string
  salaryMin?: number
  salaryMax?: number
  remote?: 'remote' | 'hybrid' | 'onsite'
  experienceLevel?: 'junior' | 'mid' | 'senior'
  sortBy?: 'date' | 'salary'
  requiredSkills?: string[]
  preferredSkills?: string[]
} = {}) {
  let query = supabase
    .from('jobs')
    .select('*')

  if (filters.search) {
    query = query.textSearch('search_vector', filters.search)
  }

  if (filters.jobType) {
    query = query.eq('job_type', filters.jobType)
  }

  if (filters.location) {
    query = query.ilike('location', `%${filters.location}%`)
  }

  if (filters.salaryMin) {
    query = query.gte('salary_min', filters.salaryMin)
  }

  if (filters.salaryMax) {
    query = query.lte('salary_max', filters.salaryMax)
  }

  if (filters.remote) {
    query = query.eq('remote_type', filters.remote)
  }

  if (filters.experienceLevel) {
    query = query.eq('experience_level', filters.experienceLevel)
  }

  if (filters.sortBy === 'salary') {
    query = query.order('salary_max', { ascending: false })
  } else {
    query = query.order('posted_at', { ascending: false })
  }

  const { data, error } = await query

  if (error) throw error
  return data as Job[]
}

export async function getJobSuggestions(userId: string): Promise<JobSuggestion[]> {
  const { data: suggestions, error } = await supabase
    .from('job_suggestions')
    .select(`
      job_id,
      match_score,
      job:jobs (*)
    `)
    .eq('user_id', userId)
    .order('match_score', { ascending: false })

  if (error) throw error

  return suggestions.map(suggestion => ({
    job: suggestion.job as unknown as Job,
    matchScore: suggestion.match_score,
    matchingSkills: []
  }))
}

export async function getMarketTrends() {
  const { data: jobs, error } = await supabase
    .from('jobs')
    .select('*')
    .order('posted_at', { ascending: false })
    .limit(1000)

  if (error) throw error

  const jobTypes = jobs.reduce((acc: Record<string, number>, job) => {
    acc[job.job_type] = (acc[job.job_type] || 0) + 1
    return acc
  }, {})

  const totalJobs = jobs.length
  const jobTypesTrends = Object.entries(jobTypes).map(([category, count]) => ({
    category,
    count,
    percentage: (count / totalJobs) * 100
  }))

  const locations = jobs.reduce((acc: Record<string, number>, job) => {
    acc[job.location] = (acc[job.location] || 0) + 1
    return acc
  }, {})

  const locationTrends = Object.entries(locations)
    .map(([category, count]) => ({
      category,
      count,
      percentage: (count / totalJobs) * 100
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  const salaries = jobs
    .filter(job => job.salary_min && job.salary_max)
    .map(job => ({
      min: job.salary_min!,
      max: job.salary_max!,
      avg: (job.salary_min! + job.salary_max!) / 2
    }))

  const avgSalary = salaries.length > 0
    ? salaries.reduce((sum, salary) => sum + salary.avg, 0) / salaries.length
    : 0

  return {
    jobTypes: jobTypesTrends,
    locations: locationTrends,
    salary: {
      average: avgSalary,
      count: salaries.length
    }
  }
}