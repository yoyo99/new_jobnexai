import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { applyToJobAutomated } from '../api/automatedApply';

/**
 * Bouton d'automatisation de candidature.
 * Gère le processus complet de candidature automatique avec suivi d'état,
 * gestion des erreurs et feedback utilisateur.
 */

interface AutomatedApplyButtonProps {
  jobId: string;
  jobTitle: string;
  companyName: string;
  userId: string;
  cvId: string;
  coverLetterId?: string;
  disabled?: boolean;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

const AutomatedApplyButton: React.FC<AutomatedApplyButtonProps> = ({
  jobId,
  jobTitle,
  companyName,
  userId,
  cvId,
  coverLetterId,
  disabled,
  onSuccess,
  onError
}) => {
  const { user } = useAuth();
  const [isApplying, setIsApplying] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [progressMessage, setProgressMessage] = useState<string>('');

  const handleAutomatedApply = async () => {
    if (!user) {
      setError('Vous devez être connecté pour candidater');
      onError?.('Not authenticated');
      return;
    }

    try {
      setIsApplying(true);
      setSuccess(false);
      setError(null);
      setProgress(0);
      setProgressMessage('Préparation de la candidature...');

      // Mettre à jour le statut dans la base de données
      setProgress(10);
      setProgressMessage('Mise à jour du statut...');

      const applicationData = {
        job_id: jobId,
        user_id: userId,
        cv_id: cvId,
        cover_letter_id: coverLetterId,
        status: 'applying',
        applied_at: new Date().toISOString(),
        source: 'automated',
        metadata: {
          job_title: jobTitle,
          company_name: companyName,
          automation_version: '1.0'
        }
      };

      // Appel à l'API d'automatisation
      setProgress(30);
      setProgressMessage('Envoi de la candidature...');

      const result = await applyToJobAutomated({
        jobId,
        userId,
        cvId,
        coverLetterId,
        jobTitle,
        companyName,
        onProgress: (currentProgress, message) => {
          setProgress(currentProgress);
          setProgressMessage(message);
        }
      });

      if (result.success) {
        setProgress(100);
        setProgressMessage('Candidature envoyée avec succès !');
        setSuccess(true);
        onSuccess?.();
        
        // Mettre à jour le statut final
        await updateApplicationStatus(jobId, userId, 'applied');
      } else {
        throw new Error(result.error || 'Échec de la candidature automatique');
      }
      
    } catch (err) {
      console.error('Automated apply error:', err);
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      onError?.(err instanceof Error ? err.message : 'Unknown error');
      
      // Mettre à jour le statut en erreur
      try {
        await updateApplicationStatus(jobId, userId, 'error');
      } catch (updateError) {
        console.error('Failed to update application status:', updateError);
      }
    } finally {
      setIsApplying(false);
      // Réinitialiser la progression après 5 secondes
      setTimeout(() => {
        setProgress(null);
        setProgressMessage('');
      }, 5000);
    }
  };

  /**
   * Met à jour le statut de la candidature dans Supabase
   */
  const updateApplicationStatus = async (jobId: string, userId: string, status: string) => {
    try {
      const { supabase } = await import('../lib/supabase');
      
      const { error } = await supabase
        .from('applications')
        .update({
          status,
          updated_at: new Date().toISOString()
        })
        .match({ job_id: jobId, user_id: userId });
      
      if (error) {
        console.error('Failed to update application status:', error);
      }
    } catch (error) {
      console.error('Error updating application status:', error);
    }
  };

  return (
    <div className="my-4">
      <button
        className={`btn ${isApplying ? 'btn-disabled' : success ? 'btn-success' : 'btn-primary'}`}
        onClick={handleAutomatedApply}
        disabled={isApplying || disabled || success}
      >
        {isApplying ? 'Candidature en cours...' : success ? 'Candidature envoyée !' : 'Candidater automatiquement'}
      </button>

      {/* Barre de progression */}
      {progress !== null && (
        <div className="mt-3">
          <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
            <div
              className="bg-blue-600 h-2.5 rounded-full"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-600 mt-1">{progressMessage}</p>
        </div>
      )}

      {/* Message d'erreur */}
      {error && (
        <div className="mt-2 p-2 bg-red-100 text-red-700 rounded text-sm">
          ⚠️ {error}
        </div>
      )}

      {/* Instructions */}
      {!isApplying && !success && !error && (
        <div className="mt-2 text-xs text-gray-500">
          <p>La candidature automatique va :</p>
          <ul className="list-disc list-inside mt-1">
            <li>Envoyer votre CV et lettre de motivation</li>
            <li>Remplir les champs du formulaire</li>
            <li>Soumettre la candidature</li>
            <li>Mettre à jour votre tableau de bord</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default AutomatedApplyButton;
