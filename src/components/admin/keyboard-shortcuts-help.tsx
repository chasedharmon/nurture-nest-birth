'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import type { KeyboardShortcut } from '@/lib/hooks/use-keyboard-shortcuts'

interface KeyboardShortcutsHelpProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  groupedShortcuts: Record<string, KeyboardShortcut[]>
}

function formatShortcutKey(shortcut: KeyboardShortcut): string {
  if (shortcut.sequence) {
    return shortcut.sequence.map(k => k.toUpperCase()).join(' then ')
  }
  if (shortcut.modifier) {
    const modKey =
      shortcut.modifier === 'meta'
        ? '⌘'
        : shortcut.modifier === 'ctrl'
          ? 'Ctrl'
          : shortcut.modifier === 'alt'
            ? 'Alt'
            : 'Shift'
    return `${modKey} + ${shortcut.key.toUpperCase()}`
  }
  return shortcut.key === '?' ? '?' : shortcut.key.toUpperCase()
}

export function KeyboardShortcutsHelp({
  open,
  onOpenChange,
  groupedShortcuts,
}: KeyboardShortcutsHelpProps) {
  const categories = Object.keys(groupedShortcuts).sort((a, b) => {
    // Put Navigation first, Help last
    if (a === 'Navigation') return -1
    if (b === 'Navigation') return 1
    if (a === 'Help') return 1
    if (b === 'Help') return -1
    return a.localeCompare(b)
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Keyboard Shortcuts
            <Badge variant="secondary" className="text-xs font-normal">
              Press ? anytime
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Use these shortcuts to navigate quickly
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4 max-h-[60vh] overflow-y-auto">
          {categories.map((category, categoryIndex) => (
            <div key={category}>
              {categoryIndex > 0 && <Separator className="mb-4" />}
              <div className="mb-3">
                <h3 className="text-sm font-medium text-muted-foreground">
                  {category}
                </h3>
              </div>
              <div className="space-y-2">
                {(groupedShortcuts[category] ?? []).map((shortcut, index) => (
                  <div
                    key={`${category}-${index}`}
                    className="flex items-center justify-between py-1"
                  >
                    <span className="text-sm">{shortcut.description}</span>
                    <div className="flex items-center gap-1">
                      {shortcut.sequence ? (
                        shortcut.sequence.map((key, keyIndex) => (
                          <span key={keyIndex} className="flex items-center">
                            <kbd className="px-2 py-1 text-xs font-semibold text-muted-foreground bg-muted border rounded-md shadow-sm">
                              {key.toUpperCase()}
                            </kbd>
                            {keyIndex < shortcut.sequence!.length - 1 && (
                              <span className="mx-1 text-xs text-muted-foreground">
                                then
                              </span>
                            )}
                          </span>
                        ))
                      ) : (
                        <kbd className="px-2 py-1 text-xs font-semibold text-muted-foreground bg-muted border rounded-md shadow-sm">
                          {formatShortcutKey(shortcut)}
                        </kbd>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="border-t pt-4">
          <p className="text-xs text-muted-foreground text-center">
            Shortcuts are disabled when typing in input fields
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
