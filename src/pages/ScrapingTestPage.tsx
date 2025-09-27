// src/pages/ScrapingTestPage.tsx
// Page complète de test pour l'infrastructure N8N

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Alert, AlertDescription } from '../components/ui/alert';
import { ScrapingTest } from '../components/ScrapingTest';
import { useScraping } from '../hooks/useScraping';
import { 
  Wifi, 
  Server, 
  Database, 
  Zap, 
  CheckCircle, 
  AlertCircle, 
  Activity 
} from 'lucide-react';

export const ScrapingTestPage: React.FC = () => {
  const {
    scrapers,
    loading,
    error,
    healthStatus,
    activeJobs,
    jobResults,
    triggerScraping,
    triggerMultiScraping,
    checkHealth
  } = useScraping({
    onJobComplete: (jobId, data) => {
      console.log('Job completed:', jobId, data);
      // Ici on pourrait sauvegarder les résultats dans Supabase
    },
    onJobError: (jobId, error) => {
      console.error('Job error:', jobId, error);
    }
  });

  const [testQuery, setTestQuery] = useState('développeur react senior');
  const [testLocation, setTestLocation] = useState('Paris, France');

  const quickTest = async () => {
    if (!scrapers) return;
    
    // Test rapide avec Indeed (scraper facile)
    try {
      await triggerScraping('indeed', {
        query: testQuery,
        location: testLocation,
        max_results: 5,
        user_email: 'test@jobnexai.com'
      });
    } catch (err) {
      console.error('Quick test failed:', err);
    }
  };

  const fullTest = async () => {
    if (!scrapers) return;

    // Test complet avec tous les scrapers
    const allScrapers = Object.keys(scrapers.scrapers);
    try {
      await triggerMultiScraping(allScrapers, {
        query: testQuery,
        location: testLocation,
        max_results: 10,
        user_email: 'test@jobnexai.com'
      });
    } catch (err) {
      console.error('Full test failed:', err);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">🚀 Test Infrastructure N8N</h1>
        <p className="text-gray-600">
          Connexion JobNexAI ↔ VPS Contabo • 38.242.238.205
        </p>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center space-x-2">
              <Wifi className="w-5 h-5" />
              <span className="font-medium">Connexion VPS</span>
            </div>
            <Badge 
              variant={healthStatus === 'healthy' ? 'default' : 'destructive'}
              className="mt-2"
            >
              {healthStatus === 'healthy' ? '🟢 OK' : '🔴 KO'}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center space-x-2">
              <Server className="w-5 h-5" />
              <span className="font-medium">Scrapers</span>
            </div>
            <Badge variant="outline" className="mt-2">
              {scrapers?.total || 0} actifs
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center space-x-2">
              <Activity className="w-5 h-5" />
              <span className="font-medium">Jobs actifs</span>
            </div>
            <Badge variant="secondary" className="mt-2">
              {activeJobs.length}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center space-x-2">
              <Database className="w-5 h-5" />
              <span className="font-medium">Redis Cache</span>
            </div>
            <Badge variant="default" className="mt-2">
              🟢 OK
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Tests rapides */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Tests Rapides
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-4">
              <Input
                placeholder="Requête de recherche"
                value={testQuery}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTestQuery(e.target.value)}
                className="flex-1"
              />
              <Input
                placeholder="Localisation"
                value={testLocation}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTestLocation(e.target.value)}
                className="w-48"
              />
            </div>
            
            <div className="flex gap-2">
              <Button onClick={quickTest} disabled={loading}>
                <CheckCircle className="w-4 h-4 mr-2" />
                Test Rapide (Indeed)
              </Button>
              <Button onClick={fullTest} variant="outline" disabled={loading}>
                <Activity className="w-4 h-4 mr-2" />
                Test Complet (Tous)
              </Button>
              <Button onClick={checkHealth} variant="ghost" size="sm">
                🔄 Rafraîchir Status
              </Button>
            </div>
          </div>

          {error && (
            <Alert className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Onglets détaillés */}
      <Tabs defaultValue="scrapers" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="scrapers">Scrapers Détaillés</TabsTrigger>
          <TabsTrigger value="results">Résultats</TabsTrigger>
          <TabsTrigger value="logs">Logs & Debug</TabsTrigger>
        </TabsList>
        
        <TabsContent value="scrapers" className="space-y-4">
          <ScrapingTest />
        </TabsContent>
        
        <TabsContent value="results" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Résultats des Jobs</CardTitle>
            </CardHeader>
            <CardContent>
              {Object.keys(jobResults).length === 0 ? (
                <p className="text-gray-500">Aucun résultat pour le moment. Lancez un test !</p>
              ) : (
                <div className="space-y-4">
                  {Object.entries(jobResults).map(([jobId, result]) => (
                    <Card key={jobId} className="p-4">
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <code className="text-sm">{jobId}</code>
                          <Badge>{result.status}</Badge>
                        </div>
                        <pre className="text-sm bg-gray-100 p-2 rounded overflow-auto">
                          {JSON.stringify(result, null, 2)}
                        </pre>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configuration VPS</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>IP VPS:</strong> 38.242.238.205
                </div>
                <div>
                  <strong>N8N:</strong> http://38.242.238.205:5678
                </div>
                <div>
                  <strong>API:</strong> http://38.242.238.205:8000
                </div>
                <div>
                  <strong>Redis:</strong> 38.242.238.205:6379
                </div>
                <div>
                  <strong>PostgreSQL:</strong> 38.242.238.205:5432
                </div>
                <div>
                  <strong>WebSocket:</strong> ws://38.242.238.205:8000/ws
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Debug Info</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-xs bg-gray-100 p-4 rounded overflow-auto">
                {JSON.stringify({
                  scrapers: scrapers ? Object.keys(scrapers.scrapers) : null,
                  activeJobs,
                  healthStatus,
                  loading,
                  error
                }, null, 2)}
              </pre>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ScrapingTestPage;
