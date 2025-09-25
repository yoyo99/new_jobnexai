// Mock des données France Travail pour test
const getMockFranceTravailJobs = () => [
  {
    id: 'mock-1',
    title: 'Développeur React/Node.js - Télétravail',
    company: 'TechCorp France',
    location: 'Paris, Île-de-France',
    contractType: ['CDI'],
    salary: '45000-55000',
    description: 'Recherche développeur Full Stack pour projet e-commerce. Stack: React, Node.js, PostgreSQL.',
    skills: ['React', 'Node.js', 'PostgreSQL', 'TypeScript'],
    isRemote: true,
    publishedAt: new Date().toISOString(),
    url: 'https://candidat.francetravail.fr/offres/mock-1'
  },
  {
    id: 'mock-2', 
    title: 'Chef de projet digital - Secteur bancaire',
    company: 'BankTech Solutions',
    location: 'Lyon, Auvergne-Rhône-Alpes',
    contractType: ['CDI'],
    salary: '50000-65000',
    description: 'Management équipe projet transformation digitale banque. Expérience Agile requise.',
    skills: ['Management', 'Agile', 'Transformation digitale', 'Finance'],
    isRemote: false,
    publishedAt: new Date().toISOString(),
    url: 'https://candidat.francetravail.fr/offres/mock-2'
  },
  {
    id: 'mock-3',
    title: 'Développeur Python/Django - Remote',
    company: 'DataCorp Innovation',
    location: 'Marseille, Provence-Alpes-Côte d\'Azur',
    contractType: ['CDI'],
    salary: '40000-50000',
    description: 'Développement applications web Python/Django. Data science et machine learning.',
    skills: ['Python', 'Django', 'PostgreSQL', 'Data Science'],
    isRemote: true,
    publishedAt: new Date().toISOString(),
    url: 'https://candidat.francetravail.fr/offres/mock-3'
  }
]

// Stub pour éviter les erreurs d'imports
const fetchAndNormalizeFranceTravailJobs = async () => {
  throw new Error('Fonction API France Travail non disponible. Utilisez ?mock=true')
}

const saveFranceTravailOffers = async () => {
  console.log('Sauvegarde désactivée en mode test')
}

exports.handler = async (event) => {
  try {
    const params = event.queryStringParameters || {}

    const motsCles = params.motsCles || undefined
    const location = params.location || undefined
    const contractType = Array.isArray(params.contractType)
      ? params.contractType
      : params.contractType
        ? [params.contractType]
        : undefined
    const experience = Array.isArray(params.experience)
      ? params.experience
      : params.experience
        ? [params.experience]
        : undefined
    const salaryMin = params.salaryMin ? Number(params.salaryMin) : undefined
    const isRemote = params.isRemote === 'true' ? true : params.isRemote === 'false' ? false : undefined
    const limit = params.limit ? Number(params.limit) : 50
    const offset = params.offset ? Number(params.offset) : 0
    const useMock = params.mock === 'true'
    const save = params.save === 'true'

    let jobs

    if (useMock) {
      jobs = getMockFranceTravailJobs()
      
      // Filtrer selon les paramètres pour simuler une vraie API
      if (motsCles) {
        jobs = jobs.filter(job => 
          job.title.toLowerCase().includes(motsCles.toLowerCase()) ||
          job.description.toLowerCase().includes(motsCles.toLowerCase()) ||
          job.skills.some(skill => skill.toLowerCase().includes(motsCles.toLowerCase()))
        )
      }
      
      if (location) {
        jobs = jobs.filter(job => 
          job.location.toLowerCase().includes(location.toLowerCase())
        )
      }
      
      if (isRemote !== undefined) {
        jobs = jobs.filter(job => job.isRemote === isRemote)
      }
      
      if (contractType && contractType.length > 0) {
        jobs = jobs.filter(job => 
          job.contractType.some(type => contractType.includes(type))
        )
      }
      
      if (salaryMin) {
        jobs = jobs.filter(job => {
          const minSalary = parseInt(job.salary.split('-')[0])
          return minSalary >= salaryMin
        })
      }
      
      // Appliquer limit et offset
      jobs = jobs.slice(offset, offset + limit)
    } else {
      jobs = await fetchAndNormalizeFranceTravailJobs({
        motsCles,
        location,
        contractType,
        experience,
        salaryMin,
        isRemote,
        limit,
        offset,
      })

      if (save) {
        await saveFranceTravailOffers(jobs)
      }
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: true,
        data: jobs,
        metadata: {
          count: jobs.length,
          source: 'france_travail',
          params: {
            motsCles,
            location,
            contractType,
            experience,
            salaryMin,
            isRemote,
            limit,
            offset,
            mock: useMock,
            save,
          },
          timestamp: new Date().toISOString(),
        },
      }),
    }
  } catch (error) {
    console.error('[Netlify][France Travail] Erreur:', error)

    const message = error instanceof Error ? error.message : 'Erreur inconnue'

    if (message.includes('OAuth2')) {
      return {
        statusCode: 401,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          success: false,
          error: "Erreur d'authentification France Travail",
          message,
          suggestion: 'Utilisez ?mock=true pour tester avec des données fictives',
          data: getMockFranceTravailJobs(),
        }),
      }
    }

    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: false,
        error: 'Erreur lors de la récupération des offres France Travail',
        message,
        data: getMockFranceTravailJobs(),
      }),
    }
  }
}
