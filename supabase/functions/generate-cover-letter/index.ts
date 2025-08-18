// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// supabase/functions/generate-cover-letter/index.ts
import { createClient } from '../_shared/deps.ts';

import { getCorsHeaders } from '../_shared/cors.ts';

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);



Deno.serve(async (req: Request) => {
  const origin = req.headers.get('Origin');

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling OPTIONS request for generate-cover-letter');
    return new Response('ok', { headers: getCorsHeaders(origin) });
  }

  try {
    // JWT Authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Missing or invalid Authorization header' }), { status: 401, headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' } });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid JWT token: ' + (authError?.message || 'User not found') }), { status: 401, headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' } });
    }

    const body = await req.json();
    const cvText = body.cvText;
    const jobTitle = body.jobTitle;
    const companyName = body.companyName;
    const jobDescription = body.jobDescription;
    const customInstructions = body.customInstructions;
    const targetLanguage = body.targetLanguage || body.language; // accept legacy `language`

    // Minimal diagnostics (no sensitive content)
    try { console.log('generate-cover-letter payload keys:', Object.keys(body)); } catch (_) { /* ignore logging errors */ }

    if (!cvText || !jobTitle || !companyName || !jobDescription || !targetLanguage) {
      return new Response(JSON.stringify({ error: 'Missing required fields: cvText, jobTitle, companyName, jobDescription, targetLanguage.' }), { status: 400, headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' } });
    }

    const mistralApiKey = Deno.env.get('MISTRAL_API_KEY');
    if (!mistralApiKey) {
      return new Response(JSON.stringify({ error: 'MISTRAL_API_KEY is not set in environment variables.' }), { status: 500, headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' } });
    }

    const systemMessage = `You are an expert cover letter writer. Your task is to generate a compelling and professional cover letter in ${targetLanguage}.`;
    
    let userPrompt = `
      Based on the following CV content and job offer details, please write a cover letter.
      The language for the cover letter must be ${targetLanguage}.

      CV Content:
      """
      ${cvText}
      """

      Job Offer Details:
      """
      Job Title: ${jobTitle}
      Company: ${companyName}
      Job Description: ${jobDescription}
      """
    `;

    if (customInstructions) {
      userPrompt += `
        Please also follow these specific instructions:
        """
        ${customInstructions}
        """
      `;
    }

    userPrompt += `
      Based on the provided CV and job offer, identify the candidate's full address and the company's full address.
      Then, generate a compelling body for a cover letter, tailored to the job description and highlighting relevant skills from the CV.

      VERY IMPORTANT:
      - Respond ONLY with a valid JSON object containing four keys: "candidateAddress", "companyAddress", "candidateCity", and "letterBody".
      - The "letterBody" must only contain the paragraphs of the letter. It must NOT include salutations, subject, date, or signature.
      - "candidateAddress" and "companyAddress" must be full, multi-line addresses formatted as a single string with '\n' for newlines.
      - Absolutely DO NOT use any placeholders like [Date], [Adresse de l’entreprise], [Your Name], etc. The content must be complete and ready to use.

      Example response format:
      {
        "candidateAddress": "123 Rue de la République\n75001 Paris",
        "companyAddress": "456 Avenue des Champs-Élysées\n75008 Paris",
        "candidateCity": "Paris",
        "letterBody": "Paragraph 1...\n\nParagraph 2..."
      }
    `;
    
    const taskId = crypto.randomUUID();

    const { error: insertError } = await supabaseAdmin
      .from('generated_content')
      .insert({
        user_id: user.id,
        task_id: taskId,
        status: 'pending',
      });

    if (insertError) {
      console.error('Error inserting task:', insertError);
      return new Response(JSON.stringify({ error: 'Failed to create generation task.' }), {
        headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    const backgroundTask = async () => {
      try {
        console.log(`Starting background task for task_id: ${taskId}`);
        const mistralResponse = await fetch('https://api.mistral.ai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${mistralApiKey}`,
          },
          body: JSON.stringify({
            model: 'mistral-large-latest',
            messages: [
              { role: 'system', content: systemMessage },
              { role: 'user', content: userPrompt }
            ],
            max_tokens: 4096,
          }),
        });

        if (!mistralResponse.ok) {
          const errorBody = await mistralResponse.text();
          throw new Error(`Mistral API error: ${mistralResponse.status} ${errorBody}`);
        }

        const completion = await mistralResponse.json();
        const rawContent = completion.choices[0]?.message?.content?.trim();
        if (!rawContent) {
          throw new Error('AI returned empty content.');
        }

        let parsedContent;
        try {
          // Try to extract JSON from the response if it's wrapped in markdown or other text
          let jsonContent = rawContent;
          
          // Look for JSON block in markdown format
          const jsonMatch = rawContent.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
          if (jsonMatch) {
            jsonContent = jsonMatch[1];
          } else {
            // Look for standalone JSON object
            const standaloneMatch = rawContent.match(/\{[\s\S]*\}/);
            if (standaloneMatch) {
              jsonContent = standaloneMatch[0];
            }
          }
          
          parsedContent = JSON.parse(jsonContent);
        } catch (_e) {
          console.error('Failed to parse AI response as JSON:', rawContent);
          // Fallback: try to create a basic structure from the raw content
          parsedContent = {
            candidateAddress: "Adresse du candidat",
            companyAddress: "Adresse de l'entreprise", 
            candidateCity: "Ville",
            letterBody: rawContent.replace(/```/g, '').replace(/json/g, '').trim()
          };
        }

        let { candidateAddress, companyAddress, candidateCity, letterBody } = parsedContent;

        // Clean the letter body of any remaining placeholders
        if (letterBody) {
          letterBody = letterBody.replace(/\[.*?\]/g, '').trim();
        }

        if (!letterBody || !candidateAddress || !candidateCity) {
          throw new Error('AI response is missing required `letterBody`, `candidateAddress` or `candidateCity` keys.');
        }

        // --- Assemble the full letter --- 
        const candidateFullName = user.user_metadata?.full_name || 'Candidat';
        const candidateEmail = user.email || '';
        const candidatePhone = user.phone || ''; // Assuming phone is available

        const currentDate = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

        const finalLetter = `
<p>${candidateFullName}<br>${candidateEmail}<br>${candidatePhone}<br>${candidateAddress}</p>
        <br>
        <p>${companyAddress || ''}</p>

À l'attention du service de recrutement
${companyName}

Fait à ${candidateCity}, le ${currentDate}

**Objet : Candidature au poste de ${jobTitle}**

Madame, Monsieur,

${letterBody}

Dans l’attente de votre retour, je vous prie d’agréer, Madame, Monsieur, l’expression de mes salutations distinguées.

${candidateFullName}
        `.trim();

        await supabaseAdmin
          .from('generated_content')
          .update({
            content: finalLetter,
            status: 'completed',
            updated_at: new Date().toISOString(),
          })
          .eq('task_id', taskId);
        console.log(`Task ${taskId} completed successfully.`);

      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : String(e);
        console.error(`Background task failed for task_id ${taskId}:`, errorMessage);
        await supabaseAdmin
          .from('generated_content')
          .update({
            error: errorMessage,
            status: 'failed',
            updated_at: new Date().toISOString(),
          })
          .eq('task_id', taskId);
      }
    };

    // Schedule background work in Supabase Edge runtime when available; otherwise run fire-and-forget
    type EdgeEnv = { EdgeRuntime?: { waitUntil?: (p: Promise<unknown>) => void } };
    const edge = (globalThis as unknown as EdgeEnv).EdgeRuntime;
    if (edge?.waitUntil && typeof edge.waitUntil === 'function') {
      edge.waitUntil(backgroundTask());
    } else {
      // Fallback: execute without waitUntil (may terminate early on some platforms)
      backgroundTask();
    }

    return new Response(
      JSON.stringify({ taskId }),
      {
        headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' },
        status: 202, // Accepted
      }
    );

  } catch (e) {
    console.error('Error in generate-cover-letter function:', e);
    let errorMessage = 'An unexpected error occurred while generating the cover letter.';
    let errorStack: string | undefined = undefined;

    if (e instanceof Error) {
      errorMessage = e.message;
      errorStack = e.stack;
    } else if (typeof e === 'string') {
      errorMessage = e;
    } else {
      try {
        errorMessage = JSON.stringify(e);
      } catch {
        // If stringify fails, stick to the generic message
      }
    }

    if (errorStack) {
        console.error(errorStack);
    }

    const isInputError = errorMessage === 'MISTRAL_API_KEY is not set in environment variables.' || errorMessage.startsWith('Missing required fields');

    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' },
        status: isInputError ? 400 : 500
      }
    );
  }
});

/*
Variables d'environnement à configurer dans Supabase Dashboard > Edge Functions > generate-cover-letter > Settings:
- MISTRAL_API_KEY: Votre clé API Mistral.

Pour invoquer localement (après supabase start) :
  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/generate-cover-letter' \
    --header 'Authorization: Bearer VOTRE_SUPABASE_ANON_KEY_OU_USER_TOKEN' \
    --header 'Content-Type: application/json' \
    --data-raw '{
        "cvText": "Contenu du CV ici...",
        "jobTitle": "Développeur Frontend",
        "companyName": "Tech Solutions Inc.",
        "jobDescription": "Description du poste ici...",
        "customInstructions": "Mettre l\'accent sur l\'expérience React.",
        "targetLanguage": "fr"
    }'
*/
