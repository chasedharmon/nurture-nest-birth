'use client'

/**
 * NavTabs
 *
 * Horizontal tabs for CRM object navigation (Accounts, Contacts, etc.)
 * Icons are looked up client-side using getIconComponent().
 *
 * Features:
 * - Dynamic navigation items from database
 * - User personalization (add/remove items)
 * - Context menu for removing items
 */

import { useTransition } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { buildUrlWithPreservedParams } from '@/lib/navigation-utils'
import {
  type SerializableNavItem,
  getIconComponent,
} from '@/lib/admin-navigation'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu'
import { toast } from 'sonner'
import { removeNavItemFromPersonalNav } from '@/app/actions/navigation-user'
import { AddNavItemsPopover } from './add-nav-items-popover'

interface NavTabsProps {
  items: SerializableNavItem[]
  showAddButton?: boolean
}

export function NavTabs({ items, showAddButton = true }: NavTabsProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const handleRemoveItem = (item: SerializableNavItem) => {
    // Check if item can be removed
    if (item.isRequired || item.canBeRemoved === false) {
      toast.error('This item cannot be removed')
      return
    }

    startTransition(async () => {
      const result = await removeNavItemFromPersonalNav(item.id)

      if (result.success) {
        toast.success(`${item.label} removed from navigation`)
        router.refresh()
      } else {
        toast.error(result.error || 'Failed to remove item')
      }
    })
  }

  return (
    <nav className="flex items-center gap-1" aria-label="Main navigation">
      {items.map(item => {
        const Icon = getIconComponent(item.icon)
        const isActive =
          pathname === item.href || pathname.startsWith(`${item.href}/`)

        // Build href with preserved params for list views
        const href = buildUrlWithPreservedParams(item.href)

        // Check if item can be removed (for context menu)
        const canRemove = !item.isRequired && item.canBeRemoved !== false

        const linkContent = (
          <Link
            href={href}
            className={cn(
              'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
              isActive
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              isPending && 'opacity-50'
            )}
            aria-current={isActive ? 'page' : undefined}
          >
            {Icon && <Icon className="h-4 w-4" />}
            <span>{item.label}</span>
            {item.isUserAdded && (
              <span className="sr-only">(Added by you)</span>
            )}
          </Link>
        )

        // Wrap in context menu if removable
        if (canRemove) {
          return (
            <ContextMenu key={item.id}>
              <ContextMenuTrigger asChild>{linkContent}</ContextMenuTrigger>
              <ContextMenuContent>
                <ContextMenuItem
                  onClick={() => handleRemoveItem(item)}
                  className="text-destructive focus:text-destructive"
                >
                  <X className="h-4 w-4 mr-2" />
                  Remove from navigation
                </ContextMenuItem>
              </ContextMenuContent>
            </ContextMenu>
          )
        }

        return <span key={item.id}>{linkContent}</span>
      })}

      {/* Add button for personalization */}
      {showAddButton && (
        <AddNavItemsPopover onItemAdded={() => router.refresh()} />
      )}
    </nav>
  )
}
