import { motion } from 'framer-motion'
import { useEffect, useState, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../stores/auth'
import { useTranslation } from 'react-i18next'
import {
  BriefcaseIcon,
  ChartBarIcon,
  ClockIcon,
  ArrowTrendingUpIcon,
  SparklesIcon,
  BookmarkIcon,
} from '@heroicons/react/24/outline'
import type { SkillResponse } from '../lib/supabase'

interface JobStats {
  totalApplications: number
  activeApplications: number
  responseRate: number
  averageSalary: number
  matchingJobs: number
  savedJobs: number
  topSkills: Array<{ name: string; count: number }>
  recentActivities: Array<{
    id: string
    type: string
    title: string
    company: string
    date: string
  }>
}

export function JobStats() {
  const { user } = useAuth()
  const { t } = useTranslation()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<JobStats | null>(null)
  const [error, setError] = useState<string | null>(null)

  const loadStats = async () => {
    try {
      setLoading(true)
      setError(null)

      const [
        applicationsResponse,
        matchesResponse,
        skillsResponse,
        salaryResponse,
        suggestionsResponse,
        favoritesResponse
      ] = await Promise.all([
        supabase
          .from('job_applications')
          .select('*')
          .eq('user_id', user?.id),
        supabase
          .from('job_matches')
          .select('*')
          .eq('user_id', user?.id),
        supabase
          .from('user_skills')
          .select(`
            id,
            user_id,
            skill_id,
            proficiency_level,
            years_experience,
            created_at,
            updated_at,
            skill:skills (
              id,
              name,
              category,
              job_skills (
                job:jobs (
                  id,
                  title,
                  company,
                  created_at
                )
              )
            )
          `)
          .eq('user_id', user?.id)
          .order('created_at', { ascending: false })
          .limit(5),
        supabase
          .from('jobs')
          .select('salary_min, salary_max'),
        supabase
          .from('job_suggestions')
          .select('*')
          .eq('user_id', user?.id),
        supabase
          .from('job_favorites')
          .select('*')
          .eq('user_id', user?.id)
      ])

      if (applicationsResponse.error) throw applicationsResponse.error
      if (matchesResponse.error) throw matchesResponse.error
      if (skillsResponse.error) throw skillsResponse.error
      if (salaryResponse.error) throw salaryResponse.error
      if (suggestionsResponse.error) throw suggestionsResponse.error
      if (favoritesResponse.error) throw favoritesResponse.error

      const totalApplications = applicationsResponse.data?.length || 0
      const activeApplications = matchesResponse.data?.filter(m => m.match_score > 70).length || 0
      const responseRate = matchesResponse.data
        ? (matchesResponse.data.filter(m => m.match_score > 50).length / matchesResponse.data.length) * 100
        : 0

      const averageSalary = salaryResponse.data?.reduce((acc, job) => {
        const avg = ((job.salary_min || 0) + (job.salary_max || 0)) / 2
        return acc + avg
      }, 0) || 0

      const matchingJobs = suggestionsResponse.data?.length || 0
      const savedJobs = favoritesResponse.data?.length || 0

      const skillCounts: Record<string, number> = {}
      const userSkills = skillsResponse.data as unknown as SkillResponse[]
      userSkills?.forEach(userSkill => {
        if (userSkill.skill?.name) {
          skillCounts[userSkill.skill.name] = (skillCounts[userSkill.skill.name] || 0) + 1
        }
      })

      const topSkills = Object.entries(skillCounts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)

      const recentActivities = userSkills?.map(userSkill => {
        const jobSkill = userSkill.skill?.job_skills?.[0]
        return {
          id: jobSkill?.job?.id || '',
          type: 'skill_match',
          title: jobSkill?.job?.title || '',
          company: jobSkill?.job?.company || '',
          date: jobSkill?.job?.created_at || '',
        }
      }).filter(activity => activity.id) || []

      setStats({
        totalApplications,
        activeApplications,
        responseRate,
        averageSalary: averageSalary / (salaryResponse.data?.length || 1),
        matchingJobs,
        savedJobs,
        topSkills,
        recentActivities,
      })
    } catch (error: any) {
      console.error('Error loading stats:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      loadStats()
    }
  }, [user])

  const statCards = useMemo(() => [
    {
      title: t('dashboard.stats.applications'),
      value: stats?.totalApplications || 0,
      icon: BriefcaseIcon,
      color: 'text-primary-400',
    },
    {
      title: t('dashboard.stats.interviews'),
      value: stats?.activeApplications || 0,
      icon: ClockIcon,
      color: 'text-primary-400',
    },
    {
      title: t('dashboard.stats.responseRate'),
      value: `${stats?.responseRate.toFixed(0)}%` || '0%',
      icon: ChartBarIcon,
      color: 'text-primary-400',
    },
    {
      title: t('dashboard.stats.averageSalary'),
      value: stats?.averageSalary.toLocaleString('fr-FR', {
        style: 'currency',
        currency: 'EUR',
        maximumFractionDigits: 0,
      }) || '0 €',
      icon: ArrowTrendingUpIcon,
      color: 'text-primary-400',
    },
    {
      title: t('dashboard.stats.matchingJobs'),
      value: stats?.matchingJobs || 0,
      icon: SparklesIcon,
      color: 'text-primary-400',
    },
    {
      title: t('dashboard.stats.savedJobs'),
      value: stats?.savedJobs || 0,
      icon: BookmarkIcon,
      color: 'text-primary-400',
    },
  ], [stats, t])

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-400"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-900/50 text-red-400 p-4 rounded-lg">
        <p className="text-sm">{error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6">
        {statCards.map((card, index) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="card"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-white/5">
                <card.icon className={`h-6 w-6 ${card.color}`} />
              </div>
              <div>
                <p className="text-sm text-gray-400">{card.title}</p>
                <p className="text-2xl font-semibold text-white">
                  {card.value}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="card"
        >
          <h3 className="text-lg font-medium text-white mb-4">
            {t('dashboard.skillsProgress.title')}
          </h3>
          <div className="space-y-4">
            {stats?.topSkills.map((skill, index) => (
              <div key={skill.name}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-400">{skill.name}</span>
                  <span className="text-white">{skill.count} offres</span>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(skill.count / (stats?.topSkills[0]?.count || 1)) * 100}%` }}
                    transition={{ duration: 0.5, delay: 0.1 * index }}
                    className="h-full bg-gradient-to-r from-primary-600 to-secondary-600"
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="card"
        >
          <h3 className="text-lg font-medium text-white mb-4">
            {t('dashboard.recentApplications.title')}
          </h3>
          <div className="space-y-4">
            {stats?.recentActivities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-center justify-between p-4 rounded-lg bg-white/5"
              >
                <div>
                  <p className="font-medium text-white">{activity.title}</p>
                  <p className="text-sm text-gray-400">{activity.company}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-primary-400">
                    {new Date(activity.date).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  )
}