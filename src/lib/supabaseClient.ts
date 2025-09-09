import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});

supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_IN' && !session) {
    console.error("Session invalide après connexion");
  }
});

export { supabase };
export default supabase;
