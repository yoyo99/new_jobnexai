'use client'

import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useAuth } from '../../../src/stores/auth'
import { supabase, type Job } from '../../../src/lib/supabase'

const SKELETON_CARDS = Array.from({ length: 4 }, (_, index) => index)

const JobCardSkeleton = () => (
  <div className="w-full bg-slate-800/80 border border-white/5 rounded-2xl p-5 shadow-lg animate-pulse">
    <div className="h-6 w-1/2 mb-3 rounded-md bg-slate-700" />
    <div className="h-4 w-1/3 mb-5 rounded-md bg-slate-700" />
    <div className="h-3 w-full mb-2 rounded-md bg-slate-700" />
    <div className="h-3 w-5/6 mb-6 rounded-md bg-slate-700" />
    <div className="h-3 w-2/4 rounded-md bg-slate-700" />
  </div>
)

export default function LiveJobsPage() {
  const { user } = useAuth()
  const [jobListings, setJobListings] = useState<Job[]>([])
  const [scrapingStatus, setScrapingStatus] = useState<'pending' | 'completed'>('pending')
  const [progress, setProgress] = useState(10)
  const [filters, setFilters] = useState({ highScore: false, remoteOnly: false, freelanceOnly: false })

  useEffect(() => {
    if (!user) return

    let isMounted = true

    const fetchExisting = async () => {
      const { data, error } = await supabase
        .from('job_listings')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(40)

      if (!isMounted) return
      if (error) {
        console.error('Erreur fetch job_listings', error)
        return
      }

      setJobListings(data ?? [])
    }

    const fetchHistory = async () => {
      const { data } = await supabase
        .from('scraping_history')
        .select('status')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)

      if (data?.length && data[0]?.status === 'completed') {
        setScrapingStatus('completed')
      }
    }

    fetchExisting()
    fetchHistory()

    const jobChannel = supabase
      .channel(`job_listings:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'job_listings',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (!payload?.new) return
          setJobListings((prev) => [payload.new as Job, ...prev].slice(0, 40))
        },
      )
      .subscribe()

    const historyChannel = supabase
      .channel(`scraping_history:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'scraping_history',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload?.new?.status === 'completed') {
            setScrapingStatus('completed')
          }
        },
      )
      .subscribe()

    return () => {
      isMounted = false
      supabase.removeChannel(jobChannel)
      supabase.removeChannel(historyChannel)
    }
  }, [user])

  useEffect(() => {
    if (scrapingStatus === 'completed') {
      setProgress(100)
      return
    }

    const interval = setInterval(() => {
      setProgress((prev) => Math.min(95, prev + Math.random() * 7))
    }, 1200)

    return () => clearInterval(interval)
  }, [scrapingStatus])

  const scoredJobs = useMemo(() => {
    const withScore = jobListings.map((job) => ({
      job,
      score: (job as any).quality_score ?? (job as any).match_score ?? 0,
    }))
    return withScore.sort((a, b) => b.score - a.score)
  }, [jobListings])

  const filteredJobs = useMemo(() => {
    return scoredJobs
      .map(({ job }) => job)
      .filter((job) => {
        if (filters.highScore && ((job as any).quality_score ?? (job as any).match_score ?? 0) < 0.7) {
          return false
        }
        if (filters.remoteOnly && !['remote', 'hybrid'].includes((job.remote_type || '').toLowerCase())) {
          return false
        }
        if (
          filters.freelanceOnly &&
          !(job.job_type || '').toLowerCase().includes('freelance') &&
          !((job as any).contract_type || '').toLowerCase().includes('freelance')
        ) {
          return false
        }
        return true
      })
  }, [filters, scoredJobs])

  const jobCountLabel = useMemo(() => {
    if (!jobListings.length) return 'En attente d’offres en direct...'
    return `${jobListings.length} ${jobListings.length > 1 ? 'offres' : 'offre'} reçue${jobListings.length > 1 ? 's' : ''}`
  }, [jobListings.length])

  const renderJobCard = (job: Job) => {
    const score = (job as any).quality_score ?? (job as any).match_score ?? 0

    return (
      <motion.div
        layout
        key={job.id}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 12 }}
        transition={{ duration: 0.4 }}
        className="w-full bg-slate-900 border border-white/10 rounded-2xl p-6 shadow-2xl"
      >
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-xl font-semibold text-white">{job.title}</h3>
            <p className="text-sm text-gray-400 mt-1">{job.company}</p>
          </div>
          <span className="px-3 py-1 text-xs font-semibold uppercase tracking-wide rounded-full bg-emerald-500/20 text-emerald-300">
            Score {Math.round(score * 10) / 10}
          </span>
        </div>
        <p className="text-sm text-gray-200 mt-4 line-clamp-3">
          {job.description || 'Description en cours de génération par l’agent.'}
        </p>
        <div className="flex items-center justify-between text-xs text-gray-400 mt-6">
          <span>{job.location || job.remote_type || 'Lieu non défini'}</span>
          <span>{new Date(job.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      </motion.div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 py-12 px-6">
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="space-y-3 rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 p-8 shadow-2xl shadow-emerald-900/20">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-emerald-400">Flux n8n</p>
              <h1 className="text-3xl font-bold text-white leading-tight">Résultats live</h1>
            </div>
            <p className="text-sm text-gray-400">{jobCountLabel}</p>
          </div>
          <div className="space-y-1">
            <div className="h-2 w-full rounded-full bg-slate-800">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-gray-400">
              {scrapingStatus === 'completed'
                ? "L'Agent IA a fini le scan."
                : "L'Agent IA scanne le web..."}
            </p>
          </div>
        </header>

        <div className="flex flex-wrap gap-3 text-sm text-white items-center">
          <span className="text-xs uppercase tracking-[0.4em] text-gray-400">Filtres rapides</span>
          {[
            { key: 'highScore', label: 'Score ≥ 70 %' },
            { key: 'remoteOnly', label: 'Remote/Hybrid' },
            { key: 'freelanceOnly', label: 'Offres freelance' },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilters((prev) => ({ ...prev, [key]: !prev[key as keyof typeof prev] }))}
              className={`px-4 py-1 rounded-full border transition ${
                filters[key as keyof typeof filters]
                  ? 'border-emerald-400 bg-emerald-500/20 text-emerald-300'
                  : 'border-white/20 bg-white/5 text-white/70'
              }`}
            >
              {label}
            </button>
          ))}
          <button
            onClick={() => setFilters({ highScore: false, remoteOnly: false, freelanceOnly: false })}
            className="px-3 py-1 rounded-full border border-gray-600 bg-white/5 text-gray-300 text-xs"
          >
            Réinitialiser
          </button>
          <span className="text-xs text-gray-500">
            {filteredJobs.length} affichée{filteredJobs.length > 1 ? 's' : ''}
            {Object.values(filters).some(Boolean) && (
              <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-emerald-300">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
                filtres actifs
              </span>
            )}
          </span>
        </div>

        <section className="space-y-4">
          {scrapingStatus === 'pending' && (
            <div className="grid gap-4 md:grid-cols-2">
              {SKELETON_CARDS.map((index) => (
                <JobCardSkeleton key={`skeleton-${index}`} />
              ))}
            </div>
          )}

          <AnimatePresence>
            <div className="grid gap-4 md:grid-cols-2">
              {filteredJobs.map((job) => renderJobCard(job))}
            </div>
          </AnimatePresence>
        </section>
      </div>
    </div>
  )
}
