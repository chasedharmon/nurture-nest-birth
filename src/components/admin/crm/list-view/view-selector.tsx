'use client'

/**
 * ViewSelector - Dropdown to switch between saved list views
 *
 * Features:
 * - List all available views (personal and shared)
 * - Pin/unpin favorite views
 * - Delete personal views
 * - "All Records" default option
 */

import { useState } from 'react'
import {
  ChevronDown,
  Check,
  Pin,
  Trash2,
  Globe,
  User,
  Building2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { cn } from '@/lib/utils'

export interface SavedView {
  id: string
  name: string
  visibility: 'private' | 'shared' | 'org'
  is_pinned: boolean
  is_default: boolean
  created_by: string
  filter_count: number
}

interface ViewSelectorProps {
  views: SavedView[]
  currentViewId: string | null
  onViewChange: (viewId: string | null) => void
  onDeleteView?: (viewId: string) => Promise<void>
  onPinView?: (viewId: string, pinned: boolean) => Promise<void>
  currentUserId: string
  objectLabel: string
}

export function ViewSelector({
  views,
  currentViewId,
  onViewChange,
  onDeleteView,
  onPinView,
  currentUserId,
  objectLabel,
}: ViewSelectorProps) {
  const [deleteViewId, setDeleteViewId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const currentView = views.find(v => v.id === currentViewId)

  // Group views by visibility
  const pinnedViews = views.filter(v => v.is_pinned)
  const personalViews = views.filter(
    v => v.visibility === 'private' && !v.is_pinned
  )
  const sharedViews = views.filter(
    v => v.visibility === 'shared' && !v.is_pinned
  )
  const orgViews = views.filter(v => v.visibility === 'org' && !v.is_pinned)

  const handleDelete = async () => {
    if (!deleteViewId || !onDeleteView) return

    setIsDeleting(true)
    try {
      await onDeleteView(deleteViewId)
      if (currentViewId === deleteViewId) {
        onViewChange(null)
      }
    } finally {
      setIsDeleting(false)
      setDeleteViewId(null)
    }
  }

  const handlePin = async (viewId: string, pinned: boolean) => {
    if (!onPinView) return
    await onPinView(viewId, pinned)
  }

  const getVisibilityIcon = (visibility: SavedView['visibility']) => {
    switch (visibility) {
      case 'private':
        return <User className="h-3 w-3" />
      case 'shared':
        return <Globe className="h-3 w-3" />
      case 'org':
        return <Building2 className="h-3 w-3" />
    }
  }

  const renderViewItem = (view: SavedView) => {
    const isOwner = view.created_by === currentUserId
    const isSelected = currentViewId === view.id

    return (
      <DropdownMenuItem
        key={view.id}
        className="flex items-center justify-between gap-2"
        onSelect={e => {
          e.preventDefault()
          onViewChange(view.id)
        }}
      >
        <div className="flex items-center gap-2">
          {isSelected && <Check className="h-4 w-4" />}
          <span className={cn(!isSelected && 'ml-6')}>{view.name}</span>
          {view.filter_count > 0 && (
            <span className="text-xs text-muted-foreground">
              ({view.filter_count} filter{view.filter_count !== 1 ? 's' : ''})
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          {getVisibilityIcon(view.visibility)}

          {onPinView && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={e => {
                e.stopPropagation()
                handlePin(view.id, !view.is_pinned)
              }}
            >
              <Pin
                className={cn(
                  'h-3 w-3',
                  view.is_pinned
                    ? 'fill-primary text-primary'
                    : 'text-muted-foreground'
                )}
              />
            </Button>
          )}

          {isOwner && onDeleteView && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-muted-foreground hover:text-destructive"
              onClick={e => {
                e.stopPropagation()
                setDeleteViewId(view.id)
              }}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          )}
        </div>
      </DropdownMenuItem>
    )
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="min-w-[200px] justify-between">
            <span className="truncate">
              {currentView ? currentView.name : `All ${objectLabel}`}
            </span>
            <ChevronDown className="ml-2 h-4 w-4 shrink-0" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="start" className="w-[280px]">
          {/* Default "All Records" option */}
          <DropdownMenuItem
            onSelect={() => onViewChange(null)}
            className="flex items-center gap-2"
          >
            {currentViewId === null && <Check className="h-4 w-4" />}
            <span className={cn(currentViewId !== null && 'ml-6')}>
              All {objectLabel}
            </span>
          </DropdownMenuItem>

          {/* Pinned views */}
          {pinnedViews.length > 0 && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="flex items-center gap-1">
                <Pin className="h-3 w-3" />
                Pinned
              </DropdownMenuLabel>
              <DropdownMenuGroup>
                {pinnedViews.map(renderViewItem)}
              </DropdownMenuGroup>
            </>
          )}

          {/* Personal views */}
          {personalViews.length > 0 && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="flex items-center gap-1">
                <User className="h-3 w-3" />
                My Views
              </DropdownMenuLabel>
              <DropdownMenuGroup>
                {personalViews.map(renderViewItem)}
              </DropdownMenuGroup>
            </>
          )}

          {/* Shared views */}
          {sharedViews.length > 0 && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="flex items-center gap-1">
                <Globe className="h-3 w-3" />
                Shared Views
              </DropdownMenuLabel>
              <DropdownMenuGroup>
                {sharedViews.map(renderViewItem)}
              </DropdownMenuGroup>
            </>
          )}

          {/* Org views */}
          {orgViews.length > 0 && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="flex items-center gap-1">
                <Building2 className="h-3 w-3" />
                Organization Views
              </DropdownMenuLabel>
              <DropdownMenuGroup>
                {orgViews.map(renderViewItem)}
              </DropdownMenuGroup>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Delete confirmation dialog */}
      <AlertDialog
        open={deleteViewId !== null}
        onOpenChange={open => !open && setDeleteViewId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete View?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this saved view. This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
