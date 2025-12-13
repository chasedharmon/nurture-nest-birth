'use client'

/**
 * UserMenu
 *
 * Dropdown menu for user actions (Team, Setup, Sign Out).
 * Icons are looked up client-side using getIconComponent().
 */

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { User, LogOut, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { createClient } from '@/lib/supabase/client'
import {
  type SerializableNavItem,
  getIconComponent,
} from '@/lib/admin-navigation'

interface UserMenuProps {
  adminItems: SerializableNavItem[]
  brandName: string
  userRole: string | null
}

export function UserMenu({ adminItems, brandName, userRole }: UserMenuProps) {
  const router = useRouter()
  const pathname = usePathname()

  // Check if any admin item is active
  const hasActiveItem = adminItems.some(
    item => pathname === item.href || pathname.startsWith(`${item.href}/`)
  )

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

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
          <User className="h-4 w-4" />
          <span className="hidden sm:inline">Account</span>
          <ChevronDown className="h-3 w-3 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {/* User Info Header */}
        <div className="px-2 py-2 border-b border-border">
          <p className="text-sm font-medium">{brandName}</p>
          {userRole && (
            <p className="text-xs text-muted-foreground capitalize">
              {userRole}
            </p>
          )}
        </div>

        {/* Admin Items */}
        {adminItems.map(item => {
          const Icon = getIconComponent(item.icon)
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
                <span>{item.label}</span>
              </Link>
            </DropdownMenuItem>
          )
        })}

        <DropdownMenuSeparator />

        {/* Sign Out */}
        <DropdownMenuItem
          onClick={handleSignOut}
          className="text-destructive focus:text-destructive cursor-pointer"
        >
          <LogOut className="mr-3 h-4 w-4" />
          <span>Sign Out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
