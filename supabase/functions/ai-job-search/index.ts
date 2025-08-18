import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const mammouthApiKey = Deno.env.get('MAMMOUTH_API_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface SearchFilters {
  search?: string;
  location?: string;
  contractTypes?: string[];
  salaryMin?: number;
  salaryMax?: number;
  experienceLevel?: string;
  companySize?: string;
  remote?: boolean | null;
  tags?: string[];
  sortBy?: 'relevance' | 'date' | 'salary' | 'match_score';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

interface UserProfile {
  id: string;
  skills: string[];
  experience_level: string;
  preferred_location: string;
  salary_expectation: number;
  cv_content?: string;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { user_id, filters = {}, use_ai_optimization = true } = await req.json();

    if (!user_id) {
      return new Response(
        JSON.stringify({ error: 'user_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Récupérer le profil utilisateur
    const { data: userProfile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user_id)
      .single();

    if (profileError) {
      console.error('Error fetching user profile:', profileError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch user profile' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Construire la requête de base
    let query = supabase
      .from('jobs')
      .select(`
        *,
        job_matches!left(score, user_id)
      `);

    // Appliquer les filtres de base
    if (filters.search) {
      query = query.or(`title.ilike.%${filters.search}%,company.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
    }

    if (filters.location) {
      query = query.ilike('location', `%${filters.location}%`);
    }

    if (filters.contractTypes && filters.contractTypes.length > 0) {
      query = query.in('contract_type', filters.contractTypes);
    }

    if (filters.experienceLevel) {
      query = query.eq('experience_level', filters.experienceLevel);
    }

    if (filters.companySize) {
      query = query.eq('company_size', filters.companySize);
    }

    if (filters.remote !== null && filters.remote !== undefined) {
      query = query.eq('is_remote', filters.remote);
    }

    if (filters.salaryMin) {
      query = query.gte('salary_min', filters.salaryMin);
    }

    if (filters.salaryMax) {
      query = query.lte('salary_max', filters.salaryMax);
    }

    // Filtrage par tags/compétences
    if (filters.tags && filters.tags.length > 0) {
      const tagsFilter = filters.tags.map(tag => `tags.cs.{${tag}}`).join(',');
      query = query.or(tagsFilter);
    }

    // Récupérer les offres
    const { data: jobs, error: jobsError } = await query;

    if (jobsError) {
      console.error('Error fetching jobs:', jobsError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch jobs' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let processedJobs = jobs || [];

    // Optimisation IA si demandée
    if (use_ai_optimization && processedJobs.length > 0) {
      processedJobs = await optimizeJobsWithAI(processedJobs, userProfile, filters);
    }

    // Tri des résultats
    processedJobs = sortJobs(processedJobs, filters.sortBy || 'relevance', filters.sortOrder || 'desc');

    // Pagination
    const limit = filters.limit || 20;
    const offset = filters.offset || 0;
    const paginatedJobs = processedJobs.slice(offset, offset + limit);

    // Statistiques
    const stats = {
      total: processedJobs.length,
      filtered: paginatedJobs.length,
      hasMore: offset + limit < processedJobs.length,
      averageMatchScore: processedJobs.reduce((acc, job) => acc + (job.ai_match_score || 0), 0) / processedJobs.length
    };

    return new Response(
      JSON.stringify({
        jobs: paginatedJobs,
        stats,
        filters: filters,
        user_profile: {
          id: userProfile.id,
          skills: userProfile.skills || [],
          experience_level: userProfile.experience_level,
          preferred_location: userProfile.preferred_location
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in ai-job-search:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function optimizeJobsWithAI(jobs: any[], userProfile: UserProfile, filters: SearchFilters): Promise<any[]> {
  try {
    // Préparer le contexte utilisateur pour l'IA
    const userContext = {
      skills: userProfile.skills || [],
      experience_level: userProfile.experience_level || '',
      preferred_location: userProfile.preferred_location || '',
      salary_expectation: userProfile.salary_expectation || 0,
      search_intent: filters.search || '',
      location_preference: filters.location || userProfile.preferred_location || ''
    };

    // Analyser les offres par batch pour éviter les timeouts
    const batchSize = 5;
    const optimizedJobs = [];

    for (let i = 0; i < jobs.length; i += batchSize) {
      const batch = jobs.slice(i, i + batchSize);
      const batchResults = await analyzeJobBatch(batch, userContext);
      optimizedJobs.push(...batchResults);
    }

    return optimizedJobs;
  } catch (error) {
    console.error('Error in AI optimization:', error);
    // Retourner les offres sans optimisation en cas d'erreur
    return jobs.map(job => ({ ...job, ai_match_score: 0.5, ai_insights: null }));
  }
}

async function analyzeJobBatch(jobs: any[], userContext: any): Promise<any[]> {
  try {
    const prompt = `
Analysez ces offres d'emploi pour l'utilisateur suivant et calculez un score de pertinence (0-1):

Profil utilisateur:
- Compétences: ${userContext.skills.join(', ')}
- Niveau d'expérience: ${userContext.experience_level}
- Localisation préférée: ${userContext.location_preference}
- Salaire souhaité: ${userContext.salary_expectation}€
- Recherche: "${userContext.search_intent}"

Offres à analyser:
${jobs.map((job, index) => `
${index + 1}. ${job.title} chez ${job.company}
   - Localisation: ${job.location}
   - Salaire: ${job.salary_min}-${job.salary_max}€
   - Type: ${job.contract_type}
   - Remote: ${job.is_remote ? 'Oui' : 'Non'}
   - Compétences: ${job.tags?.join(', ') || 'Non spécifiées'}
   - Description: ${job.description?.substring(0, 200)}...
`).join('\n')}

Pour chaque offre, retournez un JSON avec:
- job_index: index de l'offre (1-${jobs.length})
- match_score: score de 0 à 1
- reasons: array des raisons principales du score
- concerns: array des points d'attention éventuels

Format de réponse: {"analyses": [{"job_index": 1, "match_score": 0.8, "reasons": ["..."], "concerns": ["..."]}]}
`;

    const response = await fetch('https://api.mammouth.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${mammouthApiKey}`,
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        messages: [
          { role: 'system', content: 'Vous êtes un expert en matching d\'offres d\'emploi. Analysez objectivement la compatibilité entre profils et offres.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      throw new Error(`Mammouth API error: ${response.status}`);
    }

    const result = await response.json();
    const content = result.choices?.[0]?.message?.content || '';
    
    let analyses;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analyses = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', content);
      // Fallback: scores par défaut
      analyses = {
        analyses: jobs.map((_, index) => ({
          job_index: index + 1,
          match_score: 0.5,
          reasons: ['Analyse automatique non disponible'],
          concerns: []
        }))
      };
    }

    // Appliquer les résultats aux offres
    return jobs.map((job, index) => {
      const analysis = analyses.analyses?.find((a: any) => a.job_index === index + 1);
      return {
        ...job,
        ai_match_score: analysis?.match_score || 0.5,
        ai_insights: {
          reasons: analysis?.reasons || [],
          concerns: analysis?.concerns || [],
          analyzed_at: new Date().toISOString()
        }
      };
    });

  } catch (error) {
    console.error('Error analyzing job batch:', error);
    // Retourner les offres avec scores par défaut
    return jobs.map(job => ({
      ...job,
      ai_match_score: 0.5,
      ai_insights: null
    }));
  }
}

function sortJobs(jobs: any[], sortBy: string, sortOrder: string): any[] {
  const multiplier = sortOrder === 'asc' ? 1 : -1;

  return jobs.sort((a, b) => {
    switch (sortBy) {
      case 'date':
        return multiplier * (new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
      case 'salary':
        const salaryA = a.salary_max || a.salary_min || 0;
        const salaryB = b.salary_max || b.salary_min || 0;
        return multiplier * (salaryB - salaryA);
      
      case 'match_score':
        const scoreA = a.ai_match_score || a.job_matches?.[0]?.score || 0;
        const scoreB = b.ai_match_score || b.job_matches?.[0]?.score || 0;
        return multiplier * (scoreB - scoreA);
      
      case 'relevance':
      default:
        // Combinaison de plusieurs facteurs pour la pertinence
        const relevanceA = calculateRelevanceScore(a);
        const relevanceB = calculateRelevanceScore(b);
        return multiplier * (relevanceB - relevanceA);
    }
  });
}

function calculateRelevanceScore(job: any): number {
  let score = 0;
  
  // Score IA (poids: 40%)
  if (job.ai_match_score) {
    score += job.ai_match_score * 0.4;
  }
  
  // Score de matching existant (poids: 30%)
  if (job.job_matches?.[0]?.score) {
    score += job.job_matches[0].score * 0.3;
  }
  
  // Fraîcheur de l'offre (poids: 20%)
  const daysSincePosted = (Date.now() - new Date(job.created_at).getTime()) / (1000 * 60 * 60 * 24);
  const freshnessScore = Math.max(0, 1 - daysSincePosted / 30); // Score diminue sur 30 jours
  score += freshnessScore * 0.2;
  
  // Complétude de l'offre (poids: 10%)
  let completenessScore = 0;
  if (job.description && job.description.length > 100) completenessScore += 0.3;
  if (job.salary_min && job.salary_max) completenessScore += 0.3;
  if (job.tags && job.tags.length > 0) completenessScore += 0.2;
  if (job.company_logo) completenessScore += 0.2;
  score += completenessScore * 0.1;
  
  return Math.min(1, score);
}
