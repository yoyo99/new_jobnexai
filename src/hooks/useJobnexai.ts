import { useMemo } from 'react';
import { useAuth } from './useAuth';
import { useJobs } from './useJobs';
import { useNetlify } from './useNetlify';

/**
 * Hook principal de l'application JobNexAI
 * Agrège tous les autres hooks spécialisés en une interface unifiée
 */
export function useJobnexai() {
  // Hooks spécialisés
  const auth = useAuth();
  const jobs = useJobs();
  const netlify = useNetlify();
  
  // État global de l'application
  const appState = useMemo(() => {
    return {
      // État d'authentification
      isLoggedIn: auth.isLoggedIn,
      isLoading: auth.loading || jobs.loading,
      isInitialized: auth.initialized,
      user: auth.user,
      profile: auth.profile,
      
      // Rôles et permissions
      isEmployer: auth.profile?.role === 'employer',
      isJobSeeker: auth.profile?.role === 'jobseeker' || auth.profile?.role === 'user',
      isAdmin: auth.profile?.role === 'admin',
    };
  }, [
    auth.isLoggedIn,
    auth.loading,
    auth.initialized,
    auth.user,
    auth.profile,
    jobs.loading
  ]);
  
  // Exposer les fonctions d'authentification
  const authActions = useMemo(() => ({
    login: auth.signIn,
    register: auth.signUp,
    logout: auth.signOut,
    resetPassword: auth.resetPassword,
    updatePassword: auth.updatePassword,
    updateProfile: auth.updateProfile,
  }), [
    auth.signIn,
    auth.signUp,
    auth.signOut,
    auth.resetPassword,
    auth.updatePassword,
    auth.updateProfile
  ]);
  
  // Exposer les fonctions de gestion des offres d'emploi
  const jobActions = useMemo(() => ({
    // Recherche et navigation
    getJobs: jobs.getJobs,
    getJobById: jobs.getJobById,
    
    // Actions employeur
    createJob: jobs.createJob,
    updateJob: jobs.updateJob,
    deleteJob: jobs.deleteJob,
    getApplicationsForJob: jobs.getJobApplications,
    updateApplicationStatus: jobs.updateApplicationStatus,
    
    // Actions candidat
    applyToJob: jobs.applyToJob,
    getMyApplications: jobs.getMyApplications,
  }), [
    jobs.getJobs,
    jobs.getJobById,
    jobs.createJob,
    jobs.updateJob,
    jobs.deleteJob,
    jobs.getJobApplications,
    jobs.updateApplicationStatus,
    jobs.applyToJob,
    jobs.getMyApplications
  ]);
  
  // Exposer les fonctions utilitaires API
  const apiActions = useMemo(() => ({
    checkAPIStatus: netlify.checkAuth,
    callAPI: netlify.get,
    postAPI: netlify.post,
    putAPI: netlify.put,
    deleteAPI: netlify.delete,
    patchAPI: netlify.patch,
  }), [
    netlify.checkAuth,
    netlify.get,
    netlify.post,
    netlify.put,
    netlify.delete,
    netlify.patch
  ]);
  
  return {
    // État global
    ...appState,
    
    // Groupes d'actions
    auth: authActions,
    jobs: jobs,
    api: apiActions,
    
    // État de chargement global
    isLoading: auth.loading || jobs.loading,
  };
}

// Exporter aussi les types des hooks individuels
export * from './useAuth';
export * from './useJobs';
