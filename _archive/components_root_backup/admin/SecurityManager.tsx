'use client';
import { useState, useEffect } from 'react';
import { FaShieldAlt, FaEye, FaLock, FaExclamationTriangle, FaCheck, FaBan } from 'react-icons/fa';

interface LoginAttempt {
  id: string;
  email: string;
  ip_address: string;
  user_agent: string;
  status: 'success' | 'failed' | 'blocked';
  timestamp: string;
  location?: string;
}

export default function SecurityManager() {
  const [activeTab, setActiveTab] = useState<'logs' | 'permissions' | 'settings'>('logs');
  const [selectedAttempt, setSelectedAttempt] = useState<LoginAttempt | null>(null);
  const [securitySettings, setSecuritySettings] = useState({
    secureSessions: false,
    twoFactorAuth: false,
    ipRestriction: false,
    passwordComplexity: true
  });

  // Charger les paramètres au démarrage
  useEffect(() => {
    const savedSettings = localStorage.getItem('adminSecuritySettings');
    if (savedSettings) {
      try {
        setSecuritySettings(JSON.parse(savedSettings));
      } catch (e) {
        console.error('Error loading security settings:', e);
      }
    }
  }, []);

  // Sauvegarder un paramètre
  const updateSecuritySetting = (settingKey: string, value: boolean) => {
    const newSettings = { ...securitySettings, [settingKey]: value };
    setSecuritySettings(newSettings);
    localStorage.setItem('adminSecuritySettings', JSON.stringify(newSettings));
    
    // Simuler une sauvegarde serveur
    console.log(`Paramètre ${settingKey} mis à jour:`, value);
    alert(`✅ Paramètre "${settingKey}" sauvegardé : ${value ? 'Activé' : 'Désactivé'}`);
  };
  const [loginAttempts] = useState<LoginAttempt[]>([
    {
      id: '1',
      email: 'admin@jobnex.ai',
      ip_address: '192.168.1.100',
      user_agent: 'Mozilla/5.0 (Mac) Chrome/120.0',
      status: 'success',
      timestamp: '2025-09-18 17:45:23',
      location: 'Paris, France'
    },
    {
      id: '2',
      email: 'hacker@evil.com',
      ip_address: '45.67.89.123',
      user_agent: 'curl/7.68.0',
      status: 'blocked',
      timestamp: '2025-09-18 17:32:15',
      location: 'Unknown'
    },
    {
      id: '3',
      email: 'john.doe@example.com',
      ip_address: '10.0.1.50',
      user_agent: 'Mozilla/5.0 (Windows) Firefox/118.0',
      status: 'failed',
      timestamp: '2025-09-18 16:28:45',
      location: 'Lyon, France'
    },
    {
      id: '4',
      email: 'marie.dupont@freelance.fr',
      ip_address: '82.45.123.67',
      user_agent: 'Mozilla/5.0 (iPhone) Safari/16.6',
      status: 'success',
      timestamp: '2025-09-18 15:15:12',
      location: 'Marseille, France'
    },
    {
      id: '5',
      email: 'test@spam.ru',
      ip_address: '185.220.101.47',
      user_agent: 'python-requests/2.28.1',
      status: 'blocked',
      timestamp: '2025-09-18 14:52:33',
      location: 'Russia'
    }
  ]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <FaCheck className="text-green-400" />;
      case 'failed': return <FaExclamationTriangle className="text-yellow-400" />;
      case 'blocked': return <FaBan className="text-red-400" />;
      default: return <FaShieldAlt className="text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'bg-green-600/20 text-green-400';
      case 'failed': return 'bg-yellow-600/20 text-yellow-400';
      case 'blocked': return 'bg-red-600/20 text-red-400';
      default: return 'bg-gray-600/20 text-gray-400';
    }
  };

  const handleBlockIP = (ip: string) => {
    if (window.confirm(`Bloquer définitivement l'IP ${ip} ?`)) {
      alert(`IP ${ip} bloquée (fonctionnalité démo)`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white">Sécurité</h2>
        <p className="text-gray-400">Logs de connexion, tentatives et permissions</p>
      </div>

      {/* Navigation Onglets */}
      <div className="flex border-b border-white/10">
        <button
          onClick={() => setActiveTab('logs')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'logs' 
              ? 'border-primary-400 text-primary-400' 
              : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          <FaEye />
          Logs de Connexion
        </button>
        <button
          onClick={() => setActiveTab('permissions')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'permissions' 
              ? 'border-primary-400 text-primary-400' 
              : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          <FaLock />
          Permissions
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'settings' 
              ? 'border-primary-400 text-primary-400' 
              : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          <FaShieldAlt />
          Paramètres Sécurité
        </button>
      </div>

      {activeTab === 'logs' ? (
        <div className="space-y-4">
          {/* Statistiques rapides */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-green-600/20 rounded-lg p-4 border border-green-600/30">
              <div className="flex items-center gap-2">
                <FaCheck className="text-green-400" />
                <span className="text-green-400 font-medium">Succès</span>
              </div>
              <div className="text-2xl font-bold text-green-400 mt-1">
                {loginAttempts.filter(a => a.status === 'success').length}
              </div>
            </div>
            <div className="bg-yellow-600/20 rounded-lg p-4 border border-yellow-600/30">
              <div className="flex items-center gap-2">
                <FaExclamationTriangle className="text-yellow-400" />
                <span className="text-yellow-400 font-medium">Échecs</span>
              </div>
              <div className="text-2xl font-bold text-yellow-400 mt-1">
                {loginAttempts.filter(a => a.status === 'failed').length}
              </div>
            </div>
            <div className="bg-red-600/20 rounded-lg p-4 border border-red-600/30">
              <div className="flex items-center gap-2">
                <FaBan className="text-red-400" />
                <span className="text-red-400 font-medium">Bloqués</span>
              </div>
              <div className="text-2xl font-bold text-red-400 mt-1">
                {loginAttempts.filter(a => a.status === 'blocked').length}
              </div>
            </div>
            <div className="bg-blue-600/20 rounded-lg p-4 border border-blue-600/30">
              <div className="flex items-center gap-2">
                <FaShieldAlt className="text-blue-400" />
                <span className="text-blue-400 font-medium">Total</span>
              </div>
              <div className="text-2xl font-bold text-blue-400 mt-1">{loginAttempts.length}</div>
            </div>
          </div>

          {/* Liste des tentatives */}
          <div className="bg-white/5 rounded-lg border border-white/10">
            <div className="p-4 border-b border-white/10">
              <h3 className="text-lg font-semibold text-white">Tentatives de Connexion Récentes</h3>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {loginAttempts.map(attempt => (
                <div 
                  key={attempt.id} 
                  className="p-4 border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer"
                  onClick={() => alert(`Détails de connexion:\n\nEmail: ${attempt.email}\nIP: ${attempt.ip_address}\nLocalisation: ${attempt.location}\nNavigateur: ${attempt.user_agent}\nStatut: ${attempt.status}\nHeure: ${attempt.timestamp}`)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(attempt.status)}
                      <div>
                        <div className="text-white font-medium">{attempt.email}</div>
                        <div className="text-sm text-gray-400">
                          {attempt.ip_address} • {attempt.location} • {attempt.timestamp}
                        </div>
                        <div className="text-xs text-gray-500 truncate max-w-md">
                          {attempt.user_agent}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(attempt.status)}`}>
                        {attempt.status}
                      </span>
                      {attempt.status === 'failed' && (
                        <button
                          onClick={() => handleBlockIP(attempt.ip_address)}
                          className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs transition-colors"
                        >
                          Bloquer IP
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : activeTab === 'permissions' ? (
        <div className="space-y-4">
          <div className="bg-white/5 rounded-lg p-6 border border-white/10">
            <h3 className="text-lg font-semibold text-white mb-4">Gestion des Rôles et Permissions</h3>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h4 className="text-white font-medium mb-3">Rôles Définis</h4>
                <div className="space-y-2">
                  <div 
                    className="flex justify-between items-center p-3 bg-white/5 rounded border border-white/10 cursor-pointer hover:bg-white/10 transition-colors"
                    onClick={() => alert('👑 UTILISATEURS SUPER ADMIN (2):\n\n• admin@jobnex.ai - Administrateur Principal\n• support@jobnex.ai - Support Team\n\n🔐 PERMISSIONS:\n• Toutes les permissions système\n• Gestion des utilisateurs admin\n• Accès base de données\n• Configuration serveur\n• Logs système complets')}
                  >
                    <span className="text-green-400 font-medium">Super Admin</span>
                    <span className="text-sm text-gray-400">2 utilisateurs</span>
                  </div>
                  <div 
                    className="flex justify-between items-center p-3 bg-white/5 rounded border border-white/10 cursor-pointer hover:bg-white/10 transition-colors"
                    onClick={() => alert('👨‍💼 UTILISATEURS ADMIN (5):\n\n• john.doe@example.com - John Doe\n• marie.dupont@freelance.fr - Marie Dupont\n• manager1@company.com - Support Manager\n• team@business.co - Business Team\n• operations@jobnex.ai - Operations\n\n🔐 PERMISSIONS:\n• Gestion utilisateurs\n• Statistiques et analytics\n• Configuration produits\n• Support client\n• Rapports business')}
                  >
                    <span className="text-blue-400 font-medium">Admin</span>
                    <span className="text-sm text-gray-400">5 utilisateurs</span>
                  </div>
                  <div 
                    className="flex justify-between items-center p-3 bg-white/5 rounded border border-white/10 cursor-pointer hover:bg-white/10 transition-colors"
                    onClick={() => alert('⭐ UTILISATEURS PREMIUM (142):\n\nExemples récents:\n• entrepreneur@startup.io - Sarah Chen\n• consultant@freelance.com - Marc Rodriguez\n• developer@agency.net - Alex Thompson\n• designer@studio.fr - Emma Martin\n• manager@corp.com - David Wilson\n\n[...137 autres utilisateurs]\n\n🔐 PERMISSIONS:\n• Fonctionnalités avancées\n• API access étendu\n• Support prioritaire\n• Exports de données\n• Intégrations tierces')}
                  >
                    <span className="text-purple-400 font-medium">Premium</span>
                    <span className="text-sm text-gray-400">142 utilisateurs</span>
                  </div>
                  <div 
                    className="flex justify-between items-center p-3 bg-white/5 rounded border border-white/10 cursor-pointer hover:bg-white/10 transition-colors"
                    onClick={() => alert('👤 UTILISATEURS FREE (1,098):\n\nExemples récents:\n• student@university.edu - Julie Dubois\n• user123@gmail.com - Antoine Lefebvre\n• seeker@outlook.fr - Camille Bernard\n• jobhunter@yahoo.com - Pierre Moreau\n• newuser@hotmail.fr - Sophie Leroy\n\n[...1,093 autres utilisateurs]\n\n🔐 PERMISSIONS:\n• Fonctionnalités de base\n• 5 requêtes par mois\n• Support email\n• Tableau de bord simple\n• Limite export')}
                  >
                    <span className="text-gray-400 font-medium">Free</span>
                    <span className="text-sm text-gray-400">1,098 utilisateurs</span>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="text-white font-medium mb-3">Permissions par Rôle</h4>
                <div className="text-sm space-y-2">
                  <div className="text-gray-400">
                    <strong className="text-green-400">Super Admin:</strong> Toutes permissions
                  </div>
                  <div className="text-gray-400">
                    <strong className="text-blue-400">Admin:</strong> Gestion utilisateurs, stats
                  </div>
                  <div className="text-gray-400">
                    <strong className="text-purple-400">Premium:</strong> Fonctionnalités avancées
                  </div>
                  <div className="text-gray-400">
                    <strong>Free:</strong> Fonctionnalités de base
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-white/5 rounded-lg p-6 border border-white/10">
            <h3 className="text-lg font-semibold text-white mb-4">Paramètres de Sécurité</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="text-white font-medium">Authentification à deux facteurs</h4>
                  <p className="text-sm text-gray-400">Obligatoire pour les comptes admin</p>
                </div>
                <input 
                  type="checkbox" 
                  className="rounded" 
                  checked={securitySettings.twoFactorAuth}
                  onChange={(e) => updateSecuritySetting('twoFactorAuth', e.target.checked)}
                />
              </div>
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="text-white font-medium">Blocage automatique IP</h4>
                  <p className="text-sm text-gray-400">Après 5 tentatives échouées</p>
                </div>
                <input 
                  type="checkbox" 
                  className="rounded" 
                  checked={securitySettings.ipRestriction}
                  onChange={(e) => updateSecuritySetting('ipRestriction', e.target.checked)}
                />
              </div>
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="text-white font-medium">Sessions sécurisées</h4>
                  <p className="text-sm text-gray-400">Déconnexion automatique après 2h d'inactivité</p>
                </div>
                <input 
                  type="checkbox" 
                  className="rounded" 
                  checked={securitySettings.secureSessions}
                  onChange={(e) => updateSecuritySetting('secureSessions', e.target.checked)}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
