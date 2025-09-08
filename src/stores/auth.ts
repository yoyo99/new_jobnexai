import { create } from 'zustand';
import { getSupabase } from '../hooks/useSupabaseConfig';

// --- Type Definitions ---
export interface Profile {
  id: string;
  email?: string;
  full_name?: string;
  title?: string;
  phone?: string;
  location?: string;
  linkedin?: string;
  website?: string;
  user_type?: string;
  is_admin?: boolean;
  trial_ends_at?: string | null;
  created_at: string;
  updated_at: string;
  ai_provider?: 'openai' | 'mammouth'; // Ajout du fournisseur d'IA
}

export interface Subscription {
  id: string;
  status: 'trialing' | 'active' | 'past_due' | 'canceled' | 'unpaid' | 'incomplete' | 'incomplete_expired';
  plan: 'free' | 'pro' | 'enterprise';
  current_period_end: string | null;
  cancel_at: string | null;
  created_at: string;
  updated_at: string;
  stripe_customer_id?: string;
}

// --- State Interface ---
interface AuthState {
  user: Profile | null;
  subscription: Subscription | null;
  loading: boolean;
  error: string | null;
  initialized: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: any }>;
  signOut: () => Promise<{ error: any }>;
  loadUser: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: any }>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: any }>;
}

// --- Zustand Store ---
export const useAuth = create<AuthState>((set) => ({
  user: null,
  subscription: null,
  loading: true,
  error: null,
  initialized: false,

  loadUser: async () => {
    console.log('[AuthStore] -> Début de loadUser.');
    try {
      console.log('[AuthStore] -> Tentative de getSession...');
      const { data: { session } } = await getSupabase().auth.getSession();
      console.log('[AuthStore] -> getSession terminé. Session:', session ? 'trouvée' : 'nulle');

      if (!session?.user) {
        console.log('[AuthStore] -> Pas de session utilisateur. Nettoyage de l`état.');
        set({ user: null, subscription: null });
        return; // Le finally s'occupera de `initialized`.
      }

      console.log(`[AuthStore] -> Session trouvée pour l'utilisateur ID: ${session.user.id}. Tentative de fetch le profil...`);
      const { data: profile, error: profileError } = await getSupabase()
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();
      
      if (profileError && profileError.code !== 'PGRST116') {
        console.error('[AuthStore] -> Erreur lors du fetch du profil:', profileError);
        throw profileError;
      }
      console.log('[AuthStore] -> Profil trouvé:', profile || 'aucun (PGRST116)');

      // Fallback: si aucun profil en base, construire un profil minimal depuis session.user
      let resolvedProfile: Profile = profile ?? {
        id: session.user.id,
        email: session.user.email ?? undefined,
        full_name: (session.user.user_metadata as any)?.full_name ?? undefined,
        user_type: 'candidate',
        is_admin: false,
        trial_ends_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Tenter un upsert non bloquant du profil manquant (ignorer les erreurs)
      if (!profile) {
        try {
          console.log('[AuthStore] -> Aucun profil en BDD, tentative d\'upsert d\'un profil minimal...');
          await getSupabase()
            .from('profiles')
            .upsert({
              id: resolvedProfile.id,
              email: resolvedProfile.email,
              full_name: resolvedProfile.full_name,
              user_type: resolvedProfile.user_type,
              updated_at: new Date().toISOString(),
            });
        } catch (upsertErr) {
          console.warn('[AuthStore] -> Upsert du profil minimal ignoré (non bloquant):', upsertErr);
        }
      }

      // Récupérer la souscription avec l'id utilisateur même sans profil en BDD
      let subscription: Subscription | null = null;
      try {
        const { data: subData, error: subError } = await getSupabase()
          .from('subscriptions')
          .select('*')
          .eq('user_id', resolvedProfile.id)
          .single();
        if (subError && subError.code !== 'PGRST116') {
          console.error('[AuthStore] -> Erreur lors du fetch de la souscription:', subError);
          throw subError;
        }
        subscription = subData ?? null;
        console.log('[AuthStore] -> Souscription:', subscription ?? 'aucune');
      } catch (subErr) {
        console.warn('[AuthStore] -> Lecture souscription ignorée (non bloquant):', subErr);
      }

      console.log('[AuthStore] -> Mise à jour de l`état avec le profil résolu et la souscription.');
      set({ user: resolvedProfile, subscription });

    } catch (error: any) {
      console.error('[AuthStore] -> ERREUR CATCH dans loadUser:', error);
      set({ error: error.message, user: null, subscription: null });
    } finally {
      console.log('[AuthStore] -> FINALLY: Fin du chargement, initialized=true.');
      set({ loading: false, initialized: true });
    }
  },

  signIn: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const { error } = await getSupabase().auth.signInWithPassword({ email, password });
      if (error) throw error;
      return { error: null };
    } catch (error: any) {
      set({ error: error.message, loading: false });
      return { error };
    }
  },

  signUp: async (email, password, fullName) => {
    set({ loading: true, error: null });
    try {
      const { data, error: signUpError } = await getSupabase().auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
          emailRedirectTo: `${window.location.origin}`,
        },
      });
      if (signUpError) throw signUpError;
      if (!data.user) throw new Error("L'inscription a réussi mais aucun utilisateur n'a été retourné.");

      const { error: profileError } = await getSupabase()
        .from('profiles')
        .upsert({
          id: data.user.id,
          email: email,
          full_name: fullName,
          user_type: 'candidate',
          updated_at: new Date().toISOString(),
        });
      if (profileError) throw profileError;
      return { error: null };
    } catch (error: any) {
      set({ error: error.message, loading: false });
      return { error };
    }
  },

  signOut: async () => {
    // Le rechargement de la page et la redirection sont gérés par AuthProvider
    // qui écoute onAuthStateChange.
    const { error } = await getSupabase().auth.signOut();
    if (error) {
      console.error('Erreur de déconnexion:', error);
      set({ error: error.message });
    }
    return { error };
  },

  resetPassword: async (email) => {
    set({ loading: true, error: null });
    try {
      const { error } = await getSupabase().auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/update-password`,
      });
      if (error) throw error;
      set({ loading: false });
      return { error: null };
    } catch (error: any) {
      set({ error: error.message, loading: false });
      return { error };
    }
  },

  updateProfile: async (updates) => {
    set({ loading: true, error: null });
    try {
      const { data: { user } } = await getSupabase().auth.getUser();
      if (!user) throw new Error('Utilisateur non authentifié');

      const { error } = await getSupabase()
        .from('profiles')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', user.id);
      if (error) throw error;
      
      set(state => ({ user: state.user ? { ...state.user, ...updates } : null, loading: false }));
      return { error: null };
    } catch (error: any) {
      set({ error: error.message, loading: false });
      return { error };
    }
  },
}));