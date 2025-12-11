# SaaS Infrastructure Documentation

This document describes the SaaS infrastructure features implemented for Nurture Nest Birth to ensure legal compliance and operational readiness.

## Overview

Five key features were implemented:

| Feature                   | Purpose                                     | Status      |
| ------------------------- | ------------------------------------------- | ----------- |
| Terms of Service Tracking | Track user acceptance of ToS/Privacy Policy | ✅ Complete |
| GDPR Data Export          | Allow users to export their data            | ✅ Complete |
| Account Deletion          | 30-day grace period soft delete             | ✅ Complete |
| Audit Logging             | Track critical user actions                 | ✅ Complete |
| Rate Limiting             | Protect against abuse (Upstash Redis)       | ✅ Complete |

---

## 1. Terms of Service Tracking

### Database Schema

```sql
-- Added to users table
ALTER TABLE users
  ADD COLUMN terms_accepted_at TIMESTAMPTZ,
  ADD COLUMN terms_version TEXT DEFAULT '1.0',
  ADD COLUMN privacy_accepted_at TIMESTAMPTZ,
  ADD COLUMN privacy_version TEXT DEFAULT '1.0';
```

### Files

- `src/lib/config/terms.ts` - Version constants
- `src/app/actions/terms.ts` - Server actions for accepting/checking terms
- `src/app/accept-terms/page.tsx` - UI for accepting terms
- `src/lib/supabase/middleware.ts` - Redirect to accept-terms if needed

### Flow

1. User logs in
2. Middleware checks `terms_accepted_at` and `terms_version`
3. If not accepted or outdated version → redirect to `/accept-terms`
4. User checks both boxes and clicks "Continue"
5. `acceptTerms()` server action updates user record
6. User redirected to original destination

### Updating Terms Version

When terms change, update `CURRENT_TERMS_VERSION` in `src/lib/config/terms.ts`. Users will be prompted to re-accept on next login.

---

## 2. GDPR Data Export

### Files

- `src/app/actions/gdpr.ts` - `exportOrganizationData()` action
- `src/lib/export/formatters.ts` - JSON/CSV formatting utilities
- `src/app/api/cron/cleanup-exports/route.ts` - Delete expired exports

### Export Contents

Both JSON and CSV formats in a ZIP archive:

- Organization details
- All leads/clients with activities
- Invoices and payments
- Contracts and documents (metadata)
- Messages and conversations
- Team members

### Usage

Button in `/admin/setup/organization` triggers export. Download link sent via email (24-hour expiry).

---

## 3. Account Deletion

### Files

- `src/app/actions/gdpr.ts` - `requestAccountDeletion()` action
- `src/components/admin/delete-organization-modal.tsx` - Confirmation UI
- `src/app/api/cron/hard-delete-orgs/route.ts` - Permanent deletion after 30 days

### Flow

1. User clicks "Delete Organization" in settings
2. Modal requires typing organization name to confirm
3. Soft delete: sets `deleted_at` timestamp
4. All user sessions revoked
5. 30-day grace period (can cancel)
6. Cron job permanently deletes after 30 days

---

## 4. Audit Logging

### Database Schema

```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,           -- create, update, delete, login, etc.
  entity_type TEXT NOT NULL,      -- lead, invoice, user, etc.
  entity_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Files

- `src/lib/audit/logger.ts` - `logAudit()` utility function
- `src/app/api/cron/cleanup-audit-logs/route.ts` - Delete logs older than retention period

### Integrated Actions

Audit logging is integrated into:

- `src/app/actions/leads.ts` - Lead CRUD operations
- `src/app/actions/invoices.ts` - Invoice operations
- `src/app/actions/client-auth.ts` - Client login/logout

### Usage

```typescript
import { logAudit, getAuditContext } from '@/lib/audit/logger'

// In a server action:
const ctx = await getAuditContext()
if (ctx) {
  await logAudit({
    userId: ctx.userId,
    organizationId: ctx.organizationId,
    action: 'create',
    entityType: 'lead',
    entityId: newLead.id,
    newValues: { name, email, status },
  })
}
```

### Retention

Default: 90 days. Configurable per-organization in settings.

---

## 5. Rate Limiting

### Files

- `src/lib/rate-limit/index.ts` - Rate limit configuration and utilities
- `src/middleware.ts` - Rate limit middleware integration

### Configuration

```typescript
const RATE_LIMITS = {
  api: { requests: 60, window: '1 m' }, // Standard API
  auth: { requests: 5, window: '1 m' }, // Brute force protection
  webhooks: { requests: 100, window: '1 m' }, // Stripe webhooks
  cron: { requests: 10, window: '1 m' }, // Internal cron jobs
  forms: { requests: 10, window: '1 m' }, // Form submissions
}
```

### Setup

Requires Upstash Redis credentials:

```env
UPSTASH_REDIS_REST_URL=https://your-instance.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token
```

Create a free account at https://upstash.com

### Graceful Degradation

If Upstash credentials are not configured, rate limiting is disabled with a console warning. The app continues to function normally.

### Response Headers

When rate limiting is active:

- `X-RateLimit-Limit` - Maximum requests allowed
- `X-RateLimit-Remaining` - Requests remaining in window
- `X-RateLimit-Reset` - Unix timestamp when limit resets

When limit exceeded (429 response):

- `Retry-After` - Seconds until requests allowed again

---

## Cron Jobs

Three cron endpoints for automated maintenance:

| Endpoint                       | Purpose                              | Schedule |
| ------------------------------ | ------------------------------------ | -------- |
| `/api/cron/cleanup-audit-logs` | Delete old audit logs                | Daily    |
| `/api/cron/cleanup-exports`    | Delete expired exports               | Daily    |
| `/api/cron/hard-delete-orgs`   | Permanently delete soft-deleted orgs | Daily    |

### Authorization

Set `CRON_SECRET` environment variable. Requests must include:

```
Authorization: Bearer <CRON_SECRET>
```

In development without `CRON_SECRET`, requests are allowed (with warning).

### Vercel Cron Setup

Add to `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/cleanup-audit-logs",
      "schedule": "0 3 * * *"
    },
    {
      "path": "/api/cron/cleanup-exports",
      "schedule": "0 4 * * *"
    },
    {
      "path": "/api/cron/hard-delete-orgs",
      "schedule": "0 5 * * *"
    }
  ]
}
```

---

## Environment Variables

```env
# Required for rate limiting
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# Required for cron jobs in production
CRON_SECRET=

# Required for admin operations (service role bypasses RLS)
SUPABASE_SERVICE_ROLE_KEY=
```

---

## Testing

E2E tests in `tests/e2e/saas-infrastructure.spec.ts` cover:

- Rate limiting headers
- Terms acceptance flow
- Organization settings UI
- Cron endpoint authorization
- Security (unauthenticated access blocked)

Run tests:

```bash
pnpm test:e2e tests/e2e/saas-infrastructure.spec.ts
```

---

## Migration Files

Located in `supabase/migrations/`:

- `20251218100000_terms_acceptance.sql`
- `20251218110000_audit_logs.sql`

These are applied automatically via Supabase MCP or can be run manually.
