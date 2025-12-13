'use client'

import { useState, useTransition, createElement } from 'react'
import {
  GripVertical,
  Pencil,
  Lock,
  Sparkles,
  Plus,
  Trash2,
} from 'lucide-react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { getIconComponent } from '@/lib/admin-navigation'
import {
  reorderAdminNavItems,
  getNavigationItemsForAdmin,
  deleteNavigationItem,
  type AdminNavItem,
  type NavType,
} from '@/app/actions/navigation-admin'
import { NavItemEditor } from './nav-item-editor'
import { AddNavItemDialog } from './add-nav-item-dialog'

interface NavItemsListProps {
  items: AdminNavItem[]
  navType: NavType
  onItemsChange: (items: AdminNavItem[]) => void
  allItems: AdminNavItem[]
  onItemAdded?: (newItem: AdminNavItem) => void
  onItemMoved?: (itemId: string, newNavType: NavType) => void
}

interface SortableItemProps {
  item: AdminNavItem
  onEdit: (item: AdminNavItem) => void
  onDelete: (item: AdminNavItem) => void
  isDeleting: boolean
}

/**
 * Renders a dynamic icon by name using createElement to avoid
 * triggering React Compiler's component-creation-during-render detection
 */
function DynamicIcon({
  iconName,
  className,
}: {
  iconName: string
  className?: string
}) {
  const iconComponent = getIconComponent(iconName)
  return createElement(iconComponent, { className })
}

function SortableItem({
  item,
  onEdit,
  onDelete,
  isDeleting,
}: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-center gap-3 rounded-lg border bg-card p-3 transition-all',
        isDragging && 'opacity-50 shadow-lg',
        item.isRequired && 'border-primary/30 bg-primary/5'
      )}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="cursor-grab text-muted-foreground hover:text-foreground touch-none"
        aria-label={`Drag to reorder ${item.displayName}`}
        data-drag-handle
      >
        <GripVertical className="h-4 w-4" />
      </button>

      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted">
        <DynamicIcon iconName={item.iconName} className="h-4 w-4" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium truncate">{item.displayName}</span>
          {item.isCustomObject && (
            <Badge variant="secondary" className="text-xs">
              <Sparkles className="h-3 w-3 mr-1" />
              Custom
            </Badge>
          )}
          {item.isRequired && (
            <Badge variant="outline" className="text-xs">
              <Lock className="h-3 w-3 mr-1" />
              Required
            </Badge>
          )}
        </div>
        {item.objectApiName && (
          <span className="text-xs text-muted-foreground">
            {item.objectApiName}
          </span>
        )}
        {item.itemKey && !item.objectApiName && (
          <span className="text-xs text-muted-foreground">{item.itemKey}</span>
        )}
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => onEdit(item)}
          aria-label={`Edit ${item.displayName}`}
        >
          <Pencil className="h-4 w-4" />
        </Button>
        {item.canBeRemoved && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
            onClick={() => onDelete(item)}
            disabled={isDeleting}
            aria-label={`Delete ${item.displayName}`}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  )
}

export function NavItemsList({
  items,
  navType,
  onItemsChange,
  allItems,
  onItemAdded,
  onItemMoved,
}: NavItemsListProps) {
  const [isPending, startTransition] = useTransition()
  const [editingItem, setEditingItem] = useState<AdminNavItem | null>(null)
  const [localItems, setLocalItems] = useState(items)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null)

  // Sync local items when props change
  if (items !== localItems && !isPending) {
    setLocalItems(items)
  }

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = localItems.findIndex(item => item.id === active.id)
      const newIndex = localItems.findIndex(item => item.id === over.id)

      const newItems = arrayMove(localItems, oldIndex, newIndex)
      setLocalItems(newItems)

      // Update sort order in database
      startTransition(async () => {
        const itemIds = newItems.map(item => item.id)
        const result = await reorderAdminNavItems(itemIds, navType)

        if (result.success) {
          // Refetch all items to get fresh IDs (reorder may create new org-specific records)
          const refetchResult = await getNavigationItemsForAdmin()
          if (refetchResult.success && refetchResult.data) {
            // Update parent state
            onItemsChange(refetchResult.data)
            // Also update local items directly with the filtered items for this nav type
            // This ensures we don't rely on React's render timing for the sync
            const freshItemsForThisType = refetchResult.data.filter(
              item => item.navType === navType
            )
            setLocalItems(freshItemsForThisType)
            toast.success('Order saved')
          } else {
            // Fallback: update sort order locally if refetch fails
            const updatedAllItems = allItems.map(item => {
              const newIndex = newItems.findIndex(i => i.id === item.id)
              if (newIndex !== -1) {
                return { ...item, sortOrder: (newIndex + 1) * 10 }
              }
              return item
            })
            onItemsChange(updatedAllItems)
            toast.success('Order saved')
          }
        } else {
          // Revert on error
          setLocalItems(items)
          toast.error(result.error || 'Failed to save order')
        }
      })
    }
  }

  const handleEditComplete = (updatedItem: AdminNavItem) => {
    // Update both local and parent state
    const updatedAllItems = allItems.map(item =>
      item.id === updatedItem.id ? updatedItem : item
    )
    onItemsChange(updatedAllItems)
    setEditingItem(null)
  }

  const handleItemAdded = (newItem: AdminNavItem) => {
    onItemAdded?.(newItem)
  }

  const handleItemMoved = (itemId: string, newNavType: NavType) => {
    onItemMoved?.(itemId, newNavType)
  }

  const handleDelete = (item: AdminNavItem) => {
    if (!item.canBeRemoved) {
      toast.error('This item cannot be removed')
      return
    }

    setDeletingItemId(item.id)
    startTransition(async () => {
      const result = await deleteNavigationItem(item.id)

      if (result.success) {
        // Remove from local state immediately
        const updatedItems = allItems.filter(i => i.id !== item.id)
        onItemsChange(updatedItems)
        toast.success(`"${item.displayName}" removed`)
      } else {
        toast.error(result.error || 'Failed to remove item')
      }
      setDeletingItemId(null)
    })
  }

  if (localItems.length === 0) {
    return (
      <>
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="text-sm text-muted-foreground mb-4">
            No items in this section
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAddDialogOpen(true)}
            aria-label={`Add item to ${navType.replace('_', ' ')}`}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Item
          </Button>
        </div>

        <AddNavItemDialog
          open={isAddDialogOpen}
          onOpenChange={setIsAddDialogOpen}
          targetNavType={navType}
          existingItems={allItems}
          onItemAdded={handleItemAdded}
          onItemMoved={handleItemMoved}
        />
      </>
    )
  }

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={localItems.map(item => item.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {localItems.map(item => (
              <SortableItem
                key={item.id}
                item={item}
                onEdit={setEditingItem}
                onDelete={handleDelete}
                isDeleting={deletingItemId === item.id}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* Add Item Button */}
      <Button
        variant="outline"
        size="sm"
        className="mt-3 w-full border-dashed"
        onClick={() => setIsAddDialogOpen(true)}
        aria-label={`Add item to ${navType.replace('_', ' ')}`}
      >
        <Plus className="h-4 w-4 mr-2" />
        Add Item
      </Button>

      {editingItem && (
        <NavItemEditor
          item={editingItem}
          open={!!editingItem}
          onOpenChange={open => !open && setEditingItem(null)}
          onSave={handleEditComplete}
        />
      )}

      <AddNavItemDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        targetNavType={navType}
        existingItems={allItems}
        onItemAdded={handleItemAdded}
        onItemMoved={handleItemMoved}
      />
    </>
  )
}
