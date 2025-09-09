// Script de test direct de la connexion Supabase
export async function testSupabaseConnection() {
  const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
  const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

  console.log('=== TEST CONNEXION SUPABASE ===');
  console.log('URL:', SUPABASE_URL);
  console.log('Anon Key:', SUPABASE_ANON_KEY ? `${SUPABASE_ANON_KEY.substring(0, 20)}...` : 'MANQUANTE');

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('❌ Variables d\'environnement Supabase manquantes');
    return { success: false, error: 'Variables d\'environnement manquantes' };
  }

  try {
    // Test 1: Ping du projet Supabase
    console.log('🔍 Test 1: Ping du projet...');
    const pingResponse = await fetch(`${SUPABASE_URL}/rest/v1/`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    });
    console.log('Ping status:', pingResponse.status);

    if (!pingResponse.ok) {
      throw new Error(`Projet inaccessible: ${pingResponse.status} ${pingResponse.statusText}`);
    }

    // Test 2: Test auth endpoint
    console.log('🔍 Test 2: Test auth endpoint...');
    const authResponse = await fetch(`${SUPABASE_URL}/auth/v1/settings`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    });
    console.log('Auth status:', authResponse.status);

    // Test 3: Initialisation du client Supabase
    console.log('🔍 Test 3: Initialisation client...');
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    // Test 4: getSession
    console.log('🔍 Test 4: getSession...');
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    console.log('Session data:', sessionData);
    console.log('Session error:', sessionError);

    console.log('✅ Tous les tests Supabase réussis');
    return { 
      success: true, 
      data: { 
        pingStatus: pingResponse.status,
        authStatus: authResponse.status,
        session: sessionData 
      } 
    };

  } catch (error: any) {
    console.error('❌ Erreur test Supabase:', error);
    return { success: false, error: error.message };
  }
}

// Fonction utilitaire pour tester depuis la console
(window as any).testSupabase = testSupabaseConnection;
