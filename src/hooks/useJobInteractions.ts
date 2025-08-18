import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../stores/auth';

export interface JobInteraction {
  job_id: string;
  user_id: string;
  liked?: boolean;
  disliked?: boolean;
  saved?: boolean;
  applied?: boolean;
  viewed_at?: string;
  interaction_date: string;
}

export const useJobInteractions = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [interactions, setInteractions] = useState<Record<string, JobInteraction>>({});

  const loadInteractions = useCallback(async (jobIds: string[]) => {
    if (!user?.id || jobIds.length === 0) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('job_interactions')
        .select('*')
        .eq('user_id', user.id)
        .in('job_id', jobIds);

      if (error) throw error;

      const interactionsMap: Record<string, JobInteraction> = {};
      data?.forEach(interaction => {
        interactionsMap[interaction.job_id] = interaction;
      });

      setInteractions(prev => ({ ...prev, ...interactionsMap }));
    } catch (error) {
      console.error('Erreur lors du chargement des interactions:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const updateInteraction = useCallback(async (
    jobId: string, 
    updates: Partial<Pick<JobInteraction, 'liked' | 'disliked' | 'saved' | 'applied'>>
  ) => {
    if (!user?.id) return;

    try {
      const existingInteraction = interactions[jobId];
      const newInteraction = {
        job_id: jobId,
        user_id: user.id,
        ...existingInteraction,
        ...updates,
        interaction_date: new Date().toISOString()
      };

      // Logique pour éviter les conflits like/dislike
      if (updates.liked === true) {
        newInteraction.disliked = false;
      } else if (updates.disliked === true) {
        newInteraction.liked = false;
      }

      const { error } = await supabase
        .from('job_interactions')
        .upsert(newInteraction);

      if (error) throw error;

      setInteractions(prev => ({
        ...prev,
        [jobId]: newInteraction
      }));

      return newInteraction;
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'interaction:', error);
      throw error;
    }
  }, [user?.id, interactions]);

  const likeJob = useCallback(async (jobId: string) => {
    const currentInteraction = interactions[jobId];
    const newLikedState = !currentInteraction?.liked;
    
    return updateInteraction(jobId, { 
      liked: newLikedState ? true : null 
    });
  }, [interactions, updateInteraction]);

  const dislikeJob = useCallback(async (jobId: string) => {
    const currentInteraction = interactions[jobId];
    const newDislikedState = !currentInteraction?.disliked;
    
    return updateInteraction(jobId, { 
      disliked: newDislikedState ? true : null 
    });
  }, [interactions, updateInteraction]);

  const saveJob = useCallback(async (jobId: string) => {
    const currentInteraction = interactions[jobId];
    const newSavedState = !currentInteraction?.saved;
    
    return updateInteraction(jobId, { 
      saved: newSavedState ? true : null 
    });
  }, [interactions, updateInteraction]);

  const markAsViewed = useCallback(async (jobId: string) => {
    return updateInteraction(jobId, { 
      viewed_at: new Date().toISOString() 
    });
  }, [updateInteraction]);

  const getInteraction = useCallback((jobId: string): JobInteraction | null => {
    return interactions[jobId] || null;
  }, [interactions]);

  const isLiked = useCallback((jobId: string): boolean => {
    return interactions[jobId]?.liked === true;
  }, [interactions]);

  const isDisliked = useCallback((jobId: string): boolean => {
    return interactions[jobId]?.disliked === true;
  }, [interactions]);

  const isSaved = useCallback((jobId: string): boolean => {
    return interactions[jobId]?.saved === true;
  }, [interactions]);

  return {
    loading,
    interactions,
    loadInteractions,
    updateInteraction,
    likeJob,
    dislikeJob,
    saveJob,
    markAsViewed,
    getInteraction,
    isLiked,
    isDisliked,
    isSaved
  };
};
