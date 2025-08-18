import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../stores/auth';
import { supabase } from '../lib/supabase';
import { BellIcon, CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface NotificationPreferences {
  email_notifications: boolean;
  push_notifications: boolean;
  frequency: 'immediate' | 'daily' | 'weekly';
  job_types: string[];
  locations: string[];
  salary_min?: number;
  keywords: string[];
}

const JobNotificationSettings: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    email_notifications: true,
    push_notifications: false,
    frequency: 'daily',
    job_types: [],
    locations: [],
    keywords: []
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [newKeyword, setNewKeyword] = useState('');
  const [newLocation, setNewLocation] = useState('');

  const jobTypeOptions = [
    'CDI', 'CDD', 'Stage', 'Freelance', 'Alternance', 'Temps partiel'
  ];

  const frequencyOptions = [
    { value: 'immediate', label: 'Immédiatement' },
    { value: 'daily', label: 'Quotidien' },
    { value: 'weekly', label: 'Hebdomadaire' }
  ];

  useEffect(() => {
    if (user?.id) {
      loadPreferences();
    }
  }, [user?.id]);

  const loadPreferences = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase.functions.invoke('job-notifications', {
        method: 'GET',
        body: new URLSearchParams({ 
          userId: user.id,
          action: 'preferences'
        })
      });

      if (error) throw error;
      if (data.preferences) {
        setPreferences(data.preferences);
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
      setMessage({ type: 'error', text: 'Erreur lors du chargement des préférences' });
    }
  };

  const savePreferences = async () => {
    if (!user?.id) return;

    setLoading(true);
    setMessage(null);

    try {
      const { data, error } = await supabase.functions.invoke('job-notifications', {
        body: {
          action: 'update_preferences',
          userId: user.id,
          preferences
        }
      });

      if (error) throw error;

      setMessage({ type: 'success', text: 'Préférences sauvegardées avec succès' });
    } catch (error) {
      console.error('Error saving preferences:', error);
      setMessage({ type: 'error', text: 'Erreur lors de la sauvegarde' });
    } finally {
      setLoading(false);
    }
  };

  const addKeyword = () => {
    if (newKeyword.trim() && !preferences.keywords.includes(newKeyword.trim())) {
      setPreferences(prev => ({
        ...prev,
        keywords: [...prev.keywords, newKeyword.trim()]
      }));
      setNewKeyword('');
    }
  };

  const removeKeyword = (keyword: string) => {
    setPreferences(prev => ({
      ...prev,
      keywords: prev.keywords.filter(k => k !== keyword)
    }));
  };

  const addLocation = () => {
    if (newLocation.trim() && !preferences.locations.includes(newLocation.trim())) {
      setPreferences(prev => ({
        ...prev,
        locations: [...prev.locations, newLocation.trim()]
      }));
      setNewLocation('');
    }
  };

  const removeLocation = (location: string) => {
    setPreferences(prev => ({
      ...prev,
      locations: prev.locations.filter(l => l !== location)
    }));
  };

  const toggleJobType = (jobType: string) => {
    setPreferences(prev => ({
      ...prev,
      job_types: prev.job_types.includes(jobType)
        ? prev.job_types.filter(t => t !== jobType)
        : [...prev.job_types, jobType]
    }));
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card"
      >
        <div className="flex items-center space-x-3 mb-6">
          <BellIcon className="h-6 w-6 text-primary-400" />
          <h2 className="text-xl font-semibold text-white">Notifications d'offres d'emploi</h2>
        </div>

        <div className="space-y-6">
          {/* Paramètres généraux */}
          <div>
            <h3 className="text-lg font-medium text-white mb-4">Paramètres généraux</h3>
            <div className="space-y-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={preferences.email_notifications}
                  onChange={(e) => setPreferences(prev => ({
                    ...prev,
                    email_notifications: e.target.checked
                  }))}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-white/10 rounded"
                />
                <span className="ml-3 text-gray-300">Notifications par email</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={preferences.push_notifications}
                  onChange={(e) => setPreferences(prev => ({
                    ...prev,
                    push_notifications: e.target.checked
                  }))}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-white/10 rounded"
                />
                <span className="ml-3 text-gray-300">Notifications push</span>
              </label>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Fréquence des notifications
                </label>
                <select
                  value={preferences.frequency}
                  onChange={(e) => setPreferences(prev => ({
                    ...prev,
                    frequency: e.target.value as 'immediate' | 'daily' | 'weekly'
                  }))}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {frequencyOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Critères de filtrage */}
          <div>
            <h3 className="text-lg font-medium text-white mb-4">Critères de filtrage</h3>
            
            {/* Types de contrat */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Types de contrat
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {jobTypeOptions.map(jobType => (
                  <label key={jobType} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={preferences.job_types.includes(jobType)}
                      onChange={() => toggleJobType(jobType)}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-white/10 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-300">{jobType}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Mots-clés */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Mots-clés
              </label>
              <div className="flex space-x-2 mb-3">
                <input
                  type="text"
                  value={newKeyword}
                  onChange={(e) => setNewKeyword(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addKeyword()}
                  placeholder="Ajouter un mot-clé"
                  className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <button
                  onClick={addKeyword}
                  className="btn-secondary"
                >
                  Ajouter
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {preferences.keywords.map(keyword => (
                  <span
                    key={keyword}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-primary-600/20 text-primary-400"
                  >
                    {keyword}
                    <button
                      onClick={() => removeKeyword(keyword)}
                      className="ml-2 text-primary-400 hover:text-primary-300"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Localisations */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Localisations
              </label>
              <div className="flex space-x-2 mb-3">
                <input
                  type="text"
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addLocation()}
                  placeholder="Ajouter une ville ou région"
                  className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <button
                  onClick={addLocation}
                  className="btn-secondary"
                >
                  Ajouter
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {preferences.locations.map(location => (
                  <span
                    key={location}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-primary-600/20 text-primary-400"
                  >
                    {location}
                    <button
                      onClick={() => removeLocation(location)}
                      className="ml-2 text-primary-400 hover:text-primary-300"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Salaire minimum */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Salaire minimum (€/an)
              </label>
              <input
                type="number"
                value={preferences.salary_min || ''}
                onChange={(e) => setPreferences(prev => ({
                  ...prev,
                  salary_min: e.target.value ? parseInt(e.target.value) : undefined
                }))}
                placeholder="Ex: 35000"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          {/* Bouton de sauvegarde */}
          <div className="flex justify-end">
            <button
              onClick={savePreferences}
              disabled={loading}
              className="btn-primary flex items-center space-x-2"
            >
              <span>{loading ? 'Sauvegarde...' : 'Sauvegarder les préférences'}</span>
            </button>
          </div>

          {/* Message de statut */}
          {message && (
            <div className={`mt-4 p-4 rounded-lg flex items-center space-x-2 ${
              message.type === 'success' 
                ? 'bg-green-900/50 text-green-400' 
                : 'bg-red-900/50 text-red-400'
            }`}>
              {message.type === 'success' ? (
                <CheckCircleIcon className="h-5 w-5" />
              ) : (
                <ExclamationTriangleIcon className="h-5 w-5" />
              )}
              <span>{message.text}</span>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default JobNotificationSettings;
