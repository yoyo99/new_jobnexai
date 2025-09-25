import type { PostgrestSingleResponse } from '@supabase/supabase-js'
import type { NormalizedJobOffer } from './franceTravailNormalizer'
import { getSupabaseServiceRoleClient } from './supabaseServiceRoleClient'

interface SaveResult {
  inserted: number
  skipped: number
  errors: Array<{ url: string; reason: string }>
}

const FRANCE_TRAVAIL_SOURCE_KEY = 'france-travail'

async function getFranceTravailSourceId() {
  const supabase = getSupabaseServiceRoleClient()
  const response = await supabase
    .from('job_sources')
    .select('id')
    .eq('source_key', FRANCE_TRAVAIL_SOURCE_KEY)
    .maybeSingle()

  handlePostgrestError(response, 'récupération source France Travail')

  return response.data?.id ?? null
}

async function ensureFranceTravailSource() {
  const existing = await getFranceTravailSourceId()

  if (existing) {
    return existing
  }

  const supabase = getSupabaseServiceRoleClient()
  const response = await supabase
    .from('job_sources')
    .insert({
      source_key: FRANCE_TRAVAIL_SOURCE_KEY,
      name: 'France Travail',
      url: 'https://www.francetravail.fr',
      priority: 1,
      is_active: true,
    })
    .select('id')
    .single()

  handlePostgrestError(response, 'création source France Travail')

  return response.data!.id
}

export async function saveFranceTravailOffers(offers: NormalizedJobOffer[]): Promise<SaveResult> {
  if (offers.length === 0) {
    return {
      inserted: 0,
      skipped: 0,
      errors: [],
    }
  }

  const supabase = getSupabaseServiceRoleClient()
  const sourceId = await ensureFranceTravailSource()

  const rows = offers.map((offer) => ({
    source_id: sourceId,
    url: offer.url,
    title: offer.title,
    contract_type: offer.contractType ?? [],
    required_skills: offer.skills,
    salary_range: offer.salaryRange ?? null,
    is_remote: offer.isRemote,
    location: offer.location ?? null,
    description: offer.description,
    company_name: offer.company ?? null,
    experience_level: null,
    last_scraped_at: offer.lastScrapedAt,
    created_at: offer.createdAt,
  }))

  const response = await supabase
    .from('jobnexai_external_jobs')
    .upsert(rows, {
      onConflict: 'url',
      ignoreDuplicates: true,
    })
    .select('url')

  handlePostgrestError(response, 'sauvegarde offres France Travail')

  const insertedUrls = response.data?.map((row) => row.url) ?? []
  const inserted = insertedUrls.length
  const skipped = offers.length - inserted

  return {
    inserted,
    skipped,
    errors: [],
  }
}

function handlePostgrestError<T>(
  response: PostgrestSingleResponse<T>,
  context: string
) {
  if (response.error) {
    console.error(`[FranceTravailRepository] Erreur ${context}:`, response.error)
    throw response.error
  }
}
