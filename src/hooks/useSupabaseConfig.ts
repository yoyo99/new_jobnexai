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
  // --- DÉBUT LOGS DE DÉBOGAGE ---
  console.log("--- JOBNEXAI DEBUG ---");
  console.log("Tentative d'initialisation de Supabase avec la configuration suivante :");
  console.log("URL (VITE_SUPABASE_URL):", import.meta.env.VITE_SUPABASE_URL);
  console.log("Clé Anon (VITE_SUPABASE_ANON_KEY):", import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Présente' : 'Manquante !');
  console.log("--- FIN LOGS DE DÉBOGAGE ---");

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Supabase URL or Anon Key is missing. Make sure to set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.');
    throw new Error('Supabase configuration is missing.');
  }

  // Utilise l'instance existante si elle est déjà créée
  if (supabase) {
    return supabase;
  }

  // En développement, réutilise l'instance globale pour éviter les avertissements HMR
  if (import.meta.env.DEV && globalThis.__supabase_client) {
    supabase = globalThis.__supabase_client;
    return supabase;
  }

  // Crée une nouvelle instance
  supabase = createClient(supabaseUrl, supabaseAnonKey);

  // Stocke l'instance dans la variable globale en développement
  if (import.meta.env.DEV) {
    globalThis.__supabase_client = supabase;
  }

  console.log('Supabase client initialized.');

  return supabase;
}
