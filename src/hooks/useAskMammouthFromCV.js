// src/hooks/useAskMammouthFromCV.js

import { useState } from 'react';

export default function useAskMammouthFromCV() {
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(null);
  const [error, setError] = useState(null);

  // Fonction pour appeler l'API backend
  const askFromCV = async (cvText, jobOfferText, options = {}, model = 'claude-3-sonnet') => {
    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      const res = await fetch('/.netlify/functions/askMammouthFromCV', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cvText, jobOfferText, options, model }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Erreur inconnue');

      setResponse(data.response);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return { askFromCV, response, loading, error };
}
