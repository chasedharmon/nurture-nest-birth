# Phase 9: Data Management

## Overview

Phase 9 enables easy data in/out - critical for customer migration from competitors (Dubsado, HoneyBook) and data portability. This phase builds the foundation for CSV/Excel import wizards, export functionality, bulk actions, and duplicate detection.

## Prerequisites

Phases 1-8 are complete:

- ✅ Phase 1-6: CRM Foundation (objects, fields, leads, conversion)
- ✅ Phase 7: Data Migration from legacy leads
- ✅ Phase 8: UX Polish & Onboarding (setup wizard, keyboard shortcuts, help widget, client onboarding tour, journey timeline, action items)

## Phase 9 Features

| ID   | Feature                 | Description                                        | Effort  | Priority |
| ---- | ----------------------- | -------------------------------------------------- | ------- | -------- |
| DM-1 | CSV/Excel Import Wizard | Upload, map columns, preview, handle duplicates    | 6-8 hrs | HIGH     |
| DM-2 | Quick Export Buttons    | Export current view as CSV/Excel on list pages     | 2-3 hrs | HIGH     |
| DM-3 | Filter-Aware Exports    | Export only what matches current filters           | 1-2 hrs | MEDIUM   |
| DM-4 | Bulk Actions            | Select multiple records, bulk update/delete/assign | 4-6 hrs | HIGH     |
| DM-5 | Duplicate Detection     | Flag potential duplicates on import and manually   | 3-4 hrs | MEDIUM   |

**Total Effort**: ~17-24 hours

---

## DM-1: CSV/Excel Import Wizard

### User Story

As a doula migrating from Dubsado/HoneyBook, I want to import my existing client data via CSV so I can start using Nurture Nest without manual data entry.

### Requirements

1. **File Upload Step**
   - Accept CSV, XLSX, XLS files
   - Parse headers and preview first 5 rows
   - Show file metadata (row count, columns detected)

2. **Column Mapping Step**
   - Drag-and-drop or dropdown mapping of source → target fields
   - Auto-match common field names (first_name, email, phone, etc.)
   - Show required vs optional fields
   - Save mapping templates for future imports

3. **Preview & Validation Step**
   - Show transformed data preview
   - Highlight validation errors (invalid emails, missing required fields)
   - Show duplicate detection results
   - Allow row-level skip/include

4. **Import Execution Step**
   - Progress bar with row count
   - Batch processing (50 records at a time)
   - Error summary with downloadable error report
   - Success confirmation with link to imported records

### Files to Create

```
src/app/admin/import/page.tsx - Import wizard landing page
src/app/admin/import/[object]/page.tsx - Object-specific import wizard
src/components/admin/import/
  ├── import-wizard.tsx - Main wizard container
  ├── file-upload-step.tsx - File selection and parsing
  ├── column-mapping-step.tsx - Field mapping UI
  ├── preview-step.tsx - Data preview with validation
  ├── import-progress-step.tsx - Execution with progress
  └── mapping-template-dialog.tsx - Save/load templates
src/lib/import/
  ├── parsers.ts - CSV/Excel parsing utilities
  ├── mappers.ts - Field mapping logic
  ├── validators.ts - Data validation rules
  └── types.ts - Import types
src/app/actions/import.ts - Server actions for import
```

### Database Changes

```sql
-- Import history tracking
CREATE TABLE import_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  object_type TEXT NOT NULL,
  file_name TEXT NOT NULL,
  total_rows INTEGER NOT NULL,
  successful_rows INTEGER DEFAULT 0,
  failed_rows INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending', -- pending, processing, completed, failed
  error_log JSONB DEFAULT '[]',
  mapping_template JSONB,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- Saved mapping templates
CREATE TABLE import_mapping_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  name TEXT NOT NULL,
  object_type TEXT NOT NULL,
  mappings JSONB NOT NULL,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

## DM-2: Quick Export Buttons

### User Story

As a doula, I want to quickly export my current view to CSV/Excel so I can share data with my accountant or backup my records.

### Requirements

1. **Export Button on List Pages**
   - Add "Export" dropdown button to leads, clients, invoices pages
   - Options: CSV, Excel (XLSX)
   - Export visible columns in current sort order

2. **Export Options**
   - All records (up to 10,000)
   - Current page only
   - Selected records only

3. **File Generation**
   - Client-side for small datasets (<1000 rows)
   - Server-side streaming for large datasets
   - Include metadata header row (export date, filters applied)

### Files to Create/Modify

```
src/components/admin/export-button.tsx - Reusable export dropdown
src/lib/export/
  ├── csv.ts - CSV generation utilities
  ├── excel.ts - Excel generation (using xlsx library)
  └── types.ts - Export configuration types
src/app/admin/leads/page.tsx - Add ExportButton
src/app/admin/clients/page.tsx - Add ExportButton
src/app/admin/invoices/page.tsx - Add ExportButton
```

### Dependencies

```json
{
  "xlsx": "^0.18.5" // Excel file generation
}
```

---

## DM-3: Filter-Aware Exports

### User Story

As a doula, I want my exports to respect my current filters so I can export specific subsets like "all leads from website" or "unpaid invoices".

### Requirements

1. **Filter State Preservation**
   - Capture current filter state when export triggered
   - Pass filters to export function
   - Show filter summary in export preview

2. **Export Metadata**
   - Include filter criteria in filename or header
   - Log export with filters for audit trail

### Files to Modify

```
src/components/admin/export-button.tsx - Accept filter props
src/lib/export/csv.ts - Add filter metadata to output
src/lib/export/excel.ts - Add filter metadata sheet
```

---

## DM-4: Bulk Actions

### User Story

As a doula, I want to select multiple records and perform actions on them at once (delete, update status, assign to team member) to save time.

### Requirements

1. **Selection UI**
   - Checkbox column on list pages
   - "Select All" with current page / all pages option
   - Selection count badge
   - Clear selection button

2. **Bulk Action Menu**
   - Dropdown or toolbar with available actions
   - Actions vary by object type:
     - Leads: Update status, Assign to team member, Delete
     - Clients: Assign to team member, Archive
     - Invoices: Mark as paid, Send reminder, Delete

3. **Confirmation & Execution**
   - Confirmation dialog with count and action summary
   - Progress indicator for large batches
   - Success/failure summary
   - Undo option (where applicable)

### Files to Create/Modify

```
src/components/admin/bulk-actions/
  ├── selection-provider.tsx - Context for selection state
  ├── selection-checkbox.tsx - Row checkbox component
  ├── selection-toolbar.tsx - Bulk actions toolbar
  ├── bulk-action-dialog.tsx - Confirmation dialog
  └── bulk-action-progress.tsx - Progress indicator
src/app/actions/bulk-actions.ts - Server actions for bulk operations
src/app/admin/leads/page.tsx - Integrate bulk actions
src/app/admin/clients/page.tsx - Integrate bulk actions
```

---

## DM-5: Duplicate Detection

### User Story

As a doula importing data, I want to be warned about potential duplicates so I don't create multiple records for the same person.

### Requirements

1. **Import-Time Detection**
   - Check for existing records by email, phone, or name
   - Show potential matches in preview step
   - Options: Skip, Merge, Create anyway

2. **Manual Detection**
   - "Find Duplicates" button on list pages
   - Algorithm: Fuzzy match on name + exact match on email/phone
   - Show potential duplicates in modal
   - Options: Merge records, Keep both, Dismiss match

3. **Merge Functionality**
   - Select primary record
   - Choose which field values to keep
   - Preserve activity history from both records
   - Update related records (invoices, meetings, etc.)

### Files to Create

```
src/components/admin/duplicates/
  ├── duplicate-detector.tsx - Detection UI
  ├── duplicate-match-card.tsx - Display potential match
  ├── merge-dialog.tsx - Merge wizard
  └── field-selector.tsx - Choose field values
src/lib/duplicates/
  ├── detector.ts - Detection algorithms
  ├── merger.ts - Merge logic
  └── types.ts - Duplicate types
src/app/actions/duplicates.ts - Server actions
```

---

## Implementation Order

### Sprint 1: Export Foundation (Day 1-2)

1. DM-2: Quick Export Buttons
   - Create export utilities (CSV, Excel)
   - Add ExportButton component
   - Integrate into leads page

2. DM-3: Filter-Aware Exports
   - Pass filter state to export
   - Add filter metadata

### Sprint 2: Bulk Actions (Day 3-4)

3. DM-4: Bulk Actions
   - Selection provider and UI
   - Bulk action server actions
   - Integrate into leads page

### Sprint 3: Import Wizard (Day 5-8)

4. DM-1: CSV/Excel Import Wizard
   - File upload and parsing
   - Column mapping UI
   - Preview and validation
   - Import execution

### Sprint 4: Duplicate Detection (Day 9-10)

5. DM-5: Duplicate Detection
   - Detection algorithm
   - Import-time checking
   - Manual detection UI
   - Merge functionality

---

## Testing Checklist

### DM-1: Import Wizard

- [ ] CSV file uploads and parses correctly
- [ ] Excel file (XLSX) uploads and parses correctly
- [ ] Column auto-mapping works for common fields
- [ ] Custom mapping can be applied
- [ ] Mapping templates save and load
- [ ] Validation errors display correctly
- [ ] Duplicate detection during preview works
- [ ] Import executes with progress indicator
- [ ] Error rows logged and downloadable
- [ ] Import history tracked in database

### DM-2: Quick Export

- [ ] Export button appears on list pages
- [ ] CSV export downloads correctly
- [ ] Excel export downloads correctly
- [ ] All visible columns included
- [ ] Sort order preserved

### DM-3: Filter-Aware Export

- [ ] Filters applied to export
- [ ] Filter metadata in filename/header
- [ ] Empty result handled gracefully

### DM-4: Bulk Actions

- [ ] Row selection works
- [ ] Select all (page/all) works
- [ ] Bulk delete with confirmation
- [ ] Bulk status update
- [ ] Bulk assign to team member
- [ ] Progress indicator for large batches
- [ ] Success/failure summary

### DM-5: Duplicate Detection

- [ ] Import-time detection shows matches
- [ ] Skip/Merge/Create options work
- [ ] Manual detection finds duplicates
- [ ] Merge wizard preserves correct data
- [ ] Related records updated after merge

---

## Key Files Reference

### Existing Patterns to Follow

- `src/app/actions/leads.ts` - Server action patterns
- `src/components/admin/reports/report-wizard.tsx` - Multi-step wizard pattern
- `src/lib/validations/setup.ts` - Zod validation patterns
- `src/components/ui/data-table.tsx` - Table with selection pattern

### Database

- Check existing table schemas in `supabase/migrations/`
- Follow RLS policy patterns from existing tables

---

## Why This Phase Matters

| Competitor       | Import  | Export  | Bulk Actions | Duplicates |
| ---------------- | ------- | ------- | ------------ | ---------- |
| HubSpot          | ✅      | ✅      | ✅           | ✅         |
| Dubsado          | Basic   | Basic   | ❌           | ❌         |
| HoneyBook        | Basic   | ❌      | Limited      | ❌         |
| **Nurture Nest** | ✅ Full | ✅ Full | ✅ Full      | ✅         |

**Your edge**: Making migration from competitors painless is a major conversion driver. "Import your Dubsado data in 5 minutes" is a powerful marketing message.
