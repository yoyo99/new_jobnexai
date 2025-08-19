import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  GlobeAltIcon, 
  PlayIcon, 
  StopIcon, 
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  AdjustmentsHorizontalIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../stores/auth';
import { supabase } from '../lib/supabase';

interface ScrapingCriteria {
  countries: string[];
  cities: string[];
  jobTitles: string[];
  salaryRange: {
    min?: number;
    max?: number;
    currency: string;
  };
  experienceLevel: 'junior' | 'mid' | 'senior' | 'all';
  contractTypes: string[];
  remote: boolean | null;
  keywords: string[];
}

interface JobSite {
  id: string;
  name: string;
  type: 'job_board' | 'freelance_platform';
  country: string;
  active: boolean;
}

interface ScrapingSession {
  id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  started_at: string;
  completed_at?: string;
  total_jobs: number;
  errors: string[];
}

const WebScrapingManager: React.FC = () => {
  const { user } = useAuth();
  const [criteria, setCriteria] = useState<ScrapingCriteria>({
    countries: ['FR'],
    cities: ['Paris'],
    jobTitles: ['Développeur'],
    salaryRange: { min: 30000, max: 80000, currency: 'EUR' },
    experienceLevel: 'all',
    contractTypes: ['CDI', 'CDD'],
    remote: null,
    keywords: []
  });

  const [availableSites, setAvailableSites] = useState<JobSite[]>([]);
  const [selectedSites, setSelectedSites] = useState<string[]>([]);
  const [currentSession, setCurrentSession] = useState<ScrapingSession | null>(null);
  const [scrapedJobs, setScrapedJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadAvailableSites();
  }, []);

  useEffect(() => {
    if (currentSession?.status === 'running') {
      const interval = setInterval(() => {
        checkSessionStatus();
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [currentSession]);

  const loadAvailableSites = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/web-scraper`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get_available_sites' })
      });

      if (response.ok) {
        const data = await response.json();
        setAvailableSites(data.sites || []);
        setSelectedSites(data.sites?.slice(0, 3).map((s: JobSite) => s.id) || []);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des sites:', error);
    }
  };

  const startScraping = async () => {
    if (!user || selectedSites.length === 0) return;

    setLoading(true);
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/web-scraper`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'start_scraping',
          criteria,
          sites: selectedSites,
          sessionId
        })
      });

      if (response.ok) {
        const data = await response.json();
        setCurrentSession({
          id: sessionId,
          status: 'running',
          started_at: new Date().toISOString(),
          total_jobs: 0,
          errors: []
        });
      } else {
        throw new Error('Erreur lors du démarrage du scraping');
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors du démarrage du scraping');
    } finally {
      setLoading(false);
    }
  };

  const checkSessionStatus = async () => {
    if (!currentSession) return;

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/web-scraper`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'get_session_status',
          sessionId: currentSession.id
        })
      });

      if (response.ok) {
        const data = await response.json();
        setCurrentSession(data.session);

        if (data.session.status === 'completed') {
          loadScrapedJobs(currentSession.id);
        }
      }
    } catch (error) {
      console.error('Erreur lors de la vérification du statut:', error);
    }
  };

  const loadScrapedJobs = async (sessionId: string) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/web-scraper`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'get_scraped_jobs',
          sessionId
        })
      });

      if (response.ok) {
        const data = await response.json();
        setScrapedJobs(data.jobs || []);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des offres:', error);
    }
  };

  const getStatusIcon = () => {
    switch (currentSession?.status) {
      case 'running':
        return <ClockIcon className="h-5 w-5 text-yellow-500 animate-spin" />;
      case 'completed':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'failed':
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 border border-blue-500/30 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <GlobeAltIcon className="h-8 w-8 text-blue-400" />
          <div>
            <h2 className="text-2xl font-bold text-white">Scraping Web Multi-Sites</h2>
            <p className="text-gray-300">Recherchez des offres sur plusieurs sites simultanément</p>
          </div>
        </div>
      </div>

      {/* Configuration des critères */}
      <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <AdjustmentsHorizontalIcon className="h-5 w-5 text-gray-400" />
          <h3 className="text-lg font-semibold text-white">Critères de recherche</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Pays */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Pays</label>
            <select
              value={criteria.countries[0] || 'FR'}
              onChange={(e) => setCriteria({...criteria, countries: [e.target.value]})}
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="FR">France</option>
              <option value="US">États-Unis</option>
              <option value="UK">Royaume-Uni</option>
              <option value="DE">Allemagne</option>
              <option value="CA">Canada</option>
            </select>
          </div>

          {/* Villes */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Villes</label>
            <input
              type="text"
              value={criteria.cities.join(', ')}
              onChange={(e) => setCriteria({...criteria, cities: e.target.value.split(', ').filter(Boolean)})}
              placeholder="Paris, Lyon, Marseille"
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Métiers */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Métiers</label>
            <input
              type="text"
              value={criteria.jobTitles.join(', ')}
              onChange={(e) => setCriteria({...criteria, jobTitles: e.target.value.split(', ').filter(Boolean)})}
              placeholder="Développeur, Designer, Data Scientist"
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Salaire min */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Salaire min (€)</label>
            <input
              type="number"
              value={criteria.salaryRange.min || ''}
              onChange={(e) => setCriteria({
                ...criteria, 
                salaryRange: {...criteria.salaryRange, min: parseInt(e.target.value) || undefined}
              })}
              placeholder="30000"
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Salaire max */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Salaire max (€)</label>
            <input
              type="number"
              value={criteria.salaryRange.max || ''}
              onChange={(e) => setCriteria({
                ...criteria, 
                salaryRange: {...criteria.salaryRange, max: parseInt(e.target.value) || undefined}
              })}
              placeholder="80000"
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Niveau d'expérience */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Expérience</label>
            <select
              value={criteria.experienceLevel}
              onChange={(e) => setCriteria({...criteria, experienceLevel: e.target.value as any})}
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tous niveaux</option>
              <option value="junior">Junior (0-2 ans)</option>
              <option value="mid">Confirmé (2-5 ans)</option>
              <option value="senior">Senior (5+ ans)</option>
            </select>
          </div>
        </div>

        {/* Mots-clés */}
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-300 mb-2">Mots-clés supplémentaires</label>
          <input
            type="text"
            value={criteria.keywords.join(', ')}
            onChange={(e) => setCriteria({...criteria, keywords: e.target.value.split(', ').filter(Boolean)})}
            placeholder="React, Node.js, TypeScript, Remote"
            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Sélection des sites */}
      <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Sites à scraper</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {availableSites.map(site => (
            <label key={site.id} className="flex items-center space-x-3 p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer">
              <input
                type="checkbox"
                checked={selectedSites.includes(site.id)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedSites([...selectedSites, site.id]);
                  } else {
                    setSelectedSites(selectedSites.filter(id => id !== site.id));
                  }
                }}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <div>
                <div className="text-white font-medium">{site.name}</div>
                <div className="text-xs text-gray-400">{site.type === 'job_board' ? 'Emploi' : 'Freelance'} • {site.country}</div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Contrôles */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={startScraping}
            disabled={loading || currentSession?.status === 'running' || selectedSites.length === 0 || criteria.jobTitles.length === 0}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
          >
            <PlayIcon className="h-5 w-5" />
            {loading ? 'Démarrage...' : 'Lancer le scraping'}
          </button>

          <div className="text-sm text-gray-400">
            {selectedSites.length} site{selectedSites.length > 1 ? 's' : ''} sélectionné{selectedSites.length > 1 ? 's' : ''}
          </div>
        </div>

        {currentSession && (
          <div className="flex items-center gap-2 text-sm">
            {getStatusIcon()}
            <span className="text-gray-300">
              {currentSession.status === 'running' && 'Scraping en cours...'}
              {currentSession.status === 'completed' && `${currentSession.total_jobs} offres trouvées`}
              {currentSession.status === 'failed' && 'Échec du scraping'}
            </span>
          </div>
        )}
      </div>

      {/* Résultats */}
      {scrapedJobs.length > 0 && (
        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            Offres trouvées ({scrapedJobs.length})
          </h3>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {scrapedJobs.map((job, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="p-4 bg-white/5 rounded-lg border border-white/10"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-white">{job.title}</h4>
                    <p className="text-sm text-gray-300">{job.company} • {job.location}</p>
                    {job.salary && (
                      <p className="text-sm text-green-400">{job.salary}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">Source: {job.source}</p>
                  </div>
                  <a
                    href={job.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 text-sm"
                  >
                    Voir l'offre →
                  </a>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default WebScrapingManager;
