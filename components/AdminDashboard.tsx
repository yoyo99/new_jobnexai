import React, { useState } from 'react';
import UsersTable from './admin/UsersTable';
import OffersTable from './admin/OffersTable';
import ScrapingSitesManager from './admin/ScrapingSitesManager';
import PlansManager from './admin/PlansManager';
import AdminStats from './admin/AdminStats';
import AdminSettings from './admin/AdminSettings';

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'users'|'offers'|'scraping'|'plans'|'stats'|'settings'|'custom'>('users');

  return (
    <div className="admin-dashboard flex flex-col lg:flex-row min-h-screen">
      {/* Sidebar */}
      <aside className="w-full lg:w-64 bg-gray-900 border-r border-white/10 p-4">
        <h2 className="text-xl font-bold text-primary-400 mb-6">Admin</h2>
        <nav className="flex flex-col gap-2">
          <button onClick={() => setActiveTab('users')}>Utilisateurs</button>
          <button onClick={() => setActiveTab('offers')}>Offres</button>
          <button onClick={() => setActiveTab('scraping')}>Scraping</button>
          <button onClick={() => setActiveTab('plans')}>Abonnements</button>
          <button onClick={() => setActiveTab('stats')}>Statistiques & Logs</button>
          <button onClick={() => setActiveTab('settings')}>Configuration</button>
          <button onClick={() => setActiveTab('custom')}>Autre</button>
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-6 overflow-auto">
        {activeTab === 'users' && (
          <section>
            <h3 className="text-lg font-semibold mb-4">Gestion des utilisateurs</h3>
            <UsersTable />
          </section>
        )}
        {activeTab === 'offers' && (
          <section>
            <h3 className="text-lg font-semibold mb-4">Gestion des offres</h3>
            <OffersTable />
          </section>
        )}
        {activeTab === 'scraping' && (
          <section>
            <h3 className="text-lg font-semibold mb-4">Gestion du scraping</h3>
            <ScrapingSitesManager />
          </section>
        )}
        {activeTab === 'plans' && (
          <section>
            <h3 className="text-lg font-semibold mb-4">Gestion des abonnements</h3>
            <PlansManager />
          </section>
        )}
        {activeTab === 'stats' && (
          <section>
            <h3 className="text-lg font-semibold mb-4">Statistiques & Logs</h3>
            <AdminStats />
          </section>
        )}
        {activeTab === 'settings' && (
          <section>
            <h3 className="text-lg font-semibold mb-4">Configuration avancée</h3>
            <AdminSettings />
          </section>
        )}
        {activeTab === 'custom' && (
          <section>
            <h3 className="text-lg font-semibold mb-4">Section personnalisée</h3>
            <div>À personnaliser selon les besoins futurs…</div>
          </section>
        )}
      </main>
    </div>
  );
}
