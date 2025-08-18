import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const mammouthApiKey = Deno.env.get('MAMMOUTH_API_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface FreelanceSearchFilters {
  search?: string;
  location?: string;
  projectTypes?: string[];
  budgetMin?: number;
  budgetMax?: number;
  duration?: string;
  experienceLevel?: string;
  remote?: boolean | null;
  skills?: string[];
  sortBy?: 'relevance' | 'date' | 'budget' | 'match_score';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

interface FreelancerProfile {
  id: string;
  skills: string[];
  experience_level: string;
  preferred_location: string;
  hourly_rate: number;
  portfolio?: any;
  specializations: string[];
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

    // Récupérer le profil freelance de l'utilisateur
    const { data: freelancerProfile, error: profileError } = await supabase
      .from('freelancer_profiles')
      .select('*')
      .eq('user_id', user_id)
      .single();

    if (profileError) {
      console.error('Error fetching freelancer profile:', profileError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch freelancer profile' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Construire la requête de base pour les projets freelance
    let query = supabase
      .from('freelance_projects')
      .select(`
        *,
        project_matches!left(score, freelancer_id)
      `);

    // Appliquer les filtres de base
    if (filters.search) {
      query = query.or(`title.ilike.%${filters.search}%,client_company.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
    }

    if (filters.location) {
      query = query.ilike('location', `%${filters.location}%`);
    }

    if (filters.projectTypes && filters.projectTypes.length > 0) {
      query = query.in('project_type', filters.projectTypes);
    }

    if (filters.experienceLevel) {
      query = query.eq('required_experience_level', filters.experienceLevel);
    }

    if (filters.duration) {
      query = query.eq('duration', filters.duration);
    }

    if (filters.remote !== null && filters.remote !== undefined) {
      query = query.eq('is_remote', filters.remote);
    }

    if (filters.budgetMin) {
      query = query.gte('budget_min', filters.budgetMin);
    }

    if (filters.budgetMax) {
      query = query.lte('budget_max', filters.budgetMax);
    }

    // Filtrage par compétences
    if (filters.skills && filters.skills.length > 0) {
      const skillsFilter = filters.skills.map(skill => `required_skills.cs.{${skill}}`).join(',');
      query = query.or(skillsFilter);
    }

    // Filtrer les projets actifs uniquement
    query = query.eq('status', 'active');

    // Récupérer les projets
    const { data: projects, error: projectsError } = await query;

    if (projectsError) {
      console.error('Error fetching freelance projects:', projectsError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch freelance projects' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let processedProjects = projects || [];

    // Optimisation IA si demandée
    if (use_ai_optimization && processedProjects.length > 0) {
      processedProjects = await optimizeProjectsWithAI(processedProjects, freelancerProfile, filters);
    }

    // Tri des résultats
    processedProjects = sortProjects(processedProjects, filters.sortBy || 'relevance', filters.sortOrder || 'desc');

    // Pagination
    const limit = filters.limit || 20;
    const offset = filters.offset || 0;
    const paginatedProjects = processedProjects.slice(offset, offset + limit);

    // Statistiques
    const stats = {
      total: processedProjects.length,
      filtered: paginatedProjects.length,
      hasMore: offset + limit < processedProjects.length,
      averageMatchScore: processedProjects.reduce((acc, project) => acc + (project.ai_match_score || 0), 0) / processedProjects.length,
      averageBudget: processedProjects.reduce((acc, project) => acc + ((project.budget_min + project.budget_max) / 2 || 0), 0) / processedProjects.length
    };

    return new Response(
      JSON.stringify({
        projects: paginatedProjects,
        stats,
        filters: filters,
        freelancer_profile: {
          id: freelancerProfile.id,
          skills: freelancerProfile.skills || [],
          experience_level: freelancerProfile.experience_level,
          hourly_rate: freelancerProfile.hourly_rate,
          specializations: freelancerProfile.specializations || []
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in ai-freelance-search:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function optimizeProjectsWithAI(projects: any[], freelancerProfile: FreelancerProfile, filters: FreelanceSearchFilters): Promise<any[]> {
  try {
    // Préparer le contexte freelancer pour l'IA
    const freelancerContext = {
      skills: freelancerProfile.skills || [],
      experience_level: freelancerProfile.experience_level || '',
      hourly_rate: freelancerProfile.hourly_rate || 0,
      specializations: freelancerProfile.specializations || [],
      search_intent: filters.search || '',
      location_preference: filters.location || freelancerProfile.preferred_location || ''
    };

    // Analyser les projets par batch pour éviter les timeouts
    const batchSize = 5;
    const optimizedProjects = [];

    for (let i = 0; i < projects.length; i += batchSize) {
      const batch = projects.slice(i, i + batchSize);
      const batchResults = await analyzeProjectBatch(batch, freelancerContext);
      optimizedProjects.push(...batchResults);
    }

    return optimizedProjects;
  } catch (error) {
    console.error('Error in AI optimization:', error);
    // Retourner les projets sans optimisation en cas d'erreur
    return projects.map(project => ({ ...project, ai_match_score: 0.5, ai_insights: null }));
  }
}

async function analyzeProjectBatch(projects: any[], freelancerContext: any): Promise<any[]> {
  try {
    const prompt = `
Analysez ces projets freelance pour le freelancer suivant et calculez un score de pertinence (0-1):

Profil freelancer:
- Compétences: ${freelancerContext.skills.join(', ')}
- Niveau d'expérience: ${freelancerContext.experience_level}
- Taux horaire: ${freelancerContext.hourly_rate}€/h
- Spécialisations: ${freelancerContext.specializations.join(', ')}
- Recherche: "${freelancerContext.search_intent}"

Projets à analyser:
${projects.map((project, index) => `
${index + 1}. ${project.title} - ${project.client_company}
   - Budget: ${project.budget_min}-${project.budget_max}€
   - Durée: ${project.duration}
   - Type: ${project.project_type}
   - Remote: ${project.is_remote ? 'Oui' : 'Non'}
   - Compétences requises: ${project.required_skills?.join(', ') || 'Non spécifiées'}
   - Niveau requis: ${project.required_experience_level}
   - Description: ${project.description?.substring(0, 200)}...
`).join('\n')}

Pour chaque projet, retournez un JSON avec:
- project_index: index du projet (1-${projects.length})
- match_score: score de 0 à 1
- reasons: array des raisons principales du score
- concerns: array des points d'attention éventuels
- budget_compatibility: évaluation de la compatibilité budgétaire

Format de réponse: {"analyses": [{"project_index": 1, "match_score": 0.8, "reasons": ["..."], "concerns": ["..."], "budget_compatibility": "good"}]}
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
          { role: 'system', content: 'Vous êtes un expert en matching de projets freelance. Analysez objectivement la compatibilité entre freelancers et projets.' },
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
        analyses: projects.map((_, index) => ({
          project_index: index + 1,
          match_score: 0.5,
          reasons: ['Analyse automatique non disponible'],
          concerns: [],
          budget_compatibility: 'unknown'
        }))
      };
    }

    // Appliquer les résultats aux projets
    return projects.map((project, index) => {
      const analysis = analyses.analyses?.find((a: any) => a.project_index === index + 1);
      return {
        ...project,
        ai_match_score: analysis?.match_score || 0.5,
        ai_insights: {
          reasons: analysis?.reasons || [],
          concerns: analysis?.concerns || [],
          budget_compatibility: analysis?.budget_compatibility || 'unknown',
          analyzed_at: new Date().toISOString()
        }
      };
    });

  } catch (error) {
    console.error('Error analyzing project batch:', error);
    // Retourner les projets avec scores par défaut
    return projects.map(project => ({
      ...project,
      ai_match_score: 0.5,
      ai_insights: null
    }));
  }
}

function sortProjects(projects: any[], sortBy: string, sortOrder: string): any[] {
  const multiplier = sortOrder === 'asc' ? 1 : -1;

  return projects.sort((a, b) => {
    switch (sortBy) {
      case 'date':
        return multiplier * (new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
      case 'budget':
        const budgetA = (a.budget_max + a.budget_min) / 2 || 0;
        const budgetB = (b.budget_max + b.budget_min) / 2 || 0;
        return multiplier * (budgetB - budgetA);
      
      case 'match_score':
        const scoreA = a.ai_match_score || a.project_matches?.[0]?.score || 0;
        const scoreB = b.ai_match_score || b.project_matches?.[0]?.score || 0;
        return multiplier * (scoreB - scoreA);
      
      case 'relevance':
      default:
        // Combinaison de plusieurs facteurs pour la pertinence
        const relevanceA = calculateProjectRelevanceScore(a);
        const relevanceB = calculateProjectRelevanceScore(b);
        return multiplier * (relevanceB - relevanceA);
    }
  });
}

function calculateProjectRelevanceScore(project: any): number {
  let score = 0;
  
  // Score IA (poids: 40%)
  if (project.ai_match_score) {
    score += project.ai_match_score * 0.4;
  }
  
  // Score de matching existant (poids: 30%)
  if (project.project_matches?.[0]?.score) {
    score += project.project_matches[0].score * 0.3;
  }
  
  // Fraîcheur du projet (poids: 15%)
  const daysSincePosted = (Date.now() - new Date(project.created_at).getTime()) / (1000 * 60 * 60 * 24);
  const freshnessScore = Math.max(0, 1 - daysSincePosted / 14); // Score diminue sur 14 jours
  score += freshnessScore * 0.15;
  
  // Attractivité du budget (poids: 10%)
  const avgBudget = (project.budget_min + project.budget_max) / 2;
  const budgetScore = Math.min(1, avgBudget / 10000); // Normalisation sur 10k€
  score += budgetScore * 0.1;
  
  // Complétude du projet (poids: 5%)
  let completenessScore = 0;
  if (project.description && project.description.length > 100) completenessScore += 0.3;
  if (project.budget_min && project.budget_max) completenessScore += 0.3;
  if (project.required_skills && project.required_skills.length > 0) completenessScore += 0.2;
  if (project.duration) completenessScore += 0.2;
  score += completenessScore * 0.05;
  
  return Math.min(1, score);
}
