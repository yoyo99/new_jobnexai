// Fonction client utilisée par la fonction Netlify
import fetch from 'node-fetch';

const MAMMOUTH_API_KEY = process.env.MAMMOUTH_API_KEY;

// 💡 Fonction pour sélectionner automatiquement un modèle en fonction du prompt
function autoSelectModel(prompt) {
  const lowerPrompt = prompt.toLowerCase();

  if (lowerPrompt.includes('résume') || lowerPrompt.includes('résumé') || lowerPrompt.includes('résumer')) {
    return 'claude-3-5-sonnet-20241022'; // rapide et économique
  }

  if (lowerPrompt.includes('code') || lowerPrompt.includes('javascript') || lowerPrompt.includes('react')) {
    return 'gpt-4o'; // très bon en code
  }

  if (lowerPrompt.includes('philosophie') || lowerPrompt.includes('analyse profonde') || lowerPrompt.length > 1000) {
    return 'claude-3-5-sonnet-20241022'; // pour les prompts longs, profonds, argumentés
  }

  return 'claude-3-5-sonnet-20241022'; // fallback par défaut
}

// 🦣 Fonction pour envoyer le prompt à Mammouth.ai
export async function sendPromptToMammouth({ prompt, model = null }) {
  // 👇 Ici la ligne que tu dois ajouter
  const modelToUse = model || autoSelectModel(prompt);

  const response = await fetch('https://api.mammouth.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${MAMMOUTH_API_KEY}`,
    },
    body: JSON.stringify({
      model: modelToUse,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    throw new Error(`Erreur Mammouth: ${response.statusText}`);
  }

  const result = await response.json();
  return result.choices?.[0]?.message?.content || 'Aucune réponse reçue.';
  }
