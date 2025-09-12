import OpenAI from 'openai';
import { Mistral } from '@mistralai/mistralai';
import { useAuth } from '../stores/auth';

/**
 * Effectue une analyse sémantique d'un texte donné.
 * Cette fonction prend en entrée un texte et retourne une liste de suggestions
 * pour améliorer le texte.
 *
 * @param {_text: string} _text - Le texte à analyser.
 * @returns {string[]} - Une liste de suggestions pour améliorer le texte.
 **/

export function semanticAnalysis(_text: string): string[] {
  // Dans cette première version, nous retournons des suggestions en dur..
  return ["Améliorer la structure de la phrase.", "Ajouter des mots clés pertinents pour le poste.", "Mettre en avant vos expériences les plus significatives."];
}

/**
 * Fonction pour analyser la description d'un poste et extraire des informations pertinentes.
 *
 * @param {_jobDescription: string} _jobDescription - La description du poste.
 * @returns {{ type: string; level: string; skills: string[]; technologies: string[]; }} - Un objet avec le type, le niveau, les compétences et les technologies.
 */

/**
 * Fonction pour analyser la description d'un poste et extraire des informations pertinentes.
 *
 * @param {_jobDescription: string} _jobDescription - La description du poste.
 * @returns {{ type: string; level: string; skills: string[]; technologies: string[]; }} - Un objet avec le type, le niveau, les compétences et les technologies.
 */
 //Fonction pour analyser la description d'un poste
interface JobDescriptionAnalysis {
  type: string;
  level: string;
  skills: string[];
  technologies: string[];
};;

export function analyzeJobDescription(_jobDescription: string): JobDescriptionAnalysis {
  // Stub implementation to satisfy TypeScript
  return { type: 'technical', level: 'junior', skills: [], technologies: [] };
};;

/**
 * Fonction pour générer une question d'entretien en fonction de la description du poste.
 *
 * @param {_jobDescription: string} _jobDescription - La description du poste.
 * @returns {string} - Une question d'entretien.
 */
export function generateInterviewQuestion(_jobDescription: string): string {
  // Stub implementation to satisfy TypeScript
  return 'Pouvez-vous détailler votre expérience pertinente pour ce poste ?';
};;

/**
 * Fonction pour analyser une réponse à une question d'entretien.
 *
 * @param {_answer: string} _answer - La réponse à analyser. 
 * @param {_question: string} _question - La question à laquelle la réponse répond. 
 * @returns {{ feedbacks: string[]; note: number, weakPoints: string[] }} - Une liste de feedbacks et une note, et une liste de points faibles.
 */
export function analyzeAnswer(_answer: string, _question: string): { feedbacks: string[]; note: number, weakPoints: string[] } {
  // Stub implementation to satisfy TypeScript
  return { feedbacks: [], note: 0, weakPoints: [] };
};;

/**
 * Fonction pour donner une note à une réponse.
 *
 * @param {_answer: string} _answer - La réponse à noter.
 * @param {_question: string} _question - La question à laquelle la réponse se rapporte. 
 * @param {_jobDescription: string} _jobDescription - La description du poste.
 * @returns {number} - La note donnée à la réponse.
 */
export function rateAnswer(_answer: string, _question: string, _jobDescription: string): number {
  // Stub implementation to satisfy TypeScript
  return 0;
};;

/**
 * Structure pour stocker les conversations en cours.
 */
interface Conversation {
  conversationId: string;
  jobDescription: string;
  history: any[];
  weakPoints: string[];
}

const conversations: Conversation[] = [];

/**
 * Démarre une nouvelle conversation.
 *
 * @param {string} jobDescription - La description du poste.
 * @returns {string} - L'identifiant de la conversation.
 */
export function startConversation(jobDescription: string): string {
    const conversationId = Math.random().toString(36).substring(2, 9); // Génération d'un ID aléatoire
    const newConversation: Conversation = {
    conversationId,
    jobDescription,
    history: [], 
    weakPoints: []
    };
    conversations.push(newConversation);
    return conversationId;
}

/**
 * Récupère la prochaine question à poser dans une conversation.
 *
 * @param {_conversationId: string} _conversationId - L'identifiant de la conversation.
 * @returns {string} - La prochaine question.
 */
export function getNextQuestion(_conversationId: string): string {
  // Stub implementation to satisfy TypeScript
  return 'Quelle est votre expérience la plus pertinente pour ce poste ?';
}

/**
 * Ajoute une réponse à l'historique d'une conversation et génère des feedbacks.
 *
 * @param {string} conversationId - L'identifiant de la conversation.
 * @param {string} answer - La réponse de l'utilisateur.
 * @returns {string[]} - Les feedbacks générés pour la réponse.
 */
export function addAnswer(conversationId: string, answer: string): string[] {    
    const conversation = conversations.find((c) => c.conversationId === conversationId);
    if (!conversation) {
        throw new Error(`Conversation with ID ${conversationId} not found.`);
    }
    const lastExchange = conversation.history[conversation.history.length - 1];
    if (!lastExchange || !lastExchange.question) return [];
    const jobDescription = conversation.jobDescription;
    const { feedbacks, note, weakPoints } = analyzeAnswer(answer, lastExchange.question,);
    lastExchange.answer = answer;// On ajoute la réponse
    lastExchange.feedbacks = feedbacks;
    lastExchange.note = note;
    // On ajoute les nouveaux points faibles.   
    weakPoints.forEach(weakPoint => {
        if(!conversation.weakPoints.includes(weakPoint)) conversation.weakPoints.push(weakPoint)
    })
    return feedbacks;
}

/**
 * Récupère la moyenne des notes d'une conversation.
 *
 * @param {string} conversationId - L'identifiant de la conversation.
 * @returns {number} - La moyenne des notes.
 */
export function getAverageNote(conversationId: string): number {
    const conversation = conversations.find((c) => c.conversationId === conversationId);
    if (!conversation) {
        throw new Error("Conversation not found");
    }
    if (conversation.history.length === 0) {
        return 0; // Retourne 0 si aucune réponse n'a été donnée
    }
    const totalNotes = conversation.history.reduce(
        (sum: number, exchange: { note?: number }) => sum + (exchange.note || 0),
        0
    );
    return totalNotes / conversation.history.length;
}

/**
 * Fonction pour générer une lettre de motivation personnalisée.
 *
 * @param {any} cv - Le CV de la personne.
 * @param {string} jobDescription - La description du poste.
 * @param {string} language - La langue de la lettre (par défaut : 'fr').
 * @param {string} tone - Le ton de la lettre (par défaut : 'professional').
 * @returns {string} - La lettre de motivation générée.
 */
async function generateCoverLetterWithMistral(
  cv: any,
  jobDescription: string,
  language: string,
  tone: 'professional' | 'conversational' | 'enthusiastic'
): Promise<string> {
  try {
    const response = await fetch('/.netlify/functions/generate-cover-letter', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ cv, jobDescription, language, tone, provider: 'mistral' }),
    });

    if (!response.ok) {
      const errorBody = await response.json();
      throw new Error(errorBody.error || `La requête a échoué avec le statut ${response.status}`);
    }

    const data = await response.json();
    return data.letter;
  } catch (error) {
    console.error('Erreur lors de l\`appel à la fonction de génération de lettre de motivation (Mistral):', error);
    throw error;
  }
}

async function generateCoverLetterWithOpenAI(
  cv: any,
  jobDescription: string,
  language: string,
  tone: 'professional' | 'conversational' | 'enthusiastic'
): Promise<string> {
  try {
    const response = await fetch('/.netlify/functions/generate-cover-letter', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ cv, jobDescription, language, tone, provider: 'openai' }),
    });

    if (!response.ok) {
      const errorBody = await response.json();
      throw new Error(errorBody.error || `La requête a échoué avec le statut ${response.status}`);
    }

    const data = await response.json();
    return data.letter;
  } catch (error) {
    console.error('Erreur lors de l\`appel à la fonction de génération de lettre de motivation:', error);
    throw error;
  }
}



export async function generateCoverLetter(
  cv: any,
  jobDescription: string,
  language: string = 'fr',
  tone: 'professional' | 'conversational' | 'enthusiastic' = 'professional'
): Promise<string> {
  try {
    const { user } = useAuth.getState();
    const provider = user?.ai_provider || 'mistral'; // Mistral par défaut

    if (provider === 'openai') {
      return await generateCoverLetterWithOpenAI(cv, jobDescription, language, tone);
    } else {
      return await generateCoverLetterWithMistral(cv, jobDescription, language, tone);
    }
  } catch (error) {
    console.error(`Erreur lors de la génération de la lettre de motivation avec ${useAuth.getState().user?.ai_provider || 'mistral'}:`, error);
    throw error;
  }
}

export async function optimizeText(
  text: string,
  language: string = 'fr'
): Promise<string> {
  try {
    const response = await fetch('/.netlify/functions/optimize-text', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text, language }),
    });

    if (!response.ok) {
      const errorBody = await response.json();
      throw new Error(errorBody.error || `La requête a échoué avec le statut ${response.status}`);
    }

    const data = await response.json();
    return data.optimizedText;
  } catch (error) {
    console.error('Erreur lors de l\`appel à la fonction d\`optimisation:', error);
    throw error;
  }
}

export async function translateText(
  text: string,
  targetLanguage: string
): Promise<string> {
  try {
    const response = await fetch('/.netlify/functions/translate-text', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text, targetLanguage }),
    });

    if (!response.ok) {
      const errorBody = await response.json();
      throw new Error(errorBody.error || `La requête a échoué avec le statut ${response.status}`);
    }

    const data = await response.json();
    return data.translatedText;
  } catch (error) {
    console.error('Erreur lors de l\`appel à la fonction de traduction:', error);
    throw error;
  }
}

/**
 * Traduit un lot de textes dans une langue cible en utilisant l'IA de Mistral.
 * @param texts - Un tableau de chaînes de caractères à traduire.
 * @param targetLanguage - La langue cible pour la traduction (ex: 'anglais').
 * @returns Une promesse qui se résout avec un tableau de textes traduits.
 */
export async function translateTextsBatch(texts: string[], targetLanguage: string): Promise<string[]> {
  if (!texts || texts.length === 0) {
    return [];
  }

  try {
    const response = await fetch('/.netlify/functions/translate-batch', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ texts, targetLanguage }),
    });

    if (!response.ok) {
      const errorBody = await response.json();
      throw new Error(errorBody.error || `La requête a échoué avec le statut ${response.status}`);
    }

    const translations = await response.json();
    return translations;
  } catch (error) {
    console.error('Erreur lors de l\`appel à la fonction de traduction par lot:', error);
    throw new Error('Impossible de traduire le lot de textes.');
  }
}

export async function generateBulkApplicationMessages(
  cv: any,
  jobDescriptions: { id: string; description: string }[]
): Promise<{ jobId: string; message: string | null }[]> {
  // Stub impl. renvoyant un objet vide pour chaque description
  return jobDescriptions.map(job => ({ jobId: job.id, message: null }));
}

let openai: OpenAI | null = null;
let mistral: Mistral | null = null;

function getMistralClient(): Mistral {
  if (!mistral) {
    const apiKey = import.meta.env.VITE_MISTRAL_API_KEY;
    if (!apiKey) {
      throw new Error('La clé API Mistral (VITE_MISTRAL_API_KEY) n\'est pas configurée dans les variables d\'environnement.');
    }
    mistral = new Mistral({ apiKey });
  }
  return mistral;
}

function getOpenAIClient(): OpenAI {
  if (!openai) {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('La clé API OpenAI (VITE_OPENAI_API_KEY) n\'est pas configurée dans les variables d\'environnement.');
    }
    openai = new OpenAI({
      apiKey: apiKey,
      dangerouslyAllowBrowser: true // AVERTISSEMENT: Pour la production, utilisez une fonction Edge sécurisée.
    });
  }
  return openai;
}