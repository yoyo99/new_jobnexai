import { useState, useEffect, useCallback } from 'react';
import { User, AuthResponse } from '@supabase/supabase-js';
import { mapSupabaseError, logError, AppError } from '../utils/error-handling';
import { getSupabase } from './useSupabaseConfig';

// Types pour les retours de fonctions d'authentification
export interface AuthResult<T = any> {
  data: T | null;
  error: AppError | null;
  loading: boolean;
}

// Définir le type de profil utilisateur
export interface UserProfile {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  role?: string;
}



/**
 * Hook d'authentification pour gérer la session utilisateur et les opérations d'authentification
 */
export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [initialized, setInitialized] = useState<boolean>(false);
  
  // Fonction pour mapper l'utilisateur Supabase vers notre modèle de profil
  const mapUserToProfile = useCallback((user: User | null): UserProfile | null => {
    if (!user) return null;
    
    return {
      id: user.id,
      email: user.email || '',
      firstName: user.user_metadata?.first_name,
      lastName: user.user_metadata?.last_name,
      avatarUrl: user.user_metadata?.avatar_url,
      role: user.app_metadata?.role || 'user',
    };
  }, []);
  
  // Charger l'utilisateur actuel
  const loadUser = useCallback(async (): Promise<AuthResult<UserProfile>> => {
    try {
      setLoading(true);
      const supabase = getSupabase();
      
      const { data, error } = await supabase.auth.getUser();
      
      if (error) {
        const mappedError = mapSupabaseError(error);
        logError(mappedError, 'useAuth.loadUser');
        return { data: null, error: mappedError, loading: false };
      }
      
      const userProfile = mapUserToProfile(data.user);
      setUser(data.user);
      setProfile(userProfile);
      setLoading(false);
      
      // Obtenir aussi la session
      const { data: sessionData } = await supabase.auth.getSession();
      setSession(sessionData?.session || null);
      
      return { data: userProfile, error: null, loading: false };
    } catch (err) {
      const error = mapSupabaseError(err);
      logError(error, 'useAuth.loadUser');
      setLoading(false);
      return { data: null, error, loading: false };
    } finally {
      setInitialized(true);
    }
  }, [mapUserToProfile]);
  
  // Login avec email et mot de passe
  const signIn = async (email: string, password: string): Promise<AuthResult> => {
    try {
      setLoading(true);
      const supabase = getSupabase();
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        const mappedError = mapSupabaseError(error);
        logError(mappedError, 'useAuth.signIn');
        setLoading(false);
        return { data: null, error: mappedError, loading: false };
      }
      
      setUser(data.user);
      setProfile(mapUserToProfile(data.user));
      setSession(data.session);
      setLoading(false);
      
      return { data: data.user, error: null, loading: false };
    } catch (err) {
      const error = mapSupabaseError(err);
      logError(error, 'useAuth.signIn');
      setLoading(false);
      return { data: null, error, loading: false };
    }
  };
  
  // Inscription avec email et mot de passe
  const signUp = async (email: string, password: string, userData?: { firstName?: string, lastName?: string }): Promise<AuthResult> => {
    try {
      setLoading(true);
      const supabase = getSupabase();
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: userData?.firstName,
            last_name: userData?.lastName,
          },
        },
      });
      
      if (error) {
        const mappedError = mapSupabaseError(error);
        logError(mappedError, 'useAuth.signUp');
        setLoading(false);
        return { data: null, error: mappedError, loading: false };
      }
      
      setUser(data.user);
      setProfile(mapUserToProfile(data.user));
      setSession(data.session);
      setLoading(false);
      
      return { data: data.user, error: null, loading: false };
    } catch (err) {
      const error = mapSupabaseError(err);
      logError(error, 'useAuth.signUp');
      setLoading(false);
      return { data: null, error, loading: false };
    }
  };
  
  // Déconnexion
  const signOut = async (): Promise<AuthResult> => {
    try {
      setLoading(true);
      const supabase = getSupabase();
      
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        const mappedError = mapSupabaseError(error);
        logError(mappedError, 'useAuth.signOut');
        setLoading(false);
        return { data: null, error: mappedError, loading: false };
      }
      
      setUser(null);
      setProfile(null);
      setSession(null);
      setLoading(false);
      
      return { data: null, error: null, loading: false };
    } catch (err) {
      const error = mapSupabaseError(err);
      logError(error, 'useAuth.signOut');
      setLoading(false);
      return { data: null, error, loading: false };
    }
  };
  
  // Réinitialiser le mot de passe
  const resetPassword = async (email: string): Promise<AuthResult> => {
    try {
      const supabase = getSupabase();
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      
      if (error) {
        const mappedError = mapSupabaseError(error);
        logError(mappedError, 'useAuth.resetPassword');
        return { data: null, error: mappedError, loading: false };
      }
      
      return { data: { email }, error: null, loading: false };
    } catch (err) {
      const error = mapSupabaseError(err);
      logError(error, 'useAuth.resetPassword');
      return { data: null, error, loading: false };
    }
  };
  
  // Mettre à jour le mot de passe
  const updatePassword = async (password: string): Promise<AuthResult> => {
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase.auth.updateUser({ password });
      
      if (error) {
        const mappedError = mapSupabaseError(error);
        logError(mappedError, 'useAuth.updatePassword');
        return { data: null, error: mappedError, loading: false };
      }
      
      return { data: data.user, error: null, loading: false };
    } catch (err) {
      const error = mapSupabaseError(err);
      logError(error, 'useAuth.updatePassword');
      return { data: null, error, loading: false };
    }
  };
  
  // Mettre à jour le profil utilisateur
  const updateProfile = async (profileData: Partial<UserProfile>): Promise<AuthResult<UserProfile>> => {
    try {
      const supabase = getSupabase();
      
      // Mettre à jour les métadonnées utilisateur
      const { data, error } = await supabase.auth.updateUser({
        data: {
          first_name: profileData.firstName,
          last_name: profileData.lastName,
          avatar_url: profileData.avatarUrl,
        },
      });
      
      if (error) {
        const mappedError = mapSupabaseError(error);
        logError(mappedError, 'useAuth.updateProfile');
        return { data: null, error: mappedError, loading: false };
      }
      
      // Mettre à jour l'état local
      const updatedProfile = mapUserToProfile(data.user);
      setUser(data.user);
      setProfile(updatedProfile);
      
      return { data: updatedProfile, error: null, loading: false };
    } catch (err) {
      const error = mapSupabaseError(err);
      logError(error, 'useAuth.updateProfile');
      return { data: null, error, loading: false };
    }
  };
  
  // Chargement initial de l'utilisateur
  useEffect(() => {
    const supabase = getSupabase();
    
    // S'abonner aux changements d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        setUser(session?.user || null);
        setProfile(mapUserToProfile(session?.user || null));
        setSession(session);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setProfile(null);
        setSession(null);
      } else if (event === 'USER_UPDATED') {
        setUser(session?.user || null);
        setProfile(mapUserToProfile(session?.user || null));
        setSession(session);
      }
      
      setLoading(false);
      setInitialized(true);
    });
    
    // Charger l'utilisateur initial
    loadUser();
    
    return () => {
      subscription?.unsubscribe();
    };
  }, [loadUser, mapUserToProfile]);
  
  return {
    user,
    profile,
    session,
    loading,
    initialized,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
    updateProfile,
    loadUser,
    isLoggedIn: !!user,
  };
}
