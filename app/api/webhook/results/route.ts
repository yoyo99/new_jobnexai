import { NextRequest, NextResponse } from 'next/server'

import { getSupabaseServiceRoleClient } from '@/lib/supabaseServiceRoleClient'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
}

export async function OPTIONS() {
  return new NextResponse(null, { headers: corsHeaders })
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json()
    const { execution_id, status, user_id } = payload || {}

    console.log('n8n scraping callback payload', { execution_id, status, user_id })

    if (!user_id) {
      return NextResponse.json(
        { error: 'Le champ "user_id" est requis' },
        { status: 400, headers: corsHeaders }
      )
    }

    const supabase = getSupabaseServiceRoleClient()

    if (execution_id) {
      const { error: updateError } = await supabase
        .from('scraping_history')
        .update({ status: status || 'completed', updated_at: new Date().toISOString() })
        .eq('execution_id', execution_id)
        .eq('user_id', user_id)

      if (updateError) {
        console.warn('Impossible de mettre à jour scraping_history', updateError.message)
      } else {
        console.log(`scraping_history mis à jour pour ${execution_id}`)
      }
    } else {
      console.log('Aucun execution_id fourni, le statut est simplement loggé')
    }

    return NextResponse.json({ received: true }, { headers: corsHeaders })
  } catch (error) {
    console.error('Erreur lors de la réception du webhook n8n', error)
    return NextResponse.json(
      { error: 'Payload invalide' },
      { status: 400, headers: corsHeaders }
    )
  }
}
