import { useState } from 'react';
import { FaUsers, FaSuitcase, FaCogs, FaChartBar, FaListAlt, FaServer, FaEllipsisH } from 'react-icons/fa';
import UsersTable from './admin/UsersTable';
import ProductsCatalog from './admin/ProductsCatalog';
import ScrapingSitesManager from './admin/ScrapingSitesManager';
import PlansManager from './admin/PlansManager';
import AdminStatsAdvanced from './admin/AdminStatsAdvanced';
import AdminSettings from './admin/AdminSettings';

const menuItems = [
  { key: 'users', label: 'Utilisateurs', icon: <FaUsers aria-hidden="true" /> },
  { key: 'products', label: 'Catalogue Produits', icon: <FaSuitcase aria-hidden="true" /> },
  { key: 'scraping', label: 'Scraping', icon: <FaServer aria-hidden="true" /> },
  { key: 'plans', label: 'Abonnements', icon: <FaListAlt aria-hidden="true" /> },
  { key: 'stats', label: 'Statistiques & Logs', icon: <FaChartBar aria-hidden="true" /> },
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
        {activeTab === 'scraping' && (
          <section id="admin-section-scraping">
            <h3 className="text-lg font-semibold mb-4">Gestion du scraping</h3>
            <ScrapingSitesManager />
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
        {activeTab === 'settings' && (
          <section id="admin-section-settings">
            <h3 className="text-lg font-semibold mb-4">Configuration avancée</h3>
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
