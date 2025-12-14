/**
 * Service Worker for Nurture Nest Birth CRM PWA
 *
 * Caching Strategy:
 * - Static assets (JS, CSS, fonts): Cache-first with network fallback
 * - API requests: Network-first with cache fallback for offline
 * - Images: Cache-first with long TTL
 * - HTML pages: Network-first to ensure fresh content
 *
 * Cache Versioning:
 * Increment CACHE_VERSION when deploying breaking changes
 * to force clients to re-fetch all cached resources.
 */

const CACHE_VERSION = 'v1'
const STATIC_CACHE = `nnb-static-${CACHE_VERSION}`
const DYNAMIC_CACHE = `nnb-dynamic-${CACHE_VERSION}`
const IMAGE_CACHE = `nnb-images-${CACHE_VERSION}`

// Resources to pre-cache on install
const PRECACHE_URLS = [
  '/',
  '/admin',
  '/login',
  '/offline',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
]

// URL patterns that should use cache-first strategy
const CACHE_FIRST_PATTERNS = [
  /\/_next\/static\/.*/,
  /\.(?:js|css|woff|woff2|ttf|otf)$/,
  /\/icons\/.*/,
]

// URL patterns for images (longer cache)
const IMAGE_PATTERNS = [/\.(?:png|jpg|jpeg|gif|svg|webp|avif)$/, /\/images\/.*/]

// URLs that should never be cached
const NO_CACHE_PATTERNS = [
  /\/api\/webhooks\/.*/,
  /\/api\/auth\/.*/,
  /supabase\.co/,
  /stripe\.com/,
]

/**
 * Install Event
 * Pre-caches essential resources for offline functionality
 */
self.addEventListener('install', event => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then(cache => {
        console.log('[SW] Pre-caching essential resources')
        return cache.addAll(PRECACHE_URLS)
      })
      .then(() => {
        // Skip waiting to activate immediately
        return self.skipWaiting()
      })
      .catch(error => {
        console.error('[SW] Pre-cache failed:', error)
      })
  )
})

/**
 * Activate Event
 * Cleans up old caches when a new service worker takes over
 */
self.addEventListener('activate', event => {
  event.waitUntil(
    caches
      .keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(cacheName => {
              // Delete caches from older versions
              return (
                cacheName.startsWith('nnb-') &&
                !cacheName.includes(CACHE_VERSION)
              )
            })
            .map(cacheName => {
              console.log('[SW] Deleting old cache:', cacheName)
              return caches.delete(cacheName)
            })
        )
      })
      .then(() => {
        // Take control of all clients immediately
        return self.clients.claim()
      })
  )
})

/**
 * Fetch Event
 * Intercepts network requests and applies caching strategies
 */
self.addEventListener('fetch', event => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return
  }

  // Skip cross-origin requests except for CDN resources
  if (url.origin !== self.location.origin) {
    // Allow specific CDNs
    const allowedOrigins = ['fonts.googleapis.com', 'fonts.gstatic.com']
    if (!allowedOrigins.some(origin => url.hostname.includes(origin))) {
      return
    }
  }

  // Skip requests that should never be cached
  if (NO_CACHE_PATTERNS.some(pattern => pattern.test(url.href))) {
    return
  }

  // Determine caching strategy based on URL pattern
  if (CACHE_FIRST_PATTERNS.some(pattern => pattern.test(url.href))) {
    event.respondWith(cacheFirst(request, STATIC_CACHE))
  } else if (IMAGE_PATTERNS.some(pattern => pattern.test(url.href))) {
    event.respondWith(cacheFirst(request, IMAGE_CACHE))
  } else {
    event.respondWith(networkFirst(request))
  }
})

/**
 * Cache-First Strategy
 * Best for static assets that rarely change
 */
async function cacheFirst(request, cacheName) {
  const cachedResponse = await caches.match(request)
  if (cachedResponse) {
    return cachedResponse
  }

  try {
    const networkResponse = await fetch(request)
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName)
      cache.put(request, networkResponse.clone())
    }
    return networkResponse
  } catch (error) {
    console.error('[SW] Cache-first fetch failed:', error)
    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      return caches.match('/offline')
    }
    throw error
  }
}

/**
 * Network-First Strategy
 * Best for dynamic content that needs freshness
 */
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request)
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE)
      cache.put(request, networkResponse.clone())
    }
    return networkResponse
  } catch (error) {
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      return cachedResponse
    }

    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      return caches.match('/offline')
    }

    throw error
  }
}

/**
 * Push Notification Event
 * Handles incoming push notifications from the server
 */
self.addEventListener('push', event => {
  if (!event.data) {
    return
  }

  try {
    const data = event.data.json()
    const options = {
      body: data.body || 'You have a new notification',
      icon: data.icon || '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      vibrate: [100, 50, 100],
      tag: data.tag || 'default',
      renotify: data.renotify || false,
      requireInteraction: data.requireInteraction || false,
      data: {
        url: data.url || '/admin',
        dateOfArrival: Date.now(),
      },
      actions: data.actions || [],
    }

    event.waitUntil(
      self.registration.showNotification(
        data.title || 'Nurture Nest Birth',
        options
      )
    )
  } catch (error) {
    console.error('[SW] Push notification error:', error)
  }
})

/**
 * Notification Click Event
 * Handles user interaction with notifications
 */
self.addEventListener('notificationclick', event => {
  event.notification.close()

  const url = event.notification.data?.url || '/admin'

  // Handle action button clicks
  if (event.action) {
    console.log('[SW] Notification action clicked:', event.action)
  }

  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then(clientList => {
        // If a window is already open, focus it
        for (const client of clientList) {
          if (client.url.includes(url) && 'focus' in client) {
            return client.focus()
          }
        }
        // Otherwise, open a new window
        if (clients.openWindow) {
          return clients.openWindow(url)
        }
      })
  )
})

/**
 * Background Sync Event
 * Handles offline-first actions that need to sync when online
 */
self.addEventListener('sync', event => {
  if (event.tag === 'sync-pending-actions') {
    event.waitUntil(syncPendingActions())
  }
})

/**
 * Sync pending actions stored in IndexedDB
 * This allows offline data mutations to be replayed when back online
 */
async function syncPendingActions() {
  // Implementation for syncing pending offline actions
  // This would integrate with IndexedDB to queue and replay mutations
  console.log('[SW] Syncing pending actions...')
}

/**
 * Message Event
 * Allows the main app to communicate with the service worker
 */
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }

  if (event.data && event.data.type === 'CLEAR_CACHES') {
    event.waitUntil(
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(name => name.startsWith('nnb-'))
            .map(name => caches.delete(name))
        )
      })
    )
  }
})
