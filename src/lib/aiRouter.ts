/**
 * @file AI Router - Routeur intelligent pour les appels IA
 * @description Orchestre les appels aux différents services IA en fonction des paramètres utilisateur,
 * des quotas disponibles et des performances. Gère le fallback automatique et le caching.
 */

import { AIResponse, SupportedAI } from '../services/aiService';
import { getUserAISettings } from '../lib/supabase';

// Types étendus pour le routeur
export type AIRouterOptions = {
  engine?: SupportedAI; // Moteur spécifique (optionnel)
  userId?: string; // ID utilisateur pour récupérer les paramètres
  forceFallback?: boolean; // Forcer le fallback local
  cacheTTL?: number; // Temps de cache en secondes
};

export type AIRouterResult<T = any> = {
  success: boolean;
  data?: T;
  error?: string;
  engineUsed: SupportedAI;
  tokensUsed?: number;
  cached?: boolean;
  timestamp: string;
};

// Cache simple en mémoire (pour le développement)
const aiCache = new Map<string, { data: any; expires: number }>();

/**
 * Génère une clé de cache unique pour une requête
 */
const generateCacheKey = (type: string, params: any): string => {
  return `${type}:${JSON.stringify(params)}`;
};

/**
 * Vérifie si une entrée cache est valide
 */
const isCacheValid = (cacheKey: string): boolean => {
  const cached = aiCache.get(cacheKey);
  if (!cached) return false;
  return cached.expires > Date.now();
};

/**
 * Routeur principal pour le score de matching
 * @param userSkills - Compétences de l'utilisateur
 * @param jobKeywords - Mots-clés de l'offre
 * @param options - Options de routage
 * @returns Score de matching avec métadonnées
 */
export async function matchScoreIA(
  userSkills: string[],
  jobKeywords: string[],
  options: AIRouterOptions = {}
): Promise<AIRouterResult<{ score: number; explanation: string; matchingSkills: string[]; missingSkills: string[]; suggestions: string[] }>> {
  const { engine: requestedEngine, userId, forceFallback = false, cacheTTL = 300 } = options;
  
  // Générer la clé de cache
  const cacheKey = generateCacheKey('matchScore', { userSkills, jobKeywords, requestedEngine, userId });
  
  // Vérifier le cache
  if (isCacheValid(cacheKey)) {
    const cached = aiCache.get(cacheKey)!;
    return {
      success: true,
      data: cached.data,
      engineUsed: 'cached',
      cached: true,
      timestamp: new Date().toISOString()
    };
  }

  try {
    // Récupérer les paramètres utilisateur
    const settings = userId ? await getUserAISettings(userId) : null;
    const configuredEngine = settings?.feature_engines?.matchScore || 'internal';
    
    // Déterminer le moteur à utiliser (priorité: requested > configured > internal)
    const engineToUse: SupportedAI = 
      requestedEngine || 
      (settings?.feature_engines?.matchScore as SupportedAI) || 
      'internal';
    
    // Vérifier si on doit forcer le fallback
    if (forceFallback) {
      const result = await internalMatchScore(userSkills, jobKeywords);
      
      // Mettre en cache
      aiCache.set(cacheKey, { 
        data: result, 
        expires: Date.now() + (cacheTTL * 1000) 
      });
      
      return {
        success: true,
        data: result,
        engineUsed: 'internal',
        cached: false,
        timestamp: new Date().toISOString()
      };
    }
    
    // Appeler le service AI approprié
    const { generateCoverLetter, getMatchScore, analyzeCV } = await import('../services/aiService');
    
    const result = await getMatchScore(
      userSkills.join(', '),
      jobKeywords.join(', '),
      userId
    );
    
    if (!result.success) {
      // Fallback automatique en cas d'erreur
      console.warn(`Fallback to internal engine: ${result.error}`);
      const fallbackResult = await internalMatchScore(userSkills, jobKeywords);
      
      aiCache.set(cacheKey, { 
        data: fallbackResult, 
        expires: Date.now() + (cacheTTL * 1000) 
      });
      
      return {
        success: true,
        data: fallbackResult,
        engineUsed: 'internal',
        cached: false,
        timestamp: new Date().toISOString()
      };
    }
    
    // Mettre en cache
    aiCache.set(cacheKey, { 
      data: result.data, 
      expires: Date.now() + (cacheTTL * 1000) 
    });
    
    return {
      success: true,
      data: result.data,
      engineUsed: result.engine,
      tokensUsed: result.tokensUsed,
      cached: false,
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('AI Router Error (matchScore):', error);
    
    // Fallback ultime
    const fallbackResult = await internalMatchScore(userSkills, jobKeywords);
    
    return {
      success: true,
      data: fallbackResult,
      engineUsed: 'internal',
      error: error instanceof Error ? error.message : 'Unknown error',
      cached: false,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Implémentation interne de calcul de score (fallback)
 */
async function internalMatchScore(
  userSkills: string[],
  jobKeywords: string[]
): Promise<{
  score: number;
  explanation: string;
  matchingSkills: string[];
  missingSkills: string[];
  suggestions: string[];
}> {
  const matchingSkills = userSkills.filter(skill => jobKeywords.includes(skill));
  const missingSkills = jobKeywords.filter(skill => !userSkills.includes(skill));
  const score = Math.round((matchingSkills.length / jobKeywords.length) * 100) || 0;
  
  return {
    score,
    explanation: `Your skills match ${score}% of the job requirements based on keyword analysis.`,
    matchingSkills,
    missingSkills,
    suggestions: missingSkills.map(skill => `Consider highlighting or acquiring ${skill} skill.`)
  };
}

/**
 * Routeur pour la génération de lettres de motivation
 * @param cv - Contenu du CV
 * @param jobDescription - Description du poste
 * @param language - Langue souhaitée
 * @param tone - Ton souhaité
 * @param options - Options de routage
 * @returns Lettre de motivation générée
 */
export async function generateCoverLetterIA(
  cv: string,
  jobDescription: string,
  language: string,
  tone: string,
  options: AIRouterOptions = {}
): Promise<AIRouterResult<string>> {
  const { engine: requestedEngine, userId, forceFallback = false, cacheTTL = 300 } = options;
  
  // Générer la clé de cache
  const cacheKey = generateCacheKey('coverLetter', { cv, jobDescription, language, tone, requestedEngine, userId });
  
  // Vérifier le cache
  if (isCacheValid(cacheKey)) {
    const cached = aiCache.get(cacheKey)!;
    return {
      success: true,
      data: cached.data,
      engineUsed: 'cached',
      cached: true,
      timestamp: new Date().toISOString()
    };
  }

  try {
    // Récupérer les paramètres utilisateur
    const settings = userId ? await getUserAISettings(userId) : null;
    
    // Déterminer le moteur à utiliser
    const engineToUse: SupportedAI = 
      requestedEngine || 
      (settings?.feature_engines?.coverLetter as SupportedAI) || 
      'internal';
    
    // Vérifier si on doit forcer le fallback
    if (forceFallback) {
      const simulatedLetter = `
Dear Hiring Manager,

I am writing to express my strong interest in this position. With my background in ${cv.substring(0, 100)}..., I am confident I would be a valuable addition to your team.

Sincerely,
[Your Name]
      `.trim();
      
      aiCache.set(cacheKey, { 
        data: simulatedLetter, 
        expires: Date.now() + (cacheTTL * 1000) 
      });
      
      return {
        success: true,
        data: simulatedLetter,
        engineUsed: 'internal',
        cached: false,
        timestamp: new Date().toISOString()
      };
    }
    
    // Appeler le service AI approprié
    const { generateCoverLetter } = await import('../services/aiService');
    
    const result = await generateCoverLetter(cv, jobDescription, language, tone, userId);
    
    if (!result.success) {
      // Fallback automatique
      console.warn(`Fallback to internal engine: ${result.error}`);
      const simulatedLetter = `
Dear Hiring Manager,

I am writing to express my strong interest in this position. With my background in ${cv.substring(0, 100)}..., I am confident I would be a valuable addition to your team.

Sincerely,
[Your Name]
      `.trim();
      
      aiCache.set(cacheKey, { 
        data: simulatedLetter, 
        expires: Date.now() + (cacheTTL * 1000) 
      });
      
      return {
        success: true,
        data: simulatedLetter,
        engineUsed: 'internal',
        cached: false,
        timestamp: new Date().toISOString()
      };
    }
    
    // Mettre en cache
    aiCache.set(cacheKey, { 
      data: result.data, 
      expires: Date.now() + (cacheTTL * 1000) 
    });
    
    return {
      success: true,
      data: result.data,
      engineUsed: result.engine,
      tokensUsed: result.tokensUsed,
      cached: false,
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('AI Router Error (coverLetter):', error);
    
    // Fallback ultime
    const simulatedLetter = `
Dear Hiring Manager,

I am writing to express my strong interest in this position. With my background in ${cv.substring(0, 100)}..., I am confident I would be a valuable addition to your team.

Sincerely,
[Your Name]
    `.trim();
    
    return {
      success: true,
      data: simulatedLetter,
      engineUsed: 'internal',
      error: error instanceof Error ? error.message : 'Unknown error',
      cached: false,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Routeur pour l'analyse de CV
 * @param cvText - Texte du CV
 * @param options - Options de routage
 * @returns Analyse structurée du CV
 */
export async function analyzeCVIA(
  cvText: string,
  options: AIRouterOptions = {}
): Promise<AIRouterResult<{
  skills: string[];
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  summary: string;
}>> {
  const { engine: requestedEngine, userId, forceFallback = false, cacheTTL = 300 } = options;
  
  // Générer la clé de cache
  const cacheKey = generateCacheKey('analyzeCV', { cvText, requestedEngine, userId });
  
  // Vérifier le cache
  if (isCacheValid(cacheKey)) {
    const cached = aiCache.get(cacheKey)!;
    return {
      success: true,
      data: cached.data,
      engineUsed: 'cached',
      cached: true,
      timestamp: new Date().toISOString()
    };
  }

  try {
    // Récupérer les paramètres utilisateur
    const settings = userId ? await getUserAISettings(userId) : null;
    
    // Déterminer le moteur à utiliser
    const engineToUse: SupportedAI = 
      requestedEngine || 
      (settings?.feature_engines?.coverLetter as SupportedAI) || 
      'internal';
    
    // Vérifier si on doit forcer le fallback
    if (forceFallback) {
      const skills = extractSkillsFromText(cvText);
      const wordCount = cvText.split(/\s+/).length;
      
      const result = {
        skills,
        strengths: [`${skills.length} skills identified`, `${wordCount} words`],
        weaknesses: wordCount < 300 ? ['CV might be too short'] : [],
        suggestions: wordCount < 300 ? ['Consider expanding your CV'] : [],
        summary: `CV contains ${skills.length} skills and ${wordCount} words.`
      };
      
      aiCache.set(cacheKey, { 
        data: result, 
        expires: Date.now() + (cacheTTL * 1000) 
      });
      
      return {
        success: true,
        data: result,
        engineUsed: 'internal',
        cached: false,
        timestamp: new Date().toISOString()
      };
    }
    
    // Appeler le service AI approprié
    const { analyzeCV } = await import('../services/aiService');
    
    const result = await analyzeCV(cvText, userId);
    
    if (!result.success) {
      // Fallback automatique
      console.warn(`Fallback to internal engine: ${result.error}`);
      const skills = extractSkillsFromText(cvText);
      const wordCount = cvText.split(/\s+/).length;
      
      const fallbackResult = {
        skills,
        strengths: [`${skills.length} skills identified`, `${wordCount} words`],
        weaknesses: wordCount < 300 ? ['CV might be too short'] : [],
        suggestions: wordCount < 300 ? ['Consider expanding your CV'] : [],
        summary: `CV contains ${skills.length} skills and ${wordCount} words.`
      };
      
      aiCache.set(cacheKey, { 
        data: fallbackResult, 
        expires: Date.now() + (cacheTTL * 1000) 
      });
      
      return {
        success: true,
        data: fallbackResult,
        engineUsed: 'internal',
        cached: false,
        timestamp: new Date().toISOString()
      };
    }
    
    // Mettre en cache
    aiCache.set(cacheKey, { 
      data: result.data, 
      expires: Date.now() + (cacheTTL * 1000) 
    });
    
    return {
      success: true,
      data: result.data,
      engineUsed: result.engine,
      tokensUsed: result.tokensUsed,
      cached: false,
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('AI Router Error (analyzeCV):', error);
    
    // Fallback ultime
    const skills = extractSkillsFromText(cvText);
    const wordCount = cvText.split(/\s+/).length;
    
    const fallbackResult = {
      skills,
      strengths: [`${skills.length} skills identified`, `${wordCount} words`],
      weaknesses: wordCount < 300 ? ['CV might be too short'] : [],
      suggestions: wordCount < 300 ? ['Consider expanding your CV'] : [],
      summary: `CV contains ${skills.length} skills and ${wordCount} words.`
    };
    
    return {
      success: true,
      data: fallbackResult,
      engineUsed: 'internal',
      error: error instanceof Error ? error.message : 'Unknown error',
      cached: false,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Extrait les compétences d'un texte (utilisé pour l'analyse interne)
 */
function extractSkillsFromText(text: string): string[] {
  // Liste de compétences courantes à rechercher
  const commonSkills = [
    'JavaScript', 'TypeScript', 'React', 'Node.js', 'Python', 'Java', 'C++', 'C#',
    'SQL', 'NoSQL', 'MongoDB', 'PostgreSQL', 'AWS', 'Azure', 'GCP', 'Docker',
    'Kubernetes', 'Git', 'Agile', 'Scrum', 'Machine Learning', 'AI', 'Data Science',
    'UI/UX', 'Figma', 'Photoshop', 'Project Management', 'Leadership', 'Communication'
  ];

  const skills: string[] = [];
  const lowerText = text.toLowerCase();
  
  commonSkills.forEach(skill => {
    if (lowerText.includes(skill.toLowerCase())) {
      skills.push(skill);
    }
  });

  return skills;
}

/**
 * Routeur pour le streaming de génération de lettre
 * @param cv - Contenu du CV
 * @param jobDescription - Description du poste
 * @param language - Langue
 * @param tone - Ton
 * @param options - Options de routage
 * @returns Générateur asynchrone de chunks de texte
 */
export async function* generateCoverLetterStreamIA(
  cv: string,
  jobDescription: string,
  language: string,
  tone: string,
  options: AIRouterOptions = {}
): AsyncGenerator<string> {
  const { engine: requestedEngine, userId, forceFallback = false } = options;
  
  try {
    // Récupérer les paramètres utilisateur
    const settings = userId ? await getUserAISettings(userId) : null;
    
    // Déterminer le moteur à utiliser
    const engineToUse: SupportedAI = 
      requestedEngine || 
      (settings?.feature_engines?.coverLetter as SupportedAI) || 
      'internal';
    
    // Vérifier si on doit forcer le fallback
    if (forceFallback) {
      const simulatedLetter = `
Dear Hiring Manager,

I am writing to express my strong interest in this position. With my background in ${cv.substring(0, 100)}..., I am confident I would be a valuable addition to your team.

Sincerely,
[Your Name]
      `.trim();
      
      const chunks = simulatedLetter.split(/(\S+\s+)/);
      for (const chunk of chunks) {
        if (chunk.trim()) {
          yield chunk;
          await new Promise(resolve => setTimeout(resolve, 50));
        }
      }
      return;
    }
    
    // Appeler le service AI approprié
    const { generateCoverLetterStream } = await import('../services/aiService');
    
    const stream = generateCoverLetterStream(cv, jobDescription, language, tone, userId);
    
    for await (const chunk of stream) {
      yield chunk;
    }
    
  } catch (error) {
    console.error('AI Router Error (stream):', error);
    yield `[ERROR] ${error instanceof Error ? error.message : 'Unknown error'}`;
  }
}

/**
 * Efface le cache du routeur IA
 */
export const clearAICache = (): void => {
  aiCache.clear();
  console.log('AI Router cache cleared');
};

/**
 * Récupère les statistiques du cache
 */
export const getAICacheStats = (): { size: number; keys: string[] } => {
  return {
    size: aiCache.size,
    keys: Array.from(aiCache.keys())
  };
};
