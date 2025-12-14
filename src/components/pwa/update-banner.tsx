'use client'

import { useState, useEffect } from 'react'
import { RefreshCw, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { skipWaiting } from '@/lib/pwa'

/**
 * PWA Update Banner Component
 *
 * Shows a banner when a new version of the app is available.
 * Allows users to reload and update to the latest version.
 */
export function UpdateBanner() {
  const [showBanner, setShowBanner] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)

  useEffect(() => {
    // Listen for service worker updates
    const handleSwUpdate = () => {
      setShowBanner(true)
    }

    window.addEventListener('swUpdate', handleSwUpdate)

    return () => {
      window.removeEventListener('swUpdate', handleSwUpdate)
    }
  }, [])

  const handleUpdate = async () => {
    setIsUpdating(true)
    try {
      await skipWaiting()
      // The page will reload after skipWaiting
    } catch (error) {
      console.error('[PWA] Update failed:', error)
      setIsUpdating(false)
    }
  }

  const handleDismiss = () => {
    setShowBanner(false)
  }

  if (!showBanner) {
    return null
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-amber-600 px-4 py-2 text-white shadow-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <div className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4" />
          <span className="text-sm font-medium">
            A new version is available!
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleUpdate}
            disabled={isUpdating}
            className="h-7 text-xs"
          >
            {isUpdating ? (
              <>
                <RefreshCw className="mr-1 h-3 w-3 animate-spin" />
                Updating...
              </>
            ) : (
              'Update Now'
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDismiss}
            className="h-7 w-7 text-white hover:bg-amber-700 hover:text-white"
            aria-label="Dismiss update banner"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
