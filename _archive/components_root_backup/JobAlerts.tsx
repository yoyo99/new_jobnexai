import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { BellIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { supabase } from '../lib/supabase'
import { useAuth } from '../stores/auth'

interface JobAlert {
  id: string
  keywords: string[]
  locations: string[]
  job_types: string[]
  salary_min: number | null
  salary_max: number | null
  frequency: 'daily' | 'weekly'
  is_active: boolean
}

export function JobAlerts() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [alerts, setAlerts] = useState<JobAlert[]>([])
  const [showForm, setShowForm] = useState(false)
  const [newAlert, setNewAlert] = useState<Partial<JobAlert>>({
    keywords: [],
    locations: [],
    job_types: [],
    frequency: 'daily',
    is_active: true
  })

  useEffect(() => {
    if (user) {
      loadAlerts()
    }
  }, [user])

  const loadAlerts = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('job_alerts')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setAlerts(data || [])
    } catch (error) {
      console.error('Error loading alerts:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const { error } = await supabase
        .from('job_alerts')
        .insert({
          user_id: user?.id,
          ...newAlert
        })

      if (error) throw error
      
      setShowForm(false)
      setNewAlert({
        keywords: [],
        locations: [],
        job_types: [],
        frequency: 'daily',
        is_active: true
      })
      loadAlerts()
    } catch (error) {
      console.error('Error creating alert:', error)
    }
  }

  const toggleAlert = async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('job_alerts')
        .update({ is_active: !isActive })
        .eq('id', id)

      if (error) throw error
      loadAlerts()
    } catch (error) {
      console.error('Error updating alert:', error)
    }
  }

  const deleteAlert = async (id: string) => {
    try {
      const { error } = await supabase
        .from('job_alerts')
        .delete()
        .eq('id', id)

      if (error) throw error
      loadAlerts()
    } catch (error) {
      console.error('Error deleting alert:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-400"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium text-white">Alertes emploi</h2>
        <button
          onClick={() => setShowForm(true)}
          className="btn-primary"
        >
          Créer une alerte
        </button>
      </div>

      {showForm && (
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card"
          onSubmit={handleSubmit}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Mots-clés
              </label>
              <input
                type="text"
                placeholder="Développeur, React, JavaScript..."
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                onChange={(e) => setNewAlert({
                  ...newAlert,
                  keywords: e.target.value.split(',').map(k => k.trim())
                })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Localisations
              </label>
              <input
                type="text"
                placeholder="Paris, Lyon, Remote..."
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                onChange={(e) => setNewAlert({
                  ...newAlert,
                  locations: e.target.value.split(',').map(l => l.trim())
                })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Types de contrat
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {['CDI', 'CDD', 'Freelance', 'Stage', 'Alternance'].map((type) => (
                  <label key={type} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      className="rounded border-white/10 bg-white/5 text-primary-500 focus:ring-primary-500"
                      onChange={(e) => {
                        const types = newAlert.job_types || []
                        setNewAlert({
                          ...newAlert,
                          job_types: e.target.checked
                            ? [...types, type]
                            : types.filter(t => t !== type)
                        })
                      }}
                    />
                    <span className="text-white text-sm">{type}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Fréquence
              </label>
              <select
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                value={newAlert.frequency}
                onChange={(e) => setNewAlert({
                  ...newAlert,
                  frequency: e.target.value as 'daily' | 'weekly'
                })}
              >
                <option value="daily">Quotidienne</option>
                <option value="weekly">Hebdomadaire</option>
              </select>
            </div>
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="btn-secondary"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="btn-primary"
            >
              Créer l'alerte
            </button>
          </div>
        </motion.form>
      )}

      <div className="space-y-4">
        {alerts.map((alert) => (
          <motion.div
            key={alert.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <BellIcon className="h-5 w-5 text-primary-400" />
                  <h3 className="text-white font-medium">
                    {alert.keywords.join(', ')}
                  </h3>
                </div>
                <div className="mt-2 space-y-1 text-sm text-gray-400">
                  <p>Localisations : {alert.locations.join(', ')}</p>
                  <p>Types de contrat : {alert.job_types.join(', ')}</p>
                  <p>Fréquence : {alert.frequency === 'daily' ? 'Quotidienne' : 'Hebdomadaire'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleAlert(alert.id, alert.is_active)}
                  className={`text-sm font-medium px-3 py-1 rounded-full ${
                    alert.is_active
                      ? 'bg-green-900/50 text-green-400'
                      : 'bg-gray-900/50 text-gray-400'
                  }`}
                >
                  {alert.is_active ? 'Activée' : 'Désactivée'}
                </button>
                <button
                  onClick={() => deleteAlert(alert.id)}
                  className="text-gray-400 hover:text-white"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}