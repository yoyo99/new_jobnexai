import type { Handler } from '@netlify/functions';

// Types
type SupportedAI = 'openai' | 'mistral' | 'gemini' | 'claude' | 'internal';

interface AIRequest {
  action: 'cover-letter' | 'match-score' | 'analyze-cv';
  engine: SupportedAI;
  apiKey: string;
  params: Record<string, string>;
}

// --- Appels aux SDKs (côté serveur uniquement) --- //

async function callOpenAI(apiKey: string, messages: Array<{role: string; content: string}>, maxTokens = 1024, temperature = 0.7) {
  // Import dynamique pour ne charger que si nécessaire
  const OpenAI = (await import('openai')).default;
  const client = new OpenAI({ apiKey });

  const response = await client.chat.completions.create({
    model: 'gpt-4',
    messages: messages as any,
    max_tokens: maxTokens,
    temperature,
  });

  return {
    text: response.choices[0]?.message?.content?.trim() || '',
    tokensUsed: response.usage?.total_tokens,
  };
}

async function callMistral(apiKey: string, messages: Array<{role: string; content: string}>, maxTokens = 1024) {
  const { Mistral } = await import('@mistralai/mistralai');
  const client = new Mistral({ apiKey });

  const response = await client.chat.complete({
    model: 'mistral-large-latest',
    messages: messages as any,
    maxTokens,
  });

  return {
    text: (response.choices?.[0]?.message?.content as string)?.trim() || '',
    tokensUsed: response.usage?.totalTokens,
  };
}

async function callGemini(apiKey: string, prompt: string) {
  const { GoogleGenerativeAI } = await import('@google/generative-ai');
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
  const result = await model.generateContent(prompt);
  const response = await result.response;

  return {
    text: response.text().trim(),
    tokensUsed: response.usageMetadata?.totalTokenCount,
  };
}

async function callClaude(apiKey: string, prompt: string, maxTokens = 1024) {
  const { default: Anthropic } = await import('@anthropic-ai/sdk');
  const client = new Anthropic({ apiKey });

  const response = await client.messages.create({
    model: 'claude-3-opus-20240229',
    max_tokens: maxTokens,
    messages: [{ role: 'user', content: prompt }],
  });

  const textBlock = response.content.find((c: any) => c.type === 'text');
  return {
    text: (textBlock as any)?.text?.trim() || '',
    tokensUsed: (response.usage as any)?.input_tokens + (response.usage as any)?.output_tokens,
  };
}

// --- Router IA --- //

async function callAI(engine: SupportedAI, apiKey: string, systemPrompt: string, userPrompt: string, options?: { maxTokens?: number; temperature?: number }) {
  const maxTokens = options?.maxTokens || 1024;
  const temperature = options?.temperature || 0.7;

  switch (engine) {
    case 'openai':
      return callOpenAI(apiKey, [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ], maxTokens, temperature);

    case 'mistral':
      return callMistral(apiKey, [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ], maxTokens);

    case 'gemini':
      return callGemini(apiKey, `${systemPrompt}\n\n${userPrompt}`);

    case 'claude':
      return callClaude(apiKey, `${systemPrompt}\n\n${userPrompt}`, maxTokens);

    default:
      throw new Error(`Unsupported engine: ${engine}`);
  }
}

// --- Handler principal --- //

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const { action, engine, apiKey, params } = JSON.parse(event.body || '{}') as AIRequest;

    if (!apiKey) {
      return {
        statusCode: 400,
        body: JSON.stringify({ success: false, error: `${engine} API key missing`, engine }),
      };
    }

    let result: { text: string; tokensUsed?: number };

    switch (action) {
      case 'cover-letter': {
        const { cv, jobDescription, language, tone } = params;
        result = await callAI(engine, apiKey,
          'You are an expert career advisor who writes professional cover letters.',
          `Generate a professional cover letter in ${language} with a ${tone} tone.
          
About me (from CV): ${cv}

Job description: ${jobDescription}

The letter should:
1. Be concise and professional
2. Highlight relevant skills and experiences
3. Show enthusiasm for the position
4. Be formatted as plain text (no HTML)
5. Be between 200-400 words`,
          { maxTokens: 1024, temperature: 0.7 }
        );

        return {
          statusCode: 200,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            success: true,
            data: result.text,
            engine,
            tokensUsed: result.tokensUsed,
          }),
        };
      }

      case 'match-score': {
        const { cv, jobDescription } = params;
        result = await callAI(engine, apiKey,
          'You are a helpful career advisor. Always respond with valid JSON only.',
          `Analyze the match between the following CV and job description.

CV: ${cv}

Job Description: ${jobDescription}

Return ONLY a JSON object with:
{
  "score": number between 0-100,
  "explanation": string explaining the score,
  "matchingSkills": string[],
  "missingSkills": string[],
  "suggestions": string[]
}`,
          { maxTokens: 500, temperature: 0.3 }
        );

        try {
          const parsed = JSON.parse(result.text);
          return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              success: true,
              data: parsed,
              engine,
              tokensUsed: result.tokensUsed,
            }),
          };
        } catch {
          return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              success: false,
              error: 'Invalid JSON response from AI',
              engine,
            }),
          };
        }
      }

      case 'analyze-cv': {
        const { cvText } = params;
        result = await callAI(engine, apiKey,
          'You are a professional career coach. Always respond with valid JSON only.',
          `Analyze the following CV and return a JSON object with:
{
  "skills": string[],
  "strengths": string[],
  "weaknesses": string[],
  "suggestions": string[],
  "summary": string
}

CV: ${cvText}`,
          { maxTokens: 800, temperature: 0.5 }
        );

        try {
          const parsed = JSON.parse(result.text);
          return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              success: true,
              data: parsed,
              engine,
              tokensUsed: result.tokensUsed,
            }),
          };
        } catch {
          return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              success: false,
              error: 'Invalid JSON response from AI',
              engine,
            }),
          };
        }
      }

      default:
        return {
          statusCode: 400,
          body: JSON.stringify({ success: false, error: `Unknown action: ${action}` }),
        };
    }
  } catch (error) {
    console.error('AI Function Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      }),
    };
  }
};
