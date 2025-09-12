import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

export default function DebugEnv() {
  const [supabaseUrl, setSupabaseUrl] = useState<string>('');
  const [supabaseKeySnippet, setSupabaseKeySnippet] = useState<string>('');
  
  // Charger les variables d'environnement au montage du composant
  useEffect(() => {
    const url = import.meta.env.VITE_SUPABASE_URL;
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    setSupabaseUrl(url || 'Non définie');
    
    if (key) {
      setSupabaseKeySnippet(`${key.substring(0, 5)}...${key.substring(key.length - 5)}`);
    } else {
      setSupabaseKeySnippet('Non définie');
    }
    
    // Log pour débogage
    console.log('URL chargée:', url);
    console.log('Key chargée:', key ? 'Présente' : 'Absente');
  }, []);
  
  const [testConnection, setTestConnection] = useState<{ status: string, error?: any }>({
    status: 'Non testé',
  });
  
  const testSupabaseConnection = async () => {
    try {
      setTestConnection({ status: 'Test en cours...' });
      
      // Créer un client Supabase
      const supabase = createClient(
        import.meta.env.VITE_SUPABASE_URL,
        import.meta.env.VITE_SUPABASE_ANON_KEY
      );
      
      // Faire une requête simple (anonyme)
      const { data, error } = await supabase.from('profiles').select('*').limit(1);
      
      if (error) {
        setTestConnection({ 
          status: 'Erreur', 
          error: { message: error.message, code: error.code, details: error.details }
        });
      } else {
        setTestConnection({ status: 'Connecté avec succès' });
      }
    } catch (err: any) {
      setTestConnection({ 
        status: 'Exception', 
        error: { message: err.message, name: err.name } 
      });
    }
  };
  
  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Debug Environnement</h1>
      
      <h2>Variables Supabase</h2>
      <div style={{ background: '#f0f0f0', padding: '15px', borderRadius: '5px', marginBottom: '20px' }}>
        <p><strong>URL:</strong> {supabaseUrl}</p>
        <p><strong>ANON KEY:</strong> {supabaseKeySnippet}</p>
      </div>
      
      <h2>Test de connexion</h2>
      <button 
        onClick={testSupabaseConnection}
        style={{ 
          padding: '12px 20px', 
          cursor: 'pointer', 
          marginBottom: '20px',
          background: '#3498db',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          fontSize: '16px'
        }}
      >
        Tester la connexion Supabase
      </button>
      
      <div style={{ marginTop: '20px' }}>
        <h3>Statut: {testConnection.status}</h3>
        {testConnection.error && (
          <div>
            <h4>Détails de l'erreur:</h4>
            <pre style={{ background: '#f5f5f5', padding: '15px', borderRadius: '5px', overflow: 'auto' }}>
              {JSON.stringify(testConnection.error, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
