/**
 * @file Mistral AI Service
 * @description Service complet pour l'intégration de Mistral AI dans JobNexAI.
 * Gère la génération de lettres de motivation, l'analyse de CV et d'autres tâches IA.
 */

import type { Job, Profile } from "../types";
import { MistralClient } from '@mistralai/mistralai';
import { getUserAISettings } from '../lib/supabase';

/**
 * Interface pour les paramètres de génération
 */
export interface CoverLetterGenerationParams {
    profile: Profile;
    job: Job;
    lang: string;
    t: (key: string) => string;
    userId?: string;
    tone?: 'professional' | 'creative' | 'casual' | 'enthusiastic';
    length?: 'short' | 'medium' | 'long';
}

/**
 * Résultat de la génération de lettre de motivation
 */
export interface CoverLetterGenerationResult {
    success: boolean;
    content?: string;
    error?: string;
    engine: string;
    tokensUsed?: number;
    model?: string;
}

/**
 * Génère une lettre de motivation en streaming avec Mistral AI
 * @param params - Paramètres de génération
 * @returns Générateur asynchrone de chunks de texte
 */
export async function* generateCoverLetterStream(
    params: CoverLetterGenerationParams
): AsyncGenerator<string> {
    const {
        profile,
        job,
        lang,
        t,
        userId,
        tone = 'professional',
        length = 'medium'
    } = params;

    try {
        // Récupérer les paramètres utilisateur pour Mistral
        const settings = userId ? await getUserAISettings(userId) : null;
        const apiKey = settings?.api_keys?.mistral || process.env.NEXT_PUBLIC_MISTRAL_API_KEY;

        if (!apiKey) {
            console.warn('Mistral API key not found, falling back to simulation');
            yield* simulateCoverLetterStream(profile, job, lang, t, tone, length);
            return;
        }

        // Créer le client Mistral
        const mistral = new MistralClient(apiKey);

        // Construire le prompt optimisé pour Mistral
        const prompt = buildCoverLetterPrompt(profile, job, lang, t, tone, length);

        console.log('Generating cover letter with Mistral AI...');
        console.log('Prompt length:', prompt.length, 'characters');

        // Appeler l'API Mistral avec streaming
        const stream = await mistral.completionStream({
            model: 'mistral-large-latest',
            prompt,
            max_tokens: getTokenLimit(length),
            temperature: getTemperature(tone),
            stream: true,
        });

        // Traiter le stream
        for await (const chunk of stream) {
            if (chunk.choices && chunk.choices[0]?.text) {
                yield chunk.choices[0].text;
            }
        }

    } catch (error) {
        console.error('Mistral AI Error:', error);
        
        // Fallback vers la simulation en cas d'erreur
        const errorMessage = error instanceof Error ? error.message : 'Unknown Mistral AI error';
        yield `[ERROR: ${errorMessage}]`;
        yield '\n\nFalling back to simulated generation...\n\n';
        
        yield* simulateCoverLetterStream(profile, job, lang, t, tone, length);
    }
}

/**
 * Génère une lettre de motivation complète avec Mistral AI
 * @param params - Paramètres de génération
 * @returns Résultat complet
 */
export async function generateCoverLetter(
    params: CoverLetterGenerationParams
): Promise<CoverLetterGenerationResult> {
    const {
        profile,
        job,
        lang,
        t,
        userId,
        tone = 'professional',
        length = 'medium'
    } = params;

    try {
        // Récupérer les paramètres utilisateur
        const settings = userId ? await getUserAISettings(userId) : null;
        const apiKey = settings?.api_keys?.mistral || process.env.NEXT_PUBLIC_MISTRAL_API_KEY;

        if (!apiKey) {
            return {
                success: false,
                error: 'Mistral API key not configured',
                engine: 'mistral'
            };
        }

        // Créer le client Mistral
        const mistral = new MistralClient(apiKey);

        // Construire le prompt
        const prompt = buildCoverLetterPrompt(profile, job, lang, t, tone, length);

        console.log('Generating cover letter with Mistral AI...');

        // Appeler l'API Mistral
        const response = await mistral.completion({
            model: 'mistral-large-latest',
            prompt,
            max_tokens: getTokenLimit(length),
            temperature: getTemperature(tone),
        });

        if (!response.choices || !response.choices[0]?.text) {
            throw new Error('No response from Mistral AI');
        }

        const content = response.choices[0].text.trim();

        return {
            success: true,
            content,
            engine: 'mistral',
            tokensUsed: response.usage?.total_tokens,
            model: response.model
        };

    } catch (error) {
        console.error('Mistral AI Generation Error:', error);
        
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            engine: 'mistral'
        };
    }
}

/**
 * Construit un prompt optimisé pour Mistral AI
 */
function buildCoverLetterPrompt(
    profile: Profile,
    job: Job,
    lang: string,
    t: (key: string) => string,
    tone: string,
    length: string
): string {
    // Traduire les instructions selon la langue
    const instructions = {
        'fr': {
            professional: 'Rédigez une lettre de motivation professionnelle et formelle',
            creative: 'Rédigez une lettre de motivation créative et originale',
            casual: 'Rédigez une lettre de motivation décontractée mais professionnelle',
            enthusiastic: 'Rédigez une lettre de motivation enthousiaste et motivée',
            short: 'en 150-200 mots',
            medium: 'en 250-350 mots',
            long: 'en 400-500 mots'
        },
        'en': {
            professional: 'Write a professional and formal cover letter',
            creative: 'Write a creative and original cover letter',
            casual: 'Write a casual yet professional cover letter',
            enthusiastic: 'Write an enthusiastic and motivated cover letter',
            short: 'in 150-200 words',
            medium: 'in 250-350 words',
            long: 'in 400-500 words'
        }
    };

    const instruction = instructions[lang as keyof typeof instructions] || instructions['en'];

    // Construire le prompt
    return `
${instruction[tone as keyof typeof instruction]} ${instruction[length as keyof typeof instruction]} 
for the position of "${job.title}" at "${job.company}".

About the candidate:
- Name: ${profile.first_name} ${profile.last_name}
- Current position: ${profile.current_position || 'Not specified'}
- Years of experience: ${profile.years_of_experience || 'Not specified'}
- Key skills: ${profile.skills?.join(', ') || 'Not specified'}
- Education: ${profile.education || 'Not specified'}
- Location: ${profile.location || 'Not specified'}

About the job:
- Title: ${job.title}
- Company: ${job.company}
- Location: ${job.location || 'Not specified'}
- Description: ${job.description?.substring(0, 500) || 'No description provided'}

Requirements:
${job.requirements?.substring(0, 300) || 'No specific requirements mentioned'}

The letter should:
1. Address the hiring manager professionally
2. Highlight relevant skills and experiences
3. Show enthusiasm for the position and company
4. Explain why the candidate is a good fit
5. Be concise and well-structured
6. Use ${lang === 'fr' ? 'French' : 'English'} language

Format the letter properly with:
- Date
- Hiring manager address (use "Dear Hiring Manager," if name unknown)
- Introduction paragraph
- 2-3 body paragraphs
- Closing paragraph
- Professional signature

Do not include any placeholder text or notes in the final letter.
`.trim();
}

/**
 * Simule un streaming de lettre de motivation (fallback)
 */
async function* simulateCoverLetterStream(
    profile: Profile,
    job: Job,
    lang: string,
    t: (key: string) => string,
    tone: string,
    length: string
): AsyncGenerator<string> {
    // Traductions pour la simulation
    const translations = {
        'fr': {
            greeting: 'Cher Responsable du Recrutement,\n\n',
            intro: `Je vous écris pour exprimer mon vif intérêt pour le poste de ${job.title} chez ${job.company}. `,
            body1: `Avec mon expérience en ${profile.skills?.slice(0, 3).join(', ') || 'mon domaine'}, je suis convaincu que je pourrais apporter une valeur ajoutée significative à votre équipe. `,
            body2: `Votre offre mentionne que vous recherchez ${job.requirements?.substring(0, 100) || 'un profil qualifié'}... `,
            closing: `Je serais ravi de discuter de la manière dont mes compétences correspondent à vos besoins. Merci pour votre temps et votre considération.\n\n`,
            signature: 'Cordialement,'
        },
        'en': {
            greeting: 'Dear Hiring Manager,\n\n',
            intro: `I am writing to express my strong interest in the ${job.title} position at ${job.company}. `,
            body1: `With my experience in ${profile.skills?.slice(0, 3).join(', ') || 'my field'}, I am confident I would be a valuable addition to your team. `,
            body2: `Your job posting indicates you are looking for ${job.requirements?.substring(0, 100) || 'a qualified candidate'}... `,
            closing: `I look forward to discussing how my skills and experience align with your needs. Thank you for your time and consideration.\n\n`,
            signature: 'Best regards,'
        }
    };

    const trans = translations[lang as keyof typeof translations] || translations['en'];

    // Générer les chunks avec un délai réaliste
    const chunks = [
        trans.greeting,
        trans.intro,
        trans.body1,
        trans.body2,
        trans.closing,
        trans.signature,
        `\n${profile.first_name} ${profile.last_name}`
    ];

    for (const chunk of chunks) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        yield chunk;
    }
}

/**
 * Détermine la limite de tokens selon la longueur souhaitée
 */
function getTokenLimit(length: string): number {
    const limits = {
        short: 300,
        medium: 800,
        long: 1500
    };
    return limits[length as keyof typeof limits] || 800;
}

/**
 * Détermine la température selon le ton souhaité
 */
function getTemperature(tone: string): number {
    const temps = {
        professional: 0.5,
        creative: 0.9,
        casual: 0.7,
        enthusiastic: 0.8
    };
    return temps[tone as keyof typeof temps] || 0.7;
}

/**
 * Analyse un CV avec Mistral AI
 */
export async function analyzeCVWithMistral(
    cvText: string,
    userId?: string
): Promise<{
    success: boolean;
    analysis?: {
        skills: string[];
        strengths: string[];
        weaknesses: string[];
        suggestions: string[];
        summary: string;
    };
    error?: string;
    engine: string;
}> {
    try {
        // Récupérer les paramètres utilisateur
        const settings = userId ? await getUserAISettings(userId) : null;
        const apiKey = settings?.api_keys?.mistral || process.env.NEXT_PUBLIC_MISTRAL_API_KEY;

        if (!apiKey) {
            return {
                success: false,
                error: 'Mistral API key not configured',
                engine: 'mistral'
            };
        }

        const mistral = new MistralClient(apiKey);

        const prompt = `
Analyze the following CV and return a JSON object with:
{
  "skills": string[],
  "strengths": string[],
  "weaknesses": string[],
  "suggestions": string[],
  "summary": string
}

CV: ${cvText.substring(0, 2000)}
`.trim();

        const response = await mistral.completion({
            model: 'mistral-large-latest',
            prompt,
            max_tokens: 500,
            temperature: 0.3,
        });

        if (!response.choices || !response.choices[0]?.text) {
            throw new Error('No response from Mistral AI');
        }

        try {
            const analysis = JSON.parse(response.choices[0].text.trim());
            return {
                success: true,
                analysis,
                engine: 'mistral'
            };
        } catch (parseError) {
            // Si le parsing JSON échoue, retourner une analyse basique
            const skills = extractSkillsFromText(cvText);
            const wordCount = cvText.split(/\s+/).length;

            return {
                success: true,
                analysis: {
                    skills,
                    strengths: [`${skills.length} skills identified`, `${wordCount} words`],
                    weaknesses: wordCount < 300 ? ['CV might be too short'] : [],
                    suggestions: wordCount < 300 ? ['Consider expanding your CV'] : [],
                    summary: `CV contains ${skills.length} skills and ${wordCount} words.`
                },
                engine: 'mistral'
            };
        }

    } catch (error) {
        console.error('Mistral CV Analysis Error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            engine: 'mistral'
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
 * Génère un score de matching entre un CV et une offre avec Mistral AI
 */
export async function generateMatchScoreWithMistral(
    cvText: string,
    jobDescription: string,
    userId?: string
): Promise<{
    success: boolean;
    score?: number;
    explanation?: string;
    matchingSkills?: string[];
    missingSkills?: string[];
    suggestions?: string[];
    error?: string;
    engine: string;
}> {
    try {
        // Récupérer les paramètres utilisateur
        const settings = userId ? await getUserAISettings(userId) : null;
        const apiKey = settings?.api_keys?.mistral || process.env.NEXT_PUBLIC_MISTRAL_API_KEY;

        if (!apiKey) {
            return {
                success: false,
                error: 'Mistral API key not configured',
                engine: 'mistral'
            };
        }

        const mistral = new MistralClient(apiKey);

        const prompt = `
Analyze the match between the following CV and job description.
Return a JSON object with:
{
  "score": number between 0-100,
  "explanation": string,
  "matchingSkills": string[],
  "missingSkills": string[],
  "suggestions": string[]
}

CV: ${cvText.substring(0, 1500)}

Job Description: ${jobDescription.substring(0, 1500)}
`.trim();

        const response = await mistral.completion({
            model: 'mistral-large-latest',
            prompt,
            max_tokens: 500,
            temperature: 0.3,
        });

        if (!response.choices || !response.choices[0]?.text) {
            throw new Error('No response from Mistral AI');
        }

        try {
            const result = JSON.parse(response.choices[0].text.trim());
            return {
                success: true,
                ...result,
                engine: 'mistral'
            };
        } catch (parseError) {
            // Fallback vers une analyse basique
            const cvSkills = extractSkillsFromText(cvText);
            const jobSkills = extractSkillsFromText(jobDescription);
            const matchingSkills = cvSkills.filter(skill => jobSkills.includes(skill));
            const missingSkills = jobSkills.filter(skill => !cvSkills.includes(skill));
            const score = Math.round((matchingSkills.length / jobSkills.length) * 100) || 0;

            return {
                success: true,
                score,
                explanation: `Based on skill matching, your CV matches ${score}% of the job requirements.`,
                matchingSkills,
                missingSkills,
                suggestions: missingSkills.map(skill => `Consider highlighting or acquiring ${skill} skill.`),
                engine: 'mistral'
            };
        }

    } catch (error) {
        console.error('Mistral Match Score Error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            engine: 'mistral'
        };
    }
}