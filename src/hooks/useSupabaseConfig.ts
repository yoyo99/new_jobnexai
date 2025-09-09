import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Déclare une variable globale pour stocker le client et survivre au HMR
declare global {
  var __supabase_client: SupabaseClient | undefined;
}

let supabase: SupabaseClient;

/**
 * Récupère l'instance unique du client Supabase.
 * Crée l'instance si elle n'existe pas.
 * @returns {SupabaseClient}
 */
export function getSupabase(): SupabaseClient {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase configuration is missing (VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY).');
  }

  // Utilise l'instance existante si elle est déjà créée
  if (supabase) {
    return supabase;
  }

  // En développement, réutilise l'instance globale pour éviter les avertissements HMR
  if (globalThis.__supabase_client) {
    supabase = globalThis.__supabase_client;
    return supabase;
  }

  // Crée une nouvelle instance
  supabase = createClient(supabaseUrl, supabaseAnonKey);

  // Stocke l'instance dans la variable globale en développement
  if (process.env.NODE_ENV === 'development') {
    globalThis.__supabase_client = supabase;
  }

  console.log('Supabase client initialized.');

  return supabase;
}
