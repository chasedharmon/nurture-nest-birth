'use client'

import { useState, useTransition, createElement } from 'react'
import {
  Loader2,
  Link as LinkIcon,
  Box,
  ArrowRight,
  Search,
  Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { getIconComponent } from '@/lib/admin-navigation'
import {
  addNavigationItem,
  moveNavigationItem,
  getAvailableObjectsForNav,
  type AdminNavItem,
  type NavType,
} from '@/app/actions/navigation-admin'
import { IconPicker } from './icon-picker'

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

interface AvailableObject {
  id: string
  apiName: string
  label: string
  pluralLabel: string
  isCustom: boolean
}

interface AddNavItemDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  targetNavType: NavType
  existingItems: AdminNavItem[]
  onItemAdded: (newItem: AdminNavItem) => void
  onItemMoved: (itemId: string, newNavType: NavType) => void
}

const navTypeLabels: Record<NavType, string> = {
  primary_tab: 'Primary Navigation',
  tools_menu: 'Tools Menu',
  admin_menu: 'Admin Menu',
}

export function AddNavItemDialog({
  open,
  onOpenChange,
  targetNavType,
  existingItems,
  onItemAdded,
  onItemMoved,
}: AddNavItemDialogProps) {
  const [isPending, startTransition] = useTransition()
  const [activeTab, setActiveTab] = useState<'move' | 'object' | 'link'>('move')

  // Move tab state
  const [searchQuery, setSearchQuery] = useState('')

  // Object tab state
  const [availableObjects, setAvailableObjects] = useState<AvailableObject[]>(
    []
  )
  const [isLoadingObjects, setIsLoadingObjects] = useState(false)
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null)

  // Link tab state
  const [linkDisplayName, setLinkDisplayName] = useState('')
  const [linkUrl, setLinkUrl] = useState('')
  const [linkIconName, setLinkIconName] = useState('link')

  // Items that can be moved (items in other groups)
  const itemsInOtherGroups = existingItems.filter(
    item => item.navType !== targetNavType
  )

  const filteredItemsToMove = itemsInOtherGroups.filter(item =>
    item.displayName.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Load available objects when needed
  const loadAvailableObjects = async () => {
    if (availableObjects.length > 0) return
    setIsLoadingObjects(true)
    const result = await getAvailableObjectsForNav()
    setIsLoadingObjects(false)
    if (result.success && result.data) {
      setAvailableObjects(result.data)
    }
  }

  // Handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value as typeof activeTab)
    if (value === 'object') {
      loadAvailableObjects()
    }
  }

  // Handle dialog open state change - reset form when opening
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      // Reset state when dialog opens
      setSearchQuery('')
      setSelectedObjectId(null)
      setLinkDisplayName('')
      setLinkUrl('')
      setLinkIconName('link')
      setActiveTab('move')
    }
    onOpenChange(newOpen)
  }

  const handleMoveItem = (item: AdminNavItem) => {
    startTransition(async () => {
      const result = await moveNavigationItem(item.id, targetNavType)

      if (result.success) {
        toast.success(
          `Moved "${item.displayName}" to ${navTypeLabels[targetNavType]}`
        )
        onItemMoved(item.id, targetNavType)
        onOpenChange(false)
      } else {
        toast.error(result.error || 'Failed to move item')
      }
    })
  }

  const handleAddObject = () => {
    if (!selectedObjectId) return

    const selectedObj = availableObjects.find(
      obj => obj.id === selectedObjectId
    )
    if (!selectedObj) return

    startTransition(async () => {
      const result = await addNavigationItem({
        itemType: 'object',
        navType: targetNavType,
        displayName: selectedObj.pluralLabel || selectedObj.label,
        iconName: 'box',
        objectDefinitionId: selectedObjectId,
      })

      if (result.success && result.data) {
        toast.success(
          `Added "${selectedObj.label}" to ${navTypeLabels[targetNavType]}`
        )
        onItemAdded(result.data)
        onOpenChange(false)
      } else {
        toast.error(result.error || 'Failed to add object')
      }
    })
  }

  const handleAddLink = () => {
    if (!linkDisplayName.trim() || !linkUrl.trim()) return

    // Basic URL validation
    let finalUrl = linkUrl.trim()
    if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
      finalUrl = 'https://' + finalUrl
    }

    startTransition(async () => {
      const result = await addNavigationItem({
        itemType: 'external_link',
        navType: targetNavType,
        displayName: linkDisplayName.trim(),
        iconName: linkIconName,
        itemHref: finalUrl,
      })

      if (result.success && result.data) {
        toast.success(
          `Added "${linkDisplayName}" to ${navTypeLabels[targetNavType]}`
        )
        onItemAdded(result.data)
        onOpenChange(false)
      } else {
        toast.error(result.error || 'Failed to add link')
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Item to {navTypeLabels[targetNavType]}</DialogTitle>
          <DialogDescription>
            Move an existing item, add a custom object, or create a link.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="move" className="text-xs sm:text-sm">
              <ArrowRight className="h-4 w-4 mr-1.5" />
              Move Item
            </TabsTrigger>
            <TabsTrigger value="object" className="text-xs sm:text-sm">
              <Box className="h-4 w-4 mr-1.5" />
              Object
            </TabsTrigger>
            <TabsTrigger value="link" className="text-xs sm:text-sm">
              <LinkIcon className="h-4 w-4 mr-1.5" />
              Link
            </TabsTrigger>
          </TabsList>

          {/* Move Item Tab */}
          <TabsContent value="move" className="mt-4 space-y-4">
            <p className="text-sm text-muted-foreground">
              Move an item from another navigation group to{' '}
              {navTypeLabels[targetNavType]}.
            </p>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search items..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <ScrollArea className="h-[240px] rounded-md border">
              {filteredItemsToMove.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full py-8 text-center">
                  <p className="text-sm text-muted-foreground">
                    {searchQuery
                      ? 'No items match your search'
                      : 'No items available to move'}
                  </p>
                </div>
              ) : (
                <div className="p-2 space-y-1">
                  {filteredItemsToMove.map(item => (
                    <button
                      key={item.id}
                      onClick={() => handleMoveItem(item)}
                      disabled={isPending}
                      className={cn(
                        'w-full flex items-center gap-3 p-2.5 rounded-md text-left',
                        'hover:bg-muted transition-colors',
                        'disabled:opacity-50 disabled:cursor-not-allowed'
                      )}
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted">
                        <DynamicIcon
                          iconName={item.iconName}
                          className="h-4 w-4"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm truncate">
                            {item.displayName}
                          </span>
                          {item.isCustomObject && (
                            <Badge variant="secondary" className="text-xs">
                              <Sparkles className="h-3 w-3 mr-1" />
                              Custom
                            </Badge>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          Currently in {navTypeLabels[item.navType as NavType]}
                        </span>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          {/* Object Tab */}
          <TabsContent value="object" className="mt-4 space-y-4">
            <p className="text-sm text-muted-foreground">
              Add a custom object that is not yet in navigation.
            </p>

            <ScrollArea className="h-[240px] rounded-md border">
              {isLoadingObjects ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : availableObjects.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full py-8 text-center px-4">
                  <Box className="h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    All objects are already in navigation
                  </p>
                </div>
              ) : (
                <div className="p-2 space-y-1">
                  {availableObjects.map(obj => (
                    <button
                      key={obj.id}
                      onClick={() => setSelectedObjectId(obj.id)}
                      className={cn(
                        'w-full flex items-center gap-3 p-2.5 rounded-md text-left',
                        'hover:bg-muted transition-colors',
                        selectedObjectId === obj.id &&
                          'bg-primary/10 ring-1 ring-primary'
                      )}
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted">
                        <Box className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm truncate">
                            {obj.pluralLabel || obj.label}
                          </span>
                          {obj.isCustom && (
                            <Badge variant="secondary" className="text-xs">
                              <Sparkles className="h-3 w-3 mr-1" />
                              Custom
                            </Badge>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {obj.apiName}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleAddObject}
                disabled={isPending || !selectedObjectId}
              >
                {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Add Object
              </Button>
            </DialogFooter>
          </TabsContent>

          {/* Link Tab */}
          <TabsContent value="link" className="mt-4 space-y-4">
            <p className="text-sm text-muted-foreground">
              Create a custom link to an external URL.
            </p>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="linkDisplayName">Display Name</Label>
                <Input
                  id="linkDisplayName"
                  placeholder="e.g., Documentation"
                  value={linkDisplayName}
                  onChange={e => setLinkDisplayName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="linkUrl">URL</Label>
                <Input
                  id="linkUrl"
                  placeholder="https://example.com"
                  value={linkUrl}
                  onChange={e => setLinkUrl(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Icon</Label>
                <IconPicker value={linkIconName} onChange={setLinkIconName} />
              </div>

              {/* Preview */}
              {(linkDisplayName || linkUrl) && (
                <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-background">
                    <DynamicIcon iconName={linkIconName} className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="font-medium text-sm">
                      {linkDisplayName || 'Link name'}
                    </div>
                    <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                      {linkUrl || 'https://...'}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleAddLink}
                disabled={
                  isPending || !linkDisplayName.trim() || !linkUrl.trim()
                }
              >
                {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Add Link
              </Button>
            </DialogFooter>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
