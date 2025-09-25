// Version de test temporaire pour diagnostiquer le problème Supabase
exports.handler = async (event) => {
  try {
    // Variables d'environnement disponibles
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: false,
        error: 'Fonction auth en mode diagnostic',
        debug: {
          hasUrl: !!supabaseUrl,
          hasKey: !!supabaseKey,
          urlLength: supabaseUrl ? supabaseUrl.length : 0,
          keyLength: supabaseKey ? supabaseKey.length : 0,
          nodeEnv: process.env.NODE_ENV,
          netlify: !!process.env.NETLIFY
        },
        message: 'Utilisez /debug-env pour plus de détails'
      })
    }
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Erreur fonction auth',
        message: error.message
      })
    }
  }
}

