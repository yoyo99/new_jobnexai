// src/lib/matchJobPromptBuilder.js
// But : construire dynamiquement le prompt à envoyer selon différents critères, options, ou préférences utilisateurs.

/**
 * Construit un prompt pour le matching CV vs Offre d'emploi
 * @param {string} cvText
 * @param {string} jobOfferText
 * @param {Object} options - options de personnalisation
 * @returns {string} prompt formaté
 */
export function buildMatchJobPrompt(cvText, jobOfferText, options = {}) {
  const {
    scoreRange = '0-100',
    includeJustification = true,
    tone = 'synthétique et précis',
    extraInstructions = '',
  } = options;

  let prompt = `Analyse ce CV et cette offre d'emploi. Donne un score de correspondance (${scoreRange})`;

  if (includeJustification) prompt += ' avec une justification claire.';
  prompt += `\n\nCV :\n${cvText}\n\nOffre d'emploi :\n${jobOfferText}\n\n`;

  prompt += `Fais ça de façon ${tone}.`;

  if (extraInstructions) {
    prompt += `\n\nNote : ${extraInstructions}`;
  }

  return prompt;
}
