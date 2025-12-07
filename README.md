# Nurture Nest Birth

> DONA-certified doula website for Nurture Nest Birth in Kearney, Nebraska. Built with Next.js 16, React 19, TypeScript, and shadcn/ui.

## Tech Stack

### Core Framework

- **Next.js 16.0.7** - App Router, React 19, Server Components, Turbopack
- **React 19.2.0** - Latest React with Server Components
- **TypeScript 5.9.3** - Strict mode with enhanced type safety
- **Tailwind CSS 4.1.17** - Utility-first CSS framework
- **pnpm 10.24.0** - Fast, efficient package manager

### UI & Components

- **shadcn/ui** - Accessible, customizable component library
- **Radix UI** - Unstyled, accessible UI primitives
- **Lora** (Google Fonts) - Serif font for headings
- **Inter** (Google Fonts) - Sans-serif font for body text

### Development Tools

- **ESLint 9.39.1** - JavaScript/TypeScript linter
- **Prettier 3.7.4** - Code formatter
- **Husky 9.1.7** - Git hooks
- **lint-staged 16.2.7** - Run linters on staged files
- **commitlint** - Enforce conventional commit messages

### Design System

- **Primary Color**: Sage (#8B9D83) - Calm, nurturing
- **Background**: Cream (#F5F1E8) - Warm, welcoming
- **Accent**: Clay (#C17B6C) - CTAs and highlights
- **Typography**: Lora (headings), Inter (body)

## Getting Started

### Prerequisites

- Node.js 18+ or 20+
- pnpm (installed globally: `npm install -g pnpm`)

### Development

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev

# Open http://localhost:3000
```

### Available Scripts

```bash
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm start        # Start production server
pnpm lint         # Run ESLint
pnpm lint:fix     # Fix ESLint issues
pnpm format       # Format with Prettier
pnpm format:check # Check Prettier formatting
pnpm type-check   # Run TypeScript type check
```

## Project Structure

```
nurture-nest-birth/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── layout.tsx          # Root layout with fonts
│   │   ├── page.tsx            # Homepage
│   │   ├── globals.css         # Global styles + OKLCH color palette
│   │   ├── sitemap.ts          # Auto-generated sitemap.xml
│   │   ├── about/page.tsx
│   │   ├── blog/
│   │   │   ├── page.tsx        # Blog index
│   │   │   ├── what-does-a-doula-do/page.tsx
│   │   │   ├── doula-cost-worth-it/page.tsx
│   │   │   └── birth-plan-tips/page.tsx
│   │   ├── contact/page.tsx
│   │   ├── faq/page.tsx
│   │   ├── pricing/page.tsx
│   │   ├── services/
│   │   │   ├── page.tsx        # Services index
│   │   │   ├── birth-doula/page.tsx
│   │   │   ├── postpartum-care/page.tsx
│   │   │   ├── lactation/page.tsx
│   │   │   └── sibling-prep/page.tsx
│   │   └── testimonials/page.tsx
│   ├── components/
│   │   ├── ui/                 # shadcn/ui components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── form.tsx
│   │   │   ├── input.tsx
│   │   │   ├── textarea.tsx
│   │   │   ├── label.tsx
│   │   │   ├── accordion.tsx
│   │   │   └── fade-in.tsx     # Custom animation component
│   │   └── seo/
│   │       └── structured-data.tsx  # JSON-LD for SEO
│   ├── config/
│   │   └── site.ts             # ⭐ Centralized site configuration
│   └── lib/
│       ├── utils.ts            # Utility functions
│       └── metadata.ts         # SEO metadata helpers
├── public/
│   ├── robots.txt              # Search engine crawling rules
│   └── images/                 # Static images
├── .husky/                     # Git hooks
│   ├── pre-commit             # Run lint-staged
│   └── commit-msg             # Validate commit messages
├── PERFORMANCE.md              # Performance optimization guide
├── components.json             # shadcn/ui config
├── tsconfig.json              # TypeScript config (strict mode)
├── eslint.config.mjs          # ESLint config
├── .prettierrc                # Prettier config
└── .commitlintrc.json         # Commitlint config
```

## 🔧 Maintainability Guide

This project is designed for easy maintenance. Here's what you need to know:

### Making Content Changes

**Most common updates are centralized in ONE file**: [`src/config/site.ts`](src/config/site.ts)

#### Update Business Information

Edit `src/config/site.ts` to change:

- Business name, tagline, description
- Contact info (email, phone, Calendly link)
- Service area cities
- Credentials
- Social media links
- Pricing

**Example**: To update your phone number, just edit this file:

```typescript
// src/config/site.ts
contact: {
  phone: '(308) 555-NEW',  // ← Change here only
  phoneFormatted: '+13085559999',
}
```

This automatically updates it across the entire website!

#### Add a New Blog Post

1. Create file: `src/app/blog/your-post-title/page.tsx`
2. Copy structure from existing blog post
3. Update content and metadata
4. Add to `src/app/blog/page.tsx` blog posts array
5. Add to `src/app/sitemap.ts` routes array

#### Add a New Page to Navigation

1. Create page: `src/app/your-page/page.tsx`
2. Add to navigation (when we build Header component)
3. Add to `src/app/sitemap.ts` routes array

### Code Quality is Automatic

Pre-commit hooks ensure code quality:

- ✅ Code automatically formatted with Prettier
- ✅ TypeScript errors caught before commit
- ✅ ESLint warnings shown
- ✅ Commit messages validated

**You can't commit broken code!** This protects you from mistakes.

### SEO is Automated

- ✅ Sitemap auto-generates at `/sitemap.xml`
- ✅ Robots.txt configured for search engines
- ✅ Structured data (JSON-LD) on all pages
- ✅ OpenGraph tags for social media sharing
- ✅ All metadata centralized in config

### Performance is Built-in

- ✅ Images optimized automatically (next/image)
- ✅ Fonts optimized automatically (next/font)
- ✅ Code splitting per route
- ✅ Static page generation
- ✅ See [PERFORMANCE.md](PERFORMANCE.md) for details

## Git Workflow

### Commit Convention

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add hero component
fix: resolve contact form validation
docs: update README with setup instructions
test: add E2E tests for contact form
chore: update dependencies
refactor: improve type safety in forms
style: format code with prettier
perf: optimize image loading
```

### Pre-commit Hooks

Husky automatically runs:

- **lint-staged**: Lint and format staged files
- **commitlint**: Validate commit message format

### Branch Strategy (Coming Soon)

- `main` - Production branch (protected)
- `feature/*` - Feature branches
- `fix/*` - Bug fix branches

## Next Steps

### Phase 1: Foundation ✅ COMPLETE

- [x] Initialize Next.js 16 project
- [x] Configure TypeScript strict mode
- [x] Set up ESLint, Prettier, Husky
- [x] Initialize shadcn/ui
- [x] Customize color palette
- [x] Set up custom fonts
- [x] Initial Git commit

### Phase 2: GitHub & Deployment (In Progress)

- [ ] Create GitHub repository
- [ ] Add collaborator (chasedharmon)
- [ ] Deploy to Vercel Pro
- [ ] Set up CI/CD with GitHub Actions

### Phase 3: Design System

- [ ] Create Button variants
- [ ] Build Card components
- [ ] Design Header and Footer
- [ ] Component documentation

### Phase 4: Core Pages

- [ ] Homepage with hero
- [ ] About page
- [ ] Contact page with form
- [ ] Services overview

## Business Information

**Name**: Nurture Nest Birth
**Domain**: nurturenestbirth.com
**Location**: Kearney, Nebraska 68847
**Contact**: hello@nurturenestbirth.com | 308-440-5153

**Services**:

- Birth Doula Support
- Postpartum Care
- Lactation Consulting
- Sibling Preparation

**Credentials**:

- DONA Certified (Pre & Postpartum Doula)
- Certified Lactation Consultant
- Family Studies Degree
- 3+ years experience

## Learning Goals

This project serves as an enterprise-grade learning experience for:

- Modern React patterns (Server Components, Server Actions)
- TypeScript strict mode and advanced types
- Enterprise best practices and tooling
- AI integration with Vercel AI SDK
- Testing with Vitest and Playwright
- CI/CD with GitHub Actions

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [shadcn/ui](https://ui.shadcn.com)
- [Tailwind CSS](https://tailwindcss.com)
- [Project Plan](/.claude/plans/gleaming-watching-hennessy.md)

---

**Built with** ❤️ **using Claude Code**
