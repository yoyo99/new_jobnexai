import { getFranceTravailClient } from './franceTravailClient'

export interface NormalizedJobOffer {
  id: string
  title: string
  company?: string
  location?: string
  contractType?: string[]
  skills: string[]
  salaryRange?: string
  isRemote: boolean
  description: string
  url: string
  source: 'france_travail'
  lastScrapedAt: string
  createdAt: string
}

// Mapping des types de contrat France Travail → JobNexAI
const CONTRACT_TYPE_MAPPING: Record<string, string> = {
  'CDI': 'CDI',
  'CDD': 'CDD',
  'INTERIM': 'Intérim',
  'STAGE': 'Stage',
  'ALTERNANCE': 'Alternance',
  'FREELANCE': 'Freelance',
  'SAISONNIER': 'Saisonnier',
}

// Mapping des niveaux d'expérience
const EXPERIENCE_MAPPING: Record<string, string> = {
  'D': 'Débutant',
  'E': 'Expérimenté',
  'C': 'Confirmé',
  'S': 'Senior',
}

function extractSkills(description: string, title: string): string[] {
  const text = `${title} ${description}`.toLowerCase()

  // Compétences techniques courantes
  const techSkills = [
    'javascript', 'typescript', 'react', 'node.js', 'python', 'java', 'php',
    'sql', 'mongodb', 'postgresql', 'mysql', 'docker', 'kubernetes', 'aws',
    'azure', 'gcp', 'git', 'agile', 'scrum', 'devops', 'ci/cd', 'rest', 'api',
    'html', 'css', 'sass', 'less', 'webpack', 'vite', 'next.js', 'nuxt.js',
    'vue.js', 'angular', 'svelte', 'express', 'fastapi', 'django', 'flask',
    'spring', 'laravel', 'symfony', 'wordpress', 'shopify', 'magento'
  ]

  const foundSkills = techSkills.filter(skill =>
    text.includes(skill.toLowerCase())
  )

  // Extraire des mots-clés du titre et description
  const words = [...title.split(' '), ...description.split(' ')]
    .map(word => word.toLowerCase().replace(/[^\w]/g, ''))
    .filter(word => word.length > 3 && !['avec', 'dans', 'pour', 'sur', 'les', 'des', 'une', 'mais', 'dont', 'être', 'avoir'].includes(word))

  const uniqueSkills = [...new Set([...foundSkills, ...words.slice(0, 10)])]
  return uniqueSkills.slice(0, 15) // Limiter à 15 compétences max
}

function normalizeLocation(location?: {
  commune?: string
  departement?: string
  region?: string
  pays?: string
}): string | undefined {
  if (!location) return undefined

  const parts = [
    location.commune,
    location.departement,
    location.region,
    location.pays
  ].filter(Boolean)

  return parts.length > 0 ? parts.join(', ') : undefined
}

function normalizeSalary(salaire?: {
  libelle?: string
  commentaire?: string
  complement1?: string
  complement2?: string
}): string | undefined {
  if (!salaire) return undefined

  const parts = [
    salaire.libelle,
    salaire.commentaire,
    salaire.complement1,
    salaire.complement2
  ].filter(Boolean)

  return parts.length > 0 ? parts.join(' ') : undefined
}

function normalizeContractType(typeContrat?: string): string[] {
  if (!typeContrat) return []

  const normalized = CONTRACT_TYPE_MAPPING[typeContrat] || typeContrat
  return [normalized]
}

export async function fetchAndNormalizeFranceTravailJobs(params: {
  motsCles?: string
  location?: string
  contractType?: string[]
  experience?: string[]
  salaryMin?: number
  isRemote?: boolean
  limit?: number
  offset?: number
}): Promise<NormalizedJobOffer[]> {
  const client = getFranceTravailClient()

  try {
    const response = await client.searchJobs({
      motsCles: params.motsCles,
      commune: params.location,
      typeContrat: params.contractType,
      experience: params.experience,
      salaireMin: params.salaryMin,
      teletravail: params.isRemote,
      limit: params.limit || 50,
      offset: params.offset || 0,
    })

    if (!response || !response.resultats) {
      console.warn('[France Travail] Pas de résultats dans la réponse')
      return []
    }

    const offers = response.resultats.map((rawOffer: any) => {
      const location = normalizeLocation(rawOffer.lieuTravail)
      const salaryRange = normalizeSalary(rawOffer.salaire)
      const skills = extractSkills(rawOffer.intitule || '', rawOffer.description || '')

      return {
        id: rawOffer.id,
        title: rawOffer.intitule || 'Titre non spécifié',
        company: rawOffer.entreprise?.nom || rawOffer.entreprise?.raisonSociale,
        location,
        contractType: normalizeContractType(rawOffer.typeContrat),
        skills,
        salaryRange,
        isRemote: rawOffer.lieuTravail?.libelle.includes('Télétravail') || false,
        description: rawOffer.description || rawOffer.intitule || '',
        url: `${client['config'].baseUrl}/partenaire/offresdemploiv2/offre/${rawOffer.id}`,
        source: 'france_travail' as const,
        lastScrapedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      }
    })

    console.log(`[France Travail] ${offers.length} offres normalisées`)
    return offers

  } catch (error) {
    console.error('[France Travail] Erreur lors de la récupération:', error)
    throw error
  }
}

// Fonction utilitaire pour tester l'API avec des données mockées
export function getMockFranceTravailJobs(): NormalizedJobOffer[] {
  return [
    {
      id: 'mock-001',
      title: 'Développeur React Senior',
      company: 'TechCorp',
      location: 'Paris, France',
      contractType: ['CDI'],
      skills: ['react', 'javascript', 'typescript', 'node.js'],
      salaryRange: '45k€ - 55k€',
      isRemote: true,
      description: 'Nous recherchons un développeur React expérimenté pour rejoindre notre équipe...',
      url: 'https://api.francetravail.io/partenaire/offresdemploiv2/offre/mock-001',
      source: 'france_travail',
      lastScrapedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    },
    {
      id: 'mock-002',
      title: 'Data Scientist Python',
      company: 'DataTech',
      location: 'Lyon, France',
      contractType: ['CDD'],
      skills: ['python', 'machine learning', 'pandas', 'scikit-learn'],
      salaryRange: '40k€ - 50k€',
      isRemote: false,
      description: 'Projet de 12 mois sur l\'analyse de données clients...',
      url: 'https://api.francetravail.io/partenaire/offresdemploiv2/offre/mock-002',
      source: 'france_travail',
      lastScrapedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    }
  ]
}
