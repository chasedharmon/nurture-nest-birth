'use client'

import { useKeyboardShortcuts } from '@/lib/hooks/use-keyboard-shortcuts'
import { KeyboardShortcutsHelp } from './keyboard-shortcuts-help'
import { HelpWidget } from './help-widget'

interface KeyboardShortcutsProviderProps {
  children: React.ReactNode
  enabled?: boolean
  showHelpWidget?: boolean
}

export function KeyboardShortcutsProvider({
  children,
  enabled = true,
  showHelpWidget = true,
}: KeyboardShortcutsProviderProps) {
  const { groupedShortcuts, showHelp, setShowHelp, toggleHelp } =
    useKeyboardShortcuts({
      enabled,
      enableNavigation: true,
    })

  return (
    <>
      {children}
      <KeyboardShortcutsHelp
        open={showHelp}
        onOpenChange={setShowHelp}
        groupedShortcuts={groupedShortcuts}
      />
      {showHelpWidget && <HelpWidget onShowKeyboardShortcuts={toggleHelp} />}
    </>
  )
}
