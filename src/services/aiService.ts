/**
 * @file Centralized AI Service
 * @description This service manages all interactions with different AI models (e.g., OpenAI, Mammouth)
 * for tasks like cover letter generation, CV analysis, and job matching.
 */

import { generateCoverLetter as generateCoverLetterFromLib } from '../lib/ai';
import { matchCVWithJob } from '../lib/ai_logic/matchCV';

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
  cv: any, // Le CV peut être un objet complexe
  jobDescription: string,
  language: string,
  tone: 'professional' | 'conversational' | 'enthusiastic',
  userId?: string // Gardé pour la cohérence de l'API, mais la logique est dans le client
): Promise<string> => {
  console.log(`Génération de la lettre de motivation via le service centralisé...`);
  try {
    // Délégation à la librairie `ai.ts` qui gère la sélection du fournisseur (y compris Mammouth)
    return await generateCoverLetterFromLib(cv, jobDescription, language, tone);
  } catch (error) {
    console.error('Erreur lors de la génération de la lettre de motivation via le service AI:', error);
    throw new Error(`Impossible de générer la lettre de motivation: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
  }
};

/**
 * Génère une lettre de motivation via la fonction serverless
 */

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
  userId?: string // Gardé pour la cohérence de l'API
): Promise<{ score: number; summary: string }> => {
  console.log(`Calcul du score de matching avec Mammouth.ai...`);
  try {
    // Appel à la fonction qui utilise Mammouth.ai pour une analyse sémantique
    const result = await matchCVWithJob(cv, jobDescription);
    return result;
  } catch (error) {
    console.error('Erreur lors du calcul du score de matching:', error);
    return {
      score: 0,
      summary: `Une erreur est survenue lors de l'analyse: ${error instanceof Error ? error.message : 'Erreur inconnue'}`
    };
  }
};

