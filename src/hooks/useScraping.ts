// src/hooks/useScraping.ts
// Hook React pour gérer le scraping depuis l'interface JobNexAI

import { useState, useEffect, useCallback } from 'react';
import { scrapingApi, type ScrapingRequest, type ScrapingResponse, type AvailableScrapers } from '../services/scrapingApi';

export interface UseScrapingOptions {
  autoLoadScrapers?: boolean;
  onJobComplete?: (jobId: string, data: any) => void;
  onJobError?: (jobId: string, error: string) => void;
}

export const useScraping = (options: UseScrapingOptions = {}) => {
  const { autoLoadScrapers = true, onJobComplete, onJobError } = options;

  const [scrapers, setScrapers] = useState<AvailableScrapers | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [healthStatus, setHealthStatus] = useState<'unknown' | 'healthy' | 'error'>('unknown');
  const [activeJobs, setActiveJobs] = useState<Map<string, WebSocket>>(new Map());
  const [jobResults, setJobResults] = useState<Map<string, any>>(new Map());

  // Charger les scrapers disponibles
  const loadScrapers = useCallback(async () => {
    try {
      setError(null);
      const data = await scrapingApi.getAvailableScrapers();
      setScrapers(data);
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du chargement des scrapers';
      setError(errorMessage);
      throw err;
    }
  }, []);

  // Vérifier la santé du service
  const checkHealth = useCallback(async () => {
    try {
      const health = await scrapingApi.checkHealth();
      setHealthStatus(health.status === 'healthy' ? 'healthy' : 'error');
      return health;
    } catch (err) {
      setHealthStatus('error');
      throw err;
    }
  }, []);

  // Déclencher un scraping
  const triggerScraping = useCallback(async (
    scraperId: string, 
    request: ScrapingRequest
  ): Promise<ScrapingResponse> => {
    setLoading(true);
    setError(null);

    try {
      const response = await scrapingApi.triggerScraping(scraperId, request);
      
      // Si un job est démarré, on peut suivre son progrès via WebSocket
      if (response.job_id && response.status === 'started') {
        const ws = scrapingApi.connectToJob(
          response.job_id,
          (data) => {
            setJobResults(prev => new Map(prev.set(response.job_id!, data)));
            
            if (data.status === 'completed' && onJobComplete) {
              onJobComplete(response.job_id!, data);
              // Fermer la WebSocket
              ws.close();
              setActiveJobs(prev => {
                const newMap = new Map(prev);
                newMap.delete(response.job_id!);
                return newMap;
              });
            } else if (data.status === 'error' && onJobError) {
              onJobError(response.job_id!, data.error);
              ws.close();
              setActiveJobs(prev => {
                const newMap = new Map(prev);
                newMap.delete(response.job_id!);
                return newMap;
              });
            }
          },
          (error) => {
            console.error('WebSocket error for job', response.job_id, error);
          }
        );

        setActiveJobs(prev => new Map(prev.set(response.job_id!, ws)));
      }

      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du scraping';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [onJobComplete, onJobError]);

  // Déclencher un scraping multi-sites
  const triggerMultiScraping = useCallback(async (
    scraperIds: string[],
    request: ScrapingRequest
  ) => {
    setLoading(true);
    setError(null);

    try {
      const results = await scrapingApi.triggerMultiScraping(scraperIds, request);
      
      // Gérer les WebSockets pour chaque job démarré
      Object.entries(results).forEach(([scraperId, response]) => {
        if (response.job_id && response.status === 'started') {
          const ws = scrapingApi.connectToJob(
            response.job_id,
            (data) => {
              setJobResults(prev => new Map(prev.set(response.job_id!, data)));
              
              if (data.status === 'completed' && onJobComplete) {
                onJobComplete(response.job_id!, data);
                ws.close();
                setActiveJobs(prev => {
                  const newMap = new Map(prev);
                  newMap.delete(response.job_id!);
                  return newMap;
                });
              }
            }
          );

          setActiveJobs(prev => new Map(prev.set(response.job_id!, ws)));
        }
      });

      return results;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du multi-scraping';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [onJobComplete]);

  // Obtenir le statut d'un job
  const getJobStatus = useCallback(async (jobId: string) => {
    try {
      return await scrapingApi.getJobStatus(jobId);
    } catch (err) {
      console.error('Failed to get job status:', err);
      throw err;
    }
  }, []);

  // Annuler un job en cours
  const cancelJob = useCallback((jobId: string) => {
    const ws = activeJobs.get(jobId);
    if (ws) {
      ws.close();
      setActiveJobs(prev => {
        const newMap = new Map(prev);
        newMap.delete(jobId);
        return newMap;
      });
    }
  }, [activeJobs]);

  // Nettoyer toutes les connexions WebSocket
  const cleanup = useCallback(() => {
    activeJobs.forEach((ws) => ws.close());
    setActiveJobs(new Map());
  }, [activeJobs]);

  // Effet de montage
  useEffect(() => {
    if (autoLoadScrapers) {
      loadScrapers();
      checkHealth();
    }

    // Cleanup lors du démontage
    return cleanup;
  }, [autoLoadScrapers, loadScrapers, checkHealth, cleanup]);

  // Helpers
  const isScraperAvailable = useCallback((scraperId: string) => {
    return scrapers?.scrapers[scraperId] !== undefined;
  }, [scrapers]);

  const getScrapersByCategory = useCallback((category: 'freelance' | 'cdi_cdd') => {
    return scrapers?.categories[category] || [];
  }, [scrapers]);

  const getScrapersByDifficulty = useCallback((difficulty: 'easy' | 'medium' | 'hard') => {
    return scrapers?.categories.difficulty[difficulty] || [];
  }, [scrapers]);

  return {
    // État
    scrapers,
    loading,
    error,
    healthStatus,
    activeJobs: Array.from(activeJobs.keys()),
    jobResults: Object.fromEntries(jobResults),

    // Actions
    loadScrapers,
    checkHealth,
    triggerScraping,
    triggerMultiScraping,
    getJobStatus,
    cancelJob,
    cleanup,

    // Helpers
    isScraperAvailable,
    getScrapersByCategory,
    getScrapersByDifficulty,
  };
};

export default useScraping;
