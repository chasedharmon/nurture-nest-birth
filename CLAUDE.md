# Nurture Nest Birth - Doula CRM

## Project Status

**Current Phase**: Phase 7+ - CRM Refinement & SaaS Foundation
**Last Updated**: December 9, 2024

### Active Development Plan (6-Week Roadmap)

We are executing a comprehensive refinement and SaaS preparation plan. Goals:

1. **Polish existing features** before adding new ones
2. **Enhance workflow builder** to Marketing Cloud quality
3. **Build foundation rails** for Stripe, SMS, multi-tenancy (without live integration)
4. **Prepare for SaaS launch** with organizations, tiers, and metering

See `/Users/chaseharmon/.claude/plans/flickering-tickling-harbor.md` for full plan details.

### Phase 7+ Execution Progress

#### Phase A: Polish & Complete (Week 1-2) ✅ COMPLETE

| Task                      | Status      | Notes                                       |
| ------------------------- | ----------- | ------------------------------------------- |
| A.1 Real-Time Messaging   | ✅ COMPLETE | useRealtimeMessages hook with optimistic UI |
| A.2 Form Validation       | ✅ COMPLETE | Zod schemas in src/lib/validations/setup.ts |
| A.3 Welcome Packet Editor | ✅ COMPLETE | Full page with dialog, items management     |
| A.4 Intake Form Builder   | ✅ COMPLETE | IntakeFormBuilderDialog with JSON schema    |

**Phase A Files:**

- `src/lib/hooks/use-realtime-messages.ts` - Full realtime with optimistic updates, edit/delete
- `src/lib/hooks/use-presence.ts`, `use-connection-status.ts` - Presence and connectivity
- `src/lib/validations/setup.ts` - Zod schemas for users, roles, services, contracts, company
- `src/app/admin/setup/welcome-packets/page.tsx` - Welcome packets management UI
- `src/components/admin/setup/welcome-packet-dialog.tsx` - Create/edit dialog
- `src/components/admin/setup/welcome-packet-items-dialog.tsx` - Manage packet items
- `src/app/admin/setup/intake-forms/page.tsx` - Intake forms management UI
- `src/components/admin/setup/intake-form-builder-dialog.tsx` - Visual form builder

#### Phase B: Workflow Enhancement (Week 2-4) ✅ COMPLETE

| Task                        | Status      | Notes                                        |
| --------------------------- | ----------- | -------------------------------------------- |
| B.1 Fix Critical Gaps       | ✅ COMPLETE | History page, execution details dialog       |
| B.2 Entry Criteria/Filters  | ✅ COMPLETE | EntryCriteria types, entry-criteria-builder  |
| B.3 Re-entry Rules          | ✅ COMPLETE | ReentryMode types, reentry-rules component   |
| B.4 Variable Interpolation  | ✅ COMPLETE | VariablePicker, {{variable}} in engine       |
| B.5 Enhanced Decision Nodes | ✅ COMPLETE | DecisionBranch, EnhancedDecisionConfig       |
| B.6 Execution Analytics     | ✅ COMPLETE | Analytics dashboard with funnel, charts      |
| B.7 Template Gallery        | ✅ COMPLETE | Template gallery page with one-click install |

**Phase B Files:**

- `src/app/admin/workflows/[id]/history/page.tsx` - Execution history list
- `src/app/admin/workflows/[id]/history/execution-details-dialog.tsx` - Step-by-step details
- `src/app/admin/workflows/[id]/analytics/page.tsx` - Analytics dashboard
- `src/app/admin/workflows/[id]/analytics/analytics-dashboard.tsx` - Charts, funnel, stats
- `src/app/admin/workflows/[id]/settings/workflow-settings-form.tsx` - Entry/re-entry config
- `src/app/admin/workflows/templates/page.tsx` - Template gallery list
- `src/app/admin/workflows/templates/template-gallery.tsx` - Template cards with install
- `src/components/admin/workflows/entry-criteria-builder.tsx` - Entry criteria UI
- `src/components/admin/workflows/reentry-rules.tsx` - Re-entry mode selector
- `src/components/admin/workflows/variable-picker.tsx` - Variable insertion dropdown
- `src/components/admin/workflows/enhanced-decision-config.tsx` - Multi-branch conditions
- `src/components/admin/workflows/panels/properties-panel.tsx` - Node config with variables
- `src/lib/workflows/types.ts` - EntryCriteria, ReentryMode, DecisionBranch types
- `src/lib/workflows/engine.ts` - interpolateVariables method for {{variable}} support

#### Phase C: SaaS Foundation (Week 3-5) ✅ COMPLETE

| Task                      | Status      | Notes                                                |
| ------------------------- | ----------- | ---------------------------------------------------- |
| C.1 Multi-Tenancy Schema  | ✅ COMPLETE | organizations table, org_id on 40+ tables, RLS       |
| C.2 Subscription Tiers    | ✅ COMPLETE | starter/professional/enterprise plans, feature flags |
| C.3 Usage Metering        | ✅ COMPLETE | usage_metrics table, UsageBar component              |
| C.4 Stripe Billing Rails  | ✅ COMPLETE | Client lib, webhook handler, billing page UI         |
| C.5 Organization Settings | ✅ COMPLETE | Profile, API keys, data export, account deletion     |

**Phase C Files Created:**

- `supabase/migrations/20251215000000_multi_tenancy_foundation.sql` - Organizations, memberships, org_id columns
- `supabase/migrations/20251215010000_multi_tenancy_rls_policies.sql` - Updated RLS for all tables
- `supabase/migrations/20251215020000_subscription_plans.sql` - Plans table, usage_metrics, helper functions
- `src/lib/features/flags.ts` - Feature flag checking, usage metering
- `src/lib/hooks/use-organization.tsx` - React context for organization state
- `src/components/admin/feature-gate.tsx` - FeatureGate, LimitGate, UpgradeButton, UsageBar
- `src/lib/stripe/client.ts` - Stubbed Stripe client (checkout, portal, invoices)
- `src/app/api/webhooks/stripe/route.ts` - Stripe webhook handler (stubbed)
- `src/app/admin/setup/billing/page.tsx` - Billing page with plans, usage, invoices, payment methods
- `src/app/admin/setup/organization/page.tsx` - Organization settings page

#### Phase D: Communication Rails (Week 4-5) ✅ COMPLETE

| Task                     | Status      | Notes                                            |
| ------------------------ | ----------- | ------------------------------------------------ |
| D.1 SMS Infrastructure   | ✅ COMPLETE | Client lib, templates, UI, workflow engine wired |
| D.2 Stripe Payment Rails | ✅ COMPLETE | Payment links, checkout pages, webhooks          |

**Phase D Files Created:**

- `src/lib/sms/client.ts` - Stubbed SMS client (sendSms, calculateSegments, formatPhoneNumber, opt-in/out)
- `src/lib/sms/templates.ts` - SMS template types, categories, variables, preview utilities
- `src/lib/sms/index.ts` - Re-exports for SMS module
- `supabase/migrations/20251216000000_sms_templates.sql` - sms_templates, sms_consent, sms_messages tables
- `src/app/admin/setup/sms-templates/page.tsx` - SMS template management UI with stats
- `src/components/admin/setup/sms-template-dialog.tsx` - Create/edit dialog with char counter
- `src/components/admin/setup/sms-template-actions.tsx` - Preview, edit, delete actions
- `src/lib/stripe/payments.ts` - Stubbed Stripe payment client for invoices
- `supabase/migrations/20251216010000_stripe_payment_rails.sql` - Checkout session fields, payment_events table
- `src/app/checkout/success/page.tsx` - Payment success confirmation page
- `src/app/checkout/cancel/page.tsx` - Payment cancelled page
- `src/app/api/webhooks/stripe-payments/route.ts` - Webhook handler for payment events
- `src/app/actions/invoices.ts` - Added generatePaymentLink, expirePaymentLink functions
- `src/lib/workflows/engine.ts` - Added send_sms step execution with opt-in verification

#### Phase E: Analytics & Attribution (Week 5-6) ✅ COMPLETE

| Task                        | Status      | Notes                                              |
| --------------------------- | ----------- | -------------------------------------------------- |
| E.1 Lead Source Attribution | ✅ COMPLETE | UTM capture, referral partners, attribution fields |
| E.2 Client Satisfaction     | ✅ COMPLETE | NPS surveys, workflow integration, admin UI        |

**Phase E Files Created:**

- `supabase/migrations/20251217000000_lead_source_attribution.sql` - Attribution columns on leads, referral_partners table
- `supabase/migrations/20251217010000_client_satisfaction.sql` - surveys, survey_responses, survey_invitations tables
- `src/lib/attribution/utm.ts` - UTM capture utilities (sessionStorage-based)
- `src/lib/attribution/index.ts` - Re-exports for attribution module
- `src/components/forms/contact-form.tsx` - Updated with "How did you hear about us?" and UTM fields
- `src/app/actions/contact.ts` - Updated to save attribution data
- `src/app/actions/leads.ts` - Added createLead action for manual lead entry with attribution
- `src/app/actions/referral-partners.ts` - Referral partner CRUD actions
- `src/app/actions/surveys.ts` - Survey CRUD, invitations, responses actions
- `src/app/admin/leads/new/page.tsx` - Manual lead entry form with full attribution support
- `src/app/admin/setup/referral-partners/page.tsx` - Referral partners management UI
- `src/components/admin/setup/referral-partner-dialog.tsx` - Create/edit partner dialog
- `src/components/admin/setup/referral-partner-actions.tsx` - Partner actions dropdown
- `src/app/admin/setup/surveys/page.tsx` - Survey management UI with NPS stats
- `src/components/admin/setup/survey-dialog.tsx` - Create/edit survey with question builder
- `src/components/admin/setup/survey-actions.tsx` - Survey actions dropdown
- `src/app/client/survey/[token]/page.tsx` - Public survey response page (token-based)
- `src/app/client/survey/[token]/survey-response-form.tsx` - Survey response form component
- `src/components/ui/nps-scale.tsx` - NPS scale input (0-10) with color coding
- `src/components/admin/client-overview.tsx` - Added Lead Source & Attribution section
- `src/lib/workflows/types.ts` - Added send_survey step type
- `src/lib/workflows/engine.ts` - Added executeSendSurvey method for workflow integration
- `src/components/admin/workflows/nodes/base-node.tsx` - Added send_survey node styling

### Prior Phase 7 Completed Items

| Feature                | Status      | Notes                                      |
| ---------------------- | ----------- | ------------------------------------------ |
| Loading Skeletons      | ✅ COMPLETE | Dashboard, leads, setup pages              |
| Error Boundaries       | ✅ COMPLETE | Admin-specific error page with dev details |
| Mobile Navigation      | ✅ COMPLETE | Sheet component + slide-out drawer         |
| Form Validation (Zod)  | 🔄 PARTIAL  | 5/9 forms done, schemas ready for rest     |
| Canned Email Templates | ✅ COMPLETE | Database, UI, CRUD actions                 |
| Welcome Packets        | ✅ COMPLETE | Database schema, UI (full editor later)    |
| Workflow Automation    | ✅ COMPLETE | Visual canvas builder with ReactFlow       |
| Unified Messaging      | ✅ COMPLETE | In-app messaging with realtime             |

**Workflow Automation Files:**

- `src/app/admin/workflows/page.tsx` - Workflows list with stats
- `src/app/admin/workflows/new/` - New workflow form (object type, trigger config)
- `src/app/admin/workflows/[id]/` - Workflow builder with ReactFlow canvas
- `src/components/admin/workflows/` - Canvas, nodes, panels components
- `src/lib/workflows/engine.ts` - Workflow execution engine
- `src/lib/workflows/types.ts` - TypeScript types for workflows
- `src/app/actions/workflows.ts` - Server actions for CRUD operations
- `src/app/api/workflows/process/route.ts` - API for processing executions
- `src/app/api/cron/workflow-scheduler/route.ts` - Scheduled workflow cron
- `supabase/migrations/20251213000000_workflow_automation.sql` - Database schema
- `tests/e2e/admin-workflows.spec.ts` - E2E tests (38 passing)

**Unified Messaging Files:**

- `src/app/admin/messages/page.tsx` - Conversations list with stats, search, tabs
- `src/app/admin/messages/[id]/page.tsx` - Conversation detail with message thread
- `src/components/admin/messages/conversation-list.tsx` - Conversation list component
- `src/components/admin/messages/message-thread.tsx` - Message thread with timestamps
- `src/components/admin/messages/message-composer.tsx` - Message input with Enter to send
- `src/components/admin/messages/new-conversation-dialog.tsx` - New conversation modal
- `src/components/admin/messages/conversation-actions.tsx` - Archive/close/reopen actions
- `src/components/admin/quick-messages-sheet.tsx` - Slide-out panel for quick message access from staff nav
- `src/app/client/(portal)/messages/page.tsx` - Client portal conversations list
- `src/app/client/(portal)/messages/[id]/page.tsx` - Client conversation detail
- `src/components/client/messages/client-conversation-list.tsx` - Client conversation list
- `src/components/client/messages/client-message-thread.tsx` - Client message thread
- `src/components/client/messages/client-message-composer.tsx` - Client message input
- `src/components/client/chat-widget/` - Floating chat widget for client portal
  - `chat-widget.tsx` - Main widget with state management
  - `chat-widget-bubble.tsx` - Floating bubble button
  - `chat-widget-panel.tsx` - Expanded panel container
  - `chat-widget-conversation-list.tsx` - Compact conversation list
  - `chat-widget-new-message.tsx` - Team member selection dialog
  - `chat-widget-thread.tsx` - Message thread with real-time
  - `chat-widget-composer.tsx` - Compact message input
- `src/components/ui/pulsing-badge.tsx` - Animated badge for unread indicators
- `src/app/actions/messaging.ts` - Server actions (CRUD, read status, search)
- `supabase/migrations/20251214000000_unified_messaging.sql` - Database schema
- `tests/e2e/admin-messages.spec.ts` - E2E tests (21 tests)

**Phase 7 Other Files:**

- `src/components/ui/skeleton.tsx` - Skeleton loading component
- `src/components/admin/dashboards/dashboard-skeleton.tsx` - Dashboard loading skeleton
- `src/app/admin/loading.tsx` - Admin dashboard loading state
- `src/app/admin/error.tsx` - Admin error boundary
- `src/app/admin/leads/loading.tsx` - Leads page loading state
- `src/app/admin/setup/loading.tsx` - Setup hub loading state
- `src/components/ui/sheet.tsx` - Sheet/drawer component for mobile nav
- `src/lib/validations/setup.ts` - Zod schemas for admin setup forms
- `src/app/admin/setup/email-templates/page.tsx` - Email templates management
- `src/components/admin/setup/email-template-dialog.tsx` - Template create/edit dialog
- `src/components/admin/setup/email-template-actions.tsx` - Template actions (preview, delete)
- `supabase/migrations/20251211000000_email_templates.sql` - Email templates table + defaults
- `src/app/admin/setup/welcome-packets/page.tsx` - Welcome packets management UI
- `supabase/migrations/20251212000000_welcome_packets.sql` - Welcome packets tables + defaults
- `tests/e2e/admin-setup-polish.spec.ts` - E2E tests for Phase 7 polish features

### Phase 6+ Progress (COMPLETE)

| Feature                  | Status      | Notes                                     |
| ------------------------ | ----------- | ----------------------------------------- |
| Report Builder UI        | ✅ COMPLETE | Wizard, filters, preview, save/edit       |
| Dashboard Builder UI     | ✅ COMPLETE | 12-col grid, drag-drop, 8 widget types    |
| Admin Setup Hub          | ✅ COMPLETE | All pages functional, E2E tested          |
| Contract Template Editor | ✅ COMPLETE | Create/edit templates with placeholders   |
| Roles & Permissions UI   | ✅ COMPLETE | Hierarchy levels, permission matrix       |
| User Management UI       | ✅ COMPLETE | Invite flow, manual create, team linking  |
| Company Profile          | ✅ COMPLETE | Business info, branding, invoice settings |
| Services & Packages      | ✅ COMPLETE | Package management with toggle            |
| E2E Testing              | ✅ COMPLETE | Full admin portal tested, bugs fixed      |

### Admin Portal E2E Testing (Completed Dec 8, 2024)

All admin pages tested with Playwright:

- ✅ Login/Auth flow
- ✅ Main Dashboard (KPIs, charts, recent leads)
- ✅ Leads table (filters, search, detail pages)
- ✅ Setup Hub (Users, Roles, Services, Company, Contracts, Intake Forms, Integrations)
- ✅ Team Management (Dashboard, Members, Assignments, Time Tracking, On-Call)
- ✅ Reports (list, detail, data tables, charts)
- ✅ Dashboards (list, builder with widget panel)
- ✅ Mobile responsiveness

**Bugs Fixed During Testing:**

1. Reports & Dashboards pages - missing left padding (added container wrapper)
2. Company Profile page - RLS error (changed to authenticated client)

### Future Features (Not Started)

- Advanced Scheduling (calendar sync, availability)
- Stripe integration for payments

## Project Overview

A CRM and client portal for a doula practice in Kearney, Nebraska. Built with Next.js 16, Supabase, and Tailwind CSS.

## Tech Stack

- **Framework**: Next.js 16 with Turbopack
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth (admin) + Magic Link (clients)
- **Styling**: Tailwind CSS 4
- **Testing**: Playwright E2E (11 suites) + Vitest unit tests
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

**Workflow Automation** (COMPLETE):

- Visual drag-and-drop canvas builder using @xyflow/react v12
- Object types: Lead, Meeting, Payment, Invoice, Service, Document, Contract, Intake Form
- Trigger types: Record Create, Record Update, Field Change, Scheduled, Manual, Form Submit, Payment Received
- Action nodes: Send Email (with template selection), Create Task, Update Field, Wait (delay), Decision (branching)
- Node palette with categorized drag-and-drop nodes
- Properties panel for configuring selected nodes
- Workflow execution engine in `src/lib/workflows/engine.ts`
- Pre-built templates: New Lead Welcome, Consultation Follow-up, Payment Confirmation, Contract Reminder
- Database tables: workflows, workflow_steps, workflow_executions, workflow_step_executions, workflow_templates
- E2E tests: 38 passing (desktop), 12 skipped (mobile - canvas not mobile-optimized)
- Components in `src/components/admin/workflows/`
- Pages: list (`/admin/workflows`), new (`/admin/workflows/new`), builder (`/admin/workflows/[id]`)
- Server actions in `src/app/actions/workflows.ts`

**Unified Messaging** (COMPLETE):

- In-app messaging system for doula-client communication
- Real-time updates via Supabase Realtime (messages table)
- Conversation statuses: active, closed, archived
- Unread message badges in navigation (admin and client portals) with pulsing animation
- Admin features: Start conversation, search, archive/close/reopen, quick access slide-out sheet
- Client portal: View and reply to conversations with doula, floating chat widget (Intercom-style)
- Floating chat widget with: bubble button, expandable panel, conversation list, thread view, team member selection for new messages
- Database tables: conversations, conversation_participants, messages
- Helper functions: `mark_conversation_read`, `get_user_unread_count`, `get_or_create_client_conversation`
- RLS policies for secure access (admin sees all, clients see their own)
- UI components: Avatar, Popover, Command (cmdk) for client search, PulsingBadge for unread indicators
- E2E tests: 21 tests for admin messaging (requires TEST_ADMIN_PASSWORD env var)
- Components in `src/components/admin/messages/`, `src/components/client/messages/`, and `src/components/client/chat-widget/`
- Pages: admin list (`/admin/messages`), admin detail (`/admin/messages/[id]`), client list (`/client/messages`), client detail (`/client/messages/[id]`)
- Server actions in `src/app/actions/messaging.ts`

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

---

## Prompt for Next Chat Session

Copy this entire block to start your next chat session:

```
I'm continuing work on the Nurture Nest Birth CRM project.

## 6-Week Refinement Plan: ✅ ALL PHASES COMPLETE

All 5 phases (A, B, C, D, E) of the refinement and SaaS foundation plan are complete.

## Current Focus: Comprehensive E2E Testing

We need to create Playwright E2E tests for all newly implemented features from Phases A-E. Many features were built but lack test coverage.

### Existing Test Files (29 total in tests/e2e/):
- admin-crm.spec.ts, admin-messages.spec.ts, admin-phase4.spec.ts
- admin-reports.spec.ts, admin-setup-polish.spec.ts, admin-team.spec.ts
- admin-workflows.spec.ts (partial - 38 tests, mostly canvas interaction)
- client-portal.spec.ts, client-care-team.spec.ts, client-team-assignments.spec.ts
- Various messaging tests (realtime, bidirectional, functional)

### Features Needing E2E Test Coverage:

**Phase A - Polish Features:**
- [ ] Welcome packets management (create, edit, delete, items management)
- [ ] Intake form builder (create form, add fields, edit, preview)
- [ ] Form validation edge cases

**Phase B - Workflow Enhancement:**
- [ ] Workflow history page (view executions, step details dialog)
- [ ] Workflow analytics dashboard (date range filters, stats, funnel)
- [ ] Workflow templates gallery (browse, install template)
- [ ] Workflow settings (entry criteria builder, re-entry rules)
- [ ] Variable picker in email/SMS steps

**Phase C - SaaS Foundation:**
- [ ] Organization settings page (profile, data export, deletion)
- [ ] Billing page UI (plans display, usage meters, invoices tab)
- [ ] Feature gates (test tier restrictions display)

**Phase D - Communication Rails:**
- [ ] SMS templates page (create, edit, preview, toggle active)
- [ ] Checkout success/cancel pages

**Phase E - Analytics & Attribution:**
- [ ] Manual lead entry form (/admin/leads/new)
- [ ] Referral partners management (create, edit, toggle, delete)
- [ ] Survey management (create NPS survey, view responses)
- [ ] Public survey response page (/client/survey/[token])
- [ ] Lead detail attribution section display

### Testing Approach:
1. Create new spec files for each feature area
2. Test happy path first, then edge cases
3. Verify UI elements render correctly
4. Test form submissions and data persistence
5. Test navigation and routing
6. Handle async operations (loading states, API calls)

### Key Commands:
- `pnpm test:e2e` - Run all tests
- `pnpm test:e2e tests/e2e/[filename].spec.ts` - Run specific test
- `pnpm test:e2e --ui` - Interactive UI mode
- `pnpm test:e2e --debug` - Debug mode

### Test Environment:
- Uses Chromium browser
- Requires TEST_ADMIN_PASSWORD env var
- Admin email: chase.d.harmon@gmail.com
- Tests should clean up after themselves

### File Naming Convention:
- `admin-[feature].spec.ts` - Admin-side features
- `client-[feature].spec.ts` - Client portal features
- Use describe/test blocks with clear naming

Start by identifying which features have the least coverage and create comprehensive tests for them.
```
