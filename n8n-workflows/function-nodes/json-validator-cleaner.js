/**
 * N8N FUNCTION NODE - JSON VALIDATOR & CLEANER
 * 
 * Nettoie et valide les réponses JSON des APIs IA (Mammouth.ai, OpenAI, etc.)
 * Gère les erreurs avec fallback intelligent
 * 
 * Usage dans N8N :
 * 1. Ajouter un Function Node après l'appel IA
 * 2. Copier ce code dans le node
 * 3. Adapter requiredFields et defaultStructure selon vos besoins
 * 
 * Inspiré du workflow Telegram-TikTok Viral Analyzer
 * Adapté pour JobNexAI - Enrichissement d'offres d'emploi
 */

// ============================================
// CONFIGURATION (À ADAPTER SELON VOS BESOINS)
// ============================================

// Champs obligatoires pour une offre d'emploi enrichie
const requiredFields = [
  'title',
  'company',
  'location',
  'skills',
  'experience_level',
  'remote_type'
];

// Structure par défaut en cas d'erreur
const defaultJobStructure = {
  title: null,
  company: null,
  location: null,
  skills: [],
  experience_level: 'non_specifie',
  salary_estimate: null,
  remote_type: 'non_specifie',
  technologies: [],
  description_enriched: null,
  error: true,
  error_message: 'Enrichissement IA échoué - données minimales conservées'
};

// ============================================
// FONCTION PRINCIPALE
// ============================================

/**
 * Nettoie et valide une réponse JSON d'une API IA
 * @param {string|object} aiResponse - Réponse brute de l'IA
 * @param {Array<string>} requiredFields - Champs obligatoires
 * @param {object} defaultStructure - Structure par défaut en cas d'erreur
 * @returns {object} - Objet validé ou structure par défaut
 */
function validateAndCleanJSON(aiResponse, requiredFields, defaultStructure) {
  try {
    let parsedResponse;
    let cleanResponse;

    // Cas 1 : La réponse est déjà un objet
    if (typeof aiResponse === 'object' && aiResponse !== null) {
      parsedResponse = aiResponse;
      cleanResponse = JSON.stringify(aiResponse, null, 2);
    } 
    // Cas 2 : La réponse est une chaîne de caractères
    else if (typeof aiResponse === 'string') {
      // Nettoyage des balises markdown et caractères d'échappement
      cleanResponse = aiResponse
        .replace(/^```json\s*/i, '')      // Enlève ```json au début
        .replace(/^```\s*/i, '')          // Enlève ``` au début
        .replace(/\s*```$/i, '')          // Enlève ``` à la fin
        .replace(/\\n/g, '')              // Enlève les \n
        .replace(/\\"/g, '"')             // Remplace \" par "
        .replace(/\\'/g, "'")             // Remplace \' par '
        .trim();

      // Tentative de parsing
      parsedResponse = JSON.parse(cleanResponse);
    } 
    // Cas 3 : Type inattendu
    else {
      throw new Error(`Type de réponse inattendu: ${typeof aiResponse}`);
    }

    // Validation des champs obligatoires
    const missingFields = requiredFields.filter(field => {
      return !parsedResponse.hasOwnProperty(field) || 
             parsedResponse[field] === null || 
             parsedResponse[field] === undefined;
    });

    if (missingFields.length > 0) {
      throw new Error(`Champs manquants: ${missingFields.join(', ')}`);
    }

    // Validation des types de données
    if (Array.isArray(requiredFields) && requiredFields.includes('skills')) {
      if (!Array.isArray(parsedResponse.skills)) {
        throw new Error('Le champ "skills" doit être un tableau');
      }
    }

    // Succès : retourne les données validées
    return {
      json: {
        ...parsedResponse,
        validated: true,
        validation_timestamp: new Date().toISOString(),
        raw_response: cleanResponse
      }
    };

  } catch (error) {
    // Échec : retourne la structure par défaut avec détails de l'erreur
    console.error('❌ Erreur validation JSON:', error.message);
    console.error('Réponse brute:', aiResponse);

    return {
      json: {
        ...defaultStructure,
        validation_error: error.message,
        validation_timestamp: new Date().toISOString(),
        raw_response: typeof aiResponse === 'string' ? aiResponse : JSON.stringify(aiResponse)
      }
    };
  }
}

// ============================================
// EXÉCUTION DANS N8N
// ============================================

// Récupération de la réponse IA depuis le node précédent
const aiResponse = $input.item.json.output || $input.item.json;

// Validation et nettoyage
const result = validateAndCleanJSON(aiResponse, requiredFields, defaultJobStructure);

// Retour du résultat pour le prochain node
return result;
