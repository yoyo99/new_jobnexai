/**
 * @file Centralized AI Service (Frontend)
 * @description Calls Netlify Functions which handle AI SDK interactions server-side.
 * This keeps API keys secure and SDKs out of the client bundle.
 */

import { getUserAISettings as fetchUserSettings, UserAISettingsData } from '../lib/supabase';

export type SupportedAI = 'openai' | 'mistral' | 'gemini' | 'claude' | 'cohere' | 'huggingface' | 'internal';

export interface AIResponse {
  success: boolean;
  data?: any;
  error?: string;
  engine: SupportedAI;
  tokensUsed?: number;
}

const DEFAULT_ENGINE: SupportedAI = 'openai';

const getUserSettings = async (userId?: string): Promise<UserAISettingsData> => {
  if (!userId) {
    return {
      preferred_engine: DEFAULT_ENGINE,
      api_keys: {},
      feature_engines: {},
    } as UserAISettingsData;
  }
  try {
    const settings = await fetchUserSettings(userId);
    return settings || {
      preferred_engine: DEFAULT_ENGINE,
      api_keys: {},
      feature_engines: {},
    } as UserAISettingsData;
  } catch (error) {
    console.warn('Failed to fetch user AI settings:', error);
    return {
      preferred_engine: DEFAULT_ENGINE,
      api_keys: {},
      feature_engines: {},
    } as UserAISettingsData;
  }
};

async function callAIFunction(
  functionName: string,
  payload: Record<string, unknown>
): Promise<AIResponse> {
  try {
    const response = await fetch(`/.netlify/functions/${functionName}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      return {
        success: false,
        error: `Server error ${response.status}: ${errorBody}`,
        engine: (payload.engine as SupportedAI) || DEFAULT_ENGINE,
      };
    }

    return await response.json();
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error',
      engine: (payload.engine as SupportedAI) || DEFAULT_ENGINE,
    };
  }
}

const extractSkills = (text: string): string[] => {
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

export const generateCoverLetter = async (
  cv: string,
  jobDescription: string,
  language: string,
  tone: string,
  userId?: string
): Promise<AIResponse> => {
  const settings = await getUserSettings(userId);
  const engine = settings.feature_engines?.coverLetter || DEFAULT_ENGINE;
  const apiKey = settings.api_keys?.[engine] || '';

  if (engine === 'internal' || !apiKey) {
    const simulatedLetter = `
Dear Hiring Manager,

I am writing to express my strong interest in the position. With my background in ${cv.substring(0, 100)}..., I am confident I would be a valuable addition to your team.

The job description mentions ${jobDescription.substring(0, 100)}..., which aligns perfectly with my experience.

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

  return callAIFunction('ai-generate', {
    action: 'cover-letter',
    engine,
    apiKey,
    params: { cv, jobDescription, language, tone },
  });
};

export const getMatchScore = async (
  cv: string,
  jobDescription: string,
  userId?: string
): Promise<AIResponse> => {
  const settings = await getUserSettings(userId);
  const engine = settings.feature_engines?.matchScore || 'internal';
  const apiKey = settings.api_keys?.[engine] || '';

  if (engine === 'internal' || !apiKey) {
    const cvSkills = extractSkills(cv);
    const jobSkills = extractSkills(jobDescription);
    const matchingSkills = cvSkills.filter(s => jobSkills.includes(s));
    const missingSkills = jobSkills.filter(s => !cvSkills.includes(s));
    const score = jobSkills.length > 0
      ? Math.round((matchingSkills.length / jobSkills.length) * 100)
      : 50;

    return {
      success: true,
      data: {
        score,
        explanation: `Match based on ${matchingSkills.length}/${jobSkills.length} skills found.`,
        matchingSkills,
        missingSkills,
        suggestions: missingSkills.length > 0
          ? [`Consider developing skills in: ${missingSkills.join(', ')}`]
          : ['Great match!'],
      },
      engine: 'internal',
      tokensUsed: 0,
    };
  }

  return callAIFunction('ai-generate', {
    action: 'match-score',
    engine,
    apiKey,
    params: { cv, jobDescription },
  });
};

export const analyzeCV = async (
  cvText: string,
  userId?: string
): Promise<AIResponse> => {
  const settings = await getUserSettings(userId);
  const engine = settings.feature_engines?.coverLetter || DEFAULT_ENGINE;
  const apiKey = settings.api_keys?.[engine] || '';

  if (engine === 'internal' || !apiKey) {
    const skills = extractSkills(cvText);
    const wordCount = cvText.split(/\s+/).length;
    return {
      success: true,
      data: {
        skills,
        strengths: [`${skills.length} technical skills identified`, `CV length: ${wordCount} words`],
        weaknesses: wordCount < 300 ? ['CV might be too short'] : [],
        suggestions: wordCount < 300 ? ['Consider expanding your CV with more details'] : [],
        summary: `CV contains ${skills.length} skills and ${wordCount} words.`,
      },
      engine: 'internal',
      tokensUsed: 0,
    };
  }

  return callAIFunction('ai-generate', {
    action: 'analyze-cv',
    engine,
    apiKey,
    params: { cvText },
  });
};

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

  if (engine === 'internal' || !apiKey) {
    const simulatedLetter = `
Dear Hiring Manager,

I am writing to express my strong interest in the position. With my background in ${cv.substring(0, 100)}..., I am confident I would be a valuable addition to your team.

The job description mentions ${jobDescription.substring(0, 100)}..., which aligns perfectly with my experience.

I would welcome the opportunity to discuss how my skills and experiences align with your needs.

Sincerely,
[Your Name]
    `;
    const chunks = simulatedLetter.trim().split(/(\S+\s+)/);
    for (const chunk of chunks) {
      if (chunk.trim()) {
        yield chunk;
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }
    return;
  }

  try {
    const response = await fetch('/.netlify/functions/ai-stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'cover-letter',
        engine,
        apiKey,
        params: { cv, jobDescription, language, tone },
      }),
    });

    if (!response.ok || !response.body) {
      yield `[ERROR] Server error ${response.status}`;
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const text = decoder.decode(value, { stream: true });
      if (text) yield text;
    }
  } catch (error) {
    yield `[ERROR] ${error instanceof Error ? error.message : 'Unknown error'}`;
  }
}
