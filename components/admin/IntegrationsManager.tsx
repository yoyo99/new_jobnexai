'use client';
import { useState } from 'react';
import { FaPlug, FaKey, FaLink, FaEye, FaEyeSlash, FaCopy, FaTrash, FaPlus } from 'react-icons/fa';

interface APIKey {
  id: string;
  name: string;
  key: string;
  permissions: string[];
  created_at: string;
  last_used: string | null;
  usage_count: number;
  active: boolean;
}

interface Webhook {
  id: string;
  name: string;
  url: string;
  events: string[];
  status: 'active' | 'inactive' | 'error';
  created_at: string;
  last_triggered: string | null;
  success_rate: number;
}

export default function IntegrationsManager() {
  const [activeTab, setActiveTab] = useState<'webhooks' | 'api-keys' | 'integrations'>('webhooks');
  const [showCreateWebhook, setShowCreateWebhook] = useState(false);
  const [showCreateAPIKey, setShowCreateAPIKey] = useState(false);
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());

  const [apiKeys, setApiKeys] = useState<APIKey[]>([
    {
      id: '1',
      name: 'Frontend App',
      key: 'sk_live_abc123...xyz789',
      permissions: ['read:users', 'write:subscriptions'],
      created_at: '2025-01-15',
      last_used: '2025-09-18',
      usage_count: 15420,
      active: true
    },
    {
      id: '2',
      name: 'Mobile App',
      key: 'sk_test_def456...uvw012',
      permissions: ['read:users', 'read:stats'],
      created_at: '2025-02-10',
      last_used: '2025-09-17',
      usage_count: 8934,
      active: true
    },
    {
      id: '3',
      name: 'Analytics Service',
      key: 'sk_live_ghi789...rst345',
      permissions: ['read:analytics', 'read:reports'],
      created_at: '2025-03-05',
      last_used: null,
      usage_count: 0,
      active: false
    }
  ]);

  const [webhooks, setWebhooks] = useState<Webhook[]>([
    {
      id: '1',
      name: 'Stripe Payment Webhook',
      url: 'https://api.jobnex.ai/webhooks/stripe',
      events: ['payment.succeeded', 'subscription.created', 'subscription.cancelled'],
      status: 'active',
      created_at: '2025-01-20',
      last_triggered: '2025-09-18',
      success_rate: 98.5
    },
    {
      id: '2',
      name: 'User Registration Hook',
      url: 'https://analytics.jobnex.ai/users/new',
      events: ['user.created', 'user.upgraded'],
      status: 'active',
      created_at: '2025-02-15',
      last_triggered: '2025-09-17',
      success_rate: 100
    },
    {
      id: '3',
      name: 'Email Service Hook',
      url: 'https://emails.jobnex.ai/trigger',
      events: ['subscription.trial_ending', 'payment.failed'],
      status: 'error',
      created_at: '2025-08-01',
      last_triggered: '2025-09-16',
      success_rate: 45.2
    }
  ]);

  const toggleKeyVisibility = (keyId: string) => {
    const newVisible = new Set(visibleKeys);
    if (newVisible.has(keyId)) {
      newVisible.delete(keyId);
    } else {
      newVisible.add(keyId);
    }
    setVisibleKeys(newVisible);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Clé copiée dans le presse-papiers !');
  };

  const handleDeleteAPIKey = (keyId: string) => {
    if (window.confirm('Supprimer définitivement cette clé API ?')) {
      setApiKeys(prev => prev.filter(key => key.id !== keyId));
    }
  };

  const handleToggleWebhook = (webhookId: string) => {
    setWebhooks(prev => prev.map(hook => 
      hook.id === webhookId 
        ? {...hook, status: hook.status === 'active' ? 'inactive' : 'active'}
        : hook
    ));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-600/20 text-green-400';
      case 'inactive': return 'bg-gray-600/20 text-gray-400';
      case 'error': return 'bg-red-600/20 text-red-400';
      default: return 'bg-gray-600/20 text-gray-400';
    }
  };

  const maskAPIKey = (key: string) => {
    return key.substring(0, 8) + '...' + key.substring(key.length - 8);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white">API & Intégrations</h2>
        <p className="text-gray-400">Webhooks, clés API et intégrations tierces</p>
      </div>

      {/* Navigation Onglets */}
      <div className="flex border-b border-white/10">
        <button
          onClick={() => setActiveTab('webhooks')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'webhooks' 
              ? 'border-primary-400 text-primary-400' 
              : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          <FaLink />
          Webhooks
        </button>
        <button
          onClick={() => setActiveTab('api-keys')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'api-keys' 
              ? 'border-primary-400 text-primary-400' 
              : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          <FaKey />
          Clés API
        </button>
        <button
          onClick={() => setActiveTab('integrations')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'integrations' 
              ? 'border-primary-400 text-primary-400' 
              : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          <FaPlug />
          Intégrations
        </button>
      </div>

      {activeTab === 'webhooks' ? (
        <div className="space-y-4">
          {/* Header avec bouton création */}
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-white">Gestion des Webhooks</h3>
            <button 
              onClick={() => setShowCreateWebhook(!showCreateWebhook)}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center gap-2"
            >
              <FaPlus className="text-sm" />
              Nouveau Webhook
            </button>
          </div>

          {/* Formulaire création webhook */}
          {showCreateWebhook && (
            <div className="bg-white/5 rounded-lg p-6 border border-white/10">
              <h4 className="text-white font-medium mb-4">Créer un nouveau webhook</h4>
              <div className="grid grid-cols-2 gap-4">
                <input placeholder="Nom du webhook" className="px-3 py-2 bg-white/10 border border-white/20 rounded text-white" />
                <input placeholder="URL de destination" className="px-3 py-2 bg-white/10 border border-white/20 rounded text-white" />
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-2">Événements à écouter :</label>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <label className="flex items-center gap-2 text-gray-300">
                      <input type="checkbox" className="rounded" />
                      payment.succeeded
                    </label>
                    <label className="flex items-center gap-2 text-gray-300">
                      <input type="checkbox" className="rounded" />
                      subscription.created
                    </label>
                    <label className="flex items-center gap-2 text-gray-300">
                      <input type="checkbox" className="rounded" />
                      user.upgraded
                    </label>
                  </div>
                </div>
                <div className="col-span-2 flex gap-2">
                  <button className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded">Créer</button>
                  <button 
                    onClick={() => setShowCreateWebhook(false)}
                    className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Liste webhooks */}
          <div className="space-y-4">
            {webhooks.map(webhook => (
              <div key={webhook.id} className="bg-white/5 rounded-lg p-6 border border-white/10">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="text-lg font-semibold text-white">{webhook.name}</h4>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(webhook.status)}`}>
                        {webhook.status}
                      </span>
                    </div>
                    <p className="text-gray-400 mb-2">URL: {webhook.url}</p>
                    <div className="text-sm text-gray-500 mb-2">
                      Événements: {webhook.events.join(', ')}
                    </div>
                    <div className="text-sm text-gray-500">
                      Créé le {new Date(webhook.created_at).toLocaleDateString()} • 
                      Taux de succès: {webhook.success_rate}%
                      {webhook.last_triggered && ` • Dernier déclenchement: ${new Date(webhook.last_triggered).toLocaleDateString()}`}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => alert(`Tester webhook: ${webhook.name}`)}
                      className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition-colors"
                    >
                      Tester
                    </button>
                    <button
                      onClick={() => handleToggleWebhook(webhook.id)}
                      className={`px-3 py-2 rounded text-sm transition-colors ${
                        webhook.status === 'active' 
                          ? 'bg-yellow-600 hover:bg-yellow-700' 
                          : 'bg-green-600 hover:bg-green-700'
                      } text-white`}
                    >
                      {webhook.status === 'active' ? 'Désactiver' : 'Activer'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : activeTab === 'api-keys' ? (
        <div className="space-y-4">
          {/* Header avec bouton création */}
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-white">Gestion des Clés API</h3>
            <button 
              onClick={() => setShowCreateAPIKey(!showCreateAPIKey)}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center gap-2"
            >
              <FaPlus className="text-sm" />
              Nouvelle Clé API
            </button>
          </div>

          {/* Formulaire création clé API */}
          {showCreateAPIKey && (
            <div className="bg-white/5 rounded-lg p-6 border border-white/10">
              <h4 className="text-white font-medium mb-4">Créer une nouvelle clé API</h4>
              <div className="grid grid-cols-2 gap-4">
                <input placeholder="Nom de la clé" className="px-3 py-2 bg-white/10 border border-white/20 rounded text-white" />
                <select className="px-3 py-2 bg-white/10 border border-white/20 rounded text-white">
                  <option>Environnement: Production</option>
                  <option>Environnement: Test</option>
                </select>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-2">Permissions :</label>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <label className="flex items-center gap-2 text-gray-300">
                      <input type="checkbox" className="rounded" />
                      read:users
                    </label>
                    <label className="flex items-center gap-2 text-gray-300">
                      <input type="checkbox" className="rounded" />
                      write:subscriptions
                    </label>
                    <label className="flex items-center gap-2 text-gray-300">
                      <input type="checkbox" className="rounded" />
                      read:analytics
                    </label>
                  </div>
                </div>
                <div className="col-span-2 flex gap-2">
                  <button className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded">Générer</button>
                  <button 
                    onClick={() => setShowCreateAPIKey(false)}
                    className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Liste clés API */}
          <div className="space-y-4">
            {apiKeys.map(apiKey => (
              <div key={apiKey.id} className="bg-white/5 rounded-lg p-6 border border-white/10">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="text-lg font-semibold text-white">{apiKey.name}</h4>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        apiKey.active ? 'bg-green-600/20 text-green-400' : 'bg-gray-600/20 text-gray-400'
                      }`}>
                        {apiKey.active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <code className="bg-gray-800 px-2 py-1 rounded text-sm text-gray-300 font-mono">
                        {visibleKeys.has(apiKey.id) ? apiKey.key : maskAPIKey(apiKey.key)}
                      </code>
                      <button
                        onClick={() => toggleKeyVisibility(apiKey.id)}
                        className="text-gray-400 hover:text-white p-1"
                        title={visibleKeys.has(apiKey.id) ? 'Masquer' : 'Afficher'}
                      >
                        {visibleKeys.has(apiKey.id) ? <FaEyeSlash /> : <FaEye />}
                      </button>
                      <button
                        onClick={() => copyToClipboard(apiKey.key)}
                        className="text-gray-400 hover:text-white p-1"
                        title="Copier"
                      >
                        <FaCopy />
                      </button>
                    </div>
                    <div className="text-sm text-gray-400 mb-2">
                      Permissions: {apiKey.permissions.join(', ')}
                    </div>
                    <div className="text-sm text-gray-500">
                      Créée le {new Date(apiKey.created_at).toLocaleDateString()} • 
                      {apiKey.usage_count.toLocaleString()} utilisations
                      {apiKey.last_used && ` • Dernière utilisation: ${new Date(apiKey.last_used).toLocaleDateString()}`}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => alert(`Régénérer clé: ${apiKey.name}`)}
                      className="px-3 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded text-sm transition-colors"
                    >
                      Régénérer
                    </button>
                    <button
                      onClick={() => handleDeleteAPIKey(apiKey.id)}
                      className="p-2 text-red-400 hover:text-red-300 hover:bg-red-600/10 rounded transition-colors"
                      title="Supprimer"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Section Intégrations */}
          <div className="bg-white/5 rounded-lg p-6 border border-white/10">
            <h3 className="text-lg font-semibold text-white mb-4">Intégrations Disponibles</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 border border-white/10 rounded-lg">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold">S</span>
                  </div>
                  <div>
                    <h4 className="text-white font-medium">Stripe</h4>
                    <p className="text-sm text-gray-400">Paiements et abonnements</p>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="px-2 py-1 bg-green-600/20 text-green-400 text-xs rounded">Connecté</span>
                  <button className="text-blue-400 hover:text-blue-300 text-sm">Configurer</button>
                </div>
              </div>
              <div className="p-4 border border-white/10 rounded-lg">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold">G</span>
                  </div>
                  <div>
                    <h4 className="text-white font-medium">Google Analytics</h4>
                    <p className="text-sm text-gray-400">Tracking utilisateurs</p>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="px-2 py-1 bg-gray-600/20 text-gray-400 text-xs rounded">Non configuré</span>
                  <button className="text-green-400 hover:text-green-300 text-sm">Connecter</button>
                </div>
              </div>
              <div className="p-4 border border-white/10 rounded-lg">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold">S</span>
                  </div>
                  <div>
                    <h4 className="text-white font-medium">SendGrid</h4>
                    <p className="text-sm text-gray-400">Service d'emails</p>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="px-2 py-1 bg-green-600/20 text-green-400 text-xs rounded">Connecté</span>
                  <button className="text-blue-400 hover:text-blue-300 text-sm">Configurer</button>
                </div>
              </div>
              <div className="p-4 border border-white/10 rounded-lg">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-orange-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold">Z</span>
                  </div>
                  <div>
                    <h4 className="text-white font-medium">Zapier</h4>
                    <p className="text-sm text-gray-400">Automatisation</p>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="px-2 py-1 bg-gray-600/20 text-gray-400 text-xs rounded">Non configuré</span>
                  <button className="text-green-400 hover:text-green-300 text-sm">Connecter</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
