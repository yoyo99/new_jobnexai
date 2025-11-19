import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { supabase } from '../lib/supabase'
import { useAuth } from '../stores/auth'

interface UserPreferences {
  id: string
  job_types: string[]
  preferred_locations: string[]
  min_salary: number | null
  max_salary: number | null
  remote_preference: 'remote' | 'hybrid' | 'onsite' | 'any' | null
}

export function UserPreferences() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [preferences, setPreferences] = useState<UserPreferences | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const jobTypes = [
    { value: 'FULL_TIME', label: t('jobSearch.types.fullTime') },
    { value: 'PART_TIME', label: t('jobSearch.types.partTime') },
    { value: 'CONTRACT', label: t('jobSearch.types.contract') },
    { value: 'FREELANCE', label: t('jobSearch.types.freelance') },
    { value: 'INTERNSHIP', label: t('jobSearch.types.internship') },
  ]

  const remotePreferences = [
    { value: 'remote', label: t('jobSearch.locations.remote') },
    { value: 'hybrid', label: t('jobSearch.locations.hybrid') },
    { value: 'onsite', label: t('jobSearch.locations.onsite') },
    { value: 'any', label: 'Indifférent' },
  ]

  useEffect(() => {
    loadPreferences()
  }, [user])

  const loadPreferences = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user?.id)
        .single()

      if (error) throw error
      setPreferences(data || {
        job_types: [],
        preferred_locations: [],
        min_salary: null,
        max_salary: null,
        remote_preference: null,
      })
    } catch (error) {
      console.error('Error loading preferences:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: user?.id,
          ...preferences,
        })

      if (error) throw error
      setMessage({ type: 'success', text: t('profile.personalInfo.updateSuccess') })
    } catch (error) {
      console.error('Error saving preferences:', error)
      setMessage({ type: 'error', text: t('profile.personalInfo.updateError') })
    } finally {
      setSaving(false)
    }
  }

  const toggleJobType = (type: string) => {
    if (!preferences) return
    const newTypes = preferences.job_types.includes(type)
      ? preferences.job_types.filter(t => t !== type)
      : [...preferences.job_types, type]
    setPreferences({ ...preferences, job_types: newTypes })
  }

  const handleLocationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!preferences) return
    const location = e.target.value.trim()
    if (!location) return
    setPreferences({
      ...preferences,
      preferred_locations: [...new Set([...preferences.preferred_locations, location])],
    })
  }

  const removeLocation = (location: string) => {
    if (!preferences) return
    setPreferences({
      ...preferences,
      preferred_locations: preferences.preferred_locations.filter(l => l !== location),
    })
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
      <div>
        <h3 className="text-lg font-medium text-white mb-4">Types de poste</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {jobTypes.map((type) => (
            <button
              key={type.value}
              onClick={() => toggleJobType(type.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                preferences?.job_types.includes(type.value)
                  ? 'bg-primary-600 text-white'
                  : 'bg-white/5 text-gray-300 hover:bg-white/10'
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium text-white mb-4">Localisations</h3>
        <div className="space-y-4">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Ajouter une localisation..."
              className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleLocationChange(e as unknown as React.ChangeEvent<HTMLInputElement>)
                  ;(e.target as HTMLInputElement).value = ''
                }
              }}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {preferences?.preferred_locations.map((location) => (
              <span
                key={location}
                className="bg-white/5 text-white px-3 py-1 rounded-full text-sm flex items-center gap-2"
              >
                {location}
                <button
                  onClick={() => removeLocation(location)}
                  className="text-gray-400 hover:text-white"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium text-white mb-4">Mode de travail</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {remotePreferences.map((pref) => (
            <button
              key={pref.value}
              onClick={() => setPreferences(prev => prev ? { ...prev, remote_preference: pref.value as any } : null)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                preferences?.remote_preference === pref.value
                  ? 'bg-primary-600 text-white'
                  : 'bg-white/5 text-gray-300 hover:bg-white/10'
              }`}
            >
              {pref.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium text-white mb-4">Fourchette de salaire</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">
              Minimum
            </label>
            <input
              type="number"
              value={preferences?.min_salary || ''}
              onChange={(e) => setPreferences(prev => prev ? { ...prev, min_salary: Number(e.target.value) || null } : null)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">
              Maximum
            </label>
            <input
              type="number"
              value={preferences?.max_salary || ''}
              onChange={(e) => setPreferences(prev => prev ? { ...prev, max_salary: Number(e.target.value) || null } : null)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>
      </div>

      {message && (
        <div className={`rounded-md p-4 ${
          message.type === 'success' ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'
        }`}>
          <p className="text-sm">{message.text}</p>
        </div>
      )}

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary"
        >
          {saving ? t('common.loading') : t('common.save')}
        </button>
      </div>
    </div>
  )
}