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
        {/* AI-styled skeleton loading */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="glass-card p-6">
              <div className="skeleton h-14 w-14 rounded-2xl mb-5" />
              <div className="skeleton h-10 w-20 rounded-lg mb-2" />
              <div className="skeleton h-4 w-32 rounded" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!stats) return null

  return (
    <div className="space-y-6">
      {/* AI-styled Timeframe selector */}
      <div className="flex justify-end space-x-2">
        {(['week', 'month', 'year'] as const).map((tf) => (
          <button
            key={tf}
            onClick={() => setTimeframe(tf)}
            className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
              timeframe === tf
                ? 'bg-gradient-to-r from-primary-500 to-secondary-500 text-white shadow-glow'
                : 'bg-white/5 text-gray-400 hover:bg-white/10 border border-white/10 hover:border-primary-500/30'
            }`}
          >
            {t(`dashboard.timeframe.${tf}`)}
          </button>
        ))}
      </div>

      {/* Main stats - AI Modern Design */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Applications Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6 relative"
        >
          {/* Icon with gradient border */}
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5 relative">
            <div className="absolute inset-0 rounded-2xl p-[2px] bg-gradient-to-br from-primary-500 via-secondary-500 to-pink-500">
              <div className="w-full h-full rounded-2xl bg-card" />
            </div>
            <BriefcaseIcon className="h-6 w-6 text-primary-400 relative z-10" />
          </div>

          {/* Value with gradient text */}
          <div className="text-4xl font-bold font-['Space_Grotesk'] bg-clip-text text-transparent bg-gradient-to-r from-primary-400 via-secondary-400 to-pink-400 leading-none mb-2">
            {stats.applications.total}
          </div>
          <p className="text-muted-foreground text-sm">{t('dashboard.stats.applications')}</p>

          {/* Trend indicator */}
          <div className={`absolute top-6 right-6 flex items-center gap-1 text-sm px-2.5 py-1 rounded-lg ${
            stats.applications.percentageChange > 0 ? 'text-green-400 bg-green-400/10' : 'text-red-400 bg-red-400/10'
          }`}>
            {stats.applications.percentageChange > 0 ? (
              <ArrowUpIcon className="h-3 w-3" />
            ) : (
              <ArrowDownIcon className="h-3 w-3" />
            )}
            {Math.abs(stats.applications.percentageChange).toFixed(1)}%
          </div>
        </motion.div>

        {/* Interviews Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-6"
        >
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5 relative">
            <div className="absolute inset-0 rounded-2xl p-[2px] bg-gradient-to-br from-neon-blue via-primary-500 to-secondary-500">
              <div className="w-full h-full rounded-2xl bg-card" />
            </div>
            <CalendarIcon className="h-6 w-6 text-neon-blue relative z-10" />
          </div>

          <div className="text-4xl font-bold font-['Space_Grotesk'] bg-clip-text text-transparent bg-gradient-to-r from-neon-blue via-primary-400 to-secondary-400 leading-none mb-2">
            {stats.interviews.upcoming}
          </div>
          <p className="text-muted-foreground text-sm">{t('dashboard.stats.interviewsUpcoming')}</p>
        </motion.div>

        {/* Top Companies Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-6"
        >
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5 relative">
            <div className="absolute inset-0 rounded-2xl p-[2px] bg-gradient-to-br from-secondary-500 to-pink-500">
              <div className="w-full h-full rounded-2xl bg-card" />
            </div>
            <BuildingOfficeIcon className="h-6 w-6 text-secondary-400 relative z-10" />
          </div>

          <div className="space-y-3">
            {stats.topCompanies.map((company) => (
              <div key={company.name} className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground truncate">{company.name}</span>
                <span className="text-sm font-semibold text-neon bg-neon-blue/10 px-2 py-0.5 rounded-md">{company.count}</span>
              </div>
            ))}
          </div>
          <p className="text-muted-foreground text-sm mt-4">{t('dashboard.stats.topCompanies')}</p>
        </motion.div>

        {/* Top Locations Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card p-6"
        >
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5 relative">
            <div className="absolute inset-0 rounded-2xl p-[2px] bg-gradient-to-br from-green-500 to-neon-cyan">
              <div className="w-full h-full rounded-2xl bg-card" />
            </div>
            <MapPinIcon className="h-6 w-6 text-green-400 relative z-10" />
          </div>

          <div className="space-y-3">
            {stats.topLocations.map((location) => (
              <div key={location.name} className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground truncate">{location.name}</span>
                <span className="text-sm font-semibold text-green-400 bg-green-400/10 px-2 py-0.5 rounded-md">{location.count}</span>
              </div>
            ))}
          </div>
          <p className="text-muted-foreground text-sm mt-4">{t('dashboard.stats.topLocations')}</p>
        </motion.div>
      </div>

      {/* Activity timeline - AI Modern Design */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="glass-card p-6"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center shadow-glow">
            <ArrowTrendingUpIcon className="h-5 w-5 text-white" />
          </div>
          <h3 className="text-lg font-semibold font-['Space_Grotesk'] text-gradient">
            {t('dashboard.stats.recentActivity')}
          </h3>
        </div>
        <div className="space-y-4">
          {stats.recentActivity.map((activity) => {
            const Icon = activity.icon || BriefcaseIcon
            return (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-start gap-4 p-4 rounded-xl bg-white/5 border border-white/5 hover:border-primary-500/30 transition-all duration-300 hover:bg-white/10"
              >
                <div className={`p-2.5 rounded-xl bg-gradient-to-br from-white/10 to-white/5 ${activity.color || 'text-primary-400'}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {t(`dashboard.activity.${activity.type}`)}: {activity.title}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {activity.company}
                    {activity.status && (
                      <>
                        <span className="mx-2 text-primary-500/50">•</span>
                        <span className="capitalize text-neon-blue">{activity.status}</span>
                      </>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground/70 mt-1.5">
                    {format(new Date(activity.date), 'dd MMMM yyyy à HH:mm', { locale: fr })}
                  </p>
                </div>
              </motion.div>
            )
          })}
        </div>
      </motion.div>
    </div>
  )
}