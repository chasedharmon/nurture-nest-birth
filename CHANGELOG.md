# Changelog

All notable changes to Nurture Nest Birth are documented in this file.

## [Unreleased] - 2025-12-13

### Added - Navigation Item Management

**Add Navigation Items** (`/admin/setup/navigation`)

- **Add Item Button** - Each navigation group (Primary, Tools, Admin) now has an "Add Item" button
- **AddNavItemDialog** - Tabbed dialog with three options:
  - **Move Item** - Move existing items between navigation groups with search filtering
  - **Object** - Add custom objects not yet in navigation
  - **Link** - Create external link items with custom icon selection

**Server Actions** (`src/app/actions/navigation-admin.ts`)

- `addNavigationItem()` - Create new navigation items (object, tool, or external_link)
- `moveNavigationItem()` - Move items between navigation groups
- `deleteNavigationItem()` - Delete navigation items (with protected item checks)
- `getAvailableObjectsForNav()` - Fetch custom objects not yet in navigation

**Components** (`src/components/admin/setup/navigation/`)

- `AddNavItemDialog` - New component for the add item dialog
- `NavItemsList` - Enhanced with Add Item button and dialog integration
- `NavigationManager` - Added handlers for add/move operations

### Fixed - Navigation Settings

**Drag-and-Drop Persistence**

- Fixed reorder not persisting: after reordering, the page now refetches navigation items to get fresh IDs
- Root cause: `reorderAdminNavItems` creates new org-specific records for global items, causing ID mismatches
- Solution: call `getNavigationItemsForAdmin()` after successful reorder to sync with database state

**Standard Object Reordering**

- Fixed standard objects (Account, Contact, etc.) reverting after reorder
- Root cause: upsert with partial indexes didn't work reliably for org-specific overrides
- Solution: replaced upsert with explicit check-then-insert/update pattern
- Also fixed frontend state sync timing by explicitly updating localItems after refetch

**Delete Navigation Items**

- Added delete button (trash icon) to navigation items in the settings list
- Delete button only appears for removable items (`canBeRemoved = true`)
- Button has destructive hover styling and disabled state during deletion
- Required items (like Setup) cannot be deleted

**E2E Tests** (`tests/e2e/admin-navigation-management.spec.ts`)

- 18 new tests for Add Navigation Item functionality
- 8 new tests for Drag-and-Drop Reordering and Delete functionality
- Tests cover: drag handles, item persistence, add/delete workflow, delete persistence after reload
- Total navigation management tests: 65

---

## [Previous] - 2025-12-12

### Added - Enhanced List Views for CRM Objects

**List View Components** (`src/components/admin/crm/list-view/`)

- **ColumnSelector** - Drag-and-drop column visibility and reordering dialog
- **FilterBuilder** - Advanced filtering with AND/OR logic, 15+ operators, type-aware inputs
- **ViewSelector** - Dropdown to switch between saved views (personal/shared/org-wide)
- **ViewSaveDialog** - Save current filters and columns as a named view
- **ListViewToolbar** - Unified toolbar combining search, filters, columns, view management, and export
- **Export** - CSV and Excel export integrated into toolbar (supports selected records or all filtered data)

**Server Actions** (`src/app/actions/crm-list-views.ts`)

- `getCrmListViews()` - Fetch all views for an object (respects visibility)
- `getCrmListViewById()` - Get a single view with full details
- `createCrmListView()` - Create a new saved view
- `updateCrmListView()` - Update view settings
- `deleteCrmListView()` - Delete a view
- `pinCrmListView()` - Pin/unpin favorite views

**Database**

- `crm_list_views` table for storing saved view configurations
- RLS policies for view visibility (private, shared, org-wide)
- Migration: `20251212000000_crm_list_views.sql`

### Changed

- **DynamicListView** - Enhanced with optional `enableAdvancedToolbar` prop
  - Backward compatible - existing usage unchanged
  - When enabled: full view/filter/column management
- **CRM Pages** - All pages now use advanced toolbar:
  - Activities, Contacts, Accounts, Opportunities, CRM Leads
  - Custom Objects (dynamic `[apiName]` page)

### Technical Notes

- All new features are opt-in via `enableAdvancedToolbar={true}`
- Existing DynamicListView usage continues to work without changes
- Filter state synced with URL parameters for shareable links
- Column configuration persisted in browser state (saved views store to DB)

---

## [Phase 6] - 2025-12-07

### Added - Production Hardening

**CI/CD Pipeline**

- GitHub Actions workflow (`.github/workflows/ci.yml`)
- Automated linting and type checking on PRs
- Unit tests with Vitest
- E2E tests with Playwright
- Production build verification

**Database**

- `contract_signatures` table for e-signature tracking
- Activity logging triggers for contract signatures

### Changed

- Archived Phase 4 documentation to `docs/archive/`
- Renamed migration files for consistent timestamp ordering
- Updated `CLAUDE.md` with current project status

### Fixed

- Missing `contract_signatures` table (was causing console errors on Contracts tab)

---

## [Phase 5] - 2025-12-07

### Added - Team Management

**Team Members**

- `team_members` table with roles (owner, admin, provider, assistant)
- Team member profiles with certifications and specializations
- Admin UI for team management (`/admin/team`)

**Client Assignments**

- `client_assignments` table linking clients to team members
- Assignment roles: primary, backup, support
- Client care team view in client portal

**Service Assignments**

- `service_assignments` table for provider-service mapping
- Revenue sharing percentages per assignment

**Time Tracking**

- `time_entries` table for billable hours
- On-call scheduling with `oncall_schedule` table

### Testing

- 21 E2E tests for team assignments
- Tests for care team visibility in client portal

---

## [Phase 4] - 2025-12-08

### Added - Foundation for Self-Service & Notifications

**Email System**

- `src/lib/email/` - Complete email infrastructure with Resend
- Email templates: Magic Link, Welcome, Meeting Scheduled, Meeting Reminder, Document Shared, Payment Received
- Shared email layout with consistent branding
- `sendEmail()` and `sendTrackedEmail()` functions for unified email sending

**Improved Authentication**

- Database-backed sessions (replaces cookie-only approach)
- bcrypt password hashing (12 rounds)
- `requestMagicLink()` - Send magic link emails via Resend
- Session management: create, validate, invalidate, revoke
- Admin functions: view/revoke client sessions
- Development fallback password (will require real password in production)

**Notification System**

- `notification_log` table for tracking all sent notifications
- `notification_preferences` table for client notification settings
- Functions: `sendWelcomeEmail()`, `sendMeetingScheduledEmail()`, `sendMeetingReminderEmail()`, `sendDocumentSharedEmail()`, `sendPaymentReceivedEmail()`
- Notification preferences check before sending

**Client Profile**

- Server actions for profile updates: contact info, address, birth preferences, medical info, emergency contact
- `updateFullProfile()` for intake form submissions

**Intake Forms**

- `intake_form_templates` table with JSON schema for dynamic forms
- `intake_form_submissions` table for tracking submissions
- Default intake form template with 7 sections (personal, pregnancy, medical, preferences, postpartum, emergency, additional)
- Server actions: get templates, submit form, save draft, review submission

**Invoicing Foundation**

- `invoices` table with auto-generated invoice numbers (INV-YYYY-NNN)
- Line items, tax, amounts, payment status tracking
- Stripe integration fields ready (stripe_invoice_id, payment_link)

**Contract Templates**

- `contract_templates` table for reusable contracts
- E-signature tracking fields on client_services (IP, user agent, signature data)

### Database

New tables:

- `client_sessions` - Database-backed session management
- `notification_log` - Track all notifications sent
- `notification_preferences` - Client notification settings
- `intake_form_templates` - Dynamic form definitions
- `intake_form_submissions` - Submitted intake forms
- `invoices` - Invoice tracking with auto-numbering
- `contract_templates` - Reusable contract content

Extended tables:

- `leads` - Added `password_hash` column
- `client_services` - Added contract signature tracking fields

### Dependencies

- `bcryptjs` - Password hashing

---

## [Phase 3.3] - 2025-12-07

### Added - Admin CRUD UI

- **Add Service Form** - Create service packages with type, package name, amount, dates, contract status
- **Add Meeting Form** - Schedule meetings with type, date/time, duration, location, video link
- **Add Document Form** - Add documents with title, type, URL, visibility toggle
- **Add Payment Form** - Record payments with amount, type, method, status, linked service

### Changed

- **Services List** - Added status dropdown, mark contract signed, delete with confirmation
- **Meetings List** - Added status dropdown (scheduled/completed/cancelled/no-show), delete
- **Documents List** - Added toggle client visibility, download link, delete
- **Payments List** - Added status dropdown, delete, payment summary stats, services prop

### Database

- Phase 3.3 tables: `client_services`, `meetings`, `client_documents`, `payments`
- Simplified RLS policies for authenticated users

---

## [Phase 3.2] - 2025-12-07

### Added - Client Portal

- **Magic Link Authentication** - Passwordless login via secure tokens
- **Client Dashboard** - Welcome message, stats cards, upcoming meetings preview
- **Services Page** - View service packages, contract status, payment status
- **Meetings Page** - Upcoming and past meetings with details
- **Documents Page** - View and download client-visible documents
- **Payments Page** - Payment summary and transaction history
- **Profile Page** - Contact info, birth preferences, emergency contact

### Database

- `client_auth_tokens` table for magic link tokens
- Extended `leads` table with `email_verified` and `last_login_at`
- RLS policies for client data access

### Routes

- `/client/login` - Client login page
- `/client/verify` - Magic link verification
- `/client/dashboard`, `/client/services`, `/client/meetings`, `/client/documents`, `/client/payments`, `/client/profile`

---

## [Phase 3.1] - 2025-12-07

### Added - Enhanced Admin CRM

- **Client Services** - Track doula packages, contracts, payment status
- **Meetings** - Schedule consultations, prenatals, birth support, postpartum visits
- **Client Documents** - Manage contracts, birth plans, resources, photos, invoices
- **Payments** - Track all financial transactions with service linkage

### UI Components

- **Client Detail Tabs** - 7-tab interface (Overview, Services, Meetings, Documents, Payments, Activity, Notes)
- **Client Overview** - Contact info, birth/medical info, preferences, emergency contact
- **Services List** - Service packages with pricing, contract status
- **Meetings List** - Upcoming/past meetings with type icons
- **Documents List** - Documents grouped by type with download links
- **Payments List** - Payment summary cards and transaction history

### Database

- Extended `leads` table with partner info, address, birth preferences, medical info, emergency contact
- Enhanced `lead_activities` with categories, related record tracking, pin, visibility

### Server Actions

- 40+ server functions across services.ts, meetings.ts, documents.ts, payments.ts

---

## [Phase 2] - 2025-12-07

### Added - Lead Management System

- **Lead Detail Pages** - Dynamic routing `/admin/leads/[id]`
- **Status Management** - Update dropdown, visual badges, activity logging
- **Activity/Notes System** - Timeline, add notes, log calls/meetings/emails
- **Search & Filter** - Search by name/email, filter by status/source
- **All Leads Page** - `/admin/leads` with search interface

### Server Actions

- `getLeadById`, `updateLeadStatus`, `updateLead`, `searchLeads`, `getAllLeads`
- `getLeadActivities`, `addActivity`, `deleteActivity`

---

## [Phase 1] - 2025-12-07

### Added - Foundation & CRM Base

- **Database** - PostgreSQL via Supabase with leads, users, lead_activities tables
- **Authentication** - Supabase Auth with protected admin routes
- **Admin Dashboard** - Stats cards, recent leads table
- **Lead Capture** - Contact form and newsletter signup to database
- **Email Notifications** - Resend integration for contact form submissions
- **Automated Testing** - Playwright E2E tests

### Tech Stack

- Next.js 16 with App Router, React 19, TypeScript strict mode
- Tailwind CSS 4, shadcn/ui components
- ESLint, Prettier, Husky pre-commit hooks
- Conventional commits with commitlint

---

## Future Roadmap

### Phase 7 (Planned) - Enhanced Features

- Stripe payment integration
- Calendar integration (Calendly API or native)
- Newsletter integration (ConvertKit/Mailchimp)
- Production deployment guide

### Phase 8+ (Future)

- SMS notifications (Twilio)
- In-app messaging
- Revenue dashboards
- Mobile PWA
