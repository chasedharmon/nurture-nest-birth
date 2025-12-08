# Nurture Nest Birth - Doula CRM

## Next Task

**Create `contract_signatures` table in Supabase** - This table is referenced by the Contracts tab but doesn't exist, causing console errors on every client detail page. See "Missing Tables" section below for details.

## Project Overview

A CRM and client portal for a doula practice in Kearney, Nebraska. Built with Next.js 16, Supabase, and Tailwind CSS.

## Tech Stack

- **Framework**: Next.js 16 with Turbopack
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **Styling**: Tailwind CSS
- **Testing**: Playwright E2E tests

## Development Commands

```bash
pnpm dev          # Start dev server
pnpm build        # Production build
pnpm test:e2e     # Run Playwright tests
pnpm lint         # Run ESLint
pnpm type-check   # TypeScript check
```

## Key Files

- `src/app/actions/team.ts` - Team management server actions (FK queries fixed)
- `src/components/admin/team/client-team-assignments.tsx` - Team assignments UI component
- `src/app/admin/team/` - Team management admin pages
- `tests/e2e/client-team-assignments.spec.ts` - E2E tests for team assignments
- `supabase/migrations/` - Database migrations

## Database Notes

### FK Relationship Disambiguation

When querying tables with multiple foreign keys to the same target table, use explicit FK names:

```typescript
// oncall_schedule has team_member_id and created_by both referencing team_members
team_member:team_members!oncall_schedule_team_member_id_fkey(...)

// client_assignments has team_member_id and assigned_by both referencing team_members
team_member:team_members!client_assignments_team_member_id_fkey(...)
```

### Enum Values

- `lead_status`: 'new', 'contacted', 'scheduled', 'client', 'lost' (NOT 'active')
- `activity_type`: 'note', 'email_sent', 'call', 'meeting', 'status_change', 'system', 'document', 'invoice', 'payment', 'contract', 'team_assigned'

### Missing Tables (known issues)

- `contract_signatures` - Table not yet created in Supabase (causes console errors on Contracts tab)

## Test Credentials

- Email: chase.d.harmon@gmail.com
- Password: TestPassword123!

## Recent Changes (Dec 2024)

### Team Management Feature (Phase 5) - COMPLETE

- Team members table with roles (owner, admin, provider, assistant)
- Client assignments (primary, backup, support roles)
- Service assignments with revenue sharing
- Time tracking and on-call scheduling
- E2E tests for team assignments (21 tests)

### Fixed Issues

1. PGRST201 FK ambiguity errors - resolved with explicit FK names in team.ts
2. Activity trigger using wrong column name ('description' -> 'content')
3. Missing 'team_assigned' enum value in activity_type
4. Turbopack phantom module cache bug - clear with `rm -rf .next node_modules/.cache`

## Pending Tasks

### High Priority

- [ ] Create `contract_signatures` table in Supabase (referenced but missing - causes console errors)

### Site Configuration (src/config/site.ts)

- [ ] Update owner name (line 15)
- [ ] Update established year (line 16)
- [ ] Update email address (line 21)
- [ ] Update phone number (line 22)
- [ ] Update Calendly link (line 24)
- [ ] Add OG image (line 109)
- [ ] Update Twitter/X handle when account exists (line 110)
- [ ] Add social media URLs when accounts are created

### Other

- [ ] Add logo URL to email config (src/lib/email/config.ts:38)
- [ ] Replace sample resource fileUrls with actual hosted PDFs (src/app/resources/page.tsx:27)
- [ ] Integrate newsletter with email service (src/app/actions/newsletter.ts:45)

## Turbopack HMR Bug

There's a known Turbopack caching issue causing phantom module references (`src/app/actions/data`). This is a dev environment issue, not a code bug. Clear cache with:

```bash
rm -rf .next node_modules/.cache
```

Also clear Playwright's browser cache if issues persist:

```bash
rm -rf ~/Library/Caches/ms-playwright/mcp-chrome-*
```
