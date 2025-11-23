import type { Handler, HandlerResponse } from '@netlify/functions'

const DEFAULT_TIMEOUT_MS = 120_000
const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json'
}

const handler: Handler = async (event): Promise<HandlerResponse> => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders, body: '' }
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    }
  }

  const webhookUrl = process.env.N8N_WEBHOOK_URL
  const apiKey = process.env.N8N_API_KEY
  const timeoutMs = Number(process.env.N8N_JOB_SEARCH_TIMEOUT_MS || process.env.N8N_TIMEOUT_MS || DEFAULT_TIMEOUT_MS)

  if (!webhookUrl) {
    console.error('❌ Missing N8N_WEBHOOK_URL environment variable')
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'N8N webhook URL not configured' })
    }
  }

  let payload: unknown
  try {
    payload = JSON.parse(event.body || '{}')
  } catch (error) {
    console.error('❌ Invalid JSON payload:', error)
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Invalid JSON payload' })
    }
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey ? { 'x-api-key': apiKey } : {})
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    })

    const rawBody = await response.text()
    const successBody = rawBody || '{}'

    if (!response.ok) {
      console.error('❌ n8n error response:', response.status, successBody)
      return {
        statusCode: response.status,
        headers: corsHeaders,
        body: JSON.stringify({ error: successBody || response.statusText })
      }
    }

    return {
      statusCode: response.status,
      headers: corsHeaders,
      body: successBody
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('❌ Error while calling n8n webhook:', message)

    const isAbort = message.includes('aborted') || message.includes('The user aborted')
    return {
      statusCode: isAbort ? 504 : 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: message })
    }
  } finally {
    clearTimeout(timeoutId)
  }
}

export { handler }
