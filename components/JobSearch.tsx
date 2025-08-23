import { MagnifyingGlassIcon, AdjustmentsHorizontalIcon, HeartIcon, SparklesIcon, ShareIcon } from '@heroicons/react/24/outline'
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid'
import { motion } from 'framer-motion'
import { useEffect, useState, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { getJobs, getJobSuggestions, type Job, type JobSuggestion, supabase } from '../lib/supabase'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { useAuth } from '../stores/auth'
import { ShareModal } from './ShareModal'
import { VirtualizedList } from './VirtualizedList'
import { LazyImage } from './LazyImage'
import { cache } from '../lib/cache'
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
            salaryMin: salaryMin || undefined,
            salaryMax: salaryMax || undefined,
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
        favoritesData?.forEach(fav => {
          favoritesMap[fav.job_id] = true
        })
        setFavorites(favoritesMap)
      }

      setJobs(showFavoritesOnly ? data.filter(job => favorites[job.id]) : data)
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

              <button type="submit" className="btn-primary">
                {t('common.search')}
              </button>
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