import type { Handler } from '@netlify/functions';

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  try {
    const { action, engine, apiKey, params } = JSON.parse(event.body || '{}');
    const { cv, jobDescription, language, tone } = params || {};

    if (!apiKey) {
      return { statusCode: 400, body: `${engine} API key missing` };
    }

    const prompt = `Generate a professional cover letter in ${language} with a ${tone} tone.\nCV: ${cv}\nJob: ${jobDescription}`;
    let fullText = '';

    switch (engine) {
      case 'openai': {
        const OpenAI = (await import('openai')).default;
        const client = new OpenAI({ apiKey });
        const stream = await client.chat.completions.create({
          model: 'gpt-4',
          messages: [
            { role: 'system', content: 'You are an expert career advisor.' },
            { role: 'user', content: prompt },
          ],
          max_tokens: 1000,
          temperature: 0.7,
          stream: true,
        });

        for await (const chunk of stream) {
          const text = chunk.choices[0]?.delta?.content || '';
          fullText += text;
        }
        break;
      }

      case 'gemini': {
        const { GoogleGenerativeAI } = await import('@google/generative-ai');
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
        const result = await model.generateContentStream(prompt);

        for await (const chunk of result.stream) {
          fullText += chunk.text();
        }
        break;
      }

      default: {
        // Non-streaming — on génère tout d'un coup
        fullText = `Dear Hiring Manager,\n\nI am writing to express my strong interest in the position described. Based on my experience, I believe I would be a valuable addition to your team.\n\nSincerely,\n[Your Name]`;
      }
    }

    // Note: Netlify Functions (non-streaming) renvoient le texte complet.
    // Pour du vrai streaming, il faudrait Netlify Edge Functions.
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'text/plain' },
      body: fullText,
    };
  } catch (error) {
    console.error('AI Stream Error:', error);
    return {
      statusCode: 500,
      body: error instanceof Error ? error.message : 'Internal server error',
    };
  }
};
