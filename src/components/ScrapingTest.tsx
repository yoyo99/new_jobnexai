// src/components/ScrapingTest.tsx
// Composant de test pour l'intégration VPS N8N

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { scrapingApi, type AvailableScrapers, type ScrapingResponse } from '../services/scrapingApi';
import { Loader2, Play, CheckCircle, AlertCircle, Clock, Wifi } from 'lucide-react';

export const ScrapingTest: React.FC = () => {
  const [scrapers, setScrapers] = useState<AvailableScrapers | null>(null);
  const [loading, setLoading] = useState(false);
  const [healthStatus, setHealthStatus] = useState<'unknown' | 'healthy' | 'error'>('unknown');
  const [testQuery, setTestQuery] = useState('développeur react');
  const [testLocation, setTestLocation] = useState('Paris');
  const [scrapingResults, setScrapingResults] = useState<Record<string, ScrapingResponse>>({});
  const [activeJobs, setActiveJobs] = useState<Set<string>>(new Set());

  // Charger les scrapers au montage
  useEffect(() => {
    loadScrapers();
    checkHealth();
  }, []);

  const loadScrapers = async () => {
    try {
      const data = await scrapingApi.getAvailableScrapers();
      setScrapers(data);
    } catch (error) {
      console.error('Failed to load scrapers:', error);
    }
  };

  const checkHealth = async () => {
    try {
      const health = await scrapingApi.checkHealth();
      setHealthStatus(health.status === 'healthy' ? 'healthy' : 'error');
    } catch (error) {
      setHealthStatus('error');
    }
  };

  const testScraper = async (scraperId: string) => {
    if (!scrapers) return;

    setLoading(true);
    setActiveJobs(prev => new Set([...prev, scraperId]));

    try {
      const response = await scrapingApi.triggerScraping(scraperId, {
        query: testQuery,
        location: testLocation,
        max_results: 10,
        user_email: 'test@jobnexai.com'
      });

      setScrapingResults(prev => ({
        ...prev,
        [scraperId]: response
      }));

      // Si un job_id est retourné, on peut suivre le progrès
      if (response.job_id && response.status === 'started') {
        // Ici on pourrait ouvrir une WebSocket connection
        // const ws = scrapingApi.connectToJob(response.job_id, (data) => {
        //   console.log('Job update:', data);
        // });
        
        // Pour l'instant, on simule une attente
        setTimeout(() => {
          setActiveJobs(prev => {
            const newSet = new Set(prev);
            newSet.delete(scraperId);
            return newSet;
          });
        }, 3000);
      } else {
        setActiveJobs(prev => {
          const newSet = new Set(prev);
          newSet.delete(scraperId);
          return newSet;
        });
      }

    } catch (error) {
      setScrapingResults(prev => ({
        ...prev,
        [scraperId]: {
          status: 'error',
          scraper: scrapers.scrapers[scraperId]?.name || scraperId,
          message: error instanceof Error ? error.message : 'Erreur inconnue'
        }
      }));
      setActiveJobs(prev => {
        const newSet = new Set(prev);
        newSet.delete(scraperId);
        return newSet;
      });
    }

    setLoading(false);
  };

  const testAllScrapers = async () => {
    if (!scrapers) return;

    setLoading(true);
    const scraperIds = Object.keys(scrapers.scrapers);
    
    try {
      const results = await scrapingApi.triggerMultiScraping(scraperIds, {
        query: testQuery,
        location: testLocation,
        max_results: 10,
        user_email: 'test@jobnexai.com'
      });

      setScrapingResults(results);
    } catch (error) {
      console.error('Multi-scraping failed:', error);
    }

    setLoading(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'started': return 'bg-blue-500';
      case 'cached': return 'bg-green-500';
      case 'queue_full': return 'bg-orange-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'started': return <Play className="w-4 h-4" />;
      case 'cached': return <CheckCircle className="w-4 h-4" />;
      case 'queue_full': return <Clock className="w-4 h-4" />;
      case 'error': return <AlertCircle className="w-4 h-4" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header avec status de santé */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wifi className="w-5 h-5" />
            Test de Connexion VPS N8N
            <Badge 
              variant={healthStatus === 'healthy' ? 'default' : 'destructive'}
              className="ml-auto"
            >
              {healthStatus === 'healthy' ? '🟢 Service OK' : '🔴 Service KO'}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <Input
              placeholder="Requête de test"
              value={testQuery}
              onChange={(e) => setTestQuery(e.target.value)}
              className="flex-1"
            />
            <Input
              placeholder="Localisation"
              value={testLocation}
              onChange={(e) => setTestLocation(e.target.value)}
              className="w-40"
            />
            <Button onClick={testAllScrapers} disabled={loading || !scrapers}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Test Tous'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Liste des scrapers */}
      {scrapers && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(scrapers.scrapers).map(([id, scraper]) => {
            const result = scrapingResults[id];
            const isActive = activeJobs.has(id);

            return (
              <Card key={id} className="relative">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center justify-between">
                    {scraper.name}
                    <Badge 
                      variant={scraper.difficulty === 'easy' ? 'default' : 
                              scraper.difficulty === 'medium' ? 'secondary' : 'destructive'}
                    >
                      {scraper.difficulty}
                    </Badge>
                  </CardTitle>
                  <p className="text-sm text-gray-600">{scraper.description}</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span>Cache TTL:</span>
                      <span>{Math.round(scraper.cache_ttl / 60)}min</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Max concurrent:</span>
                      <span>{scraper.max_concurrent}</span>
                    </div>
                  </div>

                  {result && (
                    <div className="mb-4 p-3 rounded-lg bg-gray-50">
                      <div className="flex items-center gap-2 mb-2">
                        {getStatusIcon(result.status)}
                        <Badge className={getStatusColor(result.status)}>
                          {result.status}
                        </Badge>
                      </div>
                      <p className="text-sm">{result.message}</p>
                      {result.jobs_count !== undefined && (
                        <p className="text-sm font-medium">
                          {result.jobs_count} résultats
                        </p>
                      )}
                      {result.estimated_time && (
                        <p className="text-sm text-gray-600">
                          Temps estimé: {result.estimated_time}
                        </p>
                      )}
                    </div>
                  )}

                  <Button 
                    onClick={() => testScraper(id)} 
                    disabled={isActive || loading}
                    className="w-full"
                    size="sm"
                  >
                    {isActive ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Test en cours...
                      </>
                    ) : (
                      'Tester'
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ScrapingTest;
