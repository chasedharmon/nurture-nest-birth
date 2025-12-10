# Nurture Nest Birth CRM - Comprehensive Documentation

## Executive Summary

**Project**: Nurture Nest Birth CRM
**Type**: Full-featured CRM for DONA-certified doula practice
**Location**: Kearney, Nebraska
**Development Phase**: Phase 7+ (CRM Refinement & SaaS Foundation)

---

## Tech Stack Overview

| Layer          | Technology                 | Purpose                                 |
| -------------- | -------------------------- | --------------------------------------- |
| **Framework**  | Next.js 16 (App Router)    | Full-stack React framework with SSR     |
| **Language**   | TypeScript (strict mode)   | Type safety throughout                  |
| **UI Library** | React 19                   | Component framework                     |
| **Styling**    | Tailwind CSS 4 + shadcn/ui | Utility-first CSS with Radix primitives |
| **Database**   | Supabase (PostgreSQL)      | Database, Auth, Storage, Realtime       |
| **Email**      | Resend + React Email       | Transactional email with templates      |
| **Payments**   | Stripe (stubbed)           | Payment processing infrastructure       |
| **SMS**        | Twilio (stubbed)           | Text messaging capability               |
| **Automation** | @xyflow/react v12          | Visual workflow builder                 |
| **Testing**    | Playwright + Vitest        | E2E and unit testing                    |
| **Animations** | Framer Motion              | UI animations                           |

---

## Feature Documentation

### 1. Lead Management

**Status**: ✅ Complete
**Location**: `/admin/leads`

```
┌─────────────────────────────────────────────────────────────┐
│                    LEAD MANAGEMENT                           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌────────┐ │
│  │   NEW    │───▶│CONTACTED │───▶│SCHEDULED │───▶│ CLIENT │ │
│  └──────────┘    └──────────┘    └──────────┘    └────────┘ │
│       │                                               │      │
│       └──────────────────┬────────────────────────────┘      │
│                          ▼                                   │
│                    ┌──────────┐                              │
│                    │   LOST   │                              │
│                    └──────────┘                              │
│                                                              │
│  Components:                                                 │
│  ├── Lead List View (search, filter, sort)                  │
│  ├── Lead Detail Page (tabbed interface)                    │
│  ├── Manual Lead Entry (/admin/leads/new)                   │
│  ├── Bulk Actions (status changes, assignments)             │
│  └── Activity Timeline                                      │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Key Files**:

- `src/app/admin/leads/page.tsx` - List view
- `src/app/admin/leads/[id]/page.tsx` - Detail view
- `src/app/admin/leads/new/page.tsx` - New lead form
- `src/app/actions/leads.ts` - Server actions

**Data Model**:

```typescript
interface Lead {
  id: string
  name: string
  email: string
  phone?: string
  due_date?: string
  status: 'new' | 'contacted' | 'scheduled' | 'client' | 'lost'
  source: 'contact_form' | 'newsletter' | 'manual'
  client_type?: 'lead' | 'expecting' | 'postpartum' | 'past_client'
  lifecycle_stage?: 'lead' | 'consultation_scheduled' | 'active_client' | ...
  // Attribution
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  referral_partner_id?: string
  landing_page?: string
}
```

**Next Steps**:

- [ ] Add lead scoring algorithm
- [ ] Implement lead source analytics dashboard
- [ ] Add duplicate detection

---

### 2. Client Portal

**Status**: ✅ Complete
**Location**: `/client`

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT PORTAL                             │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Authentication Flow:                                        │
│  ┌────────┐    ┌────────────┐    ┌──────────┐              │
│  │ Email  │───▶│ Magic Link │───▶│ Dashboard│              │
│  │ Entry  │    │ Sent/Click │    │ Access   │              │
│  └────────┘    └────────────┘    └──────────┘              │
│                                                              │
│  Portal Sections:                                            │
│  ┌──────────────────────────────────────────────┐           │
│  │ Dashboard                                     │           │
│  │ ├── Journey Timeline (milestones)            │           │
│  │ ├── Care Team Display                        │           │
│  │ ├── Next Appointment                         │           │
│  │ ├── Action Items                             │           │
│  │ └── Payment Summary                          │           │
│  ├──────────────────────────────────────────────┤           │
│  │ Services    - Active packages & status       │           │
│  │ Meetings    - Scheduled appointments         │           │
│  │ Documents   - Shared files & uploads         │           │
│  │ Payments    - Invoices & payment history     │           │
│  │ Messages    - Chat with care team            │           │
│  │ Profile     - Contact information            │           │
│  │ Intake      - Form completion                │           │
│  └──────────────────────────────────────────────┘           │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Key Files**:

- `src/app/client/(portal)/dashboard/page.tsx` - Main dashboard
- `src/app/actions/client-auth.ts` - Magic link auth
- `src/components/client/journey-timeline.tsx` - Milestone tracker
- `src/components/client/chat-widget/` - Floating chat

**Authentication**:

- Magic link tokens with 24-hour expiry
- bcrypt hashing (12 rounds) for session tokens
- 30-day session persistence
- IP/User-Agent tracking

**Next Steps**:

- [ ] Add birth plan editor
- [ ] Implement photo gallery for birth photos
- [ ] Add preference center for communication settings

---

### 3. Workflow Automation

**Status**: ✅ Complete (Core), 🔄 Ongoing refinement
**Location**: `/admin/workflows`

```
┌─────────────────────────────────────────────────────────────┐
│                 WORKFLOW AUTOMATION ENGINE                   │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Trigger Types:                                              │
│  ┌────────────────┬───────────────────────────────────────┐ │
│  │ record_create  │ When a new record is created          │ │
│  │ record_update  │ When any field changes                │ │
│  │ field_change   │ When specific field changes           │ │
│  │ scheduled      │ At specific time (cron)               │ │
│  │ manual         │ User-triggered execution              │ │
│  │ form_submit    │ When intake form submitted            │ │
│  │ payment_received│ When payment recorded               │ │
│  └────────────────┴───────────────────────────────────────┘ │
│                                                              │
│  Visual Canvas:                                              │
│  ┌─────────┐                                                │
│  │ Trigger │                                                │
│  └────┬────┘                                                │
│       ▼                                                     │
│  ┌─────────┐    ┌─────────┐                                │
│  │ Action  │───▶│ Decision│                                │
│  └─────────┘    └────┬────┘                                │
│                 ┌────┴────┐                                 │
│                 ▼         ▼                                 │
│            ┌───────┐ ┌───────┐                             │
│            │ Yes   │ │ No    │                             │
│            │ Branch│ │ Branch│                             │
│            └───┬───┘ └───┬───┘                             │
│                ▼         ▼                                  │
│            ┌───────┐ ┌───────┐                             │
│            │ Wait  │ │ Email │                             │
│            └───────┘ └───────┘                             │
│                                                              │
│  Action Types:                                               │
│  • send_email - Send templated email                        │
│  • send_sms - Send text message (stubbed)                   │
│  • create_task - Create action item                         │
│  • update_field - Modify record field                       │
│  • wait - Delay execution (hours/days)                      │
│  • decision - Branch based on conditions                    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Key Files**:

- `src/app/admin/workflows/page.tsx` - Workflow list
- `src/app/admin/workflows/[id]/page.tsx` - Canvas builder
- `src/lib/workflows/engine.ts` - Execution engine
- `src/lib/workflows/types.ts` - Type definitions
- `src/app/api/workflows/process/route.ts` - Processing endpoint
- `src/app/api/cron/workflow-scheduler/route.ts` - Scheduled triggers

**Data Model**:

```typescript
interface Workflow {
  id: string
  name: string
  description?: string
  object_type: 'lead' | 'meeting' | 'payment' | 'invoice' | 'service' | ...
  trigger_type: 'record_create' | 'field_change' | 'scheduled' | ...
  trigger_config: TriggerConfig
  is_active: boolean
  canvas_data: {
    nodes: WorkflowNode[]
    edges: WorkflowEdge[]
  }
  entry_criteria: FilterCondition[]
  reentry_mode: 'always' | 'once' | 'once_per_day' | 'once_per_week'
  execution_count: number
}
```

**Next Steps**:

- [ ] Add more action types (create_meeting, assign_team_member)
- [ ] Implement workflow versioning
- [ ] Add A/B testing for email variants
- [ ] Build workflow analytics dashboard

---

### 4. Unified Messaging

**Status**: ✅ Complete
**Location**: `/admin/messages`, `/client/(portal)/messages`

```
┌─────────────────────────────────────────────────────────────┐
│                   MESSAGING SYSTEM                           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Architecture:                                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                    Supabase Realtime                    │ │
│  │                         │                               │ │
│  │    ┌───────────────────┼───────────────────┐           │ │
│  │    │                   │                   │           │ │
│  │    ▼                   ▼                   ▼           │ │
│  │ ┌──────┐         ┌──────────┐        ┌──────────┐     │ │
│  │ │Admin │         │Conversations│      │ Client   │     │ │
│  │ │Inbox │◀───────▶│  Table     │◀─────▶│ Portal   │     │ │
│  │ └──────┘         └──────────┘        └──────────┘     │ │
│  │                        │                               │ │
│  │                        ▼                               │ │
│  │                  ┌──────────┐                          │ │
│  │                  │ Messages │                          │ │
│  │                  │  Table   │                          │ │
│  │                  └──────────┘                          │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  Features:                                                   │
│  • Thread-based conversations                               │
│  • Real-time message delivery                               │
│  • Unread badge tracking                                    │
│  • Archive/close/reopen threads                             │
│  • Search by client or content                              │
│  • Floating chat widget (client portal)                     │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Key Files**:

- `src/app/admin/messages/page.tsx` - Admin inbox
- `src/app/client/(portal)/messages/page.tsx` - Client inbox
- `src/app/actions/messaging.ts` - Server actions
- `src/components/client/chat-widget/` - Floating widget

**Next Steps**:

- [ ] Add typing indicators
- [ ] Implement message reactions
- [ ] Add file attachments in messages
- [ ] Build canned response library

---

### 5. Invoicing & Payments

**Status**: ✅ Complete (Core), 🔄 Stripe integration stubbed
**Location**: `/admin/leads/[id]` (Payments tab), `/client/(portal)/invoices`

```
┌─────────────────────────────────────────────────────────────┐
│                 INVOICING & PAYMENTS                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Invoice Lifecycle:                                          │
│  ┌───────┐   ┌──────┐   ┌──────┐   ┌──────┐               │
│  │ Draft │──▶│ Sent │──▶│ Paid │   │Overdue│               │
│  └───────┘   └──────┘   └──┬───┘   └──────┘               │
│                    │       │           ▲                    │
│                    │       ▼           │                    │
│                    │   ┌───────┐       │                    │
│                    │   │Partial│───────┘                    │
│                    │   └───────┘                            │
│                    ▼                                        │
│              ┌──────────┐                                   │
│              │Cancelled │                                   │
│              └──────────┘                                   │
│                                                              │
│  Features:                                                   │
│  • Auto-generated invoice numbers                           │
│  • Line items with quantity/price                           │
│  • Tax and discount support                                 │
│  • Payment link generation (Stripe Checkout)                │
│  • Multiple payment methods (card, check, cash, etc.)       │
│  • Payment history tracking                                 │
│  • Refund processing                                        │
│  • Overdue alerts on dashboard                              │
│                                                              │
│  Stripe Integration (Stubbed):                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │ createInvoiceCheckout() - Payment link             │    │
│  │ getCheckoutSession()    - Session status           │    │
│  │ getPaymentIntent()      - Payment details          │    │
│  │ createRefund()          - Process refunds          │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Key Files**:

- `src/app/actions/invoices.ts` - Invoice operations
- `src/app/actions/payments.ts` - Payment tracking
- `src/lib/stripe/payments.ts` - Stripe utilities
- `src/app/api/webhooks/stripe-payments/route.ts` - Webhook handler

**Next Steps**:

- [ ] Complete Stripe live integration
- [ ] Add recurring invoices
- [ ] Implement payment plans (installments)
- [ ] Add receipt generation

---

### 6. Team Management

**Status**: ✅ Complete
**Location**: `/admin/team`

```
┌─────────────────────────────────────────────────────────────┐
│                   TEAM MANAGEMENT                            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Team Member Roles:                                          │
│  ┌─────────┬────────────────────────────────────────────┐  │
│  │ Owner   │ Full access, billing, can delete org       │  │
│  │ Admin   │ All features, user management              │  │
│  │ Provider│ Client access, limited admin features      │  │
│  │ Viewer  │ Read-only access                           │  │
│  └─────────┴────────────────────────────────────────────┘  │
│                                                              │
│  Client Assignments:                                         │
│  ┌──────────┐      ┌──────────┐      ┌──────────┐         │
│  │  Client  │◀────▶│Assignment│◀────▶│Team Member│         │
│  └──────────┘      └────┬─────┘      └──────────┘         │
│                         │                                   │
│                    Role Types:                              │
│                    • primary                                │
│                    • backup                                 │
│                    • support                                │
│                                                              │
│  Features:                                                   │
│  • Team member profiles (certifications, specialties)       │
│  • Client capacity limits                                   │
│  • On-call scheduling                                       │
│  • Time tracking per client                                 │
│  • Revenue sharing configuration                            │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Key Files**:

- `src/app/admin/team/page.tsx` - Team overview
- `src/app/actions/team.ts` - Team operations
- `src/components/admin/team/` - Team components

**Next Steps**:

- [ ] Add team member availability calendar
- [ ] Implement shift scheduling
- [ ] Add performance metrics dashboard

---

### 7. Reports & Dashboards

**Status**: ✅ Complete
**Location**: `/admin/reports`, `/admin/dashboards`

```
┌─────────────────────────────────────────────────────────────┐
│               REPORTS & DASHBOARDS                           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Report Builder Workflow:                                    │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐   │
│  │ Source │▶│ Fields │▶│ Filter │▶│ Group  │▶│ Chart  │   │
│  └────────┘ └────────┘ └────────┘ └────────┘ └────────┘   │
│                                                              │
│  Data Sources:                                               │
│  • Leads/Clients  • Invoices    • Meetings                 │
│  • Payments       • Services    • Team Members             │
│                                                              │
│  Aggregations:                                               │
│  sum | count | avg | min | max | count_distinct             │
│                                                              │
│  Chart Types:                                                │
│  bar | line | pie | donut | area | scatter                  │
│                                                              │
│  Dashboard Features:                                         │
│  ┌────────────────────────────────────────────────────┐    │
│  │  12-Column Grid Layout                              │    │
│  │  ┌────────┬────────┬────────┐                      │    │
│  │  │ Metric │ Metric │ Metric │                      │    │
│  │  ├────────┴────────┼────────┤                      │    │
│  │  │     Chart       │  List  │                      │    │
│  │  ├─────────────────┼────────┤                      │    │
│  │  │     Funnel      │ Table  │                      │    │
│  │  └─────────────────┴────────┘                      │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  Widget Types:                                               │
│  metric | chart | table | list | funnel | gauge | calendar  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Key Files**:

- `src/app/admin/reports/page.tsx` - Report list
- `src/app/admin/dashboards/page.tsx` - Dashboard list
- `src/app/actions/reports.ts` - Report execution
- `src/components/admin/dashboards/` - Dashboard components

**Next Steps**:

- [ ] Add scheduled report emails
- [ ] Implement report export (PDF, CSV)
- [ ] Add goal tracking widgets
- [ ] Build comparison mode (this month vs last month)

---

### 8. Email & SMS Templates

**Status**: ✅ Email Complete, 🔄 SMS Stubbed
**Location**: `/admin/setup/email-templates`, `/admin/setup/sms-templates`

```
┌─────────────────────────────────────────────────────────────┐
│              EMAIL & SMS TEMPLATES                           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Email System (Resend):                                      │
│  ┌────────────────────────────────────────────────────┐    │
│  │                    React Email                      │    │
│  │  ┌────────────┐   ┌────────────┐   ┌────────────┐ │    │
│  │  │ Base       │   │ Magic Link │   │ Meeting    │ │    │
│  │  │ Template   │   │ Template   │   │ Reminder   │ │    │
│  │  └────────────┘   └────────────┘   └────────────┘ │    │
│  │                                                    │    │
│  │  Variables: {{client_name}}, {{due_date}}, etc.   │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  Pre-built Email Types:                                      │
│  • magic_link          - Client login                       │
│  • welcome             - New client welcome                 │
│  • meeting_scheduled   - Appointment confirmation           │
│  • meeting_reminder    - 24-hour reminder                   │
│  • document_shared     - New document notification          │
│  • payment_received    - Payment confirmation               │
│  • invoice_sent        - Invoice notification               │
│                                                              │
│  SMS System (Twilio - Stubbed):                             │
│  ┌────────────────────────────────────────────────────┐    │
│  │  • Phone validation (E.164 format)                  │    │
│  │  • Segment calculation (160/153 char limits)        │    │
│  │  • Opt-in/opt-out consent tracking                  │    │
│  │  • Template variables                               │    │
│  │  • Bulk SMS support                                 │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Key Files**:

- `src/lib/email/send.ts` - Email sending
- `src/lib/email/templates/` - React Email components
- `src/lib/sms/client.ts` - SMS client (stubbed)
- `src/app/actions/notifications.ts` - Notification logic

**Next Steps**:

- [ ] Complete Twilio SMS integration
- [ ] Add email open/click tracking
- [ ] Implement A/B testing for subject lines
- [ ] Add email scheduling

---

### 9. Contracts & Documents

**Status**: ✅ Complete
**Location**: `/admin/setup/contracts`, Client documents tab

```
┌─────────────────────────────────────────────────────────────┐
│             CONTRACTS & DOCUMENTS                            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Contract Flow:                                              │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐               │
│  │ Template │──▶│ Generate │──▶│  Client  │               │
│  │ Library  │   │ Contract │   │  Signs   │               │
│  └──────────┘   └──────────┘   └────┬─────┘               │
│                                      │                      │
│                                      ▼                      │
│                               ┌──────────┐                  │
│                               │ Stored + │                  │
│                               │ Logged   │                  │
│                               └──────────┘                  │
│                                                              │
│  Document Types:                                             │
│  • contract    - Service agreements                         │
│  • birth_plan  - Client birth preferences                   │
│  • resource    - Educational materials                      │
│  • photo       - Birth/family photos                        │
│  • invoice     - Billing documents                          │
│  • form        - Completed intake forms                     │
│                                                              │
│  Features:                                                   │
│  • Template variables ({{client_name}}, etc.)               │
│  • Signature tracking                                        │
│  • Visibility controls (client-visible or internal)         │
│  • Supabase Storage integration                             │
│  • File type/size tracking                                  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Key Files**:

- `src/app/admin/setup/contracts/page.tsx` - Contract templates
- `src/app/actions/contracts.ts` - Contract operations
- `src/app/actions/documents.ts` - Document management
- `src/app/actions/file-upload.ts` - Storage integration

**Next Steps**:

- [ ] Add e-signature integration (DocuSign/HelloSign)
- [ ] Implement document versioning
- [ ] Add watermarking for shared documents

---

### 10. Multi-Tenancy & SaaS Foundation

**Status**: 🔄 Rails Complete, Feature Integration Ongoing
**Location**: Database layer, `/admin/setup/billing`

```
┌─────────────────────────────────────────────────────────────┐
│              MULTI-TENANCY & SAAS                            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Subscription Tiers:                                         │
│  ┌───────────┬──────────┬────────────┬───────────────────┐ │
│  │           │ Starter  │Professional│ Enterprise        │ │
│  ├───────────┼──────────┼────────────┼───────────────────┤ │
│  │Team       │    3     │    10      │ Unlimited         │ │
│  │Clients    │   50     │   500      │ Unlimited         │ │
│  │Workflows  │    5     │   25       │ Unlimited         │ │
│  │Storage    │  500MB   │    5GB     │ Unlimited         │ │
│  │SMS        │    ❌    │    ✅      │ ✅                │ │
│  │Custom Roles│   ❌    │    ✅      │ ✅                │ │
│  │API Access │    ❌    │    ✅      │ ✅                │ │
│  │Reports    │  Basic   │ Advanced   │ Full              │ │
│  └───────────┴──────────┴────────────┴───────────────────┘ │
│                                                              │
│  Architecture:                                               │
│  ┌────────────────────────────────────────────────────┐    │
│  │              organizations                          │    │
│  │  ┌─────────────────────────────────────────────┐  │    │
│  │  │ id | name | subscription_tier | stripe_id   │  │    │
│  │  └─────────────────────────────────────────────┘  │    │
│  │                      │                             │    │
│  │         ┌────────────┼────────────┐              │    │
│  │         ▼            ▼            ▼              │    │
│  │    ┌────────┐  ┌─────────┐  ┌──────────┐       │    │
│  │    │ leads  │  │ invoices│  │ workflows│       │    │
│  │    │org_id  │  │ org_id  │  │ org_id   │       │    │
│  │    └────────┘  └─────────┘  └──────────┘       │    │
│  │                                                   │    │
│  │  RLS Policies enforce org_id isolation           │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  Feature Flags:                                              │
│  • canUseFeature(feature, tier) - Check access             │
│  • canAddMore(resource, tier, count) - Limit check         │
│  • isWithinLimit(resource, tier, count) - Quota check      │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Key Files**:

- `supabase/migrations/20251215000000_multi_tenancy_foundation.sql`
- `supabase/migrations/20251215020000_subscription_plans.sql`
- `src/lib/features/flags.ts` - Feature flag logic
- `src/app/admin/setup/billing/page.tsx` - Billing management

**Next Steps**:

- [ ] Complete Stripe subscription billing
- [ ] Add usage-based billing support
- [ ] Implement trial periods
- [ ] Add organization onboarding wizard

---

### 11. Attribution & Analytics

**Status**: ✅ Complete
**Location**: Lead tracking, Dashboard analytics

```
┌─────────────────────────────────────────────────────────────┐
│             ATTRIBUTION & ANALYTICS                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  UTM Tracking:                                               │
│  ┌────────────────────────────────────────────────────┐    │
│  │ Lead Sources                                        │    │
│  │ ├── utm_source   (google, facebook, referral)      │    │
│  │ ├── utm_medium   (cpc, email, organic)             │    │
│  │ ├── utm_campaign (specific campaign name)          │    │
│  │ ├── utm_content  (ad variation)                    │    │
│  │ └── utm_term     (keywords)                        │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  Referral Partners:                                          │
│  ┌──────────────┐    ┌──────────────┐                      │
│  │   Partner    │───▶│    Lead      │                      │
│  │ (OB, midwife)│    │referral_id   │                      │
│  └──────────────┘    └──────────────┘                      │
│                                                              │
│  Dashboard Analytics:                                        │
│  • Lead source distribution (donut chart)                   │
│  • Conversion rates by source                               │
│  • Revenue by referral partner                              │
│  • Landing page performance                                 │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Key Files**:

- `src/lib/attribution/` - Attribution tracking
- `src/app/admin/setup/referral-partners/page.tsx` - Partner management
- `src/app/actions/referral-partners.ts` - Partner operations

**Next Steps**:

- [ ] Add multi-touch attribution
- [ ] Implement attribution ROI calculator
- [ ] Add Google Analytics integration

---

### 12. Surveys & NPS

**Status**: ✅ Complete
**Location**: `/admin/setup/surveys`, `/client/survey/[token]`

```
┌─────────────────────────────────────────────────────────────┐
│                SURVEYS & NPS                                 │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Survey Types:                                               │
│  ┌────────┬────────────────────────────────────────────┐   │
│  │ NPS    │ Net Promoter Score (0-10 scale)            │   │
│  │ CSAT   │ Customer Satisfaction                      │   │
│  │ Custom │ Build your own questions                   │   │
│  └────────┴────────────────────────────────────────────┘   │
│                                                              │
│  NPS Calculation:                                            │
│  ┌─────────────────────────────────────────────────────┐   │
│  │   Detractors    │    Passives    │   Promoters     │   │
│  │    (0-6)        │     (7-8)      │     (9-10)      │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  NPS Score = % Promoters - % Detractors                     │
│                                                              │
│  Trigger Options:                                            │
│  • manual         - Send on demand                          │
│  • after_service  - When service completed                  │
│  • after_meeting  - Post-meeting follow-up                  │
│  • workflow       - Triggered by automation                 │
│                                                              │
│  Features:                                                   │
│  • Public token-based survey URLs                           │
│  • Response collection and storage                          │
│  • Sentiment classification                                 │
│  • Aggregate score tracking                                 │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Key Files**:

- `src/app/admin/setup/surveys/page.tsx` - Survey management
- `src/app/client/survey/[token]/page.tsx` - Public survey page
- `src/app/actions/surveys.ts` - Survey operations
- `src/components/ui/nps-scale.tsx` - NPS input component

**Next Steps**:

- [ ] Add survey branching logic
- [ ] Implement testimonial generation from promoters
- [ ] Add survey response analytics dashboard

---

## Database Schema Overview

### 33 Migration Files

```
supabase/migrations/
├── 20251207000000_initial_schema.sql           # Core: leads, activities, users
├── 20251207020000_phase3_schema.sql            # Client portal tables
├── 20251207030000_client_portal_auth.sql       # Magic link auth
├── 20251207040000_client_management.sql        # Services, meetings, documents
├── 20251208100000_team_members.sql             # Team support
├── 20251209000000_contract_signatures.sql      # E-signature tracking
├── 20251210000000_salesforce_features.sql      # Reports, dashboards
├── 20251211000000_email_templates.sql          # Email system
├── 20251212000000_welcome_packets.sql          # Onboarding automation
├── 20251213000000_workflow_automation.sql      # Workflow engine
├── 20251214000000_unified_messaging.sql        # Messaging system
├── 20251215000000_multi_tenancy_foundation.sql # Organizations
├── 20251215010000_multi_tenancy_rls_policies.sql # RLS policies
├── 20251215020000_subscription_plans.sql       # Subscription tiers
├── 20251216000000_sms_templates.sql            # SMS integration
├── 20251216010000_stripe_payment_rails.sql     # Stripe infrastructure
├── 20251217000000_lead_source_attribution.sql  # UTM tracking
├── 20251217010000_client_satisfaction.sql      # Survey system
└── ... (14 more migrations)
```

### Key Tables

| Table                                 | Purpose                      |
| ------------------------------------- | ---------------------------- |
| `leads`                               | Contact records and pipeline |
| `lead_activities`                     | Activity timeline            |
| `client_services`                     | Service assignments          |
| `meetings`                            | Appointments                 |
| `invoices` + `invoice_line_items`     | Billing                      |
| `payments` + `payment_events`         | Payment tracking             |
| `team_members` + `client_assignments` | Team management              |
| `workflows` + `workflow_executions`   | Automation                   |
| `conversations` + `messages`          | Messaging                    |
| `surveys` + `survey_responses`        | NPS/feedback                 |
| `organizations`                       | Multi-tenancy                |
| `email_templates` + `sms_templates`   | Communication                |

---

## API Architecture

### Server Actions (27 files, ~400KB)

| File               | Functions                                              |
| ------------------ | ------------------------------------------------------ |
| `leads.ts`         | getLeadById, updateLeadStatus, searchLeads, createLead |
| `invoices.ts`      | generateInvoice, sendInvoice, recordPayment            |
| `messaging.ts`     | createConversation, sendMessage, markAsRead            |
| `workflows.ts`     | createWorkflow, executeWorkflow, getExecutionHistory   |
| `team.ts`          | getTeamMembers, assignClient, trackTime                |
| `reports.ts`       | getDashboardKPIs, executeReport, getRevenueTrend       |
| `surveys.ts`       | createSurvey, recordResponse, calculateNPS             |
| `contracts.ts`     | getTemplate, signContract                              |
| `notifications.ts` | sendTrackedEmail, getNotificationLog                   |

### HTTP Endpoints

| Endpoint                             | Purpose                 |
| ------------------------------------ | ----------------------- |
| `POST /api/webhooks/stripe-payments` | Stripe payment webhooks |
| `POST /api/workflows/process`        | Workflow execution      |
| `GET /api/cron/workflow-scheduler`   | Scheduled triggers      |
| `GET /api/cron/meeting-reminders`    | Reminder emails         |

---

## Testing Status

### Playwright E2E Tests

- **Total**: 498 tests
- **Passing**: 359 (72%)
- **Failing**: 139 (28%)
- **Test Suites**: 20+

### Coverage Areas

- Admin authentication
- Dashboard KPIs
- Lead management
- Team management
- Workflow builder
- Messaging system
- Setup hub

---

## Priority Next Steps

### High Priority

1. **Complete Stripe Integration** - Enable live payment processing
2. **SMS Integration (Twilio)** - Activate text messaging
3. **E-Signature Integration** - DocuSign/HelloSign for contracts
4. **Fix Failing E2E Tests** - Improve test stability

### Medium Priority

5. **Report Export** - PDF/CSV export for reports
6. **Lead Scoring** - Automated qualification scoring
7. **Calendar Integration** - Google/Outlook sync
8. **Mobile Responsiveness** - Optimize client portal for mobile

### Future Enhancements

9. **Birth Photo Gallery** - Private photo sharing
10. **Video Calling** - In-app video consultations
11. **Public Booking Page** - Self-service scheduling
12. **Mobile App** - React Native client app

---

## File Structure Summary

```
nurture-nest-birth/
├── src/
│   ├── app/
│   │   ├── admin/          # 41 admin pages
│   │   ├── client/         # 15 client portal pages
│   │   ├── actions/        # 27 server action files
│   │   ├── api/            # HTTP endpoints
│   │   └── (public pages)  # Marketing pages
│   ├── components/
│   │   ├── ui/             # 45+ shadcn components
│   │   ├── admin/          # 50+ admin components
│   │   └── client/         # 10+ client components
│   ├── lib/
│   │   ├── supabase/       # Database client & types
│   │   ├── workflows/      # Workflow engine
│   │   ├── email/          # Email system
│   │   ├── sms/            # SMS client
│   │   ├── stripe/         # Payment integration
│   │   └── permissions/    # RBAC
│   └── config/             # Site configuration
├── supabase/
│   └── migrations/         # 33 migration files
└── tests/
    └── e2e/                # Playwright tests
```

---

## Configuration Files

| File                   | Purpose                |
| ---------------------- | ---------------------- |
| `package.json`         | Dependencies & scripts |
| `next.config.ts`       | Next.js configuration  |
| `tailwind.config.ts`   | Styling configuration  |
| `tsconfig.json`        | TypeScript settings    |
| `playwright.config.ts` | E2E test configuration |
| `.env.local`           | Environment variables  |
| `src/config/site.ts`   | Business configuration |

---

_Documentation generated: December 2024_
_Last Updated: December 9, 2024_
_Project Phase: 7+ (CRM Refinement & SaaS Foundation)_
