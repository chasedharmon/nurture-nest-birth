/**
 * Field definitions for each importable object type
 * Defines the target fields, their types, and requirements
 */
import type { FieldDefinition, ImportObjectType } from './types'

export const FIELD_DEFINITIONS: Record<ImportObjectType, FieldDefinition[]> = {
  leads: [
    { field: 'name', label: 'Full Name', type: 'text', required: true },
    { field: 'email', label: 'Email', type: 'email', required: true },
    { field: 'phone', label: 'Phone', type: 'phone', required: false },
    {
      field: 'status',
      label: 'Status',
      type: 'select',
      required: false,
      options: [
        { value: 'new', label: 'New' },
        { value: 'contacted', label: 'Contacted' },
        { value: 'scheduled', label: 'Scheduled' },
        { value: 'client', label: 'Client' },
        { value: 'lost', label: 'Lost' },
      ],
    },
    {
      field: 'source',
      label: 'Source',
      type: 'select',
      required: false,
      options: [
        { value: 'website', label: 'Website' },
        { value: 'referral', label: 'Referral' },
        { value: 'social', label: 'Social Media' },
        { value: 'search', label: 'Search' },
        { value: 'other', label: 'Other' },
      ],
    },
    { field: 'due_date', label: 'Due Date', type: 'date', required: false },
    { field: 'notes', label: 'Notes', type: 'text', required: false },
    { field: 'address', label: 'Address', type: 'text', required: false },
    { field: 'city', label: 'City', type: 'text', required: false },
    { field: 'state', label: 'State', type: 'text', required: false },
    { field: 'zip', label: 'ZIP Code', type: 'text', required: false },
  ],

  clients: [
    { field: 'name', label: 'Full Name', type: 'text', required: true },
    { field: 'email', label: 'Email', type: 'email', required: true },
    { field: 'phone', label: 'Phone', type: 'phone', required: false },
    { field: 'due_date', label: 'Due Date', type: 'date', required: false },
    { field: 'notes', label: 'Notes', type: 'text', required: false },
    { field: 'address', label: 'Address', type: 'text', required: false },
    { field: 'city', label: 'City', type: 'text', required: false },
    { field: 'state', label: 'State', type: 'text', required: false },
    { field: 'zip', label: 'ZIP Code', type: 'text', required: false },
  ],

  invoices: [
    {
      field: 'client_name',
      label: 'Client Name',
      type: 'text',
      required: true,
    },
    {
      field: 'client_email',
      label: 'Client Email',
      type: 'email',
      required: false,
    },
    { field: 'amount', label: 'Amount', type: 'number', required: true },
    {
      field: 'description',
      label: 'Description',
      type: 'text',
      required: false,
    },
    { field: 'due_date', label: 'Due Date', type: 'date', required: false },
    {
      field: 'status',
      label: 'Status',
      type: 'select',
      required: false,
      options: [
        { value: 'draft', label: 'Draft' },
        { value: 'sent', label: 'Sent' },
        { value: 'paid', label: 'Paid' },
        { value: 'cancelled', label: 'Cancelled' },
      ],
    },
  ],

  meetings: [
    {
      field: 'client_name',
      label: 'Client Name',
      type: 'text',
      required: true,
    },
    {
      field: 'client_email',
      label: 'Client Email',
      type: 'email',
      required: false,
    },
    { field: 'title', label: 'Title', type: 'text', required: true },
    {
      field: 'scheduled_at',
      label: 'Date & Time',
      type: 'date',
      required: true,
    },
    {
      field: 'duration_minutes',
      label: 'Duration (minutes)',
      type: 'number',
      required: false,
    },
    { field: 'location', label: 'Location', type: 'text', required: false },
    { field: 'notes', label: 'Notes', type: 'text', required: false },
    {
      field: 'meeting_type',
      label: 'Type',
      type: 'select',
      required: false,
      options: [
        { value: 'consultation', label: 'Consultation' },
        { value: 'prenatal', label: 'Prenatal' },
        { value: 'birth', label: 'Birth' },
        { value: 'postpartum', label: 'Postpartum' },
        { value: 'other', label: 'Other' },
      ],
    },
  ],

  services: [
    {
      field: 'client_name',
      label: 'Client Name',
      type: 'text',
      required: true,
    },
    {
      field: 'client_email',
      label: 'Client Email',
      type: 'email',
      required: false,
    },
    {
      field: 'service_name',
      label: 'Service Name',
      type: 'text',
      required: true,
    },
    { field: 'price', label: 'Price', type: 'number', required: false },
    { field: 'start_date', label: 'Start Date', type: 'date', required: false },
    { field: 'notes', label: 'Notes', type: 'text', required: false },
  ],
}

/**
 * Common field name variations for auto-mapping
 */
export const FIELD_ALIASES: Record<string, string[]> = {
  name: [
    'full name',
    'fullname',
    'client name',
    'contact name',
    'first name',
    'firstname',
    'name',
  ],
  email: [
    'email',
    'e-mail',
    'email address',
    'e-mail address',
    'contact email',
  ],
  phone: [
    'phone',
    'telephone',
    'phone number',
    'cell',
    'mobile',
    'contact phone',
  ],
  status: ['status', 'lead status', 'stage'],
  source: ['source', 'lead source', 'how did you hear', 'referral source'],
  due_date: [
    'due date',
    'due',
    'edd',
    'expected date',
    'expected due date',
    'baby due date',
  ],
  notes: ['notes', 'note', 'comments', 'description', 'additional info'],
  address: ['address', 'street', 'street address', 'address line 1'],
  city: ['city', 'town'],
  state: ['state', 'province', 'region'],
  zip: ['zip', 'zip code', 'postal code', 'postcode'],
  amount: ['amount', 'total', 'price', 'cost', 'invoice amount'],
  client_name: ['client name', 'client', 'customer name', 'customer'],
  client_email: ['client email', 'customer email'],
  title: ['title', 'subject', 'meeting title'],
  scheduled_at: [
    'date',
    'scheduled',
    'scheduled at',
    'meeting date',
    'appointment date',
  ],
  location: ['location', 'venue', 'address', 'meeting location'],
}

/**
 * Attempt to auto-map source columns to target fields
 */
export function autoMapColumns(
  sourceHeaders: string[],
  objectType: ImportObjectType
): Record<string, string | null> {
  const fieldDefs = FIELD_DEFINITIONS[objectType]
  const mapping: Record<string, string | null> = {}

  sourceHeaders.forEach(sourceHeader => {
    const normalizedSource = sourceHeader.toLowerCase().trim()
    let matchedField: string | null = null

    // Try to find a matching field
    for (const fieldDef of fieldDefs) {
      // Exact match
      if (normalizedSource === fieldDef.field.toLowerCase()) {
        matchedField = fieldDef.field
        break
      }

      // Check aliases
      const aliases = FIELD_ALIASES[fieldDef.field] || []
      if (aliases.some(alias => normalizedSource === alias.toLowerCase())) {
        matchedField = fieldDef.field
        break
      }

      // Partial match (contains field name)
      if (normalizedSource.includes(fieldDef.field.toLowerCase())) {
        matchedField = fieldDef.field
        // Don't break - keep looking for better matches
      }
    }

    mapping[sourceHeader] = matchedField
  })

  return mapping
}

/**
 * Get required fields that are not mapped
 */
export function getMissingRequiredFields(
  mapping: Record<string, string | null>,
  objectType: ImportObjectType
): FieldDefinition[] {
  const fieldDefs = FIELD_DEFINITIONS[objectType]
  const mappedFields = new Set(Object.values(mapping).filter(Boolean))

  return fieldDefs.filter(
    field => field.required && !mappedFields.has(field.field)
  )
}
