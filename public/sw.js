// JobNexAI Service Worker
// Implements advanced caching strategies for optimal performance

const CACHE_NAME = 'jobnexai-v1.0.1'
const STATIC_CACHE = 'jobnexai-static-v1.0.1'
const DYNAMIC_CACHE = 'jobnexai-dynamic-v1.0.1'
const API_CACHE = 'jobnexai-api-v1.0.1'
const IMAGE_CACHE = 'jobnexai-images-v1.0.1'

// Static assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  // Add critical CSS and JS files
  '/src/index.css'
]

// Cache strategies configuration
const CACHE_STRATEGIES = {
  static: {
    cacheName: STATIC_CACHE,
    strategy: 'cache-first',
    maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
  },
  api: {
    cacheName: API_CACHE,
    strategy: 'network-first',
    maxAgeSeconds: 60 * 5, // 5 minutes
    maxEntries: 100
  },
  images: {
    cacheName: IMAGE_CACHE,
    strategy: 'cache-first',
    maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
    maxEntries: 50
  },
  dynamic: {
    cacheName: DYNAMIC_CACHE,
    strategy: 'network-first',
    maxAgeSeconds: 60 * 60, // 1 hour
    maxEntries: 200
  }
}

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing Service Worker...')
  
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE).then(cache => {
        console.log('[SW] Pre-caching static assets')
        return cache.addAll(STATIC_ASSETS)
      }),
      self.skipWaiting()
    ])
  )
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Service Worker...')
  
  event.waitUntil(
    Promise.all([
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            // Delete old caches
            if (!Object.values(CACHE_STRATEGIES).some(strategy => strategy.cacheName === cacheName) && 
                cacheName !== CACHE_NAME) {
              console.log('[SW] Deleting old cache:', cacheName)
              return caches.delete(cacheName)
            }
          })
        )
      }),
      self.clients.claim()
    ])
  )
})

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return
  }

  // Skip chrome-extension and other non-http(s) requests
  if (!url.protocol.startsWith('http')) {
    return
  }

  event.respondWith(handleRequest(request))
})

// Main request handler with strategy selection
async function handleRequest(request) {
  const url = new URL(request.url)
  
  try {
    // API requests - Network first with cache fallback
    if (url.pathname.startsWith('/api/') || url.hostname.includes('supabase')) {
      return await networkFirstStrategy(request, CACHE_STRATEGIES.api)
    }
    
    // Image requests - Cache first
    if (request.destination === 'image' || /\.(jpg|jpeg|png|gif|webp|svg|ico)$/i.test(url.pathname)) {
      return await cacheFirstStrategy(request, CACHE_STRATEGIES.images)
    }
    
    // Static assets - NETWORK FIRST for JS/CSS to always pick the latest build
    if (url.pathname.match(/\.(js|css)$/)) {
      return await networkFirstStrategy(request, CACHE_STRATEGIES.static)
    }
    // Fonts and others - Cache first
    if (url.pathname.match(/\.(woff|woff2|ttf|eot)$/)) {
      return await cacheFirstStrategy(request, CACHE_STRATEGIES.static)
    }
    
    // HTML pages - Network first with cache fallback
    if (request.destination === 'document' || url.pathname.endsWith('.html') || !url.pathname.includes('.')) {
      return await networkFirstStrategy(request, CACHE_STRATEGIES.dynamic)
    }
    
    // Default to network first
    return await networkFirstStrategy(request, CACHE_STRATEGIES.dynamic)
    
  } catch (error) {
    console.error('[SW] Error handling request:', error)
    
    // Return offline fallback for navigation requests
    if (request.destination === 'document') {
      return await getOfflineFallback()
    }
    
    throw error
  }
}

// Cache first strategy - good for static assets
async function cacheFirstStrategy(request, config) {
  const cache = await caches.open(config.cacheName)
  const cachedResponse = await cache.match(request)
  
  if (cachedResponse) {
    // Check if cache is still fresh
    const cacheTime = await getCacheTime(cache, request)
    if (cacheTime && (Date.now() - cacheTime < config.maxAgeSeconds * 1000)) {
      return cachedResponse
    }
  }
  
  try {
    const networkResponse = await fetch(request)
    
    if (networkResponse.ok) {
      // Clone response before caching
      const responseClone = networkResponse.clone()
      await cache.put(request, responseClone)
      await setCacheTime(cache, request)
      await limitCacheEntries(cache, config.maxEntries)
    }
    
    return networkResponse
  } catch (error) {
    // Return cached version if network fails
    if (cachedResponse) {
      return cachedResponse
    }
    throw error
  }
}

// Network first strategy - good for API calls and dynamic content
async function networkFirstStrategy(request, config) {
  const cache = await caches.open(config.cacheName)
  
  try {
    const networkResponse = await fetch(request)
    
    if (networkResponse.ok) {
      // Clone response before caching
      const responseClone = networkResponse.clone()
      await cache.put(request, responseClone)
      await setCacheTime(cache, request)
      await limitCacheEntries(cache, config.maxEntries)
    }
    
    return networkResponse
  } catch (error) {
    // Fallback to cache if network fails
    const cachedResponse = await cache.match(request)
    
    if (cachedResponse) {
      console.log('[SW] Serving from cache (network failed):', request.url)
      return cachedResponse
    }
    
    throw error
  }
}

// Offline fallback page
async function getOfflineFallback() {
  const cache = await caches.open(STATIC_CACHE)
  const offlineResponse = await cache.match('/offline.html')
  
  if (offlineResponse) {
    return offlineResponse
  }
  
  // Create basic offline response
  return new Response(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>JobNexAI - Offline</title>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style>
        body { font-family: Arial, sans-serif; padding: 2rem; text-align: center; background: #181c24; color: white; }
        .container { max-width: 400px; margin: 0 auto; }
        .icon { font-size: 4rem; margin-bottom: 1rem; }
        h1 { color: #7c3aed; margin-bottom: 1rem; }
        p { margin-bottom: 2rem; line-height: 1.6; }
        button { background: #7c3aed; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 0.5rem; cursor: pointer; }
        button:hover { background: #6d28d9; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="icon">🌐</div>
        <h1>You're offline</h1>
        <p>No internet connection detected. Please check your connection and try again.</p>
        <button onclick="window.location.reload()">Try Again</button>
      </div>
    </body>
    </html>
  `, {
    headers: { 'Content-Type': 'text/html' }
  })
}

// Cache time management
async function setCacheTime(cache, request) {
  const timeKey = `${request.url}:timestamp`
  const timeResponse = new Response(Date.now().toString())
  await cache.put(timeKey, timeResponse)
}

async function getCacheTime(cache, request) {
  const timeKey = `${request.url}:timestamp`
  const timeResponse = await cache.match(timeKey)
  
  if (timeResponse) {
    const timeText = await timeResponse.text()
    return parseInt(timeText, 10)
  }
  
  return null
}

// Limit cache entries to prevent unlimited growth
async function limitCacheEntries(cache, maxEntries) {
  if (!maxEntries) return
  
  const keys = await cache.keys()
  
  if (keys.length > maxEntries) {
    // Remove oldest entries (simple FIFO)
    const entriesToDelete = keys.slice(0, keys.length - maxEntries)
    
    await Promise.all(
      entriesToDelete.map(key => cache.delete(key))
    )
  }
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync triggered:', event.tag)
  
  if (event.tag === 'job-application-sync') {
    event.waitUntil(syncJobApplications())
  }
  
  if (event.tag === 'profile-update-sync') {
    event.waitUntil(syncProfileUpdates())
  }
})

// Push notifications
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received')
  
  const options = {
    body: event.data ? event.data.text() : 'New notification from JobNexAI',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'view',
        title: 'View',
        icon: '/icons/view-icon.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/icons/close-icon.png'
      }
    ]
  }
  
  event.waitUntil(
    self.registration.showNotification('JobNexAI', options)
  )
})

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.action)
  
  event.notification.close()
  
  if (event.action === 'view') {
    event.waitUntil(
      clients.openWindow('/app/dashboard')
    )
  }
})

// Sync functions
async function syncJobApplications() {
  try {
    // Get offline job applications from IndexedDB
    const applications = await getOfflineJobApplications()
    
    if (applications.length > 0) {
      console.log('[SW] Syncing', applications.length, 'job applications')
      
      for (const application of applications) {
        await submitJobApplication(application)
        await removeOfflineJobApplication(application.id)
      }
    }
  } catch (error) {
    console.error('[SW] Error syncing job applications:', error)
    throw error
  }
}

async function syncProfileUpdates() {
  try {
    // Get offline profile updates from IndexedDB
    const updates = await getOfflineProfileUpdates()
    
    if (updates.length > 0) {
      console.log('[SW] Syncing', updates.length, 'profile updates')
      
      for (const update of updates) {
        await submitProfileUpdate(update)
        await removeOfflineProfileUpdate(update.id)
      }
    }
  } catch (error) {
    console.error('[SW] Error syncing profile updates:', error)
    throw error
  }
}

// IndexedDB helper functions (simplified - would need full implementation)
async function getOfflineJobApplications() {
  // Implementation would use IndexedDB to get stored offline applications
  return []
}

async function removeOfflineJobApplication(id) {
  // Implementation would remove from IndexedDB
}

async function getOfflineProfileUpdates() {
  // Implementation would use IndexedDB to get stored offline updates
  return []
}

async function removeOfflineProfileUpdate(id) {
  // Implementation would remove from IndexedDB
}

async function submitJobApplication(application) {
  // Implementation would submit to API
}

async function submitProfileUpdate(update) {
  // Implementation would submit to API
}

console.log('[SW] Service Worker loaded successfully')