// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// supabase/functions/generate-cover-letter/index.ts
import { createClient } from '../_shared/deps.ts';

import { corsHeaders } from '../_shared/cors.ts';

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
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // JWT Authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Missing or invalid Authorization header' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid JWT token: ' + (authError?.message || 'User not found') }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
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
      return new Response(JSON.stringify({ error: 'Missing required fields: cvText, jobTitle, companyName, jobDescription, targetLanguage.' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const mistralApiKey = Deno.env.get('MISTRAL_API_KEY');
    if (!mistralApiKey) {
      return new Response(JSON.stringify({ error: 'MISTRAL_API_KEY is not set in environment variables.' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
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
      The cover letter should be tailored to the job description, highlighting relevant skills and experiences from the CV.
      Ensure the tone is professional.
      Generate only the text of the cover letter itself. Do not include any surrounding text like "Here is your cover letter:" or any explanations.
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
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
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
        const generatedLetter = completion.choices[0]?.message?.content?.trim();

        if (!generatedLetter) {
          throw new Error('AI failed to generate a cover letter content.');
        }

        await supabaseAdmin
          .from('generated_content')
          .update({
            content: generatedLetter,
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
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
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
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
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
