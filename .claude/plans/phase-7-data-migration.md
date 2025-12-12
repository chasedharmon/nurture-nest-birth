# Phase 7: Data Migration from Legacy Leads

## Overview

Phase 7 migrates existing data from the legacy `leads` table (at `/admin/leads`) to the new CRM `crm_leads` table. This ensures all historical lead data is preserved in the new CRM system.

## Prerequisites

Phases 1-6 are complete:

- ✅ Phase 1: Metadata foundation (object_definitions, field_definitions)
- ✅ Phase 2: Core CRM tables (crm_contacts, crm_accounts, crm_leads, crm_opportunities, crm_activities)
- ✅ Phase 3: Admin Setup UI for Objects & Fields
- ✅ Phase 4: Dynamic Record Forms (DynamicRecordForm component)
- ✅ Phase 5: List Views & Record Pages (CRUD for all objects)
- ✅ Phase 6: Lead Conversion Wizard

## Phase 7 Requirements

### 1. Analyze Legacy Data Structure

First, understand the existing `leads` table schema:

**Location**: Check `src/app/admin/leads/` for the existing lead management UI
**Database**: `leads` table in Supabase

Likely fields to migrate:

- `id`, `created_at`, `updated_at`
- `first_name`, `last_name`, `email`, `phone`
- `message` (inquiry text)
- `status` (new, contacted, qualified, etc.)
- `source` → `lead_source`
- `expected_due_date`
- `service_interest`
- Attribution fields (utm_source, utm_medium, utm_campaign, referrer_url)

### 2. Migration Strategy

**Option A: One-time Migration Script**

- Server action or admin endpoint to migrate all legacy leads
- Map fields from old schema to new CRM schema
- Preserve original timestamps
- Add audit trail of migration

**Option B: Admin UI Migration Tool**

- Page at `/admin/setup/migration` or similar
- Shows count of unmigrated leads
- Preview mapping before migration
- Batch migration with progress indicator
- Rollback capability

**Recommended**: Option B provides better visibility and control

### 3. Field Mapping

Create mapping from legacy `leads` to `crm_leads`:

```typescript
const fieldMapping = {
  // Direct mappings
  first_name: 'first_name',
  last_name: 'last_name',
  email: 'email',
  phone: 'phone',
  message: 'message',
  expected_due_date: 'expected_due_date',

  // Status mapping
  status: legacyStatus => mapLegacyStatus(legacyStatus),

  // Source/Attribution
  source: 'lead_source',
  utm_source: 'utm_source',
  utm_medium: 'utm_medium',
  utm_campaign: 'utm_campaign',
  referrer_url: 'referrer_url',
  landing_page: 'landing_page',

  // Service interest
  service_interest: 'service_interest',

  // Preserve timestamps
  created_at: 'created_at',
  updated_at: 'updated_at',
}
```

### 4. Status Mapping

Map legacy statuses to CRM lead statuses:

```typescript
function mapLegacyStatus(legacyStatus: string): CrmLeadStatus {
  const statusMap: Record<string, CrmLeadStatus> = {
    new: 'new',
    contacted: 'contacted',
    qualified: 'qualified',
    unqualified: 'unqualified',
    converted: 'converted',
    lost: 'unqualified',
    archived: 'unqualified',
  }
  return statusMap[legacyStatus] || 'new'
}
```

### 5. Migration Server Action

Create `src/app/actions/lead-migration.ts`:

```typescript
export async function migrateLeadsPreview(): Promise<{
  totalLegacyLeads: number
  alreadyMigrated: number
  toMigrate: number
  sampleMappings: Array<{ legacy: object; crm: object }>
}>

export async function migrateLegacyLeads(options: {
  batchSize?: number
  dryRun?: boolean
}): Promise<{
  success: boolean
  migratedCount: number
  errors: Array<{ leadId: string; error: string }>
}>

export async function getMigrationStatus(): Promise<{
  totalLegacy: number
  migrated: number
  remaining: number
  lastMigratedAt?: string
}>
```

### 6. Admin Migration Page

Create `/admin/setup/migration/page.tsx`:

- Display migration status dashboard
- Show field mapping preview
- "Start Migration" button with confirmation
- Progress bar during migration
- Results summary after completion
- Option to migrate individual leads

### 7. Post-Migration Considerations

**Data Validation**:

- Compare counts before/after
- Spot-check random records
- Verify no data loss

**Legacy System Handling**:

- Keep legacy table as backup
- Add "migrated" flag to legacy leads
- Eventually redirect `/admin/leads` to `/admin/crm-leads`
- Plan deprecation timeline

**Activity Migration**:

- If legacy system has activities/notes, migrate those too
- Link to new Contact if lead was converted

## Key Files to Create

- `src/app/actions/lead-migration.ts` - Migration server actions
- `src/app/admin/setup/migration/page.tsx` - Migration admin page
- `src/components/admin/migration/migration-dashboard.tsx` - Dashboard component

## Key Files to Reference

- Legacy leads: `src/app/admin/leads/` (existing lead management)
- CRM types: `src/lib/crm/types.ts` (CrmLead interface)
- Server actions: `src/app/actions/crm-records.ts` (CRUD patterns)
- Database: Check Supabase `leads` table schema

## Testing Checklist

- [ ] Migration preview shows correct counts
- [ ] Field mappings are accurate
- [ ] Dry run works without modifying data
- [ ] Actual migration creates valid CRM leads
- [ ] Original timestamps are preserved
- [ ] Status mapping works correctly
- [ ] Attribution fields are preserved
- [ ] No duplicate migrations (idempotent)
- [ ] Error handling for invalid data
- [ ] Build passes with no type errors

## Database Considerations

May need to add a migration tracking field to legacy `leads` table:

```sql
ALTER TABLE leads ADD COLUMN migrated_to_crm_id UUID REFERENCES crm_leads(id);
```

Or track in a separate migration log table.

## Reference Documentation

- CRM Architecture: `docs/CRM-ARCHITECTURE.md`
- Phase 6 Plan: `.claude/plans/phase-6-lead-conversion.md`
