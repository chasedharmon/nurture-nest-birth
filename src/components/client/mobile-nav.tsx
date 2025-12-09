'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Menu,
  X,
  Home,
  Calendar,
  FileText,
  CreditCard,
  User,
  BookOpen,
  ClipboardList,
  Receipt,
  Sparkles,
  MessageSquare,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/client/dashboard', label: 'Dashboard', icon: Home },
  { href: '/client/messages', label: 'Messages', icon: MessageSquare },
  { href: '/client/services', label: 'Services', icon: Sparkles },
  { href: '/client/meetings', label: 'Meetings', icon: Calendar },
  { href: '/client/documents', label: 'Documents', icon: FileText },
  { href: '/client/payments', label: 'Payments', icon: CreditCard },
  { href: '/client/invoices', label: 'Invoices', icon: Receipt },
  { href: '/client/intake', label: 'Intake', icon: ClipboardList },
  { href: '/client/resources', label: 'Resources', icon: BookOpen },
  { href: '/client/profile', label: 'Profile', icon: User },
]

export function MobileNav() {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()

  return (
    <div className="md:hidden">
      {/* Hamburger Button - 44px minimum touch target */}
      <Button
        variant="ghost"
        size="icon"
        className="h-11 w-11"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? 'Close menu' : 'Open menu'}
        aria-expanded={isOpen}
      >
        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </Button>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 top-16 z-40 bg-background/80 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />

          {/* Menu Panel */}
          <nav
            className="fixed inset-x-0 top-16 z-50 bg-card border-b border-border shadow-lg animate-in slide-in-from-top-2 duration-200"
            role="navigation"
            aria-label="Mobile navigation"
          >
            <div className="max-w-7xl mx-auto px-4 py-4">
              <ul className="space-y-1">
                {navItems.map(item => {
                  const Icon = item.icon
                  const isActive = pathname === item.href

                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={() => setIsOpen(false)}
                        className={cn(
                          'flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium transition-colors',
                          'min-h-[44px]', // Minimum touch target
                          isActive
                            ? 'bg-primary/10 text-primary'
                            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                        )}
                        aria-current={isActive ? 'page' : undefined}
                      >
                        <Icon className="h-5 w-5 shrink-0" />
                        {item.label}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </div>
          </nav>
        </>
      )}
    </div>
  )
}
