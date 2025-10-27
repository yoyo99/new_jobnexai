export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { type, message, details, timestamp } = req.body;

    // Log l'erreur pour debugging
    console.error('Error notification received:', {
      type,
      message,
      details,
      timestamp,
      userAgent: req.headers['user-agent'],
      ip: req.ip
    });

    // Retourne un succès pour que n8n sache que l'erreur a été reçue
    return res.status(200).json({
      success: true,
      message: 'Erreur reçue et loggée',
      error: {
        type: type || 'error',
        message: message || 'Une erreur est survenue',
        details: details || null,
        timestamp: timestamp || new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error in error-notification API:', error);
    return res.status(500).json({
      success: false,
      error: {
        type: 'error',
        message: 'Erreur interne du serveur',
        details: null,
        timestamp: new Date().toISOString()
      }
    });
  }
}
