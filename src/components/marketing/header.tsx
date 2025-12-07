import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { spacing, typography } from '@/lib/design-system'

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <nav
        className={`mx-auto flex h-16 max-w-7xl items-center justify-between ${spacing.container}`}
      >
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <span className={`${typography.h4} font-bold`}>
            Nurture Nest Birth
          </span>
        </Link>

        {/* Navigation Links */}
        <div className="hidden items-center gap-8 md:flex">
          <Link
            href="/about"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            About
          </Link>
          <Link
            href="/services"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Services
          </Link>
          <Link
            href="/blog"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Blog
          </Link>
          <Link
            href="/faq"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            FAQ
          </Link>
          <Link
            href="/contact"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Contact
          </Link>
        </div>

        {/* CTA Button */}
        <div className="flex items-center gap-4">
          <Button asChild size="sm" className="hidden sm:inline-flex">
            <Link href="/contact">Book Consultation</Link>
          </Button>

          {/* Mobile Menu Button - Placeholder for future */}
          <button className="md:hidden" aria-label="Menu">
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        </div>
      </nav>
    </header>
  )
}
