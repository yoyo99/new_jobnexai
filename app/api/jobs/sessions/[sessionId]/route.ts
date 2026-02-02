import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

interface RouteParams {
  params: {
    sessionId: string;
  };
}

/**
 * GET /api/jobs/sessions/[sessionId]
 * Récupère les détails et les jobs d'une session de scraping
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { sessionId } = params;

    // Vérifier l'authentification
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Authentification requise' },
        { status: 401 }
      );
    }

    // Récupérer la session
    const { data: scrapingSession, error: sessionError } = await supabase
      .from('scraping_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('user_id', session.user.id)
      .single();

    if (sessionError || !scrapingSession) {
      return NextResponse.json(
        { error: 'Session non trouvée' },
        { status: 404 }
      );
    }

    // Récupérer les jobs de cette session
    const { data: jobs, error: jobsError } = await supabase
      .from('scraped_jobs')
      .select('*')
      .eq('session_id', sessionId)
      .order('posted_date', { ascending: false });

    if (jobsError) {
      console.error('Error fetching jobs:', jobsError);
      return NextResponse.json(
        { error: 'Erreur lors de la récupération des offres' },
        { status: 500 }
      );
    }

    // Statistiques par source
    const jobsBySource: Record<string, number> = {};
    for (const job of jobs || []) {
      const source = job.site_name || 'unknown';
      jobsBySource[source] = (jobsBySource[source] || 0) + 1;
    }

    return NextResponse.json({
      success: true,
      session: scrapingSession,
      jobs: jobs || [],
      stats: {
        totalJobs: jobs?.length || 0,
        bySource: jobsBySource
      }
    });

  } catch (error) {
    console.error('Error in session detail API:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/jobs/sessions/[sessionId]
 * Supprime une session de scraping et ses jobs associés
 */
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { sessionId } = params;

    // Vérifier l'authentification
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Authentification requise' },
        { status: 401 }
      );
    }

    // Vérifier que la session appartient à l'utilisateur
    const { data: scrapingSession, error: checkError } = await supabase
      .from('scraping_sessions')
      .select('id')
      .eq('id', sessionId)
      .eq('user_id', session.user.id)
      .single();

    if (checkError || !scrapingSession) {
      return NextResponse.json(
        { error: 'Session non trouvée ou non autorisée' },
        { status: 404 }
      );
    }

    // Supprimer les jobs associés
    await supabase
      .from('scraped_jobs')
      .delete()
      .eq('session_id', sessionId);

    // Supprimer la session
    const { error: deleteError } = await supabase
      .from('scraping_sessions')
      .delete()
      .eq('id', sessionId);

    if (deleteError) {
      console.error('Error deleting session:', deleteError);
      return NextResponse.json(
        { error: 'Erreur lors de la suppression' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Session supprimée avec succès'
    });

  } catch (error) {
    console.error('Error in session delete API:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
