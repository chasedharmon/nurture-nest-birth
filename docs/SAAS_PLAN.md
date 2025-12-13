# SaaS Platform Plan - Multi-Tenant CRM Infrastructure

> **Created**: December 13, 2025
> **Status**: Phase 0 - Architecture Cleanup
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
| Architecture cleanup (separate concerns) | Not started | 0     |
| Platform config vs tenant config         | Not started | 0     |
| Super-admin dashboard                    | Not started | 0     |
| Tenant provisioning                      | Not started | 0     |
| Self-service signup                      | Not started | 1     |
| Live Stripe billing (subscriptions)      | Stubbed     | 2     |
| Platform marketing site                  | Not started | 0     |

---

## Phased Roadmap

### Phase 0: Architecture Cleanup & Beta Prep

**Goal**: Clean separation of concerns + enable manual tenant provisioning
**Status**: Current Phase

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
**Status**: Not Started

#### 1.1 Public Signup Page

- `src/app/(public)/signup/page.tsx`
- `src/app/actions/signup.ts`

**Flow:**

1. User enters: email, password, business name
2. Create auth user (Supabase Auth)
3. Create organization with `subscription_status: 'trialing'`
4. Create membership with role: 'owner'
5. Redirect to onboarding wizard

#### 1.2 Trial Management

- Trial banner component
- Expiration checks in middleware
- Grace period (3 days read-only)
- Upgrade redirect after grace

#### 1.3 Team Invitation Enhancement

- Invitation emails include org name
- Accept flow joins correct organization

---

### Phase 2: Stripe Billing Integration

**Goal**: Collect payments from tenants (YOUR revenue)
**Status**: Not Started

**Note:** This is DIFFERENT from MASTER_PLAN Phase 14 IA-1 which is about client invoice payments.

#### 2.1 Stripe Webhook Handler

- `src/app/api/webhooks/stripe/route.ts`

**Events:**

- `checkout.session.completed` -> Activate subscription
- `customer.subscription.updated` -> Sync tier/status
- `customer.subscription.deleted` -> Mark cancelled
- `invoice.payment_failed` -> Trigger dunning

#### 2.2 Subscription Management

- `src/app/admin/billing/page.tsx` - Billing dashboard
- `src/app/admin/billing/upgrade/page.tsx` - Plan selection
- Stripe Customer Portal integration

#### 2.3 Usage Enforcement

- Enforce `max_team_members`, `max_clients`, `max_workflows`, `max_storage_mb`
- Block operations when at limit
- Upgrade prompts

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

**Week 2: Super-Admin & Provisioning (0.3 - 0.4)** 9. Create `/super-admin/layout.tsx` 10. Create `/super-admin/tenants/page.tsx` 11. Create `/super-admin/tenants/new/page.tsx` 12. Create `/super-admin/tenants/[id]/page.tsx` 13. Implement tenant impersonation 14. Create onboarding wizard

**Week 3: Platform Marketing & Restructure (0.5)** 15. Rename `(marketing)/` -> `(nnb-marketing)/` 16. Create `(platform-marketing)/` site 17. Update middleware for host-based routing 18. Seed fresh NNB tenant with demo data

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

_Last updated: December 13, 2025_
