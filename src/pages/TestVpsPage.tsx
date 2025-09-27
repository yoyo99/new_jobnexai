// src/pages/TestVpsPage.tsx
// Page de test simple pour VPS N8N

import React, { useState, useEffect } from 'react';

interface TestResult {
  status: string;
  message: string;
  timestamp: string;
}

export const TestVpsPage: React.FC = () => {
  const [testQuery, setTestQuery] = useState('développeur react');
  const [testLocation, setTestLocation] = useState('Paris, France');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);
  const [health, setHealth] = useState<string>('Checking...');

  // Test de santé au chargement
  useEffect(() => {
    checkHealth();
  }, []);

  const checkHealth = async () => {
    try {
      const response = await fetch('/api/scraping/health');
      if (response.ok) {
        const data = await response.json();
        setHealth(`✅ Healthy - Redis: ${data.redis}`);
      } else {
        setHealth(`❌ Error ${response.status}`);
      }
    } catch (error) {
      setHealth(`❌ Connection failed: ${error}`);
    }
  };

  const testScraper = async (scraperId: string) => {
    setIsLoading(true);
    
    try {
      const response = await fetch(`/api/scraping/scrape/${scraperId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: testQuery,
          location: testLocation,
          max_results: 5
        })
      });

      const data = await response.json();
      
      setResults(prev => [...prev, {
        status: response.ok ? '✅ Success' : '❌ Error',
        message: JSON.stringify(data, null, 2),
        timestamp: new Date().toLocaleTimeString()
      }]);

    } catch (error) {
      setResults(prev => [...prev, {
        status: '❌ Network Error',
        message: String(error),
        timestamp: new Date().toLocaleTimeString()
      }]);
    }
    
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-blue-400 mb-2">
            🚀 Test VPS N8N 
          </h1>
          <p className="text-gray-300">
            Connexion: 38.242.238.205 • {health}
          </p>
        </div>

        {/* Form de test */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-blue-300">
            ⚡ Tests Rapides
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">
                🔍 Requête de recherche
              </label>
              <input
                type="text"
                value={testQuery}
                onChange={(e) => setTestQuery(e.target.value)}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ex: développeur react"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">
                📍 Localisation
              </label>
              <input
                type="text"
                value={testLocation}
                onChange={(e) => setTestLocation(e.target.value)}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ex: Paris, France"
              />
            </div>
          </div>

          {/* Boutons de test */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => testScraper('indeed')}
              disabled={isLoading}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 rounded font-medium transition-colors"
            >
              {isLoading ? '⏳ Test...' : '🎯 Test Indeed'}
            </button>
            
            <button
              onClick={() => testScraper('linkedin')}
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded font-medium transition-colors"
            >
              {isLoading ? '⏳ Test...' : '💼 Test LinkedIn'}
            </button>
            
            <button
              onClick={() => testScraper('malt')}
              disabled={isLoading}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 rounded font-medium transition-colors"
            >
              {isLoading ? '⏳ Test...' : '🛠️ Test Malt'}
            </button>
            
            <button
              onClick={checkHealth}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded font-medium transition-colors"
            >
              🔄 Refresh Health
            </button>
          </div>
        </div>

        {/* Résultats */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-blue-300">
            📊 Résultats des Tests
          </h2>
          
          {results.length === 0 ? (
            <p className="text-gray-400">
              Aucun test effectué. Utilisez les boutons ci-dessus pour tester !
            </p>
          ) : (
            <div className="space-y-4">
              {results.map((result, index) => (
                <div key={index} className="bg-gray-900 rounded p-4 border-l-4 border-blue-500">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold">{result.status}</span>
                    <span className="text-sm text-gray-400">{result.timestamp}</span>
                  </div>
                  <pre className="text-sm overflow-auto text-gray-300 whitespace-pre-wrap">
                    {result.message}
                  </pre>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Debug Info */}
        <div className="mt-6 bg-gray-800 rounded-lg p-4">
          <details>
            <summary className="text-blue-300 cursor-pointer hover:text-blue-200">
              🔧 Debug Info
            </summary>
            <div className="mt-2 text-sm text-gray-400">
              <p><strong>API Base:</strong> /api/scraping</p>
              <p><strong>VPS IP:</strong> 38.242.238.205</p>
              <p><strong>Current URL:</strong> {window.location.href}</p>
              <p><strong>Test Query:</strong> {testQuery}</p>
              <p><strong>Test Location:</strong> {testLocation}</p>
            </div>
          </details>
        </div>
      </div>
    </div>
  );
};

export default TestVpsPage;
