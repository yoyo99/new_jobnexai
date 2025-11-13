import { Handler, HandlerResponse } from '@netlify/functions'

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
}

const handler: Handler = async (event): Promise<HandlerResponse> => {
  // Gère les requêtes OPTIONS pour CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: '',
    }
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    }
  }

  try {
    const body = JSON.parse(event.body || '{}')

    // Récupère l'URL du webhook n8n depuis les variables d'environnement
    const webhookUrl = process.env.N8N_WEBHOOK_URL

    if (!webhookUrl) {
      console.error('❌ N8N_WEBHOOK_URL not configured')
      return {
        statusCode: 500,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'N8N_WEBHOOK_URL not configured' }),
      }
    }

    console.log('🚀 Forwarding request to n8n webhook:', webhookUrl)
    console.log('📦 Payload:', body)

    // Envoie la requête au webhook n8n avec timeout de 5 minutes
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5 * 60 * 1000) // 5 minutes

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    console.log('📡 n8n Response status:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ n8n Error response:', errorText)
      return {
        statusCode: response.status,
        headers: corsHeaders,
        body: JSON.stringify({
          error: `n8n webhook error: ${response.status} ${response.statusText}`,
        }),
      }
    }

    const data = await response.json()
    console.log('✅ n8n Response:', data)

    // Retourne la réponse du webhook n8n au frontend
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify(data),
    }
  } catch (error) {
    console.error('❌ Error in job_suggestion function:', error)
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
    }
  }
}

export { handler }
