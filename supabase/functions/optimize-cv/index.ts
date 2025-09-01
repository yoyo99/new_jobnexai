import OpenAI from 'npm:openai@4'
import { createClient } from 'npm:@supabase/supabase-js@2.39.3'

const openai = new OpenAI({
  apiKey: Deno.env.get('OPENAI_API_KEY')
})

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { cv, jobDescription } = await req.json()

    // Analyser le CV et la description du poste avec GPT-4
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `Tu es un expert en recrutement et en optimisation de CV avec plus de 20 ans d'expérience. 
          
          TÂCHE:
          Analyse le CV fourni et la description du poste pour suggérer des améliorations spécifiques et concrètes qui augmenteront significativement les chances du candidat d'être retenu.
          
          INSTRUCTIONS DÉTAILLÉES:
          1. Analyse la correspondance entre les compétences du candidat et celles requises dans l'offre d'emploi
          2. Identifie les mots-clés et compétences manquants qui devraient être ajoutés au CV
          3. Suggère des reformulations pour mettre en valeur les réalisations et l'impact du candidat
          4. Propose des modifications pour optimiser le CV pour les systèmes ATS (Applicant Tracking Systems)
          5. Identifie les éléments superflus ou contre-productifs à supprimer
          6. Suggère une structure optimale pour le CV en fonction du poste visé
          
          FORMAT DE RÉPONSE:
          Fournis des suggestions précises et actionnables, organisées par section du CV.
          Pour chaque suggestion, explique pourquoi elle est importante et comment elle augmentera les chances du candidat.`
        },
        {
          role: 'user',
          content: `CV:\n${JSON.stringify(cv)}\n\nDescription du poste:\n${jobDescription}`
        }
      ],
      temperature: 0.7,
      max_tokens: 1500,
    })

    const suggestions = completion.choices[0].message.content

    // Générer des mots-clés pertinents
    const keywordsCompletion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `Tu es un expert en recrutement spécialisé dans l'optimisation de CV pour les systèmes ATS (Applicant Tracking Systems).
          
          TÂCHE:
          Extrais les 15-20 mots-clés les plus pertinents de la description du poste qui devraient absolument figurer dans le CV du candidat.
          
          INSTRUCTIONS:
          1. Identifie les compétences techniques spécifiques mentionnées
          2. Repère les soft skills importants
          3. Note les outils, logiciels et technologies requis
          4. Identifie la terminologie spécifique au secteur
          5. Repère les qualifications, certifications ou diplômes mentionnés
          
          FORMAT DE RÉPONSE:
          Fournis une liste numérotée des mots-clés, classés par ordre d'importance.`
        },
        {
          role: 'user',
          content: jobDescription
        }
      ],
      temperature: 0.5,
      max_tokens: 500,
    })

    const keywords = keywordsCompletion.choices[0].message.content

    return new Response(
      JSON.stringify({ suggestions, keywords }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})