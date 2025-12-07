# Changelog

All notable changes to Nurture Nest Birth are documented in this file.

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

### Phase 3.4+ (Planned)

- File upload integration with Supabase Storage
- Email notifications for meetings (Resend)
- Calendar integration
- Invoice generation from payments
- Stripe payment processing
- Client profile editing
