/**
 * Page Header Component
 *
 * Standardized page header for admin pages. Displays page title,
 * optional subtitle, and action buttons.
 *
 * Use this component at the top of each admin page's main content
 * to provide consistent page identification and actions.
 */

import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface PageHeaderProps {
  /** Page title */
  title: string
  /** Optional subtitle (e.g., count, description) */
  subtitle?: string
  /** Optional icon component */
  icon?: ReactNode
  /** Optional badge next to title */
  badge?: ReactNode
  /** Action buttons to display on the right */
  actions?: ReactNode
  /** Additional className */
  className?: string
}

export function PageHeader({
  title,
  subtitle,
  icon,
  badge,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between',
        className
      )}
    >
      <div className="flex items-center gap-3">
        {icon && (
          <div className="rounded-lg bg-primary/10 p-2 shrink-0">{icon}</div>
        )}
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="font-serif text-2xl font-bold text-foreground truncate">
              {title}
            </h1>
            {badge}
          </div>
          {subtitle && (
            <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>
      {actions && (
        <div className="flex items-center gap-2 shrink-0">{actions}</div>
      )}
    </div>
  )
}
