import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Récupère l'URL du webhook n8n depuis les variables d'environnement
    const webhookUrl = process.env.N8N_WEBHOOK_URL

    if (!webhookUrl) {
      console.error('❌ N8N_WEBHOOK_URL not configured')
      return NextResponse.json(
        { error: 'N8N_WEBHOOK_URL not configured' },
        { status: 500 }
      )
    }

    console.log('🚀 Forwarding request to n8n webhook:', webhookUrl)
    console.log('📦 Payload:', body)

    // Envoie la requête au webhook n8n
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(300000), // 5 minutes timeout
    })

    console.log('📡 n8n Response status:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ n8n Error response:', errorText)
      return NextResponse.json(
        { error: `n8n webhook error: ${response.status} ${response.statusText}` },
        { status: response.status }
      )
    }

    const data = await response.json()
    console.log('✅ n8n Response:', data)

    // Retourne la réponse du webhook n8n au frontend
    return NextResponse.json(data, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    })
  } catch (error) {
    console.error('❌ Error in job_suggestion API:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function OPTIONS(request: NextRequest) {
  return NextResponse.json(
    {},
    {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    }
  )
}
