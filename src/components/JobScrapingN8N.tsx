import { useState, useEffect } from 'react';
import { Search, Loader2, Globe, MapPin, Briefcase, ExternalLink, RefreshCw } from 'lucide-react';
import { N8NService, ScrapedJob } from '../services/n8n-service';
import toast from 'react-hot-toast';

const SOURCES = [
  { id: 'linkedin', name: 'LinkedIn', icon: '💼', color: 'bg-blue-100 text-blue-700' },
  { id: 'indeed', name: 'Indeed', icon: '🔍', color: 'bg-indigo-100 text-indigo-700' },
  { id: 'wttj', name: 'Welcome to the Jungle', icon: '🌴', color: 'bg-green-100 text-green-700' },
  { id: 'malt', name: 'Malt', icon: '🎯', color: 'bg-purple-100 text-purple-700' }
];

export default function JobScrapingN8N() {
  const [searchQuery, setSearchQuery] = useState('');
  const [location, setLocation] = useState('France');
  const [selectedSource, setSelectedSource] = useState<string>('linkedin');
  const [isScraping, setIsScraping] = useState(false);
  const [jobs, setJobs] = useState<ScrapedJob[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Charger jobs au démarrage
  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    setIsLoading(true);
    try {
      const scrapedJobs = await N8NService.getScrapedJobs(undefined, 50);
      setJobs(scrapedJobs);
    } catch (error) {
      console.error('Error loading jobs:', error);
      toast.error('Erreur lors du chargement des jobs');
    } finally {
      setIsLoading(false);
    }
  };

  const handleScrape = async () => {
    if (!searchQuery.trim()) {
      toast.error('Veuillez entrer une recherche');
      return;
    }

    setIsScraping(true);
    try {
      await N8NService.scrapeJobs({
        searchQuery,
        location,
        source: selectedSource as any
      });

      toast.success(
        `Scraping lancé sur ${SOURCES.find(s => s.id === selectedSource)?.name}. Les résultats apparaîtront dans quelques minutes.`,
        { duration: 5000 }
      );

      // Recharger jobs après 10 secondes
      setTimeout(() => {
        loadJobs();
      }, 10000);
    } catch (error) {
      console.error('Error scraping:', error);
      toast.error('Erreur lors du lancement du scraping');
    } finally {
      setIsScraping(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays < 7) return `Il y a ${diffDays}j`;
    return date.toLocaleDateString('fr-FR');
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-purple-100 rounded-lg">
            <Globe className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Scraping d'Offres d'Emploi
            </h1>
            <p className="text-gray-600">
              Powered by N8N + Multi-Sources
            </p>
          </div>
        </div>

        {/* Search Form */}
        <div className="space-y-4">
          {/* Source Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Source
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {SOURCES.map((source) => (
                <button
                  key={source.id}
                  onClick={() => setSelectedSource(source.id)}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    selectedSource === source.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{source.icon}</span>
                    <span className="font-medium text-sm text-gray-900">
                      {source.name}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Search Query */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Recherche
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Ex: Développeur React, Data Scientist..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Localisation
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Ex: Paris, Lyon, Remote..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleScrape}
              disabled={isScraping || !searchQuery.trim()}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {isScraping ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Scraping en cours...
                </>
              ) : (
                <>
                  <Search className="w-5 h-5" />
                  Lancer le Scraping
                </>
              )}
            </button>

            <button
              onClick={loadJobs}
              disabled={isLoading}
              className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors flex items-center gap-2"
            >
              <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
              Actualiser
            </button>
          </div>
        </div>
      </div>

      {/* Jobs List */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">
            Offres Récentes ({jobs.length})
          </h2>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-12">
            <Briefcase className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">Aucune offre trouvée</p>
            <p className="text-sm text-gray-500 mt-1">
              Lancez un scraping pour voir les résultats
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {jobs.map((job) => (
              <div
                key={job.id}
                className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-bold text-gray-900 text-lg">
                        {job.title}
                      </h3>
                      {job.remote_type && (
                        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                          {job.remote_type}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                      <span className="flex items-center gap-1">
                        <Briefcase className="w-4 h-4" />
                        {job.company}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {job.location}
                      </span>
                      {job.experience_level && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                          {job.experience_level}
                        </span>
                      )}
                    </div>

                    <p className="text-sm text-gray-700 line-clamp-2 mb-3">
                      {job.description}
                    </p>

                    {job.skills && job.skills.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {job.skills.slice(0, 5).map((skill, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full"
                          >
                            {skill}
                          </span>
                        ))}
                        {job.skills.length > 5 && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                            +{job.skills.length - 5}
                          </span>
                        )}
                      </div>
                    )}

                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>Scrapé {formatDate(job.scraped_at)}</span>
                    </div>
                  </div>

                  <a
                    href={job.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-shrink-0 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    Voir l'offre
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
