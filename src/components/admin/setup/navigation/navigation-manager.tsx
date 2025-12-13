'use client'

import { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, RotateCcw, Save, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import {
  getNavigationItemsForAdmin,
  getConfigurableRoles,
  resetNavigationToDefaults,
  type AdminNavItem,
  type NavType,
} from '@/app/actions/navigation-admin'
import { NavItemsList } from './nav-items-list'
import { RoleVisibilityMatrix } from './role-visibility-matrix'

export function NavigationManager() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [activeTab, setActiveTab] = useState('items')
  const [navItems, setNavItems] = useState<AdminNavItem[]>([])
  const [roles, setRoles] = useState<Array<{ name: string; label: string }>>([])
  const [isLoading, setIsLoading] = useState(true)
  const [hasChanges, setHasChanges] = useState(false)

  // Load data on mount
  useEffect(() => {
    async function loadData() {
      setIsLoading(true)
      try {
        const [itemsResult, rolesResult] = await Promise.all([
          getNavigationItemsForAdmin(),
          getConfigurableRoles(),
        ])

        if (itemsResult.success && itemsResult.data) {
          setNavItems(itemsResult.data)
        } else {
          toast.error(itemsResult.error || 'Failed to load navigation items')
        }

        if (rolesResult.success && rolesResult.data) {
          setRoles(rolesResult.data)
        }
      } catch (error) {
        console.error('Error loading navigation data:', error)
        toast.error('Failed to load navigation settings')
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [])

  const handleReset = async () => {
    startTransition(async () => {
      const result = await resetNavigationToDefaults()
      if (result.success) {
        toast.success('Navigation reset to defaults')
        // Reload data
        const itemsResult = await getNavigationItemsForAdmin()
        if (itemsResult.success && itemsResult.data) {
          setNavItems(itemsResult.data)
        }
        setHasChanges(false)
        router.refresh()
      } else {
        toast.error(result.error || 'Failed to reset navigation')
      }
    })
  }

  const handleItemsChange = (updatedItems: AdminNavItem[]) => {
    setNavItems(updatedItems)
    setHasChanges(true)
  }

  const handleItemAdded = (newItem: AdminNavItem) => {
    setNavItems(prev => [...prev, newItem])
    setHasChanges(true)
  }

  const handleItemMoved = (itemId: string, newNavType: NavType) => {
    setNavItems(prev =>
      prev.map(item =>
        item.id === itemId ? { ...item, navType: newNavType } : item
      )
    )
    setHasChanges(true)
  }

  // Group items by nav type
  const primaryTabs = navItems.filter(item => item.navType === 'primary_tab')
  const toolsMenu = navItems.filter(item => item.navType === 'tools_menu')
  const adminMenu = navItems.filter(item => item.navType === 'admin_menu')

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <Link href="/admin/setup">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <h1 className="text-2xl font-semibold tracking-tight">
              Navigation Settings
            </h1>
          </div>
          <p className="text-muted-foreground ml-11">
            Configure which items appear in the navigation bar and who can see
            them.
          </p>
        </div>

        <div className="flex gap-2">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" disabled={isPending}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset to Defaults
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Reset Navigation Settings?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will remove all customizations and restore the default
                  navigation configuration. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleReset}>
                  Reset to Defaults
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="items">Items & Order</TabsTrigger>
          <TabsTrigger value="visibility">Role Visibility</TabsTrigger>
        </TabsList>

        <TabsContent value="items" className="mt-6 space-y-8">
          {/* Primary Tabs */}
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-medium">Primary Navigation</h2>
              <p className="text-sm text-muted-foreground">
                Main navigation tabs. Drag to reorder.
              </p>
            </div>
            <NavItemsList
              items={primaryTabs}
              navType="primary_tab"
              onItemsChange={handleItemsChange}
              allItems={navItems}
              onItemAdded={handleItemAdded}
              onItemMoved={handleItemMoved}
            />
          </div>

          {/* Tools Menu */}
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-medium">Tools Menu</h2>
              <p className="text-sm text-muted-foreground">
                Items in the tools dropdown menu.
              </p>
            </div>
            <NavItemsList
              items={toolsMenu}
              navType="tools_menu"
              onItemsChange={handleItemsChange}
              allItems={navItems}
              onItemAdded={handleItemAdded}
              onItemMoved={handleItemMoved}
            />
          </div>

          {/* Admin Menu */}
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-medium">Admin Menu</h2>
              <p className="text-sm text-muted-foreground">
                Team and settings items.
              </p>
            </div>
            <NavItemsList
              items={adminMenu}
              navType="admin_menu"
              onItemsChange={handleItemsChange}
              allItems={navItems}
              onItemAdded={handleItemAdded}
              onItemMoved={handleItemMoved}
            />
          </div>
        </TabsContent>

        <TabsContent value="visibility" className="mt-6">
          <RoleVisibilityMatrix
            items={navItems}
            roles={roles}
            onItemsChange={handleItemsChange}
          />
        </TabsContent>
      </Tabs>

      {/* Unsaved changes indicator */}
      {hasChanges && (
        <div className="fixed bottom-4 right-4 bg-primary text-primary-foreground px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
          <Save className="h-4 w-4" />
          <span className="text-sm">Changes saved automatically</span>
        </div>
      )}
    </div>
  )
}
