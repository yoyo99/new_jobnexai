import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useAuth } from '../stores/auth'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import {
  ArrowTrendingUpIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  CalendarIcon,
  BriefcaseIcon,
  BuildingOfficeIcon,
  MapPinIcon,
  CheckCircleIcon,
  XCircleIcon,
  PhoneIcon,
  DocumentTextIcon,
  StarIcon,
} from '@heroicons/react/24/outline'

interface DashboardStats {
  applications: {
    total: number
    thisWeek: number
    lastWeek: number
    percentageChange: number
  }
  interviews: {
    upcoming: number
    completed: number
  }
  topCompanies: Array<{
    name: string
    count: number
  }>
  topLocations: Array<{
    name: string
    count: number
  }>
  averageSalary: number
  responseRate: number
  recentActivity: Array<{
    id: string
    type: 'application' | 'interview' | 'offer' | 'favorite' | 'status_change'
    title: string
    company: string
    date: string
    status?: string
    icon?: typeof BriefcaseIcon
    color?: string
  }>
}

interface Job {
  id: string
  title: string
  company: string
}

interface JobApplication {
  id: string
  status: string
  created_at: string
  job: Job
}

interface JobFavorite {
  id: string
  created_at: string
  job: Job
}

const activityConfig = {
  application: {
    icon: DocumentTextIcon,
    color: 'text-blue-400',
  },
  interview: {
    icon: PhoneIcon,
    color: 'text-green-400',
  },
  offer: {
    icon: CheckCircleIcon,
    color: 'text-primary-400',
  },
  favorite: {
    icon: StarIcon,
    color: 'text-yellow-400',
  },
  status_change: {
    icon: ArrowTrendingUpIcon,
    color: 'text-purple-400',
  },
}

export function DashboardStats() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [timeframe, setTimeframe] = useState<'week' | 'month' | 'year'>('week')

  useEffect(() => {
    if (user) {
      loadStats()
    }
  }, [user, timeframe])

  const loadStats = async () => {
    if (!user) return

    try {
      setLoading(true)

      // Calculer les dates pour le timeframe
      const now = new Date()
      const timeframeStart = new Date()
      switch (timeframe) {
        case 'week':
          timeframeStart.setDate(now.getDate() - 7)
          break
        case 'month':
          timeframeStart.setMonth(now.getMonth() - 1)
          break
        case 'year':
          timeframeStart.setFullYear(now.getFullYear() - 1)
          break
      }

      // Récupérer les statistiques des candidatures
      const { data: applications } = await supabase
        .from('job_applications')
        .select('created_at, status')
        .eq('user_id', user.id)
        .gte('created_at', timeframeStart.toISOString())

      // Calculer les statistiques des entretiens
      const { data: interviews } = await supabase
        .from('job_applications')
        .select('next_step_date, status')
        .eq('user_id', user.id)
        .eq('status', 'interviewing')

      // Récupérer les entreprises les plus fréquentes
      const { data: companies } = await supabase
        .from('job_applications')
        .select(`
          job:jobs (
            company
          )
        `)
        .eq('user_id', user.id)

      // Récupérer l'activité récente
      const { data: recentApplications } = await supabase
        .from('job_applications')
        .select(`
          id,
          status,
          created_at,
          job:jobs (
            id,
            title,
            company
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5) as { data: JobApplication[] | null }

      const { data: recentFavorites } = await supabase
        .from('job_favorites')
        .select(`
          id,
          created_at,
          job:jobs (
            id,
            title,
            company
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5) as { data: JobFavorite[] | null }

      // Transformer les données en activités
      const activities = [
        ...(recentApplications?.map(app => ({
          id: app.id,
          type: 'application' as const,
          title: app.job.title,
          company: app.job.company,
          date: app.created_at,
          status: app.status,
        })) || []),
        ...(recentFavorites?.map(fav => ({
          id: fav.id,
          type: 'favorite' as const,
          title: fav.job.title,
          company: fav.job.company,
          date: fav.created_at,
        })) || []),
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 10)
        .map(activity => ({
          ...activity,
          ...activityConfig[activity.type],
        }))

      // Calculer les statistiques
      const stats: DashboardStats = {
        applications: {
          total: applications?.length || 0,
          thisWeek: applications?.filter(a => 
            new Date(a.created_at) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          ).length || 0,
          lastWeek: applications?.filter(a =>
            new Date(a.created_at) >= new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) &&
            new Date(a.created_at) < new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          ).length || 0,
          percentageChange: 0
        },
        interviews: {
          upcoming: interviews?.filter(i => 
            i.next_step_date && new Date(i.next_step_date) > new Date()
          ).length || 0,
          completed: interviews?.filter(i =>
            i.next_step_date && new Date(i.next_step_date) <= new Date()
          ).length || 0
        },
        topCompanies: companies?.reduce((acc: Array<{name: string, count: number}>, curr) => {
          const company = curr.job.company
          if (company) {
            const existing = acc.find(c => c.name === company)
            if (existing) {
              existing.count++
            } else {
              acc.push({ name: company, count: 1 })
            }
          }
          return acc
        }, []).sort((a, b) => b.count - a.count).slice(0, 5) || [],
        topLocations: [],
        averageSalary: 0,
        responseRate: (applications?.filter(a => a.status !== 'draft').length || 0) / (applications?.length || 1) * 100,
        recentActivity: activities,
      }

      // Calculer le pourcentage de changement
      if (stats.applications.lastWeek > 0) {
        stats.applications.percentageChange = 
          ((stats.applications.thisWeek - stats.applications.lastWeek) / stats.applications.lastWeek) * 100
      }

      setStats(stats)
    } catch (error) {
      console.error('Error loading stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-400"></div>
      </div>
    )
  }

  if (!stats) return null

  return (
    <div className="space-y-6">
      {/* Timeframe selector */}
      <div className="flex justify-end space-x-2">
        {(['week', 'month', 'year'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTimeframe(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              timeframe === t
                ? 'bg-primary-600 text-white'
                : 'bg-white/5 text-gray-400 hover:bg-white/10'
            }`}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Main stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card"
        >
          <div className="flex items-center justify-between">
            <div className="p-3 rounded-lg bg-white/5">
              <BriefcaseIcon className="h-6 w-6 text-primary-400" />
            </div>
            <div className="flex items-center space-x-2">
              <span className={`text-sm ${
                stats.applications.percentageChange > 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                {stats.applications.percentageChange > 0 ? (
                  <ArrowUpIcon className="h-4 w-4 inline" />
                ) : (
                  <ArrowDownIcon className="h-4 w-4 inline" />
                )}
                {Math.abs(stats.applications.percentageChange).toFixed(1)}%
              </span>
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-lg font-semibold text-white">
              {stats.applications.total}
            </h3>
            <p className="text-sm text-gray-400">Candidatures</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card"
        >
          <div className="flex items-center justify-between">
            <div className="p-3 rounded-lg bg-white/5">
              <CalendarIcon className="h-6 w-6 text-primary-400" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-lg font-semibold text-white">
              {stats.interviews.upcoming}
            </h3>
            <p className="text-sm text-gray-400">Entretiens à venir</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card"
        >
          <div className="flex items-center justify-between">
            <div className="p-3 rounded-lg bg-white/5">
              <BuildingOfficeIcon className="h-6 w-6 text-primary-400" />
            </div>
          </div>
          <div className="mt-4">
            <div className="space-y-2">
              {stats.topCompanies.map((company, index) => (
                <div key={company.name} className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">{company.name}</span>
                  <span className="text-sm text-white">{company.count}</span>
                </div>
              ))}
            </div>
            <p className="text-sm text-gray-400 mt-2">Top Entreprises</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card"
        >
          <div className="flex items-center justify-between">
            <div className="p-3 rounded-lg bg-white/5">
              <MapPinIcon className="h-6 w-6 text-primary-400" />
            </div>
          </div>
          <div className="mt-4">
            <div className="space-y-2">
              {stats.topLocations.map((location, index) => (
                <div key={location.name} className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">{location.name}</span>
                  <span className="text-sm text-white">{location.count}</span>
                </div>
              ))}
            </div>
            <p className="text-sm text-gray-400 mt-2">Top Localisations</p>
          </div>
        </motion.div>
      </div>

      {/* Activity timeline */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="card"
      >
        <h3 className="text-lg font-semibold text-white mb-4">
          Activité récente
        </h3>
        <div className="space-y-4">
          {stats.recentActivity.map((activity) => {
            const Icon = activity.icon || BriefcaseIcon
            return (
              <div
                key={activity.id}
                className="flex items-start gap-4 p-4 rounded-lg bg-white/5"
              >
                <div className={`p-2 rounded-lg bg-white/5 ${activity.color || 'text-primary-400'}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {activity.title}
                  </p>
                  <p className="text-sm text-gray-400">
                    {activity.company}
                    {activity.status && (
                      <>
                        <span className="mx-2">•</span>
                        <span className="capitalize">{activity.status}</span>
                      </>
                    )}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {format(new Date(activity.date), 'dd MMMM yyyy à HH:mm', { locale: fr })}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </motion.div>
    </div>
  )
}