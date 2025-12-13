'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  HelpCircle,
  X,
  ExternalLink,
  Lightbulb,
  ArrowRight,
  Keyboard,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import {
  getHelpContentForPath,
  type HelpContent,
} from '@/lib/help/help-content'

interface HelpWidgetProps {
  onShowKeyboardShortcuts?: () => void
}

export function HelpWidget({ onShowKeyboardShortcuts }: HelpWidgetProps) {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)

  const helpContent: HelpContent = getHelpContentForPath(pathname)

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className={cn(
            'fixed bottom-6 right-6 z-50 h-12 w-12 rounded-full shadow-lg',
            'bg-primary text-primary-foreground hover:bg-primary/90',
            'transition-transform hover:scale-105'
          )}
          aria-label="Help"
        >
          {isOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <HelpCircle className="h-5 w-5" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align="end"
        className="w-80 p-0"
        sideOffset={16}
      >
        {/* Header */}
        <div className="border-b px-4 py-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">{helpContent.title}</h3>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Tips for this page
          </p>
        </div>

        {/* Tips */}
        <div className="max-h-[300px] overflow-y-auto p-4">
          <div className="space-y-4">
            {helpContent.tips.map((tip, index) => (
              <div key={index} className="flex gap-3">
                <div className="mt-0.5 flex-shrink-0">
                  <Lightbulb className="h-4 w-4 text-amber-500" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">{tip.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {tip.description}
                  </p>
                  {tip.link && (
                    <Link
                      href={tip.link.href}
                      className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                      onClick={() => setIsOpen(false)}
                    >
                      {tip.link.label}
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Links */}
        {helpContent.quickLinks && helpContent.quickLinks.length > 0 && (
          <>
            <Separator />
            <div className="p-3">
              <p className="mb-2 text-xs font-medium text-muted-foreground">
                Quick Links
              </p>
              <div className="flex flex-wrap gap-2">
                {helpContent.quickLinks.map((link, index) => (
                  <Link
                    key={index}
                    href={link.href}
                    onClick={() => setIsOpen(false)}
                  >
                    <Button variant="outline" size="sm" className="text-xs">
                      {link.label}
                      <ExternalLink className="ml-1.5 h-3 w-3" />
                    </Button>
                  </Link>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Footer Actions */}
        <Separator />
        <div className="p-3">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-xs"
            onClick={() => {
              setIsOpen(false)
              onShowKeyboardShortcuts?.()
            }}
          >
            <Keyboard className="mr-2 h-3.5 w-3.5" />
            Keyboard Shortcuts
            <kbd className="ml-auto rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold">
              ?
            </kbd>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
