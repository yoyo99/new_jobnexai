// À placer dans : netlify/functions/sendPromptToMammouth.js
// Fonction serverless Netlify côté backend

const axios = require("axios");

exports.handler = async (event) => {
  const { prompt, model = "gpt-4o" } = JSON.parse(event.body);

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${process.env.MAMMOUTH_API_KEY}`,
  };

  const body = {
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
    model, // ex: "claude-3-sonnet" | "mistral-7b" | "gpt-4o"
  };

  try {
    const res = await axios.post("https://api.mammouth.ai/v1/chat/completions", body, { headers });
    const responseContent = res.data.choices?.[0]?.message?.content || "Aucune réponse";

    return {
      statusCode: 200,
      body: JSON.stringify({ response: responseContent }),
    };
  } catch (error) {
    console.error("Erreur Mammouth:", error?.response?.data || error.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Erreur avec Mammouth" }),
    };
  }
};
