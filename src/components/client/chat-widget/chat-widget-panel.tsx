'use client'

import { X, Minus, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ChatWidgetPanelProps {
  /** Title to display in header */
  title: string
  /** Whether showing thread view (enables back button) */
  showBackButton?: boolean
  /** Handler for back button click */
  onBack?: () => void
  /** Handler for minimize button click */
  onMinimize: () => void
  /** Handler for close button click */
  onClose?: () => void
  /** Panel content */
  children: React.ReactNode
  /** Additional CSS classes */
  className?: string
}

/**
 * ChatWidgetPanel - Expanded chat panel container
 *
 * Following industry patterns:
 * - 380x500px panel (responsive on mobile)
 * - Header with title and minimize/close buttons
 * - Back button when viewing thread
 * - Smooth animations
 */
export function ChatWidgetPanel({
  title,
  showBackButton = false,
  onBack,
  onMinimize,
  onClose,
  children,
  className,
}: ChatWidgetPanelProps) {
  return (
    <div
      className={cn(
        // Size and shape - use explicit height and constrain to viewport
        'w-[380px] rounded-xl',
        // Responsive - smaller on mobile
        'max-w-[calc(100vw-2rem)]',
        'h-[min(500px,calc(100vh-6rem))]',
        // Position from bottom-right corner (panel expands upward)
        'origin-bottom-right',
        // Background and border
        'bg-card border border-border',
        // Elevation
        'shadow-2xl',
        // Layout
        'flex flex-col overflow-hidden',
        // Animation
        'animate-in slide-in-from-bottom-4 fade-in duration-200',
        className
      )}
      role="dialog"
      aria-label="Messages"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card">
        <div className="flex items-center gap-2">
          {showBackButton && onBack && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 -ml-2"
              onClick={onBack}
              aria-label="Back to conversations"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <h2 className="font-semibold text-foreground">{title}</h2>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onMinimize}
            aria-label="Minimize chat"
          >
            <Minus className="h-4 w-4" />
          </Button>
          {onClose && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={onClose}
              aria-label="Close chat"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Content - relative for absolute positioned overlays like NewMessage dialog */}
      <div className="flex-1 overflow-hidden flex flex-col relative">
        {children}
      </div>
    </div>
  )
}
