# Nurture Nest Birth - Master Implementation Plan

> **Last Updated**: December 13, 2025
> **Current Status**: Phase 13 Complete - Launch Preparation Done
> **Authoritative Document**: This is the single source of truth for project planning

---

## Table of Contents

1. [Project Vision](#project-vision)
2. [Completed Phases](#completed-phases)
3. [Current Status](#current-status)
4. [Upcoming Phases](#upcoming-phases)
5. [Feature Roadmap](#feature-roadmap)
6. [Technical Debt & Polish](#technical-debt--polish)
7. [Planning Document Archive](#planning-document-archive)

---

## Project Vision

### Short-Term (Current)

A comprehensive doula practice CRM for Nurture Nest Birth (single-tenant deployment) with:

- Lead/client lifecycle management
- Client self-service portal
- Unified messaging system
- Workflow automation
- Invoicing and payments
- Team management

### Long-Term (SaaS)

A multi-tenant SaaS platform for birth professionals with:

- Per-organization isolation
- Subscription tiers with feature gating
- White-labeling capabilities
- Marketplace integrations

---

## Completed Phases

### Foundation Phases (Complete)

| Phase | Name                         | Description                                                  | Status      |
| ----- | ---------------------------- | ------------------------------------------------------------ | ----------- |
| 1-2   | Foundation & Lead Management | Database schema, admin dashboard, lead capture               | ✅ Complete |
| 3     | Enhanced CRM & Client Portal | Client services, magic link auth, portal pages               | ✅ Complete |
| 4     | Self-Service & Notifications | Email system, intake forms, invoices, contracts, file upload | ✅ Complete |
| 5     | Team Management              | Roles, assignments, time tracking, on-call                   | ✅ Complete |
| 6     | Production Hardening         | CI/CD, file organization, report/dashboard builders          | ✅ Complete |

### Refinement Phases (Complete)

| Phase | Name                    | Key Deliverables                                                                                                  | Status      |
| ----- | ----------------------- | ----------------------------------------------------------------------------------------------------------------- | ----------- |
| A     | Polish & Complete       | Real-time messaging hooks, Zod validation, welcome packets, intake form builder                                   | ✅ Complete |
| B     | Workflow Enhancement    | History page, entry criteria, re-entry rules, variable interpolation, decision nodes, analytics, template gallery | ✅ Complete |
| C     | SaaS Foundation         | Multi-tenancy schema, subscription tiers, usage metering, Stripe billing rails, org settings                      | ✅ Complete |
| D     | Communication Rails     | SMS infrastructure (Twilio stubbed), Stripe payment rails, checkout pages                                         | ✅ Complete |
| E     | Analytics & Attribution | UTM capture, referral partners, NPS surveys, workflow integration                                                 | ✅ Complete |

### CRM Enhancement Phases (Complete)

| Phase | Name                   | Key Deliverables                                                                                                        | Status      |
| ----- | ---------------------- | ----------------------------------------------------------------------------------------------------------------------- | ----------- |
| 7     | Admin UI Polish        | Loading skeletons, error boundaries, mobile nav, email templates, welcome packets, workflows, messaging                 | ✅ Complete |
| 8     | UX Polish & Onboarding | Setup wizard, empty states, keyboard shortcuts, help widget, client onboarding tour, journey timeline                   | ✅ Complete |
| 9     | Data Management        | CSV/Excel import wizard, export buttons, filter-aware exports, bulk actions, duplicate detection                        | ✅ Complete |
| 10    | Admin & Operations     | Audit log dashboard, API keys, Sentry integration, webhooks, rate limiting                                              | ✅ Complete |
| 11    | Admin Navigation       | Salesforce-style navigation, object tabs, tools/user menus, breadcrumbs, mobile nav, custom object routes               | ✅ Complete |
| 12    | Custom Objects & CRM   | Custom object wizard, object manager UI, enhanced list views, navigation manager, role visibility, user personalization | ✅ Complete |
| 13    | Launch Preparation     | Security audit, performance indexes, accessibility fixes, SEO sitemap, documentation                                    | ✅ Complete |

---

## Current Status

### What's Built (Feature Summary)

**CRM System**

- ✅ Lead/Contact/Account/Opportunity management
- ✅ Custom objects with 5-step creation wizard
- ✅ Enhanced list views with column customization, filtering, saved views
- ✅ Salesforce-style navigation with role-based visibility
- ✅ Field-level security and permissions
- ✅ Audit logging on all CRUD operations

**Client Portal**

- ✅ Magic link & password authentication
- ✅ Self-service dashboard with journey timeline
- ✅ Real-time messaging with floating chat widget
- ✅ Invoice viewing and payment
- ✅ Document access
- ✅ Intake form submission
- ✅ Onboarding tour for new clients

**Automation & Workflows**

- ✅ Visual drag-and-drop workflow builder
- ✅ 10+ step types (email, SMS, task, wait, decision, survey)
- ✅ Entry criteria and re-entry rules
- ✅ Variable interpolation ({{client.name}})
- ✅ Execution history and analytics
- ✅ Pre-built template gallery

**Communications**

- ✅ Unified messaging (admin & client)
- ✅ Email system with Resend (live)
- ✅ SMS templates (Twilio stubbed)
- ✅ Email templates with WYSIWYG editor

**Payments & Billing**

- ✅ Invoice generation with auto-numbering
- ✅ Stripe payment rails (stubbed)
- ✅ Checkout success/cancel pages
- ✅ Payment webhooks

**Admin Operations**

- ✅ Audit log dashboard with export
- ✅ API key management with rate limiting
- ✅ Webhook configuration with HMAC signatures
- ✅ Sentry error tracking

### E2E Test Coverage

- **~900+ tests** across 54 test files
- **~85% pass rate** on main suite
- **Key coverage**: CRM, messaging, workflows, client portal, admin setup

### Database

- **52 migrations** applied (including Phase 13 performance indexes)
- **40+ tables** with RLS policies
- **Multi-tenancy ready** (organization_id columns on all tables)

---

## Upcoming Phases

### Phase 13: Launch Preparation & Polish ✅ COMPLETE

**Goal**: Final hardening before production launch

| Task ID | Name                     | Description                                                 | Status      |
| ------- | ------------------------ | ----------------------------------------------------------- | ----------- |
| LP-1    | Security Audit           | Fixed API key schema, field validation, search sanitization | ✅ Complete |
| LP-2    | Performance Optimization | Created 20+ database indexes for FK and composite queries   | ✅ Complete |
| LP-3    | Accessibility Audit      | Added ARIA labels, aria-expanded, aria-controls             | ✅ Complete |
| LP-4    | SEO & Marketing          | Updated sitemap with 8 missing routes                       | ✅ Complete |
| LP-5    | E2E Test Coverage        | Tests exist for Phase 10 features                           | ✅ Complete |
| LP-6    | Documentation            | README, SECURITY_AUDIT.md, API docs                         | ✅ Complete |

**Key Deliverables:**

- [docs/SECURITY_AUDIT.md](SECURITY_AUDIT.md) - Comprehensive security report
- [supabase/migrations/20251225000000_performance_indexes.sql](../supabase/migrations/20251225000000_performance_indexes.sql) - Performance indexes

### Phase 14: Integration Activation

**Goal**: Activate stubbed integrations for production use

| Task ID | Name                 | Description                                | Priority |
| ------- | -------------------- | ------------------------------------------ | -------- |
| IA-1    | Stripe Live Payments | Connect live Stripe keys, test webhooks    | High     |
| IA-2    | Twilio SMS           | Connect Twilio credentials, test send path | High     |
| IA-3    | Calendar Sync        | Google Calendar OAuth, meeting sync        | Medium   |
| IA-4    | QuickBooks           | Invoice sync with accounting               | Low      |

### Phase 15: Advanced Features

**Goal**: Competitive differentiation features

| Task ID | Name                   | Description                           | Priority |
| ------- | ---------------------- | ------------------------------------- | -------- |
| AF-1    | Client Self-Scheduling | Public booking page with availability | High     |
| AF-2    | Payment Plans          | Stripe subscriptions for installments | High     |
| AF-3    | AI Lead Scoring        | Rule-based then ML scoring            | Medium   |
| AF-4    | AI Content Assistant   | Claude API for email drafts           | Medium   |
| AF-5    | Combined Proposals     | Proposal + Contract + Invoice in one  | Medium   |
| AF-6    | Duplicate Detection    | Fuzzy matching and merge UI           | Low      |

### Phase 16: Mobile & Scale

**Goal**: Mobile experience and scale preparation

| Task ID | Name              | Description                                     | Priority |
| ------- | ----------------- | ----------------------------------------------- | -------- |
| MS-1    | PWA               | Service worker, push notifications, installable | High     |
| MS-2    | Native Mobile App | React Native for iOS/Android                    | Low      |
| MS-3    | A/B Email Testing | Variant creation in workflows                   | Medium   |
| MS-4    | Video Calling     | Twilio Video or Daily.co integration            | Low      |

---

## Feature Roadmap

### Priority Matrix

| Feature                | Value | Effort | Priority Score | Target Phase |
| ---------------------- | ----- | ------ | -------------- | ------------ |
| Stripe Live Payments   | 10    | 3      | **3.33**       | 14           |
| SMS/Twilio Activation  | 8     | 3      | **2.67**       | 14           |
| Security Audit         | 9     | 4      | **2.25**       | 13           |
| Calendar Integration   | 9     | 4      | **2.25**       | 14           |
| Payment Plans          | 9     | 4      | **2.25**       | 15           |
| Client Self-Scheduling | 9     | 5      | **1.80**       | 15           |
| Duplicate Detection    | 6     | 4      | **1.50**       | 15           |
| Combined Proposals     | 7     | 5      | **1.40**       | 15           |
| PWA                    | 8     | 6      | **1.33**       | 16           |
| AI Lead Scoring        | 8     | 7      | **1.14**       | 15           |
| AI Content Assistant   | 7     | 6      | **1.17**       | 15           |
| Video Calling          | 6     | 6      | **1.00**       | 16           |

### Industry Gap Analysis

**We Have (Competitive Parity)**:

- Lead/client lifecycle management ✅
- Contract templates with e-signatures ✅
- Invoicing and payment tracking ✅
- Client portal with self-service ✅
- Workflow automation (visual builder) ✅
- Team management ✅
- Custom reports and dashboards ✅
- Unified messaging ✅

**Critical Gaps (Table Stakes)**:

- Calendar integration (ALL competitors have this)
- Client self-scheduling (HoneyBook/Dubsado standard)
- Payment plans/installments (service business essential)
- Live payment processing (revenue blocker)

**Differentiation Opportunities**:

- Birth-specific features (due date tracking, birth plan editor)
- AI-powered follow-up suggestions
- Community features (connect clients with each other)

---

## Technical Debt & Polish

### Known Issues

| Issue                   | Severity | Notes                           |
| ----------------------- | -------- | ------------------------------- |
| ~15 flaky E2E tests     | Low      | Pass on retry, timing-sensitive |
| ~8 failing mobile tests | Low      | Viewport timing issues          |
| ~140 skipped tests      | Medium   | Multi-tenancy migration blocker |
| React Compiler warnings | Low      | Minor build warnings            |

### Migration Blockers

To enable full test suite:

1. Apply `20251215000000_multi_tenancy_foundation.sql` (~52 SaaS tests)
2. Apply `20251217000000_lead_source_attribution.sql` (~2 lead tests)

### Site Configuration Pending

- [ ] Update established year in site.ts
- [ ] Update email address
- [ ] Update Calendly link
- [ ] Update Twitter/X handle
- [ ] Add logo URL to email config
- [ ] Replace sample resource PDFs

---

## Planning Document Archive

### Active References

| Document                | Location                   | Purpose                                 |
| ----------------------- | -------------------------- | --------------------------------------- |
| **MASTER_PLAN.md**      | `docs/MASTER_PLAN.md`      | This file - CRM product features        |
| **SAAS_PLAN.md**        | `docs/SAAS_PLAN.md`        | SaaS platform infrastructure roadmap    |
| **CLAUDE.md**           | Root                       | Development context and quick reference |
| **CRM-ARCHITECTURE.md** | `docs/CRM-ARCHITECTURE.md` | CRM feature technical documentation     |

> **Note**: MASTER_PLAN.md and SAAS_PLAN.md are complementary and can be worked on in parallel. MASTER_PLAN covers CRM product features (what tenants USE). SAAS_PLAN covers platform infrastructure (how YOU run the business). See [SAAS_PLAN.md](SAAS_PLAN.md) for details on multi-tenancy, billing, and super-admin features.

### Archived Plans (Superseded by MASTER_PLAN.md)

These files in `~/.claude/plans/` are historical and should not be used for current planning:

| File                            | Date   | Original Purpose                | Status     |
| ------------------------------- | ------ | ------------------------------- | ---------- |
| `inherited-riding-lecun.md`     | Dec 11 | CRM Object Model Transformation | Superseded |
| `golden-forging-honey.md`       | Dec 12 | CRM Phase 11 E2E Testing        | Superseded |
| `eager-tinkering-sunrise.md`    | Dec 13 | Navigation Management System    | Superseded |
| `flickering-tickling-harbor.md` | Dec 9  | 6-Week Refinement Plan          | Superseded |
| `enumerated-giggling-flask.md`  | Dec 7  | Project Assessment              | Superseded |
| `glistening-chasing-pumpkin.md` | Dec 9  | Messaging UI/UX Polish          | Superseded |
| `lazy-churning-blum.md`         | Dec 8  | Real-Time Messaging Enhancement | Superseded |
| `generic-greeting-hejlsberg.md` | Dec 8  | Admin & Portal Enhancements     | Superseded |
| `lazy-churning-blum.md`         | Dec 8  | CRM Feature Gap Analysis        | Superseded |

### Project Plans in Repo

| File                         | Location         | Status                 |
| ---------------------------- | ---------------- | ---------------------- |
| `phase-6-lead-conversion.md` | `.claude/plans/` | ✅ Complete            |
| `phase-7-data-migration.md`  | `.claude/plans/` | ✅ Complete            |
| `phase-9-data-management.md` | `.claude/plans/` | ✅ Complete            |
| `PHASE4_PLAN.md`             | `docs/archive/`  | ✅ Complete (archived) |
| `PHASE_3_3_PROGRESS.md`      | `docs/archive/`  | ✅ Complete (archived) |

---

## Maintenance Guidelines

### Keeping This Document Updated

1. **After completing a phase**: Mark as complete, add completion date
2. **After starting new work**: Add task to appropriate phase section
3. **After discovering issues**: Add to Technical Debt section
4. **After changing priorities**: Update Priority Matrix scores

### Session Start Checklist

1. Review current phase status in MASTER_PLAN.md
2. Check CLAUDE.md for any recent context
3. Verify E2E test status before making changes
4. Update todo list with planned work

### Session End Checklist

1. Update MASTER_PLAN.md with any progress
2. Update CLAUDE.md if architecture changed
3. Commit documentation changes
4. Note any blockers or issues discovered

---

_This document consolidates all previous planning documents into a single authoritative source. For implementation details, see CLAUDE.md and the specific feature documentation in the docs/ folder._
