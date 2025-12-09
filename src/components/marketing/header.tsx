'use client'

import Link from 'next/link'
import { useState } from 'react'
import { MenuIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from '@/components/ui/sheet'
import { spacing, typography } from '@/lib/design-system'

const navLinks = [
  { href: '/about', label: 'About' },
  { href: '/services', label: 'Services' },
  { href: '/blog', label: 'Blog' },
  { href: '/faq', label: 'FAQ' },
  { href: '/contact', label: 'Contact' },
]

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <nav
        aria-label="Main navigation"
        className={`mx-auto flex h-16 max-w-7xl items-center justify-between ${spacing.container}`}
      >
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2"
          aria-label="Nurture Nest Birth home"
        >
          <span className={`${typography.h4} font-bold`} aria-hidden="true">
            Nurture Nest Birth
          </span>
        </Link>

        {/* Desktop Navigation Links */}
        <div className="hidden items-center gap-8 md:flex" role="list">
          {navLinks.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* CTA Button & Mobile Menu */}
        <div className="flex items-center gap-4">
          <Button asChild size="sm" className="hidden sm:inline-flex">
            <Link href="/contact">Book Consultation</Link>
          </Button>

          {/* Mobile Menu Button */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              aria-label="Open navigation menu"
              aria-expanded={mobileMenuOpen}
              onClick={() => setMobileMenuOpen(true)}
            >
              <MenuIcon className="h-6 w-6" aria-hidden="true" />
            </Button>

            <SheetContent side="right" className="w-[300px] sm:w-[350px]">
              <SheetHeader>
                <SheetTitle className={`${typography.h4} font-bold`}>
                  Nurture Nest Birth
                </SheetTitle>
              </SheetHeader>

              <nav
                className="flex flex-col gap-1 px-2 pt-4"
                aria-label="Mobile navigation"
              >
                {navLinks.map(link => (
                  <SheetClose key={link.href} asChild>
                    <Link
                      href={link.href}
                      className="flex items-center rounded-lg px-4 py-3 text-base font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </SheetClose>
                ))}
              </nav>

              <div className="mt-auto border-t px-6 py-6">
                <SheetClose asChild>
                  <Button asChild className="w-full">
                    <Link href="/contact">Book Consultation</Link>
                  </Button>
                </SheetClose>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </header>
  )
}
