import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const mammouthApiKey = Deno.env.get('MAMMOUTH_API_KEY')!

interface UserProfile {
  id: string
  skills: string[]
  experience_years: number
  preferred_locations: string[]
  preferred_salary_min?: number
  preferred_salary_max?: number
  job_types: string[]
  cv_content?: string
  preferences: any
}

interface JobOffer {
  id: string
  title: string
  company: string
  description: string
  location?: string
  salary_min?: number
  salary_max?: number
  contract_type?: string
  required_skills: string[]
  experience_required?: number
  created_at: string
}

interface MatchingScore {
  job_id: string
  user_id: string
  overall_score: number
  skills_score: number
  location_score: number
  salary_score: number
  experience_score: number
  description_score: number
  reasoning: string
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    if (req.method === 'POST') {
      const { action, userId, jobIds, limit = 20 } = await req.json()

      if (action === 'match_jobs') {
        // Matcher les offres pour un utilisateur spécifique
        const matches = await matchJobsForUser(userId, jobIds, limit)
        
        return new Response(
          JSON.stringify({ 
            success: true, 
            matches,
            message: `${matches.length} offres analysées et classées`
          }),
          { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      if (action === 'batch_matching') {
        // Matcher toutes les nouvelles offres pour tous les utilisateurs
        const results = await batchMatchAllUsers()
        
        return new Response(
          JSON.stringify({ 
            success: true, 
            results,
            message: `Matching effectué pour ${results.users_processed} utilisateurs`
          }),
          { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      if (action === 'analyze_job') {
        const { jobDescription, userProfile } = await req.json()
        
        // Analyser une offre spécifique avec l'IA
        const analysis = await analyzeJobWithAI(jobDescription, userProfile)
        
        return new Response(
          JSON.stringify({ 
            success: true, 
            analysis 
          }),
          { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }
    }

    if (req.method === 'GET') {
      const url = new URL(req.url)
      const userId = url.searchParams.get('userId')
      const action = url.searchParams.get('action')

      if (action === 'recommendations' && userId) {
        // Récupérer les recommandations pour un utilisateur
        const { data: matches, error } = await supabase
          .from('job_matches')
          .select(`
            *,
            job_offers(*)
          `)
          .eq('user_id', userId)
          .gte('overall_score', 0.6) // Score minimum de 60%
          .order('overall_score', { ascending: false })
          .limit(20)

        if (error) {
          return new Response(
            JSON.stringify({ error: error.message }),
            { 
              status: 500, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          )
        }

        return new Response(
          JSON.stringify({ recommendations: matches }),
          { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { 
        status: 405, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in AI job matching:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

async function matchJobsForUser(userId: string, jobIds?: string[], limit: number = 20): Promise<MatchingScore[]> {
  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  
  // Récupérer le profil utilisateur
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select(`
      *,
      user_skills(skill),
      user_preferences(*)
    `)
    .eq('id', userId)
    .single()

  if (profileError || !profile) {
    throw new Error('Profil utilisateur introuvable')
  }

  // Récupérer les offres d'emploi
  let jobsQuery = supabase
    .from('job_offers')
    .select('*')
    .order('created_at', { ascending: false })

  if (jobIds && jobIds.length > 0) {
    jobsQuery = jobsQuery.in('id', jobIds)
  } else {
    jobsQuery = jobsQuery.limit(limit)
  }

  const { data: jobs, error: jobsError } = await jobsQuery

  if (jobsError || !jobs) {
    throw new Error('Erreur lors de la récupération des offres')
  }

  // Calculer les scores de matching
  const matches: MatchingScore[] = []
  
  for (const job of jobs) {
    const score = await calculateMatchingScore(profile, job)
    matches.push(score)
    
    // Sauvegarder le score dans la base de données
    await supabase
      .from('job_matches')
      .upsert({
        user_id: userId,
        job_id: job.id,
        overall_score: score.overall_score,
        skills_score: score.skills_score,
        location_score: score.location_score,
        salary_score: score.salary_score,
        experience_score: score.experience_score,
        description_score: score.description_score,
        reasoning: score.reasoning,
        updated_at: new Date().toISOString()
      })
  }

  // Trier par score décroissant
  return matches.sort((a, b) => b.overall_score - a.overall_score)
}

async function calculateMatchingScore(userProfile: any, job: JobOffer): Promise<MatchingScore> {
  let skillsScore = 0
  let locationScore = 0
  let salaryScore = 0
  let experienceScore = 0
  let descriptionScore = 0

  // Score des compétences (40% du score total)
  const userSkills = userProfile.user_skills?.map((s: any) => s.skill.toLowerCase()) || []
  const jobSkills = job.required_skills?.map((s: string) => s.toLowerCase()) || []
  
  if (jobSkills.length > 0) {
    const matchingSkills = userSkills.filter((skill: string) => 
      jobSkills.some((jobSkill: string) => 
        jobSkill.includes(skill) || skill.includes(jobSkill)
      )
    )
    skillsScore = matchingSkills.length / jobSkills.length
  } else {
    skillsScore = 0.5 // Score neutre si pas de compétences spécifiées
  }

  // Score de localisation (20% du score total)
  const userLocations = userProfile.user_preferences?.preferred_locations || []
  if (job.location && userLocations.length > 0) {
    locationScore = userLocations.some((loc: string) => 
      job.location?.toLowerCase().includes(loc.toLowerCase())
    ) ? 1 : 0.3
  } else {
    locationScore = 0.7 // Score neutre
  }

  // Score de salaire (15% du score total)
  const userSalaryMin = userProfile.user_preferences?.preferred_salary_min
  const userSalaryMax = userProfile.user_preferences?.preferred_salary_max
  
  if (job.salary_min && job.salary_max && userSalaryMin) {
    if (job.salary_max >= userSalaryMin) {
      salaryScore = Math.min(job.salary_max / userSalaryMin, 2) / 2 // Normaliser entre 0 et 1
    } else {
      salaryScore = 0.2
    }
  } else {
    salaryScore = 0.6 // Score neutre
  }

  // Score d'expérience (15% du score total)
  const userExperience = userProfile.experience_years || 0
  const requiredExperience = job.experience_required || 0
  
  if (requiredExperience === 0) {
    experienceScore = 1
  } else if (userExperience >= requiredExperience) {
    experienceScore = 1
  } else {
    experienceScore = Math.max(0.2, userExperience / requiredExperience)
  }

  // Score de description avec IA (10% du score total)
  try {
    descriptionScore = await analyzeDescriptionMatch(userProfile, job)
  } catch (error) {
    console.error('Error analyzing description:', error)
    descriptionScore = 0.5
  }

  // Calcul du score global pondéré
  const overallScore = (
    skillsScore * 0.4 +
    locationScore * 0.2 +
    salaryScore * 0.15 +
    experienceScore * 0.15 +
    descriptionScore * 0.1
  )

  // Génération du raisonnement
  const reasoning = generateReasoning(skillsScore, locationScore, salaryScore, experienceScore, descriptionScore)

  return {
    job_id: job.id,
    user_id: userProfile.id,
    overall_score: Math.round(overallScore * 100) / 100,
    skills_score: Math.round(skillsScore * 100) / 100,
    location_score: Math.round(locationScore * 100) / 100,
    salary_score: Math.round(salaryScore * 100) / 100,
    experience_score: Math.round(experienceScore * 100) / 100,
    description_score: Math.round(descriptionScore * 100) / 100,
    reasoning
  }
}

async function analyzeDescriptionMatch(userProfile: any, job: JobOffer): Promise<number> {
  if (!mammouthApiKey) {
    return 0.5 // Score neutre si pas d'API key
  }

  const prompt = `
Analyse la compatibilité entre ce profil utilisateur et cette offre d'emploi.

PROFIL UTILISATEUR:
- Compétences: ${userProfile.user_skills?.map((s: any) => s.skill).join(', ') || 'Non spécifiées'}
- Expérience: ${userProfile.experience_years || 0} ans
- CV: ${userProfile.cv_content?.substring(0, 500) || 'Non disponible'}

OFFRE D'EMPLOI:
- Titre: ${job.title}
- Entreprise: ${job.company}
- Description: ${job.description.substring(0, 800)}

Donne un score de compatibilité entre 0 et 1 (format: 0.XX) basé sur:
- L'adéquation des compétences mentionnées
- La correspondance du niveau d'expérience
- L'alignement avec le profil général

Réponds uniquement avec le score numérique (ex: 0.75).
`

  try {
    const response = await fetch('https://api.mammouth.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${mammouthApiKey}`,
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 50,
      }),
    })

    const result = await response.json()
    const scoreText = result.choices?.[0]?.message?.content?.trim() || '0.5'
    const score = parseFloat(scoreText)
    
    return isNaN(score) ? 0.5 : Math.max(0, Math.min(1, score))
  } catch (error) {
    console.error('Error calling AI for description analysis:', error)
    return 0.5
  }
}

function generateReasoning(skillsScore: number, locationScore: number, salaryScore: number, experienceScore: number, descriptionScore: number): string {
  const reasons = []
  
  if (skillsScore >= 0.8) {
    reasons.push("Excellente correspondance des compétences")
  } else if (skillsScore >= 0.6) {
    reasons.push("Bonne correspondance des compétences")
  } else if (skillsScore < 0.4) {
    reasons.push("Compétences partiellement alignées")
  }
  
  if (locationScore >= 0.8) {
    reasons.push("Localisation idéale")
  } else if (locationScore < 0.5) {
    reasons.push("Localisation à considérer")
  }
  
  if (salaryScore >= 0.8) {
    reasons.push("Salaire attractif")
  } else if (salaryScore < 0.4) {
    reasons.push("Salaire en dessous des attentes")
  }
  
  if (experienceScore >= 0.8) {
    reasons.push("Niveau d'expérience parfait")
  } else if (experienceScore < 0.6) {
    reasons.push("Expérience à développer")
  }

  return reasons.join(" • ")
}

async function analyzeJobWithAI(jobDescription: string, userProfile: any): Promise<any> {
  // Analyse détaillée d'une offre avec l'IA
  const prompt = `
Analyse cette offre d'emploi pour l'utilisateur:

OFFRE: ${jobDescription}

PROFIL UTILISATEUR: ${JSON.stringify(userProfile, null, 2)}

Fournis une analyse détaillée incluant:
1. Points forts du match
2. Points d'amélioration
3. Recommandations
4. Score global sur 100

Format JSON:
{
  "strengths": ["point1", "point2"],
  "improvements": ["point1", "point2"], 
  "recommendations": ["rec1", "rec2"],
  "score": 85
}
`

  try {
    const response = await fetch('https://api.mammouth.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${mammouthApiKey}`,
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 1000,
      }),
    })

    const result = await response.json()
    const content = result.choices?.[0]?.message?.content || '{}'
    
    return JSON.parse(content)
  } catch (error) {
    console.error('Error analyzing job with AI:', error)
    return {
      strengths: ["Analyse non disponible"],
      improvements: ["Veuillez réessayer"],
      recommendations: ["Contactez le support"],
      score: 50
    }
  }
}

async function batchMatchAllUsers(): Promise<any> {
  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  
  // Récupérer tous les utilisateurs actifs
  const { data: users, error: usersError } = await supabase
    .from('profiles')
    .select('id')
    .eq('active', true)
    .limit(100) // Limiter pour éviter les timeouts

  if (usersError || !users) {
    throw new Error('Erreur lors de la récupération des utilisateurs')
  }

  let processedUsers = 0
  
  for (const user of users) {
    try {
      await matchJobsForUser(user.id, undefined, 10) // Limiter à 10 offres par utilisateur
      processedUsers++
    } catch (error) {
      console.error(`Error processing user ${user.id}:`, error)
    }
  }

  return {
    users_processed: processedUsers,
    total_users: users.length
  }
}
