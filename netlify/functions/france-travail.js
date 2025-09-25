const { fetchAndNormalizeFranceTravailJobs, getMockFranceTravailJobs } = require('../../src/lib/franceTravailNormalizer')
const { saveFranceTravailOffers } = require('../../src/lib/franceTravailRepository')

const handler = async (event) => {
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
    const isRemote = params.isRemote === 'true'
    const limit = params.limit ? Number(params.limit) : 50
    const offset = params.offset ? Number(params.offset) : 0
    const useMock = params.mock === 'true'
    const save = params.save === 'true'

    let jobs

    if (useMock) {
      jobs = getMockFranceTravailJobs()
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
      body: JSON.stringify({
        success: false,
        error: 'Erreur lors de la récupération des offres France Travail',
        message,
        data: getMockFranceTravailJobs(),
      }),
    }
  }
}

exports.handler = handler
