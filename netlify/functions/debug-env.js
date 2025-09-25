exports.handler = async (event) => {
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify({
      success: true,
      message: 'Variables d\'environnement disponibles',
      environment: {
        // Variables Supabase possibles
        VITE_SUPABASE_URL: !!process.env.VITE_SUPABASE_URL,
        VITE_SUPABASE_ANON_KEY: !!process.env.VITE_SUPABASE_ANON_KEY,
        SUPABASE_URL: !!process.env.SUPABASE_URL,
        SUPABASE_ANON_KEY: !!process.env.SUPABASE_ANON_KEY,
        
        // Variables France Travail 
        FRANCE_TRAVAIL_BASE_URL: !!process.env.FRANCE_TRAVAIL_BASE_URL,
        FRANCE_TRAVAIL_CLIENT_ID: !!process.env.FRANCE_TRAVAIL_CLIENT_ID,
        FRANCE_TRAVAIL_CLIENT_SECRET: !!process.env.FRANCE_TRAVAIL_CLIENT_SECRET,
        
        // Autres variables importantes
        NODE_ENV: process.env.NODE_ENV,
        NETLIFY: !!process.env.NETLIFY,
        
        // Compter toutes les variables disponibles
        totalVariables: Object.keys(process.env).length,
        
        // Quelques exemples de noms de variables (masquées)
        exampleVarNames: Object.keys(process.env)
          .filter(key => !key.includes('SECRET') && !key.includes('KEY'))
          .slice(0, 10)
      },
      timestamp: new Date().toISOString()
    })
  }
}
