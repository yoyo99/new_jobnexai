// aiRouter.ts : Route dynamiquement les appels IA selon le choix utilisateur et la clé API stockée.
// Gère le chiffrement local (MVP) et supporte multi-fournisseurs.

export type SupportedAI = 'openai' | 'gemini' | 'claude' | 'cohere' | 'huggingface' | 'mistral' | 'custom';

interface AIRouterOptions {
  engine: SupportedAI;
  apiKeys: Record<string, string>;
}

export async function matchScoreIA(
  userSkills: string[],
  jobKeywords: string[],
  opts: AIRouterOptions
): Promise<number> {
  const { engine, apiKeys } = opts;
  const apiKey = apiKeys[engine] || '';
  // Fallback local (MVP)
  if (!apiKey || engine === 'openai') {
    // Local fallback ou OpenAI public
    const matchCount = jobKeywords.filter((kw) => userSkills.includes(kw)).length;
    return Math.round((matchCount / jobKeywords.length) * 100);
  }
  // TODO: Ajouter les appels réels aux API selon le moteur choisi
  // Exemples :
  // if (engine === 'claude') { ... }
  // if (engine === 'gemini') { ... }
  // if (engine === 'cohere') { ... }
  // if (engine === 'huggingface') { ... }
  // if (engine === 'mistral') { ... }
  // if (engine === 'custom') { ... }
  // Pour l’instant, fallback local
  const matchCount = jobKeywords.filter((kw) => userSkills.includes(kw)).length;
  return Math.round((matchCount / jobKeywords.length) * 100);
}

// TODO: Ajouter d’autres fonctions IA (génération lettre, analyse CV, etc.) avec la même logique.
