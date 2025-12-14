# SaaS Platform Plan - Multi-Tenant CRM Infrastructure

> **Created**: December 13, 2025
> **Status**: Phase 2 Complete - Stripe Billing Integration
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
**Status**: Not Started

**Note:** Overlaps with MASTER_PLAN Phase 14 IA-2. Coordinate implementation.

#### 3.1 Twilio Integration

- `src/lib/sms/twilio.ts` - Implement actual send
- Store credentials per-org or platform-level

#### 3.2 SMS Usage Tracking

- Track SMS sent per billing period
- Cost attribution per tenant

---

### Phase 4: Platform Operations

**Goal**: Tooling for running multi-tenant SaaS
**Status**: Not Started

#### 4.1 Super-Admin Dashboard Metrics

- Total tenants by status
- MRR / ARR calculations
- New signups this week/month

#### 4.2 Tenant Health Monitoring

- Churn risk (no login in 30+ days)
- Upsell opportunities (>80% of limits)
- Error rates per tenant

#### 4.3 Data Export / GDPR

- Full org data export (JSON/CSV)
- Account deletion queue
- Audit log of data access

---

### Phase 5: Mobile App

**Goal**: App Store presence
**Status**: Not Started

**Note:** Overlaps with MASTER_PLAN Phase 16 MS-1/MS-2. Coordinate implementation.

#### 5A: Progressive Web App (PWA)

- `public/manifest.json`
- Service worker for offline/caching
- Push notifications

#### 5B: React Native / Expo App

- Separate repository
- Shared API backend
- iOS and Android apps

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

_Last updated: December 14, 2025 (Phase 2 E2E Tests Complete)_
