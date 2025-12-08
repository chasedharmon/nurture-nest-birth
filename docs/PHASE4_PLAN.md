# Phase 4 Implementation Plan

> Building the rails for a future SaaS doula CRM platform

## Strategic Context

This phase focuses on building infrastructure that:

1. Works for the current single-tenant deployment
2. Can be extended to multi-tenant SaaS later
3. Separates "integration points" from "core logic" (wire up Stripe/etc. later)

---

## Phase 4.1 — Client Self-Service

**Goal**: Let clients manage their own data, reducing admin burden.

### 4.1.1 Client Profile Editing

**Database Changes**: None needed (leads table already supports all fields)

**New Server Actions** (`src/app/actions/client-profile.ts`):

```typescript
;-updateClientProfile(clientId, data) - // Contact info, preferences
  updateBirthPreferences(clientId, data) -
  updateEmergencyContact(clientId, data)
```

**New Components**:

- `src/components/client/profile-form.tsx` — Editable profile form
- `src/components/client/birth-preferences-form.tsx`
- `src/components/client/emergency-contact-form.tsx`

**Page Updates**:

- `/client/profile` — Add edit mode toggle, save functionality

### 4.1.2 Client Intake Forms

**Database Changes** (`20251208_intake_forms.sql`):

```sql
-- Intake form templates (for future multi-tenant)
CREATE TABLE intake_form_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  form_schema JSONB NOT NULL, -- JSON schema for form fields
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Submitted intake forms
CREATE TABLE intake_form_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  template_id UUID REFERENCES intake_form_templates(id),
  form_data JSONB NOT NULL,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES users(id)
);
```

**New Server Actions** (`src/app/actions/intake-forms.ts`):

```typescript
;-getIntakeFormTemplate(templateId) -
  submitIntakeForm(clientId, templateId, formData) -
  getClientIntakeSubmissions(clientId) -
  reviewIntakeSubmission(submissionId, reviewerId)
```

**New Components**:

- `src/components/client/intake-form.tsx` — Dynamic form renderer
- `src/components/admin/intake-review.tsx` — Admin review view

**New Pages**:

- `/client/intake` — Client intake form submission
- `/admin/leads/[id]/intake` — View submitted intake forms

### 4.1.3 Improved Client Auth (Foundation)

**Database Changes** (`20251208_improved_auth.sql`):

```sql
-- Client sessions table (replaces cookie-only approach)
CREATE TABLE client_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  session_token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_active_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add password hash to leads (optional, for non-magic-link auth)
ALTER TABLE leads ADD COLUMN IF NOT EXISTS password_hash TEXT;
```

**Updated Server Actions** (`src/app/actions/client-auth.ts`):

```typescript
;-signInClient(email, password) - // Use bcrypt, store session in DB
  createMagicLink(email) - // Generate and email magic link
  verifyMagicLink(token) -
  getClientSession() - // Validate against DB
  signOutClient() - // Delete session from DB
  setClientPassword(clientId, password) // For password setup
```

**Security Notes**:

- Remove hardcoded password
- Add bcrypt for password hashing
- Store sessions in database (not just cookies)
- Add session invalidation on password change

---

## Phase 4.2 — Notifications & Communication

**Goal**: Automated email communications that keep clients informed.

### 4.2.1 Email Templates System

**New Directory Structure**:

```
src/lib/email/
├── templates/
│   ├── contact-form.tsx       # Existing
│   ├── magic-link.tsx         # New
│   ├── meeting-scheduled.tsx  # New
│   ├── meeting-reminder.tsx   # New
│   ├── document-shared.tsx    # New
│   ├── payment-received.tsx   # New
│   ├── payment-reminder.tsx   # New
│   └── welcome.tsx            # New
├── send.ts                    # Unified send function
└── types.ts                   # Email types
```

**Email Service** (`src/lib/email/send.ts`):

```typescript
interface EmailConfig {
  to: string
  subject: string
  template: React.ReactNode
  replyTo?: string
}

export async function sendEmail(
  config: EmailConfig
): Promise<{ success: boolean; messageId?: string }>
```

### 4.2.2 Notification Triggers

**Database Changes** (`20251208_notifications.sql`):

```sql
-- Notification log (for tracking what was sent)
CREATE TABLE notification_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  notification_type TEXT NOT NULL,
  channel TEXT NOT NULL, -- 'email', 'sms' (future)
  recipient TEXT NOT NULL,
  subject TEXT,
  status TEXT DEFAULT 'pending', -- pending, sent, failed, bounced
  sent_at TIMESTAMPTZ,
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notification preferences (for future client control)
CREATE TABLE notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  meeting_reminders BOOLEAN DEFAULT true,
  document_notifications BOOLEAN DEFAULT true,
  payment_reminders BOOLEAN DEFAULT true,
  marketing_emails BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(client_id)
);
```

**New Server Actions** (`src/app/actions/notifications.ts`):

```typescript
;-sendMagicLinkEmail(email) -
  sendMeetingScheduledEmail(meetingId) -
  sendMeetingReminderEmail(meetingId) -
  sendDocumentSharedEmail(documentId, clientId) -
  sendPaymentReceivedEmail(paymentId) -
  sendPaymentReminderEmail(clientId, serviceId) -
  sendWelcomeEmail(clientId) -
  getNotificationLog(clientId) -
  updateNotificationPreferences(clientId, preferences)
```

### 4.2.3 Meeting Reminders (Automated)

**Implementation Options** (choose based on deployment):

1. **Vercel Cron Jobs** (recommended for Vercel deployment):
   - `vercel.json` cron configuration
   - API route `/api/cron/meeting-reminders`

2. **Supabase Edge Functions** (if using Supabase for everything):
   - Scheduled function to check upcoming meetings

**Reminder Logic**:

- 24 hours before: Send reminder email
- 1 hour before: Send final reminder (optional)
- Track in `notification_log` to prevent duplicates

---

## Phase 4.3 — Payments & Contracts

**Goal**: Build payment/invoice infrastructure without Stripe integration (yet).

### 4.3.1 Invoice System

**Database Changes** (`20251208_invoices.sql`):

```sql
-- Invoices table
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  service_id UUID REFERENCES client_services(id) ON DELETE SET NULL,
  invoice_number TEXT UNIQUE NOT NULL, -- e.g., "INV-2024-001"
  status TEXT DEFAULT 'draft', -- draft, sent, paid, overdue, cancelled
  subtotal DECIMAL(10,2) NOT NULL,
  tax_rate DECIMAL(5,4) DEFAULT 0,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,
  due_date DATE,
  paid_at TIMESTAMPTZ,
  notes TEXT,
  line_items JSONB NOT NULL DEFAULT '[]',
  -- Payment integration fields (for future Stripe)
  stripe_invoice_id TEXT,
  stripe_payment_intent_id TEXT,
  payment_link TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Invoice sequence for generating invoice numbers
CREATE SEQUENCE IF NOT EXISTS invoice_number_seq START 1;
```

**New Server Actions** (`src/app/actions/invoices.ts`):

```typescript
;-createInvoice(clientId, serviceId, lineItems) -
  getInvoice(invoiceId) -
  getClientInvoices(clientId) -
  updateInvoice(invoiceId, data) -
  sendInvoice(invoiceId) - // Mark as sent, email client
  markInvoicePaid(invoiceId, paymentId) -
  generateInvoiceNumber() // INV-YYYY-NNN format
```

**New Components**:

- `src/components/admin/invoice-form.tsx`
- `src/components/admin/invoice-preview.tsx`
- `src/components/client/invoice-view.tsx`

**New Pages**:

- `/admin/leads/[id]/invoices` — Manage client invoices
- `/client/invoices` — View invoices
- `/client/invoices/[id]` — Invoice detail with future payment button

### 4.3.2 Payment Processing Rails

**New Server Actions** (`src/app/actions/payment-processing.ts`):

```typescript
// These are stubs that will be wired to Stripe later
interface PaymentProvider {
  createPaymentIntent(
    amount: number,
    metadata: object
  ): Promise<{ clientSecret: string }>
  createPaymentLink(invoiceId: string): Promise<{ url: string }>
  handleWebhook(payload: string, signature: string): Promise<void>
}

// Current implementation: manual recording
;-recordManualPayment(invoiceId, method, amount) -
  // Future implementation: Stripe
  createStripePaymentIntent(invoiceId) -
  createStripePaymentLink(invoiceId) -
  handleStripeWebhook(payload, signature)
```

**API Routes for Future Webhooks**:

- `/api/webhooks/stripe` — Placeholder for Stripe webhooks

### 4.3.3 Contract E-Signatures (Simple)

**Database Changes** (add to invoices migration):

```sql
-- E-signature tracking
ALTER TABLE client_services
  ADD COLUMN IF NOT EXISTS contract_signed_ip INET,
  ADD COLUMN IF NOT EXISTS contract_signed_user_agent TEXT,
  ADD COLUMN IF NOT EXISTS contract_signature_data JSONB; -- For future real e-sign

-- Contract templates
CREATE TABLE contract_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  content TEXT NOT NULL, -- Markdown/HTML content
  service_type TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**New Components**:

- `src/components/client/contract-viewer.tsx` — Display contract
- `src/components/client/signature-checkbox.tsx` — "I agree" with timestamp

**New Server Actions**:

```typescript
;-getContractTemplate(serviceType) -
  signContract(serviceId, clientId, ipAddress, userAgent) -
  getContractSignatureDetails(serviceId)
```

---

## Phase 4.4 — File Management

**Goal**: Real file upload/download with Supabase Storage.

### 4.4.1 Supabase Storage Setup

**Storage Buckets**:

```
client-documents/
├── {client_id}/
│   ├── contracts/
│   ├── birth-plans/
│   ├── photos/
│   └── other/
```

**RLS Policies**:

- Admin: Full access to all buckets
- Clients: Read-only access to their own `client_id` folder

### 4.4.2 Upload Infrastructure

**New Server Actions** (`src/app/actions/file-upload.ts`):

```typescript
;-getUploadUrl(clientId, documentType, fileName) - // Signed URL for direct upload
  confirmUpload(clientId, documentType, fileName, fileSize) -
  deleteFile(documentId) -
  getDownloadUrl(documentId) // Signed download URL
```

**New Components**:

- `src/components/ui/file-upload.tsx` — Drag-and-drop upload
- `src/components/ui/file-preview.tsx` — Preview uploaded files

**Updates**:

- `/admin/leads/[id]` Documents tab: Add upload UI
- `/client/documents`: Add upload UI (for birth plans, etc.)

### 4.4.3 Client Document Uploads

**Allowed Upload Types by Client**:

- Birth plan (PDF, DOC)
- Insurance card (image)
- Hospital pre-registration (PDF)
- Photos (for postpartum clients)

---

## Implementation Order

### Week 1: Foundation

1. **4.1.3** Improved client auth (security first)
2. **4.2.1** Email templates system

### Week 2: Client Self-Service

3. **4.1.1** Client profile editing
4. **4.2.2** Basic notifications (magic link, welcome email)

### Week 3: Intake & Communication

5. **4.1.2** Client intake forms
6. **4.2.3** Meeting reminders

### Week 4: Payments & Files

7. **4.3.1** Invoice system
8. **4.3.3** Simple e-signatures
9. **4.4** File upload infrastructure

### Deferred (Wire Up Later)

- Stripe payment processing
- SMS notifications
- Calendar sync (Google/Outlook)
- DocuSign/HelloSign integration

---

## Architecture Decisions for Future SaaS

### Multi-Tenancy Preparation

1. **Tenant ID Column** (add later, not now):
   - All tables will need `tenant_id` for multi-tenant
   - For now, single-tenant is fine
   - Migration path: Add column with default value, backfill

2. **Configuration Isolation**:
   - `siteConfig` becomes database-driven per tenant
   - Email templates become tenant-customizable
   - Contract templates per tenant

3. **Storage Isolation**:
   - Bucket structure: `{tenant_id}/{client_id}/...`
   - RLS policies include tenant check

4. **Branding**:
   - Logo, colors, business name per tenant
   - Custom domain support (later)

### Integration Points (Documented)

```typescript
// src/lib/integrations/types.ts

interface PaymentProvider {
  name: string
  createPaymentIntent(amount: number): Promise<PaymentIntent>
  createPaymentLink(invoiceId: string): Promise<string>
  handleWebhook(payload: unknown): Promise<void>
}

interface CalendarProvider {
  name: string
  createEvent(meeting: Meeting): Promise<string>
  updateEvent(eventId: string, meeting: Meeting): Promise<void>
  deleteEvent(eventId: string): Promise<void>
}

interface StorageProvider {
  name: string
  getUploadUrl(path: string): Promise<string>
  getDownloadUrl(path: string): Promise<string>
  deleteFile(path: string): Promise<void>
}

interface EmailProvider {
  name: string
  send(config: EmailConfig): Promise<{ messageId: string }>
}
```

---

## Database Migration Summary

New tables to create:

1. `intake_form_templates`
2. `intake_form_submissions`
3. `client_sessions`
4. `notification_log`
5. `notification_preferences`
6. `invoices`
7. `contract_templates`

Existing tables to modify:

1. `leads` — Add `password_hash`
2. `client_services` — Add signature tracking columns

---

## File Structure After Phase 4

```
src/
├── app/
│   ├── actions/
│   │   ├── client-auth.ts      # Updated
│   │   ├── client-profile.ts   # New
│   │   ├── intake-forms.ts     # New
│   │   ├── notifications.ts    # New
│   │   ├── invoices.ts         # New
│   │   ├── file-upload.ts      # New
│   │   └── contracts.ts        # New
│   ├── api/
│   │   ├── cron/
│   │   │   └── meeting-reminders/route.ts  # New
│   │   └── webhooks/
│   │       └── stripe/route.ts             # Placeholder
│   ├── client/
│   │   ├── intake/page.tsx     # New
│   │   ├── invoices/
│   │   │   ├── page.tsx        # New
│   │   │   └── [id]/page.tsx   # New
│   │   └── profile/page.tsx    # Updated
│   └── admin/
│       └── leads/[id]/
│           └── invoices/page.tsx  # New
├── components/
│   ├── client/
│   │   ├── profile-form.tsx           # New
│   │   ├── intake-form.tsx            # New
│   │   ├── contract-viewer.tsx        # New
│   │   └── invoice-view.tsx           # New
│   ├── admin/
│   │   ├── invoice-form.tsx           # New
│   │   └── intake-review.tsx          # New
│   └── ui/
│       └── file-upload.tsx            # New
└── lib/
    ├── email/
    │   ├── templates/
    │   │   ├── magic-link.tsx         # New
    │   │   ├── meeting-scheduled.tsx  # New
    │   │   ├── meeting-reminder.tsx   # New
    │   │   ├── document-shared.tsx    # New
    │   │   ├── payment-received.tsx   # New
    │   │   └── welcome.tsx            # New
    │   ├── send.ts                    # New
    │   └── types.ts                   # New
    └── integrations/
        └── types.ts                   # New (interface definitions)
```

---

## Success Metrics

After Phase 4, we should have:

- [x] Clients can update their own profile information
- [x] Clients can submit intake forms
- [x] Magic link emails work (via Resend)
- [x] Meeting reminder emails send automatically
- [x] Admin can create and send invoices
- [x] Clients can view their invoices
- [x] Simple e-signature on contracts (checkbox + timestamp)
- [x] File upload works via Supabase Storage
- [x] All notification sends are logged
- [x] Session management is database-backed

---

## Questions Resolved

1. **Cron Jobs**: Using Vercel Cron for meeting reminders (`/api/cron/meeting-reminders`)
2. **Invoice Numbering**: Using `INV-YYYY-NNNN` format with PostgreSQL sequence
3. **Intake Form Builder**: Using JSON schema builder with default template stored in database
4. **File Size Limits**: 10MB maximum file size for uploads

---

## Phase 4 Completion Summary

**Completed: December 2024**

All sub-phases implemented:

- **4.1** Client Self-Service: Profile editing, intake forms, database-backed sessions
- **4.2** Notifications: Email templates (Resend), meeting reminders cron, notification logging
- **4.3** Payments & Contracts: Invoice system, manual payment recording, e-signatures
- **4.4** File Management: Supabase Storage integration, file uploads for admin and clients

### Key Files Created:

- `src/app/actions/client-profile.ts` - Client profile management
- `src/app/actions/intake-forms.ts` - Intake form submissions
- `src/app/actions/notifications.ts` - Email notifications
- `src/app/actions/invoices.ts` - Invoice management
- `src/app/actions/contracts.ts` - Contract e-signatures
- `src/app/actions/file-upload.ts` - File upload to Supabase Storage
- `src/app/api/cron/meeting-reminders/route.ts` - Automated reminders
- `src/lib/email/templates/*.tsx` - Email templates
- `src/components/ui/file-upload.tsx` - Drag-and-drop upload component

### Database Migrations Applied:

- `20251208000000_phase4_foundation.sql` - Core tables for Phase 4
- `004_storage_policies.sql` - Supabase Storage RLS
- `005_add_file_columns.sql` - Document metadata columns
- `006_fix_users_rls.sql` - Fixed RLS recursion issues
