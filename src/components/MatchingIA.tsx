import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getMatchScore } from '../services/aiService';

/**
 * Composant de matching IA utilisant React Query pour une gestion de données optimisée.
 * Affiche un score de compatibilité entre le profil utilisateur et une offre d'emploi.
 */

interface MatchingIAProps {
  userSkills: string[];
  jobKeywords: string[];
}

const MatchingIA: React.FC<MatchingIAProps> = ({ userSkills, jobKeywords }) => {
  const {
    data: matchResult,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['matchScore', userSkills, jobKeywords],
    queryFn: () => getMatchScore(userSkills.join(', '), jobKeywords.join(', ')),
    enabled: userSkills.length > 0 && jobKeywords.length > 0,
    staleTime: 1000 * 60 * 5, // Cache le résultat pendant 5 minutes
    refetchOnWindowFocus: false, // Évite les re-fetchs inutiles
  });

  if (isLoading) {
    return (
      <div className="border border-primary-400 rounded-lg p-4 my-4 bg-background/60 animate-pulse">
        <h2 className="text-lg font-semibold mb-2">Compatibilité IA</h2>
        <p className="text-sm text-gray-400">Calcul du score en cours...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="border border-destructive rounded-lg p-4 my-4 bg-destructive/10">
        <h2 className="text-lg font-semibold mb-2 text-destructive">Erreur de Calcul</h2>
        <p className="text-sm text-destructive/80">
          Impossible de calculer le score de compatibilité pour le moment.
        </p>
      </div>
    );
  }

  return (
    <div className="border border-primary-400 rounded-lg p-4 my-4 bg-background/60">
      <h2 className="text-lg font-semibold mb-2">Compatibilité IA</h2>
      <p className="mb-1">
        Score de compatibilité : <span className="font-bold text-primary-400">{matchResult?.score}%</span>
      </p>
      <p className="text-xs text-gray-400">{matchResult?.explanation}</p>
    </div>
  );
};

export default MatchingIA;
