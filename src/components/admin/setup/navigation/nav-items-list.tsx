'use client'

import { useState, useTransition, createElement } from 'react'
import { GripVertical, Pencil, Lock, Sparkles } from 'lucide-react'
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
  type AdminNavItem,
} from '@/app/actions/navigation-admin'
import { NavItemEditor } from './nav-item-editor'

interface NavItemsListProps {
  items: AdminNavItem[]
  navType: 'primary_tab' | 'tools_menu' | 'admin_menu'
  onItemsChange: (items: AdminNavItem[]) => void
  allItems: AdminNavItem[]
}

interface SortableItemProps {
  item: AdminNavItem
  onEdit: (item: AdminNavItem) => void
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

function SortableItem({ item, onEdit }: SortableItemProps) {
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

      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={() => onEdit(item)}
      >
        <Pencil className="h-4 w-4" />
      </Button>
    </div>
  )
}

export function NavItemsList({
  items,
  navType,
  onItemsChange,
  allItems,
}: NavItemsListProps) {
  const [isPending, startTransition] = useTransition()
  const [editingItem, setEditingItem] = useState<AdminNavItem | null>(null)
  const [localItems, setLocalItems] = useState(items)

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
          // Update parent state with new order
          const updatedAllItems = allItems.map(item => {
            const newIndex = newItems.findIndex(i => i.id === item.id)
            if (newIndex !== -1) {
              return { ...item, sortOrder: (newIndex + 1) * 10 }
            }
            return item
          })
          onItemsChange(updatedAllItems)
          toast.success('Order saved')
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

  if (localItems.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center">
        <p className="text-sm text-muted-foreground">
          No items in this section
        </p>
      </div>
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
              <SortableItem key={item.id} item={item} onEdit={setEditingItem} />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {editingItem && (
        <NavItemEditor
          item={editingItem}
          open={!!editingItem}
          onOpenChange={open => !open && setEditingItem(null)}
          onSave={handleEditComplete}
        />
      )}
    </>
  )
}
