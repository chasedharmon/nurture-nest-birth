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
│   │   └── globals.css         # Global styles + color palette
│   ├── components/
│   │   └── ui/                 # shadcn/ui components
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       ├── form.tsx
│   │       ├── input.tsx
│   │       ├── textarea.tsx
│   │       ├── label.tsx
│   │       └── accordion.tsx
│   └── lib/
│       └── utils.ts            # Utility functions
├── .husky/                     # Git hooks
│   ├── pre-commit             # Run lint-staged
│   └── commit-msg             # Validate commit messages
├── components.json             # shadcn/ui config
├── tsconfig.json              # TypeScript config (strict mode)
├── eslint.config.mjs          # ESLint config
├── .prettierrc                # Prettier config
└── .commitlintrc.json         # Commitlint config
```

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
