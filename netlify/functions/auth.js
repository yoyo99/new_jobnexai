const { createClient } = require('@supabase/supabase-js');

// Créer un client Supabase avec les variables d'environnement
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Variables Supabase manquantes:', { supabaseUrl: !!supabaseUrl, supabaseKey: !!supabaseKey });
}

const supabase = createClient(supabaseUrl, supabaseKey);

exports.handler = async (event, context) => {
  // Récupérer le token d'authentification de l'en-tête Authorization
  const token = event.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return {
      statusCode: 401,
      body: JSON.stringify({ error: 'Token d\'authentification manquant' })
    };
  }

  try {
    // Vérifier la session avec Supabase Auth
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Session invalide ou expirée' })
      };
    }

    // Retourner les informations de l'utilisateur
    return {
      statusCode: 200,
      body: JSON.stringify({ 
        user: { 
          id: user.id, 
          email: user.email,
          // Vous pouvez ajouter d'autres propriétés utilisateur ici
        }
      })
    };
    
  } catch (error) {
    console.error('Erreur d\'authentification:', error);
    
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Erreur lors de la vérification de l\'authentification' })
    };
  }
};
