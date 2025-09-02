/**
 * @file This file contains the Supabase function for job matching.
 * It retrieves user skills and job requirements, analyzes the match using OpenAI's GPT-4,
 * and updates the match score in the database.
 */

import { createClient } from 'npm:@supabase/supabase-js@2.39.3'
import OpenAI from 'npm:openai@4'
import { create, getNumericDate, verify } from "https://deno.land/x/djwt@v2.9.1/mod.ts";
import { v4 as uuidv4 } from "https://deno.land/std@0.224.0/uuid/mod.ts";
import { getEnv } from "../../../src/lib/env.ts";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: getEnv("OPENAI_API_KEY") || "",
});

// Initialize Supabase client
const supabaseUrl = getEnv("SUPABASE_URL") || "";
const supabaseAnonKey = getEnv("SUPABASE_ANON_KEY") || "";
const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey
)

// Define CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface JobMatchAnalysis {
  score: number;
  matchingSkills: string[];
  missingSkills: string[];
  recommendations: string[];
}

// Define error response interface
interface ErrorResponse {
  error: string;
  code?: number;
}

interface SuccessResponse {
  data: JobMatchAnalysis;
}

interface Input {
  userId: string;
  jobId: string;
}

/**
 * Validates the input data.
 * @param input - The input data containing userId and jobId.
 */
const validateInput = (input: Input): string | null => {
  if (!input.userId || !input.jobId) {
    return 'Missing userId or jobId'
  }
  if (!UUID.isValid(input.userId)) {
    return 'Invalid userId'
  }
  if (!UUID.isValid(input.jobId)) {
    return 'Invalid jobId'
  }
  return null
}

interface JobSkill {
  name: string;
  category: string;
  importance: number;
}

/**
 * Authenticates the request by verifying the JWT token.
 * @param req - The request object.
 */
const authenticate = async (req: Request): Promise<string> => {
  // Get the authorization header
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    throw new Error('Unauthorized');
  }

  // Extract the token from the header
  const token = authHeader.split(' ')[1];
  const secret = getEnv("JWT_SECRET") || "";
  // Verify the token
  try {
    await verify(token, secret);
    return token
  } catch {
    throw new Error('Unauthorized');
  }
};

/**
 * Retrieves user skills from Supabase.
 * @param userId - The ID of the user.
 */
const getUserSkills = async (userId: string) => {
  const { data: userData, error: userError } = await supabase
    .from('user_skills')
    .select(`
      skill:skills (
        name,
        category
      ),
      proficiency_level,
      years_experience
    `)
    .eq('user_id', userId);
  if (userError) {
    throw new Error('Error fetching user data');
  }
  return userData;
};

/**
 * Retrieves job data from Supabase.
 * @param jobId - The ID of the job.
 */
const getJobData = async (jobId: string) => {
  const { data: jobData, error: jobError } = await supabase
    .from('jobs')
    .select(`
      *,
      job_skills (
        skill:skills (
          name,
          category
        ),
        importance
      )
    `)
    .eq('id', jobId)
    .single();
  if (jobError) {
    throw new Error('Error fetching job data');
  }
  return jobData;
};

/**
 * Transforms user skills data.
 * @param userData - The user data.
 */
const transformUserSkills = (userData: any) => {
  return userData.map((skill: any) => ({
    name: skill.skill.name,
    category: skill.skill.category,
    proficiency: skill.proficiency_level,
    experience: skill.years_experience,
  }));
};

/**
 * Transforms job skills data.
 * @param jobData - The job data.
 */
const transformJobSkills = (jobData: any) => {
  return jobData.job_skills.map((skill: any) => ({
    name: skill.skill.name,
    category: skill.skill.category,
    importance: skill.importance,
  }));
};

/**
 * Analyzes the job match using OpenAI's GPT-4.
 * @param jobData - The job data.
 * @param userSkills - The user skills.
 * @param jobSkills - The job skills.
 */
const analyzeJobMatch = async (jobData: any, userSkills: any, jobSkills: any) => {
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `Tu es un expert en recrutement chargé d'évaluer la correspondance entre un candidat et un poste.\n          Analyse les compétences du candidat et les exigences du poste pour calculer un score de correspondance et fournir des recommandations.\n          Retourne un objet JSON avec :\n          - score : pourcentage de correspondance (0-100)\n          - matchingSkills : tableau des compétences correspondantes\n          - missingSkills : tableau des compétences manquantes importantes\n          - recommendations : suggestions pour améliorer la correspondance`
        },
        {
          role: 'user',
          content: `{
            "jobTitle": "${jobData.title}",
            "jobDescription": "${jobData.description}",
            "jobSkills": ${JSON.stringify(jobSkills)},
            "userSkills": ${JSON.stringify(userSkills)}
          }`
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.5,
    });
    return JSON.parse(completion.choices[0].message.content);
  } catch (openaiError) {
    throw new Error('Error with OpenAI');
  }
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Authenticate the request
    await authenticate(req);

    // Get input data
    const { userId, jobId } = await req.json();

    // Validate the input data
    const validationError = validateInput({ userId, jobId })
    if (validationError) {
      console.error('Validation error:', validationError)
      return new Response(
        JSON.stringify({ // Return an error response if validation fails
          error: validationError,
          code: 400,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }
    

    // Récupérer les informations de l'utilisateur
    const { data: userData, error: userError } = await supabase
      .from('user_skills')
      .select(`
        skill:skills (
          name,
          category
        ),
        proficiency_level,
        years_experience
      `)
      .eq('user_id', userId)

    

    if (userError) {
      console.error('Supabase userError:', userError)
      return new Response(
        JSON.stringify({
          error: 'Error fetching user data',
          code: 500,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    // Récupérer les informations du poste
    const { data: jobData, error: jobError } = await supabase
      .from('jobs')
      .select(`
        *,
        job_skills (
          skill:skills (
            name,
            category
          ),
          importance
        )
      `)
      .eq('id', jobId)
      .single()

    if (jobError) {
      console.error('Supabase jobError:', jobError)
      return new Response(
        JSON.stringify({
          error: 'Error fetching job data',
          code: 500,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    // Préparer les données pour l'analyse
    const userSkills = transformUserSkills(userData);


    const jobSkills = jobData.job_skills.map(skill => ({
      name: skill.skill.name,
      category: skill.skill.category,
      importance: skill.importance,
    }))

    // Analyser la correspondance avec GPT-4
    const analysis = await analyzeJobMatch(jobData, userSkills, jobSkills);

    if(!analysis.score || !analysis.matchingSkills || !analysis.missingSkills || !analysis.recommendations){
      throw new Error("Error during the analyse")
    }
    } catch (openaiError) {
      console.error('OpenAI error:', openaiError)
      return new Response(
        JSON.stringify({
          error: 'Error with OpenAI',
          code: 500,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );

    // Mettre à jour le score de correspondance dans la base de données
    const { error: updateError } = await supabase
      .from('job_matches')
      .upsert({
        user_id: userId,
        job_id: jobId,
        match_score: analysis.score,
        skills_match_percentage: jobSkills.length > 0
        ? (analysis.matchingSkills.length / jobSkills.length) * 100
        : 0,
        




        ai_analysis: analysis,
        updated_at: new Date().toISOString(),
      })

    if (updateError) {
      console.error('Supabase updateError:', updateError)
      return new Response(
        JSON.stringify({
          error: 'Error updating job match',
          code: 500,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }
     // Return the analysis in the response
     return new Response(JSON.stringify({ data: analysis }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Error:', error);

    const response: ErrorResponse = {

        error: 'An unexpected error occurred',
        code: 500,
    };
    return new Response(
      JSON.stringify(response),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});