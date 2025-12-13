'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

export interface KeyboardShortcut {
  key: string
  description: string
  action: () => void
  category?: string
  modifier?: 'meta' | 'ctrl' | 'alt' | 'shift'
  sequence?: string[] // For multi-key sequences like "G then H"
}

interface UseKeyboardShortcutsOptions {
  enabled?: boolean
  shortcuts?: KeyboardShortcut[]
  enableNavigation?: boolean
  enableGlobalShortcuts?: boolean
  onShortcutTriggered?: (shortcut: KeyboardShortcut) => void
}

// Default navigation shortcuts for admin
const createNavigationShortcuts = (
  router: ReturnType<typeof useRouter>
): KeyboardShortcut[] => [
  {
    key: 'g h',
    sequence: ['g', 'h'],
    description: 'Go to Dashboard (Home)',
    action: () => router.push('/admin'),
    category: 'Navigation',
  },
  {
    key: 'g l',
    sequence: ['g', 'l'],
    description: 'Go to Leads',
    action: () => router.push('/admin/leads'),
    category: 'Navigation',
  },
  {
    key: 'g w',
    sequence: ['g', 'w'],
    description: 'Go to Workflows',
    action: () => router.push('/admin/workflows'),
    category: 'Navigation',
  },
  {
    key: 'g r',
    sequence: ['g', 'r'],
    description: 'Go to Reports',
    action: () => router.push('/admin/reports'),
    category: 'Navigation',
  },
  {
    key: 'g t',
    sequence: ['g', 't'],
    description: 'Go to Team',
    action: () => router.push('/admin/team'),
    category: 'Navigation',
  },
  {
    key: 'g s',
    sequence: ['g', 's'],
    description: 'Go to Setup',
    action: () => router.push('/admin/setup'),
    category: 'Navigation',
  },
  {
    key: 'g m',
    sequence: ['g', 'm'],
    description: 'Go to Messages',
    action: () => router.push('/admin/messages'),
    category: 'Navigation',
  },
]

// Check if the target is an input element
function isInputElement(target: EventTarget | null): boolean {
  if (!target || !(target instanceof Element)) return false
  const tagName = target.tagName.toLowerCase()
  return (
    tagName === 'input' ||
    tagName === 'textarea' ||
    tagName === 'select' ||
    (target as HTMLElement).isContentEditable
  )
}

export function useKeyboardShortcuts({
  enabled = true,
  shortcuts = [],
  enableNavigation = true,
  enableGlobalShortcuts = true,
  onShortcutTriggered,
}: UseKeyboardShortcutsOptions = {}) {
  const router = useRouter()
  const [showHelp, setShowHelp] = useState(false)
  const sequenceBuffer = useRef<string[]>([])
  const sequenceTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Combine custom shortcuts with navigation shortcuts - memoized to prevent re-renders
  const finalShortcuts = useMemo<KeyboardShortcut[]>(() => {
    const allShortcuts = [
      ...(enableNavigation ? createNavigationShortcuts(router) : []),
      ...shortcuts,
    ]

    // Add help shortcut
    return [
      ...allShortcuts,
      {
        key: '?',
        description: 'Show keyboard shortcuts help',
        action: () => setShowHelp(prev => !prev),
        category: 'Help',
      },
      {
        key: 'Escape',
        description: 'Close dialogs',
        action: () => setShowHelp(false),
        category: 'Help',
      },
    ]
  }, [enableNavigation, router, shortcuts])

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return

      // Skip if in input element
      if (isInputElement(event.target)) return

      const key = event.key.toLowerCase()

      // Handle ? key for help (shift + /)
      if (event.key === '?' && !event.metaKey && !event.ctrlKey) {
        event.preventDefault()
        setShowHelp(prev => !prev)
        onShortcutTriggered?.({
          key: '?',
          description: 'Show keyboard shortcuts help',
          action: () => setShowHelp(prev => !prev),
        })
        return
      }

      // Handle Escape
      if (event.key === 'Escape') {
        setShowHelp(false)
        return
      }

      // Clear sequence buffer timeout
      if (sequenceTimeout.current) {
        clearTimeout(sequenceTimeout.current)
      }

      // Add key to sequence buffer
      sequenceBuffer.current.push(key)

      // Set timeout to clear buffer (500ms window for sequences)
      sequenceTimeout.current = setTimeout(() => {
        sequenceBuffer.current = []
      }, 500)

      // Check for sequence matches
      for (const shortcut of finalShortcuts) {
        if (shortcut.sequence) {
          const bufferStr = sequenceBuffer.current.join(' ')
          const sequenceStr = shortcut.sequence.join(' ')

          if (bufferStr === sequenceStr) {
            event.preventDefault()
            shortcut.action()
            onShortcutTriggered?.(shortcut)
            sequenceBuffer.current = []
            return
          }
        } else {
          // Single key shortcuts
          const modifierMatch =
            (!shortcut.modifier ||
              (shortcut.modifier === 'meta' && event.metaKey) ||
              (shortcut.modifier === 'ctrl' && event.ctrlKey) ||
              (shortcut.modifier === 'alt' && event.altKey) ||
              (shortcut.modifier === 'shift' && event.shiftKey)) &&
            !event.metaKey &&
            !event.ctrlKey &&
            !event.altKey

          if (
            modifierMatch &&
            key === shortcut.key.toLowerCase() &&
            sequenceBuffer.current.length === 1
          ) {
            event.preventDefault()
            shortcut.action()
            onShortcutTriggered?.(shortcut)
            sequenceBuffer.current = []
            return
          }
        }
      }
    },
    [enabled, finalShortcuts, onShortcutTriggered]
  )

  useEffect(() => {
    if (!enabled || !enableGlobalShortcuts) return

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [enabled, enableGlobalShortcuts, handleKeyDown])

  // Group shortcuts by category
  const groupedShortcuts = finalShortcuts.reduce(
    (acc, shortcut) => {
      const category = shortcut.category || 'Other'
      if (!acc[category]) {
        acc[category] = []
      }
      acc[category].push(shortcut)
      return acc
    },
    {} as Record<string, KeyboardShortcut[]>
  )

  return {
    shortcuts: finalShortcuts,
    groupedShortcuts,
    showHelp,
    setShowHelp,
    toggleHelp: () => setShowHelp(prev => !prev),
  }
}

export type { KeyboardShortcut as Shortcut }
