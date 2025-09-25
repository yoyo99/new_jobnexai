import { useCallback, useEffect, useMemo, useState } from 'react'

export interface FranceTravailJobFilters {
  motsCles?: string
  location?: string
  contractType?: string[]
  experience?: string[]
  salaryMin?: number
  isRemote?: boolean
  limit?: number
  offset?: number
  mock?: boolean
  save?: boolean
}

export interface FranceTravailJob {
  id: string
  title: string
  company?: string
  location?: string
  contractType?: string[]
  skills: string[]
  salaryRange?: string
  isRemote: boolean
  description: string
  url: string
  source: 'france_travail'
  lastScrapedAt: string
  createdAt: string
}

interface FetchState {
  jobs: FranceTravailJob[]
  loading: boolean
  error: string | null
  fetchedAt: string | null
}

const DEFAULT_STATE: FetchState = {
  jobs: [],
  loading: false,
  error: null,
  fetchedAt: null,
}

function buildQueryParams(filters: FranceTravailJobFilters) {
  const params = new URLSearchParams()

  if (filters.motsCles) params.set('motsCles', filters.motsCles)
  if (filters.location) params.set('location', filters.location)
  if (filters.salaryMin !== undefined) params.set('salaryMin', String(filters.salaryMin))
  if (filters.isRemote !== undefined) params.set('isRemote', String(filters.isRemote))
  if (filters.limit !== undefined) params.set('limit', String(filters.limit))
  if (filters.offset !== undefined) params.set('offset', String(filters.offset))
  if (filters.mock) params.set('mock', 'true')
  if (filters.save) params.set('save', 'true')

  filters.contractType?.forEach((type) => params.append('contractType', type))
  filters.experience?.forEach((level) => params.append('experience', level))

  return params.toString()
}

export function useFranceTravailJobs(initialFilters: FranceTravailJobFilters = {}) {
  const [state, setState] = useState<FetchState>(DEFAULT_STATE)
  const [filters, setFilters] = useState<FranceTravailJobFilters>(initialFilters)

  const queryString = useMemo(() => buildQueryParams(filters), [filters])

  const fetchJobs = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }))

    try {
      const response = await fetch(`/api/france-travail?${queryString}`)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData?.message ?? 'Erreur inconnue')
      }

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.message ?? 'La récupération des offres a échoué')
      }

      setState({
        jobs: result.data ?? [],
        loading: false,
        error: null,
        fetchedAt: result.metadata?.timestamp ?? new Date().toISOString(),
      })
    } catch (error) {
      console.error('[useFranceTravailJobs] Erreur fetch:', error)
      setState({
        jobs: [],
        loading: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue',
        fetchedAt: null,
      })
    }
  }, [queryString])

  useEffect(() => {
    fetchJobs()
  }, [fetchJobs])

  return {
    ...state,
    filters,
    setFilters,
    refetch: fetchJobs,
  }
}
