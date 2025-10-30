/**
 * Netlify Function - Error Notification Handler
 * Reçoit les erreurs du workflow N8N et les enregistre
 */

exports.handler = async (event) => {
  // Vérifier la méthode HTTP
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    // Parser le body
    let errorData;
    try {
      errorData = JSON.parse(event.body);
    } catch (e) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid JSON body' }),
      };
    }

    // Log l'erreur avec contexte complet
    const errorLog = {
      timestamp: new Date().toISOString(),
      source: 'n8n-workflow',
      workflow: errorData.workflow || 'unknown',
      node: errorData.node || 'unknown',
      error: errorData.error || 'Unknown error',
      details: errorData.details || null,
      userId: errorData.userId || null,
      severity: errorData.severity || 'error', // 'error', 'warning', 'info'
    };

    // Log dans la console (visible dans Netlify logs)
    console.error('[N8N Workflow Error]', JSON.stringify(errorLog, null, 2));

    // Optionnel : Envoyer à un service de monitoring (Sentry, etc.)
    if (process.env.SENTRY_DSN) {
      // Intégration Sentry future
      console.log('[Sentry] Error would be sent here');
    }

    // Répondre avec succès
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        success: true,
        message: 'Erreur enregistrée avec succès',
        errorId: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      }),
    };
  } catch (error) {
    console.error('[Error Notification Handler] Unexpected error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Internal server error',
        message: error.message,
      }),
    };
  }
};
