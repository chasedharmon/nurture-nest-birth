/**
 * PWA Install Prompt Management
 *
 * Handles the "Add to Home Screen" functionality:
 * - Capturing the beforeinstallprompt event
 * - Showing install UI at the right time
 * - Tracking installation state
 */

// Store the deferred install prompt
let deferredPrompt: BeforeInstallPromptEvent | null = null

/**
 * Extended event type for the beforeinstallprompt event
 */
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

/**
 * Install prompt state
 */
export interface InstallPromptState {
  canInstall: boolean
  isInstalled: boolean
}

/**
 * Initialize install prompt detection
 * Call this once when the app loads
 */
export function initInstallPrompt(): void {
  if (typeof window === 'undefined') {
    return
  }

  // Capture the install prompt event
  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault()
    deferredPrompt = e as BeforeInstallPromptEvent
    console.log('[PWA] Install prompt captured')

    // Dispatch custom event for UI components
    window.dispatchEvent(new CustomEvent('pwaInstallAvailable'))
  })

  // Detect when app is installed
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null
    console.log('[PWA] App installed successfully')

    // Dispatch custom event for UI components
    window.dispatchEvent(new CustomEvent('pwaInstalled'))

    // Track installation (analytics)
    if (typeof gtag === 'function') {
      gtag('event', 'pwa_install', {
        event_category: 'PWA',
        event_label: 'App Installed',
      })
    }
  })
}

/**
 * Check if the install prompt is available
 */
export function canShowInstallPrompt(): boolean {
  return deferredPrompt !== null
}

/**
 * Show the native install prompt
 * Returns true if the user accepted, false if dismissed
 */
export async function showInstallPrompt(): Promise<boolean> {
  if (!deferredPrompt) {
    console.log('[PWA] No install prompt available')
    return false
  }

  // Show the install prompt
  await deferredPrompt.prompt()

  // Wait for user response
  const { outcome } = await deferredPrompt.userChoice
  console.log('[PWA] Install prompt outcome:', outcome)

  // Clear the deferred prompt
  deferredPrompt = null

  return outcome === 'accepted'
}

/**
 * Get the current install state
 */
export function getInstallState(): InstallPromptState {
  if (typeof window === 'undefined') {
    return {
      canInstall: false,
      isInstalled: false,
    }
  }

  // Check if already installed
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches
  const isIOSStandalone =
    'standalone' in navigator &&
    (navigator as { standalone?: boolean }).standalone === true

  return {
    canInstall: deferredPrompt !== null,
    isInstalled: isStandalone || isIOSStandalone,
  }
}

/**
 * Check if the device is iOS
 * iOS handles PWA installation differently
 */
export function isIOS(): boolean {
  if (typeof window === 'undefined') {
    return false
  }

  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  )
}

/**
 * Get iOS-specific install instructions
 */
export function getIOSInstallInstructions(): string {
  return 'Tap the Share button, then tap "Add to Home Screen" to install this app.'
}

// TypeScript declaration for gtag
declare function gtag(
  command: string,
  action: string,
  params: Record<string, string>
): void
