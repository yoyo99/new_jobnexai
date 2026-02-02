/**
 * Ollama Service - IA locale pour l'enrichissement des offres d'emploi
 * Hébergé sur VPS Coolify
 */

const OLLAMA_API_URL = process.env.OLLAMA_API_URL || process.env.VITE_OLLAMA_API_URL || '';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || process.env.VITE_OLLAMA_MODEL || 'llama3.1:8b';

export interface JobExtractionResult {
  title: string;
  company: string;
  location: string;
  salary: string | null;
  contract_type: 'CDI' | 'CDD' | 'Freelance' | 'Stage' | 'Alternance' | 'Autre';
  experience_required: 'Junior' | 'Confirmé' | 'Senior' | 'Lead' | 'Non précisé';
  remote_policy: 'Sur site' | 'Hybride' | 'Full remote' | 'Non précisé';
  skills: string[];
  responsibilities: string[];
  benefits: string[];
  raw_description?: string;
}

export interface MatchingResult {
  score: number;
  strengths: string[];
  gaps: string[];
  recommendation: string;
  interview_questions?: string[];
}

export interface DuplicateCheckResult {
  is_duplicate: boolean;
  confidence: number;
  reason: string;
}

export interface OllamaGenerateOptions {
  temperature?: number;
  num_predict?: number;
  top_p?: number;
  top_k?: number;
}

export class OllamaService {
  /**
   * Vérifie si Ollama est configuré
   */
  static isConfigured(): boolean {
    return Boolean(OLLAMA_API_URL);
  }

  /**
   * Vérifie la santé du service Ollama
   */
  static async checkHealth(): Promise<boolean> {
    if (!this.isConfigured()) return false;

    try {
      const response = await fetch(`${OLLAMA_API_URL}/api/tags`);
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Liste les modèles disponibles
   */
  static async listModels(): Promise<string[]> {
    if (!this.isConfigured()) return [];

    try {
      const response = await fetch(`${OLLAMA_API_URL}/api/tags`);
      const data = await response.json();
      return data.models?.map((m: { name: string }) => m.name) || [];
    } catch {
      return [];
    }
  }

  /**
   * Génère une réponse avec Ollama
   */
  private static async generate(
    prompt: string,
    options?: OllamaGenerateOptions
  ): Promise<string> {
    if (!this.isConfigured()) {
      throw new Error('Ollama not configured');
    }

    const response = await fetch(`${OLLAMA_API_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        prompt,
        stream: false,
        options: {
          temperature: options?.temperature ?? 0.1,
          num_predict: options?.num_predict ?? 2000,
          top_p: options?.top_p ?? 0.9,
          top_k: options?.top_k ?? 40
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Ollama error: HTTP ${response.status}`);
    }

    const data = await response.json();
    return data.response || '';
  }

  /**
   * Parse une réponse JSON depuis le texte généré
   */
  private static parseJSON<T>(text: string): T {
    // Chercher le premier bloc JSON valide
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    try {
      return JSON.parse(jsonMatch[0]);
    } catch (e) {
      // Tenter de nettoyer le JSON
      const cleaned = jsonMatch[0]
        .replace(/,\s*}/g, '}')
        .replace(/,\s*]/g, ']')
        .replace(/'/g, '"');
      return JSON.parse(cleaned);
    }
  }

  /**
   * Extrait les données structurées d'une offre d'emploi
   */
  static async extractJobData(jobContent: string): Promise<JobExtractionResult> {
    const prompt = `Tu es un expert en extraction de données d'offres d'emploi.
Extrait les informations suivantes de cette offre d'emploi et retourne UNIQUEMENT un objet JSON valide.

Format attendu:
{
  "title": "Titre exact du poste",
  "company": "Nom de l'entreprise",
  "location": "Ville, Pays",
  "salary": "Salaire si mentionné, sinon null",
  "contract_type": "CDI|CDD|Freelance|Stage|Alternance|Autre",
  "experience_required": "Junior|Confirmé|Senior|Lead|Non précisé",
  "remote_policy": "Sur site|Hybride|Full remote|Non précisé",
  "skills": ["compétence1", "compétence2", "..."],
  "responsibilities": ["responsabilité1", "responsabilité2", "..."],
  "benefits": ["avantage1", "avantage2", "..."]
}

OFFRE D'EMPLOI:
${jobContent.substring(0, 6000)}

Réponds UNIQUEMENT avec le JSON, sans aucun texte avant ou après.`;

    const response = await this.generate(prompt, { temperature: 0.1, num_predict: 1500 });
    const result = this.parseJSON<JobExtractionResult>(response);
    result.raw_description = jobContent.substring(0, 2000);
    return result;
  }

  /**
   * Calcule le score de matching entre un CV et une offre
   */
  static async calculateMatchScore(cvText: string, jobContent: string): Promise<MatchingResult> {
    const prompt = `Tu es un expert RH. Compare ce CV avec cette offre d'emploi et évalue la compatibilité.

CV DU CANDIDAT:
${cvText.substring(0, 3000)}

OFFRE D'EMPLOI:
${jobContent.substring(0, 3000)}

Retourne UNIQUEMENT un objet JSON avec cette structure:
{
  "score": <nombre de 0 à 100>,
  "strengths": ["point fort 1", "point fort 2", "point fort 3"],
  "gaps": ["manque 1", "manque 2"],
  "recommendation": "Recommandation concise sur la candidature",
  "interview_questions": ["question 1 à poser en entretien", "question 2"]
}

JSON:`;

    const response = await this.generate(prompt, { temperature: 0.3, num_predict: 1000 });
    return this.parseJSON<MatchingResult>(response);
  }

  /**
   * Vérifie si deux offres sont des doublons sémantiques
   */
  static async checkDuplicate(job1Content: string, job2Content: string): Promise<DuplicateCheckResult> {
    const prompt = `Compare ces deux offres d'emploi et détermine si elles représentent la même offre publiée sur différents sites.

OFFRE 1:
${job1Content.substring(0, 2000)}

OFFRE 2:
${job2Content.substring(0, 2000)}

Retourne UNIQUEMENT un objet JSON:
{
  "is_duplicate": true ou false,
  "confidence": <nombre de 0 à 1>,
  "reason": "Explication courte de ta décision"
}

JSON:`;

    const response = await this.generate(prompt, { temperature: 0.1, num_predict: 300 });
    return this.parseJSON<DuplicateCheckResult>(response);
  }

  /**
   * Génère un résumé court d'une offre d'emploi
   */
  static async summarizeJob(jobContent: string): Promise<string> {
    const prompt = `Résume cette offre d'emploi en 2-3 phrases concises, en français:

${jobContent.substring(0, 4000)}

Résumé:`;

    return this.generate(prompt, { temperature: 0.5, num_predict: 200 });
  }

  /**
   * Classe une offre par secteur d'activité
   */
  static async classifyJobSector(jobContent: string): Promise<string[]> {
    const prompt = `Classe cette offre d'emploi dans les secteurs appropriés.

OFFRE:
${jobContent.substring(0, 2000)}

Retourne UNIQUEMENT un tableau JSON de secteurs parmi:
["Tech/IT", "Finance", "Santé", "E-commerce", "Industrie", "Consulting", "Marketing", "RH", "Juridique", "Éducation", "Autre"]

JSON:`;

    const response = await this.generate(prompt, { temperature: 0.1, num_predict: 100 });
    const match = response.match(/\[[\s\S]*\]/);
    return match ? JSON.parse(match[0]) : ['Autre'];
  }

  /**
   * Génère des mots-clés pour améliorer la recherche
   */
  static async generateSearchKeywords(query: string): Promise<string[]> {
    const prompt = `Génère une liste de mots-clés de recherche d'emploi similaires ou complémentaires à "${query}".
Inclus des synonymes, des variations, et des termes connexes.

Retourne UNIQUEMENT un tableau JSON de 5-10 mots-clés:

JSON:`;

    const response = await this.generate(prompt, { temperature: 0.7, num_predict: 200 });
    const match = response.match(/\[[\s\S]*\]/);
    return match ? JSON.parse(match[0]) : [query];
  }
}

export default OllamaService;
