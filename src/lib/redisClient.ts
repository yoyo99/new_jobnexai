import Redis, { Redis as RedisInstance } from 'ioredis'

let client: RedisInstance | null = null

function createRedisClient(): RedisInstance {
  const redisUrl = process.env.REDIS_URL

  if (!redisUrl) {
    throw new Error('REDIS_URL doit être défini pour utiliser Redis')
  }

  const redis = new Redis(redisUrl, {
    maxRetriesPerRequest: 2,
    enableReadyCheck: false,
    lazyConnect: true,
  })

  redis.on('error', (error) => {
    console.error('[Redis] Erreur de connexion:', error)
  })

  redis.on('connect', () => {
    console.log('[Redis] Connecté')
  })

  return redis
}

export function getRedisClient(): RedisInstance | null {
  if (client) {
    return client
  }

  try {
    client = createRedisClient()
    return client
  } catch (error) {
    console.warn('[Redis] Client non initialisé:', error)
    return null
  }
}
