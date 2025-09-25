exports.handler = async (event) => {
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify({
      success: true,
      message: 'Fonction Netlify opérationnelle!',
      timestamp: new Date().toISOString(),
      method: event.httpMethod,
      path: event.path,
      query: event.queryStringParameters
    })
  }
}
