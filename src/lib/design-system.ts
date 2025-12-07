/**
 * Design System Constants
 * Centralized spacing, sizing, and styling constants for consistency
 */

export const spacing = {
  // Section Padding (Vertical)
  section: {
    sm: 'py-12 lg:py-16', // Smaller sections
    md: 'py-16 lg:py-20', // Standard sections
    lg: 'py-20 lg:py-24', // Hero/feature sections
  },
  // Container Padding (Horizontal)
  container: 'px-6 lg:px-8',
} as const

export const maxWidth = {
  article: 'max-w-3xl', // Blog posts, long-form content
  content: 'max-w-4xl', // Standard content sections
  layout: 'max-w-7xl', // Grid layouts, full-width content
} as const

export const grid = {
  gap: {
    tight: 'gap-6', // 4-column grids
    medium: 'gap-8', // 2-3 column grids
    loose: 'gap-12', // Hero layouts, feature sections
  },
  cols: {
    two: 'md:grid-cols-2',
    three: 'sm:grid-cols-2 lg:grid-cols-3',
    four: 'sm:grid-cols-2 lg:grid-cols-4',
  },
} as const

export const typography = {
  h1: 'font-serif text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl',
  h2: 'font-serif text-3xl font-bold tracking-tight text-foreground',
  h3: 'font-serif text-2xl font-semibold tracking-tight text-foreground',
  h4: 'font-serif text-xl font-semibold text-foreground',
  lead: 'text-lg text-muted-foreground sm:text-xl',
  body: 'text-base text-muted-foreground',
  small: 'text-sm text-muted-foreground',
} as const

export const card = {
  base: 'border-2 transition-all duration-300',
  interactive:
    'hover:-translate-y-1 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/10',
  featured: 'border-primary/30 bg-primary/5',
} as const

export const icon = {
  container: {
    sm: 'h-6 w-6', // Small icons (navigation, inline)
    md: 'h-12 w-12 rounded-2xl bg-gradient-to-br from-primary/15 to-secondary/10', // Standard feature icons
    lg: 'h-14 w-14 rounded-2xl bg-gradient-to-br from-primary/15 to-secondary/10', // Hero/featured icons
  },
  size: {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-7 w-7',
  },
} as const

export const badge = {
  base: 'inline-flex items-center rounded-full px-3 py-1 text-sm font-medium',
  variants: {
    primary: 'bg-primary/10 text-primary',
    secondary: 'bg-secondary/10 text-secondary',
    muted: 'bg-muted text-muted-foreground',
  },
} as const

export const animation = {
  transition: 'transition-all duration-300',
  transitionColors: 'transition-colors',
  fadeIn: {
    base: 'opacity-0 animate-fade-in',
    delay: (index: number) => `[animation-delay:${index * 100}ms]`,
  },
} as const
