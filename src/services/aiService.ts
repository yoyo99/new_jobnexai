/**
 * @file Centralized AI Service
 * @description This service manages all interactions with different AI models (OpenAI, Mistral, etc.)
 * for tasks like cover letter generation, CV analysis, and job matching.
 */

import { getUserAISettings as fetchUserSettings, UserAISettingsData } from '../lib/supabase';
import { Configuration, OpenAIApi } from 'openai';
import { MistralClient } from '@mistralai/mistralai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Anthropic } from '@anthropic-ai/sdk';

// Définition des moteurs d'IA supportés
export type SupportedAI = 'openai' | 'mistral' | 'gemini' | 'claude' | 'cohere' | 'huggingface' | 'internal';

export interface AIResponse {
  success: boolean;
  data?: any;
  error?: string;
  engine: SupportedAI;
  tokensUsed?: number;
}

const DEFAULT_ENGINE: SupportedAI = 'openai';

// --- Configuration des clients IA --- //

const createOpenAIClient = (apiKey: string) => {
  const configuration = new Configuration({ apiKey });
  return new OpenAIApi(configuration);
};

const createMistralClient = (apiKey: string) => {
  return new MistralClient(apiKey);
};

const createGeminiClient = (apiKey: string) => {
  return new GoogleGenerativeAI(apiKey);
};

const createClaudeClient = (apiKey: string) => {
  return new Anthropic({ apiKey });
};

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
): Promise<AIResponse> => {
  try {
    const settings = await getUserSettings(userId);
    const engine = settings.feature_engines?.coverLetter || DEFAULT_ENGINE;
    const apiKey = settings.api_keys?.[engine] || '';

    console.log(`Generating cover letter with ${engine}...`);

    // Construction du prompt
    const prompt = `
      Generate a professional cover letter in ${language} with a ${tone} tone.
      
      About me (from CV): ${cv}
      
      Job description: ${jobDescription}
      
      The letter should:
      1. Be concise and professional
      2. Highlight relevant skills and experiences
      3. Show enthusiasm for the position
      4. Be formatted as plain text (no HTML)
      5. Be between 200-400 words
    `;

    // Appel au moteur IA approprié
    switch (engine) {
      case 'openai': {
        if (!apiKey) {
          return { success: false, error: 'OpenAI API key missing', engine };
        }
        
        const openai = createOpenAIClient(apiKey);
        const response = await openai.createCompletion({
          model: 'gpt-4',
          prompt,
          max_tokens: 1000,
          temperature: 0.7,
        });
        
        return {
          success: true,
          data: response.data.choices[0].text?.trim(),
          engine,
          tokensUsed: response.data.usage?.total_tokens,
        };
      }

      case 'mistral': {
        if (!apiKey) {
          return { success: false, error: 'Mistral API key missing', engine };
        }
        
        const mistral = createMistralClient(apiKey);
        const response = await mistral.completion({
          model: 'mistral-large-latest',
          prompt,
          max_tokens: 1000,
          temperature: 0.7,
        });
        
        return {
          success: true,
          data: response.choices[0].text?.trim(),
          engine,
          tokensUsed: response.usage?.total_tokens,
        };
      }

      case 'gemini': {
        if (!apiKey) {
          return { success: false, error: 'Gemini API key missing', engine };
        }
        
        const gemini = createGeminiClient(apiKey);
        const model = gemini.getGenerativeModel({ model: 'gemini-pro' });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        
        return {
          success: true,
          data: response.text().trim(),
          engine,
          tokensUsed: response.usageMetadata?.totalTokenCount,
        };
      }

      case 'claude': {
        if (!apiKey) {
          return { success: false, error: 'Claude API key missing', engine };
        }
        
        const claude = createClaudeClient(apiKey);
        const response = await claude.messages.create({
          model: 'claude-3-opus-20240229',
          max_tokens: 1024,
          messages: [
            { role: 'user', content: prompt }
          ],
        });
        
        return {
          success: true,
          data: response.content[0].text?.trim(),
          engine,
          tokensUsed: response.usage?.total_tokens,
        };
      }

      case 'internal':
      default: {
        // Fallback local si pas de clé API ou moteur non supporté
        const simulatedLetter = `
Dear Hiring Manager,

I am writing to express my strong interest in the position. With my background in ${cv.substring(0, 100)}..., I am confident I would be a valuable addition to your team.

The job description mentions ${jobDescription.substring(0, 100)}..., which aligns perfectly with my experience in ${cv.substring(100, 200)}...

I would welcome the opportunity to discuss how my skills and experiences align with your needs. Thank you for your time and consideration.

Sincerely,
[Your Name]
        `;
        
        return {
          success: true,
          data: simulatedLetter.trim(),
          engine: 'internal',
          tokensUsed: 0,
        };
      }
    }
    
  } catch (error) {
    console.error(`AI Service Error (${engine}):`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      engine: engine || DEFAULT_ENGINE,
    };
  }
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
): Promise<AIResponse> => {
  try {
    const settings = await getUserSettings(userId);
    const engine = settings.feature_engines?.matchScore || 'internal';
    const apiKey = settings.api_keys?.[engine] || '';

    console.log(`Calculating match score with ${engine}...`);

    // Construction du prompt pour l'analyse
    const prompt = `
      Analyze the match between the following CV and job description.
      
      CV: ${cv}
      
      Job Description: ${jobDescription}
      
      Return ONLY a JSON object with:
      {
        "score": number between 0-100,
        "explanation": string explaining the score,
        "matchingSkills": string[],
        "missingSkills": string[],
        "suggestions": string[]
      }
    `;

    // Appel au moteur IA approprié
    switch (engine) {
      case 'openai': {
        if (!apiKey) {
          return { success: false, error: 'OpenAI API key missing', engine };
        }
        
        const openai = createOpenAIClient(apiKey);
        const response = await openai.createChatCompletion({
          model: 'gpt-4',
          messages: [
            { role: 'system', content: 'You are a helpful career advisor.' },
            { role: 'user', content: prompt }
          ],
          max_tokens: 500,
          temperature: 0.3,
        });
        
        try {
          const result = JSON.parse(response.data.choices[0].message?.content || '{}');
          return {
            success: true,
            data: result,
            engine,
            tokensUsed: response.data.usage?.total_tokens,
          };
        } catch (parseError) {
          return { success: false, error: 'Invalid JSON response from AI', engine };
        }
      }

      case 'mistral': {
        if (!apiKey) {
          return { success: false, error: 'Mistral API key missing', engine };
        }
        
        const mistral = createMistralClient(apiKey);
        const response = await mistral.completion({
          model: 'mistral-large-latest',
          prompt,
          max_tokens: 500,
          temperature: 0.3,
        });
        
        try {
          const result = JSON.parse(response.choices[0].text || '{}');
          return {
            success: true,
            data: result,
            engine,
            tokensUsed: response.usage?.total_tokens,
          };
        } catch (parseError) {
          return { success: false, error: 'Invalid JSON response from AI', engine };
        }
      }

      case 'internal':
      default: {
        // Analyse locale basique
        const cvSkills = extractSkills(cv);
        const jobSkills = extractSkills(jobDescription);
        const matchingSkills = cvSkills.filter(skill => jobSkills.includes(skill));
        const missingSkills = jobSkills.filter(skill => !cvSkills.includes(skill));
        const score = Math.round((matchingSkills.length / jobSkills.length) * 100) || 0;
        
        return {
          success: true,
          data: {
            score,
            explanation: `Based on skill matching, your CV matches ${score}% of the job requirements.`,
            matchingSkills,
            missingSkills,
            suggestions: missingSkills.map(skill => `Consider highlighting or acquiring ${skill} skill.`)
          },
          engine: 'internal',
          tokensUsed: 0,
        };
      }
    }
    
  } catch (error) {
    console.error(`AI Service Error (${engine}):`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      engine: engine || 'internal',
    };
  }
};

/**
 * Extrait les compétences d'un texte (utilisé pour l'analyse interne).
 * @param text - Le texte à analyser.
 * @returns Tableau de compétences identifiées.
 */
const extractSkills = (text: string): string[] => {
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
};

/**
 * Analyse un CV et retourne des insights structurés.
 * @param cvText - Le texte du CV.
 * @param userId - L'ID de l'utilisateur.
 * @returns Analyse structurée du CV.
 */
export const analyzeCV = async (
  cvText: string,
  userId?: string
): Promise<AIResponse> => {
  try {
    const settings = await getUserSettings(userId);
    const engine = settings.feature_engines?.coverLetter || DEFAULT_ENGINE;
    const apiKey = settings.api_keys?.[engine] || '';

    const prompt = `
      Analyze the following CV and return a JSON object with:
      {
        "skills": string[],
        "strengths": string[],
        "weaknesses": string[],
        "suggestions": string[],
        "summary": string
      }
      
      CV: ${cvText}
    `;

    // Utiliser le même pattern que getMatchScore
    switch (engine) {
      case 'openai': {
        if (!apiKey) {
          return { success: false, error: 'OpenAI API key missing', engine };
        }
        
        const openai = createOpenAIClient(apiKey);
        const response = await openai.createChatCompletion({
          model: 'gpt-4',
          messages: [
            { role: 'system', content: 'You are a professional career coach.' },
            { role: 'user', content: prompt }
          ],
          max_tokens: 800,
          temperature: 0.5,
        });
        
        try {
          const result = JSON.parse(response.data.choices[0].message?.content || '{}');
          return {
            success: true,
            data: result,
            engine,
            tokensUsed: response.data.usage?.total_tokens,
          };
        } catch (parseError) {
          return { success: false, error: 'Invalid JSON response from AI', engine };
        }
      }

      default: {
        // Analyse locale basique
        const skills = extractSkills(cvText);
        const wordCount = cvText.split(/\s+/).length;
        
        return {
          success: true,
          data: {
            skills,
            strengths: [`${skills.length} technical skills identified`, `CV length: ${wordCount} words`],
            weaknesses: wordCount < 300 ? ['CV might be too short'] : [],
            suggestions: wordCount < 300 ? ['Consider expanding your CV with more details'] : [],
            summary: `CV contains ${skills.length} skills and ${wordCount} words.`
          },
          engine: 'internal',
          tokensUsed: 0,
        };
      }
    }
    
  } catch (error) {
    console.error(`AI Service Error:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      engine: 'internal',
    };
  }
};

/**
 * Génère un streaming de lettre de motivation (pour UX interactive).
 * @param cv - Le contenu du CV.
 * @param jobDescription - La description du poste.
 * @param language - La langue.
 * @param tone - Le ton.
 * @param userId - L'ID de l'utilisateur.
 * @returns Un générateur asynchrone de chunks de texte.
 */
export async function* generateCoverLetterStream(
  cv: string,
  jobDescription: string,
  language: string,
  tone: string,
  userId?: string
): AsyncGenerator<string> {
  const settings = await getUserSettings(userId);
  const engine = settings.feature_engines?.coverLetter || DEFAULT_ENGINE;
  const apiKey = settings.api_keys?.[engine] || '';

  const prompt = `
    Generate a professional cover letter in ${language} with a ${tone} tone.
    CV: ${cv}
    Job: ${jobDescription}
  `;

  try {
    switch (engine) {
      case 'openai': {
        if (!apiKey) {
          yield '[ERROR] OpenAI API key missing';
          return;
        }
        
        const openai = createOpenAIClient(apiKey);
        const stream = await openai.createCompletion({
          model: 'gpt-4',
          prompt,
          max_tokens: 1000,
          temperature: 0.7,
          stream: true,
        }, { responseType: 'stream' });
        
        for await (const chunk of stream.data) {
          const text = chunk.choices[0]?.text || '';
          if (text) yield text;
        }
        break;
      }

      case 'gemini': {
        if (!apiKey) {
          yield '[ERROR] Gemini API key missing';
          return;
        }
        
        const gemini = createGeminiClient(apiKey);
        const model = gemini.getGenerativeModel({ model: 'gemini-pro' });
        const result = await model.generateContentStream(prompt);
        
        for await (const chunk of result.stream) {
          const text = await chunk.text();
          if (text) yield text;
        }
        break;
      }

      default: {
        // Streaming simulé pour les autres moteurs
        const simulatedLetter = `
Dear Hiring Manager,

I am writing to express my strong interest in the position. With my background in ${cv.substring(0, 100)}..., I am confident I would be a valuable addition to your team.

The job description mentions ${jobDescription.substring(0, 100)}..., which aligns perfectly with my experience in ${cv.substring(100, 200)}...

I would welcome the opportunity to discuss how my skills and experiences align with your needs. Thank you for your time and consideration.

Sincerely,
[Your Name]
        `;
        
        const chunks = simulatedLetter.split(/(\S+\s+)/);
        for (const chunk of chunks) {
          if (chunk.trim()) {
            yield chunk;
            await new Promise(resolve => setTimeout(resolve, 50));
          }
        }
      }
    }
  } catch (error) {
    yield `[ERROR] ${error instanceof Error ? error.message : 'Unknown error'}`;
  }
}
