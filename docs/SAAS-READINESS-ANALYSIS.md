# SaaS Readiness Analysis

_Last Updated: December 10, 2025_

## Executive Summary

The Nurture Nest Birth CRM has **60-70% of SaaS infrastructure complete**. The foundation (multi-tenancy, subscription tiers, RLS policies) is excellent. What's missing is primarily compliance tooling, operational features, and activating stubbed integrations.

**Estimated time to production-ready SaaS: 2-4 weeks**

---

## Current SaaS Infrastructure Status

### What EXISTS (Complete or Stubbed)

#### 1. Billing & Subscription Management

| Feature                         | Status      | Location                                                    |
| ------------------------------- | ----------- | ----------------------------------------------------------- |
| Stripe Integration              | 🟡 Stubbed  | `src/lib/stripe/client.ts`                                  |
| Subscription Plans (3 tiers)    | ✅ Complete | `supabase/migrations/20251215020000_subscription_plans.sql` |
| Feature Flags (22 capabilities) | ✅ Complete | `src/lib/features/flags.ts`                                 |
| Usage Metering                  | ✅ Complete | `usage_metrics` table                                       |
| Trial Periods (30-day)          | ✅ Complete | `organizations.trial_ends_at`                               |
| Stripe Webhooks                 | 🟡 Stubbed  | `src/app/api/webhooks/stripe/route.ts`                      |
| Billing UI                      | ✅ Complete | `/admin/setup/billing/`                                     |

**Subscription Tiers:**

- **Starter**: Free - 3 team members, 50 clients, 5 workflows
- **Professional**: $49/mo - 10 team members, 500 clients, 25 workflows
- **Enterprise**: $149/mo - Unlimited everything

#### 2. Multi-Tenancy

| Feature                  | Status      | Details                                                        |
| ------------------------ | ----------- | -------------------------------------------------------------- |
| Organizations Table      | ✅ Complete | Core tenant record with branding, settings                     |
| Org-Scoped Tables        | ✅ Complete | 40+ tables have `organization_id` FK                           |
| RLS Policies             | ✅ Complete | All tables filtered by org membership                          |
| Organization Memberships | ✅ Complete | User-org links with roles                                      |
| Org Isolation Functions  | ✅ Complete | `get_user_organization_id()`, `user_belongs_to_organization()` |

**Key Files:**

- `supabase/migrations/20251215000000_multi_tenancy_foundation.sql`
- `supabase/migrations/20251215010000_multi_tenancy_rls_policies.sql`

#### 3. User Management

| Feature            | Status      | Details                     |
| ------------------ | ----------- | --------------------------- |
| User Invitations   | ✅ Complete | Email invites with tracking |
| Team Member Limits | ✅ Complete | Per-plan enforcement        |
| RBAC (4 roles)     | ✅ Complete | owner/admin/member/viewer   |
| Custom Roles       | ✅ Complete | Permission matrix UI        |
| SSO/OAuth          | ❌ Missing  | No social login             |
| 2FA/MFA            | ❌ Missing  | No multi-factor auth        |

#### 4. Onboarding

| Feature               | Status      | Details                     |
| --------------------- | ----------- | --------------------------- |
| Signup Flow           | ✅ Complete | Basic auth signup           |
| Organization Creation | ✅ Complete | Auto-created on signup      |
| Setup Hub             | ✅ Complete | Category-based admin setup  |
| Onboarding Wizard     | ❌ Missing  | No guided step-by-step flow |
| Demo Data             | ❌ Missing  | No sample data for trials   |

#### 5. Admin/Super-Admin

| Feature               | Status      | Details                              |
| --------------------- | ----------- | ------------------------------------ |
| Admin Dashboard       | ✅ Complete | KPIs, charts, recent leads           |
| Setup Hub             | ✅ Complete | All admin configuration pages        |
| Org Settings          | ✅ Complete | Edit org, view usage, manage members |
| Super-Admin Dashboard | ❌ Missing  | No cross-tenant management           |
| Support Tools         | ❌ Missing  | No impersonation, ticket system      |

#### 6. Infrastructure

| Feature             | Status      | Details                           |
| ------------------- | ----------- | --------------------------------- |
| Environment Config  | ✅ Complete | `.env.example` with all vars      |
| Database Migrations | ✅ Complete | 34 migrations                     |
| Background Jobs     | 🟡 Partial  | API cron routes (not ideal)       |
| Rate Limiting       | ❌ Missing  | No API rate limits                |
| API Keys            | 🟡 Stubbed  | UI exists, implementation missing |
| Webhooks            | 🟡 Stubbed  | Structure ready, handlers stubbed |

#### 7. Compliance & Security

| Feature             | Status      | Details                       |
| ------------------- | ----------- | ----------------------------- |
| Org Isolation (RLS) | ✅ Complete | Cross-tenant prevention       |
| Soft Delete         | ✅ Complete | `deleted_at` fields           |
| Audit Logging       | ❌ Missing  | No activity log table         |
| GDPR Data Export    | ❌ Missing  | Button exists, non-functional |
| Account Deletion    | ❌ Missing  | Button exists, non-functional |
| Terms Tracking      | ❌ Missing  | No `terms_accepted_at` field  |

---

## What's MISSING for SaaS Launch

### CRITICAL (Must Have Before Launch)

| #   | Feature                       | Effort   | Priority | Why Critical                      |
| --- | ----------------------------- | -------- | -------- | --------------------------------- |
| 1   | **Activate Stripe Live**      | 2-3 days | P0       | Can't charge customers            |
| 2   | **Audit Logging**             | 3-4 days | P0       | Compliance, debugging, security   |
| 3   | **GDPR Data Export**          | 2-3 days | P0       | Legal requirement (EU)            |
| 4   | **Account Deletion**          | 2-3 days | P0       | Legal requirement, churn handling |
| 5   | **Terms of Service Tracking** | 1 day    | P0       | Legal liability protection        |
| 6   | **Rate Limiting**             | 2-3 days | P0       | Prevent abuse                     |

**Total Critical Path: ~2 weeks**

### IMPORTANT (Should Have for Launch)

| #   | Feature                    | Effort   | Priority | Why Important                      |
| --- | -------------------------- | -------- | -------- | ---------------------------------- |
| 7   | **Onboarding Wizard**      | 3-5 days | P1       | Reduces churn, improves activation |
| 8   | **Super-Admin Dashboard**  | 5-7 days | P1       | Manage tenants, support customers  |
| 9   | **SSO/OAuth (Google)**     | 2-3 days | P1       | Reduces signup friction            |
| 10  | **API Key Authentication** | 2-3 days | P1       | Enable integrations                |
| 11  | **Background Job Queue**   | 3-5 days | P1       | Replace cron routes                |

### NICE-TO-HAVE (Post-Launch)

| #   | Feature             | Effort   |
| --- | ------------------- | -------- |
| 12  | 2FA/MFA             | 3-4 days |
| 13  | Demo Data Seeding   | 2 days   |
| 14  | Admin Impersonation | 2-3 days |
| 15  | Churn Analytics     | 3-5 days |
| 16  | GraphQL API         | 5+ days  |

---

## Implementation Details

### 1. Activate Stripe Live (P0)

**Current State:** Stubbed with comments indicating where to uncomment

**Files to Modify:**

```
src/lib/stripe/client.ts          → Uncomment Stripe SDK imports
src/app/api/webhooks/stripe/      → Activate event handlers
.env                              → Add STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET
```

**Tasks:**

- [ ] Uncomment Stripe SDK code in client.ts
- [ ] Add production API keys to environment
- [ ] Test checkout session creation
- [ ] Test webhook signature verification
- [ ] Test subscription lifecycle (create, update, cancel)
- [ ] Test invoice payment flow

### 2. Audit Logging (P0)

**Current State:** No audit log table exists

**New Files:**

```
supabase/migrations/xxx_audit_logs.sql
src/lib/audit/logger.ts
src/app/actions/audit.ts
```

**Schema:**

```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  user_id UUID REFERENCES users(id),
  action TEXT NOT NULL,           -- 'create', 'update', 'delete', 'login', etc.
  entity_type TEXT NOT NULL,      -- 'lead', 'invoice', 'workflow', etc.
  entity_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 3. GDPR Data Export (P0)

**Current State:** Button exists at `/admin/setup/organization/` but non-functional

**Files to Modify:**

```
src/app/actions/organization.ts   → Add exportOrganizationData()
src/app/api/exports/[id]/route.ts → Download endpoint
```

**Tasks:**

- [ ] Create export function that gathers all org data
- [ ] Generate JSON/ZIP file with all tables
- [ ] Store in Supabase Storage temporarily
- [ ] Email download link to admin
- [ ] Auto-delete after 24 hours

### 4. Account Deletion (P0)

**Current State:** Button exists but non-functional

**Files to Modify:**

```
src/app/actions/organization.ts   → Add deleteOrganization()
supabase/migrations/xxx_cascade_delete.sql
```

**Tasks:**

- [ ] Create cascade delete function
- [ ] Require confirmation (type org name)
- [ ] Cancel active subscriptions first
- [ ] Soft delete with 30-day recovery window
- [ ] Hard delete after grace period

### 5. Terms of Service Tracking (P0)

**Current State:** No tracking

**Files to Modify:**

```
supabase/migrations/xxx_terms_acceptance.sql
src/app/(auth)/signup/page.tsx
src/middleware.ts
```

**Schema:**

```sql
ALTER TABLE users ADD COLUMN terms_accepted_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN terms_version TEXT;
```

### 6. Rate Limiting (P0)

**Current State:** No rate limiting

**New Files:**

```
src/lib/rate-limit/index.ts
src/middleware.ts (modify)
```

**Options:**

- Upstash Redis (serverless, recommended)
- Vercel KV
- In-memory (not recommended for production)

---

## Key Files Reference

### SaaS Core

```
src/lib/stripe/client.ts              → Stripe integration
src/lib/features/flags.ts             → Feature flag evaluation
src/lib/hooks/use-organization.tsx    → Org context
supabase/migrations/20251215*.sql     → Multi-tenancy migrations
```

### Admin UI

```
src/app/admin/setup/                  → Setup hub
src/app/admin/setup/billing/          → Billing & plans
src/app/admin/setup/organization/     → Org settings
```

### Authentication

```
src/middleware.ts                     → Session management
src/app/(auth)/                       → Auth pages
src/lib/supabase/                     → Supabase client
```

---

## Recommended Launch Sequence

### Week 1: Critical Compliance

1. Activate Stripe Live
2. Add Terms of Service tracking
3. Implement rate limiting

### Week 2: Data Protection

4. Build audit logging system
5. Implement GDPR data export
6. Implement account deletion

### Week 3: User Experience (Optional for MVP)

7. Onboarding wizard
8. Google OAuth

### Week 4: Operations (Optional for MVP)

9. Super-admin dashboard
10. API key authentication

---

## Success Metrics for SaaS Launch

| Metric                  | Target                        |
| ----------------------- | ----------------------------- |
| Stripe payments working | ✅ Live charges successful    |
| Audit logs capturing    | ✅ All CRUD operations logged |
| GDPR export functional  | ✅ Can download org data      |
| Account deletion works  | ✅ Full cascade delete        |
| Rate limiting active    | ✅ 429 responses on abuse     |
| Terms tracking          | ✅ All users have accepted    |

---

## Post-Launch Priorities

After SaaS infrastructure is complete, return to CRM feature gaps:

1. Calendar Integration (Google/Outlook)
2. Client Self-Scheduling
3. Payment Plans/Installments
4. PWA for Mobile

See [CRM-COMPETITIVE-ANALYSIS.md](./CRM-COMPETITIVE-ANALYSIS.md) for full feature roadmap.
