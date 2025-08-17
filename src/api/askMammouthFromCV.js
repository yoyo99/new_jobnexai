// src/api/askMammouthFromCV.js
// But : une fonction spécialisée qui prépare un prompt bien calibré pour analyser un CV vs une offre d’emploi, puis envoie ça à Mammouth.

import { sendPromptToMammouth } from '../lib/mammouthClient.js';

export async function askMammouthFromCV(cvText, jobOfferText, model = 'claude-3-sonnet') {
  const prompt = `
Analyse ce CV et cette offre d'emploi. Donne-moi un score de correspondance (0 à 100) et une justification claire.

CV :
${cvText}

Offre d'emploi :
${jobOfferText}

Fais ça de façon synthétique et précise.
  `;

  try {
    const response = await sendPromptToMammouth({ prompt, model });
    return response;
  } catch (err) {
    console.error('Erreur askMammouthFromCV:', err);
    throw err;
  }
}
