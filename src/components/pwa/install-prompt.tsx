'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Download, X, Share, Smartphone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  canShowInstallPrompt,
  showInstallPrompt,
  getInstallState,
  isIOS,
  getIOSInstallInstructions,
  initInstallPrompt,
} from '@/lib/pwa'

interface InstallPromptProps {
  /** Delay before showing the prompt (ms) */
  showDelay?: number
  /** Callback when install is successful */
  onInstalled?: () => void
  /** Callback when prompt is dismissed */
  onDismissed?: () => void
}

/**
 * PWA Install Prompt Component
 *
 * Shows a prompt encouraging users to install the app.
 * Handles both standard PWA install and iOS-specific instructions.
 */
export function InstallPrompt({
  showDelay = 5000,
  onInstalled,
  onDismissed,
}: InstallPromptProps) {
  // Compute initial state synchronously to avoid cascading renders
  const initialState = useMemo(() => {
    if (typeof window === 'undefined') {
      return { isInstalled: false, isIOSDevice: false }
    }
    const { isInstalled } = getInstallState()
    return { isInstalled, isIOSDevice: isIOS() }
  }, [])

  const [showPrompt, setShowPrompt] = useState(false)
  const [isIOSDevice] = useState(initialState.isIOSDevice)
  const [isInstalled, setIsInstalled] = useState(initialState.isInstalled)

  // Check dismissal state from localStorage
  const isDismissed = useCallback(() => {
    if (typeof window === 'undefined') return false
    const dismissed = localStorage.getItem('pwa-install-dismissed')
    if (!dismissed) return false
    // Allow showing again after 7 days
    const dismissedAt = parseInt(dismissed, 10)
    const sevenDays = 7 * 24 * 60 * 60 * 1000
    return Date.now() - dismissedAt < sevenDays
  }, [])

  useEffect(() => {
    // Initialize install prompt detection
    initInstallPrompt()

    if (isInstalled || isDismissed()) {
      return
    }

    // Show prompt after delay
    const timer = setTimeout(() => {
      if (canShowInstallPrompt() || isIOS()) {
        setShowPrompt(true)
      }
    }, showDelay)

    // Listen for install availability
    const handleInstallAvailable = () => {
      if (!isDismissed() && !getInstallState().isInstalled) {
        setShowPrompt(true)
      }
    }

    // Listen for successful installation
    const handleInstalled = () => {
      setShowPrompt(false)
      setIsInstalled(true)
      onInstalled?.()
    }

    window.addEventListener('pwaInstallAvailable', handleInstallAvailable)
    window.addEventListener('pwaInstalled', handleInstalled)

    return () => {
      clearTimeout(timer)
      window.removeEventListener('pwaInstallAvailable', handleInstallAvailable)
      window.removeEventListener('pwaInstalled', handleInstalled)
    }
  }, [showDelay, isDismissed, onInstalled, isInstalled])

  const handleInstall = async () => {
    if (isIOSDevice) {
      // For iOS, we just show instructions - nothing to trigger
      return
    }

    const accepted = await showInstallPrompt()
    if (accepted) {
      setShowPrompt(false)
      onInstalled?.()
    }
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    localStorage.setItem('pwa-install-dismissed', Date.now().toString())
    onDismissed?.()
  }

  if (!showPrompt || isInstalled) {
    return null
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-96">
      <Card className="shadow-lg">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-amber-100 p-2">
                <Smartphone className="h-5 w-5 text-amber-700" />
              </div>
              <div>
                <CardTitle className="text-base">Install App</CardTitle>
                <CardDescription className="text-xs">
                  Get a better experience
                </CardDescription>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleDismiss}
              aria-label="Dismiss install prompt"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {isIOSDevice ? (
            <>
              <p className="text-sm text-muted-foreground">
                {getIOSInstallInstructions()}
              </p>
              <div className="flex items-center gap-2 rounded-lg bg-muted p-3">
                <Share className="h-5 w-5 text-blue-500" />
                <span className="text-sm">
                  Tap <strong>Share</strong> →{' '}
                  <strong>Add to Home Screen</strong>
                </span>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                Install Nurture Nest Birth for quick access, offline support,
                and push notifications.
              </p>
              <Button onClick={handleInstall} className="w-full" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Install Now
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
