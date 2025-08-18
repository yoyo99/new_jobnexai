import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../stores/auth';
import { supabase } from '../lib/supabase';
import AdminProtection from './AdminProtection';
import { 
  CogIcon, 
  UserGroupIcon, 
  ShieldCheckIcon, 
  ExclamationTriangleIcon,
  CheckCircleIcon 
} from '@heroicons/react/24/outline';

interface SystemSettings {
  maintenance_mode: boolean;
  registration_enabled: boolean;
  max_users: number;
  api_rate_limit: number;
  email_notifications_enabled: boolean;
  debug_mode: boolean;
}

interface UserStats {
  total_users: number;
  active_users: number;
  premium_users: number;
  admin_users: number;
}

const AdminSettings: React.FC = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<SystemSettings>({
    maintenance_mode: false,
    registration_enabled: true,
    max_users: 10000,
    api_rate_limit: 1000,
    email_notifications_enabled: true,
    debug_mode: false
  });
  const [userStats, setUserStats] = useState<UserStats>({
    total_users: 0,
    active_users: 0,
    premium_users: 0,
    admin_users: 0
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadSettings();
    loadUserStats();
  }, []);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading settings:', error);
        return;
      }

      if (data) {
        setSettings(data);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const loadUserStats = async () => {
    try {
      // Simuler les statistiques utilisateurs
      // Dans une vraie implémentation, ces données viendraient de la base de données
      setUserStats({
        total_users: 1247,
        active_users: 892,
        premium_users: 156,
        admin_users: 3
      });
    } catch (error) {
      console.error('Error loading user stats:', error);
    }
  };

  const saveSettings = async () => {
    setLoading(true);
    setMessage(null);

    try {
      const { error } = await supabase
        .from('system_settings')
        .upsert({
          id: 1, // ID fixe pour les paramètres système
          ...settings,
          updated_at: new Date().toISOString(),
          updated_by: user?.id
        });

      if (error) throw error;

      setMessage({ type: 'success', text: 'Paramètres sauvegardés avec succès' });
    } catch (error) {
      console.error('Error saving settings:', error);
      setMessage({ type: 'error', text: 'Erreur lors de la sauvegarde' });
    } finally {
      setLoading(false);
    }
  };

  const toggleSetting = (key: keyof SystemSettings) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const updateSetting = (key: keyof SystemSettings, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  return (
    <AdminProtection requiredRole="admin">
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card"
        >
          <div className="flex items-center space-x-3 mb-6">
            <CogIcon className="h-6 w-6 text-primary-400" />
            <h2 className="text-xl font-semibold text-white">Paramètres Administrateur</h2>
          </div>

          {/* Statistiques utilisateurs */}
          <div className="mb-8">
            <h3 className="text-lg font-medium text-white mb-4 flex items-center">
              <UserGroupIcon className="h-5 w-5 mr-2" />
              Statistiques utilisateurs
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white/5 p-4 rounded-lg">
                <div className="text-2xl font-bold text-white">{userStats.total_users}</div>
                <div className="text-sm text-gray-400">Total utilisateurs</div>
              </div>
              <div className="bg-white/5 p-4 rounded-lg">
                <div className="text-2xl font-bold text-green-400">{userStats.active_users}</div>
                <div className="text-sm text-gray-400">Utilisateurs actifs</div>
              </div>
              <div className="bg-white/5 p-4 rounded-lg">
                <div className="text-2xl font-bold text-primary-400">{userStats.premium_users}</div>
                <div className="text-sm text-gray-400">Utilisateurs premium</div>
              </div>
              <div className="bg-white/5 p-4 rounded-lg">
                <div className="text-2xl font-bold text-yellow-400">{userStats.admin_users}</div>
                <div className="text-sm text-gray-400">Administrateurs</div>
              </div>
            </div>
          </div>

          {/* Paramètres système */}
          <div className="mb-8">
            <h3 className="text-lg font-medium text-white mb-4 flex items-center">
              <ShieldCheckIcon className="h-5 w-5 mr-2" />
              Paramètres système
            </h3>
            <div className="space-y-6">
              {/* Mode maintenance */}
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                <div>
                  <h4 className="text-white font-medium">Mode maintenance</h4>
                  <p className="text-sm text-gray-400">
                    Désactive temporairement l'accès à l'application pour tous les utilisateurs non-admin
                  </p>
                </div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.maintenance_mode}
                    onChange={() => toggleSetting('maintenance_mode')}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-white/10 rounded"
                  />
                </label>
              </div>

              {/* Inscription activée */}
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                <div>
                  <h4 className="text-white font-medium">Inscriptions ouvertes</h4>
                  <p className="text-sm text-gray-400">
                    Permet aux nouveaux utilisateurs de créer un compte
                  </p>
                </div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.registration_enabled}
                    onChange={() => toggleSetting('registration_enabled')}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-white/10 rounded"
                  />
                </label>
              </div>

              {/* Notifications email */}
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                <div>
                  <h4 className="text-white font-medium">Notifications email globales</h4>
                  <p className="text-sm text-gray-400">
                    Active l'envoi d'emails de notification système
                  </p>
                </div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.email_notifications_enabled}
                    onChange={() => toggleSetting('email_notifications_enabled')}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-white/10 rounded"
                  />
                </label>
              </div>

              {/* Mode debug */}
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                <div>
                  <h4 className="text-white font-medium">Mode debug</h4>
                  <p className="text-sm text-gray-400">
                    Active les logs détaillés et les informations de débogage
                  </p>
                </div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.debug_mode}
                    onChange={() => toggleSetting('debug_mode')}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-white/10 rounded"
                  />
                </label>
              </div>

              {/* Limites numériques */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-white/5 rounded-lg">
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Nombre maximum d'utilisateurs
                  </label>
                  <input
                    type="number"
                    value={settings.max_users}
                    onChange={(e) => updateSetting('max_users', parseInt(e.target.value))}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div className="p-4 bg-white/5 rounded-lg">
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Limite de requêtes API (par heure)
                  </label>
                  <input
                    type="number"
                    value={settings.api_rate_limit}
                    onChange={(e) => updateSetting('api_rate_limit', parseInt(e.target.value))}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Actions dangereuses */}
          <div className="mb-8">
            <h3 className="text-lg font-medium text-red-400 mb-4 flex items-center">
              <ExclamationTriangleIcon className="h-5 w-5 mr-2" />
              Actions dangereuses
            </h3>
            <div className="space-y-4">
              <div className="p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
                <h4 className="text-red-400 font-medium mb-2">Purger les logs anciens</h4>
                <p className="text-sm text-gray-400 mb-3">
                  Supprime tous les logs de plus de 30 jours. Cette action est irréversible.
                </p>
                <button className="btn-danger">
                  Purger les logs
                </button>
              </div>

              <div className="p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
                <h4 className="text-red-400 font-medium mb-2">Réinitialiser le cache</h4>
                <p className="text-sm text-gray-400 mb-3">
                  Vide tous les caches système. Peut temporairement ralentir l'application.
                </p>
                <button className="btn-danger">
                  Réinitialiser le cache
                </button>
              </div>
            </div>
          </div>

          {/* Bouton de sauvegarde */}
          <div className="flex justify-end">
            <button
              onClick={saveSettings}
              disabled={loading}
              className="btn-primary flex items-center space-x-2"
            >
              <span>{loading ? 'Sauvegarde...' : 'Sauvegarder les paramètres'}</span>
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
        </motion.div>
      </div>
    </AdminProtection>
  );
};

export default AdminSettings;
