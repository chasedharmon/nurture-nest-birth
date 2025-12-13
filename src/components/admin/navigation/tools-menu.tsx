'use client'

/**
 * ToolsMenu
 *
 * Dropdown menu for tools (Reports, Dashboards, Messages, Workflows).
 */

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Wrench, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import type { NavItem } from '@/lib/admin-navigation'

interface ToolsMenuProps {
  items: NavItem[]
}

export function ToolsMenu({ items }: ToolsMenuProps) {
  const pathname = usePathname()

  // Check if any tool item is active
  const hasActiveItem = items.some(
    item => pathname === item.href || pathname.startsWith(`${item.href}/`)
  )

  // Get total badge count
  const totalBadge = items.reduce((sum, item) => sum + (item.badge || 0), 0)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className={cn(
            'flex items-center gap-2',
            hasActiveItem && 'bg-primary/10 text-primary'
          )}
        >
          <Wrench className="h-4 w-4" />
          <span className="hidden sm:inline">Tools</span>
          {totalBadge > 0 && (
            <Badge variant="destructive" className="ml-1 h-5 min-w-5 px-1.5">
              {totalBadge > 99 ? '99+' : totalBadge}
            </Badge>
          )}
          <ChevronDown className="h-3 w-3 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {items.map(item => {
          const Icon = item.iconComponent
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`)

          return (
            <DropdownMenuItem key={item.id} asChild>
              <Link
                href={item.href}
                className={cn(
                  'flex w-full items-center gap-3 cursor-pointer',
                  isActive && 'bg-primary/10 text-primary'
                )}
              >
                {Icon && <Icon className="h-4 w-4" />}
                <span className="flex-1">{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <Badge variant="destructive" className="h-5 min-w-5 px-1.5">
                    {item.badge > 99 ? '99+' : item.badge}
                  </Badge>
                )}
              </Link>
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
