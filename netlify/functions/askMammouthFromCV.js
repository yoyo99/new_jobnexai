// netlify/functions/askMammouthFromCV.js

import { buildMatchJobPrompt } from '../../src/lib/matchJobPromptBuilder.js';
import { sendPromptToMammouth } from '../../src/lib/mammouthClient.js';

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  try {
    const { cvText, jobOfferText, options, model } = JSON.parse(event.body);

    const prompt = buildMatchJobPrompt(cvText, jobOfferText, options);
    const response = await sendPromptToMammouth({ prompt, model });

    return {
      statusCode: 200,
      body: JSON.stringify({ response }),
    };
  } catch (error) {
    console.error('Erreur askMammouthFromCV:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message || 'Erreur serveur' }),
    };
  }
};
