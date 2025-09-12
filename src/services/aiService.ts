/**
 * @file Centralized AI Service
 * @description This service manages all interactions with different AI models (OpenAI, Mistral, etc.)
 * for tasks like cover letter generation, CV analysis, and job matching.
 */

import { getUserAISettings as fetchUserSettings, UserAISettingsData } from '../lib/supabase';

// Définition des moteurs d'IA supportés
export type SupportedAI = 'openai' | 'mistral' | 'gemini' | 'claude' | 'cohere' | 'huggingface' | 'internal';

const DEFAULT_ENGINE: SupportedAI = 'openai';

// --- Fonctions de service --- //

/**
 * Récupère les paramètres IA d'un utilisateur depuis Supabase ou retourne des valeurs par défaut.
 * @param userId - L'ID de l'utilisateur (optionnel)
 * @returns Les paramètres IA de l'utilisateur.
 */
const getUserSettings = async (userId?: string): Promise<UserAISettingsData> => {
  if (userId) {
    const settings = await fetchUserSettings(userId);
    if (settings) {
      return settings;
    }
  }
  // Retourne des paramètres par défaut si l'utilisateur n'est pas connecté ou n'a pas de configuration
  return {
    feature_engines: {
      coverLetter: DEFAULT_ENGINE,
      matchScore: 'internal',
    },
    api_keys: {},
  };
};

/**
 * Génère une lettre de motivation en utilisant le moteur IA configuré.
 * @param cv - Le contenu du CV de l'utilisateur.
 * @param jobDescription - La description du poste.
 * @param language - La langue de la lettre.
 * @param tone - Le ton de la lettre.
 * @param userId - L'ID de l'utilisateur pour récupérer ses paramètres.
 * @returns La lettre de motivation générée.
 */
export const generateCoverLetter = async (
  cv: string,
  jobDescription: string,
  language: string,
  tone: string,
  userId?: string
): Promise<string> => {
  const settings = await getUserSettings(userId);
  const engine = settings.feature_engines?.coverLetter || DEFAULT_ENGINE;

  console.log(`Generating cover letter with ${engine}...`);

  // TODO: Implémenter la logique d'appel pour chaque moteur IA
  // Pour l'instant, on retourne une réponse simulée.
  return `[IA: ${engine}] Lettre de motivation générée (simulé).\n\nCV: ${cv.substring(0, 50)}...\nJob: ${jobDescription.substring(0, 50)}...\nLangue: ${language}\nTon: ${tone}`;
};

/**
 * Calcule le score de matching entre un CV et une offre d'emploi.
 * @param cv - Le contenu du CV.
 * @param jobDescription - La description de l'offre.
 * @param userId - L'ID de l'utilisateur.
 * @returns Un objet avec le score et une explication.
 */
export const getMatchScore = async (
  cv: string,
  jobDescription: string,
  userId?: string
): Promise<{ score: number; explanation: string }> => {
  const settings = await getUserSettings(userId);
  const engine = settings.feature_engines?.matchScore || 'internal';

  console.log(`Calculating match score with ${engine}...`);

  // TODO: Implémenter la logique d'appel pour chaque moteur IA
  return {
    score: Math.round(Math.random() * 30 + 70), // Score aléatoire entre 70 et 100
    explanation: `[IA: ${engine}] Le score a été calculé en analysant les compétences clés. Le CV correspond bien à l'offre (simulé).`,
  };
};
