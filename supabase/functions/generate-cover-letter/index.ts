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

    const mammouthApiKey = Deno.env.get('MAMMOUTH_API_KEY');
    if (!mammouthApiKey) {
      return new Response(JSON.stringify({ error: 'MAMMOUTH_API_KEY is not set in environment variables.' }), { status: 500, headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' } });
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
      CRITICAL TASK: You MUST extract the candidate's name from the CV content provided above.

      Look carefully in the CV content for:
      - Full name (first name + last name)
      - Contact information section
      - Header/title section
      - Any personal information

      Based on the provided CV and job offer, you must:
      1. EXTRACT the candidate's EXACT full name from the CV content (this is MANDATORY)
      2. Extract the candidate's full address from the CV content
      3. Extract the candidate's city from the CV content or address
      4. Identify the company's full address (if available in job description, otherwise leave empty)
      5. Generate a compelling body for a cover letter

      ABSOLUTELY CRITICAL REQUIREMENTS:
      - You MUST respond with ONLY a valid JSON object
      - The JSON must contain exactly these 5 keys: "candidateName", "candidateAddress", "companyAddress", "candidateCity", "letterBody"
      - "candidateName" MUST be the EXACT name found in the CV (NOT a placeholder, NOT "Test_Sass", but the REAL name from the CV)
      - If you cannot find a name in the CV, use "Nom Prénom" as fallback
      - "letterBody" must be plain text paragraphs separated by double line breaks
      - NO HTML tags, NO placeholders, NO markdown

      MANDATORY JSON FORMAT:
      {
        "candidateName": "REAL_NAME_FROM_CV",
        "candidateAddress": "Full address with \\n for line breaks",
        "companyAddress": "Company address or empty string",
        "candidateCity": "City name",
        "letterBody": "Paragraph 1\\n\\nParagraph 2\\n\\nParagraph 3"
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
        console.log('Sending request to Mammouth AI with CV content length:', cvText.length);
        console.log('User prompt includes candidateName extraction:', userPrompt.includes('candidateName'));
        
        const mammouthResponse = await fetch('https://api.mammouth.ai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${mammouthApiKey}`,
          },
          body: JSON.stringify({
            model: 'claude-3-5-sonnet-20241022',
            messages: [
              { role: 'system', content: systemMessage },
              { role: 'user', content: userPrompt }
            ],
            max_tokens: 4096,
          }),
        });

        if (!mammouthResponse.ok) {
          const errorBody = await mammouthResponse.text();
          throw new Error(`Mammouth API error: ${mammouthResponse.status} ${errorBody}`);
        }

        const mammouthResult = await mammouthResponse.json();
        const rawContent = mammouthResult.choices?.[0]?.message?.content || '';
        
        console.log('Raw AI response:', rawContent.substring(0, 500) + '...');

        // Parse the AI response
        let parsedContent;
        try {
          let jsonContent = rawContent;
          
          // Try to extract JSON from markdown code blocks
          const codeBlockMatch = rawContent.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
          if (codeBlockMatch) {
            jsonContent = codeBlockMatch[1];
          } else {
            // Try to find standalone JSON object
            const standaloneMatch = rawContent.match(/\{[\s\S]*\}/);
            if (standaloneMatch) {
              jsonContent = standaloneMatch[0];
            }
          }
          
          parsedContent = JSON.parse(jsonContent);
          console.log('Parsed candidateName from AI:', parsedContent.candidateName);
        } catch (_e) {
          console.error('Failed to parse AI response as JSON:', rawContent);
          // Fallback: try to create a basic structure from the raw content
          parsedContent = {
            candidateName: "Test_Sass",
            candidateAddress: "Adresse du candidat",
            companyAddress: "Adresse de l'entreprise", 
            candidateCity: "Ville",
            letterBody: rawContent.replace(/```/g, '').replace(/json/g, '').trim()
          };
        }

        let { candidateName, candidateAddress, companyAddress, candidateCity, letterBody } = parsedContent;

        // Clean the letter body of any remaining placeholders and convert to HTML paragraphs
        if (letterBody) {
          letterBody = letterBody.replace(/\[.*?\]/g, '').trim();
          // Convert plain text paragraphs to HTML
          letterBody = letterBody.split('\n\n').map((paragraph: string) => `<p>${paragraph.trim()}</p>`).join('\n');
        }

        if (!letterBody) {
          throw new Error('AI response is missing required `letterBody` key.');
        }
        
        // Use fallback values if extraction failed
        if (!candidateName) candidateName = "Nom Prénom";
        if (!candidateAddress) candidateAddress = "Adresse du candidat";
        if (!candidateCity) candidateCity = "Ville";

        // --- Assemble the full letter --- 
        const candidateFullName = candidateName || 'Test_Sass';
        const candidateEmail = user.email || '';
        const candidatePhone = user.user_metadata?.phone || user.phone || '';

        const currentDate = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

        const finalLetter = `
<div style="font-family: 'Times New Roman', serif; line-height: 1.8; max-width: 21cm; margin: 0 auto; padding: 2cm; background: white; color: black;">
  <!-- En-tête candidat -->
  <div style="margin-bottom: 2cm;">
    <div style="font-weight: bold; font-size: 14px; margin-bottom: 8px;">${candidateFullName}</div>
    <div style="font-size: 12px; margin-bottom: 4px;">${candidateEmail}</div>
    <div style="font-size: 12px; margin-bottom: 4px;">${candidatePhone}</div>
    <div style="font-size: 12px; white-space: pre-line;">${candidateAddress}</div>
  </div>

  <!-- Adresse entreprise -->
  <div style="margin-bottom: 2cm;">
    <div style="font-size: 12px; white-space: pre-line; margin-bottom: 1cm;">${companyAddress || ''}</div>
    <div style="font-size: 12px; margin-bottom: 4px;">À l'attention du service de recrutement</div>
    <div style="font-size: 12px; font-weight: bold;">${companyName}</div>
  </div>

  <!-- Date et lieu -->
  <div style="text-align: right; margin-bottom: 2cm; font-size: 12px;">
    Fait à ${candidateCity}, le ${currentDate}
  </div>

  <!-- Objet -->
  <div style="margin-bottom: 1.5cm; font-size: 12px;">
    <strong>Objet : Candidature au poste de ${jobTitle}</strong>
  </div>

  <!-- Formule d'appel -->
  <div style="margin-bottom: 1cm; font-size: 12px;">
    Madame, Monsieur,
  </div>

  <!-- Corps de la lettre -->
  <div style="margin-bottom: 1.5cm; font-size: 12px; text-align: justify;">
    ${letterBody}
  </div>

  <!-- Formule de politesse -->
  <div style="margin-bottom: 2cm; font-size: 12px;">
    Dans l'attente de votre retour, je vous prie d'agréer, Madame, Monsieur, l'expression de mes salutations distinguées.
  </div>

  <!-- Signature -->
  <div style="font-size: 12px; font-weight: bold;">
    ${candidateFullName}
  </div>
</div>
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

    const isInputError = errorMessage === 'MAMMOUTH_API_KEY is not set in environment variables.' || errorMessage.startsWith('Missing required fields');

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
- MAMMOUTH_API_KEY: Votre clé API Mammouth.

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
