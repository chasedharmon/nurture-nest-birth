/**
 * Nurture Nest Birth - Brand Style Guide
 *
 * A warm, organic, film-inspired aesthetic that feels both
 * professional and nurturing. Think: natural light photography,
 * earth tones, soft textures.
 *
 * DESIGN PRINCIPLES:
 * 1. Warm over cool - every color should feel like it belongs in a sunlit nursery
 * 2. Soft over sharp - rounded corners, gentle shadows, breathing room
 * 3. Trust through simplicity - clean layouts, clear hierarchy
 * 4. Personal over corporate - handcrafted feeling, authentic voice
 */

// ============================================
// COLOR SYSTEM
// ============================================
// Built on a harmonious earth-tone palette
// All colors reference CSS custom properties for dark mode support

export const colors = {
  /**
   * Primary: Warm Olive/Sage
   * Use for: CTAs, links, primary actions, brand moments
   * oklch(0.62 0.045 125) - a muted, sophisticated green-gold
   */
  primary: {
    DEFAULT: 'var(--primary)',
    foreground: 'var(--primary-foreground)',
    // Tonal variants for backgrounds and subtle use
    muted: 'hsl(var(--primary) / 0.1)',
    subtle: 'hsl(var(--primary) / 0.05)',
  },

  /**
   * Secondary: Warm Terracotta
   * Use for: Secondary actions, highlights, warmth accents
   * oklch(0.68 0.08 40) - an earthy, clay-inspired tone
   */
  secondary: {
    DEFAULT: 'var(--secondary)',
    foreground: 'var(--secondary-foreground)',
    muted: 'hsl(var(--secondary) / 0.1)',
    subtle: 'hsl(var(--secondary) / 0.05)',
  },

  /**
   * Accent: Rich Terracotta (for emphasis)
   * Use for: Featured items, important callouts, hover states
   * oklch(0.65 0.095 35) - deeper, more saturated
   */
  accent: {
    DEFAULT: 'var(--accent)',
    foreground: 'var(--accent-foreground)',
  },

  /**
   * Neutrals
   * Warm-tinted grays that harmonize with the palette
   */
  neutral: {
    background: 'var(--background)',
    foreground: 'var(--foreground)',
    card: 'var(--card)',
    muted: 'var(--muted)',
    mutedForeground: 'var(--muted-foreground)',
    border: 'var(--border)',
  },

  /**
   * Semantic Colors
   * Used sparingly for specific purposes
   */
  semantic: {
    success: 'oklch(0.65 0.15 145)', // Soft green (for positive states)
    warning: 'oklch(0.75 0.12 70)', // Warm amber (for caution)
    danger: 'var(--destructive)', // Reserved for errors only
    info: 'oklch(0.65 0.1 230)', // Soft blue (used very sparingly)
  },
} as const

// ============================================
// CERTIFICATION/CREDENTIAL STYLING
// ============================================
// Instead of 7 different colors, use tonal variations of brand colors
// This creates cohesion while still differentiating credentials

export const credentialStyles = {
  // Group 1: Birth & Postpartum (Primary olive tones)
  'birth-doula': {
    icon: 'text-primary',
    bg: 'bg-primary/10',
    border: 'border-primary/20',
    hover: 'hover:border-primary/40',
  },
  'postpartum-doula': {
    icon: 'text-primary',
    bg: 'bg-primary/10',
    border: 'border-primary/20',
    hover: 'hover:border-primary/40',
  },

  // Group 2: Specialized Services (Secondary terracotta tones)
  breastfeeding: {
    icon: 'text-secondary',
    bg: 'bg-secondary/10',
    border: 'border-secondary/20',
    hover: 'hover:border-secondary/40',
  },
  'infant-massage': {
    icon: 'text-secondary',
    bg: 'bg-secondary/10',
    border: 'border-secondary/20',
    hover: 'hover:border-secondary/40',
  },

  // Group 3: Safety & Education (Muted/neutral tones)
  cpst: {
    icon: 'text-foreground',
    bg: 'bg-muted',
    border: 'border-border',
    hover: 'hover:border-foreground/30',
  },
  'family-studies': {
    icon: 'text-foreground',
    bg: 'bg-muted',
    border: 'border-border',
    hover: 'hover:border-foreground/30',
  },
  'home-visitation': {
    icon: 'text-foreground',
    bg: 'bg-muted',
    border: 'border-border',
    hover: 'hover:border-foreground/30',
  },
} as const

// ============================================
// COMPONENT PATTERNS
// ============================================

export const componentPatterns = {
  /**
   * Cards - Consistent styling for all card-like elements
   */
  card: {
    base: 'rounded-xl border bg-card transition-all duration-300',
    interactive:
      'hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/5 hover:border-primary/20',
    featured:
      'border-primary/20 bg-gradient-to-br from-primary/5 to-transparent',
    subtle: 'border-transparent bg-muted/50',
  },

  /**
   * Badges/Tags - Small inline labels
   */
  badge: {
    base: 'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium',
    primary: 'bg-primary/10 text-primary',
    secondary: 'bg-secondary/10 text-secondary',
    muted: 'bg-muted text-muted-foreground',
    outline: 'border border-border text-muted-foreground',
  },

  /**
   * Callouts/Alerts - Important information blocks
   */
  callout: {
    base: 'rounded-lg border-l-4 p-4',
    tip: 'border-l-primary bg-primary/5 text-foreground',
    warning: 'border-l-secondary bg-secondary/5 text-foreground',
    info: 'border-l-border bg-muted/50 text-foreground',
  },

  /**
   * Icon Containers - Consistent icon styling
   */
  iconContainer: {
    sm: 'flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10',
    md: 'flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10',
    lg: 'flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10',
  },

  /**
   * Section Headers - Consistent page section styling
   */
  sectionHeader: {
    badge:
      'mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary',
    title: 'font-serif text-3xl font-bold tracking-tight text-foreground',
    subtitle: 'mt-4 text-lg text-muted-foreground',
  },
} as const

// ============================================
// TYPOGRAPHY SCALE
// ============================================

export const typography = {
  // Display text (hero sections)
  display: {
    lg: 'font-serif text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl',
    md: 'font-serif text-4xl font-bold tracking-tight sm:text-5xl',
    sm: 'font-serif text-3xl font-bold tracking-tight sm:text-4xl',
  },

  // Headings
  heading: {
    h1: 'font-serif text-3xl font-bold tracking-tight sm:text-4xl',
    h2: 'font-serif text-2xl font-bold tracking-tight sm:text-3xl',
    h3: 'font-serif text-xl font-semibold tracking-tight',
    h4: 'font-serif text-lg font-semibold',
  },

  // Body text
  body: {
    lg: 'text-lg leading-relaxed text-muted-foreground',
    md: 'text-base leading-relaxed text-muted-foreground',
    sm: 'text-sm leading-relaxed text-muted-foreground',
  },

  // Utility text
  utility: {
    label: 'text-sm font-medium text-foreground',
    caption: 'text-xs text-muted-foreground',
    overline:
      'text-xs font-semibold uppercase tracking-wider text-muted-foreground',
  },
} as const

// ============================================
// SPACING RHYTHM
// ============================================
// Based on a 4px base unit, but using Tailwind's scale

export const spacing = {
  // Page sections (vertical padding)
  section: {
    sm: 'py-12 sm:py-16',
    md: 'py-16 sm:py-20',
    lg: 'py-20 sm:py-24',
    xl: 'py-24 sm:py-32',
  },

  // Container (horizontal padding)
  container: 'px-4 sm:px-6 lg:px-8',

  // Content widths
  maxWidth: {
    prose: 'max-w-prose', // ~65ch, ideal for reading
    content: 'max-w-4xl', // Standard content
    wide: 'max-w-6xl', // Wide content
    full: 'max-w-7xl', // Full-width layouts
  },

  // Component spacing
  stack: {
    tight: 'space-y-2',
    normal: 'space-y-4',
    loose: 'space-y-6',
    section: 'space-y-8',
  },

  inline: {
    tight: 'space-x-2',
    normal: 'space-x-4',
    loose: 'space-x-6',
  },
} as const

// ============================================
// ANIMATION & TRANSITIONS
// ============================================

export const motion = {
  // Standard transitions
  transition: {
    fast: 'transition-all duration-150 ease-out',
    normal: 'transition-all duration-300 ease-out',
    slow: 'transition-all duration-500 ease-out',
  },

  // Hover effects
  hover: {
    lift: 'hover:-translate-y-0.5',
    scale: 'hover:scale-[1.02]',
    glow: 'hover:shadow-lg hover:shadow-primary/10',
  },

  // Focus states
  focus: {
    ring: 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
  },
} as const

// ============================================
// HELPER: Get credential style
// ============================================

export function getCredentialStyle(credentialId: string) {
  return (
    credentialStyles[credentialId as keyof typeof credentialStyles] ||
    credentialStyles['family-studies'] // Default to neutral
  )
}

// ============================================
// CSS CUSTOM PROPERTIES (for reference)
// ============================================
/*
These are defined in globals.css:

:root {
  --background: oklch(0.975 0.015 75);      // Warm cream
  --foreground: oklch(0.25 0.01 50);        // Warm charcoal
  --card: oklch(0.99 0.005 80);             // Soft white
  --primary: oklch(0.62 0.045 125);         // Olive/sage
  --secondary: oklch(0.68 0.08 40);         // Terracotta
  --accent: oklch(0.65 0.095 35);           // Rich terracotta
  --muted: oklch(0.94 0.012 75);            // Warm neutral
  --muted-foreground: oklch(0.48 0.015 50); // Muted text
  --border: oklch(0.9 0.01 75);             // Soft border
}
*/
