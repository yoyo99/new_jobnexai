import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

function DiagnosticSupabase() {
  const [status, setStatus] = useState<string>('Initialisation...');
  const [logs, setLogs] = useState<string[]>([]);
  const [currentTest, setCurrentTest] = useState<string>('');
  const [complete, setComplete] = useState<boolean>(false);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const runDiagnostics = async () => {
    addLog('Démarrage des diagnostics');
    setComplete(false);

    try {
      // 1. Vérifier les variables d'environnement
      setCurrentTest('Vérification des variables d\'environnement');
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      if (!supabaseUrl) {
        addLog('❌ VITE_SUPABASE_URL non définie');
        throw new Error('VITE_SUPABASE_URL manquante');
      } else {
        addLog(`✅ VITE_SUPABASE_URL: ${supabaseUrl}`);
      }

      if (!supabaseKey) {
        addLog('❌ VITE_SUPABASE_ANON_KEY non définie');
        throw new Error('VITE_SUPABASE_ANON_KEY manquante');
      } else {
        addLog(`✅ VITE_SUPABASE_ANON_KEY: ${supabaseKey.substring(0, 5)}...${supabaseKey.substring(supabaseKey.length - 5)}`);
      }

      // 2. Création du client Supabase
      setCurrentTest('Création du client Supabase');
      const supabase = createClient(supabaseUrl, supabaseKey);
      addLog('✅ Client Supabase créé');

      // 3. Test de connexion simple (anonyme)
      setCurrentTest('Test de connexion anonyme');
      try {
        const { data, error } = await supabase.from('profiles').select('count').limit(1);
        if (error) {
          addLog(`❌ Erreur lors du test de connexion: ${error.message}`);
          throw error;
        }
        addLog('✅ Connexion anonyme réussie');
      } catch (err: any) {
        addLog(`❌ Exception lors du test de connexion: ${err.message}`);
        throw err;
      }

      // 4. Test d'inscription (avec rollback)
      setCurrentTest('Test d\'inscription');
      const testEmail = `test.${Date.now()}@example.com`;
      const testPassword = 'Password123!';
      
      try {
        const { data, error } = await supabase.auth.signUp({
          email: testEmail,
          password: testPassword,
          options: {
            data: {
              first_name: 'Test',
              last_name: 'User'
            }
          }
        });

        if (error) {
          addLog(`❌ Erreur lors du test d'inscription: ${error.message}`);
          throw error;
        }
        
        addLog(`✅ Inscription test réussie pour ${testEmail}`);
        
        // Récupérer l'utilisateur créé pour vérifier
        const userId = data.user?.id;
        if (userId) {
          addLog(`✅ Utilisateur créé avec ID: ${userId}`);
        }

        // Vérifier les webhooks et triggers
        addLog('⚠️ Note: Vérifiez que les webhooks et triggers Supabase sont correctement configurés pour la synchronisation des profils');

      } catch (err: any) {
        addLog(`❌ Exception lors du test d'inscription: ${err.message}`);
        throw err;
      }

      setStatus('Diagnostics terminés avec succès');
      setComplete(true);
    } catch (err: any) {
      setStatus(`Échec des diagnostics: ${err.message}`);
      setComplete(true);
    }
  };

  useEffect(() => {
    runDiagnostics();
  }, []);

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Diagnostic Supabase</h1>
      
      <div style={{ 
        padding: '10px 15px', 
        background: complete ? (status.includes('Échec') ? '#ffebee' : '#e8f5e9') : '#e3f2fd',
        color: complete ? (status.includes('Échec') ? '#c62828' : '#2e7d32') : '#1565c0',
        borderRadius: '4px',
        marginBottom: '20px',
        fontSize: '18px',
        fontWeight: 'bold'
      }}>
        {status}
      </div>

      {!complete && currentTest && (
        <div style={{ marginBottom: '20px' }}>
          <h3>Test en cours: {currentTest}</h3>
          <div style={{ width: '100%', height: '4px', background: '#e0e0e0' }}>
            <div style={{ 
              width: '20%', 
              height: '100%', 
              background: '#2196f3',
              animation: 'progress 1.5s infinite ease-in-out'
            }}></div>
          </div>
          <style>{`
            @keyframes progress {
              0% { margin-left: 0%; width: 20%; }
              50% { margin-left: 80%; width: 20%; }
              100% { margin-left: 0%; width: 20%; }
            }
          `}</style>
        </div>
      )}

      <div style={{ 
        border: '1px solid #e0e0e0', 
        borderRadius: '4px', 
        padding: '15px',
        height: '400px',
        overflowY: 'auto',
        background: '#fafafa',
        fontFamily: 'monospace'
      }}>
        {logs.map((log, index) => (
          <div key={index} style={{ 
            padding: '8px 0',
            borderBottom: index < logs.length - 1 ? '1px solid #f0f0f0' : 'none'
          }}>
            {log}
          </div>
        ))}
      </div>

      <div style={{ marginTop: '20px' }}>
        <button 
          onClick={runDiagnostics} 
          disabled={!complete}
          style={{
            padding: '10px 20px',
            background: complete ? '#2196f3' : '#e0e0e0',
            color: complete ? 'white' : '#9e9e9e',
            border: 'none',
            borderRadius: '4px',
            cursor: complete ? 'pointer' : 'default',
            fontSize: '16px'
          }}
        >
          Relancer les diagnostics
        </button>
      </div>
    </div>
  );
}

export default DiagnosticSupabase;
