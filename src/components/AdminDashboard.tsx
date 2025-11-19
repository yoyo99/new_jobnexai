import { useState } from 'react';
import { FaUsers, FaSuitcase, FaCogs, FaChartBar, FaListAlt, FaEnvelope, FaShieldAlt, FaChartLine, FaPlug, FaEllipsisH } from 'react-icons/fa';
import UsersTable from './admin/UsersTable';
import ProductsCatalog from './admin/ProductsCatalog';
import PlansManager from './admin/PlansManager';
import AdminStatsAdvanced from './admin/AdminStatsAdvanced';
import AdminSettings from './admin/AdminSettings';
import CommunicationsManager from './admin/CommunicationsManager';
import SecurityManager from './admin/SecurityManager';
import AnalyticsManager from './admin/AnalyticsManager';
import IntegrationsManager from './admin/IntegrationsManager';

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
      <aside className="admin-sidebar bg-gradient-to-b from-gray-800 to-gray-900 text-white w-64 lg:w-72 flex-shrink-0 border-r border-gray-600/50">
        <div className="p-6">
          <h2 className="text-xl font-bold text-center text-primary-400 mb-4">Admin</h2>
          <button 
            onClick={() => window.location.href = '/dashboard'}
            className="w-full px-3 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 mb-4"
          >
            🏠 Retour Dashboard
          </button>
        </div>
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
            <CommunicationsManager />
          </section>
        )}
        {activeTab === 'security' && (
          <section id="admin-section-security">
            <SecurityManager />
          </section>
        )}
        {activeTab === 'analytics' && (
          <section id="admin-section-analytics">
            <AnalyticsManager />
          </section>
        )}
        {activeTab === 'integrations' && (
          <section id="admin-section-integrations">
            <IntegrationsManager />
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
