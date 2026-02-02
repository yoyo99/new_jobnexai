import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// Configuration N8N
const N8N_BASE_URL = process.env.N8N_URL || process.env.VITE_N8N_URL || 'https://n8n.jobnexai.com';

// Types
type JobSource = 'indeed' | 'linkedin' | 'malt' | 'free-work' | 'wttj';

interface SearchRequest {
  query: string;
  location?: string;
  contractType?: 'all' | 'cdi' | 'cdd' | 'freelance' | 'stage' | 'alternance';
  experienceLevel?: 'all' | 'junior' | 'confirme' | 'senior' | 'lead';
  remote?: boolean;
  salaryMin?: number;
  salaryMax?: number;
  maxResults?: number;
  selectedSites?: JobSource[];
  returnFormat?: 'html' | 'json';
}

/**
 * POST /api/jobs/search
 * Déclenche une recherche multi-source de jobs via n8n
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    // Vérifier l'authentification (optionnel mais recommandé)
    const { data: { session } } = await supabase.auth.getSession();

    const body: SearchRequest = await request.json();

    // Validation des champs requis
    if (!body.query || body.query.trim() === '') {
      return NextResponse.json(
        { error: 'Le champ "query" est requis' },
        { status: 400 }
      );
    }

    // Préparer le payload pour n8n
    const payload = {
      query: body.query.trim(),
      location: body.location || 'France',
      contract_type: body.contractType || 'all',
      experience_level: body.experienceLevel || 'all',
      remote: body.remote || false,
      salary_min: body.salaryMin || null,
      salary_max: body.salaryMax || null,
      max_results: Math.min(body.maxResults || 20, 100), // Max 100 résultats
      selected_sites: body.selectedSites || ['indeed', 'linkedin', 'malt', 'free-work', 'wttj'],
      user_id: session?.user?.id || null,
      user_email: session?.user?.email || null
    };

    // Appeler le webhook n8n
    const n8nResponse = await fetch(`${N8N_BASE_URL}/webhook/job-search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    if (!n8nResponse.ok) {
      console.error('N8N webhook error:', n8nResponse.status, n8nResponse.statusText);
      return NextResponse.json(
        { error: 'Erreur lors de la recherche. Veuillez réessayer.' },
        { status: 502 }
      );
    }

    const contentType = n8nResponse.headers.get('content-type');
    const sessionId = n8nResponse.headers.get('X-Session-Id');
    const totalJobs = n8nResponse.headers.get('X-Total-Jobs');

    // Si le format demandé est JSON ou si n8n retourne du JSON
    if (body.returnFormat === 'json' || contentType?.includes('application/json')) {
      const data = await n8nResponse.json();
      return NextResponse.json({
        success: true,
        sessionId: data.session_id || sessionId,
        totalJobs: data.total_jobs || parseInt(totalJobs || '0', 10),
        jobsBySource: data.jobs_by_source || {},
        jobs: data.jobs || [],
        html: data.html || null
      });
    }

    // Par défaut, retourner le HTML directement
    const html = await n8nResponse.text();

    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'X-Session-Id': sessionId || '',
        'X-Total-Jobs': totalJobs || '0'
      }
    });

  } catch (error) {
    console.error('Error in job search API:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/jobs/search
 * Retourne les sites de scraping disponibles et leurs caractéristiques
 */
export async function GET() {
  const sources = {
    'indeed': {
      name: 'Indeed',
      category: 'cdi_cdd',
      description: 'Agrégateur d\'offres d\'emploi - CDI/CDD',
      icon: 'briefcase'
    },
    'linkedin': {
      name: 'LinkedIn Jobs',
      category: 'cdi_cdd',
      description: 'Réseau professionnel mondial - CDI/CDD',
      icon: 'linkedin'
    },
    'malt': {
      name: 'Malt',
      category: 'freelance',
      description: 'Plateforme freelance française #2',
      icon: 'user'
    },
    'free-work': {
      name: 'Free-Work',
      category: 'freelance',
      description: 'Plateforme freelance française #1',
      icon: 'code'
    },
    'wttj': {
      name: 'Welcome to the Jungle',
      category: 'cdi_cdd',
      description: 'Startups et tech français',
      icon: 'rocket'
    }
  };

  const contractTypes = [
    { value: 'all', label: 'Tous les types' },
    { value: 'cdi', label: 'CDI' },
    { value: 'cdd', label: 'CDD' },
    { value: 'freelance', label: 'Freelance / Mission' },
    { value: 'stage', label: 'Stage' },
    { value: 'alternance', label: 'Alternance' }
  ];

  const experienceLevels = [
    { value: 'all', label: 'Tous niveaux' },
    { value: 'junior', label: 'Junior (0-2 ans)' },
    { value: 'confirme', label: 'Confirmé (3-5 ans)' },
    { value: 'senior', label: 'Senior (6-10 ans)' },
    { value: 'lead', label: 'Lead/Expert (10+ ans)' }
  ];

  return NextResponse.json({
    sources,
    contractTypes,
    experienceLevels,
    defaultLocation: 'France',
    maxResults: {
      default: 20,
      max: 100
    }
  });
}
