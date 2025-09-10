import { getSupabase } from '../hooks/useSupabaseConfig';

// IMPORTANT: Ce fichier utilise maintenant getSupabase() pour assurer la cohérence
// avec le reste de l'application et éviter les problèmes d'authentification

// Log pour confirmer l'utilisation du client singleton
console.log('[SupabaseClient] Using Supabase client from useSupabaseConfig.getSupabase()');

// Utilisation du client Supabase singleton de l'application
export const supabase = getSupabase();
