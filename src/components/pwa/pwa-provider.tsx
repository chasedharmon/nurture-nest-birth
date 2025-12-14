'use client'

import { useEffect } from 'react'
import { registerServiceWorker, initInstallPrompt } from '@/lib/pwa'
import { UpdateBanner } from './update-banner'
import { InstallPrompt } from './install-prompt'

interface PWAProviderProps {
  children: React.ReactNode
  /** Whether to show the install prompt */
  showInstallPrompt?: boolean
  /** Whether to show the update banner */
  showUpdateBanner?: boolean
  /** Delay before showing install prompt (ms) */
  installPromptDelay?: number
}

/**
 * PWA Provider Component
 *
 * Wraps the app and provides PWA functionality:
 * - Registers the service worker
 * - Initializes install prompt detection
 * - Shows update banner when new version available
 * - Shows install prompt for non-installed users
 */
export function PWAProvider({
  children,
  showInstallPrompt = true,
  showUpdateBanner = true,
  installPromptDelay = 30000, // 30 seconds default
}: PWAProviderProps) {
  useEffect(() => {
    // Only run in production or when explicitly enabled
    if (
      process.env.NODE_ENV !== 'production' &&
      !process.env.NEXT_PUBLIC_ENABLE_PWA
    ) {
      console.log('[PWA] Service worker disabled in development')
      return
    }

    // Register service worker
    registerServiceWorker()

    // Initialize install prompt detection
    initInstallPrompt()
  }, [])

  return (
    <>
      {children}
      {showUpdateBanner && <UpdateBanner />}
      {showInstallPrompt && <InstallPrompt showDelay={installPromptDelay} />}
    </>
  )
}
