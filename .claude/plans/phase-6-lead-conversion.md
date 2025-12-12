# Phase 6: Lead Conversion Wizard

## Overview

Phase 6 implements a Salesforce-like Lead Conversion wizard that transforms a qualified Lead into Contact, Account, and optionally Opportunity records. This is a critical workflow for the doula CRM.

## Prerequisites

Phases 1-5 are complete:

- ✅ Phase 1: Metadata foundation (object_definitions, field_definitions)
- ✅ Phase 2: Core CRM tables (crm_contacts, crm_accounts, crm_leads, crm_opportunities, crm_activities)
- ✅ Phase 3: Admin Setup UI for Objects & Fields
- ✅ Phase 4: Dynamic Record Forms (DynamicRecordForm component)
- ✅ Phase 5: List Views & Record Pages (CRUD for all objects)

## Phase 6 Requirements

### 1. Lead Conversion Page (`/admin/crm-leads/[id]/convert`)

Create a multi-step conversion wizard:

**Step 1: Create/Select Account**

- Option to create new Account from Lead company data
- Option to select existing Account (search by name)
- Auto-populate Account fields from Lead:
  - `company` → `name`
  - `website` → `website`
  - `industry` → `industry`
  - `number_of_employees` → `number_of_employees`
  - `annual_revenue` → `annual_revenue`

**Step 2: Create Contact**

- Always creates a new Contact
- Auto-populate from Lead:
  - `first_name`, `last_name`, `email`, `phone`, `mobile_phone`
  - `mailing_street`, `mailing_city`, `mailing_state`, `mailing_postal_code`
  - `title` → `title`
  - `lead_source` → `lead_source`
  - Transfer all custom_fields

**Step 3: Create Opportunity (Optional)**

- Checkbox to create Opportunity
- If checked:
  - Name: "{Contact Name} - {Service Type}"
  - Stage: qualification (or configurable)
  - Amount: from Lead if captured
  - Service type selector (doula services)
  - Expected close date

**Step 4: Review & Convert**

- Show summary of what will be created
- Convert button executes the conversion
- On success, redirect to new Contact detail page

### 2. Server Action (`convertLead`)

Create `src/app/actions/lead-conversion.ts`:

```typescript
export async function convertLead(
  leadId: string,
  options: {
    accountId?: string // Use existing account
    createAccount?: boolean // Create new account
    accountData?: Partial<CrmAccount>
    contactData?: Partial<CrmContact>
    createOpportunity?: boolean
    opportunityData?: Partial<CrmOpportunity>
  }
): Promise<{
  success: boolean
  contactId?: string
  accountId?: string
  opportunityId?: string
  error?: string
}>
```

Conversion logic:

1. Validate Lead is not already converted
2. If createAccount, insert new Account
3. Create Contact linked to Account
4. If createOpportunity, create Opportunity linked to Contact & Account
5. Update Lead record:
   - `is_converted = true`
   - `converted_at = now()`
   - `converted_contact_id = contactId`
   - `converted_account_id = accountId`
   - `converted_opportunity_id = opportunityId` (if created)
   - `status = 'converted'`
6. Copy Lead's activities to Contact (update who_id)
7. Return IDs of created records

### 3. UI Components

**LeadConversionWizard** (`src/components/admin/crm/lead-conversion-wizard.tsx`)

- Multi-step form with stepper UI
- Account search/create toggle
- Field mapping preview
- Opportunity creation toggle
- Summary view before conversion

**AccountSearchModal** (reuse or extend existing lookup)

- Search existing accounts
- Display account details for confirmation

### 4. Lead Detail Page Updates

Update `/admin/crm-leads/[id]/page.tsx`:

- Add "Convert Lead" button (already exists, link to convert page)
- Show conversion status badge if converted
- If converted, show links to Contact/Account/Opportunity
- Disable editing on converted leads (or show warning)

## Key Files to Create/Modify

### Create:

- `src/app/admin/crm-leads/[id]/convert/page.tsx` - Conversion page
- `src/app/actions/lead-conversion.ts` - Conversion server action
- `src/components/admin/crm/lead-conversion-wizard.tsx` - Wizard component

### Modify:

- `src/app/admin/crm-leads/[id]/page.tsx` - Add conversion status display

## Database Considerations

The `crm_leads` table already has these conversion tracking fields:

- `is_converted: boolean`
- `converted_at: timestamp`
- `converted_contact_id: uuid`
- `converted_account_id: uuid`
- `converted_opportunity_id: uuid`

No database migrations should be needed.

## Testing Checklist

- [ ] Can navigate to convert page from Lead detail
- [ ] Can create new Account during conversion
- [ ] Can select existing Account during conversion
- [ ] Contact is created with Lead field mappings
- [ ] Opportunity is optionally created
- [ ] Lead is marked as converted with foreign keys
- [ ] Cannot convert already-converted Lead
- [ ] Activities are transferred to Contact
- [ ] Success redirects to Contact detail page
- [ ] Build passes with no type errors

## Reference Files

- Lead types: `src/lib/crm/types.ts` (CrmLead interface)
- Server actions pattern: `src/app/actions/crm-records.ts`
- Form pattern: `src/components/admin/crm/dynamic-record-form.tsx`
- Page pattern: `src/app/admin/crm-leads/[id]/page.tsx`
- Documentation: `docs/CRM-ARCHITECTURE.md`
