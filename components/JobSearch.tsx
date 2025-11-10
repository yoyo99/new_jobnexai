import { MagnifyingGlassIcon, AdjustmentsHorizontalIcon, HeartIcon, SparklesIcon, ShareIcon, GlobeAltIcon } from '@heroicons/react/24/outline'
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid'
import { motion } from 'framer-motion'
import { useEffect, useState, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import { getJobs, getJobSuggestions, type Job, type JobSuggestion, supabase } from '../src/lib/supabase'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { useAuth } from '../stores/auth'
import { ShareModal } from './ShareModal'
import { VirtualizedList } from './VirtualizedList'
import { LazyImage } from './LazyImage'
import { cache } from '../src/lib/cache'
import { LoadingSpinner } from './LoadingSpinner'

export function JobSearch() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [jobs, setJobs] = useState<Job[]>([])
  const [suggestions, setSuggestions] = useState<JobSuggestion[]>([])
  const [favorites, setFavorites] = useState<Record<string, boolean>>({})
  const [search, setSearch] = useState('')
  const [jobType, setJobType] = useState('')
  const [jobTypeN8n, setJobTypeN8n] = useState('emploi')
  const [subscriptionPlan, setSubscriptionPlan] = useState('free')
  const [location, setLocation] = useState('')
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false)
  const [salaryMin, setSalaryMin] = useState<number | ''>('')
  const [salaryMax, setSalaryMax] = useState<number | ''>('')
  const [remote, setRemote] = useState<'all' | 'remote' | 'hybrid' | 'onsite'>('all')
  const [sortBy, setSortBy] = useState<'date' | 'salary'>('date')
  const [experienceLevel, setExperienceLevel] = useState<'all' | 'junior' | 'mid' | 'senior'>('all')
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [shareJob, setShareJob] = useState<Job | null>(null)
  const [scrapingLoading, setScrapingLoading] = useState(false)

  const jobTypes = useMemo(() => [
    { value: 'FULL_TIME', label: t('jobSearch.types.fullTime') },
    { value: 'PART_TIME', label: t('jobSearch.types.partTime') },
    { value: 'CONTRACT', label: t('jobSearch.types.contract') },
    { value: 'FREELANCE', label: t('jobSearch.types.freelance') },
    { value: 'INTERNSHIP', label: t('jobSearch.types.internship') }
  ], [t])

  const remoteOptions = useMemo(() => [
    { value: 'all', label: 'Tous' },
    { value: 'remote', label: 'Full Remote' },
    { value: 'hybrid', label: 'Hybride' },
    { value: 'onsite', label: 'Sur site' }
  ], [])

  const experienceLevels = useMemo(() => [
    { value: 'all', label: 'Tous niveaux' },
    { value: 'junior', label: 'Junior (0-2 ans)' },
    { value: 'mid', label: 'Confirmé (3-5 ans)' },
    { value: 'senior', label: 'Senior (5+ ans)' }
  ], [])

  const loadJobs = useCallback(async () => {
    try {
      setLoading(true)
      
      // Générer une clé de cache basée sur les filtres
      const cacheKey = `jobs:${search}:${jobType}:${location}:${salaryMin}:${salaryMax}:${remote}:${experienceLevel}:${sortBy}`
      
      // Essayer de récupérer depuis le cache
      const data = await cache.getOrSet<Job[]>(
        cacheKey,
        async () => {
          return await getJobs({
            search,
            jobType,
            location,
            salaryMin: salaryMin ? Number(salaryMin) : undefined,
            salaryMax: salaryMax ? Number(salaryMax) : undefined,
            remote: remote === 'all' ? undefined : remote,
            experienceLevel: experienceLevel === 'all' ? undefined : experienceLevel,
            sortBy
          })
        },
        { ttl: 5 * 60 * 1000 } // 5 minutes
      )

      if (user) {
        const { data: favoritesData } = await supabase
          .from('job_favorites')
          .select('job_id')
          .eq('user_id', user.id)

        const favoritesMap: Record<string, boolean> = {}
        favoritesData?.forEach((fav: any) => {
          favoritesMap[fav.job_id] = true
        })
        setFavorites(favoritesMap)
      }

      setJobs(showFavoritesOnly ? data.filter((job: Job) => favorites[job.id]) : data)
    } catch (error) {
      console.error('Error loading jobs:', error)
    } finally {
      setLoading(false)
    }
  }, [search, jobType, location, salaryMin, salaryMax, remote, experienceLevel, sortBy, user, showFavoritesOnly, favorites])

  const loadSuggestions = useCallback(async () => {
    if (!user) return
    try {
      // Utiliser le cache pour les suggestions
      const suggestions = await cache.getOrSet<JobSuggestion[]>(
        `suggestions:${user.id}`,
        async () => await getJobSuggestions(user.id),
        { ttl: 15 * 60 * 1000 } // 15 minutes
      )
      setSuggestions(suggestions)
    } catch (error) {
      console.error('Error loading suggestions:', error)
    }
  }, [user])

  useEffect(() => {
    loadJobs()
    if (user) {
      loadSuggestions()
    }
  }, [loadJobs, loadSuggestions, user])

  useEffect(() => {
    if (user) {
      const fetchSubscription = async () => {
        try {
          const { data, error } = await supabase
            .from('subscriptions')
            .select('plan')
            .eq('user_id', user.id)
            .single()

          if (!error && data) {
            setSubscriptionPlan(data.plan)
            if (data.plan === 'free') {
              setJobTypeN8n('emploi')
            }
          }
        } catch (err) {
          console.error('Error fetching subscription:', err)
          setSubscriptionPlan('free')
        }
      }
      fetchSubscription()
    }
  }, [user])

  const handleLiveScraping = useCallback(async () => {
    if (!user) {
      toast.error('Veuillez vous connecter pour lancer une recherche')
      return
    }

    if (!search.trim()) {
      toast.error('Veuillez saisir des mots-clés de recherche')
      return
    }

    setScrapingLoading(true)
    const loadingToast = toast.loading('🔍 Recherche en cours... Cela peut prendre 30-60 secondes', { duration: 60000 })

    try {
      const keywords = search
        .split(/[,;\s]+/)
        .map((k) => k.trim())
        .filter((k) => k.length > 0)

      const payload = {
        profile_id: user.id,
        keywords: keywords.length > 0 ? keywords : [search.trim()],
        location: location?.trim() || 'France',
        jobType: jobTypeN8n,
        profileSummary: (user as any).user_metadata?.summary || ''
      }

      const webhookUrl = import.meta.env.VITE_N8N_WEBHOOK_URL || 'https://n8n.jobnexai.com/webhook/jobnexai-v2'
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(90000)
      })

      if (!response.ok) {
        throw new Error(`Erreur HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      toast.dismiss(loadingToast)

      if (data.success && data.total_found > 0) {
        toast.success(
          `✅ ${data.total_found} offre${data.total_found > 1 ? 's' : ''} pertinente${data.total_found > 1 ? 's' : ''} trouvée${
            data.total_found > 1 ? 's' : ''
          } !`,
          { duration: 5000 }
        )

        setTimeout(() => {
          loadJobs()
        }, 2000)
      } else {
        toast(data.message || 'Aucune nouvelle offre trouvée pour le moment', { duration: 4000 })
      }
    } catch (error) {
      toast.dismiss(loadingToast)

      if (error instanceof Error) {
        if (error.name === 'AbortError' || error.name === 'TimeoutError') {
          toast.error('La recherche a pris trop de temps. Veuillez réessayer.', { duration: 5000 })
        } else if (error.message.includes('Failed to fetch')) {
          toast.error('Impossible de contacter le serveur N8N. Vérifiez votre connexion.', { duration: 5000 })
        } else {
          toast.error(`Erreur lors de la recherche: ${error.message}`, { duration: 5000 })
        }
      } else {
        toast.error('Erreur inattendue lors de la recherche.', { duration: 5000 })
      }
    } finally {
      setScrapingLoading(false)
    }
  }, [user, search, location, loadJobs])

  const toggleFavorite = async (jobId: string) => {
    if (!user) return

    try {
      if (favorites[jobId]) {
        await supabase
          .from('job_favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('job_id', jobId)

        setFavorites(prev => {
          const next = { ...prev }
          delete next[jobId]
          return next
        })
      } else {
        await supabase
          .from('job_favorites')
          .insert({
            user_id: user.id,
            job_id: jobId
          })

        setFavorites(prev => ({
          ...prev,
          [jobId]: true
        }))
      }
    } catch (error) {
      console.error('Error toggling favorite:', error)
    }
  }

  const resetFilters = () => {
    setJobType('')
    setLocation('')
    setSalaryMin('')
    setSalaryMax('')
    setRemote('all')
    setExperienceLevel('all')
    setSortBy('date')
  }

  const renderJob = useCallback((job: Job, matchScore?: number, matchingSkills?: string[]) => (
    <div className="card hover:bg-white/10 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-4">
            {job.company_logo && (
              <LazyImage
                src={job.company_logo}
                alt={job.company}
                width={48}
                height={48}
                className="rounded-lg"
              />
            )}
            <div>
              <h3 className="text-lg font-semibold text-white">{job.title}</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleFavorite(job.id)}
                  className="text-primary-400 hover:text-primary-300 transition-colors"
                >
                  {favorites[job.id] ? (
                    <HeartIconSolid className="h-6 w-6" />
                  ) : (
                
                    <HeartIcon className="h-6 w-6" />
                  )}
                </button>
                <button
                  onClick={() => setShareJob(job)}
                  className="text-primary-400 hover:text-primary-300 transition-colors"
                >
                  <ShareIcon className="h-5 w-5" />
                </button>
              </div>
              {matchScore !== undefined && (
                <span className="bg-primary-600/20 text-primary-400 text-sm px-2 py-1 rounded-full">
                  {matchScore.toFixed(0)}% de correspondance
                </span>
              )}
            </div>
          </div>
          <div className="mt-1 flex flex-wrap gap-2">
            <span className="text-gray-400">{job.company}</span>
            <span className="text-gray-400">•</span>
            <span className="text-gray-400">{job.location}</span>
            <span className="text-gray-400">•</span>
            <span className="text-gray-400">{job.job_type}</span>
            {job.remote_type && (
              <>
                <span className="text-gray-400">•</span>
                <span className="text-gray-400">{job.remote_type}</span>
              </>
            )}
            {job.experience_level && (
              <>
                <span className="text-gray-400">•</span>
                <span className="text-gray-400">{job.experience_level}</span>
              </>
            )}
          </div>
          {matchingSkills && matchingSkills.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {matchingSkills.map(skill => (
                <span
                  key={skill}
                  className="bg-primary-600/20 text-primary-400 text-xs px-2 py-1 rounded-full"
                >
                  {skill}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="text-right">
          {job.salary_min && job.salary_max && (
            <span className="text-primary-400 font-semibold">
              {job.salary_min.toLocaleString()} - {job.salary_max.toLocaleString()} {job.currency}
            </span>
          )}
          <span className="block text-sm text-gray-400">
            {format(new Date(job.posted_at), 'dd MMMM yyyy', { locale: fr })}
          </span>
        </div>
      </div>
      {job.description && (
        <p className="mt-4 text-gray-400 line-clamp-3">{job.description}</p>
      )}
      <div className="mt-4">
        <a
          href={job.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary-400 hover:text-primary-300 text-sm font-medium"
        >
          {t('common.view')} →
        </a>
      </div>
    </div>
  ), [favorites, t, toggleFavorite])

  return (
    <>
      <div className="max-w-7xl mx-auto">
        <div className="card mb-8">
          <div className="max-w-2xl">
            <h1 className="text-2xl font-bold text-white mb-4">{t('jobSearch.title')}</h1>
            <p className="text-gray-400 mb-6">{t('jobSearch.subtitle')}</p>
          </div>

          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); loadJobs() }}>
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t('jobSearch.filters.keyword')}
                  className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              {subscriptionPlan === 'pro' || subscriptionPlan === 'enterprise' ? (
                <div className="flex items-center gap-4">
                  <span className="text-gray-400 text-sm">Type de poste :</span>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      value="emploi"
                      checked={jobTypeN8n === 'emploi'}
                      onChange={(e) => setJobTypeN8n(e.target.value)}
                      className="text-primary-500"
                    />
                    <span className="text-white">Emploi</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      value="freelance"
                      checked={jobTypeN8n === 'freelance'}
                      onChange={(e) => setJobTypeN8n(e.target.value)}
                      className="text-primary-500"
                    />
                    <span className="text-white">Freelance</span>
                  </label>
                </div>
              ) : (
                <div className="text-sm text-gray-400">
                  Abonnement Free : Recherche CDI uniquement
                </div>
              )}
              <button
                type="button"
                onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
                className="btn-secondary flex items-center gap-2"
              >
                <AdjustmentsHorizontalIcon className="h-5 w-5" />
                Filtres avancés
              </button>
            </div>

            {showAdvancedSearch && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-4"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">
                      Type de contrat
                    </label>
                    <select
                      value={jobType}
                      onChange={(e) => setJobType(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="">Tous les types</option>
                      {jobTypes.map((type) => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">
                      Mode de travail
                    </label>
                    <select
                      value={remote}
                      onChange={(e) => setRemote(e.target.value as any)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      {remoteOptions.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">
                      Niveau d'expérience
                    </label>
                    <select
                      value={experienceLevel}
                      onChange={(e) => setExperienceLevel(e.target.value as any)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      {experienceLevels.map((level) => (
                        <option key={level.value} value={level.value}>{level.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">
                      Localisation
                    </label>
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="Ville ou région"
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">
                      Salaire minimum
                    </label>
                    <input
                      type="number"
                      value={salaryMin}
                      onChange={(e) => setSalaryMin(e.target.value ? Number(e.target.value) : '')}
                      placeholder="Ex: 35000"
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">
                      Salaire maximum
                    </label>
                    <input
                      type="number"
                      value={salaryMax}
                      onChange={(e) => setSalaryMax(e.target.value ? Number(e.target.value) : '')}
                      placeholder="Ex: 75000"
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">
                      Trier par
                    </label>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as 'date' | 'salary')}
                      className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="date">Date de publication</option>
                      <option value="salary">Salaire</option>
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={resetFilters}
                    className="btn-secondary"
                  >
                    Réinitialiser les filtres
                  </button>
                </div>
              </motion.div>
            )}

            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowFavoritesOnly(!showFavoritesOnly)
                    loadJobs()
                  }}
                  className={`btn-secondary flex items-center gap-2 ${
                    showFavoritesOnly ? 'bg-primary-600 hover:bg-primary-500' : ''
                  }`}
                >
                  <HeartIcon className="h-5 w-5" />
                  {showFavoritesOnly ? 'Tous les emplois' : 'Voir mes favoris'}
                </button>

                {user && suggestions.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowSuggestions(!showSuggestions)}
                    className={`btn-secondary flex items-center gap-2 ${
                      showSuggestions ? 'bg-primary-600 hover:bg-primary-500' : ''
                    }`}
                  >
                    <SparklesIcon className="h-5 w-5" />
                    Suggestions
                  </button>
                )}

                <a
                  href="/app/web-scraping"
                  className="btn-secondary flex items-center gap-2"
                >
                  <GlobeAltIcon className="h-5 w-5" />
                  Scraping Web
                </a>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleLiveScraping}
                  disabled={scrapingLoading}
                  className={`px-6 py-3 rounded-lg font-semibold transition-all duration-200 flex items-center gap-2 min-w-[140px] justify-center text-white shadow-lg hover:shadow-xl ${
                    scrapingLoading
                      ? 'bg-orange-400 cursor-not-allowed opacity-75'
                      : 'bg-orange-500 hover:bg-orange-600 hover:scale-105 active:scale-95'
                  }`}
                >
                  {scrapingLoading ? (
                    <>
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      <span>Recherche...</span>
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span>Lancer la recherche</span>
                    </>
                  )}
                </button>

                <button type="submit" className="btn-primary">
                  {t('common.search')}
                </button>
              </div>
            </div>
          </form>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" text="Chargement des offres d'emploi..." />
          </div>
        ) : (
          <div className="space-y-4">
            {showSuggestions ? (
              suggestions.length > 0 ? (
                <VirtualizedList
                  items={suggestions}
                  height={600}
                  itemHeight={200}
                  renderItem={(suggestion) => (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      {renderJob(suggestion.job, suggestion.matchScore, suggestion.matchingSkills)}
                    </motion.div>
                  )}
                />
              ) : (
                <div className="text-center py-12 text-gray-400">
                  Aucune suggestion disponible. Complétez votre profil pour recevoir des suggestions personnalisées.
                </div>
              )
            ) : jobs.length > 0 ? (
              <VirtualizedList
                items={jobs}
                height={600}
                itemHeight={200}
                renderItem={(job) => (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    {renderJob(job)}
                  </motion.div>
                )}
              />
            ) : (
              <div className="text-center py-12 text-gray-400">
                Aucune offre d'emploi ne correspond à vos critères.
              </div>
            )}
          </div>
        )}
      </div>

      {shareJob && (
        <ShareModal
          isOpen={true}
          onClose={() => setShareJob(null)}
          job={shareJob}
        />
      )}
    </>
  )
}