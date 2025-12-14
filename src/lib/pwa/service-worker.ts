/**
 * Service Worker Registration and Management
 *
 * This module handles:
 * - Registering the service worker
 * - Handling updates
 * - Managing the update prompt
 * - Communicating with the service worker
 */

export interface ServiceWorkerState {
  isSupported: boolean
  isRegistered: boolean
  isUpdateAvailable: boolean
  registration: ServiceWorkerRegistration | null
}

/**
 * Check if service workers are supported in the current browser
 */
export function isServiceWorkerSupported(): boolean {
  return typeof window !== 'undefined' && 'serviceWorker' in navigator
}

/**
 * Register the service worker
 * Should be called once when the app loads
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!isServiceWorkerSupported()) {
    console.log('[PWA] Service workers not supported')
    return null
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
      updateViaCache: 'none',
    })

    console.log('[PWA] Service worker registered:', registration.scope)

    // Check for updates immediately
    registration.update()

    // Set up update detection
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing
      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (
            newWorker.state === 'installed' &&
            navigator.serviceWorker.controller
          ) {
            // New service worker available
            console.log('[PWA] New service worker available')
            window.dispatchEvent(
              new CustomEvent('swUpdate', { detail: registration })
            )
          }
        })
      }
    })

    return registration
  } catch (error) {
    console.error('[PWA] Service worker registration failed:', error)
    return null
  }
}

/**
 * Unregister the service worker
 * Useful for debugging or when disabling PWA features
 */
export async function unregisterServiceWorker(): Promise<boolean> {
  if (!isServiceWorkerSupported()) {
    return false
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration()
    if (registration) {
      const success = await registration.unregister()
      console.log('[PWA] Service worker unregistered:', success)
      return success
    }
    return false
  } catch (error) {
    console.error('[PWA] Service worker unregistration failed:', error)
    return false
  }
}

/**
 * Skip waiting and activate the new service worker
 * Call this after the user confirms they want to update
 */
export async function skipWaiting(): Promise<void> {
  const registration = await navigator.serviceWorker.getRegistration()
  if (registration?.waiting) {
    registration.waiting.postMessage({ type: 'SKIP_WAITING' })
    // Reload all windows to use the new service worker
    window.location.reload()
  }
}

/**
 * Clear all caches managed by the service worker
 * Useful when users want to clear storage or fix issues
 */
export async function clearServiceWorkerCaches(): Promise<void> {
  if (!isServiceWorkerSupported()) {
    return
  }

  const registration = await navigator.serviceWorker.getRegistration()
  if (registration?.active) {
    registration.active.postMessage({ type: 'CLEAR_CACHES' })
  }

  // Also clear from the main thread as backup
  const cacheNames = await caches.keys()
  await Promise.all(
    cacheNames
      .filter(name => name.startsWith('nnb-'))
      .map(name => caches.delete(name))
  )

  console.log('[PWA] Caches cleared')
}

/**
 * Check if the app is running as an installed PWA
 */
export function isRunningAsPWA(): boolean {
  if (typeof window === 'undefined') {
    return false
  }

  // Check display-mode media query
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches

  // iOS Safari uses navigator.standalone
  const isIOSStandalone =
    'standalone' in navigator &&
    (navigator as { standalone?: boolean }).standalone === true

  return isStandalone || isIOSStandalone
}

/**
 * Get the current service worker state
 */
export async function getServiceWorkerState(): Promise<ServiceWorkerState> {
  const isSupported = isServiceWorkerSupported()

  if (!isSupported) {
    return {
      isSupported: false,
      isRegistered: false,
      isUpdateAvailable: false,
      registration: null,
    }
  }

  const registration = await navigator.serviceWorker.getRegistration()

  return {
    isSupported: true,
    isRegistered: !!registration,
    isUpdateAvailable: !!registration?.waiting,
    registration: registration || null,
  }
}
