// N8N Workflow Code: Redis Cache
// Ce code prépare les données pour la sauvegarde Redis

// Récupérer les données du nœud précédent
const scraperData = $json;

// Créer la clé de cache
const cacheKey = `scraping:indeed:${Buffer.from(scraperData.query + scraperData.location).toString('base64')}`;

// Préparer les données à sauvegarder
const cacheData = {
  ...scraperData,
  cached_at: new Date().toISOString(),
  expires_in: 1800 // 30 minutes
};

// Configuration pour l'appel Redis via l'API
const redisPayload = {
  key: cacheKey,
  value: JSON.stringify(cacheData),
  ttl: 1800
};

console.log(`💾 Caching to Redis: ${cacheKey}`);

return {
  redis_payload: redisPayload,
  original_data: scraperData
};
