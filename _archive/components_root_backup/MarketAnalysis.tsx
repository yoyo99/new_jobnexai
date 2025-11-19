import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { getMarketTrends, type MarketTrend } from '../lib/supabase'
import { ChartBarIcon, MapPinIcon, CurrencyEuroIcon } from '@heroicons/react/24/outline'

type MarketTrendsData = {
  jobTypes: MarketTrend[]
  locations: MarketTrend[]
  salary: {
    average: number
    count: number
  }
}

export function MarketAnalysis() {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(true)
  const [trends, setTrends] = useState<MarketTrendsData | null>(null)

  useEffect(() => {
    loadTrends()
  }, [])

  const loadTrends = async () => {
    try {
      setLoading(true)
      const data = await getMarketTrends()
      setTrends(data)
    } catch (error) {
      console.error('Error loading market trends:', error)
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

  if (!trends) return null

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">{t('marketAnalysis.title')}</h1>
        <p className="text-gray-400 mt-1">{t('marketAnalysis.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="card"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 rounded-lg bg-white/5">
              <ChartBarIcon className="h-6 w-6 text-primary-400" />
            </div>
            <h2 className="text-lg font-semibold text-white">{t('marketAnalysis.jobTypes')}</h2>
          </div>
          <div className="space-y-4">
            {trends.jobTypes.map((trend) => (
              <div key={trend.category}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-400">{trend.category}</span>
                  <span className="text-white">{trend.percentage.toFixed(1)}%</span>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary-600 to-secondary-600"
                    style={{ width: `${trend.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="card"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 rounded-lg bg-white/5">
              <MapPinIcon className="h-6 w-6 text-primary-400" />
            </div>
            <h2 className="text-lg font-semibold text-white">{t('marketAnalysis.topLocations')}</h2>
          </div>
          <div className="space-y-4">
            {trends.locations.map((trend) => (
              <div key={trend.category}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-400">{trend.category}</span>
                  <span className="text-white">{trend.percentage.toFixed(1)}%</span>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary-600 to-secondary-600"
                    style={{ width: `${trend.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="card"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 rounded-lg bg-white/5">
              <CurrencyEuroIcon className="h-6 w-6 text-primary-400" />
            </div>
            <h2 className="text-lg font-semibold text-white">{t('marketAnalysis.salaryInsights')}</h2>
          </div>
          {trends.salary.count > 0 ? (
            <div>
              <div className="text-3xl font-bold text-white mb-2">
                {trends.salary.average.toLocaleString('fr-FR', {
                  style: 'currency',
                  currency: 'EUR',
                  maximumFractionDigits: 0
                })}
              </div>
              <p className="text-sm text-gray-400">
                {t('marketAnalysis.averageSalary', { count: trends.salary.count })}
              </p>
            </div>
          ) : (
            <p className="text-gray-400">{t('marketAnalysis.noSalaryData')}</p>
          )}
        </motion.div>
      </div>
    </div>
  )
}