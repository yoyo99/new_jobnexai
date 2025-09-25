// Version de debug ultra-simple pour diagnostiquer
exports.handler = async (event) => {
  try {
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: true,
        message: 'Fonction France Travail opérationnelle!',
        timestamp: new Date().toISOString(),
        query: event.queryStringParameters || {},
        mockData: [
          {
            id: 'mock-1',
            title: 'Développeur React/Node.js - Télétravail',
            company: 'TechCorp France',
            location: 'Paris, Île-de-France',
            isRemote: true
          }
        ]
      })
    }
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Erreur fonction',
        message: error.message
      })
    }
  }
}
