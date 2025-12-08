import type { ColumnConfig, ObjectType } from '@/lib/supabase/types'

// ============================================================================
// DEFAULT COLUMN CONFIGURATIONS
// ============================================================================

export function getDefaultColumns(objectType: ObjectType): ColumnConfig[] {
  switch (objectType) {
    case 'leads':
    case 'clients':
      return [
        {
          field: 'name',
          label: 'Name',
          visible: true,
          sortable: true,
          filterable: true,
        },
        {
          field: 'email',
          label: 'Email',
          visible: true,
          sortable: true,
          filterable: true,
        },
        {
          field: 'phone',
          label: 'Phone',
          visible: true,
          sortable: false,
          filterable: false,
        },
        {
          field: 'status',
          label: 'Status',
          visible: true,
          sortable: true,
          filterable: true,
          format: 'badge',
        },
        {
          field: 'source',
          label: 'Source',
          visible: true,
          sortable: true,
          filterable: true,
          format: 'badge',
        },
        {
          field: 'expected_due_date',
          label: 'Due Date',
          visible: true,
          sortable: true,
          filterable: true,
          format: 'date',
        },
        {
          field: 'created_at',
          label: 'Created',
          visible: true,
          sortable: true,
          filterable: true,
          format: 'date',
        },
        {
          field: 'lifecycle_stage',
          label: 'Stage',
          visible: false,
          sortable: true,
          filterable: true,
          format: 'badge',
        },
        {
          field: 'client_type',
          label: 'Client Type',
          visible: false,
          sortable: true,
          filterable: true,
          format: 'badge',
        },
        {
          field: 'partner_name',
          label: 'Partner',
          visible: false,
          sortable: false,
          filterable: false,
        },
      ]
    case 'invoices':
      return [
        {
          field: 'invoice_number',
          label: 'Invoice #',
          visible: true,
          sortable: true,
          filterable: true,
        },
        {
          field: 'client_id',
          label: 'Client',
          visible: true,
          sortable: false,
          filterable: false,
        },
        {
          field: 'status',
          label: 'Status',
          visible: true,
          sortable: true,
          filterable: true,
          format: 'badge',
        },
        {
          field: 'total',
          label: 'Total',
          visible: true,
          sortable: true,
          filterable: true,
          format: 'currency',
        },
        {
          field: 'balance_due',
          label: 'Balance',
          visible: true,
          sortable: true,
          filterable: true,
          format: 'currency',
        },
        {
          field: 'issue_date',
          label: 'Issue Date',
          visible: true,
          sortable: true,
          filterable: true,
          format: 'date',
        },
        {
          field: 'due_date',
          label: 'Due Date',
          visible: true,
          sortable: true,
          filterable: true,
          format: 'date',
        },
      ]
    case 'meetings':
      return [
        {
          field: 'title',
          label: 'Title',
          visible: true,
          sortable: true,
          filterable: true,
        },
        {
          field: 'meeting_type',
          label: 'Type',
          visible: true,
          sortable: true,
          filterable: true,
          format: 'badge',
        },
        {
          field: 'scheduled_at',
          label: 'Scheduled',
          visible: true,
          sortable: true,
          filterable: true,
          format: 'datetime',
        },
        {
          field: 'status',
          label: 'Status',
          visible: true,
          sortable: true,
          filterable: true,
          format: 'badge',
        },
        {
          field: 'location',
          label: 'Location',
          visible: true,
          sortable: false,
          filterable: false,
        },
        {
          field: 'duration_minutes',
          label: 'Duration',
          visible: true,
          sortable: true,
          filterable: false,
        },
      ]
    case 'team_members':
      return [
        {
          field: 'display_name',
          label: 'Name',
          visible: true,
          sortable: true,
          filterable: true,
        },
        {
          field: 'email',
          label: 'Email',
          visible: true,
          sortable: true,
          filterable: true,
        },
        {
          field: 'role',
          label: 'Role',
          visible: true,
          sortable: true,
          filterable: true,
          format: 'badge',
        },
        {
          field: 'is_active',
          label: 'Active',
          visible: true,
          sortable: true,
          filterable: true,
          format: 'boolean',
        },
        {
          field: 'is_accepting_clients',
          label: 'Accepting',
          visible: true,
          sortable: true,
          filterable: true,
          format: 'boolean',
        },
      ]
    case 'payments':
      return [
        {
          field: 'amount',
          label: 'Amount',
          visible: true,
          sortable: true,
          filterable: true,
          format: 'currency',
        },
        {
          field: 'payment_method',
          label: 'Method',
          visible: true,
          sortable: true,
          filterable: true,
          format: 'badge',
        },
        {
          field: 'status',
          label: 'Status',
          visible: true,
          sortable: true,
          filterable: true,
          format: 'badge',
        },
        {
          field: 'payment_date',
          label: 'Date',
          visible: true,
          sortable: true,
          filterable: true,
          format: 'date',
        },
      ]
    case 'services':
      return [
        {
          field: 'package_name',
          label: 'Package',
          visible: true,
          sortable: true,
          filterable: true,
        },
        {
          field: 'service_type',
          label: 'Type',
          visible: true,
          sortable: true,
          filterable: true,
          format: 'badge',
        },
        {
          field: 'status',
          label: 'Status',
          visible: true,
          sortable: true,
          filterable: true,
          format: 'badge',
        },
        {
          field: 'total_amount',
          label: 'Amount',
          visible: true,
          sortable: true,
          filterable: true,
          format: 'currency',
        },
        {
          field: 'start_date',
          label: 'Start',
          visible: true,
          sortable: true,
          filterable: true,
          format: 'date',
        },
        {
          field: 'contract_signed',
          label: 'Contract',
          visible: true,
          sortable: true,
          filterable: true,
          format: 'boolean',
        },
      ]
    default:
      return []
  }
}

// ============================================================================
// FILTER OPTIONS FOR QUICK FILTERS
// ============================================================================

export function getFilterOptions(
  objectType: ObjectType
): Record<string, { value: string; label: string }[]> {
  switch (objectType) {
    case 'leads':
    case 'clients':
      return {
        status: [
          { value: 'new', label: 'New' },
          { value: 'contacted', label: 'Contacted' },
          { value: 'scheduled', label: 'Scheduled' },
          { value: 'client', label: 'Client' },
          { value: 'lost', label: 'Lost' },
        ],
        source: [
          { value: 'contact_form', label: 'Contact Form' },
          { value: 'newsletter', label: 'Newsletter' },
          { value: 'manual', label: 'Manual' },
        ],
        lifecycle_stage: [
          { value: 'lead', label: 'Lead' },
          { value: 'consultation_scheduled', label: 'Consultation Scheduled' },
          { value: 'active_client', label: 'Active Client' },
          { value: 'past_client', label: 'Past Client' },
          { value: 'inactive', label: 'Inactive' },
        ],
      }
    case 'invoices':
      return {
        status: [
          { value: 'draft', label: 'Draft' },
          { value: 'sent', label: 'Sent' },
          { value: 'paid', label: 'Paid' },
          { value: 'partial', label: 'Partial' },
          { value: 'overdue', label: 'Overdue' },
          { value: 'cancelled', label: 'Cancelled' },
        ],
      }
    case 'meetings':
      return {
        status: [
          { value: 'scheduled', label: 'Scheduled' },
          { value: 'completed', label: 'Completed' },
          { value: 'cancelled', label: 'Cancelled' },
          { value: 'no_show', label: 'No Show' },
        ],
        meeting_type: [
          { value: 'consultation', label: 'Consultation' },
          { value: 'prenatal', label: 'Prenatal' },
          { value: 'birth', label: 'Birth' },
          { value: 'postpartum', label: 'Postpartum' },
          { value: 'follow_up', label: 'Follow Up' },
        ],
      }
    default:
      return {}
  }
}
