# Nurture Nest Birth - Doula CRM

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
- `src/app/admin/team/` - Team management admin pages
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

- `contract_signatures` - Table not yet created in Supabase

## Test Credentials

- Email: chase.d.harmon@gmail.com
- Password: TestPassword123!

## Recent Changes (Dec 2024)

### Team Management Feature (Phase 5)

- Team members table with roles (owner, admin, provider, assistant)
- Client assignments (primary, backup, support roles)
- Service assignments with revenue sharing
- Time tracking and on-call scheduling

### Fixed Issues

1. PGRST201 FK ambiguity errors - resolved with explicit FK names
2. Activity trigger using wrong column name ('description' -> 'content')
3. Missing 'team_assigned' enum value in activity_type

## Pending Tasks

- [ ] Test team assignment in browser (Playwright MCP was disconnected)
- [ ] Create automated E2E tests for assignments
- [ ] Update site config: owner name, established year
- [ ] Update site config: email, phone, Calendly link
- [ ] Add social media URLs when accounts are created

## Turbopack HMR Bug

There's a known Turbopack caching issue causing phantom module references (`src/app/actions/data`). This is a dev environment issue, not a code bug. Clear cache with:

```bash
rm -rf .next node_modules/.cache
```
