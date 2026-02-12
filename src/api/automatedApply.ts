/**
 * @file API d'automatisation des candidatures
 * @description Gère le processus complet de candidature automatique,
 * y compris la soumission aux plateformes externes et le suivi.
 */

import { supabase } from '../lib/supabase';

/**
 * Options pour la candidature automatique
 */
export interface AutomatedApplyOptions {
  jobId: string;
  userId: string;
  cvId: string;
  coverLetterId?: string;
  jobTitle: string;
  companyName: string;
  customMessage?: string;
  onProgress?: (progress: number, message: string) => void;
}

/**
 * Résultat de la candidature automatique
 */
export interface AutomatedApplyResult {
  success: boolean;
  applicationId?: string;
  externalApplicationId?: string;
  error?: string;
  externalUrl?: string;
  tokensUsed?: number;
}

/**
 * Soumet une candidature automatique
 * @param options - Options de candidature
 * @returns Résultat de la candidature
 */
export async function applyToJobAutomated(
  options: AutomatedApplyOptions
): Promise<AutomatedApplyResult> {
  const {
    jobId,
    userId,
    cvId,
    coverLetterId,
    jobTitle,
    companyName,
    customMessage,
    onProgress
  } = options;

  try {
    onProgress?.(10, 'Validation des données...');

    // 1. Valider que l'utilisateur existe
    const { data: userData, error: userError } = await supabase
      .from('profiles')
      .select('id, email, first_name, last_name')
      .eq('id', userId)
      .single();

    if (userError || !userData) {
      throw new Error('Utilisateur non trouvé');
    }

    onProgress?.(20, 'Récupération du CV...');

    // 2. Récupérer le CV
    const { data: cvData, error: cvError } = await supabase
      .from('cvs')
      .select('id, content, file_url')
      .eq('id', cvId)
      .eq('user_id', userId)
      .single();

    if (cvError || !cvData) {
      throw new Error('CV non trouvé');
    }

    onProgress?.(30, 'Récupération de la lettre de motivation...');

    // 3. Récupérer la lettre de motivation (si spécifiée)
    let coverLetterContent = '';
    if (coverLetterId) {
      const { data: letterData, error: letterError } = await supabase
        .from('cover_letters')
        .select('content')
        .eq('id', coverLetterId)
        .eq('user_id', userId)
        .single();

      if (letterError) {
        console.warn('Lettre de motivation non trouvée, utilisation d\'une lettre par défaut');
      } else if (letterData) {
        coverLetterContent = letterData.content;
      }
    }

    onProgress?.(40, 'Création de l\'application...');

    // 4. Créer l'enregistrement de candidature
    const { data: applicationData, error: applicationError } = await supabase
      .from('applications')
      .insert({
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
          automation_version: '1.0',
          custom_message: customMessage
        }
      })
      .select()
      .single();

    if (applicationError || !applicationData) {
      throw new Error('Échec de la création de l\'application');
    }

    onProgress?.(60, 'Soumission à la plateforme externe...');

    // 5. Soumettre à la plateforme externe (simulé pour l'instant)
    // Dans une implémentation réelle, cela appellerait l'API de la plateforme
    const externalResult = await submitToExternalPlatform({
      jobId,
      userData,
      cvData,
      coverLetterContent,
      jobTitle,
      companyName,
      onProgress
    });

    if (!externalResult.success) {
      // Mettre à jour le statut en erreur
      await supabase
        .from('applications')
        .update({ status: 'error', error_message: externalResult.error })
        .eq('id', applicationData.id);

      throw new Error(externalResult.error || 'Échec de la soumission externe');
    }

    onProgress?.(80, 'Finalisation...');

    // 6. Mettre à jour le statut final
    await supabase
      .from('applications')
      .update({
        status: 'applied',
        external_application_id: externalResult.externalId,
        external_url: externalResult.externalUrl,
        updated_at: new Date().toISOString()
      })
      .eq('id', applicationData.id);

    onProgress?.(100, 'Candidature envoyée avec succès !');

    return {
      success: true,
      applicationId: applicationData.id,
      externalApplicationId: externalResult.externalId,
      externalUrl: externalResult.externalUrl
    };

  } catch (error) {
    console.error('Automated apply error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Soumet la candidature à une plateforme externe (simulé)
 * @param params - Paramètres de soumission
 * @returns Résultat de la soumission
 */
async function submitToExternalPlatform(params: {
  jobId: string;
  userData: any;
  cvData: any;
  coverLetterContent: string;
  jobTitle: string;
  companyName: string;
  onProgress?: (progress: number, message: string) => void;
}): Promise<{ success: boolean; externalId?: string; externalUrl?: string; error?: string }> {
  // Dans une implémentation réelle, cela appellerait l'API de la plateforme
  // comme LinkedIn, Indeed, ou l'API de l'entreprise
  
  try {
    onProgress?.(65, 'Connexion à la plateforme externe...');
    
    // Simulation d'un délai de réseau
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    onProgress?.(70, 'Envoi des données...');
    
    // Simulation de l'envoi
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    onProgress?.(75, 'Validation de la soumission...');
    
    // Simulation de la validation
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Générer un ID externe simulé
    const externalId = `EXT-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
    const externalUrl = `https://jobs.example.com/application/${externalId}`;
    
    return {
      success: true,
      externalId,
      externalUrl
    };
    
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'External platform error'
    };
  }
}

/**
 * Récupère l'historique des candidatures automatisées pour un utilisateur
 * @param userId - ID de l'utilisateur
 * @returns Liste des candidatures automatisées
 */
export async function getAutomatedApplications(userId: string): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('applications')
      .select('*')
      .eq('user_id', userId)
      .eq('source', 'automated')
      .order('applied_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching automated applications:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Error in getAutomatedApplications:', error);
    return [];
  }
}

/**
 * Met à jour le statut d'une candidature automatisée
 * @param applicationId - ID de la candidature
 * @param status - Nouveau statut
 * @returns Succès de la mise à jour
 */
export async function updateAutomatedApplicationStatus(
  applicationId: string,
  status: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('applications')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', applicationId);
    
    return !error;
  } catch (error) {
    console.error('Error updating application status:', error);
    return false;
  }
}

/**
 * Annule une candidature automatisée en cours
 * @param applicationId - ID de la candidature
 * @returns Succès de l'annulation
 */
export async function cancelAutomatedApplication(applicationId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('applications')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString(),
        cancelled_at: new Date().toISOString()
      })
      .eq('id', applicationId)
      .eq('status', 'applying');
    
    return !error;
  } catch (error) {
    console.error('Error cancelling application:', error);
    return false;
  }
}