// À placer dans : src/components/MammouthTester.js
// Composant React d’exemple pour tester ton hook

import { useState } from "react";
import { useMammouth } from "../hooks/useMammouth";

export default function MammouthTester() {
  const [input, setInput] = useState("");
  const { sendPrompt, loading, response, error } = useMammouth();

  const handleSubmit = (e) => {
    e.preventDefault();
    sendPrompt({
      prompt: input,
      model: input.includes("résume") ? "claude-3-sonnet" : "gpt-4o",
    });
  };

  return (
    <div className="p-4 max-w-md mx-auto">
      <form onSubmit={handleSubmit}>
        <textarea
          className="w-full border p-2 rounded"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Écris ton prompt ici..."
        />
        <button
          className="mt-2 px-4 py-2 bg-blue-600 text-white rounded"
          type="submit"
          disabled={loading}
        >
          Envoyer à Mammouth
        </button>
      </form>

      {loading && <p className="text-gray-500">Chargement...</p>}
      {response && <p className="mt-4 p-2 bg-green-100 rounded">{response}</p>}
      {error && <p className="mt-4 text-red-600">Erreur : {error}</p>}
    </div>
  );
}
