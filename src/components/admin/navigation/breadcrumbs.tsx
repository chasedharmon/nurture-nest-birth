'use client'

/**
 * Breadcrumbs
 *
 * Renders a breadcrumb trail based on the current pathname.
 * Supports async label resolution and query param preservation.
 */

import { useEffect, useMemo } from 'react'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { ChevronRight, Home } from 'lucide-react'
import { cn } from '@/lib/utils'
import { buildBreadcrumbTrail, type BreadcrumbItem } from '@/lib/breadcrumbs'
import {
  buildUrlWithPreservedParams,
  saveListViewParams,
  isListViewPath,
  getListViewParams,
} from '@/lib/navigation-utils'

export function Breadcrumbs() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Build breadcrumb trail - derived state from pathname
  const crumbs = useMemo<BreadcrumbItem[]>(() => {
    return buildBreadcrumbTrail(pathname)
  }, [pathname])

  // Save list view params when they change (side effect for external storage)
  useEffect(() => {
    if (isListViewPath(pathname) && searchParams.toString()) {
      const listParams = getListViewParams(searchParams)
      saveListViewParams(pathname, listParams)
    }
  }, [pathname, searchParams])

  // Don't render if we're at the dashboard (root)
  if (crumbs.length <= 1) {
    return null
  }

  return (
    <nav aria-label="Breadcrumb" className="overflow-x-auto scrollbar-hide">
      <ol className="flex items-center gap-1 text-sm whitespace-nowrap">
        {crumbs.map((crumb, index) => {
          const isFirst = index === 0
          const isLast = index === crumbs.length - 1

          // Build href with preserved params for list views
          const href = buildUrlWithPreservedParams(crumb.href)

          return (
            <li key={crumb.href} className="flex items-center">
              {/* Separator */}
              {!isFirst && (
                <ChevronRight
                  className="mx-1 h-4 w-4 shrink-0 text-muted-foreground/60"
                  aria-hidden="true"
                />
              )}

              {/* Crumb */}
              {isLast ? (
                // Current page - not a link
                <span
                  className="text-foreground font-medium truncate max-w-[200px]"
                  aria-current="page"
                >
                  {crumb.label}
                </span>
              ) : isFirst ? (
                // Dashboard - show icon
                <Link
                  href={href}
                  className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Home className="h-4 w-4" />
                  <span className="hidden sm:inline">{crumb.label}</span>
                </Link>
              ) : (
                // Middle crumbs - text links
                <Link
                  href={href}
                  className={cn(
                    'text-muted-foreground hover:text-foreground transition-colors',
                    'truncate max-w-[200px]'
                  )}
                >
                  {crumb.label}
                </Link>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

/**
 * BreadcrumbsWithLoading
 *
 * Extended version that handles async label resolution.
 * Use this when breadcrumb labels need to be fetched from the server.
 */
interface BreadcrumbsWithLoadingProps {
  asyncLabels?: Record<string, string> // Map of path -> resolved label
}

export function BreadcrumbsWithLoading({
  asyncLabels = {},
}: BreadcrumbsWithLoadingProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Build breadcrumb trail - derived state from pathname and asyncLabels
  const crumbs = useMemo<BreadcrumbItem[]>(() => {
    const trail = buildBreadcrumbTrail(pathname)

    // Replace "Loading..." labels with resolved ones
    return trail.map(crumb => {
      const resolvedLabel = asyncLabels[crumb.href]
      if (crumb.label === 'Loading...' && resolvedLabel) {
        return { ...crumb, label: resolvedLabel }
      }
      return crumb
    })
  }, [pathname, asyncLabels])

  // Save list view params when they change (side effect for external storage)
  useEffect(() => {
    if (isListViewPath(pathname) && searchParams.toString()) {
      const listParams = getListViewParams(searchParams)
      saveListViewParams(pathname, listParams)
    }
  }, [pathname, searchParams])

  // Don't render if we're at the dashboard (root)
  if (crumbs.length <= 1) {
    return null
  }

  return (
    <nav aria-label="Breadcrumb" className="overflow-x-auto scrollbar-hide">
      <ol className="flex items-center gap-1 text-sm whitespace-nowrap">
        {crumbs.map((crumb, index) => {
          const isFirst = index === 0
          const isLast = index === crumbs.length - 1
          const isLoading = crumb.label === 'Loading...'

          // Build href with preserved params for list views
          const href = buildUrlWithPreservedParams(crumb.href)

          return (
            <li key={crumb.href} className="flex items-center">
              {/* Separator */}
              {!isFirst && (
                <ChevronRight
                  className="mx-1 h-4 w-4 shrink-0 text-muted-foreground/60"
                  aria-hidden="true"
                />
              )}

              {/* Crumb */}
              {isLast ? (
                // Current page - not a link
                <span
                  className={cn(
                    'font-medium truncate max-w-[200px]',
                    isLoading
                      ? 'text-muted-foreground animate-pulse'
                      : 'text-foreground'
                  )}
                  aria-current="page"
                >
                  {crumb.label}
                </span>
              ) : isFirst ? (
                // Dashboard - show icon
                <Link
                  href={href}
                  className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Home className="h-4 w-4" />
                  <span className="hidden sm:inline">{crumb.label}</span>
                </Link>
              ) : (
                // Middle crumbs - text links
                <Link
                  href={href}
                  className={cn(
                    'text-muted-foreground hover:text-foreground transition-colors',
                    'truncate max-w-[200px]',
                    isLoading && 'animate-pulse'
                  )}
                >
                  {crumb.label}
                </Link>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
