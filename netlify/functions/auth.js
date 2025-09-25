const { createClient } = require('@supabase/supabase-js');

// Créer un client Supabase avec les variables d'environnement
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://klwugophjvzctlautsqz.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Variables Supabase manquantes:', { supabaseUrl: !!supabaseUrl, supabaseKey: !!supabaseKey });
}

const supabase = createClient(supabaseUrl, supabaseKey);

exports.handler = async (event) => {
  // Récupérer le token d'authentification de l'en-tête Authorization
  const token = event.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return {
      statusCode: 401,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ error: 'Token d\'authentification manquant' })
    };
  }

  try {
    // Vérifier le token avec Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return {
        statusCode: 401,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ error: 'Token invalide ou session expirée' })
      };
    }

    // Retourner les informations de l'utilisateur
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ 
        success: true,
        user: { 
          id: user.id, 
          email: user.email,
          // Autres propriétés utilisateur si nécessaire
        }
      })
    };
    
  } catch (error) {
    console.error('Erreur lors de la vérification du token:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ error: 'Erreur lors de la vérification de l\'authentification' })
    };
  }
}

