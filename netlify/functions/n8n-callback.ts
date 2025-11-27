import type { Handler } from '@netlify/functions'

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json'
}

const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' }
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    }
  }

  try {
    const payload = JSON.parse(event.body || '{}')
    const { execution_id, status, user_id } = payload

    console.log('n8n callback received', { execution_id, status, user_id })

    if (status === 'completed' && user_id) {
      console.log(`Scraping completed for user ${user_id} (execution ${execution_id})`)
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ received: true })
    }
  } catch (error) {
    console.error('Failed to parse callback payload', error)
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Invalid payload' })
    }
  }
}

export { handler }
