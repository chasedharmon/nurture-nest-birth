# Nurture Nest Birth CRM - Comprehensive Documentation

## Executive Summary

**Project**: Nurture Nest Birth CRM
**Type**: Full-featured CRM for DONA-certified doula practice
**Location**: Kearney, Nebraska
**Development Phase**: Phase 11 Complete (Portal-CRM Sync & E2E Testing)

---

## Tech Stack Overview

| Layer          | Technology                 | Purpose                                 |
| -------------- | -------------------------- | --------------------------------------- |
| **Framework**  | Next.js 16 (App Router)    | Full-stack React framework with SSR     |
| **Language**   | TypeScript (strict mode)   | Type safety throughout                  |
| **UI Library** | React 19                   | Component framework                     |
| **Styling**    | Tailwind CSS 4 + shadcn/ui | Utility-first CSS with Radix primitives |
| **Database**   | Supabase (PostgreSQL)      | Database, Auth, Storage, Realtime       |
| **Email**      | Resend + React Email       | Transactional email with templates      |
| **Payments**   | Stripe (stubbed)           | Payment processing infrastructure       |
| **SMS**        | Twilio (stubbed)           | Text messaging capability               |
| **Automation** | @xyflow/react v12          | Visual workflow builder                 |
| **Testing**    | Playwright + Vitest        | E2E and unit testing                    |
| **Animations** | Framer Motion              | UI animations                           |

---

## Feature Documentation

### 1. CRM Object Model (Salesforce-like Architecture)

**Status**: ✅ Phase 11 Complete (Portal-CRM Sync & E2E Testing)
**Location**: `/admin/contacts`, `/admin/accounts`, `/admin/crm-leads`, `/admin/opportunities`

The CRM has been transformed from a single "leads" table into a robust, Salesforce-like object model with distinct entities, relationships, and a metadata-driven architecture.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     CRM OBJECT MODEL                                     │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Lead Conversion Flow:                                                   │
│  ┌─────────────────┐                                                    │
│  │     Lead        │  (Unqualified prospect - from forms, referrals)    │
│  │  status: new,   │                                                    │
│  │  contacted,     │                                                    │
│  │  qualified      │                                                    │
│  └────────┬────────┘                                                    │
│           │ CONVERT                                                     │
│           ▼                                                             │
│  ┌─────────────────┐     ┌─────────────────────────────────────────┐   │
│  │    Contact      │────▶│              Account                    │   │
│  │  (Person data)  │     │         (Household/Family)              │   │
│  │  - Birthing     │     │                                         │   │
│  │    parent       │     │  Related Contacts:                      │   │
│  │  - Partner      │     │  ├── Primary (birthing parent)          │   │
│  │  - Family       │     │  ├── Partner                            │   │
│  │    member       │     │  ├── Children                           │   │
│  └────────┬────────┘     │  └── Other family members               │   │
│           │              │                                         │   │
│           ▼              │  Related Records:                       │   │
│  ┌─────────────────┐     │  ├── Opportunities                      │   │
│  │  Opportunity    │────▶│  ├── Services                           │   │
│  │  (Specific deal)│     │  ├── Invoices                           │   │
│  │  stage: qual,   │     │  └── Activities                         │   │
│  │  proposal,      │     └─────────────────────────────────────────┘   │
│  │  closed_won     │                                                    │
│  └─────────────────┘                                                    │
│                                                                          │
│  Activity Object (Unified Log):                                          │
│  ┌────────┬────────┬────────┬────────┬────────┐                        │
│  │  Task  │ Event  │  Call  │ Email  │  Note  │                        │
│  └────────┴────────┴────────┴────────┴────────┘                        │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

#### Core CRM Objects

| Object          | Table               | Purpose                                           |
| --------------- | ------------------- | ------------------------------------------------- |
| **Contact**     | `crm_contacts`      | Person records (birthing parent, partner, family) |
| **Account**     | `crm_accounts`      | Household/family aggregate with billing           |
| **Lead**        | `crm_leads`         | Unqualified prospects before conversion           |
| **Opportunity** | `crm_opportunities` | Deals with stage progression                      |
| **Activity**    | `crm_activities`    | Unified activity log                              |

#### Metadata-Driven Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                  METADATA LAYER                                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────────────┐        ┌──────────────────────┐              │
│  │  object_definitions  │───────▶│  field_definitions   │              │
│  │  - api_name          │        │  - api_name          │              │
│  │  - label             │        │  - data_type         │              │
│  │  - is_standard       │        │  - is_required       │              │
│  │  - is_custom         │        │  - type_config       │              │
│  │  - features          │        │  - validation_rules  │              │
│  └──────────────────────┘        └──────────────────────┘              │
│           │                               │                             │
│           │                               ▼                             │
│           │                      ┌──────────────────────┐              │
│           │                      │   picklist_values    │              │
│           │                      │   (for picklist      │              │
│           │                      │    fields)           │              │
│           │                      └──────────────────────┘              │
│           ▼                                                             │
│  ┌──────────────────────┐        ┌──────────────────────┐              │
│  │    page_layouts      │        │   field_permissions  │              │
│  │  - layout_data       │        │   (per role)         │              │
│  │  - is_default        │        └──────────────────────┘              │
│  └──────────────────────┘                                              │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

#### Field Data Types

| Type             | Description      | Config Options                        |
| ---------------- | ---------------- | ------------------------------------- |
| `text`           | Single-line text | `max_length`                          |
| `textarea`       | Multi-line text  | `max_length`, `rows`                  |
| `rich_text`      | HTML content     | `max_length`                          |
| `number`         | Numeric values   | `precision`, `scale`                  |
| `currency`       | Money values     | `precision`, `currency_code`          |
| `percent`        | Percentage       | `precision`                           |
| `date`           | Date only        | -                                     |
| `datetime`       | Date and time    | -                                     |
| `checkbox`       | Boolean          | -                                     |
| `picklist`       | Single select    | `picklist_id`                         |
| `multi_picklist` | Multi select     | `picklist_id`                         |
| `lookup`         | Related record   | `related_object`, `relationship_name` |
| `email`          | Email address    | -                                     |
| `phone`          | Phone number     | -                                     |
| `url`            | Web address      | -                                     |
| `formula`        | Calculated field | `formula`, `return_type`              |

#### Contact-Account Relationships

```
┌──────────────────────────────────────────────────────────────────────┐
│               CONTACT-ACCOUNT RELATIONSHIP MODEL                      │
├──────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  Account (Household)                                                  │
│  └── Contact Relationships:                                          │
│      ├── primary        - Main client (birthing parent)              │
│      ├── partner        - Partner/spouse                             │
│      ├── parent         - Parent of client                           │
│      ├── child          - Child (for postpartum tracking)            │
│      ├── emergency_contact - Emergency contact                       │
│      └── other          - Other family member                        │
│                                                                       │
│  Table: contact_account_relationships                                │
│  - contact_id           - Link to crm_contacts                       │
│  - account_id           - Link to crm_accounts                       │
│  - relationship_type    - Type from list above                       │
│  - is_primary           - Primary contact for account                │
│  - is_billing_contact   - Receives invoices                          │
│                                                                       │
└──────────────────────────────────────────────────────────────────────┘
```

#### Opportunity Stage Progression

```
┌──────────────────────────────────────────────────────────────────────┐
│                 OPPORTUNITY STAGES                                    │
├──────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  Stage               │ Probability │ Forecast Category                │
│  ────────────────────┼─────────────┼─────────────────────────────────│
│  qualification       │    10%      │ pipeline                         │
│  needs_analysis      │    25%      │ pipeline                         │
│  proposal            │    50%      │ best_case                        │
│  negotiation         │    75%      │ commit                           │
│  closed_won          │   100%      │ closed                           │
│  closed_lost         │     0%      │ omitted                          │
│                                                                       │
│  Auto-calculated Fields:                                              │
│  - probability (from stage)                                          │
│  - expected_revenue = amount × probability                           │
│                                                                       │
└──────────────────────────────────────────────────────────────────────┘
```

**Key Files**:

- `supabase/migrations/20251219000000_crm_metadata_foundation.sql` - Metadata tables
- `supabase/migrations/20251219010000_crm_core_objects.sql` - CRM object tables
- `src/lib/crm/types.ts` - TypeScript types for CRM
- `src/app/actions/object-definitions.ts` - Object metadata actions
- `src/app/actions/field-definitions.ts` - Field metadata actions
- `src/app/actions/page-layouts.ts` - Page layout CRUD actions

#### Admin Setup UI (Phase 3 Complete)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     OBJECT MANAGER UI                                    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  /admin/setup/objects                                                   │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  Objects List Page                                               │   │
│  │  ├── Standard Objects (Contact, Account, Lead, Opportunity)     │   │
│  │  └── Custom Objects (user-created with __c suffix)              │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  /admin/setup/objects/[id]                                              │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  Object Detail Page (Tabbed Interface)                          │   │
│  │  ├── Settings Tab      - Labels, API name, description          │   │
│  │  ├── Fields Tab        - Manage standard + custom fields        │   │
│  │  ├── Page Layouts Tab  - Drag-drop section/field arrangement    │   │
│  │  └── Relationships Tab - View related objects                    │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  FieldCreationWizard (Multi-Step):                                      │
│  ┌────────┐   ┌────────┐   ┌────────┐   ┌────────┐                    │
│  │ Type   │──▶│ Details│──▶│Options │──▶│ Review │                    │
│  │Selection│   │ (Name, │   │(Picklist│   │& Create│                    │
│  │(16 types)│  │ API)   │   │ Values)│   │        │                    │
│  └────────┘   └────────┘   └────────┘   └────────┘                    │
│                                                                          │
│  Field Types Supported:                                                  │
│  ┌────────────┬────────────┬────────────┬────────────┐                 │
│  │ Basic      │ Numeric    │ Selection  │ Special    │                 │
│  ├────────────┼────────────┼────────────┼────────────┤                 │
│  │ text       │ number     │ picklist   │ lookup     │                 │
│  │ textarea   │ currency   │ multipick  │ formula    │                 │
│  │ rich_text  │ percent    │ checkbox   │ auto_number│                 │
│  │ email      │            │            │            │                 │
│  │ phone      │            │            │            │                 │
│  │ url        │            │            │            │                 │
│  │ date       │            │            │            │                 │
│  │ datetime   │            │            │            │                 │
│  └────────────┴────────────┴────────────┴────────────┘                 │
│                                                                          │
│  PageLayoutEditor:                                                       │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ Section Management                                               │   │
│  │ ├── Create/rename/delete sections                               │   │
│  │ ├── Reorder sections (up/down)                                  │   │
│  │ ├── Configure columns (1 or 2)                                  │   │
│  │ └── Set collapsed by default                                    │   │
│  │                                                                  │   │
│  │ Field Assignment                                                 │   │
│  │ ├── Add fields to sections                                      │   │
│  │ ├── Remove fields from sections                                 │   │
│  │ ├── Reorder fields within section                               │   │
│  │ └── Unassigned fields warning                                   │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

**Phase 3 Key Files**:

- `src/app/admin/setup/objects/page.tsx` - Objects list page
- `src/app/admin/setup/objects/[id]/page.tsx` - Object detail page with tabs
- `src/components/admin/setup/field-creation-wizard.tsx` - Multi-step field wizard
- `src/components/admin/setup/fields-management.tsx` - Fields table + wizard integration
- `src/components/admin/setup/page-layout-editor.tsx` - Section-based layout editor
- `src/components/admin/setup/page-layouts-tab.tsx` - Page layouts tab wrapper

#### Dynamic Record Forms (Phase 4 Complete)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     DYNAMIC RECORD FORM                                   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  DynamicRecordForm Component:                                            │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ Props:                                                           │   │
│  │ ├── objectApiName - Which CRM object (Contact, Lead, etc.)      │   │
│  │ ├── layout        - Page layout configuration                    │   │
│  │ ├── fields        - Field definitions with picklist values       │   │
│  │ ├── initialData   - Current record values (for edit mode)        │   │
│  │ ├── readOnly      - View mode vs edit mode                       │   │
│  │ └── onSubmit      - Form submission handler                      │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  Field Type Renderers (16 types):                                        │
│  ┌────────────┬────────────┬────────────┬────────────┐                 │
│  │ Text-based │ Numeric    │ Selection  │ Special    │                 │
│  ├────────────┼────────────┼────────────┼────────────┤                 │
│  │ TextField  │NumberField │PicklistField│LookupField│                 │
│  │ EmailField │CurrencyField│MultiPicklist│FormulaField│                │
│  │ PhoneField │PercentField│CheckboxField│AutoNumberField│              │
│  │ UrlField   │            │            │            │                 │
│  │ TextAreaField│          │            │            │                 │
│  │ RichTextField│          │            │            │                 │
│  │ DateField  │            │            │            │                 │
│  │ DateTimeField│          │            │            │                 │
│  └────────────┴────────────┴────────────┴────────────┘                 │
│                                                                          │
│  Features:                                                               │
│  ├── Section-based layout (from page_layouts)                           │
│  ├── Collapsible sections (Radix Collapsible)                           │
│  ├── 1 or 2 column layouts per section                                  │
│  ├── Required field validation                                          │
│  ├── Custom field support (stored in JSONB custom_fields)               │
│  ├── Edit mode and read-only view mode                                  │
│  └── Lookup search modal with debounced search                          │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

**Phase 4 Key Files**:

- `src/components/admin/crm/dynamic-record-form.tsx` - Main form component
- `src/components/admin/crm/fields/` - 11 field renderer files (16 types)
  - `field-types.ts` - Shared types and type guards
  - `text-field.tsx` - TextField, EmailField, PhoneField, UrlField
  - `textarea-field.tsx` - TextAreaField
  - `rich-text-field.tsx` - RichTextField with markdown toolbar
  - `number-field.tsx` - NumberField, CurrencyField, PercentField
  - `date-field.tsx` - DateField, DateTimeField
  - `checkbox-field.tsx` - CheckboxField
  - `picklist-field.tsx` - PicklistField, MultiPicklistField
  - `lookup-field.tsx` - LookupField, MasterDetailField
  - `formula-field.tsx` - FormulaField (read-only)
  - `auto-number-field.tsx` - AutoNumberField (read-only)
- `src/app/actions/object-metadata.ts` - Server actions for metadata & lookup
- `src/components/ui/collapsible.tsx` - Radix Collapsible wrapper

#### List Views & Record Pages (Phase 5 Complete)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     LIST VIEWS & RECORD PAGES                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  DynamicListView Component:                                              │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ Features:                                                        │   │
│  │ ├── Metadata-driven columns from field_definitions               │   │
│  │ ├── URL-based sorting (sort/dir search params)                   │   │
│  │ ├── Text search across searchable fields                         │   │
│  │ ├── Pagination with page size control                            │   │
│  │ ├── Row selection with checkbox column                           │   │
│  │ ├── Bulk actions (delete selected)                               │   │
│  │ └── Type-specific cell formatters                                │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  Cell Formatters (by field type):                                        │
│  ┌────────────┬────────────────────────────────────────────────────┐   │
│  │ Type       │ Formatting                                         │   │
│  ├────────────┼────────────────────────────────────────────────────┤   │
│  │ Date       │ Locale-formatted date                              │   │
│  │ DateTime   │ Locale-formatted date+time                         │   │
│  │ Currency   │ USD currency format                                │   │
│  │ Percent    │ Percentage with suffix                             │   │
│  │ Picklist   │ Badge with value                                   │   │
│  │ Checkbox   │ Check/X icon                                       │   │
│  │ Lookup     │ Display linked record name                         │   │
│  └────────────┴────────────────────────────────────────────────────┘   │
│                                                                          │
│  Record Detail Page Wrapper:                                             │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ ├── Header with record name and quick actions                   │   │
│  │ ├── View mode (default) with Edit button                        │   │
│  │ ├── Edit mode with Save/Cancel buttons                          │   │
│  │ ├── Delete confirmation dialog                                  │   │
│  │ ├── Related records tabs (configurable per object)              │   │
│  │ └── Uses DynamicRecordForm for field rendering                  │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  Activity Timeline Component:                                            │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ ├── Chronological display of activities                         │   │
│  │ ├── Type filtering (task, event, call, email, note)             │   │
│  │ ├── Type-specific icons and colors                              │   │
│  │ ├── Inline completion toggle for tasks/events                   │   │
│  │ ├── Due date and overdue highlighting                           │   │
│  │ └── Priority badges for high priority items                     │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

**Phase 5 Key Files**:

- `src/app/actions/crm-records.ts` - Generic CRUD server actions
  - `getRecords` - Fetch with filters, sort, pagination, search
  - `getRecordById` - Single record lookup
  - `createRecord` - Insert new record
  - `updateRecord` - Update existing record
  - `deleteRecord` - Delete single record
  - `bulkDeleteRecords` - Delete multiple records
  - `getRelatedRecords` - Fetch by relationship field
- `src/components/admin/crm/dynamic-list-view.tsx` - Metadata-driven list view
- `src/components/admin/crm/record-detail-page.tsx` - Detail page wrapper
- `src/components/admin/crm/new-record-page.tsx` - Create record wrapper
- `src/components/admin/crm/related-records-list.tsx` - Related records table
- `src/components/admin/crm/activity-timeline.tsx` - Activity timeline display

**CRM Object Pages**:

| Object      | List View              | Detail View                 | New Record                 |
| ----------- | ---------------------- | --------------------------- | -------------------------- |
| Contact     | `/admin/contacts`      | `/admin/contacts/[id]`      | `/admin/contacts/new`      |
| Account     | `/admin/accounts`      | `/admin/accounts/[id]`      | `/admin/accounts/new`      |
| Lead        | `/admin/crm-leads`     | `/admin/crm-leads/[id]`     | `/admin/crm-leads/new`     |
| Opportunity | `/admin/opportunities` | `/admin/opportunities/[id]` | `/admin/opportunities/new` |

**Contact Data Model**:

```typescript
interface CrmContact {
  id: string
  organization_id: string
  owner_id: string

  // Name
  first_name: string
  last_name: string

  // Contact Info
  email?: string
  phone?: string
  mobile_phone?: string

  // Address
  mailing_street?: string
  mailing_city?: string
  mailing_state?: string
  mailing_postal_code?: string
  mailing_country?: string

  // Doula-specific
  due_date?: string
  birth_date?: string
  medical_info?: object
  birth_preferences?: object
  emergency_contact?: object

  // Source tracking
  lead_source?: string
  lead_source_detail?: string

  // Extensibility
  custom_fields?: object
}
```

**Opportunity Data Model**:

```typescript
interface CrmOpportunity {
  id: string
  organization_id: string
  account_id?: string
  contact_id?: string
  owner_id: string

  name: string
  description?: string

  // Value
  amount?: number
  probability?: number // Auto-set from stage
  expected_revenue?: number // Auto-calculated

  // Stage
  stage: OpportunityStage
  forecast_category?: ForecastCategory

  // Dates
  close_date?: string
  actual_close_date?: string

  // Service
  service_type?: string

  // Lead conversion
  converted_from_lead_id?: string

  custom_fields?: object
}
```

**Implementation Status**:

- [x] Phase 1: Metadata foundation (object_definitions, field_definitions)
- [x] Phase 2: Core CRM tables (contacts, accounts, leads, opportunities, activities)
- [x] Phase 3: Admin Setup UI for Objects & Fields
- [x] Phase 4: Dynamic Record Forms
- [x] Phase 5: List Views & Record Pages
- [x] Phase 6: Lead Conversion Wizard
- [x] Phase 7: Data Migration from legacy leads ✅ **COMPLETE**
- [x] Phase 8: Field-Level Security ✅ **COMPLETE**
- [x] Phase 9: Record-Level Security (Sharing Rules) ✅ **COMPLETE**
- [x] Phase 10: Integration with Existing Features ✅ **COMPLETE**

**Future Enhancements** (Post-Phase 10):

| Priority   | Enhancement               | Description                                                            |
| ---------- | ------------------------- | ---------------------------------------------------------------------- |
| **HIGH**   | E2E Testing               | Comprehensive Playwright tests for all CRM functionality (Phases 1-10) |
| **HIGH**   | Client Portal Integration | Ensure Client Portal fully leverages new Admin CRM data                |
| **MEDIUM** | Reports & Dashboards      | Visual analytics for leads, opportunities, activities                  |
| **MEDIUM** | Email Integration         | Log emails as CRM activities, send from CRM                            |
| **LOW**    | Automated Lead Scoring    | ML-based lead qualification scoring                                    |
| **LOW**    | Marketing Automation      | Drip campaigns triggered by CRM events                                 |
| **LOW**    | Mobile CRM Views          | Responsive/native mobile experience                                    |

#### Field-Level Security (Phase 8 Complete)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     FIELD-LEVEL SECURITY                                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Security Model:                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │ field_permissions Table                                          │   │
│  │ ├── role_id          → Which role this permission applies to     │   │
│  │ ├── field_definition_id → Which field                            │   │
│  │ ├── is_visible       → Can the role SEE this field?              │   │
│  │ └── is_editable      → Can the role EDIT this field?             │   │
│  │                                                                   │   │
│  │ Default Behavior: If no explicit permission exists, field is     │   │
│  │                   VISIBLE and EDITABLE (default-allow pattern)   │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  Admin UI (/admin/setup/field-permissions):                             │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │ ┌─────────────┐  ┌─────────────┐                                │   │
│  │ │ Select Role │  │ Select Object │                              │   │
│  │ └─────────────┘  └─────────────┘                                │   │
│  │                                                                   │   │
│  │ Permission Matrix:                                                │   │
│  │ ┌────────────────────┬──────────┬──────────┐                    │   │
│  │ │ Field              │ Visible  │ Editable │                    │   │
│  │ ├────────────────────┼──────────┼──────────┤                    │   │
│  │ │ First Name         │    ✓     │    ✓     │                    │   │
│  │ │ Email              │    ✓     │    ✓     │                    │   │
│  │ │ Medical Info ⚠     │    ☐     │    ☐     │ ← Sensitive       │   │
│  │ │ Birth Preferences ⚠│    ✓     │    ☐     │ ← Read-only       │   │
│  │ └────────────────────┴──────────┴──────────┘                    │   │
│  │                                                                   │   │
│  │ Actions: [Copy From Role] [Reset to Defaults] [Save]            │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  Integration Points:                                                     │
│  • DynamicRecordForm - editableFieldIds prop for field-level control    │
│  • Server Actions - filterRecordData(), filterUpdateData() utilities     │
│  • Roles Table - Quick link to field permissions per role               │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

**Phase 8 Key Files**:

- `src/lib/crm/field-security.ts` - Field security utility functions
  - `checkFieldAccess()` - Check if user can read/write a field
  - `filterFieldsByPermissions()` - Get visible/editable fields for user
  - `filterRecordData()` - Strip restricted fields from record data
  - `filterUpdateData()` - Remove unauthorized fields from updates
  - `buildPermissionMatrix()` - Build UI-friendly permission data
- `src/app/actions/field-security.ts` - Server actions
  - `getFieldPermissionMatrix()` - Get permissions for admin UI
  - `bulkSetFieldPermissions()` - Save multiple permissions
  - `copyFieldPermissions()` - Clone from another role
  - `getAccessibleFieldsForObject()` - Runtime permission check
- `src/app/admin/setup/field-permissions/page.tsx` - Admin UI page
- `src/app/admin/setup/field-permissions/field-permissions-selector.tsx` - Role/object selection
- `src/components/admin/setup/field-permissions-matrix.tsx` - Permission matrix UI

#### Record-Level Security (Phase 9 Complete)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                   RECORD-LEVEL SECURITY (SHARING)                        │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Salesforce-Style Sharing Model:                                         │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │                                                                    │  │
│  │  Access Evaluation (Additive - Higher Privilege Wins)             │  │
│  │                                                                    │  │
│  │  1. OWNER ACCESS                                                  │  │
│  │     └── Record owner always has full_access                       │  │
│  │                                                                    │  │
│  │  2. ORGANIZATION-WIDE DEFAULTS (OWD)                             │  │
│  │     ├── private      → Only owner (no default access)            │  │
│  │     ├── read         → All users can view                        │  │
│  │     ├── read_write   → All users can view/edit                   │  │
│  │     └── full_access  → All users have full control               │  │
│  │                                                                    │  │
│  │  3. ROLE HIERARCHY                                                │  │
│  │     └── Managers see subordinates' records via hierarchy_level   │  │
│  │         (Lower hierarchy_level = more privileged)                │  │
│  │                                                                    │  │
│  │  4. SHARING RULES (Automatic)                                    │  │
│  │     ├── criteria_based → Share when record matches conditions    │  │
│  │     └── owner_based    → Share records owned by specific role    │  │
│  │                                                                    │  │
│  │  5. MANUAL SHARES (Ad-hoc)                                       │  │
│  │     └── Owner grants access to specific users/roles              │  │
│  │         (supports expiration dates)                               │  │
│  │                                                                    │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  Database Tables:                                                        │
│  ┌────────────────────┬─────────────────────────────────────────────┐  │
│  │ sharing_rules      │ Automatic criteria/owner-based sharing       │  │
│  │                    │ - rule_type: criteria | owner_based          │  │
│  │                    │ - share_with_type: user | role | public_group│  │
│  │                    │ - access_level: read | read_write            │  │
│  │                    │ - criteria: JSON condition matching          │  │
│  ├────────────────────┼─────────────────────────────────────────────┤  │
│  │ manual_shares      │ Ad-hoc record sharing by owner               │  │
│  │                    │ - share_with_type: user | role               │  │
│  │                    │ - access_level: read | read_write            │  │
│  │                    │ - expires_at: optional expiration            │  │
│  │                    │ - reason: audit trail for why shared         │  │
│  ├────────────────────┼─────────────────────────────────────────────┤  │
│  │ record_share_summary│ Computed effective sharing (performance)    │  │
│  │                    │ - Materialized view of who can access what   │  │
│  └────────────────────┴─────────────────────────────────────────────┘  │
│                                                                          │
│  Admin UI (/admin/setup/sharing-rules):                                  │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │                                                                    │  │
│  │  Tab 1: Organization-Wide Defaults                                │  │
│  │  ┌─────────────────┬──────────────────────────────────────────┐  │  │
│  │  │ Object          │ Sharing Model                             │  │  │
│  │  ├─────────────────┼──────────────────────────────────────────┤  │  │
│  │  │ Contact         │ [Private ▼]                               │  │  │
│  │  │ Account         │ [Private ▼]                               │  │  │
│  │  │ Lead            │ [Public Read Only ▼]                      │  │  │
│  │  │ Opportunity     │ [Private ▼]                               │  │  │
│  │  └─────────────────┴──────────────────────────────────────────┘  │  │
│  │                                                                    │  │
│  │  Tab 2: Sharing Rules                                             │  │
│  │  ┌─────────────────────────────────────────────────────────────┐ │  │
│  │  │ + New Sharing Rule                                          │ │  │
│  │  │                                                              │ │  │
│  │  │ ┌──────────────────────────────────────────────────────┐   │ │  │
│  │  │ │ "VIP Clients to Admins"                    [Active]  │   │ │  │
│  │  │ │ Object: Contact                                       │   │ │  │
│  │  │ │ Share with: admin role → Read/Write                   │   │ │  │
│  │  │ │ Criteria: lead_source equals "referral"              │   │ │  │
│  │  │ └──────────────────────────────────────────────────────┘   │ │  │
│  │  └─────────────────────────────────────────────────────────────┘ │  │
│  │                                                                    │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  Record Detail Component (RecordSharingPanel):                          │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │ Sharing                                        [+ Share]          │  │
│  │ 2 people have access                                              │  │
│  │ ┌─────────────────────────────────────────────────────────────┐  │  │
│  │ │ 👑 Sarah Johnson (owner)                    [Full Access]   │  │  │
│  │ │ 👤 Mike Smith                               [Read]          │  │  │
│  │ │    "Covering while on leave"  Expires: Jan 15, 2025  [🗑️]  │  │  │
│  │ └─────────────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  Key Database Function (RLS Integration):                                │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │ check_record_access(                                              │  │
│  │   p_object_api_name,    -- 'Contact', 'Opportunity', etc.         │  │
│  │   p_record_id,          -- UUID of the record                     │  │
│  │   p_record_owner_id,    -- Record's owner                         │  │
│  │   p_record_org_id,      -- Organization                           │  │
│  │   p_user_id,            -- User requesting access (default auth)  │  │
│  │   p_access_type         -- 'read' or 'write'                      │  │
│  │ ) RETURNS BOOLEAN                                                 │  │
│  │                                                                    │  │
│  │ Evaluation order: owner → OWD → hierarchy → shares → rules       │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

**Phase 9 Key Files**:

- `supabase/migrations/20251220000000_record_level_security.sql` - Database migration
  - Tables: `sharing_rules`, `manual_shares`, `record_share_summary`
  - Functions: `check_record_access()`, `get_record_sharing_info()`, `grant_record_share()`, `revoke_record_share()`
  - Triggers for maintaining share summary
- `src/lib/crm/record-sharing.ts` - Record sharing utility functions
  - `evaluateRecordAccess()` - Main access evaluation function
  - `evaluateCriteria()` - JSON criteria condition matching
  - `compareAccessLevels()` - Determine higher privilege
  - `satisfiesAccess()` - Check if access level meets requirement
  - `hasHierarchyAccess()` - Role hierarchy check
  - `getAccessSourceDescription()` - Human-readable access explanations
- `src/app/actions/sharing-rules.ts` - Server actions
  - `getSharingRules()` / `createSharingRule()` / `updateSharingRule()` / `deleteSharingRule()`
  - `toggleSharingRuleActive()` - Enable/disable rules
  - `getManualShares()` / `createManualShare()` / `deleteManualShare()`
  - `checkRecordAccess()` - Runtime access check
  - `getRecordSharingInfo()` - Get all access grants for a record
  - `getObjectSharingSettings()` / `updateObjectSharingModel()`
- `src/app/admin/setup/sharing-rules/page.tsx` - Admin UI page
- `src/app/admin/setup/sharing-rules/sharing-rules-manager.tsx` - Full CRUD for sharing rules and OWD
- `src/components/crm/record-sharing-panel.tsx` - Record detail sharing component

**Criteria Condition Operators**:

| Operator       | Description               | Example                                |
| -------------- | ------------------------- | -------------------------------------- |
| `equals`       | Exact match               | `status equals 'vip'`                  |
| `not_equals`   | Not equal                 | `stage not_equals 'closed_lost'`       |
| `contains`     | String/array contains     | `tags contains 'premium'`              |
| `not_contains` | Does not contain          | `notes not_contains 'confidential'`    |
| `starts_with`  | String prefix match       | `email starts_with 'admin@'`           |
| `greater_than` | Numeric/string comparison | `amount greater_than 5000`             |
| `less_than`    | Numeric/string comparison | `probability less_than 50`             |
| `is_null`      | Field is null/undefined   | `partner_id is_null`                   |
| `is_not_null`  | Field has value           | `due_date is_not_null`                 |
| `in`           | Value in array            | `stage in ['proposal', 'negotiation']` |

#### Integration with Existing Features (Phase 10 Complete)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                   PHASE 10: SYSTEM INTEGRATION                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  1. SECURE RECORD DETAIL PAGES                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │ SecureRecordDetailPage Component                                    │ │
│  │ ├── Integrates Field-Level Security                                │ │
│  │ │   └── Filters fields based on user role permissions              │ │
│  │ ├── Integrates Record-Level Security                               │ │
│  │ │   └── Checks canEdit/canDelete via sharing evaluation            │ │
│  │ ├── RecordSharingPanel Tab                                         │ │
│  │ │   └── View/manage who has access to this record                  │ │
│  │ └── Read-only banner for restricted users                          │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│  2. ENHANCED RLS POLICIES                                               │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │ Database-Level Record Security                                      │ │
│  │ ├── can_access_crm_record() function                               │ │
│  │ │   ├── Checks organization boundary                               │ │
│  │ │   ├── Grants admin full access                                   │ │
│  │ │   ├── Grants owner full access                                   │ │
│  │ │   ├── Applies OWD (sharing_model)                                │ │
│  │ │   ├── Evaluates role hierarchy                                   │ │
│  │ │   ├── Checks manual_shares                                       │ │
│  │ │   └── Evaluates sharing_rules                                    │ │
│  │ └── All CRM tables use this for SELECT/UPDATE policies            │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│  3. CLIENT PORTAL INTEGRATION                                           │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │ CRM Contact ←→ Portal Client Bridge                                 │ │
│  │ ├── getClientCrmLink() - Find CRM contact for portal user          │ │
│  │ ├── getPortalContactData() - Filtered contact data for portal      │ │
│  │ ├── updatePortalContactInfo() - Portal → CRM updates               │ │
│  │ └── PORTAL_HIDDEN_FIELDS - Excludes sensitive CRM fields           │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│  4. OPPORTUNITY → INVOICE INTEGRATION                                   │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │ Auto-Invoice on Closed-Won                                          │ │
│  │ ├── handleOpportunityStageChange() - Trigger on stage change       │ │
│  │ ├── shouldGenerateInvoice() - Validation checks                    │ │
│  │ ├── generateInvoiceFromOpportunity() - Create invoice              │ │
│  │ ├── invoices.opportunity_id FK - Links invoice to opportunity      │ │
│  │ └── opportunity.custom_fields.invoice_id - Reverse link            │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│  5. CRM → WORKFLOW AUTOMATION                                           │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │ CRM Triggers for Workflows                                          │ │
│  │ ├── triggerCrmWorkflows() - Find and execute matching workflows    │ │
│  │ ├── Supported Events:                                               │ │
│  │ │   ├── record_create, record_update, field_change                 │ │
│  │ │   ├── stage_change (leads, opportunities)                        │ │
│  │ │   └── activity_completed, activity_scheduled                     │ │
│  │ ├── createActivityFromWorkflow() - Create tasks from workflows     │ │
│  │ └── Re-entry Rules - prevent duplicate workflow executions         │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

**Phase 10 Key Files**:

- `src/components/admin/crm/secure-record-detail-page.tsx` - Secure record page wrapper
  - Integrates field permissions, record access, and sharing panel
  - Shows read-only banner for users without edit access
  - Adds "Sharing" tab with RecordSharingPanel
- `src/lib/crm/record-security-context.ts` - Security context computation
  - `getRecordSecurityContext()` - Compute full security context server-side
  - `serializeSecurityContext()` / `deserializeSecurityContext()` - For client components
  - Returns: isOwner, canEdit, canDelete, canManageSharing, visibleFieldIds, editableFieldIds
- `supabase/migrations/20251212010000_enhance_crm_rls_with_sharing.sql` - Enhanced RLS
  - `can_access_crm_record()` - Unified access control function
  - Updated SELECT/UPDATE policies for all CRM tables
- `src/app/actions/crm-portal-integration.ts` - Portal integration
  - `getClientCrmLink()` - Map portal user to CRM contact
  - `getPortalContactData()` - Filtered CRM data for portal
  - `updatePortalContactInfo()` - Sync portal updates to CRM
- `src/app/actions/crm-invoicing-integration.ts` - Invoice integration
  - `generateInvoiceFromOpportunity()` - Create invoice from closed-won opp
  - `handleOpportunityStageChange()` - Auto-generate on stage change
  - `getOpportunityInvoices()` - List invoices for an opportunity
- `src/app/actions/crm-workflow-integration.ts` - Workflow integration
  - `triggerCrmWorkflows()` - Find and execute matching workflows
  - `onActivityCreated()` / `onActivityCompleted()` - Activity triggers
  - `onOpportunityStageChange()` / `onLeadStatusChange()` - Stage triggers
  - `createActivityFromWorkflow()` - Workflow action for creating tasks

**Database Migrations**:

- `20251212010000_enhance_crm_rls_with_sharing.sql` - Enhanced RLS with sharing
- `20251212020000_add_invoice_opportunity_link.sql` - Invoice-Opportunity FK
- `20251212030000_extend_workflows_for_crm.sql` - CRM workflow support

---

### 2. Legacy Lead Management (Migrated to CRM)

**Status**: ✅ Migrated to CRM (Phase 7 Complete)
**Location**: `/admin/leads` (legacy), `/admin/crm-leads` (new)

> **Note**: All 15 legacy leads have been migrated to the CRM system. The legacy `/admin/leads` page remains available for reference. New leads should be created in the CRM system at `/admin/crm-leads`.
>
> **Migration Details**:
>
> - Migration dashboard: `/admin/setup/migration`
> - Tracking column: `leads.migrated_to_crm_id` links to `crm_leads.id`
> - Status mapping: new→new, contacted→contacted, scheduled→qualified, client→converted, lost→unqualified
> - Name parsing: Single `name` field split into `first_name` + `last_name`
> - Extra fields preserved in `custom_fields` JSONB

```
┌─────────────────────────────────────────────────────────────┐
│                    LEAD MANAGEMENT (LEGACY)                  │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌────────┐ │
│  │   NEW    │───▶│CONTACTED │───▶│SCHEDULED │───▶│ CLIENT │ │
│  └──────────┘    └──────────┘    └──────────┘    └────────┘ │
│       │                                               │      │
│       └──────────────────┬────────────────────────────┘      │
│                          ▼                                   │
│                    ┌──────────┐                              │
│                    │   LOST   │                              │
│                    └──────────┘                              │
│                                                              │
│  Components:                                                 │
│  ├── Lead List View (search, filter, sort)                  │
│  ├── Lead Detail Page (tabbed interface)                    │
│  ├── Manual Lead Entry (/admin/leads/new)                   │
│  ├── Bulk Actions (status changes, assignments)             │
│  └── Activity Timeline                                      │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Key Files**:

- `src/app/admin/leads/page.tsx` - List view
- `src/app/admin/leads/[id]/page.tsx` - Detail view
- `src/app/admin/leads/new/page.tsx` - New lead form
- `src/app/actions/leads.ts` - Server actions

**Migration Plan**:

| Old Field                  | New Location                       |
| -------------------------- | ---------------------------------- |
| `name`                     | `Contact.first_name + last_name`   |
| `email`, `phone`           | `Contact.email, phone`             |
| `status = 'client'`        | `Opportunity.stage = 'closed_won'` |
| `status = 'new/contacted'` | `Lead.lead_status`                 |
| `service_interest`         | `Opportunity.service_type`         |
| All attribution fields     | Contact (preserved)                |

---

### 3. Client Portal (CRM-Integrated - Phase 11)

**Status**: ✅ Complete (CRM Integration)
**Location**: `/client`

The client portal now reads/writes directly from CRM tables, providing a unified data experience where admin changes reflect immediately in the portal and vice versa.

```
┌─────────────────────────────────────────────────────────────┐
│              CLIENT PORTAL (CRM-INTEGRATED)                  │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Authentication Flow (CRM-Based):                            │
│  ┌────────┐    ┌────────────┐    ┌────────────────┐        │
│  │ Email  │───▶│ Check CRM  │───▶│ Magic Link     │        │
│  │ Entry  │    │ contacts & │    │ to Dashboard   │        │
│  └────────┘    │ leads      │    └────────────────┘        │
│                └────────────┘                               │
│                      │                                       │
│        ┌─────────────┴─────────────┐                        │
│        ▼                           ▼                        │
│  ┌──────────────┐          ┌──────────────┐                │
│  │ CRM Contact  │          │ CRM Lead     │                │
│  │ (Full Access)│          │ (Limited)    │                │
│  └──────────────┘          └──────────────┘                │
│                                                              │
│  Data Sources (by CRM Record Type):                         │
│  ┌──────────────────────────────────────────────┐           │
│  │ CONTACT (Full Portal):                        │           │
│  │ ├── Dashboard: crm_contacts + crm_activities │           │
│  │ ├── Services:  crm_opportunities (closed_won)│           │
│  │ ├── Meetings:  crm_activities (events/calls) │           │
│  │ ├── Profile:   crm_contacts (editable)       │           │
│  │ └── Account:   crm_accounts (household)      │           │
│  ├──────────────────────────────────────────────┤           │
│  │ LEAD (Limited Portal):                        │           │
│  │ ├── Dashboard: crm_leads (basic info)        │           │
│  │ ├── Profile:   crm_leads (read-only)         │           │
│  │ └── Messages:  Available                      │           │
│  └──────────────────────────────────────────────┘           │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Portal-CRM Data Flow**:

| Portal Page | CRM Source                                            | Access Level                 |
| ----------- | ----------------------------------------------------- | ---------------------------- |
| Dashboard   | `crm_contacts` / `crm_leads` + activities             | Contact: Full, Lead: Limited |
| Services    | `crm_opportunities` (WHERE is_won = true)             | Contact Only                 |
| Meetings    | `crm_activities` (WHERE activity_type IN event, call) | Contact Only                 |
| Profile     | `crm_contacts` / `crm_leads`                          | Contact: Edit, Lead: View    |
| Invoices    | `invoices` (via opportunity link)                     | Contact Only                 |

**Key Files**:

- `src/app/actions/client-auth.ts` - CRM-based authentication
  - `findCrmClient()` - Checks crm_contacts then crm_leads
  - `getClientSession()` - Returns CRM record type + data
  - `grantPortalAccess()` / `revokePortalAccess()` - Admin controls
  - `loginAsClient()` - Admin impersonation
- `src/app/actions/portal-crm-data.ts` - Portal data fetching from CRM
  - `getPortalProfile()` - Contact/Lead profile data
  - `getPortalOpportunities()` - Services for portal
  - `getPortalMeetings()` - Activities for meetings page
  - `getPortalAccount()` - Household account info
- `src/components/admin/crm/portal-access-manager.tsx` - Admin UI for portal access

**Portal Access Control**:

- `portal_access_enabled` flag on both `crm_contacts` and `crm_leads`
- Admin can grant/revoke via Portal Access tab on Contact/Lead detail pages
- Session stores `crm_record_type` ('contact' | 'lead') and `crm_record_id`
- Lead conversion automatically transfers portal access to new Contact

**Authentication**:

- Magic link tokens with 24-hour expiry
- bcrypt hashing (12 rounds) for session tokens
- 30-day session persistence
- Sessions reference CRM record (not legacy leads table)

**Database Migration**: `supabase/migrations/20251221000000_portal_crm_auth.sql`

- Adds `crm_record_type` and `crm_record_id` to `client_sessions`
- Adds `portal_access_enabled` to `crm_contacts` and `crm_leads`

**Next Steps**:

- [ ] Add birth plan editor
- [ ] Implement photo gallery for birth photos
- [ ] Add preference center for communication settings

---

### 4. Workflow Automation

**Status**: ✅ Complete (Core), 🔄 Ongoing refinement
**Location**: `/admin/workflows`

```
┌─────────────────────────────────────────────────────────────┐
│                 WORKFLOW AUTOMATION ENGINE                   │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Trigger Types:                                              │
│  ┌────────────────┬───────────────────────────────────────┐ │
│  │ record_create  │ When a new record is created          │ │
│  │ record_update  │ When any field changes                │ │
│  │ field_change   │ When specific field changes           │ │
│  │ scheduled      │ At specific time (cron)               │ │
│  │ manual         │ User-triggered execution              │ │
│  │ form_submit    │ When intake form submitted            │ │
│  │ payment_received│ When payment recorded               │ │
│  └────────────────┴───────────────────────────────────────┘ │
│                                                              │
│  Visual Canvas:                                              │
│  ┌─────────┐                                                │
│  │ Trigger │                                                │
│  └────┬────┘                                                │
│       ▼                                                     │
│  ┌─────────┐    ┌─────────┐                                │
│  │ Action  │───▶│ Decision│                                │
│  └─────────┘    └────┬────┘                                │
│                 ┌────┴────┐                                 │
│                 ▼         ▼                                 │
│            ┌───────┐ ┌───────┐                             │
│            │ Yes   │ │ No    │                             │
│            │ Branch│ │ Branch│                             │
│            └───┬───┘ └───┬───┘                             │
│                ▼         ▼                                  │
│            ┌───────┐ ┌───────┐                             │
│            │ Wait  │ │ Email │                             │
│            └───────┘ └───────┘                             │
│                                                              │
│  Action Types:                                               │
│  • send_email - Send templated email                        │
│  • send_sms - Send text message (stubbed)                   │
│  • create_task - Create action item                         │
│  • update_field - Modify record field                       │
│  • wait - Delay execution (hours/days)                      │
│  • decision - Branch based on conditions                    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Key Files**:

- `src/app/admin/workflows/page.tsx` - Workflow list
- `src/app/admin/workflows/[id]/page.tsx` - Canvas builder
- `src/lib/workflows/engine.ts` - Execution engine
- `src/lib/workflows/types.ts` - Type definitions
- `src/app/api/workflows/process/route.ts` - Processing endpoint
- `src/app/api/cron/workflow-scheduler/route.ts` - Scheduled triggers

**Data Model**:

```typescript
interface Workflow {
  id: string
  name: string
  description?: string
  object_type: 'lead' | 'meeting' | 'payment' | 'invoice' | 'service' | ...
  trigger_type: 'record_create' | 'field_change' | 'scheduled' | ...
  trigger_config: TriggerConfig
  is_active: boolean
  canvas_data: {
    nodes: WorkflowNode[]
    edges: WorkflowEdge[]
  }
  entry_criteria: FilterCondition[]
  reentry_mode: 'always' | 'once' | 'once_per_day' | 'once_per_week'
  execution_count: number
}
```

**Next Steps**:

- [ ] Add more action types (create_meeting, assign_team_member)
- [ ] Implement workflow versioning
- [ ] Add A/B testing for email variants
- [ ] Build workflow analytics dashboard

---

### 5. Unified Messaging

**Status**: ✅ Complete
**Location**: `/admin/messages`, `/client/(portal)/messages`

```
┌─────────────────────────────────────────────────────────────┐
│                   MESSAGING SYSTEM                           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Architecture:                                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                    Supabase Realtime                    │ │
│  │                         │                               │ │
│  │    ┌───────────────────┼───────────────────┐           │ │
│  │    │                   │                   │           │ │
│  │    ▼                   ▼                   ▼           │ │
│  │ ┌──────┐         ┌──────────┐        ┌──────────┐     │ │
│  │ │Admin │         │Conversations│      │ Client   │     │ │
│  │ │Inbox │◀───────▶│  Table     │◀─────▶│ Portal   │     │ │
│  │ └──────┘         └──────────┘        └──────────┘     │ │
│  │                        │                               │ │
│  │                        ▼                               │ │
│  │                  ┌──────────┐                          │ │
│  │                  │ Messages │                          │ │
│  │                  │  Table   │                          │ │
│  │                  └──────────┘                          │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  Features:                                                   │
│  • Thread-based conversations                               │
│  • Real-time message delivery                               │
│  • Unread badge tracking                                    │
│  • Archive/close/reopen threads                             │
│  • Search by client or content                              │
│  • Floating chat widget (client portal)                     │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Key Files**:

- `src/app/admin/messages/page.tsx` - Admin inbox
- `src/app/client/(portal)/messages/page.tsx` - Client inbox
- `src/app/actions/messaging.ts` - Server actions
- `src/components/client/chat-widget/` - Floating widget

**Next Steps**:

- [ ] Add typing indicators
- [ ] Implement message reactions
- [ ] Add file attachments in messages
- [ ] Build canned response library

---

### 6. Invoicing & Payments

**Status**: ✅ Complete (Core), 🔄 Stripe integration stubbed
**Location**: `/admin/leads/[id]` (Payments tab), `/client/(portal)/invoices`

```
┌─────────────────────────────────────────────────────────────┐
│                 INVOICING & PAYMENTS                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Invoice Lifecycle:                                          │
│  ┌───────┐   ┌──────┐   ┌──────┐   ┌──────┐               │
│  │ Draft │──▶│ Sent │──▶│ Paid │   │Overdue│               │
│  └───────┘   └──────┘   └──┬───┘   └──────┘               │
│                    │       │           ▲                    │
│                    │       ▼           │                    │
│                    │   ┌───────┐       │                    │
│                    │   │Partial│───────┘                    │
│                    │   └───────┘                            │
│                    ▼                                        │
│              ┌──────────┐                                   │
│              │Cancelled │                                   │
│              └──────────┘                                   │
│                                                              │
│  Features:                                                   │
│  • Auto-generated invoice numbers                           │
│  • Line items with quantity/price                           │
│  • Tax and discount support                                 │
│  • Payment link generation (Stripe Checkout)                │
│  • Multiple payment methods (card, check, cash, etc.)       │
│  • Payment history tracking                                 │
│  • Refund processing                                        │
│  • Overdue alerts on dashboard                              │
│                                                              │
│  Stripe Integration (Stubbed):                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │ createInvoiceCheckout() - Payment link             │    │
│  │ getCheckoutSession()    - Session status           │    │
│  │ getPaymentIntent()      - Payment details          │    │
│  │ createRefund()          - Process refunds          │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Key Files**:

- `src/app/actions/invoices.ts` - Invoice operations
- `src/app/actions/payments.ts` - Payment tracking
- `src/lib/stripe/payments.ts` - Stripe utilities
- `src/app/api/webhooks/stripe-payments/route.ts` - Webhook handler

**Next Steps**:

- [ ] Complete Stripe live integration
- [ ] Add recurring invoices
- [ ] Implement payment plans (installments)
- [ ] Add receipt generation

---

### 7. Team Management

**Status**: ✅ Complete
**Location**: `/admin/team`

```
┌─────────────────────────────────────────────────────────────┐
│                   TEAM MANAGEMENT                            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Team Member Roles:                                          │
│  ┌─────────┬────────────────────────────────────────────┐  │
│  │ Owner   │ Full access, billing, can delete org       │  │
│  │ Admin   │ All features, user management              │  │
│  │ Provider│ Client access, limited admin features      │  │
│  │ Viewer  │ Read-only access                           │  │
│  └─────────┴────────────────────────────────────────────┘  │
│                                                              │
│  Client Assignments:                                         │
│  ┌──────────┐      ┌──────────┐      ┌──────────┐         │
│  │  Client  │◀────▶│Assignment│◀────▶│Team Member│         │
│  └──────────┘      └────┬─────┘      └──────────┘         │
│                         │                                   │
│                    Role Types:                              │
│                    • primary                                │
│                    • backup                                 │
│                    • support                                │
│                                                              │
│  Features:                                                   │
│  • Team member profiles (certifications, specialties)       │
│  • Client capacity limits                                   │
│  • On-call scheduling                                       │
│  • Time tracking per client                                 │
│  • Revenue sharing configuration                            │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Key Files**:

- `src/app/admin/team/page.tsx` - Team overview
- `src/app/actions/team.ts` - Team operations
- `src/components/admin/team/` - Team components

**Next Steps**:

- [ ] Add team member availability calendar
- [ ] Implement shift scheduling
- [ ] Add performance metrics dashboard

---

### 8. Reports & Dashboards

**Status**: ✅ Complete
**Location**: `/admin/reports`, `/admin/dashboards`

```
┌─────────────────────────────────────────────────────────────┐
│               REPORTS & DASHBOARDS                           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Report Builder Workflow:                                    │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐   │
│  │ Source │▶│ Fields │▶│ Filter │▶│ Group  │▶│ Chart  │   │
│  └────────┘ └────────┘ └────────┘ └────────┘ └────────┘   │
│                                                              │
│  Data Sources:                                               │
│  • Leads/Clients  • Invoices    • Meetings                 │
│  • Payments       • Services    • Team Members             │
│                                                              │
│  Aggregations:                                               │
│  sum | count | avg | min | max | count_distinct             │
│                                                              │
│  Chart Types:                                                │
│  bar | line | pie | donut | area | scatter                  │
│                                                              │
│  Dashboard Features:                                         │
│  ┌────────────────────────────────────────────────────┐    │
│  │  12-Column Grid Layout                              │    │
│  │  ┌────────┬────────┬────────┐                      │    │
│  │  │ Metric │ Metric │ Metric │                      │    │
│  │  ├────────┴────────┼────────┤                      │    │
│  │  │     Chart       │  List  │                      │    │
│  │  ├─────────────────┼────────┤                      │    │
│  │  │     Funnel      │ Table  │                      │    │
│  │  └─────────────────┴────────┘                      │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  Widget Types:                                               │
│  metric | chart | table | list | funnel | gauge | calendar  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Key Files**:

- `src/app/admin/reports/page.tsx` - Report list
- `src/app/admin/dashboards/page.tsx` - Dashboard list
- `src/app/actions/reports.ts` - Report execution
- `src/components/admin/dashboards/` - Dashboard components

**Next Steps**:

- [ ] Add scheduled report emails
- [ ] Implement report export (PDF, CSV)
- [ ] Add goal tracking widgets
- [ ] Build comparison mode (this month vs last month)

---

### 9. Email & SMS Templates

**Status**: ✅ Email Complete, 🔄 SMS Stubbed
**Location**: `/admin/setup/email-templates`, `/admin/setup/sms-templates`

```
┌─────────────────────────────────────────────────────────────┐
│              EMAIL & SMS TEMPLATES                           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Email System (Resend):                                      │
│  ┌────────────────────────────────────────────────────┐    │
│  │                    React Email                      │    │
│  │  ┌────────────┐   ┌────────────┐   ┌────────────┐ │    │
│  │  │ Base       │   │ Magic Link │   │ Meeting    │ │    │
│  │  │ Template   │   │ Template   │   │ Reminder   │ │    │
│  │  └────────────┘   └────────────┘   └────────────┘ │    │
│  │                                                    │    │
│  │  Variables: {{client_name}}, {{due_date}}, etc.   │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  Pre-built Email Types:                                      │
│  • magic_link          - Client login                       │
│  • welcome             - New client welcome                 │
│  • meeting_scheduled   - Appointment confirmation           │
│  • meeting_reminder    - 24-hour reminder                   │
│  • document_shared     - New document notification          │
│  • payment_received    - Payment confirmation               │
│  • invoice_sent        - Invoice notification               │
│                                                              │
│  SMS System (Twilio - Stubbed):                             │
│  ┌────────────────────────────────────────────────────┐    │
│  │  • Phone validation (E.164 format)                  │    │
│  │  • Segment calculation (160/153 char limits)        │    │
│  │  • Opt-in/opt-out consent tracking                  │    │
│  │  • Template variables                               │    │
│  │  • Bulk SMS support                                 │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Key Files**:

- `src/lib/email/send.ts` - Email sending
- `src/lib/email/templates/` - React Email components
- `src/lib/sms/client.ts` - SMS client (stubbed)
- `src/app/actions/notifications.ts` - Notification logic

**Next Steps**:

- [ ] Complete Twilio SMS integration
- [ ] Add email open/click tracking
- [ ] Implement A/B testing for subject lines
- [ ] Add email scheduling

---

### 10. Contracts & Documents

**Status**: ✅ Complete
**Location**: `/admin/setup/contracts`, Client documents tab

```
┌─────────────────────────────────────────────────────────────┐
│             CONTRACTS & DOCUMENTS                            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Contract Flow:                                              │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐               │
│  │ Template │──▶│ Generate │──▶│  Client  │               │
│  │ Library  │   │ Contract │   │  Signs   │               │
│  └──────────┘   └──────────┘   └────┬─────┘               │
│                                      │                      │
│                                      ▼                      │
│                               ┌──────────┐                  │
│                               │ Stored + │                  │
│                               │ Logged   │                  │
│                               └──────────┘                  │
│                                                              │
│  Document Types:                                             │
│  • contract    - Service agreements                         │
│  • birth_plan  - Client birth preferences                   │
│  • resource    - Educational materials                      │
│  • photo       - Birth/family photos                        │
│  • invoice     - Billing documents                          │
│  • form        - Completed intake forms                     │
│                                                              │
│  Features:                                                   │
│  • Template variables ({{client_name}}, etc.)               │
│  • Signature tracking                                        │
│  • Visibility controls (client-visible or internal)         │
│  • Supabase Storage integration                             │
│  • File type/size tracking                                  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Key Files**:

- `src/app/admin/setup/contracts/page.tsx` - Contract templates
- `src/app/actions/contracts.ts` - Contract operations
- `src/app/actions/documents.ts` - Document management
- `src/app/actions/file-upload.ts` - Storage integration

**Next Steps**:

- [ ] Add e-signature integration (DocuSign/HelloSign)
- [ ] Implement document versioning
- [ ] Add watermarking for shared documents

---

### 11. Multi-Tenancy & SaaS Foundation

**Status**: 🔄 Rails Complete, Feature Integration Ongoing
**Location**: Database layer, `/admin/setup/billing`

```
┌─────────────────────────────────────────────────────────────┐
│              MULTI-TENANCY & SAAS                            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Subscription Tiers:                                         │
│  ┌───────────┬──────────┬────────────┬───────────────────┐ │
│  │           │ Starter  │Professional│ Enterprise        │ │
│  ├───────────┼──────────┼────────────┼───────────────────┤ │
│  │Team       │    3     │    10      │ Unlimited         │ │
│  │Clients    │   50     │   500      │ Unlimited         │ │
│  │Workflows  │    5     │   25       │ Unlimited         │ │
│  │Storage    │  500MB   │    5GB     │ Unlimited         │ │
│  │SMS        │    ❌    │    ✅      │ ✅                │ │
│  │Custom Roles│   ❌    │    ✅      │ ✅                │ │
│  │API Access │    ❌    │    ✅      │ ✅                │ │
│  │Reports    │  Basic   │ Advanced   │ Full              │ │
│  └───────────┴──────────┴────────────┴───────────────────┘ │
│                                                              │
│  Architecture:                                               │
│  ┌────────────────────────────────────────────────────┐    │
│  │              organizations                          │    │
│  │  ┌─────────────────────────────────────────────┐  │    │
│  │  │ id | name | subscription_tier | stripe_id   │  │    │
│  │  └─────────────────────────────────────────────┘  │    │
│  │                      │                             │    │
│  │         ┌────────────┼────────────┐              │    │
│  │         ▼            ▼            ▼              │    │
│  │    ┌────────┐  ┌─────────┐  ┌──────────┐       │    │
│  │    │ leads  │  │ invoices│  │ workflows│       │    │
│  │    │org_id  │  │ org_id  │  │ org_id   │       │    │
│  │    └────────┘  └─────────┘  └──────────┘       │    │
│  │                                                   │    │
│  │  RLS Policies enforce org_id isolation           │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  Feature Flags:                                              │
│  • canUseFeature(feature, tier) - Check access             │
│  • canAddMore(resource, tier, count) - Limit check         │
│  • isWithinLimit(resource, tier, count) - Quota check      │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Key Files**:

- `supabase/migrations/20251215000000_multi_tenancy_foundation.sql`
- `supabase/migrations/20251215020000_subscription_plans.sql`
- `src/lib/features/flags.ts` - Feature flag logic
- `src/app/admin/setup/billing/page.tsx` - Billing management

**Next Steps**:

- [ ] Complete Stripe subscription billing
- [ ] Add usage-based billing support
- [ ] Implement trial periods
- [ ] Add organization onboarding wizard

---

### 12. Attribution & Analytics

**Status**: ✅ Complete
**Location**: Lead tracking, Dashboard analytics

```
┌─────────────────────────────────────────────────────────────┐
│             ATTRIBUTION & ANALYTICS                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  UTM Tracking:                                               │
│  ┌────────────────────────────────────────────────────┐    │
│  │ Lead Sources                                        │    │
│  │ ├── utm_source   (google, facebook, referral)      │    │
│  │ ├── utm_medium   (cpc, email, organic)             │    │
│  │ ├── utm_campaign (specific campaign name)          │    │
│  │ ├── utm_content  (ad variation)                    │    │
│  │ └── utm_term     (keywords)                        │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  Referral Partners:                                          │
│  ┌──────────────┐    ┌──────────────┐                      │
│  │   Partner    │───▶│    Lead      │                      │
│  │ (OB, midwife)│    │referral_id   │                      │
│  └──────────────┘    └──────────────┘                      │
│                                                              │
│  Dashboard Analytics:                                        │
│  • Lead source distribution (donut chart)                   │
│  • Conversion rates by source                               │
│  • Revenue by referral partner                              │
│  • Landing page performance                                 │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Key Files**:

- `src/lib/attribution/` - Attribution tracking
- `src/app/admin/setup/referral-partners/page.tsx` - Partner management
- `src/app/actions/referral-partners.ts` - Partner operations

**Next Steps**:

- [ ] Add multi-touch attribution
- [ ] Implement attribution ROI calculator
- [ ] Add Google Analytics integration

---

### 13. Surveys & NPS

**Status**: ✅ Complete
**Location**: `/admin/setup/surveys`, `/client/survey/[token]`

```
┌─────────────────────────────────────────────────────────────┐
│                SURVEYS & NPS                                 │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Survey Types:                                               │
│  ┌────────┬────────────────────────────────────────────┐   │
│  │ NPS    │ Net Promoter Score (0-10 scale)            │   │
│  │ CSAT   │ Customer Satisfaction                      │   │
│  │ Custom │ Build your own questions                   │   │
│  └────────┴────────────────────────────────────────────┘   │
│                                                              │
│  NPS Calculation:                                            │
│  ┌─────────────────────────────────────────────────────┐   │
│  │   Detractors    │    Passives    │   Promoters     │   │
│  │    (0-6)        │     (7-8)      │     (9-10)      │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  NPS Score = % Promoters - % Detractors                     │
│                                                              │
│  Trigger Options:                                            │
│  • manual         - Send on demand                          │
│  • after_service  - When service completed                  │
│  • after_meeting  - Post-meeting follow-up                  │
│  • workflow       - Triggered by automation                 │
│                                                              │
│  Features:                                                   │
│  • Public token-based survey URLs                           │
│  • Response collection and storage                          │
│  • Sentiment classification                                 │
│  • Aggregate score tracking                                 │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Key Files**:

- `src/app/admin/setup/surveys/page.tsx` - Survey management
- `src/app/client/survey/[token]/page.tsx` - Public survey page
- `src/app/actions/surveys.ts` - Survey operations
- `src/components/ui/nps-scale.tsx` - NPS input component

**Next Steps**:

- [ ] Add survey branching logic
- [ ] Implement testimonial generation from promoters
- [ ] Add survey response analytics dashboard

---

## Database Schema Overview

### 35+ Migration Files

```
supabase/migrations/
├── 20251207000000_initial_schema.sql              # Core: leads, activities, users
├── 20251207020000_phase3_schema.sql               # Client portal tables
├── 20251207030000_client_portal_auth.sql          # Magic link auth
├── 20251207040000_client_management.sql           # Services, meetings, documents
├── 20251208100000_team_members.sql                # Team support
├── 20251209000000_contract_signatures.sql         # E-signature tracking
├── 20251210000000_salesforce_features.sql         # Reports, dashboards
├── 20251211000000_email_templates.sql             # Email system
├── 20251212000000_welcome_packets.sql             # Onboarding automation
├── 20251213000000_workflow_automation.sql         # Workflow engine
├── 20251214000000_unified_messaging.sql           # Messaging system
├── 20251215000000_multi_tenancy_foundation.sql    # Organizations
├── 20251215010000_multi_tenancy_rls_policies.sql  # RLS policies
├── 20251215020000_subscription_plans.sql          # Subscription tiers
├── 20251216000000_sms_templates.sql               # SMS integration
├── 20251216010000_stripe_payment_rails.sql        # Stripe infrastructure
├── 20251217000000_lead_source_attribution.sql     # UTM tracking
├── 20251217010000_client_satisfaction.sql         # Survey system
├── 20251219000000_crm_metadata_foundation.sql     # CRM metadata (NEW)
├── 20251219010000_crm_core_objects.sql            # CRM core tables (NEW)
└── ... (additional migrations)
```

### Key Tables

#### CRM Object Tables (NEW)

| Table                           | Purpose                          |
| ------------------------------- | -------------------------------- |
| `crm_contacts`                  | Person records (clients, family) |
| `crm_accounts`                  | Household/family aggregates      |
| `crm_leads`                     | Unqualified prospects            |
| `crm_opportunities`             | Deals with stage progression     |
| `crm_activities`                | Unified activity log             |
| `contact_account_relationships` | Contact-Account many-to-many     |

#### CRM Metadata Tables (NEW)

| Table                | Purpose                                |
| -------------------- | -------------------------------------- |
| `object_definitions` | Registry of all CRM objects            |
| `field_definitions`  | Field metadata for each object         |
| `picklist_values`    | Valid values for picklist fields       |
| `page_layouts`       | UI layout configuration per object     |
| `record_types`       | Variants of objects (e.g., Lead types) |
| `field_permissions`  | Field-level security per role          |

#### CRM Security Tables (NEW)

| Table                  | Purpose                                      |
| ---------------------- | -------------------------------------------- |
| `sharing_rules`        | Automatic criteria/owner-based sharing       |
| `manual_shares`        | Ad-hoc record sharing by owner               |
| `record_share_summary` | Computed effective sharing (for performance) |

#### Legacy/Core Tables

| Table                                 | Purpose                       |
| ------------------------------------- | ----------------------------- |
| `leads`                               | Legacy leads (to be migrated) |
| `lead_activities`                     | Activity timeline             |
| `client_services`                     | Service assignments           |
| `meetings`                            | Appointments                  |
| `invoices` + `invoice_line_items`     | Billing                       |
| `payments` + `payment_events`         | Payment tracking              |
| `team_members` + `client_assignments` | Team management               |
| `workflows` + `workflow_executions`   | Automation                    |
| `conversations` + `messages`          | Messaging                     |
| `surveys` + `survey_responses`        | NPS/feedback                  |
| `organizations`                       | Multi-tenancy                 |
| `email_templates` + `sms_templates`   | Communication                 |

---

## API Architecture

### Server Actions (27 files, ~400KB)

| File                | Functions                                              |
| ------------------- | ------------------------------------------------------ |
| `leads.ts`          | getLeadById, updateLeadStatus, searchLeads, createLead |
| `invoices.ts`       | generateInvoice, sendInvoice, recordPayment            |
| `messaging.ts`      | createConversation, sendMessage, markAsRead            |
| `workflows.ts`      | createWorkflow, executeWorkflow, getExecutionHistory   |
| `team.ts`           | getTeamMembers, assignClient, trackTime                |
| `reports.ts`        | getDashboardKPIs, executeReport, getRevenueTrend       |
| `surveys.ts`        | createSurvey, recordResponse, calculateNPS             |
| `contracts.ts`      | getTemplate, signContract                              |
| `notifications.ts`  | sendTrackedEmail, getNotificationLog                   |
| `field-security.ts` | getFieldPermissionMatrix, bulkSetFieldPermissions      |
| `sharing-rules.ts`  | getSharingRules, createManualShare, checkRecordAccess  |

### HTTP Endpoints

| Endpoint                             | Purpose                 |
| ------------------------------------ | ----------------------- |
| `POST /api/webhooks/stripe-payments` | Stripe payment webhooks |
| `POST /api/workflows/process`        | Workflow execution      |
| `GET /api/cron/workflow-scheduler`   | Scheduled triggers      |
| `GET /api/cron/meeting-reminders`    | Reminder emails         |

---

## Testing Status

### Playwright E2E Tests

- **Total**: 399 CRM/Portal tests
- **Passed**: 381 tests ✅
- **Skipped**: 18 tests (intentionally deferred)
- **Pass Rate**: **95.5%** (exceeds >95% target)

### CRM E2E Test Coverage

The CRM E2E tests are located in `tests/e2e/crm/` and cover:

| Test File                   | Tests | Status     | Coverage                                          |
| --------------------------- | ----- | ---------- | ------------------------------------------------- |
| `crm-accounts.spec.ts`      | ~35   | ✅ Passing | List, detail, create, edit, search, relationships |
| `crm-contacts.spec.ts`      | ~35   | ✅ Passing | List, detail, create, edit, portal access         |
| `crm-leads.spec.ts`         | ~40   | ✅ Passing | List, detail, create, edit, conversion            |
| `crm-opportunities.spec.ts` | ~40   | ✅ Passing | List, detail, create, edit, stage progression     |
| `portal-crm-sync.spec.ts`   | ~30   | ✅ Passing | Portal-CRM data sync validation                   |
| `client-portal.spec.ts`     | ~20   | ✅ Passing | Dashboard, navigation, page loads                 |

**Skipped Tests** (18 total - intentionally deferred):

- **Create form tests (8)**: Dynamic form submission issue - values clear unexpectedly after button click
- **Cross-portal messaging (4)**: Requires messaging feature data seeding integration
- **Activity detail (2)**: `/admin/activities/[id]` route not yet implemented
- **Other (4)**: Platform-specific test variations

**Test Data Seeding**: `tests/e2e/data-seed.setup.ts`

- Seeds CRM records with known IDs for deterministic testing
- Creates: Account, Contact, Lead, Opportunity, Activities
- Links records properly (contact-account relationships, etc.)

**Key Technical Notes**:

1. **Dynamic Form Selectors**: CRM forms are metadata-driven and don't use standard `name` attributes. Tests use placeholder-based or role-based selectors:

   ```typescript
   // Use this pattern for dynamic forms
   page.locator('input[placeholder*="billing city" i]')
   page.getByRole('textbox', { name: /account name/i })
   ```

2. **Strict Mode & Multiple Element Handling**: Playwright strict mode requires unique selectors. Use `.first()` when elements may match multiple times:

   ```typescript
   // Handle text appearing in multiple places
   page.locator('text=E2E Test Household').first()

   // Handle .or() chains matching multiple elements
   page.locator('text=TX').or(page.locator('text=75001')).first()
   ```

3. **Table Row Navigation**: First name cells are clickable links, not text-based:

   ```typescript
   // Click using href selector, not text
   await page.locator(`a[href*="${RECORD_ID}"]`).first().click()
   ```

4. **Back Navigation Links**: Use href-based selectors for breadcrumb back links:

   ```typescript
   page
     .locator('a[href="/admin/accounts"]')
     .or(page.locator('a:has-text("Back")'))
   ```

5. **Lookup Field Display**: Lookup fields may show UUIDs instead of names. Handle both:

   ```typescript
   page
     .locator('text=E2E Test Household')
     .or(page.locator(`text=${E2E_CRM_ACCOUNT_ID}`))
     .first()
   ```

6. **Supabase Relationship Queries**: When querying tables with multiple FKs to the same table, use explicit FK reference:

   ```typescript
   // picklist_values has two FKs to field_definitions
   picklist_values!field_definition_id (*)
   ```

7. **CRM Table Column Reference**:
   - `crm_accounts`: name, account*type, account_status, billing*\* (no email/phone)
   - `crm_contacts`: first_name, last_name, email, phone (use is_active, not contact_status)
   - `crm_opportunities`: stage_probability (not probability)
   - `crm_activities`: related_to_type/related_to_id, who_type/who_id (not what_id)

### General Coverage Areas

- Admin authentication
- Dashboard KPIs
- CRM objects (Accounts, Contacts, Leads, Opportunities)
- Activities and activity logging
- Team management
- Workflow builder
- Messaging system
- Setup hub
- Portal-CRM sync

---

## Priority Next Steps

### ✅ Phase 11 Complete (E2E Testing)

Phase 11 achieved **95.5% pass rate** (381/399 tests passing). See Testing Status section for details.

### ✅ Phase 12 Progress (Client Portal Enhancement)

**Completed:**

1. ~~**Fix Create Form Submission Issue**~~ - Fixed RLS policy violation by adding `organization_id` to `createRecord` action
2. ~~**Lookup Field Display Fix**~~ - Added UUID detection to `searchLookupRecords` for proper record name display
3. ~~**Implement Activity Detail Route**~~ - Created `/admin/activities/[id]` page with status badges and related tabs
4. ~~**Cross-Portal Messaging Integration**~~ - Tests passing (7 passed, 2 intentionally skipped for advanced scenarios)

**CRM Test Results:** 160 passed, 2 skipped (down from 8+ skipped before fixes)

### Remaining Phase 12 Work

1. **Enable Cross-Portal Visibility Tests** - The 2 skipped bidirectional messaging tests need additional conversation data seeding to link admin and client views
2. **Additional E2E Test Coverage**:
   - `crm-activities.spec.ts` (~12-15 tests) - Activity list, create, edit, delete
   - `crm-lead-conversion.spec.ts` (~10-12 tests) - Full conversion flow testing
   - `crm-field-permissions.spec.ts` (~12-15 tests) - Field-level security tests

### Medium Priority

1. **Complete Stripe Integration** - Enable live payment processing
2. **SMS Integration (Twilio)** - Activate text messaging
3. **E-Signature Integration** - DocuSign/HelloSign for contracts
4. **Report Export** - PDF/CSV export for reports
5. **Lead Scoring** - Automated qualification scoring
6. **Calendar Integration** - Google/Outlook sync

### Future Enhancements

1. **Mobile Responsiveness** - Optimize client portal for mobile
2. **Birth Photo Gallery** - Private photo sharing
3. **Video Calling** - In-app video consultations
4. **Public Booking Page** - Self-service scheduling
5. **Mobile App** - React Native client app

---

## File Structure Summary

```
nurture-nest-birth/
├── src/
│   ├── app/
│   │   ├── admin/          # 41 admin pages
│   │   ├── client/         # 15 client portal pages
│   │   ├── actions/        # 27 server action files
│   │   ├── api/            # HTTP endpoints
│   │   └── (public pages)  # Marketing pages
│   ├── components/
│   │   ├── ui/             # 45+ shadcn components
│   │   ├── admin/          # 50+ admin components
│   │   └── client/         # 10+ client components
│   ├── lib/
│   │   ├── supabase/       # Database client & types
│   │   ├── workflows/      # Workflow engine
│   │   ├── email/          # Email system
│   │   ├── sms/            # SMS client
│   │   ├── stripe/         # Payment integration
│   │   └── permissions/    # RBAC
│   └── config/             # Site configuration
├── supabase/
│   └── migrations/         # 33 migration files
└── tests/
    └── e2e/                # Playwright tests
```

---

## Configuration Files

| File                   | Purpose                |
| ---------------------- | ---------------------- |
| `package.json`         | Dependencies & scripts |
| `next.config.ts`       | Next.js configuration  |
| `tailwind.config.ts`   | Styling configuration  |
| `tsconfig.json`        | TypeScript settings    |
| `playwright.config.ts` | E2E test configuration |
| `.env.local`           | Environment variables  |
| `src/config/site.ts`   | Business configuration |

---

_Documentation generated: December 2024_
_Last Updated: December 12, 2024_
_Project Phase: 9.0 (Record-Level Security Complete)_
