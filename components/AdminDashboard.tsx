import { useState } from 'react';
import { FaUsers, FaSuitcase, FaCogs, FaChartBar, FaListAlt, FaEnvelope, FaShieldAlt, FaChartLine, FaPlug, FaEllipsisH } from 'react-icons/fa';
import UsersTable from './admin/UsersTable';
import ProductsCatalog from './admin/ProductsCatalog';
import PlansManager from './admin/PlansManager';
import AdminStatsAdvanced from './admin/AdminStatsAdvanced';
import AdminSettings from './admin/AdminSettings';

const menuItems = [
  { key: 'users', label: 'Utilisateurs', icon: <FaUsers aria-hidden="true" /> },
  { key: 'products', label: 'Catalogue Produits', icon: <FaSuitcase aria-hidden="true" /> },
  { key: 'plans', label: 'Abonnements', icon: <FaListAlt aria-hidden="true" /> },
  { key: 'stats', label: 'Statistiques & Logs', icon: <FaChartBar aria-hidden="true" /> },
  { key: 'communications', label: 'Communications', icon: <FaEnvelope aria-hidden="true" /> },
  { key: 'security', label: 'Sécurité', icon: <FaShieldAlt aria-hidden="true" /> },
  { key: 'analytics', label: 'Analytics', icon: <FaChartLine aria-hidden="true" /> },
  { key: 'integrations', label: 'API & Intégrations', icon: <FaPlug aria-hidden="true" /> },
  { key: 'settings', label: 'Configuration', icon: <FaCogs aria-hidden="true" /> },
  { key: 'custom', label: 'Autre', icon: <FaEllipsisH aria-hidden="true" /> },
];

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<typeof menuItems[number]['key']>('users');

  return (
    <div className="admin-dashboard flex flex-col lg:flex-row min-h-screen">
      {/* Sidebar */}
      <aside className="w-full lg:w-64 bg-gray-900 border-r border-white/10 p-4" aria-label="Menu administration">
        <h2 className="text-xl font-bold text-primary-400 mb-6">Admin</h2>
        <nav className="flex flex-col gap-2" role="tablist">
          {menuItems.map(item => (
            <button
              key={item.key}
              role="tab"
              aria-selected={activeTab === item.key}
              aria-controls={`admin-section-${item.key}`}
              tabIndex={0}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-left font-medium transition-colors
                ${activeTab === item.key ? 'bg-primary-700 text-white shadow' : 'text-gray-300 hover:bg-primary-800 hover:text-white'}`}
              onClick={() => setActiveTab(item.key as typeof activeTab)}
            >
              <span className="text-lg">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-6 overflow-auto">
        {activeTab === 'users' && (
          <section id="admin-section-users">
            <h3 className="text-lg font-semibold mb-4">Gestion des utilisateurs</h3>
            <UsersTable />
          </section>
        )}
        {activeTab === 'products' && (
          <section id="admin-section-products">
            <ProductsCatalog />
          </section>
        )}
        {activeTab === 'plans' && (
          <section id="admin-section-plans">
            <h3 className="text-lg font-semibold mb-4">Gestion des abonnements</h3>
            <PlansManager />
          </section>
        )}
        {activeTab === 'stats' && (
          <section id="admin-section-stats">
            <AdminStatsAdvanced />
          </section>
        )}
        {activeTab === 'communications' && (
          <section id="admin-section-communications">
            <h3 className="text-lg font-semibold mb-4">Communications</h3>
            <div className="space-y-4">
              <div className="bg-white/5 rounded-lg p-6 border border-white/10">
                <h4 className="text-white font-medium mb-2">📧 Gestion des emails</h4>
                <p className="text-gray-400 text-sm">Templates, notifications, campagnes email</p>
              </div>
              <div className="bg-white/5 rounded-lg p-6 border border-white/10">  
                <h4 className="text-white font-medium mb-2">🔔 Notifications</h4>
                <p className="text-gray-400 text-sm">Push notifications, SMS, alertes système</p>
              </div>
            </div>
          </section>
        )}
        {activeTab === 'security' && (
          <section id="admin-section-security">
            <h3 className="text-lg font-semibold mb-4">Sécurité</h3>
            <div className="space-y-4">
              <div className="bg-white/5 rounded-lg p-6 border border-white/10">
                <h4 className="text-white font-medium mb-2">🔐 Logs de connexion</h4>
                <p className="text-gray-400 text-sm">Tentatives de connexion, authentification</p>
              </div>
              <div className="bg-white/5 rounded-lg p-6 border border-white/10">
                <h4 className="text-white font-medium mb-2">👥 Gestion des permissions</h4>
                <p className="text-gray-400 text-sm">Rôles, accès, restrictions</p>
              </div>
            </div>
          </section>
        )}
        {activeTab === 'analytics' && (
          <section id="admin-section-analytics">
            <h3 className="text-lg font-semibold mb-4">Analytics</h3>
            <div className="space-y-4">
              <div className="bg-white/5 rounded-lg p-6 border border-white/10">
                <h4 className="text-white font-medium mb-2">📊 Rapports business</h4>
                <p className="text-gray-400 text-sm">CA, conversions, métriques avancées</p>
              </div>
              <div className="bg-white/5 rounded-lg p-6 border border-white/10">
                <h4 className="text-white font-medium mb-2">📈 Export de données</h4>
                <p className="text-gray-400 text-sm">CSV, Excel, API exports</p>
              </div>
            </div>
          </section>
        )}
        {activeTab === 'integrations' && (
          <section id="admin-section-integrations">
            <h3 className="text-lg font-semibold mb-4">API & Intégrations</h3>
            <div className="space-y-4">
              <div className="bg-white/5 rounded-lg p-6 border border-white/10">
                <h4 className="text-white font-medium mb-2">🔌 Webhooks</h4>
                <p className="text-gray-400 text-sm">Configuration des webhooks Stripe, autres services</p>
              </div>
              <div className="bg-white/5 rounded-lg p-6 border border-white/10">
                <h4 className="text-white font-medium mb-2">🔑 API Keys</h4>
                <p className="text-gray-400 text-sm">Gestion des clés API, tokens d'accès</p>
              </div>
            </div>
          </section>
        )}
        {activeTab === 'settings' && (
          <section id="admin-section-settings">
            <h3 className="text-lg font-semibold mb-4">Configuration</h3>
            <AdminSettings />
          </section>
        )}
        {activeTab === 'custom' && (
          <section id="admin-section-custom">
            <h3 className="text-lg font-semibold mb-4">Section personnalisée</h3>
            <div>À personnaliser selon les besoins futurs…</div>
          </section>
        )}
      </main>
    </div>
  );
}
