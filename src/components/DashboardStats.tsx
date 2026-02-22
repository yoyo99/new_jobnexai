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

import { useTranslation } from 'react-i18next'

export function DashboardStats() {
  const { user } = useAuth()
  const { t } = useTranslation()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [timeframe, setTimeframe] = useState<'week' | 'month' | 'year'>('week')

  useEffect(() => {
    if (user) {
      loadStats();
    } else {
      setStats(null); // Clear stats if no user
      setLoading(false);
    }
  }, [user, timeframe]); // loadStats will be called when user or timeframe changes

  const loadStats = async () => {
    if (!user) return;
    console.log('[DashboardStats] loadStats: Adding recentActivity fetch.');

    try {
      setLoading(true);

      const now = new Date();
      const timeframeStart = new Date();
      switch (timeframe) {
        case 'week':
          timeframeStart.setDate(now.getDate() - 7);
          break;
        case 'month':
          timeframeStart.setMonth(now.getMonth() - 1);
          break;
        case 'year':
          timeframeStart.setFullYear(now.getFullYear() - 1);
          break;
      }

      // Récupérer les statistiques des candidatures (pour stats & top lists)
      const { data: applicationsData, error: applicationsError } = await supabase
        .from('job_applications')
        .select('id, created_at, status, job_id, user_id, jobs!fk_job ( title, company, location )') // Ajout de job_title, id pour recentActivity
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }); // Commander par date de création pour faciliter la prise des plus récentes

      console.log('[DashboardStats] Fetched applicationsData:', JSON.stringify(applicationsData, null, 2));


      if (applicationsError) {
        console.error('[DashboardStats] Error fetching applications (for stats, top lists, recent activity):', applicationsError);
        throw applicationsError;
      }
      console.log('[DashboardStats] Fetched applicationsData (for all purposes):', applicationsData);

      // Filtrer applicationsData pour le timeframe des stats générales
      const applicationsInTimeframe = (applicationsData || []).filter(app => new Date(app.created_at) >= timeframeStart);


      // Calculer les statistiques des entretiens
      const { data: interviewsData, error: interviewsError } = await supabase
        .from('job_applications')
        .select('next_step_date, status')
        .eq('user_id', user.id)
        .eq('status', 'interviewing')
        .gte('created_at', timeframeStart.toISOString()); // Assurer que les entretiens sont aussi dans le timeframe

      if (interviewsError) {
        console.error('[DashboardStats] Error fetching interviews:', interviewsError);
        throw interviewsError;
      }
      console.log('[DashboardStats] Fetched interviews:', interviewsData);

      // Calculer les meilleures entreprises et lieux à partir de applicationsInTimeframe
      const companyCounts = (applicationsInTimeframe || []).reduce((acc, app) => {
        const companyName = app.job_applications_job_id_fkey?.company;
        if (companyName) {
          acc[companyName] = (acc[companyName] || 0) + 1;
        }
        return acc;
      }, {});
      const topCompanies = Object.entries(companyCounts)
        .sort(([, aCount], [, bCount]) => (bCount as number) - (aCount as number))
        .slice(0, 5)
        .map(([name, count]) => ({ name, count: count as number }));
      console.log('[DashboardStats] Calculated topCompanies:', topCompanies);

      const locationCounts = (applicationsInTimeframe || []).reduce((acc, app) => {
        const locationName = app.jobs?.location;
        if (locationName) {
          acc[locationName] = (acc[locationName] || 0) + 1;
        }
        return acc;
      }, {});
      const topLocations = Object.entries(locationCounts)
        .sort(([, aCount], [, bCount]) => (bCount as number) - (aCount as number))
        .slice(0, 3)
        .map(([name, count]) => ({ name, count: count as number }));
      console.log('[DashboardStats] Calculated topLocations:', topLocations);

      // Prepare recentActivity from applicationsData
      const recentApplicationsActivity = (applicationsData || []).slice(0, 5).map(app => ({
        id: app.id,
        type: 'application',
        title: app.jobs?.title || 'N/A',
        subtitle: app.jobs?.company || 'N/A',
        date: app.created_at,
        status: app.status,
      }));
      console.log('[DashboardStats] Calculated recentActivity from applications:', recentApplicationsActivity);

      // Trier recentApplicationsActivity par date (plus récent d'abord) et prendre les 5 premiers (déjà fait par slice(0,5) sur data triée)
      // Pour l'instant, finalRecentActivity est juste recentApplicationsActivity car les favoris sont retirés
      const finalRecentActivity = recentApplicationsActivity;
      console.log('[DashboardStats] Final recentActivity (applications only):', finalRecentActivity);

      // Mise à jour des stats
      setStats(prevStats => {
        const baseStats = prevStats || {
          applications: { total: 0, thisWeek: 0, lastWeek: 0, percentageChange: 0 },
          interviews: { upcoming: 0, completed: 0 },
          topCompanies: [],
          topLocations: [],
          averageSalary: 0,
          responseRate: 0,
          recentActivity: [],
        };
        return {
          ...baseStats,
          applications: {
            total: applicationsInTimeframe?.length || 0,
            thisWeek: applicationsInTimeframe?.length || 0, // Corrected: thisWeek should be the count of applicationsInTimeframe
            lastWeek: 0, 
            percentageChange: 0,
          },
          interviews: {
            upcoming: (interviewsData || []).filter(i => i.next_step_date && new Date(i.next_step_date) >= now).length || 0,
            completed: (interviewsData || []).filter(i => i.next_step_date && new Date(i.next_step_date) < now).length || 0,
          },
          topCompanies,
          topLocations,
          recentActivity: finalRecentActivity,
        };
      });

    } catch (error) {
      console.error('[DashboardStats] Error in loadStats (recentActivity or other):', error);
      setStats(prevStats => prevStats ? { ...prevStats } : null);
    } finally {
      setLoading(false);
    }
  };

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
        {(['week', 'month', 'year'] as const).map((tf) => (
          <button
            key={tf}
            onClick={() => setTimeframe(tf)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              timeframe === tf
                ? 'bg-primary-600 text-white'
                : 'bg-white/5 text-gray-400 hover:bg-white/10'
            }`}
          >
            {t(`dashboard.timeframe.${tf}`)}
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
            <p className="text-sm text-gray-400">{t('dashboard.stats.applications')}</p>
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
            <p className="text-sm text-gray-400">{t('dashboard.stats.interviewsUpcoming')}</p>
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
            <p className="text-sm text-gray-400 mt-2">{t('dashboard.stats.topCompanies')}</p>
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
            <p className="text-sm text-gray-400 mt-2">{t('dashboard.stats.topLocations')}</p>
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
          {t('dashboard.stats.recentActivity')}
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
                    {t(`dashboard.activity.${activity.type}`)}: {activity.title}
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