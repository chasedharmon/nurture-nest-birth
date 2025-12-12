# Nurture Nest Birth - Frontend Website Documentation

## Executive Summary

**Type**: Marketing website for professionally trained doula practice
**Framework**: Next.js 16 (App Router) + React 19
**Styling**: Tailwind CSS 4 + shadcn/ui
**Target Market**: Central Nebraska (Kearney, Grand Island, Hastings)

---

## Tech Stack

| Layer          | Technology              | Purpose                       |
| -------------- | ----------------------- | ----------------------------- |
| **Framework**  | Next.js 16 (App Router) | SSR, routing, API routes      |
| **UI Library** | React 19                | Component framework           |
| **Styling**    | Tailwind CSS 4          | Utility-first CSS             |
| **Components** | shadcn/ui (Radix)       | Accessible UI primitives      |
| **Animations** | Framer Motion           | Scroll animations             |
| **Icons**      | Lucide React            | Icon library                  |
| **Fonts**      | Inter + Lora            | Sans-serif + Serif typography |
| **Analytics**  | Vercel Analytics        | Event tracking                |
| **Email**      | Resend                  | Transactional email           |
| **Calendar**   | react-calendly          | Scheduling widget             |

---

## Site Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    WEBSITE STRUCTURE                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Public Pages (13 routes):                                   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  /                    Homepage (Hero, Stats, CTA)    │   │
│  │  /about               Story, Philosophy, Credentials │   │
│  │  /services            Service overview + comparison  │   │
│  │  /services/[slug]     6 individual service pages     │   │
│  │  /pricing             Packages, rates, payment info  │   │
│  │  /contact             Form + Calendly + Info         │   │
│  │  /blog                Blog listing (6 posts)         │   │
│  │  /blog/[slug]         Individual blog posts          │   │
│  │  /faq                 12 Q&A accordion               │   │
│  │  /testimonials        Client stories + stats         │   │
│  │  /resources           10 downloadable PDFs           │   │
│  │  /gallery             Photo gallery with lightbox    │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  Layout Components:                                          │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Header (sticky, responsive, mobile sheet menu)        │ │
│  │  ├── Logo + Navigation (8 links)                       │ │
│  │  └── CTA Button ("Schedule Consultation")              │ │
│  ├────────────────────────────────────────────────────────┤ │
│  │  Main Content                                          │ │
│  ├────────────────────────────────────────────────────────┤ │
│  │  Footer (multi-column)                                 │ │
│  │  ├── 4 nav sections (Services, Company, Resources)     │ │
│  │  ├── Newsletter signup                                 │ │
│  │  └── Contact info + Copyright                          │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Page Documentation

### 1. Homepage

**Status**: ✅ Complete
**File**: `src/app/page.tsx`

```
┌─────────────────────────────────────────────────────────────┐
│                       HOMEPAGE                               │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  HERO SECTION                                          │ │
│  │  ├── Credentials badge (Professionally Trained)        │ │
│  │  ├── H1: "supported, informed, empowered"              │ │
│  │  ├── Trust pills (3 indicators)                        │ │
│  │  ├── Dual CTAs (Schedule / Explore)                    │ │
│  │  └── Hero image with gradient overlay                  │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  STATS SECTION (4 evidence-based statistics)           │ │
│  │  47% lower cesarean │ 29% preterm reduction │ etc.     │ │
│  │  Source: AJPH 2024, AJOG 2024                          │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  SERVICES OVERVIEW (4-column grid)                     │ │
│  │  Birth Doula │ Postpartum │ Complete Care │ Photography│ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  CREDENTIALS + DIFFERENTIATORS (Combined Section)      │ │
│  │  Certification Badges (icons-only)                     │ │
│  │  Car Seat Safety │ Infant Massage │ 7+ Certifications  │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  TESTIMONIALS PREVIEW (3 featured)                     │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  FINAL CTA                                             │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Key Components**:

- `src/components/marketing/hero.tsx`
- `src/components/marketing/services-overview.tsx`
- `src/components/marketing/testimonials-preview.tsx`
- `src/components/marketing/cta-section.tsx`
- `src/components/marketing/certification-badges.tsx`

**SEO**:

- LocalBusiness + Organization structured data
- OG image: `/images/hero-newborn.jpg`
- Keywords: 11 location-specific terms

---

### 2. About Page

**Status**: ✅ Complete
**File**: `src/app/about/page.tsx`

**Sections**:

- Photo + intro grid (3/4 aspect ratio with badge overlay)
- "Why I Became a Doula" narrative (5 paragraphs)
- Philosophy section (4 core principles)
- "Beyond the Credentials" (6 personal touches)
- Service area callout
- Dual CTAs

**Components**:

- `CertificationBadges` (variant="full", columns=3)

---

### 3. Services Pages

**Status**: ✅ Complete
**Files**:

- `src/app/services/page.tsx` - Overview
- `src/app/services/[slug]/page.tsx` - Detail pages

**Overview Page Structure**:

```
┌─────────────────────────────────────────────────────────────┐
│                    SERVICES OVERVIEW                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Services Grid (4 cards):                                    │
│  ┌────────────┬────────────┬────────────┬────────────┐     │
│  │   Birth    │ Postpartum │ Lactation  │  Sibling   │     │
│  │   Doula    │    Care    │ Consulting │   Prep     │     │
│  └────────────┴────────────┴────────────┴────────────┘     │
│                                                              │
│  Comparison Table (10 features × 4 services):                │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Feature          │ Birth │ Postpartum │ Lactation   │   │
│  │ Prenatal Visits  │  ✓   │     ✓      │     -       │   │
│  │ 24/7 Support     │  ✓   │     -      │     -       │   │
│  │ Labor Support    │  ✓   │     -      │     -       │   │
│  │ ...              │ ...   │    ...     │    ...      │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  Package Bundles:                                            │
│  • Birth + Postpartum (save $200)                           │
│  • Postpartum + Lactation (save $100)                       │
│  • Sibling Prep add-on                                      │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Service Structure**:

Primary Services (Standalone):
| Slug | Service | Price Range |
|------|---------|-------------|
| `birth-doula` | Birth Doula Support | Starting at $1,500 |
| `postpartum-doula` | Postpartum Doula Support | Starting at $40/hr |
| `photography` | Birth & Family Photography | Contact for pricing |

Included Services (With Doula Packages):
| Slug | Service | Included With |
|------|---------|---------------|
| `infant-feeding` | Infant Feeding Support | Postpartum Doula |
| `sibling-prep` | Sibling Preparation | Birth & Postpartum |
| `car-seat-safety` | Car Seat Safety Check | Birth & Postpartum |
| `infant-massage` | Infant Massage Instruction | Postpartum Doula |

---

### 4. Pricing Page

**Status**: ✅ Complete
**File**: `src/app/pricing/page.tsx`

```
┌─────────────────────────────────────────────────────────────┐
│                       PRICING                                │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Main Service Cards (3):                                     │
│  ┌────────────────┬────────────────┬────────────────┐      │
│  │  Birth Doula   │  Postpartum    │ Complete Care  │      │
│  │ Starting $1,500│ Starting $40/hr│ Starting $1,800│      │
│  │  7 benefits    │  7 services    │ Best Value     │      │
│  └────────────────┴────────────────┴────────────────┘      │
│                                                              │
│  Photography Services:                                       │
│  • Birth Photography: Contact                               │
│  • Fresh 48 Session: Contact                                │
│  • Newborn & Family: Contact                                │
│                                                              │
│  Included with Doula Packages:                               │
│  • Infant Feeding Support                                   │
│  • Car Seat Safety Check                                    │
│  • Sibling Preparation                                      │
│  • Infant Massage Instruction                               │
│                                                              │
│  Discounts & Add-Ons:                                        │
│  • Complete Care Bundle: Save $200+                         │
│  • Photography Add-On                                       │
│  • Multiple Birth: 10% discount                             │
│                                                              │
│  Payment Information:                                        │
│  ✓ Flexible payment plans (retainer model)                  │
│  ✓ Nonrefundable retainer to reserve                        │
│  ✓ Remaining balance due by 37 weeks                        │
│  ✓ HSA/FSA eligible                                         │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

### 5. Contact Page

**Status**: ✅ Complete
**File**: `src/app/contact/page.tsx`

**Layout**:

- Left column: Contact form
- Right column: Info card + Calendly widget + FAQ teaser

**Contact Form Fields**:

- Name (required)
- Email (required)
- Phone (optional)
- Due Date (optional, date picker)
- Service Interest (dropdown)
- Referral Source (dropdown)
- Message (required)

**Key Files**:

- `src/components/forms/contact-form.tsx`
- `src/components/calendly/calendly-widget.tsx`
- `src/app/actions/contact.ts`

---

### 6. Blog Section

**Status**: ✅ Complete
**Files**:

- `src/app/blog/page.tsx` - Listing
- `src/app/blog/[slug]/page.tsx` - Posts

**Published Posts** (6):
| Title | Category | Read Time |
|-------|----------|-----------|
| What Does a Doula Actually Do? | Birth Support | 8 min |
| How Much Does a Doula Cost? | Planning | 7 min |
| Creating a Birth Plan That Works | Birth Prep | 10 min |
| Car Seat Safety Guide | Safety | 8 min |
| Evidence on Doula Support | Research | 10 min |
| Client Birth Stories (2) | Stories | varies |

**Blog Infrastructure**:

- `src/lib/blog/posts.ts` - Post data & helpers
- `src/lib/blog/reading-time.ts` - 225 words/min calculation
- `src/components/blog/reading-time-badge.tsx`
- `src/components/blog/social-share.tsx`
- `src/components/blog/related-posts.tsx`

---

### 7. FAQ Page

**Status**: ✅ Complete
**File**: `src/app/faq/page.tsx`

**12 Questions Covered**:

1. What exactly does a doula do?
2. How is a doula different from midwife/doctor?
3. When should I hire a doula?
4. Do you only support unmedicated births?
5. Won't my partner feel replaced?
6. How much does a doula cost?
7. What areas do you serve?
8. What if I go into labor early/late?
9. Can you help with breastfeeding?
10. What if I need a cesarean?
11. Do you work with first-time parents only?
12. What about high-risk pregnancies?

**Components**:

- `src/components/faq/faq-accordion.tsx`
- FAQSchema structured data (JSON-LD)

---

### 8. Testimonials Page

**Status**: ✅ Complete
**File**: `src/app/testimonials/page.tsx`

**Content**:

- 4 testimonials (3-column grid)
- Statistics section (4 business stats)
- All data from `siteConfig.testimonials`

**Components**:

- `src/components/marketing/testimonial-card.tsx`
- `src/components/marketing/testimonials-preview.tsx`

---

### 9. Resources Page

**Status**: ✅ Complete
**File**: `src/app/resources/page.tsx`

**10 Free Downloads**:
| Resource | Size | Category |
|----------|------|----------|
| Birth Preferences Worksheet | 2.5 MB | Planning |
| Hospital Bag Checklist | 1.5 MB | Planning |
| Postpartum Preparation Guide | 3.2 MB | Postpartum |
| Car Seat Safety Quick Reference | 800 KB | Safety |
| Newborn Care Basics | 2.8 MB | Newborn |
| Breastfeeding Quick Start | 2.1 MB | Feeding |
| Partner Support Guide | 1.8 MB | Support |
| Questions for Your Provider | 1.2 MB | Planning |
| Postpartum Recovery Checklist | 1.4 MB | Postpartum |
| Local Resources Directory | 600 KB | Resources |

**Components**:

- `src/components/resources/resources-grid.tsx`

---

### 10. Gallery Page

**Status**: ✅ Complete
**File**: `src/app/gallery/page.tsx`

**Features**:

- Responsive grid (2/3/4 columns)
- Lightbox modal view
- Keyboard navigation (ESC, arrows)
- Image captions
- Analytics tracking

**Component**: `src/components/gallery/photo-gallery.tsx`

---

## Design System

### Color Palette (OkLCH)

```
┌─────────────────────────────────────────────────────────────┐
│                    COLOR SYSTEM                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Light Mode:                                                 │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Background:  oklch(0.975 0.015 75)  - Warm cream     │   │
│  │ Foreground:  oklch(0.25 0.01 50)    - Warm charcoal  │   │
│  │ Primary:     oklch(0.62 0.045 125)  - Olive/sage     │   │
│  │ Secondary:   oklch(0.68 0.08 40)    - Terracotta     │   │
│  │ Accent:      oklch(0.65 0.095 35)   - Rich terracotta│   │
│  │ Muted:       oklch(0.94 0.012 75)   - Light warm gray│   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  Dark Mode:                                                  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Background:  oklch(0.145 0 0)       - True black     │   │
│  │ Foreground:  oklch(0.985 0 0)       - Pure white     │   │
│  │ Primary:     oklch(0.922 0 0)       - Bright off-white│  │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Typography

```typescript
// src/lib/design-system.ts

typography: {
  h1: 'font-serif text-4xl font-bold sm:text-5xl lg:text-6xl',
  h2: 'font-serif text-3xl font-bold',
  h3: 'font-serif text-2xl font-semibold',
  h4: 'font-serif text-xl font-semibold',
  lead: 'text-lg text-muted-foreground sm:text-xl',
  body: 'text-base text-muted-foreground',
  small: 'text-sm text-muted-foreground',
}

// Fonts: Inter (sans) + Lora (serif)
```

### Spacing System

```typescript
spacing: {
  section: {
    sm: 'py-12 lg:py-16',
    md: 'py-16 lg:py-20',
    lg: 'py-20 lg:py-24',
  },
  container: 'px-6 lg:px-8',
}

maxWidth: {
  article: 'max-w-3xl',   // Long-form content
  content: 'max-w-4xl',   // Standard sections
  layout: 'max-w-7xl',    // Full layouts
}
```

### Grid System

```typescript
grid: {
  gap: {
    tight: 'gap-6',   // 4-column grids
    medium: 'gap-8',  // 2-3 column grids
    loose: 'gap-12',  // Hero layouts
  },
  cols: {
    two: 'md:grid-cols-2',
    three: 'sm:grid-cols-2 lg:grid-cols-3',
    four: 'sm:grid-cols-2 lg:grid-cols-4',
  },
}
```

### Animation Patterns

```typescript
// FadeIn Component (src/components/ui/fade-in.tsx)
- Easing: [0.21, 0.47, 0.32, 0.98]
- Duration: 0.5s
- Directions: up, down, left, right
- Trigger: whileInView with -50px margin
- Once: true (animates only once)

// Staggered delays for sequential elements
delay={0.1} delay={0.2} delay={0.3}

// Hover interactions
- Cards: -translate-y-1, border-primary/30, shadow-xl
- Icons: scale-110
- Buttons: translate-x-1 (arrow icons)
```

---

## Marketing Components

### Component Library

| Component           | File                                 | Purpose               |
| ------------------- | ------------------------------------ | --------------------- |
| Hero                | `marketing/hero.tsx`                 | Landing hero section  |
| ServicesOverview    | `marketing/services-overview.tsx`    | Service grid          |
| ServiceCard         | `marketing/service-card.tsx`         | Individual service    |
| TestimonialCard     | `marketing/testimonial-card.tsx`     | Client quote          |
| TestimonialsPreview | `marketing/testimonials-preview.tsx` | Featured testimonials |
| CTASection          | `marketing/cta-section.tsx`          | Call-to-action block  |
| CertificationBadges | `marketing/certification-badges.tsx` | Credentials display   |
| Header              | `layout/header.tsx`                  | Site navigation       |
| Footer              | `layout/footer.tsx`                  | Site footer           |

### CertificationBadges Variants

```
┌─────────────────────────────────────────────────────────────┐
│                CERTIFICATION BADGES                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  7 Certifications:                                           │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Core (Primary olive):                                   │ │
│  │   • ProDoula Birth Doula                               │ │
│  │   • ProDoula Postpartum Doula                          │ │
│  ├────────────────────────────────────────────────────────┤ │
│  │ Specialized (Secondary terracotta):                    │ │
│  │   • Breastfeeding Specialist                           │ │
│  │   • Certified Infant Massage Instructor (CIMI)         │ │
│  │   • Child Passenger Safety Technician (CPST)           │ │
│  ├────────────────────────────────────────────────────────┤ │
│  │ Education (Muted neutral):                             │ │
│  │   • Family Studies Degree                              │ │
│  │   • Home Visitor Training                              │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  Display Variants:                                           │
│  • icons-only: Circular badges (hero usage)                 │
│  • compact: Pill-shaped with icon + text                    │
│  • full: Cards with description (about page)                │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Forms & Lead Capture

### Contact Form

**File**: `src/components/forms/contact-form.tsx`

**Features**:

- Real-time validation
- Loading/success/error states
- Attribution tracking (UTM capture)
- Analytics events
- Server action: `src/app/actions/contact.ts`

**Fields**:

```typescript
{
  name: string        // Required
  email: string       // Required, validated
  phone?: string      // Optional
  dueDate?: Date      // Optional, date picker
  serviceInterest: enum  // Dropdown
  referralSource: enum   // How they heard
  message: string     // Required
}
```

### Newsletter Signup

**File**: `src/components/newsletter/newsletter-signup.tsx`

**Variants**:

- `inline`: Compact for footer
- `card`: Full card with description

**Features**:

- Email validation
- Success/error messaging
- Analytics tracking
- Server action: `src/app/actions/newsletter.ts`

---

## SEO & Structured Data

### Metadata Configuration

**File**: `src/app/layout.tsx`

```typescript
metadata: {
  metadataBase: 'https://nurturenestbirth.com',
  title: {
    template: '%s | Nurture Nest Birth',
    default: 'Nurture Nest Birth | DONA Certified Doula'
  },
  keywords: [
    'doula Kearney Nebraska',
    'DONA certified doula',
    'birth doula Grand Island',
    // ... 8 more location-specific terms
  ],
  openGraph: {
    type: 'website',
    image: '/images/hero-newborn.jpg' (1920x1080)
  },
  twitter: {
    card: 'summary_large_image'
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { 'max-image-preview': 'large' }
  }
}
```

### Structured Data (JSON-LD)

**File**: `src/components/seo/structured-data.tsx`

**Schemas**:

1. **LocalBusiness**
   - Name, description, URL
   - Phone, email, address
   - Geo coordinates (40.6993, -99.0817)
   - Service area cities
   - Service catalog (3 main services)

2. **Organization**
   - Name, URL, logo
   - Description
   - Social links

3. **Article** (blog posts)
   - Headline, date, author
   - Publisher info

4. **FAQ** (FAQ page)
   - Question/answer pairs

### Sitemap & Robots

**Files**:

- `src/app/sitemap.ts` - Dynamic generation
- `src/app/robots.ts` - Crawl rules

**Sitemap Priorities**:

- Homepage: 1.0
- Service pages: 0.9
- Services/Pricing/Contact: 0.8
- About/FAQ/Testimonials: 0.7
- Blog index: 0.6
- Blog posts: 0.5

---

## Integrations

### Calendly

**File**: `src/components/calendly/calendly-widget.tsx`

- Library: `react-calendly` (InlineWidget)
- Config: `NEXT_PUBLIC_CALENDLY_URL`
- Default height: 630px
- Feature flag controlled

### Vercel Analytics

**File**: `src/lib/analytics/events.ts`

**Tracked Events** (17):

- Contact form (submit, success, error)
- Navigation clicks (header, footer, mobile)
- Service page views
- Blog post views
- FAQ expansions
- Newsletter signups
- Phone/email clicks
- CTA clicks
- Gallery image views

### Email (Resend)

**File**: `src/lib/email/config.ts`

**Templates**:

- Contact form notification
- Magic link authentication
- Welcome emails
- Meeting reminders
- Payment confirmations
- Document notifications

### Attribution Tracking

**File**: `src/lib/attribution/utm.ts`

**Captures**:

- UTM parameters (source, medium, campaign, term, content)
- Referrer URL
- Landing page
- Session-based storage

---

## Personalization System

### Visitor Profiling

**File**: `src/lib/personalization/types.ts`

```typescript
interface VisitorProfile {
  // Identity
  email?: string
  name?: string
  leadId?: string
  isClient: boolean
  isNewsletterSubscriber: boolean

  // Location
  city?: string
  state?: string
  inServiceArea: boolean

  // Interests
  interests: ServiceInterest[]

  // Journey
  stage: 'anonymous' | 'lead' | 'prospect' | 'client' | 'past_client'

  // Pregnancy
  dueDate?: Date
  trimester?: 1 | 2 | 3 | 'postpartum'

  // Engagement
  lastVisit: Date
  visitCount: number
  pageViews: string[]
}
```

### Personalization Engine

**File**: `src/lib/personalization/engine.ts`

**Generated Content**:

- Time-based greeting ("Good morning, Sarah!")
- Location-specific messaging
- Trimester-specific content
- Service recommendations (based on interests/stage)
- Personalized CTAs

### Components

| Component                     | Purpose                 |
| ----------------------------- | ----------------------- |
| `PersonalizationProvider`     | App-wide context        |
| `PersonalizedBanner`          | Context-aware banners   |
| `PersonalizedGreeting`        | Custom greetings        |
| `PersonalizedCTA`             | Dynamic call-to-actions |
| `PersonalizedRecommendations` | Service suggestions     |

---

## Accessibility

### Features Implemented

- **Skip-to-Content**: `src/components/ui/skip-to-content.tsx`
- **ARIA Labels**: All form inputs, buttons, navigation
- **Focus Management**: Visible focus rings
- **Keyboard Navigation**: Gallery lightbox (ESC, arrows)
- **Semantic HTML**: Proper heading hierarchy
- **Form Accessibility**: Labels, descriptions, error states
- **Reduced Motion**: Respects `prefers-reduced-motion`

---

## File Structure

```
nurture-nest-birth/src/
├── app/
│   ├── page.tsx                 # Homepage
│   ├── about/page.tsx           # About page
│   ├── services/
│   │   ├── page.tsx             # Services overview
│   │   └── [slug]/page.tsx      # Service details
│   ├── pricing/page.tsx         # Pricing page
│   ├── contact/page.tsx         # Contact page
│   ├── blog/
│   │   ├── page.tsx             # Blog listing
│   │   └── [slug]/page.tsx      # Blog posts
│   ├── faq/page.tsx             # FAQ page
│   ├── testimonials/page.tsx    # Testimonials
│   ├── resources/page.tsx       # Downloads
│   ├── gallery/page.tsx         # Photo gallery
│   ├── layout.tsx               # Root layout
│   ├── sitemap.ts               # Dynamic sitemap
│   └── robots.ts                # Robots.txt
├── components/
│   ├── marketing/               # Marketing components
│   │   ├── hero.tsx
│   │   ├── services-overview.tsx
│   │   ├── service-card.tsx
│   │   ├── testimonial-card.tsx
│   │   ├── testimonials-preview.tsx
│   │   ├── cta-section.tsx
│   │   └── certification-badges.tsx
│   ├── layout/                  # Layout components
│   │   ├── header.tsx
│   │   ├── footer.tsx
│   │   └── conditional-layout.tsx
│   ├── forms/                   # Form components
│   │   └── contact-form.tsx
│   ├── newsletter/              # Newsletter
│   │   └── newsletter-signup.tsx
│   ├── calendly/                # Calendar
│   │   └── calendly-widget.tsx
│   ├── gallery/                 # Gallery
│   │   └── photo-gallery.tsx
│   ├── faq/                     # FAQ
│   │   └── faq-accordion.tsx
│   ├── blog/                    # Blog components
│   │   ├── reading-time-badge.tsx
│   │   ├── social-share.tsx
│   │   └── related-posts.tsx
│   ├── seo/                     # SEO
│   │   └── structured-data.tsx
│   ├── personalization/         # Personalization
│   │   ├── personalization-provider.tsx
│   │   ├── personalized-banner.tsx
│   │   ├── personalized-greeting.tsx
│   │   └── personalized-cta.tsx
│   └── ui/                      # 38 base components
├── config/
│   └── site.ts                  # Central configuration
├── lib/
│   ├── design-system.ts         # Design tokens
│   ├── analytics/events.ts      # Analytics tracking
│   ├── attribution/utm.ts       # UTM capture
│   ├── personalization/         # Personalization engine
│   ├── blog/                    # Blog utilities
│   ├── seo/metadata.ts          # SEO helpers
│   └── email/config.ts          # Email settings
└── public/
    ├── images/                  # Static images
    └── resources/               # PDF downloads
```

---

## Configuration (site.ts)

**File**: `src/config/site.ts`

### TODO Items (From Config)

| Item             | Current Value              | Action  |
| ---------------- | -------------------------- | ------- |
| Owner name       | 'Your Name'                | Update  |
| Established year | 2022                       | Verify  |
| Email            | hello@nurturenestbirth.com | Update  |
| Phone            | (308) 555-0123             | Update  |
| Calendly link    | placeholder URL            | Update  |
| OG Image         | placeholder                | Create  |
| Twitter handle   | @nurturenestbirth          | Verify  |
| Logo URL (email) | missing                    | Add     |
| Resource PDFs    | sample URLs                | Replace |

---

## Priority Next Steps

### High Priority

1. **Update Business Info** - Owner name, phone, email in `site.ts`
2. **Create OG Image** - Professional 1200x630px social image
3. **Replace Resource PDFs** - Upload actual downloadable guides
4. **Configure Calendly** - Set up real booking link
5. **Add Professional Photos** - Replace placeholder images

### Medium Priority

6. **Blog Content** - Add more educational posts
7. **Testimonial Collection** - Gather more client stories
8. **Local SEO** - Google Business Profile integration
9. **Performance Audit** - Core Web Vitals optimization
10. **A/B Testing** - Test CTA variations

### Future Enhancements

11. **Live Chat** - Enable AI chat feature flag
12. **Video Content** - Add service explanation videos
13. **Interactive Tools** - Due date calculator, service finder
14. **Multi-language** - Spanish translation for wider reach

---

_Documentation generated: December 2024_
_Last Updated: December 11, 2024_

## Recent Changes (December 11, 2024)

### Homepage Streamlining

- Removed Service Area section for cleaner layout
- Combined credentials and differentiators into single compact section
- Reduced overall page length while maintaining key information

### Pricing Page Updates

- Added "Starting at" pricing model for flexibility
- Added Photography Services section
- Added "Included with Doula Packages" section
- Updated Discounts & Add-Ons section

### Services Page Restructure

- Reorganized into primary services (standalone) vs included services
- Added Photography as primary service
- Updated pricing badges with "Starting at" model
- Added service comparison table

### Photography Page Fixes

- Fixed icon scaling to match other service pages
- Use consistent rounded-full bg-primary/10 pattern

### Design System

- Added flex centering to icon containers for consistent icon display

### Vercel Deployment Fix (TEMPORARY - Can Revert)

**Problem**: Vercel Hobby plan has a 2 cron job limit across ALL projects in the account. This project's 2 cron jobs exceeded the account-wide limit.

**Temporary Solution**: Removed cron jobs from `vercel.json` to enable deployment.

**Original vercel.json cron configuration** (for reverting later):

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "crons": [
    {
      "path": "/api/cron/meeting-reminders",
      "schedule": "0 8 * * *"
    },
    {
      "path": "/api/cron/workflow-scheduler",
      "schedule": "0 9 * * *"
    }
  ]
}
```

**To restore crons**: Either upgrade Vercel plan or remove crons from other projects in the account, then restore the above configuration.

**Affected functionality**:

- Meeting reminders (daily at 8am UTC)
- Workflow scheduler (daily at 9am UTC)

**Alternative solutions to consider**:

1. Upgrade to Vercel Pro plan
2. Use external cron service (cron-job.org, Upstash QStash, GitHub Actions)
3. Consolidate into single combined cron endpoint
