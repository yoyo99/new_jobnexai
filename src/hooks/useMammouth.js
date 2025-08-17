// À placer dans : src/hooks/useMammouth.js
// Hook React pour interagir avec ta fonction serverless

import { useState } from "react";

export const useMammouth = () => {
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(null);
  const [error, setError] = useState(null);

  const sendPrompt = async ({ prompt, model = "gpt-4o" }) => {
    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      const res = await fetch("/.netlify/functions/sendPromptToMammouth", {
        method: "POST",
        body: JSON.stringify({ prompt, model }),
      });

      const data = await res.json();
      if (res.ok) {
        setResponse(data.response);
      } else {
        throw new Error(data.error || "Erreur inconnue");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return { sendPrompt, loading, response, error };
};
