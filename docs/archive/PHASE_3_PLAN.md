# Phase 3 Plan: Salesforce-Style CRM + Client Portal

## Vision

Transform Nurture Nest Birth into a comprehensive business management system with:

1. **Admin CRM Portal** - Salesforce-style one-stop shop for managing clients, services, and business operations
2. **Client Self-Service Portal** - Empower clients to view their journey, access resources, book meetings, and manage payments

---

## Part A: Admin Portal Enhancements

### 1. Enhanced Client Profiles (Source of Truth)

**Goal**: Make each client record the complete source of truth for all client information

**Database Schema Extensions**:

```sql
-- Extend leads table to become full client records
ALTER TABLE leads ADD COLUMN:
  - partner_name TEXT
  - address JSONB (street, city, state, zip)
  - birth_preferences JSONB (location, birth_plan_notes, special_requests)
  - medical_info JSONB (obgyn, hospital, insurance)
  - emergency_contact JSONB (name, phone, relationship)
  - expected_due_date DATE (rename from due_date)
  - actual_birth_date DATE
  - client_type TEXT (expecting, postpartum, past_client)
  - tags TEXT[] (high_touch, vip, needs_follow_up, etc.)
  - lifecycle_stage TEXT (lead, consultation_scheduled, active_client, past_client, inactive)
```

**New Tables**:

```sql
-- Client services table
CREATE TABLE client_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  service_type TEXT NOT NULL, -- birth_doula, postpartum, lactation, etc.
  package_name TEXT,
  start_date DATE,
  end_date DATE,
  status TEXT, -- pending, active, completed, cancelled
  contract_signed BOOLEAN DEFAULT false,
  contract_url TEXT,
  price DECIMAL(10,2),
  payment_status TEXT, -- unpaid, partial, paid, refunded
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Meetings/appointments table
CREATE TABLE meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  meeting_type TEXT NOT NULL, -- consultation, prenatal, birth, postpartum, follow_up
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER DEFAULT 60,
  location TEXT, -- zoom_link, in_person_address, phone
  status TEXT DEFAULT 'scheduled', -- scheduled, completed, cancelled, no_show
  meeting_notes TEXT,
  preparation_notes TEXT, -- what to bring, what to prepare
  completed_at TIMESTAMPTZ,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Documents/resources table
CREATE TABLE client_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL, -- contract, birth_plan, resource, photo, invoice
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL, -- Supabase Storage URL
  file_size INTEGER,
  mime_type TEXT,
  is_client_visible BOOLEAN DEFAULT false, -- can client see this in their portal?
  uploaded_by UUID REFERENCES users(id),
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payments table
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  service_id UUID REFERENCES client_services(id),
  amount DECIMAL(10,2) NOT NULL,
  payment_method TEXT, -- stripe, check, cash, venmo
  transaction_id TEXT,
  status TEXT DEFAULT 'pending', -- pending, completed, failed, refunded
  payment_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**UI Enhancements**:

- Tabbed interface on client detail page:
  - Overview (demographics, contact, emergency contact)
  - Services (all packages, contracts, payment status)
  - Meetings (upcoming and past, with scheduling)
  - Documents (contracts, birth plans, resources, photos)
  - Payments (transaction history, payment plans)
  - Activity (unified activity stream - see below)
  - Notes (internal admin notes not visible to client)

### 2. Unified Activity Stream

**Goal**: Salesforce Marketing Cloud-style activity stream showing everything happening with a client

**Database Enhancement**:

```sql
-- Extend lead_activities table
ALTER TABLE lead_activities ADD COLUMN:
  - activity_category TEXT, -- communication, milestone, system, document, payment, meeting
  - related_record_type TEXT, -- service, meeting, payment, document
  - related_record_id UUID,
  - created_by UUID REFERENCES users(id),
  - is_pinned BOOLEAN DEFAULT false,
  - is_client_visible BOOLEAN DEFAULT false
```

**Activity Types to Capture**:

- Manual activities (notes, calls, emails) ✅ Already built
- Status changes ✅ Already auto-logged via trigger
- Service milestones (contract signed, service started, service completed)
- Meeting activities (scheduled, completed, cancelled, no-show)
- Document uploads (contract uploaded, birth plan received)
- Payment activities (payment received, invoice sent)
- System activities (lead converted to client, due date approaching)
- Email opens/clicks (if using email tracking)

**UI Features**:

- Filterable by category, date range
- Pin important activities to top
- Quick actions from activity items (reply to email, reschedule meeting)
- Rich activity cards with context and related records
- Timeline view with visual markers for key milestones

### 3. Admin Dashboard Enhancements

**New Dashboard Widgets**:

- Revenue metrics (monthly revenue, outstanding payments, revenue by service)
- Upcoming meetings (next 7 days)
- Clients needing attention (no activity in 30 days, approaching due dates)
- Service pipeline (consultations → active clients → completed)
- Quick stats (avg time to convert lead, client satisfaction, referral rate)

### 4. Reporting & Analytics

**Reports to Build**:

- Lead conversion funnel
- Revenue by service type
- Client acquisition sources (which marketing channels work best)
- Average client lifetime value
- Meeting completion rate
- Payment collection metrics

---

## Part B: Client Self-Service Portal

### 1. Client Authentication System

**Strategy**: Separate auth flow from admin (clients use magic link or simple password)

**Database**:

```sql
-- Client portal access table
CREATE TABLE client_portal_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES leads(id) ON DELETE CASCADE UNIQUE,
  auth_user_id UUID, -- links to auth.users
  portal_enabled BOOLEAN DEFAULT false,
  magic_link_token TEXT,
  magic_link_expires_at TIMESTAMPTZ,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Authentication Flow**:

1. Admin enables portal access for client
2. Client receives email with magic link or setup instructions
3. Client clicks link → auto-login or set password
4. Session management via Supabase Auth (separate role: 'client')

### 2. Client Portal Features

**Route Structure**:

```
/portal
  /dashboard - Overview of everything
  /services - View services, contracts, packages
  /meetings - View upcoming meetings, reschedule (if allowed)
  /documents - Download resources, forms, photos
  /payments - View payment history, make payments
  /profile - Update contact info, preferences
```

**Dashboard Page**:

- Welcome message with doula photo
- Countdown to due date (if expecting)
- Upcoming meetings
- Recent documents shared
- Payment summary
- Quick actions (message doula, book meeting, view birth plan)

**Services Page**:

- List of all services purchased
- Service details (package name, dates, what's included)
- Contract downloads
- Service timeline/milestones

**Meetings Page**:

- Upcoming meetings with calendar integration (add to calendar)
- Join Zoom link for virtual meetings
- Meeting preparation notes (what to bring, topics to discuss)
- Meeting history
- Request reschedule (sends notification to admin)

**Documents Page**:

- Organized by category (contracts, educational resources, birth plan, photos)
- Download/view in browser
- Upload documents (birth plan, questions for doula)
- Search functionality

**Payments Page**:

- Payment history with receipts
- Outstanding balance
- Payment plans
- Make payment via Stripe integration
- Download invoices

**Profile Page**:

- Update contact information
- Update birth preferences
- Communication preferences (email, SMS, frequency)
- Emergency contact info

### 3. Client Portal Security

**Row Level Security Policies**:

```sql
-- Clients can only see their own data
CREATE POLICY "Clients can view own services"
  ON client_services FOR SELECT
  USING (auth.uid() IN (
    SELECT auth_user_id FROM client_portal_access WHERE client_id = client_services.client_id
  ));

-- Similar policies for meetings, documents, payments
```

**Privacy Controls**:

- Admin controls which documents are client-visible
- Admin controls which activity notes are client-visible
- HIPAA-compliant data handling (encryption at rest, audit logs)

---

## Part C: Communication Features

### 1. In-App Messaging

**Goal**: Allow clients to message their doula directly in the portal

**Database**:

```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL,
  sender_id UUID REFERENCES users(id),
  sender_type TEXT, -- admin, client
  client_id UUID REFERENCES leads(id),
  content TEXT NOT NULL,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE message_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  subject TEXT,
  last_message_at TIMESTAMPTZ,
  unread_count_admin INTEGER DEFAULT 0,
  unread_count_client INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Features**:

- Real-time messaging (Supabase Realtime subscriptions)
- Email notifications for new messages
- Message read receipts
- Attach files to messages
- Archive conversations

### 2. Email Integration

**Goal**: Log all email communications in activity stream

**Strategy**:

- Use Resend webhooks to capture email opens/clicks
- Store email content in activities table
- Link emails to client records via email address matching

---

## Part D: Advanced Features (Phase 3.5 - Future)

### 1. Calendar Integration

- Sync meetings to Google Calendar / iCal
- Booking widget for client scheduling
- Availability management for admin

### 2. Payment Processing

- Stripe integration for online payments
- Payment plans / installments
- Automatic invoicing
- Payment reminders

### 3. E-Signatures

- DocuSign or HelloSign integration for contracts
- Track signature status in activity stream

### 4. SMS Notifications

- Twilio integration for appointment reminders
- Two-way SMS communication
- SMS opt-in management

### 5. Client Onboarding Automation

- Welcome email sequence
- Automated milestone emails (30 weeks pregnant, 2 weeks postpartum, etc.)
- Task checklists for clients (complete birth plan, schedule prenatal visit, etc.)

### 6. Referral Program

- Track referral sources
- Referral rewards/discounts
- Referral link generation for clients

---

## Implementation Phases

### Phase 3.1: Enhanced Admin CRM (2-3 weeks)

1. Database migration for extended client schema
2. Create services, meetings, documents, payments tables
3. Build enhanced client detail page with tabs
4. Implement unified activity stream
5. Build service management UI
6. Build meeting management UI
7. Build document upload/management UI
8. Build payment tracking UI

### Phase 3.2: Client Portal Foundation (2-3 weeks)

1. Set up client authentication (magic links)
2. Build client portal routes and layout
3. Create client dashboard
4. Implement RLS policies for client data access
5. Build client-facing services page
6. Build client-facing meetings page
7. Build client-facing documents page
8. Build client-facing payments page

### Phase 3.3: Communication & Payments (1-2 weeks)

1. In-app messaging system
2. Stripe payment integration
3. Email integration for activity logging
4. Notification system (email, SMS)

### Phase 3.4: Polish & Testing (1 week)

1. Comprehensive E2E testing
2. Mobile responsiveness
3. Performance optimization
4. Security audit
5. User acceptance testing

---

## Success Criteria

### Admin Portal

- ✅ Single client record contains ALL client information
- ✅ Activity stream shows complete client history
- ✅ Can manage services, meetings, documents, payments from one place
- ✅ Dashboard provides actionable insights
- ✅ Can track client journey from lead → client → alumni

### Client Portal

- ✅ Clients can login securely with magic link
- ✅ Clients see their services, meetings, documents, payments
- ✅ Clients can download resources and contracts
- ✅ Clients can communicate with doula in-app
- ✅ Payment process is smooth and secure
- ✅ Mobile-friendly for on-the-go access

### Business Impact

- ✅ Reduce admin time by 50% with centralized data
- ✅ Improve client satisfaction with self-service portal
- ✅ Increase payment collection rate
- ✅ Better client retention through engagement
- ✅ Data-driven decisions with reporting

---

## Technical Architecture Decisions

### 1. Client Authentication

**Decision**: Use Supabase Auth with separate client role

- Magic link authentication (no password to remember)
- Email verification required
- Session management via cookies
- RLS policies enforce data isolation

### 2. File Storage

**Decision**: Use Supabase Storage for documents

- Secure signed URLs for downloads
- Automatic virus scanning (if available)
- Organized by client_id/document_type
- CDN for fast delivery

### 3. Payment Processing

**Decision**: Stripe Checkout + Customer Portal

- Stripe handles PCI compliance
- Support for one-time and subscription payments
- Automatic invoice generation
- Webhook integration for payment status updates

### 4. Real-time Features

**Decision**: Supabase Realtime for messaging

- WebSocket connections for instant updates
- Presence for "typing" indicators
- Optimistic UI updates

### 5. Email

**Decision**: Continue with Resend, add webhook tracking

- Resend for transactional emails (existing)
- Webhook integration for delivery/open/click tracking
- Store email content in activities table

---

## Next Steps

1. Review this plan and provide feedback
2. Prioritize which features are must-have vs nice-to-have
3. Start with Phase 3.1: Enhanced Admin CRM
4. Build incrementally with testing at each step
5. Get user (your) feedback before building client portal

**Questions to Consider**:

- Do you want to start with admin enhancements or client portal first?
- Which payment features are most important (tracking only vs full processing)?
- Do you need e-signature integration for contracts?
- Should clients be able to book their own meetings or request scheduling?
- What documents/resources do you want to share with clients?
