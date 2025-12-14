# SaaS Platform Plan - Multi-Tenant CRM Infrastructure

> **Created**: December 13, 2025
> **Status**: Phase 5A Complete - Progressive Web App
> **Goal**: Transform single-tenant CRM into multi-tenant SaaS platform
> **Relationship**: This plan covers PLATFORM infrastructure. See [MASTER_PLAN.md](MASTER_PLAN.md) for CRM PRODUCT features.

---

## Plan Scope

**This plan covers:**

- Multi-tenancy architecture and tenant isolation
- Platform admin (super-admin) tooling
- Tenant provisioning and onboarding
- SaaS billing (tenant subscriptions to YOU)
- Platform marketing site
- Deployment and update model

**NOT in this plan (see MASTER_PLAN.md):**

- CRM features (workflows, reports, client portal enhancements)
- Client-facing payments (invoices from doula to clients)
- Twilio SMS for client communication
- Calendar integration, scheduling
- AI features

---

## Quick Reference

| Concern      | This Plan (SAAS_PLAN)               | MASTER_PLAN                       |
| ------------ | ----------------------------------- | --------------------------------- |
| **Stripe**   | Tenant subscriptions -> You         | Client invoices -> Doula          |
| **Users**    | Platform admin, tenant provisioning | CRM users, team management        |
| **Phases**   | 0-5                                 | 14-16                             |
| **Priority** | Complete Phase 0 first              | Can run in parallel after Phase 0 |

---

## Current Status

### Completed Foundation (from MASTER_PLAN Phase C)

- Multi-tenancy schema (`organizations`, `organization_memberships`)
- RLS policies on 40+ tables with `organization_id`
- Subscription tiers and feature flags
- Stripe payment rails (stubbed)
- Usage metering functions

### Gaps to Address

| Gap                                      | Status      | Phase |
| ---------------------------------------- | ----------- | ----- |
| Architecture cleanup (separate concerns) | ✅ Complete | 0     |
| Platform config vs tenant config         | ✅ Complete | 0     |
| Super-admin dashboard                    | ✅ Complete | 0     |
| Tenant provisioning                      | ✅ Complete | 0     |
| Tenant impersonation                     | Not started | 0     |
| Self-service signup                      | ✅ Complete | 1     |
| Trial management                         | ✅ Complete | 1     |
| Live Stripe billing (subscriptions)      | ✅ Complete | 2     |
| SMS communication activation             | ✅ Complete | 3     |
| Platform metrics & MRR/ARR               | ✅ Complete | 4     |
| Tenant health monitoring                 | ✅ Complete | 4     |
| GDPR compliance (export/deletion)        | ✅ Complete | 4     |
| Platform audit logging                   | ✅ Complete | 4     |
| Progressive Web App (PWA)                | ✅ Complete | 5A    |
| Platform marketing site                  | Not started | 0     |

---

## Phased Roadmap

### Phase 0: Architecture Cleanup & Beta Prep

**Goal**: Clean separation of concerns + enable manual tenant provisioning
**Status**: Week 1-2 Complete, Week 3 Remaining (Marketing Site)

#### Week 1 Progress (✅ Complete)

| Task                        | File                                               | Status |
| --------------------------- | -------------------------------------------------- | ------ |
| Platform config             | `src/config/platform.ts`                           | ✅     |
| Tenant context              | `src/lib/platform/tenant-context.ts`               | ✅     |
| Super-admin utils           | `src/lib/platform/super-admin.ts`                  | ✅     |
| is_platform_admin migration | Via Supabase MCP                                   | ✅     |
| tenant_branding table       | Via Supabase MCP                                   | ✅     |
| Branding server actions     | `src/app/actions/tenant-branding.ts`               | ✅     |
| Branding settings UI        | `src/components/admin/setup/branding-settings.tsx` | ✅     |
| Admin layout org injection  | `src/app/admin/layout.tsx`                         | ✅     |

#### 0.0 Project Structure Clarification

**Current State:**
The project mixes three distinct concerns:

1. **Public Marketing Site** - Nurture Nest Birth business website (hardcoded in `siteConfig`)
2. **CRM Product** - The actual SaaS product tenants use (`/admin`, `/client`)
3. **Platform Infrastructure** - Multi-tenancy, billing, super-admin (partially implemented)

**Decision: Single Repo, Clear Boundaries**

```
src/
├── app/
│   ├── (platform-marketing)/  # NEW: SaaS CRM marketing site
│   ├── (nnb-marketing)/       # RENAME: NNB doula business site
│   ├── admin/                 # CRM Product (tenant users)
│   ├── client/                # Client Portal (tenant customers)
│   └── super-admin/           # NEW: Platform Infrastructure
│
├── config/
│   ├── site.ts                # -> DEPRECATED, migrate to DB
│   └── platform.ts            # NEW: Platform-level config
│
├── lib/
│   ├── platform/              # NEW: Platform utilities
│   │   ├── tenant-context.ts  # Server-side org resolution
│   │   └── super-admin.ts     # Platform admin checks
│   └── ...
│
└── components/
    ├── marketing/             # Keep but make data-driven
    ├── admin/                 # CRM components (no changes)
    ├── client/                # Portal components (no changes)
    └── platform/              # NEW: Super-admin components
```

#### 0.1 Move Business Config to Database

**Problem:** `siteConfig` is hardcoded for Nurture Nest Birth, blocking other tenants.

**Solution:** Create `tenant_branding` table:

```sql
CREATE TABLE tenant_branding (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  business_name TEXT NOT NULL,
  tagline TEXT,
  owner_name TEXT,
  email TEXT,
  phone TEXT,
  -- ... (full schema in migration)
  UNIQUE(organization_id)
);
```

**Files:**

- Migration: `supabase/migrations/202512XX_tenant_branding.sql`
- Actions: `src/app/actions/tenant-branding.ts`
- UI: Update `/admin/setup/organization/` page

#### 0.2 Server-Side Organization Context

**Problem:** Organization context is fetched client-side (race conditions).

**Solution:** Inject org context from server layout.

**Files:**

- `src/lib/platform/tenant-context.ts` - `getTenantFromRequest()`
- `src/app/admin/layout.tsx` - Server-side org injection

#### 0.3 Super-Admin Dashboard

**New files:**

- `src/app/super-admin/layout.tsx` - Protected layout
- `src/app/super-admin/tenants/page.tsx` - Tenant list
- `src/app/super-admin/tenants/new/page.tsx` - Create tenant
- `src/app/super-admin/tenants/[id]/page.tsx` - Tenant detail
- `src/app/actions/super-admin.ts` - Tenant CRUD

**Database:**

- Add `is_platform_admin BOOLEAN DEFAULT false` to users table

#### 0.4 Tenant Impersonation

**Mechanism:**

- Super-admin clicks "Impersonate" -> sets `impersonated_org_id` in session
- Visual banner shows impersonation mode
- "Exit impersonation" clears session

#### 0.5 Platform Marketing Site

**Pages:**

- `/` - Landing page, value proposition
- `/features` - CRM capabilities
- `/pricing` - Subscription tiers
- `/demo` - Request demo form

**Location:** `src/app/(platform-marketing)/`

---

### Phase 1: Self-Service Signup

**Goal**: Public signup flow for new tenants
**Status**: ✅ Complete

#### Phase 1 Progress

| Task                           | File                                      | Status |
| ------------------------------ | ----------------------------------------- | ------ |
| Public signup page             | `src/app/signup/page.tsx`                 | ✅     |
| Signup form component          | `src/components/auth/signup-form.tsx`     | ✅     |
| Signup server action           | `src/app/actions/signup.ts`               | ✅     |
| Trial utility functions        | `src/lib/trial/utils.ts`                  | ✅     |
| Trial banner component         | `src/components/billing/trial-banner.tsx` | ✅     |
| Middleware trial enforcement   | `src/lib/supabase/middleware.ts`          | ✅     |
| Admin layout trial integration | `src/app/admin/layout.tsx`                | ✅     |
| Billing page redirect handling | `src/app/admin/setup/billing/page.tsx`    | ✅     |
| Login page signup link         | `src/components/auth/login-form.tsx`      | ✅     |
| Feature flag enabled           | `src/config/platform.ts`                  | ✅     |
| E2E tests (63 tests)           | `tests/e2e/self-service-signup.spec.ts`   | ✅     |

#### 1.1 Public Signup Page

- `src/app/signup/page.tsx`
- `src/app/actions/signup.ts`

**Flow:**

1. User enters: email, password, business name
2. Create auth user (Supabase Auth) - auto-confirmed
3. Create organization with `subscription_status: 'trialing'`
4. Set `trial_ends_at` to 30 days from now
5. Create membership with role: 'owner'
6. Auto sign-in user
7. Redirect to /admin (onboarding checklist shows there)

#### 1.2 Trial Management

- **Trial banner component**: Shows days remaining, dismissible, urgent styling when ≤3 days
- **Middleware enforcement**:
  - Active trial: Full access
  - Grace period (3 days after expiration): Read-only access, write operations blocked with 403
  - Fully expired: Redirect all non-exempt routes to `/admin/setup/billing?expired=true`
- **Exempt routes**: Billing page, logout, auth APIs always accessible
- **Billing page**: Shows contextual alerts based on redirect reason (expired/grace/suspended)

#### 1.3 Team Invitation Enhancement

- Invitation emails include org name (existing functionality)
- Accept flow joins correct organization (existing functionality)

---

### Phase 2: Stripe Billing Integration

**Goal**: Collect payments from tenants (YOUR revenue)
**Status**: ✅ Complete

**Note:** This is DIFFERENT from MASTER_PLAN Phase 14 IA-1 which is about client invoice payments.

#### Phase 2 Progress

| Task                           | File                                                     | Status |
| ------------------------------ | -------------------------------------------------------- | ------ |
| Pricing configuration          | `src/config/pricing.ts`                                  | ✅     |
| Billing type definitions       | `src/types/billing.ts`                                   | ✅     |
| Stripe client (SDK v20)        | `src/lib/stripe/client.ts`                               | ✅     |
| Billing server actions         | `src/app/actions/billing.ts`                             | ✅     |
| Webhook handler                | `src/app/api/webhooks/stripe/route.ts`                   | ✅     |
| Billing action components      | `src/app/admin/setup/billing/billing-actions.tsx`        | ✅     |
| Billing page UI updates        | `src/app/admin/setup/billing/page.tsx`                   | ✅     |
| Database migration             | `supabase/migrations/20251226000000_stripe_price_id.sql` | ✅     |
| Environment variable template  | `.env.example`                                           | ✅     |
| E2E tests                      | `tests/e2e/stripe-billing.spec.ts`                       | ✅     |
| RLS policies for memberships   | `supabase/migrations/20251214003244_*.sql`               | ✅     |
| RLS policies for organizations | `supabase/migrations/20251214003310_*.sql`               | ✅     |

#### 2.6 Critical RLS Fix Applied

**Issue Discovered**: RLS was enabled on `organization_memberships` and `organizations` tables but **no policies existed**, causing authenticated users to be unable to read their own organization data. This resulted in redirect loops to `/onboarding`.

**Solution Applied**:

1. Added RLS policies for `organization_memberships` (SELECT/INSERT/UPDATE/DELETE)
2. Added RLS policies for `organizations` (SELECT/UPDATE)
3. Modified `getTenantContext()` in `tenant-context.ts` to use `createAdminClient()` (service role) for membership/org queries

**Why Admin Client is Safe Here**: After authenticating the user via `supabase.auth.getUser()`, we switch to the admin client only for membership/org queries. This bypasses RLS circular dependencies (policies referencing the table they protect) while still ensuring security since:

- User must be authenticated first
- Queries are scoped to `user_id = user.id`
- No untrusted input is used

**Pattern for Future Multi-Tenant Queries**:

```typescript
// 1. Authenticate with regular client
const supabase = await createClient()
const {
  data: { user },
} = await supabase.auth.getUser()
if (!user) {
  /* redirect to login */
}

// 2. Use admin client for trusted queries
const adminClient = createAdminClient()
const { data } = await adminClient
  .from('organization_memberships')
  .select('*, organization:organizations(*)')
  .eq('user_id', user.id) // Safe: using verified user.id
```

#### 2.1 Stripe Webhook Handler

- `src/app/api/webhooks/stripe/route.ts`

**Events Handled:**

- `checkout.session.completed` -> Activate subscription, set tier limits
- `customer.subscription.created` -> Initialize subscription data
- `customer.subscription.updated` -> Sync tier/status, handle plan changes
- `customer.subscription.deleted` -> Downgrade to starter tier
- `invoice.paid` -> Restore active status after recovery
- `invoice.payment_failed` -> Mark as past_due
- `invoice.payment_succeeded` -> Recovery tracking

#### 2.2 Subscription Management

- `src/app/admin/setup/billing/page.tsx` - Billing dashboard with usage meters
- `UpgradeButton` component - Creates Stripe checkout session
- `ManageSubscriptionButton` - Opens Stripe Customer Portal
- `PlanUpgradeButton` - Plan comparison upgrade/downgrade
- `StripeConfigStatus` - Shows setup status in dev mode

#### 2.3 Graceful Degradation

- App builds and runs without Stripe keys configured
- Mock data fallback for invoices and payment methods
- "Stripe Not Configured" dialog explains setup steps
- Designed for go-live: just add keys and price IDs

#### 2.4 Pricing Tiers

| Tier         | Monthly | Yearly | Team | Clients | Workflows | Storage |
| ------------ | ------- | ------ | ---- | ------- | --------- | ------- |
| Starter      | $29     | $290   | 1    | 50      | 5         | 1GB     |
| Professional | $79     | $790   | 5    | 250     | 25        | 10GB    |
| Enterprise   | $199    | $1,990 | ∞    | ∞       | ∞         | 100GB   |

#### 2.5 To Configure for Production

1. Create products in Stripe Dashboard (Starter, Professional, Enterprise)
2. Create monthly and yearly prices for each product
3. Copy price IDs to `src/config/pricing.ts`
4. Set environment variables:
   - `STRIPE_SECRET_KEY`
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - `STRIPE_WEBHOOK_SECRET`
5. Configure webhook endpoint: `https://your-domain.com/api/webhooks/stripe`
6. Apply database migration for `stripe_price_id` column

---

### Phase 3: Communication Activation

**Goal**: Enable SMS in workflows
**Status**: ✅ Complete

**Note:** Overlaps with MASTER_PLAN Phase 14 IA-2. Coordinate implementation.

#### Phase 3 Progress

| Task                            | File                                                   | Status |
| ------------------------------- | ------------------------------------------------------ | ------ |
| SMS usage/credentials migration | `supabase/migrations/20251227000000_sms_usage_*.sql`   | ✅     |
| Twilio client (hybrid creds)    | `src/lib/sms/twilio.ts`                                | ✅     |
| SMS client with tracking        | `src/lib/sms/client.ts`                                | ✅     |
| SMS utility functions           | `src/lib/sms/utils.ts`                                 | ✅     |
| SMS usage tracking service      | `src/lib/sms/tracking.ts`                              | ✅     |
| Twilio webhook handler          | `src/app/api/webhooks/twilio/route.ts`                 | ✅     |
| Workflow engine SMS integration | `src/lib/workflows/engine.ts`                          | ✅     |
| SMS settings page (BYOT)        | `src/app/admin/setup/sms-settings/page.tsx`            | ✅     |
| SMS settings server actions     | `src/app/actions/sms-settings.ts`                      | ✅     |
| Billing page SMS usage meter    | `src/app/admin/setup/billing/page.tsx`                 | ✅     |
| SMS templates migration         | `supabase/migrations/20251216000000_sms_templates.sql` | ✅     |
| E2E tests - SMS settings (32)   | `tests/e2e/admin-sms-settings.spec.ts`                 | ✅     |
| E2E tests - SMS billing (21)    | `tests/e2e/admin-sms-billing.spec.ts`                  | ✅     |
| E2E tests - SMS templates (25)  | `tests/e2e/admin-sms-templates.spec.ts`                | ✅     |

#### 3.1 Twilio Integration

**Hybrid Credential Support:**

- Platform mode: Use shared Twilio credentials (env vars)
- BYOT mode: Organizations can bring their own Twilio account
- Automatic fallback to platform if BYOT not configured
- Stub mode for development when no credentials available

**Files:**

- `src/lib/sms/twilio.ts` - Core Twilio client with credential resolution
- `src/lib/sms/client.ts` - High-level SMS API with opt-in/out checks
- `src/lib/sms/utils.ts` - Pure functions (segment calculation, phone formatting)

**Environment Variables:**

- `TWILIO_ACCOUNT_SID` - Platform Twilio account
- `TWILIO_AUTH_TOKEN` - Platform Twilio auth
- `TWILIO_PHONE_NUMBER` - Platform sending number (E.164)
- `TWILIO_STATUS_CALLBACK_URL` - Webhook URL for delivery status

#### 3.2 SMS Usage Tracking

**Database Tables:**

- `sms_credentials` - BYOT Twilio credentials per organization
- `sms_config` - SMS settings (provider mode, compliance options)
- `sms_usage` - Usage tracking per billing period

**Soft Limits with Overage:**

- Starter tier: SMS not available
- Professional tier: 500 segments/month included
- Enterprise tier: Unlimited
- Overage: $0.01 per segment (configurable)
- Warning at 80% usage, allow overage with notification

**Database Functions:**

- `get_or_create_sms_usage(p_organization_id)` - Get/create usage record
- `increment_sms_usage(p_organization_id, p_segments, p_delivered, p_failed)` - Atomic increment
- `check_sms_limit(p_organization_id)` - Check against tier limits
- `get_sms_config(p_organization_id)` - Get SMS configuration

#### 3.3 Webhook Handler

- Delivery status updates (queued, sent, delivered, failed)
- Opt-out keyword handling (STOP, UNSUBSCRIBE, etc.)
- Opt-in keyword handling (START, YES, etc.)
- Signature verification in production

#### 3.4 To Configure for Production

1. Create Twilio account at https://twilio.com
2. Get a phone number for SMS
3. Set environment variables (see above)
4. Configure webhook URL in Twilio Console:
   - Status Callback: `https://your-domain.com/api/webhooks/twilio`
   - Incoming Message: `https://your-domain.com/api/webhooks/twilio`
5. Apply database migration for SMS tables

---

### Phase 4: Platform Operations

**Goal**: Tooling for running multi-tenant SaaS
**Status**: ✅ Complete

#### Phase 4 Progress

| Task                              | File                                                  | Status |
| --------------------------------- | ----------------------------------------------------- | ------ |
| Platform metrics migration        | `supabase/migrations/20251228000000_platform_ops.sql` | ✅     |
| Platform metrics table            | `platform_metrics` (daily snapshots)                  | ✅     |
| Tenant health scores table        | `tenant_health_scores` (engagement/usage/payment)     | ✅     |
| Platform audit log table          | `platform_audit_log` (admin actions)                  | ✅     |
| Data export requests table        | `data_export_requests` (GDPR Article 20)              | ✅     |
| Account deletion queue table      | `account_deletion_queue` (GDPR Article 17)            | ✅     |
| MRR calculation function          | `calculate_platform_mrr()`                            | ✅     |
| Health score calculation function | `calculate_tenant_health()`                           | ✅     |
| Metrics snapshot function         | `snapshot_platform_metrics()`                         | ✅     |
| Platform metrics server actions   | `src/app/actions/platform-metrics.ts`                 | ✅     |
| GDPR server actions               | `src/app/actions/gdpr.ts`                             | ✅     |
| Enhanced dashboard                | `src/app/super-admin/page.tsx`                        | ✅     |
| Tenant health page                | `src/app/super-admin/health/page.tsx`                 | ✅     |
| GDPR management page              | `src/app/super-admin/gdpr/page.tsx`                   | ✅     |
| Audit log page                    | `src/app/super-admin/audit/page.tsx`                  | ✅     |
| Data export button component      | `src/components/admin/data-export-button.tsx`         | ✅     |
| E2E tests                         | `tests/e2e/platform-operations.spec.ts`               | ✅     |

#### 4.1 Super-Admin Dashboard Metrics

**Enhanced Dashboard (`/super-admin`):**

- Total tenants by status (active, trialing, suspended, cancelled)
- MRR / ARR calculations with growth percentage
- New signups this week/month graphs
- Tier distribution breakdown
- Churn risk alerts (high/critical tenants)
- Upsell opportunity cards with usage bars
- GDPR requests pending notification
- Quick actions to all admin pages

**Database:**

- `platform_metrics` table - Daily snapshots of platform KPIs
- `calculate_platform_mrr()` - Aggregates active subscriptions by tier
- `snapshot_platform_metrics()` - Creates daily metric snapshots

#### 4.2 Tenant Health Monitoring

**Health Dashboard (`/super-admin/health`):**

- Overall health score (0-100) per tenant
- Engagement score (login frequency, activity)
- Usage score (feature utilization)
- Payment score (on-time payments, no failures)
- Churn risk levels: low, medium, high, critical
- Upsell opportunity detection (>80% of any limit)
- Filter by risk level
- Refresh data button

**Database:**

- `tenant_health_scores` table - Calculated health metrics
- `calculate_tenant_health(org_id)` - Computes composite score
- `refresh_all_tenant_health_scores()` - Batch update function
- Trigger updates `organizations.last_login_at` on login

**Churn Indicators:**

- No login in 30+ days → high risk
- No login in 60+ days → critical risk
- Payment failures → increases risk
- Low usage score → medium risk

**Upsell Detection:**

- At 80%+ of team member limit
- At 80%+ of client limit
- At 80%+ of workflow limit
- At 80%+ of storage limit

#### 4.3 Data Export / GDPR

**GDPR Dashboard (`/super-admin/gdpr`):**

- Article 17 - Right to Erasure compliance
- Article 20 - Data Portability compliance
- 30-day grace period for account deletions
- Export request processing workflow
- Deletion approval/cancellation by platform admin
- Compliance information banner

**Database Tables:**

- `data_export_requests` - Tracks GDPR data export requests
- `account_deletion_queue` - Manages deletion requests with grace period
- `platform_audit_log` - Records all platform admin actions

**Export Flow:**

1. Organization owner requests export via settings page
2. Request appears in super-admin GDPR dashboard
3. Platform admin processes export (generates JSON/CSV)
4. Download link provided, expires after 7 days

**Deletion Flow:**

1. Organization owner requests deletion
2. 30-day grace period begins (scheduled deletion date set)
3. Platform admin can approve or cancel with reason
4. After grace period, background job deletes all org data
5. Audit log records deletion completion

#### 4.4 Audit Log

**Audit Dashboard (`/super-admin/audit`):**

- All platform admin actions logged
- Filter by date range (24h, 7d, 30d, 90d)
- Filter by action type
- Search by admin, tenant, or details
- Export functionality

**Logged Actions:**

- Tenant create/update/suspend/reactivate
- Data export requests and processing
- Account deletion approvals/cancellations
- Tier changes and billing actions
- Metrics refresh operations

---

### Phase 5: Mobile App

**Goal**: App Store presence
**Status**: Phase 5A Complete

**Note:** Overlaps with MASTER_PLAN Phase 16 MS-1/MS-2. Coordinate implementation.

#### Phase 5A Progress (✅ Complete)

| Task                     | File                                    | Status |
| ------------------------ | --------------------------------------- | ------ |
| Web app manifest         | `src/app/manifest.ts`                   | ✅     |
| Service worker           | `public/sw.js`                          | ✅     |
| Offline page             | `src/app/offline/page.tsx`              | ✅     |
| PWA icons (all sizes)    | `public/icons/`                         | ✅     |
| Icon generation script   | `scripts/generate-pwa-icons.ts`         | ✅     |
| PWA utilities            | `src/lib/pwa/`                          | ✅     |
| Install prompt component | `src/components/pwa/install-prompt.tsx` | ✅     |
| Update banner component  | `src/components/pwa/update-banner.tsx`  | ✅     |
| PWA provider             | `src/components/pwa/pwa-provider.tsx`   | ✅     |
| Root layout integration  | `src/app/layout.tsx`                    | ✅     |
| Next.js config headers   | `next.config.ts`                        | ✅     |
| E2E tests (24 tests)     | `tests/e2e/pwa.spec.ts`                 | ✅     |

**PWA Features Implemented:**

- **Web App Manifest**: Defines app metadata, icons, shortcuts, display mode
- **Service Worker**: Cache-first for static assets, network-first for dynamic content
- **Offline Support**: Graceful degradation with offline page
- **Install Prompt**: Cross-platform (iOS instructions, native prompt on Android/desktop)
- **Update Banner**: Notifies users when new version available
- **Push Notification Ready**: Service worker handles push events (backend integration pending)
- **Icon Sizes**: 72, 96, 128, 144, 152, 192, 384, 512px + Apple touch icons

**Caching Strategies:**

- Static assets (JS, CSS, fonts): Cache-first with version-based invalidation
- Dynamic content (pages, API): Network-first with offline fallback
- Images: Cache-first with long TTL
- Service worker itself: No-cache to ensure updates

**To Customize:**

1. Replace placeholder icons: Place 1024x1024 PNG at `public/icons/icon-source.png`
2. Run `npx ts-node scripts/generate-pwa-icons.ts` to generate all sizes
3. Add VAPID keys for push notifications when ready
4. Update manifest shortcuts for most-used features

#### 5B: Native App Wrapper (Optional)

- Separate repository
- Capacitor or Expo wrapper for App Store submission
- Push notification integration with native APIs
- Status: Not Started

---

## Implementation Schedule

### Phase 0 Week-by-Week

**Week 1: Architecture Cleanup (0.0 - 0.2)**

1. Create `src/config/platform.ts`
2. Create `src/lib/platform/tenant-context.ts`
3. Create `src/lib/platform/super-admin.ts`
4. Migration: Add `is_platform_admin` to users
5. Migration: Create `tenant_branding` table
6. Create `src/app/actions/tenant-branding.ts`
7. Update `/admin/setup/organization/` page
8. Update `src/app/admin/layout.tsx`

#### Week 2 Progress (✅ Complete)

| Task                       | File                                        | Status |
| -------------------------- | ------------------------------------------- | ------ |
| Super-admin layout         | `src/app/super-admin/layout.tsx`            | ✅     |
| Super-admin dashboard      | `src/app/super-admin/page.tsx`              | ✅     |
| Tenant list page           | `src/app/super-admin/tenants/page.tsx`      | ✅     |
| Create tenant page         | `src/app/super-admin/tenants/new/page.tsx`  | ✅     |
| Tenant detail page         | `src/app/super-admin/tenants/[id]/page.tsx` | ✅     |
| Super-admin server actions | `src/app/actions/super-admin.ts`            | ✅     |
| Settings placeholder       | `src/app/super-admin/settings/page.tsx`     | ✅     |
| Error boundary             | `src/app/super-admin/error.tsx`             | ✅     |
| Loading state              | `src/app/super-admin/loading.tsx`           | ✅     |
| Platform admin DB flag     | `users.is_platform_admin` set for owner     | ✅     |

**Features implemented:**

- Dashboard with tenant stats (total, active, trialing, suspended)
- Recent signups table (last 7 days)
- Tenant list with search, filter by status/tier, pagination
- Create tenant form (org + owner user + membership)
- Tenant detail view with usage statistics
- Suspend/reactivate tenant actions
- Change subscription tier

**Remaining for Phase 0 (optional):**

- Tenant impersonation (0.4)
- Platform marketing site (0.5)

#### Week 3: Platform Marketing & Restructure (0.5) - Optional

| Task                      | Status      |
| ------------------------- | ----------- |
| Rename `(marketing)/`     | Not started |
| Create platform marketing | Not started |
| Host-based routing        | Not started |
| Seed NNB tenant demo data | Not started |
| Tenant impersonation      | Not started |

---

## Key Decisions

### Confirmed

| Decision          | Choice                              | Rationale                     |
| ----------------- | ----------------------------------- | ----------------------------- |
| Super-admin model | `is_platform_admin` flag on users   | Simple, uses existing auth    |
| Tenant routing    | Subdomain (`{slug}.{platform}.app`) | Clean URLs, white-label ready |
| Trial duration    | 30 days, configurable per-tenant    | Flexible for promotions       |
| Beta billing      | 50% founding customer discount      | Rewards early adopters        |
| Data migration    | Fresh NNB tenant, wipe seed data    | Clean slate, no legacy quirks |

### Outstanding

| Decision             | Options                              | Notes                    |
| -------------------- | ------------------------------------ | ------------------------ |
| Platform name/domain | `birthcrm.app`, `doulacrm.com`, etc. | Blocks subdomain routing |

---

## Two Products in One Repo

```
+---------------------------------------------------------------------+
|  PRODUCT 1: SaaS CRM Platform                                       |
|  - Standalone CRM for birth professionals                           |
|  - Tenants subscribe and use /admin, /client portals                |
|  - URL: {platform}.app (e.g., birthcrm.app)                         |
+---------------------------------------------------------------------+

+---------------------------------------------------------------------+
|  PRODUCT 2: Nurture Nest Birth Website                              |
|  - Your wife's doula business marketing site                        |
|  - INTEGRATED with the CRM (tenant #1)                              |
|  - URL: nurturenestbirth.com                                        |
+---------------------------------------------------------------------+
```

**Nurture Nest Birth Strategy:**

- Fresh tenant with seeded demo data (not migrated)
- Your user: `is_platform_admin = true` AND NNB org owner
- Real-world testing environment

---

## Deployment Model

### Single Deployment, All Tenants

```
Vercel (Production)
├── {platform}.app          -> Platform marketing
├── app.{platform}.app      -> Super-admin
└── {slug}.{platform}.app   -> Tenant CRM

Supabase (Single Project)
└── All tenants in one DB, isolated by RLS
```

### Your Workflow

```
1. Develop feature locally
2. Test on NNB tenant
3. Push to main -> auto-deploy to all tenants
4. Monitor via super-admin dashboard
5. Rollback via Vercel if needed
```

---

## Critical Files

### Multi-Tenancy Core

- `supabase/migrations/20251215000000_multi_tenancy_foundation.sql`
- `supabase/migrations/20251215010000_multi_tenancy_rls_policies.sql`
- `supabase/migrations/20251215020000_subscription_plans.sql`
- `src/lib/hooks/use-organization.tsx`
- `src/lib/features/flags.ts`

### To Create (Phase 0)

- `src/config/platform.ts`
- `src/lib/platform/tenant-context.ts`
- `src/lib/platform/super-admin.ts`
- `src/app/super-admin/**`
- `src/app/(platform-marketing)/**`

---

## Coordination with MASTER_PLAN

| SAAS_PLAN Phase          | MASTER_PLAN Phase               | Overlap          | Resolution                              |
| ------------------------ | ------------------------------- | ---------------- | --------------------------------------- |
| Phase 0                  | -                               | None             | Do SAAS Phase 0 first                   |
| Phase 2 (tenant billing) | Phase 14 IA-1 (client payments) | Both use Stripe  | Different Stripe products, can parallel |
| Phase 3 (SMS)            | Phase 14 IA-2 (Twilio)          | Same integration | Implement once, serves both needs       |
| Phase 5 (mobile)         | Phase 16 (PWA/native)           | Same features    | Implement once, serves both needs       |

**Recommendation:** Complete SAAS Phase 0 first, then work on both plans in parallel.

---

---

## Troubleshooting Notes

### RLS Circular Dependency Pattern

When querying multi-tenant tables that have RLS policies referencing memberships, you may encounter issues with nested selects (e.g., `organization:organizations(*)`). The RLS policy evaluation creates a circular dependency.

**Symptoms**:

- User authenticated but queries return empty/null
- Redirects to `/onboarding` despite valid membership
- Works with service role key but fails with anon key

**Solution**: Use the admin client pattern documented in Section 2.6 above.

### E2E Test Authentication

E2E tests use Playwright's `storageState` to persist auth between tests. The auth state is created by `auth.setup.ts` and stored in `.auth/admin.json`.

**Test Credentials**: `chase.d.harmon@gmail.com` / `password123` (or set `TEST_ADMIN_PASSWORD` env var)

**If tests fail with auth issues**:

1. Delete `.auth/` directory
2. Ensure test user exists in Supabase Auth
3. Ensure user has active organization membership
4. Run tests with `--project=setup` first

---

_Last updated: December 13, 2025 (Phase 5A Complete - Progressive Web App)_
