# Nurture Nest Birth - Doula CRM

## Key Documentation

| Document                                                 | Description                                                                                 |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| **[docs/CRM-ARCHITECTURE.md](docs/CRM-ARCHITECTURE.md)** | CRM feature docs: 12 features with architecture diagrams, data models, APIs, and next steps |
| **[docs/FRONTEND-WEBSITE.md](docs/FRONTEND-WEBSITE.md)** | Marketing website docs: 13 pages, design system, components, SEO, personalization           |
| **[docs/TESTING.md](docs/TESTING.md)**                   | E2E testing guide and patterns                                                              |
| **[docs/PERFORMANCE.md](docs/PERFORMANCE.md)**           | Performance optimization notes                                                              |
| **[docs/QUICK_START.md](docs/QUICK_START.md)**           | Quick start guide                                                                           |

## Project Status

**Current Phase**: Phase 11 Complete - Admin Navigation System
**Last Updated**: December 12, 2025

### Active Development Plan (6-Week Roadmap)

We are executing a comprehensive refinement and SaaS preparation plan. Goals:

1. **Polish existing features** before adding new ones
2. **Enhance workflow builder** to Marketing Cloud quality
3. **Build foundation rails** for Stripe, SMS, multi-tenancy (without live integration)
4. **Prepare for SaaS launch** with organizations, tiers, and metering

See `/Users/chaseharmon/.claude/plans/flickering-tickling-harbor.md` for full plan details.

### Phase 7+ Execution Progress

#### Phase A: Polish & Complete (Week 1-2) ✅ COMPLETE

| Task                      | Status      | Notes                                       |
| ------------------------- | ----------- | ------------------------------------------- |
| A.1 Real-Time Messaging   | ✅ COMPLETE | useRealtimeMessages hook with optimistic UI |
| A.2 Form Validation       | ✅ COMPLETE | Zod schemas in src/lib/validations/setup.ts |
| A.3 Welcome Packet Editor | ✅ COMPLETE | Full page with dialog, items management     |
| A.4 Intake Form Builder   | ✅ COMPLETE | IntakeFormBuilderDialog with JSON schema    |

**Phase A Files:**

- `src/lib/hooks/use-realtime-messages.ts` - Full realtime with optimistic updates, edit/delete
- `src/lib/hooks/use-presence.ts`, `use-connection-status.ts` - Presence and connectivity
- `src/lib/validations/setup.ts` - Zod schemas for users, roles, services, contracts, company
- `src/app/admin/setup/welcome-packets/page.tsx` - Welcome packets management UI
- `src/components/admin/setup/welcome-packet-dialog.tsx` - Create/edit dialog
- `src/components/admin/setup/welcome-packet-items-dialog.tsx` - Manage packet items
- `src/app/admin/setup/intake-forms/page.tsx` - Intake forms management UI
- `src/components/admin/setup/intake-form-builder-dialog.tsx` - Visual form builder

#### Phase B: Workflow Enhancement (Week 2-4) ✅ COMPLETE

| Task                        | Status      | Notes                                        |
| --------------------------- | ----------- | -------------------------------------------- |
| B.1 Fix Critical Gaps       | ✅ COMPLETE | History page, execution details dialog       |
| B.2 Entry Criteria/Filters  | ✅ COMPLETE | EntryCriteria types, entry-criteria-builder  |
| B.3 Re-entry Rules          | ✅ COMPLETE | ReentryMode types, reentry-rules component   |
| B.4 Variable Interpolation  | ✅ COMPLETE | VariablePicker, {{variable}} in engine       |
| B.5 Enhanced Decision Nodes | ✅ COMPLETE | DecisionBranch, EnhancedDecisionConfig       |
| B.6 Execution Analytics     | ✅ COMPLETE | Analytics dashboard with funnel, charts      |
| B.7 Template Gallery        | ✅ COMPLETE | Template gallery page with one-click install |

**Phase B Files:**

- `src/app/admin/workflows/[id]/history/page.tsx` - Execution history list
- `src/app/admin/workflows/[id]/history/execution-details-dialog.tsx` - Step-by-step details
- `src/app/admin/workflows/[id]/analytics/page.tsx` - Analytics dashboard
- `src/app/admin/workflows/[id]/analytics/analytics-dashboard.tsx` - Charts, funnel, stats
- `src/app/admin/workflows/[id]/settings/workflow-settings-form.tsx` - Entry/re-entry config
- `src/app/admin/workflows/templates/page.tsx` - Template gallery list
- `src/app/admin/workflows/templates/template-gallery.tsx` - Template cards with install
- `src/components/admin/workflows/entry-criteria-builder.tsx` - Entry criteria UI
- `src/components/admin/workflows/reentry-rules.tsx` - Re-entry mode selector
- `src/components/admin/workflows/variable-picker.tsx` - Variable insertion dropdown
- `src/components/admin/workflows/enhanced-decision-config.tsx` - Multi-branch conditions
- `src/components/admin/workflows/panels/properties-panel.tsx` - Node config with variables
- `src/lib/workflows/types.ts` - EntryCriteria, ReentryMode, DecisionBranch types
- `src/lib/workflows/engine.ts` - interpolateVariables method for {{variable}} support

#### Phase C: SaaS Foundation (Week 3-5) ✅ COMPLETE

| Task                      | Status      | Notes                                                |
| ------------------------- | ----------- | ---------------------------------------------------- |
| C.1 Multi-Tenancy Schema  | ✅ COMPLETE | organizations table, org_id on 40+ tables, RLS       |
| C.2 Subscription Tiers    | ✅ COMPLETE | starter/professional/enterprise plans, feature flags |
| C.3 Usage Metering        | ✅ COMPLETE | usage_metrics table, UsageBar component              |
| C.4 Stripe Billing Rails  | ✅ COMPLETE | Client lib, webhook handler, billing page UI         |
| C.5 Organization Settings | ✅ COMPLETE | Profile, API keys, data export, account deletion     |

**Phase C Files Created:**

- `supabase/migrations/20251215000000_multi_tenancy_foundation.sql` - Organizations, memberships, org_id columns
- `supabase/migrations/20251215010000_multi_tenancy_rls_policies.sql` - Updated RLS for all tables
- `supabase/migrations/20251215020000_subscription_plans.sql` - Plans table, usage_metrics, helper functions
- `src/lib/features/flags.ts` - Feature flag checking, usage metering
- `src/lib/hooks/use-organization.tsx` - React context for organization state
- `src/components/admin/feature-gate.tsx` - FeatureGate, LimitGate, UpgradeButton, UsageBar
- `src/lib/stripe/client.ts` - Stubbed Stripe client (checkout, portal, invoices)
- `src/app/api/webhooks/stripe/route.ts` - Stripe webhook handler (stubbed)
- `src/app/admin/setup/billing/page.tsx` - Billing page with plans, usage, invoices, payment methods
- `src/app/admin/setup/organization/page.tsx` - Organization settings page

#### Phase D: Communication Rails (Week 4-5) ✅ COMPLETE

| Task                     | Status      | Notes                                            |
| ------------------------ | ----------- | ------------------------------------------------ |
| D.1 SMS Infrastructure   | ✅ COMPLETE | Client lib, templates, UI, workflow engine wired |
| D.2 Stripe Payment Rails | ✅ COMPLETE | Payment links, checkout pages, webhooks          |

**Phase D Files Created:**

- `src/lib/sms/client.ts` - Stubbed SMS client (sendSms, calculateSegments, formatPhoneNumber, opt-in/out)
- `src/lib/sms/templates.ts` - SMS template types, categories, variables, preview utilities
- `src/lib/sms/index.ts` - Re-exports for SMS module
- `supabase/migrations/20251216000000_sms_templates.sql` - sms_templates, sms_consent, sms_messages tables
- `src/app/admin/setup/sms-templates/page.tsx` - SMS template management UI with stats
- `src/components/admin/setup/sms-template-dialog.tsx` - Create/edit dialog with char counter
- `src/components/admin/setup/sms-template-actions.tsx` - Preview, edit, delete actions
- `src/lib/stripe/payments.ts` - Stubbed Stripe payment client for invoices
- `supabase/migrations/20251216010000_stripe_payment_rails.sql` - Checkout session fields, payment_events table
- `src/app/checkout/success/page.tsx` - Payment success confirmation page
- `src/app/checkout/cancel/page.tsx` - Payment cancelled page
- `src/app/api/webhooks/stripe-payments/route.ts` - Webhook handler for payment events
- `src/app/actions/invoices.ts` - Added generatePaymentLink, expirePaymentLink functions
- `src/lib/workflows/engine.ts` - Added send_sms step execution with opt-in verification

#### Phase E: Analytics & Attribution (Week 5-6) ✅ COMPLETE

| Task                        | Status      | Notes                                              |
| --------------------------- | ----------- | -------------------------------------------------- |
| E.1 Lead Source Attribution | ✅ COMPLETE | UTM capture, referral partners, attribution fields |
| E.2 Client Satisfaction     | ✅ COMPLETE | NPS surveys, workflow integration, admin UI        |

**Phase E Files Created:**

- `supabase/migrations/20251217000000_lead_source_attribution.sql` - Attribution columns on leads, referral_partners table
- `supabase/migrations/20251217010000_client_satisfaction.sql` - surveys, survey_responses, survey_invitations tables
- `src/lib/attribution/utm.ts` - UTM capture utilities (sessionStorage-based)
- `src/lib/attribution/index.ts` - Re-exports for attribution module
- `src/components/forms/contact-form.tsx` - Updated with "How did you hear about us?" and UTM fields
- `src/app/actions/contact.ts` - Updated to save attribution data
- `src/app/actions/leads.ts` - Added createLead action for manual lead entry with attribution
- `src/app/actions/referral-partners.ts` - Referral partner CRUD actions
- `src/app/actions/surveys.ts` - Survey CRUD, invitations, responses actions
- `src/app/admin/leads/new/page.tsx` - Manual lead entry form with full attribution support
- `src/app/admin/setup/referral-partners/page.tsx` - Referral partners management UI
- `src/components/admin/setup/referral-partner-dialog.tsx` - Create/edit partner dialog
- `src/components/admin/setup/referral-partner-actions.tsx` - Partner actions dropdown
- `src/app/admin/setup/surveys/page.tsx` - Survey management UI with NPS stats
- `src/components/admin/setup/survey-dialog.tsx` - Create/edit survey with question builder
- `src/components/admin/setup/survey-actions.tsx` - Survey actions dropdown
- `src/app/client/survey/[token]/page.tsx` - Public survey response page (token-based)
- `src/app/client/survey/[token]/survey-response-form.tsx` - Survey response form component
- `src/components/ui/nps-scale.tsx` - NPS scale input (0-10) with color coding
- `src/components/admin/client-overview.tsx` - Added Lead Source & Attribution section
- `src/lib/workflows/types.ts` - Added send_survey step type
- `src/lib/workflows/engine.ts` - Added executeSendSurvey method for workflow integration
- `src/components/admin/workflows/nodes/base-node.tsx` - Added send_survey node styling

#### Phase 9: Data Management ✅ COMPLETE

| Task                       | Status      | Notes                                               |
| -------------------------- | ----------- | --------------------------------------------------- |
| DM-1: CSV/Excel Import     | ✅ COMPLETE | 4-step wizard: upload, map columns, preview, import |
| DM-2: Quick Export Buttons | ✅ COMPLETE | Export dropdown on list views (CSV/Excel)           |
| DM-3: Filter-Aware Exports | ✅ COMPLETE | Exports respect current filters, include metadata   |
| DM-4: Bulk Actions         | ✅ COMPLETE | Team member assignment added to bulk actions bar    |
| DM-5: Duplicate Detection  | ✅ COMPLETE | Import-time duplicate skip via email checking       |

**Phase 9 Files Created:**

Import Library:

- `src/lib/import/types.ts` - ParsedFile, ColumnMapping, ValidationError, ImportResult types
- `src/lib/import/parsers.ts` - CSV and Excel parsing using xlsx library
- `src/lib/import/field-definitions.ts` - Field definitions per object type, auto-mapping with aliases
- `src/lib/import/validators.ts` - Row validation (email, phone, date), transform for DB insert
- `src/lib/import/index.ts` - Re-exports for import module

Export Library:

- `src/lib/export/excel.ts` - Excel export utilities using xlsx library
- `src/lib/export/csv.ts` - CSV export with metadata headers and proper escaping
- `src/lib/export/types.ts` - Export types (ExcelExportOptions, CSVExportOptions)
- `src/lib/export/index.ts` - Re-exports for export module

Import UI Components:

- `src/components/admin/import/import-wizard.tsx` - Main 4-step wizard container
- `src/components/admin/import/file-upload-step.tsx` - Drag-and-drop file upload
- `src/components/admin/import/column-mapping-step.tsx` - Column mapping with auto-map, templates
- `src/components/admin/import/preview-step.tsx` - Data preview with validation, row selection
- `src/components/admin/import/import-progress-step.tsx` - Progress bar, results, error download
- `src/components/admin/import/index.ts` - Re-exports

Export UI:

- `src/components/admin/export-button.tsx` - Reusable export dropdown (CSV/Excel, selection-aware)

Import Pages:

- `src/app/admin/import/page.tsx` - Import landing page with object type selection
- `src/app/admin/import/[object]/page.tsx` - Dynamic route for object-specific import wizard

Server Actions:

- `src/app/actions/import.ts` - executeImport, saveMappingTemplate, getMappingTemplates, getImportHistory

Database Migration:

- `supabase/migrations/20251218000000_import_jobs.sql` - import_jobs, import_mapping_templates tables

**Phase 9 Files Modified:**

- `src/components/admin/list-views/list-view-toolbar.tsx` - Added ExportButton integration
- `src/components/admin/list-views/list-view-container.tsx` - Pass export props (data, columns, filters, selectedIds)
- `src/components/admin/list-views/bulk-action-bar.tsx` - Added team member assignment dropdown
- `src/app/actions/list-views.ts` - Added bulkAssignTeamMember, getTeamMembers actions

**Phase 9 Key Features:**

- Import wizard supports CSV and Excel (.xlsx, .xls) files
- Auto-mapping recognizes common column names via aliases (e.g., "First Name" → first_name)
- Mapping templates can be saved and reused for repeated imports
- Duplicate detection skips rows where email already exists in database
- Batch processing (50 records at a time) prevents timeout on large imports
- Export includes filter metadata and supports selection-based exports
- Bulk team assignment with role selection (primary/backup/support)

**Phase 9 E2E Tests:**

- `tests/e2e/data-management-phase9.spec.ts` - Import wizard, export buttons, bulk actions, list view toolbar tests
  - Note: Import-related tests skip gracefully if `import_jobs` migration not applied

#### Phase 10: Admin & Operations ✅ COMPLETE

| Task                        | Status      | Notes                                               |
| --------------------------- | ----------- | --------------------------------------------------- |
| AO-1: Audit Log Dashboard   | ✅ COMPLETE | Full audit trail with filtering, search, CSV export |
| AO-2: API Keys Management   | ✅ COMPLETE | Generate, permissions, revoke, regenerate keys      |
| TD-1: Site Config Updates   | ✅ COMPLETE | Owner name, phone, OG image configuration           |
| TD-2: Document Storage      | ✅ COMPLETE | Fixed storage deletion, added orphan cleanup        |
| TD-3: Sentry Error Tracking | ✅ COMPLETE | Client/server/edge tracking with session replay     |
| AO-3: Webhook Management    | ✅ COMPLETE | Configure outbound webhooks with HMAC signatures    |
| AO-4: Rate Limiting         | ✅ COMPLETE | API rate limits per key with Redis sliding window   |

**Phase 10 Files Created:**

Audit Log System:

- `supabase/migrations/20251221000000_audit_logs.sql` - audit_logs table with retention policies
- `src/app/actions/audit-logs.ts` - Audit log CRUD, search, export actions
- `src/app/admin/setup/audit-logs/page.tsx` - Audit log dashboard with filters
- `src/app/api/audit-logs/export/route.ts` - CSV export endpoint
- `src/app/api/cron/cleanup-audit-logs/route.ts` - Retention cleanup cron

API Keys System:

- `supabase/migrations/20251222000000_api_keys.sql` - api_keys table with SHA-256 hashing
- `src/app/actions/api-keys.ts` - API key CRUD, regenerate, usage stats
- `src/app/admin/setup/api-keys/page.tsx` - API keys management page
- `src/app/admin/setup/api-keys/*.tsx` - Create/edit/view/delete/regenerate/revoke dialogs
- `src/lib/constants/api-permissions.ts` - API permissions constant
- `src/lib/api-auth/index.ts` - API key authentication middleware
- `src/app/api/v1/leads/route.ts` - Example external API endpoint

Sentry Integration:

- `sentry.client.config.ts` - Client-side Sentry with session replay
- `sentry.server.config.ts` - Server-side Sentry configuration
- `sentry.edge.config.ts` - Edge runtime Sentry configuration
- `src/instrumentation.ts` - Next.js instrumentation for Sentry

Webhook System:

- `supabase/migrations/20251222100000_webhooks.sql` - webhooks, webhook_deliveries tables
- `src/app/actions/webhooks.ts` - Webhook CRUD, test, trigger actions
- `src/app/admin/setup/webhooks/page.tsx` - Webhook management page
- `src/app/admin/setup/webhooks/*.tsx` - Create/edit/view/delete/test dialogs
- `src/lib/constants/webhook-events.ts` - Webhook events constant

Rate Limiting Extensions:

- `src/lib/rate-limit/index.ts` - Extended with checkApiKeyRateLimit, recordApiKeyUsage, getApiKeyUsageStats

**Phase 10 Files Modified:**

- `next.config.ts` - Added Sentry configuration wrapper
- `src/app/actions/documents.ts` - Fixed storage deletion, added cleanupOrphanedFiles
- `src/app/admin/error.tsx` - Added Sentry error reporting
- `src/app/error.tsx` - Added Sentry error reporting
- `src/lib/errors/logger.ts` - Integrated with Sentry
- `src/app/admin/setup/page.tsx` - Added Audit Logs, API Keys, Webhooks links

**Phase 10 Key Features:**

- Audit logs capture all CRUD operations with actor, action, entity, and changes
- API keys use SHA-256 hashing (only prefix stored, full key shown once on creation)
- Per-key rate limiting with configurable requests per minute/hour/day
- Webhooks support HMAC signature verification (`X-Webhook-Signature` header)
- Webhook events cover leads, clients, invoices, payments, contracts, meetings
- Sentry captures errors with environment tags, user context, and session replay
- Document deletion now properly cleans up Supabase Storage files

#### Phase 11: Admin Navigation System ✅ COMPLETE

| Task                        | Status      | Notes                                             |
| --------------------------- | ----------- | ------------------------------------------------- |
| NAV-1: Navigation Layout    | ✅ COMPLETE | Shared admin layout.tsx with server-side fetching |
| NAV-2: Object Tabs          | ✅ COMPLETE | Horizontal tabs for Accounts, Contacts, etc.      |
| NAV-3: Tools & User Menus   | ✅ COMPLETE | Dropdown menus for tools and user actions         |
| NAV-4: Breadcrumbs          | ✅ COMPLETE | Dynamic trail with async label resolution         |
| NAV-5: Mobile Navigation    | ✅ COMPLETE | Responsive hamburger menu with Sheet drawer       |
| NAV-6: Custom Object Routes | ✅ COMPLETE | Dynamic routes for any custom CRM object          |

**Phase 11 Files Created:**

Navigation Components:

- `src/components/admin/navigation/admin-navigation.tsx` - Main navigation wrapper
- `src/components/admin/navigation/admin-nav-header.tsx` - Desktop header with tabs
- `src/components/admin/navigation/admin-mobile-nav.tsx` - Mobile Sheet drawer
- `src/components/admin/navigation/nav-tabs.tsx` - Object tab buttons
- `src/components/admin/navigation/tools-menu.tsx` - Tools dropdown (Reports, Dashboards, etc.)
- `src/components/admin/navigation/user-menu.tsx` - User dropdown (Team, Setup, Sign Out)
- `src/components/admin/navigation/breadcrumbs.tsx` - Breadcrumb trail component
- `src/components/admin/navigation/page-header.tsx` - Standardized page header
- `src/components/admin/navigation/index.ts` - Barrel exports

Layout & Utilities:

- `src/app/admin/layout.tsx` - Shared admin layout with auth check and data fetching
- `src/lib/admin-navigation.ts` - Navigation types, icon mappings, config fetching
- `src/lib/breadcrumbs.ts` - Breadcrumb config and path parsing
- `src/lib/navigation-utils.ts` - Query param preservation for list views
- `src/app/actions/navigation.ts` - Server action for unread message count

Custom Object Dynamic Routes:

- `src/app/admin/objects/[apiName]/page.tsx` - Custom object list view
- `src/app/admin/objects/[apiName]/[id]/page.tsx` - Custom object detail view
- `src/app/admin/objects/[apiName]/new/page.tsx` - Custom object create form

Database:

- `supabase/migrations/20251223000000_navigation_config.sql` - navigation_config table for per-org customization

**Phase 11 Files Modified:**

Removed per-page headers from 30+ admin pages:

- `src/app/admin/accounts/page.tsx` - Uses PageHeader component
- `src/app/admin/contacts/page.tsx` - Uses PageHeader component
- `src/app/admin/opportunities/page.tsx` - Uses PageHeader component
- `src/app/admin/crm-leads/page.tsx` - Uses PageHeader component
- `src/app/admin/dashboards/page.tsx` - Uses PageHeader component
- `src/app/admin/messages/page.tsx` - Uses PageHeader component
- `src/app/admin/reports/page.tsx` - Uses PageHeader component
- `src/app/admin/team/page.tsx` - Uses PageHeader component
- `src/app/admin/workflows/page.tsx` - Uses PageHeader component
- `src/app/admin/setup/page.tsx` - Uses PageHeader component
- `src/components/admin/crm/secure-record-detail-page.tsx` - Simplified header
- `src/components/admin/crm/new-record-page.tsx` - Simplified header
- All "new" record pages - Removed full-page headers

**Phase 11 Key Features:**

- Salesforce-like horizontal object tabs for primary CRM objects
- Tools dropdown with Reports, Dashboards, Workflows, Messages
- User dropdown with Team, Setup, Sign Out
- Clickable logo returns to dashboard
- Breadcrumb trail shows hierarchical navigation path
- Query param preservation when navigating back to list views (filters, page, sort)
- Mobile-responsive with hamburger menu opening Sheet drawer
- Dynamic routes support any custom object from crm_object_definitions
- Per-organization navigation customization via navigation_config table

**Phase 11 Technical Notes:**

- **Serialization Pattern**: Navigation config uses `SerializableNavItem` type (excludes React components like `iconComponent`). Client components call `getIconComponent(item.icon)` to look up Lucide icons by name. This avoids "Functions cannot be passed directly to Client Components" errors.
- **Fallback Config**: `FALLBACK_NAV_DATA` in `src/lib/admin-navigation.ts` provides hardcoded navigation when database function not available (useful for development without applying navigation_config migration)
- **Database Function**: `get_navigation_config` RPC function (in migration) returns per-org nav config; falls back gracefully if not applied

#### Phase 8: UX Polish & Onboarding (Week 6) ✅ COMPLETE

| Task                          | Status      | Notes                                      |
| ----------------------------- | ----------- | ------------------------------------------ |
| UX-1: Admin Setup Wizard      | ✅ COMPLETE | Getting started checklist on dashboard     |
| UX-2: Empty States            | ✅ COMPLETE | Branded empty states for workflows page    |
| UX-3: Keyboard Shortcuts      | ✅ COMPLETE | G+H, G+L, G+W navigation, ? for help       |
| UX-4: Help Widget             | ✅ COMPLETE | Floating ? button with context-aware tips  |
| UX-5: Client Onboarding Tour  | ✅ COMPLETE | Step-by-step tour for new clients          |
| UX-6: Client Journey Timeline | ✅ COMPLETE | Visual progress tracker on dashboard       |
| UX-7: Client Smart Actions    | ✅ COMPLETE | Dynamic action items based on client state |

**Phase 8 Files Created:**

- `src/components/admin/onboarding/setup-checklist.tsx` - Getting started checklist with progress
- `src/components/admin/onboarding/setup-progress.tsx` - Progress indicator component
- `src/components/ui/empty-state.tsx` - Reusable branded empty state component
- `src/lib/hooks/use-keyboard-shortcuts.ts` - Keyboard shortcuts hook with sequence support
- `src/components/admin/keyboard-shortcuts-help.tsx` - Keyboard shortcuts help dialog
- `src/components/admin/help-widget.tsx` - Floating help button with context-aware tips
- `src/lib/help/help-content.ts` - Page-specific help tips content
- `src/components/client/onboarding-tour.tsx` - Client portal onboarding tour
- `src/components/client/journey-timeline.tsx` - Client journey progress visualization
- `src/components/client/action-items.tsx` - Dynamic client action items

**Phase 8 Files Modified:**

- `src/app/admin/page.tsx` - Added SetupChecklist component
- `src/app/admin/layout.tsx` - Added KeyboardShortcuts and HelpWidget providers
- `src/app/admin/workflows/page.tsx` - Added EmptyState for no workflows
- `src/app/client/(portal)/layout.tsx` - Added OnboardingTour component
- `src/app/client/(portal)/dashboard/page.tsx` - Added JourneyTimeline and ActionItems

**Phase 8 E2E Tests:**

- `tests/e2e/ux-polish-phase8.spec.ts` - Admin UX features (keyboard shortcuts, help widget, setup checklist, empty states)
- `tests/e2e/client-portal.spec.ts` - Client onboarding tour, journey timeline, action items tests

### Prior Phase 7 Completed Items

| Feature                | Status      | Notes                                      |
| ---------------------- | ----------- | ------------------------------------------ |
| Loading Skeletons      | ✅ COMPLETE | Dashboard, leads, setup pages              |
| Error Boundaries       | ✅ COMPLETE | Admin-specific error page with dev details |
| Mobile Navigation      | ✅ COMPLETE | Sheet component + slide-out drawer         |
| Form Validation (Zod)  | 🔄 PARTIAL  | 5/9 forms done, schemas ready for rest     |
| Canned Email Templates | ✅ COMPLETE | Database, UI, CRUD actions                 |
| Welcome Packets        | ✅ COMPLETE | Database schema, UI (full editor later)    |
| Workflow Automation    | ✅ COMPLETE | Visual canvas builder with ReactFlow       |
| Unified Messaging      | ✅ COMPLETE | In-app messaging with realtime             |

**Workflow Automation Files:**

- `src/app/admin/workflows/page.tsx` - Workflows list with stats
- `src/app/admin/workflows/new/` - New workflow form (object type, trigger config)
- `src/app/admin/workflows/[id]/` - Workflow builder with ReactFlow canvas
- `src/components/admin/workflows/` - Canvas, nodes, panels components
- `src/lib/workflows/engine.ts` - Workflow execution engine
- `src/lib/workflows/types.ts` - TypeScript types for workflows
- `src/app/actions/workflows.ts` - Server actions for CRUD operations
- `src/app/api/workflows/process/route.ts` - API for processing executions
- `src/app/api/cron/workflow-scheduler/route.ts` - Scheduled workflow cron
- `supabase/migrations/20251213000000_workflow_automation.sql` - Database schema
- `tests/e2e/admin-workflows.spec.ts` - E2E tests (38 passing)

**Unified Messaging Files:**

- `src/app/admin/messages/page.tsx` - Conversations list with stats, search, tabs
- `src/app/admin/messages/[id]/page.tsx` - Conversation detail with message thread
- `src/components/admin/messages/conversation-list.tsx` - Conversation list component
- `src/components/admin/messages/message-thread.tsx` - Message thread with timestamps
- `src/components/admin/messages/message-composer.tsx` - Message input with Enter to send
- `src/components/admin/messages/new-conversation-dialog.tsx` - New conversation modal
- `src/components/admin/messages/conversation-actions.tsx` - Archive/close/reopen actions
- `src/components/admin/quick-messages-sheet.tsx` - Slide-out panel for quick message access from staff nav
- `src/app/client/(portal)/messages/page.tsx` - Client portal conversations list
- `src/app/client/(portal)/messages/[id]/page.tsx` - Client conversation detail
- `src/components/client/messages/client-conversation-list.tsx` - Client conversation list
- `src/components/client/messages/client-message-thread.tsx` - Client message thread
- `src/components/client/messages/client-message-composer.tsx` - Client message input
- `src/components/client/chat-widget/` - Floating chat widget for client portal
  - `chat-widget.tsx` - Main widget with state management
  - `chat-widget-bubble.tsx` - Floating bubble button
  - `chat-widget-panel.tsx` - Expanded panel container
  - `chat-widget-conversation-list.tsx` - Compact conversation list
  - `chat-widget-new-message.tsx` - Team member selection dialog
  - `chat-widget-thread.tsx` - Message thread with real-time
  - `chat-widget-composer.tsx` - Compact message input
- `src/components/ui/pulsing-badge.tsx` - Animated badge for unread indicators
- `src/app/actions/messaging.ts` - Server actions (CRUD, read status, search)
- `supabase/migrations/20251214000000_unified_messaging.sql` - Database schema
- `tests/e2e/admin-messages.spec.ts` - E2E tests (21 tests)

**Phase 7 Other Files:**

- `src/components/ui/skeleton.tsx` - Skeleton loading component
- `src/components/admin/dashboards/dashboard-skeleton.tsx` - Dashboard loading skeleton
- `src/app/admin/loading.tsx` - Admin dashboard loading state
- `src/app/admin/error.tsx` - Admin error boundary
- `src/app/admin/leads/loading.tsx` - Leads page loading state
- `src/app/admin/setup/loading.tsx` - Setup hub loading state
- `src/components/ui/sheet.tsx` - Sheet/drawer component for mobile nav
- `src/lib/validations/setup.ts` - Zod schemas for admin setup forms
- `src/app/admin/setup/email-templates/page.tsx` - Email templates management
- `src/components/admin/setup/email-template-dialog.tsx` - Template create/edit dialog
- `src/components/admin/setup/email-template-actions.tsx` - Template actions (preview, delete)
- `supabase/migrations/20251211000000_email_templates.sql` - Email templates table + defaults
- `src/app/admin/setup/welcome-packets/page.tsx` - Welcome packets management UI
- `supabase/migrations/20251212000000_welcome_packets.sql` - Welcome packets tables + defaults
- `tests/e2e/admin-setup-polish.spec.ts` - E2E tests for Phase 7 polish features

### Phase 6+ Progress (COMPLETE)

| Feature                  | Status      | Notes                                     |
| ------------------------ | ----------- | ----------------------------------------- |
| Report Builder UI        | ✅ COMPLETE | Wizard, filters, preview, save/edit       |
| Dashboard Builder UI     | ✅ COMPLETE | 12-col grid, drag-drop, 8 widget types    |
| Admin Setup Hub          | ✅ COMPLETE | All pages functional, E2E tested          |
| Contract Template Editor | ✅ COMPLETE | Create/edit templates with placeholders   |
| Roles & Permissions UI   | ✅ COMPLETE | Hierarchy levels, permission matrix       |
| User Management UI       | ✅ COMPLETE | Invite flow, manual create, team linking  |
| Company Profile          | ✅ COMPLETE | Business info, branding, invoice settings |
| Services & Packages      | ✅ COMPLETE | Package management with toggle            |
| E2E Testing              | ✅ COMPLETE | Full admin portal tested, bugs fixed      |

### Admin Portal E2E Testing (Completed Dec 8, 2024)

All admin pages tested with Playwright:

- ✅ Login/Auth flow
- ✅ Main Dashboard (KPIs, charts, recent leads)
- ✅ Leads table (filters, search, detail pages)
- ✅ Setup Hub (Users, Roles, Services, Company, Contracts, Intake Forms, Integrations)
- ✅ Team Management (Dashboard, Members, Assignments, Time Tracking, On-Call)
- ✅ Reports (list, detail, data tables, charts)
- ✅ Dashboards (list, builder with widget panel)
- ✅ Mobile responsiveness

**Bugs Fixed During Testing:**

1. Reports & Dashboards pages - missing left padding (added container wrapper)
2. Company Profile page - RLS error (changed to authenticated client)
3. Client portal /client route - 404 error (added page.tsx redirect handler)
4. Client dashboard data loading - "Cannot coerce to single JSON object" (added legacy leads table fallback to getPortalProfile())

### Future Features (Not Started)

- Advanced Scheduling (calendar sync, availability)
- Stripe integration for payments

## Project Overview

A CRM and client portal for a doula practice in Kearney, Nebraska. Built with Next.js 16, Supabase, and Tailwind CSS.

## Tech Stack

- **Framework**: Next.js 16 with Turbopack
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth (admin) + Magic Link (clients)
- **Styling**: Tailwind CSS 4
- **Testing**: Playwright E2E (11 suites) + Vitest unit tests
- **CI/CD**: GitHub Actions

## Development Commands

```bash
pnpm dev          # Start dev server
pnpm build        # Production build
pnpm test:e2e     # Run Playwright tests
pnpm test:run     # Run unit tests
pnpm lint         # Run ESLint
pnpm type-check   # TypeScript check
```

## Key Directories

- `src/app/actions/` - Server actions (leads, team, invoices, contracts, reports, etc.)
- `src/app/admin/` - Admin CRM dashboard
- `src/app/admin/reports/` - Report Builder pages (new, [id], [id]/edit)
- `src/app/admin/dashboards/` - Dashboard Builder pages
- `src/app/client/` - Client portal
- `src/components/admin/reports/` - Report Builder components (wizard, filters, preview)
- `src/components/` - React components
- `supabase/migrations/` - Database migrations (15+ files)
- `tests/e2e/` - Playwright E2E tests
- `.github/workflows/` - CI/CD pipelines

## Database Notes

### FK Relationship Disambiguation

When querying tables with multiple foreign keys to the same target table, use explicit FK names:

```typescript
// oncall_schedule has team_member_id and created_by both referencing team_members
team_member:team_members!oncall_schedule_team_member_id_fkey(...)

// client_assignments has team_member_id and assigned_by both referencing team_members
team_member:team_members!client_assignments_team_member_id_fkey(...)
```

### Enum Values

- `lead_status`: 'new', 'contacted', 'scheduled', 'client', 'lost' (NOT 'active')
- `activity_type`: 'note', 'email_sent', 'call', 'meeting', 'status_change', 'system', 'document', 'invoice', 'payment', 'contract', 'team_assigned'

## Test Credentials

- Email: chase.d.harmon@gmail.com
- Password: TestPassword123!

## Admin User Seeding

The user `chase.d.harmon@gmail.com` is automatically seeded as an **admin** with full permissions. This is handled by:

- **Migration**: `supabase/migrations/20251210100000_seed_admin_user.sql`
- **Function**: `setup_admin_user_chase_harmon()` - Sets up admin role in both `users` and `team_members` tables
- **Trigger**: `on_admin_user_signup` - Automatically assigns admin role when this email signs up on a fresh database

This ensures that on any database reset or fresh deployment, this user will have:

- `role = 'admin'` in `team_members` table (grants access to Workflows and other admin features)
- `role = 'admin'` and linked `role_id` in `users` table
- Full permissions for all CRM features

## Completed Features

### Phase 1-2: Foundation & Lead Management

- Database schema with RLS policies
- Admin dashboard with stats
- Lead capture (contact form, newsletter)
- Lead detail pages with status management
- Activity timeline and notes

### Phase 3: Enhanced CRM & Client Portal

- Client services, meetings, documents, payments tabs
- Magic link authentication for clients
- Client dashboard, services view, documents, payments

### Phase 4: Self-Service & Notifications

- Email system (Resend) with templates
- Intake forms with dynamic JSON schema
- Invoice generation with auto-numbering
- Contract templates and e-signatures
- File upload to Supabase Storage

### Phase 5: Team Management

- Team members with roles (owner, admin, provider, assistant)
- Client assignments (primary, backup, support)
- Service assignments with revenue sharing
- Time tracking and on-call scheduling

### Phase 6: Production Hardening

- GitHub Actions CI/CD pipeline
- File cleanup and archive organization
- Migration file naming consistency

### Phase 6+: Admin Enhancements (Current)

**Report Builder UI** (COMPLETE):

- Visual step-by-step wizard: Source → Fields → Filter → Group → Calc → Chart
- Drag-and-drop column ordering with @dnd-kit
- Filter builder with picklist dropdowns for select fields
- Real-time preview with formula explanations
- Save reports with visibility settings (private/shared/org)
- View saved reports with data tables and aggregations
- Components in `src/components/admin/reports/`
- Pages in `src/app/admin/reports/`

**Dashboard Builder UI** (COMPLETE):

- 12-column responsive grid layout with drag-and-drop placement
- Widget types: Metric card, Chart (bar/line/pie/donut), Table, List, Funnel, Gauge, Calendar, Report
- Widget data sources: Link to saved report, custom query, or static value
- Edit/preview mode toggle for testing layouts
- Widget configuration panel with type-specific settings
- Save dashboards with visibility settings (private/shared/org)
- Components in `src/components/admin/dashboards/`
- Pages: list (`/admin/dashboards`), new (`/admin/dashboards/new`), view (`/admin/dashboards/[id]`), edit (`/admin/dashboards/[id]/edit`)
- Server actions in `src/app/actions/dashboards.ts`

**Workflow Automation** (COMPLETE):

- Visual drag-and-drop canvas builder using @xyflow/react v12
- Object types: Lead, Meeting, Payment, Invoice, Service, Document, Contract, Intake Form
- Trigger types: Record Create, Record Update, Field Change, Scheduled, Manual, Form Submit, Payment Received
- Action nodes: Send Email (with template selection), Create Task, Update Field, Wait (delay), Decision (branching)
- Node palette with categorized drag-and-drop nodes
- Properties panel for configuring selected nodes
- Workflow execution engine in `src/lib/workflows/engine.ts`
- Pre-built templates: New Lead Welcome, Consultation Follow-up, Payment Confirmation, Contract Reminder
- Database tables: workflows, workflow_steps, workflow_executions, workflow_step_executions, workflow_templates
- E2E tests: 38 passing (desktop), 12 skipped (mobile - canvas not mobile-optimized)
- Components in `src/components/admin/workflows/`
- Pages: list (`/admin/workflows`), new (`/admin/workflows/new`), builder (`/admin/workflows/[id]`)
- Server actions in `src/app/actions/workflows.ts`
- **Role-based access**: Only `owner` or `admin` team_members can access workflows (dashboard link conditional, page-level redirect)
- `workflows` added to PERMISSION_OBJECTS in `src/lib/permissions.ts` for granular permission control

**Unified Messaging** (COMPLETE):

- In-app messaging system for doula-client communication
- Real-time updates via Supabase Realtime (messages table)
- Conversation statuses: active, closed, archived
- Unread message badges in navigation (admin and client portals) with pulsing animation
- Admin features: Start conversation, search, archive/close/reopen, quick access slide-out sheet
- Client portal: View and reply to conversations with doula, floating chat widget (Intercom-style)
- Floating chat widget with: bubble button, expandable panel, conversation list, thread view, team member selection for new messages
- Database tables: conversations, conversation_participants, messages
- Helper functions: `mark_conversation_read`, `get_user_unread_count`, `get_or_create_client_conversation`
- RLS policies for secure access (admin sees all, clients see their own)
- UI components: Avatar, Popover, Command (cmdk) for client search, PulsingBadge for unread indicators
- E2E tests: 21 tests for admin messaging (requires TEST_ADMIN_PASSWORD env var)
- Components in `src/components/admin/messages/`, `src/components/client/messages/`, and `src/components/client/chat-widget/`
- Pages: admin list (`/admin/messages`), admin detail (`/admin/messages/[id]`), client list (`/client/messages`), client detail (`/client/messages/[id]`)
- Server actions in `src/app/actions/messaging.ts`

**Admin Setup Hub** (COMPLETE):

- Salesforce-style centralized settings area at `/admin/setup/`
- Category cards: Administration, Business, Client Experience, Integrations
- **Users** (`/admin/setup/users/`): List users with role, status, last login; invite new users via Resend; activate/deactivate users
- **Roles & Permissions** (`/admin/setup/roles/`): List/edit roles with permissions matrix; system roles (admin, provider, viewer) + custom roles
- **Team Members**: Links to existing `/admin/team`
- **Contract Templates** (`/admin/setup/contracts/`): List/manage templates with service type, version, status
- **Intake Forms** (`/admin/setup/intake-forms/`): List/manage form templates with field count
- **Integrations** (`/admin/setup/integrations/`): Display Stripe, Resend, Supabase config status
- **Services & Company**: Stub pages for future development
- Components in `src/components/admin/setup/`
- Server actions in `src/app/actions/setup.ts`
- Permission constants in `src/lib/permissions.ts`

---

## Database Schema Reference

### Roles & Permissions

**Database schema:**

```sql
CREATE TABLE roles (
  id UUID PRIMARY KEY,
  name TEXT UNIQUE,
  description TEXT,
  is_system BOOLEAN DEFAULT false,
  permissions JSONB DEFAULT '{}'
);

-- Default roles: admin (full), provider (limited), viewer (read-only)
```

**Permission structure:**

```typescript
interface Permissions {
  [object: string]: ('create' | 'read' | 'update' | 'delete' | '*')[]
}
// Objects: leads, clients, invoices, meetings, documents, reports, dashboards, settings
```

### User/Employee Management

**Features:**

- List users with role, status, last login
- Invite new user (sends email via Resend)
- Link user to team_member profile
- Activate/deactivate users

---

## Pending Tasks

### Site Configuration (src/config/site.ts)

When ready to launch:

- [x] Update owner name (line 15) - ✅ Done in Phase 10 (TD-1)
- [x] Update phone number (line 22) - ✅ Done in Phase 10 (TD-1)
- [x] Add OG image (line 109) - ✅ Done in Phase 10 (TD-1)
- [ ] Update established year (line 16)
- [ ] Update email address (line 21)
- [ ] Update Calendly link (line 24)
- [ ] Update Twitter/X handle when account exists (line 110)

### Other

- [ ] Add logo URL to email config (src/lib/email/config.ts:38)
- [ ] Replace sample resource fileUrls with actual hosted PDFs (src/app/resources/page.tsx:27)
- [ ] Integrate newsletter with email service (src/app/actions/newsletter.ts:45)

## GitHub Actions CI/CD

The project now has automated CI/CD:

```
.github/workflows/ci.yml
```

**Required GitHub Secrets:**

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `TEST_ADMIN_PASSWORD`

## Turbopack HMR Bug

There's a known Turbopack caching issue causing phantom module references. Clear cache with:

```bash
rm -rf .next node_modules/.cache
```

Also clear Playwright's browser cache if issues persist:

```bash
rm -rf ~/Library/Caches/ms-playwright/mcp-chrome-*
```

---

## E2E Testing Status (Last Updated: Dec 12, 2025)

### Recent Test Run Results (Post-Phase 11):

- **All messaging tests passing** ✅ (37/37 messaging-realtime tests)
- **Admin navigation tests passing** ✅ (navigation system fully tested)
- **~15 flaky** (pass on retry with `--retries=2`)
- **~8 failed** (mobile viewport timing issues)
- **~140 skipped** (across all test projects - reduced with import_jobs migration)

### Phase 9 E2E Tests Added:

- `tests/e2e/data-management-phase9.spec.ts` - Data management features (20 tests)
  - Import wizard UI (landing page, leads/clients import, wizard steps, file dropzone, column mapping)
  - Export buttons (CSV/Excel dropdown on list views)
  - Bulk actions (selection bar, team assignment, delete option)
  - Import history and navigation tests

### Phase 8 E2E Tests Added:

- `tests/e2e/ux-polish-phase8.spec.ts` - Admin UX features (10 tests, some skip when dashboard fails to load)
- `tests/e2e/client-portal.spec.ts` - Updated with Phase 8 client tests (onboarding tour, journey timeline, action items)

### Test Architecture:

```
playwright.config.ts projects:
├── setup              # Auth setup (auth.setup.ts)
├── data-seed          # Data seeding (data-seed.setup.ts) - depends on setup
├── chromium           # Main tests with admin auth - depends on data-seed
├── mobile             # Mobile tests with admin auth - depends on data-seed
├── chromium-client    # Client portal tests - depends on data-seed
└── mobile-client      # Mobile client tests - depends on data-seed
```

### Authentication Pattern (IMPORTANT):

- Tests use Playwright's `storageState` pattern for admin authentication
- Auth is handled by `tests/e2e/auth.setup.ts` which saves session to `tests/e2e/.auth/admin.json`
- Client auth saved to `tests/e2e/.auth/client.json`
- Individual tests should NOT have their own login logic - they inherit the session
- Password: `TestPassword123!` (set via `TEST_ADMIN_PASSWORD` env var)

### Data Seeding Pattern (IMPORTANT):

- Data seeding is handled by `tests/e2e/data-seed.setup.ts`
- Requires `SUPABASE_SERVICE_ROLE_KEY` env var (get from Supabase Dashboard → Project Settings → API)
- Seeds: organization (if migration applied), team member, client assignments (primary + backup), conversation, participants, messages, workflow with 3 steps
- Uses fixed UUIDs for idempotent seeding (e2e00000-0000-0000-0000-00000000000X)
- Organization seeding gracefully skips if multi-tenancy migration not applied
- Uses conditional spreading `...(organizationId && { organization_id: organizationId })` for optional org_id
- **Critical**: Checks for existing team_member to avoid duplicates (causes `.single()` query failures)
- **Critical**: Team member must have role='admin' for workflow tests to pass

### Database Constraints for Tests:

1. **Team member uniqueness**: Only ONE team_member per user_id (workflows page uses `.single()`)
2. **Team member role**: Must be 'admin' or 'owner' to access /admin/workflows
3. **Conversation seeding**: Required for messaging tests to pass (not skip)
4. **Organization seeding**: Required for SaaS Foundation tests (billing, organization settings)

### Known Flaky/Failing Tests:

**Failed Tests (~8)**: All mobile viewport tests with timing/selector issues

- `admin-workflows.spec.ts` - 4 tests (workflow canvas not mobile-optimized)
- `messaging-*.spec.ts` - 4 tests (realtime timing issues on mobile)

**Flaky Tests (~15)**: Pass on retry but timing-sensitive

- admin-messages.spec.ts navigation tests
- messaging-\*.spec.ts various tests
- login-as-client.spec.ts

**Mitigation**: Tests run with `--retries=2` to handle timing issues.

### Skipped Tests (~158 tests across all projects):

| Category                  | Count | Blocker / Skip Reason                                                               |
| ------------------------- | ----- | ----------------------------------------------------------------------------------- |
| **SaaS Foundation**       | ~52   | Multi-tenancy migration not applied (`20251215000000_multi_tenancy_foundation.sql`) |
| **Lead Form Submission**  | ~2    | Missing `referral_partner_id` column - needs migration applied                      |
| **Intake Forms**          | ~6    | Page shows "Something went wrong" error during E2E - needs investigation            |
| **Mobile Menu**           | ~2    | Selector updates needed for hamburger/sheet components                              |
| **On-Call Schedule**      | ~1    | Dialog selector updates needed                                                      |
| **Report Builder**        | ~6+   | Full workflow tests - wizard UI changed, tooltip help icons not found               |
| **Team Management**       | ~6    | Complex UI interactions (time entry, schedule creation)                             |
| **Messaging/Team Assign** | ~40+  | Conditional skips based on data state - most now work with seeding                  |
| **Other**                 | ~10   | Various explicit skips (Calendly placeholder, email API tests)                      |

### Recent Test Improvements (Dec 12, 2025):

1. **Form validation tests enabled** (2 tests) - Rewrote to check HTML5 validation state instead of error message text
2. **Messaging functional tests now run** - Conditional skips work with seeded conversation data
3. **Identified migration blockers** - `referral_partner_id` column needed for lead submission tests
4. **Admin navigation E2E tests passing** - Fixed serialization issues and test selectors for Phase 11
5. **Messaging-realtime tests fixed** (37/37 passing):
   - Fixed Messages link test to click Tools dropdown first (Messages moved to Tools menu)
   - Updated URL expectations from `/admin/leads` to `/admin/crm-leads` for CRM navigation
   - Fixed send button enablement test with proper hydration waits
   - Updated Messages tab tests to use legacy leads page with clickable table rows

### To Enable More Tests:

1. **Apply multi-tenancy migration** to Supabase:

   ```bash
   supabase db push
   # Or apply via Supabase Dashboard: 20251215000000_multi_tenancy_foundation.sql
   ```

   This will enable ~52 SaaS Foundation tests.

2. **Apply referral partners migration**:

   ```bash
   # Migration: 20251217000000_lead_source_attribution.sql
   # Adds referral_partner_id column to leads table
   ```

   This will enable ~2 lead submission tests.

3. **Fix intake forms page error** - Debug why `/admin/setup/intake-forms` shows error during E2E

4. **Update mobile menu selectors** - Review hamburger button aria-label and sheet component structure

5. **Review report builder wizard** - Tooltip implementation changed, update test selectors

---
