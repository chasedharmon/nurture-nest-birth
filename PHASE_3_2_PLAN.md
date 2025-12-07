# Phase 3.2 Plan: Client Self-Service Portal

## Overview

Phase 3.2 adds a client-facing portal where your doula clients can log in, view their services, upcoming meetings, documents, and manage their profile. This complements the admin CRM built in Phase 3.1.

## Core Philosophy

- **Client-friendly**: Simple, welcoming UI focused on their journey
- **Secure**: Separate authentication, client-only data access
- **Self-service**: Clients can view and manage their own information
- **Mobile-first**: Responsive design for expecting parents on-the-go

## Architecture

### Authentication Strategy

**Magic Link** (passwordless) authentication:

- Clients receive email with login link
- No password to remember (perfect for busy expecting parents)
- Secure token-based authentication
- Separate from admin auth

### Database Schema Changes

```sql
-- New table for client authentication tokens
CREATE TABLE client_auth_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add email_verified to leads table
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;

-- Index for token lookup
CREATE INDEX idx_client_auth_tokens_token ON client_auth_tokens(token);
CREATE INDEX idx_client_auth_tokens_client_id ON client_auth_tokens(client_id);
```

### RLS Policies for Client Access

```sql
-- Clients can read their own lead record
CREATE POLICY "Clients can view own record"
  ON leads FOR SELECT
  USING (id = (SELECT client_id FROM client_auth_tokens WHERE token = current_setting('request.jwt.claims', true)::json->>'token'));

-- Clients can read their own services
CREATE POLICY "Clients can view own services"
  ON client_services FOR SELECT
  USING (client_id IN (SELECT id FROM leads WHERE id = auth.uid()));

-- Similar policies for meetings, documents, payments, activities
```

## Implementation Steps

### Step 1: Database Migration

**File**: `supabase/migrations/20251207030000_client_portal_auth.sql`

- Create `client_auth_tokens` table
- Add `email_verified`, `last_login_at` to leads
- Create indexes
- Add RLS policies for client access

### Step 2: Client Authentication

**Magic Link Flow**:

1. Client visits `/client/login`
2. Enters email address
3. System sends magic link email
4. Client clicks link → redirected to `/client/verify?token=...`
5. Token validated → session created → redirect to `/client/dashboard`

**Files**:

- `src/app/client/login/page.tsx` - Login form
- `src/app/client/verify/page.tsx` - Token verification
- `src/app/actions/client-auth.ts` - Auth server actions
- `src/middleware.ts` - Update to handle client auth

**Server Actions**:

```typescript
// src/app/actions/client-auth.ts
export async function sendMagicLink(email: string)
export async function verifyMagicLink(token: string)
export async function getClientSession()
export async function signOutClient()
```

### Step 3: Client Dashboard

**Route**: `/client/dashboard`

**Features**:

- Welcome message with client name
- Upcoming due date countdown
- Next meeting card
- Quick stats (services, documents)
- Recent activity feed

**File**: `src/app/client/dashboard/page.tsx`

### Step 4: Client Portal Pages

#### Services Page (`/client/services`)

- List all client services
- Show package details
- Contract status
- Payment status
- Download contract (if signed)

#### Meetings Page (`/client/meetings`)

- Upcoming meetings
- Past meetings
- Meeting details (type, date, time, location)
- Add to calendar button

#### Documents Page (`/client/documents`)

- Only show documents where `is_client_visible = true`
- Grouped by type
- Download buttons
- Upload birth plan (future)

#### Payments Page (`/client/payments`)

- Payment history
- Outstanding balance
- Payment method options
- Make payment button (Stripe integration - Phase 3.3)

#### Profile Page (`/client/profile`)

- View/edit contact information
- Update address
- Update birth preferences
- Update medical information
- Update emergency contact

### Step 5: Email Templates

**Magic Link Email**:

```html
Subject: Your Nurture Nest Birth Portal Login Link Hi [Name], Click the link
below to access your Nurture Nest Birth client portal: [Login Link] This link
expires in 1 hour. If you didn't request this, please ignore this email. Best,
[Your Name] Nurture Nest Birth
```

**Welcome Email** (when client record created):

```html
Subject: Welcome to Nurture Nest Birth! Hi [Name], Welcome! I'm excited to
support you on your birth journey. Access your client portal anytime: [Portal
Link] In your portal, you can: - View your service package - See upcoming
meetings - Access resources and documents - Update your preferences Questions?
Just reply to this email. Best, [Your Name]
```

## File Structure

```
src/
├── app/
│   ├── client/
│   │   ├── layout.tsx              # Client portal layout
│   │   ├── login/
│   │   │   └── page.tsx            # Magic link login
│   │   ├── verify/
│   │   │   └── page.tsx            # Token verification
│   │   ├── dashboard/
│   │   │   └── page.tsx            # Client dashboard
│   │   ├── services/
│   │   │   └── page.tsx            # Services list
│   │   ├── meetings/
│   │   │   └── page.tsx            # Meetings list
│   │   ├── documents/
│   │   │   └── page.tsx            # Documents list
│   │   ├── payments/
│   │   │   └── page.tsx            # Payment history
│   │   └── profile/
│   │       └── page.tsx            # Profile management
│   └── actions/
│       ├── client-auth.ts          # Client authentication
│       └── client-profile.ts       # Profile updates
├── components/
│   ├── client/
│   │   ├── client-nav.tsx          # Client navigation
│   │   ├── dashboard-stats.tsx     # Dashboard statistics
│   │   ├── upcoming-meeting-card.tsx # Next meeting
│   │   ├── due-date-countdown.tsx  # Countdown to due date
│   │   ├── client-service-card.tsx # Service display
│   │   ├── client-meeting-card.tsx # Meeting display
│   │   ├── client-document-card.tsx # Document display
│   │   └── profile-edit-form.tsx   # Profile editing
│   └── email/
│       ├── magic-link-email.tsx    # Magic link template
│       └── welcome-email.tsx       # Welcome template
└── lib/
    └── email/
        └── send-magic-link.ts      # Email sending logic
```

## UI Design Principles

### Color Palette

- Warm, welcoming colors
- Soft pinks, purples, earth tones
- High contrast for accessibility

### Typography

- Large, readable fonts
- Clear hierarchy
- Mobile-friendly sizing

### Layout

- Clean, uncluttered
- Card-based design
- Ample whitespace
- Mobile-first responsive

### Navigation

- Simple top nav or sidebar
- Dashboard, Services, Meetings, Documents, Payments, Profile
- Logout button
- Back to home

## Security Considerations

### Authentication

- Magic links expire in 1 hour
- Tokens are single-use
- Secure random token generation
- HTTPS only

### Data Access

- RLS policies ensure clients only see their own data
- Documents must be marked `is_client_visible`
- No admin data exposed to clients
- Separate auth from admin portal

### Email Validation

- Verify email matches lead record
- Only send magic links to verified lead emails
- Rate limiting on magic link requests

## Technical Implementation Details

### Magic Link Token Generation

```typescript
import { randomBytes } from 'crypto'

function generateSecureToken(): string {
  return randomBytes(32).toString('hex')
}

async function createMagicLink(clientId: string): Promise<string> {
  const token = generateSecureToken()
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

  await supabase.from('client_auth_tokens').insert({
    client_id: clientId,
    token,
    expires_at: expiresAt,
  })

  return `${process.env.NEXT_PUBLIC_APP_URL}/client/verify?token=${token}`
}
```

### Client Session Management

```typescript
// Middleware to protect client routes
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (
    pathname.startsWith('/client') &&
    pathname !== '/client/login' &&
    pathname !== '/client/verify'
  ) {
    const token = request.cookies.get('client_token')?.value

    if (!token) {
      return NextResponse.redirect(new URL('/client/login', request.url))
    }

    // Verify token
    const isValid = await verifyClientToken(token)
    if (!isValid) {
      return NextResponse.redirect(new URL('/client/login', request.url))
    }
  }

  return NextResponse.next()
}
```

### Profile Update Flow

```typescript
export async function updateClientProfile(
  clientId: string,
  updates: Partial<Lead>
) {
  const supabase = await createClient()

  // Only allow specific fields to be updated by clients
  const allowedFields = [
    'phone',
    'address',
    'birth_preferences',
    'emergency_contact',
  ]

  const filteredUpdates = Object.keys(updates)
    .filter(key => allowedFields.includes(key))
    .reduce((obj, key) => {
      obj[key] = updates[key]
      return obj
    }, {})

  const { error } = await supabase
    .from('leads')
    .update(filteredUpdates)
    .eq('id', clientId)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/client/profile')
  return { success: true }
}
```

## Future Enhancements (Phase 3.3+)

- Stripe payment integration
- In-app messaging with doula
- Birth plan builder
- Resource library
- Appointment scheduling
- Push notifications
- Mobile app (React Native)

## Success Metrics

✅ Clients can log in via magic link
✅ Clients can view their services
✅ Clients can see upcoming meetings
✅ Clients can download documents
✅ Clients can update their profile
✅ Email delivery works reliably
✅ Mobile-responsive design
✅ Secure data access (RLS policies)

## Timeline

**Estimated**: 3-4 hours

1. Database migration (30 min)
2. Magic link auth (1 hour)
3. Dashboard + layout (45 min)
4. Services/Meetings/Documents pages (1 hour)
5. Profile editing (45 min)
6. Email templates (30 min)
7. Testing (30 min)

Ready to begin implementation?
