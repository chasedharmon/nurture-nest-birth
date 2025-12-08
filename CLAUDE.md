# Nurture Nest Birth - Doula CRM

## Project Status

**Current Phase**: Phase 6+ - Admin Enhancements (Salesforce-like features)
**Last Updated**: December 8, 2024

### Phase 6+ Progress

| Feature                | Status      | Notes                                       |
| ---------------------- | ----------- | ------------------------------------------- |
| Report Builder UI      | ✅ COMPLETE | Wizard, filters, preview, save/edit         |
| Dashboard Builder UI   | ✅ COMPLETE | 12-col grid, drag-drop, 8 widget types      |
| Admin Setup Hub        | ✅ COMPLETE | Salesforce-style settings at `/admin/setup` |
| Roles & Permissions UI | ✅ COMPLETE | Matrix editor, system roles, custom roles   |
| User Management UI     | ✅ COMPLETE | User list, invitations, role assignment     |

### Future Features (Not Started)

- Email Templates System (WYSIWYG editor, variables)
- Advanced Scheduling (calendar sync, availability)
- Automation Rules Engine (trigger-based workflows)

## Project Overview

A CRM and client portal for a doula practice in Kearney, Nebraska. Built with Next.js 16, Supabase, and Tailwind CSS.

## Tech Stack

- **Framework**: Next.js 16 with Turbopack
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth (admin) + Magic Link (clients)
- **Styling**: Tailwind CSS 4
- **Testing**: Playwright E2E (10 suites) + Vitest unit tests
- **CI/CD**: GitHub Actions

## Development Commands

```bash
pnpm dev          # Start dev server
pnpm build        # Production build
pnpm test:e2e     # Run Playwright tests
pnpm test:run     # Run unit tests
pnpm lint         # Run ESLint
pnpm type-check   # TypeScript check
```

## Key Directories

- `src/app/actions/` - Server actions (leads, team, invoices, contracts, reports, etc.)
- `src/app/admin/` - Admin CRM dashboard
- `src/app/admin/reports/` - Report Builder pages (new, [id], [id]/edit)
- `src/app/admin/dashboards/` - Dashboard Builder pages
- `src/app/client/` - Client portal
- `src/components/admin/reports/` - Report Builder components (wizard, filters, preview)
- `src/components/` - React components
- `supabase/migrations/` - Database migrations (15+ files)
- `tests/e2e/` - Playwright E2E tests
- `.github/workflows/` - CI/CD pipelines

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

## Test Credentials

- Email: chase.d.harmon@gmail.com
- Password: TestPassword123!

## Completed Features

### Phase 1-2: Foundation & Lead Management

- Database schema with RLS policies
- Admin dashboard with stats
- Lead capture (contact form, newsletter)
- Lead detail pages with status management
- Activity timeline and notes

### Phase 3: Enhanced CRM & Client Portal

- Client services, meetings, documents, payments tabs
- Magic link authentication for clients
- Client dashboard, services view, documents, payments

### Phase 4: Self-Service & Notifications

- Email system (Resend) with templates
- Intake forms with dynamic JSON schema
- Invoice generation with auto-numbering
- Contract templates and e-signatures
- File upload to Supabase Storage

### Phase 5: Team Management

- Team members with roles (owner, admin, provider, assistant)
- Client assignments (primary, backup, support)
- Service assignments with revenue sharing
- Time tracking and on-call scheduling

### Phase 6: Production Hardening

- GitHub Actions CI/CD pipeline
- File cleanup and archive organization
- Migration file naming consistency

### Phase 6+: Admin Enhancements (Current)

**Report Builder UI** (COMPLETE):

- Visual step-by-step wizard: Source → Fields → Filter → Group → Calc → Chart
- Drag-and-drop column ordering with @dnd-kit
- Filter builder with picklist dropdowns for select fields
- Real-time preview with formula explanations
- Save reports with visibility settings (private/shared/org)
- View saved reports with data tables and aggregations
- Components in `src/components/admin/reports/`
- Pages in `src/app/admin/reports/`

**Dashboard Builder UI** (COMPLETE):

- 12-column responsive grid layout with drag-and-drop placement
- Widget types: Metric card, Chart (bar/line/pie/donut), Table, List, Funnel, Gauge, Calendar, Report
- Widget data sources: Link to saved report, custom query, or static value
- Edit/preview mode toggle for testing layouts
- Widget configuration panel with type-specific settings
- Save dashboards with visibility settings (private/shared/org)
- Components in `src/components/admin/dashboards/`
- Pages: list (`/admin/dashboards`), new (`/admin/dashboards/new`), view (`/admin/dashboards/[id]`), edit (`/admin/dashboards/[id]/edit`)
- Server actions in `src/app/actions/dashboards.ts`

**Admin Setup Hub** (COMPLETE):

- Salesforce-style centralized settings area at `/admin/setup/`
- Category cards: Administration, Business, Client Experience, Integrations
- **Users** (`/admin/setup/users/`): List users with role, status, last login; invite new users via Resend; activate/deactivate users
- **Roles & Permissions** (`/admin/setup/roles/`): List/edit roles with permissions matrix; system roles (admin, provider, viewer) + custom roles
- **Team Members**: Links to existing `/admin/team`
- **Contract Templates** (`/admin/setup/contracts/`): List/manage templates with service type, version, status
- **Intake Forms** (`/admin/setup/intake-forms/`): List/manage form templates with field count
- **Integrations** (`/admin/setup/integrations/`): Display Stripe, Resend, Supabase config status
- **Services & Company**: Stub pages for future development
- Components in `src/components/admin/setup/`
- Server actions in `src/app/actions/setup.ts`
- Permission constants in `src/lib/permissions.ts`

---

## Database Schema Reference

### Roles & Permissions

**Database schema:**

```sql
CREATE TABLE roles (
  id UUID PRIMARY KEY,
  name TEXT UNIQUE,
  description TEXT,
  is_system BOOLEAN DEFAULT false,
  permissions JSONB DEFAULT '{}'
);

-- Default roles: admin (full), provider (limited), viewer (read-only)
```

**Permission structure:**

```typescript
interface Permissions {
  [object: string]: ('create' | 'read' | 'update' | 'delete' | '*')[]
}
// Objects: leads, clients, invoices, meetings, documents, reports, dashboards, settings
```

### User/Employee Management

**Features:**

- List users with role, status, last login
- Invite new user (sends email via Resend)
- Link user to team_member profile
- Activate/deactivate users

---

## Pending Tasks

### Site Configuration (src/config/site.ts)

When ready to launch:

- [ ] Update owner name (line 15)
- [ ] Update established year (line 16)
- [ ] Update email address (line 21)
- [ ] Update phone number (line 22)
- [ ] Update Calendly link (line 24)
- [ ] Add OG image (line 109)
- [ ] Update Twitter/X handle when account exists (line 110)

### Other

- [ ] Add logo URL to email config (src/lib/email/config.ts:38)
- [ ] Replace sample resource fileUrls with actual hosted PDFs (src/app/resources/page.tsx:27)
- [ ] Integrate newsletter with email service (src/app/actions/newsletter.ts:45)

## GitHub Actions CI/CD

The project now has automated CI/CD:

```
.github/workflows/ci.yml
```

**Required GitHub Secrets:**

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `TEST_ADMIN_PASSWORD`

## Turbopack HMR Bug

There's a known Turbopack caching issue causing phantom module references. Clear cache with:

```bash
rm -rf .next node_modules/.cache
```

Also clear Playwright's browser cache if issues persist:

```bash
rm -rf ~/Library/Caches/ms-playwright/mcp-chrome-*
```
