'use client'

import { ChevronDown, Pin, Globe, Users } from 'lucide-react'
import type { ListView } from '@/lib/supabase/types'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

interface ViewSelectorProps {
  views: ListView[]
  currentView: ListView | null
  onViewChange: (viewId: string | null) => void
}

export function ViewSelector({
  views,
  currentView,
  onViewChange,
}: ViewSelectorProps) {
  const pinnedViews = views.filter(v => v.is_pinned)
  const unpinnedViews = views.filter(v => !v.is_pinned)

  const getVisibilityIcon = (visibility: string) => {
    switch (visibility) {
      case 'org':
        return <Globe className="h-3 w-3" />
      case 'shared':
        return <Users className="h-3 w-3" />
      default:
        return null
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="min-w-[200px] justify-between">
          <span className="truncate">{currentView?.name || 'All Records'}</span>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[240px]">
        {/* All Records option */}
        <DropdownMenuItem
          onClick={() => onViewChange(null)}
          className={cn(!currentView && 'bg-muted')}
        >
          All Records
        </DropdownMenuItem>

        {/* Pinned views section */}
        {pinnedViews.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
              Pinned Views
            </div>
            {pinnedViews.map(view => (
              <DropdownMenuItem
                key={view.id}
                onClick={() => onViewChange(view.id)}
                className={cn(
                  'flex items-center justify-between',
                  currentView?.id === view.id && 'bg-muted'
                )}
              >
                <span className="flex items-center gap-2">
                  <Pin className="h-3 w-3 text-primary" />
                  {view.name}
                </span>
                {getVisibilityIcon(view.visibility)}
              </DropdownMenuItem>
            ))}
          </>
        )}

        {/* Other views section */}
        {unpinnedViews.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
              {pinnedViews.length > 0 ? 'Other Views' : 'Saved Views'}
            </div>
            {unpinnedViews.map(view => (
              <DropdownMenuItem
                key={view.id}
                onClick={() => onViewChange(view.id)}
                className={cn(
                  'flex items-center justify-between',
                  currentView?.id === view.id && 'bg-muted'
                )}
              >
                <span>{view.name}</span>
                {getVisibilityIcon(view.visibility)}
              </DropdownMenuItem>
            ))}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
