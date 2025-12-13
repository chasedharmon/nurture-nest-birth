'use client'

import {
  useState,
  useEffect,
  useTransition,
  createElement,
  useRef,
} from 'react'
import { Plus, Search, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { getIconComponent } from '@/lib/admin-navigation'
import {
  getAvailableNavItems,
  addNavItemToPersonalNav,
  type AvailableNavItem,
} from '@/app/actions/navigation-user'

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

interface AddNavItemsPopoverProps {
  onItemAdded?: () => void
}

export function AddNavItemsPopover({ onItemAdded }: AddNavItemsPopoverProps) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [availableItems, setAvailableItems] = useState<AvailableNavItem[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [addingItemId, setAddingItemId] = useState<string | null>(null)
  const [loadedOnce, setLoadedOnce] = useState(false)
  const loadingRef = useRef(false)

  // Derive loading state from whether we're in a loading operation
  const isLoading = open && !loadedOnce && !availableItems.length

  // Load available items when popover opens
  useEffect(() => {
    if (!open || loadingRef.current) return

    loadingRef.current = true

    const loadItems = async () => {
      const result = await getAvailableNavItems()
      if (result.success && result.data) {
        setAvailableItems(result.data)
      }
      setLoadedOnce(true)
      loadingRef.current = false
    }

    loadItems()
  }, [open])

  const filteredItems = availableItems.filter(item =>
    item.displayName.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleAddItem = (item: AvailableNavItem) => {
    setAddingItemId(item.id)
    startTransition(async () => {
      const result = await addNavItemToPersonalNav(item.id)

      if (result.success) {
        toast.success(`${item.displayName} added to navigation`)
        // Remove from available items
        setAvailableItems(prev => prev.filter(i => i.id !== item.id))
        onItemAdded?.()
      } else {
        toast.error(result.error || 'Failed to add item')
      }

      setAddingItemId(null)
    })
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0" align="end">
        <div className="p-3 border-b">
          <h4 className="font-medium text-sm mb-2">Add to Navigation</h4>
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search items..."
              className="pl-8 h-9"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <ScrollArea className="h-[280px]">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              {searchQuery
                ? 'No matching items found'
                : 'No items available to add'}
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {filteredItems.map(item => {
                const isAdding = addingItemId === item.id
                return (
                  <button
                    key={item.id}
                    className="w-full flex items-center gap-3 p-2 rounded-md hover:bg-muted text-left transition-colors disabled:opacity-50"
                    onClick={() => handleAddItem(item)}
                    disabled={isPending}
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded bg-muted">
                      {isAdding ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <DynamicIcon
                          iconName={item.iconName}
                          className="h-4 w-4"
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">
                        {item.displayName}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {item.navType === 'primary_tab'
                          ? 'Primary Tab'
                          : item.navType === 'tools_menu'
                            ? 'Tools Menu'
                            : 'Admin Menu'}
                      </div>
                    </div>
                    {item.isCustomObject && (
                      <Badge variant="secondary" className="text-[10px]">
                        Custom
                      </Badge>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}
