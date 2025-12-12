/**
 * CRM Object Model Types
 *
 * This file contains TypeScript types for the Salesforce-like CRM architecture.
 * The CRM uses a metadata-driven approach where objects and fields are defined
 * in database tables rather than hardcoded schemas.
 *
 * Key concepts:
 * - ObjectDefinition: Defines what objects exist (Contact, Account, Lead, Opportunity)
 * - FieldDefinition: Defines fields for each object with type configuration
 * - PageLayout: Controls how fields are arranged on forms
 * - RecordType: Allows different configurations per record type
 */

// =====================================================
// FIELD DATA TYPES
// =====================================================

/**
 * Supported field data types in the CRM
 */
export type FieldDataType =
  | 'text'
  | 'textarea'
  | 'rich_text'
  | 'number'
  | 'currency'
  | 'percent'
  | 'date'
  | 'datetime'
  | 'checkbox'
  | 'picklist'
  | 'multipicklist'
  | 'lookup'
  | 'master_detail'
  | 'email'
  | 'phone'
  | 'url'
  | 'formula'
  | 'auto_number'

/**
 * Sharing model options for objects
 */
export type SharingModel = 'private' | 'read' | 'read_write' | 'full_access'

/**
 * Standard CRM object API names
 */
export type StandardObjectApiName =
  | 'Contact'
  | 'Account'
  | 'Lead'
  | 'Opportunity'
  | 'Activity'

// =====================================================
// TYPE-SPECIFIC CONFIGURATIONS
// =====================================================

/**
 * Configuration for text fields
 */
export interface TextFieldConfig {
  maxLength?: number
}

/**
 * Configuration for number fields
 */
export interface NumberFieldConfig {
  precision?: number
  scale?: number
  min?: number
  max?: number
}

/**
 * Configuration for currency fields
 */
export interface CurrencyFieldConfig {
  precision?: number
  scale?: number
  currencyCode?: string
}

/**
 * Configuration for picklist fields
 * Note: Actual values are stored in picklist_values table
 */
export interface PicklistFieldConfig {
  /** Whether to allow blank value */
  allowBlank?: boolean
  /** Reference to controlling field for dependent picklists */
  controllingFieldId?: string
}

/**
 * Configuration for lookup/master-detail fields
 */
export interface LookupFieldConfig {
  /** ID of the related object definition */
  relatedObjectId: string
  /** API name of the related object */
  relatedObjectApiName: string
  /** Display field on related object (e.g., 'name') */
  relatedDisplayField?: string
  /** Optional filter criteria for lookup */
  filterCriteria?: FilterCondition[]
}

/**
 * Configuration for formula fields
 */
export interface FormulaFieldConfig {
  /** The formula expression */
  formula: string
  /** Return type of the formula */
  returnType:
    | 'text'
    | 'number'
    | 'currency'
    | 'percent'
    | 'date'
    | 'datetime'
    | 'checkbox'
  /** Decimal places for numeric returns */
  decimalPlaces?: number
}

/**
 * Configuration for auto-number fields
 */
export interface AutoNumberFieldConfig {
  /** Format string (e.g., 'LEAD-{0000}') */
  format: string
  /** Starting number */
  startingNumber?: number
}

/**
 * Union type for all field type configurations
 */
export type FieldTypeConfig =
  | TextFieldConfig
  | NumberFieldConfig
  | CurrencyFieldConfig
  | PicklistFieldConfig
  | LookupFieldConfig
  | FormulaFieldConfig
  | AutoNumberFieldConfig
  | Record<string, unknown>

// =====================================================
// OBJECT DEFINITIONS
// =====================================================

/**
 * Defines a CRM object (standard or custom)
 */
export interface ObjectDefinition {
  id: string
  organization_id: string | null

  // Identity
  api_name: string
  label: string
  plural_label: string
  description: string | null

  // Classification
  is_standard: boolean
  is_custom: boolean

  // Table info
  table_name: string | null

  // Features
  has_record_types: boolean
  has_activities: boolean
  has_notes: boolean
  has_attachments: boolean

  // Sharing
  sharing_model: SharingModel

  // UI
  icon_name: string
  color: string

  // Status
  is_active: boolean

  // Metadata
  created_at: string
  updated_at: string
}

/**
 * Input type for creating an object definition
 */
export type ObjectDefinitionInsert = Omit<
  ObjectDefinition,
  'id' | 'created_at' | 'updated_at' | 'is_standard'
>

/**
 * Input type for updating an object definition
 */
export type ObjectDefinitionUpdate = Partial<
  Omit<
    ObjectDefinition,
    'id' | 'created_at' | 'is_standard' | 'organization_id'
  >
>

// =====================================================
// FIELD DEFINITIONS
// =====================================================

/**
 * Defines a field on a CRM object
 */
export interface FieldDefinition {
  id: string
  organization_id: string | null
  object_definition_id: string

  // Identity
  api_name: string
  label: string
  description: string | null
  help_text: string | null

  // Type
  data_type: FieldDataType
  type_config: FieldTypeConfig

  // Column mapping
  column_name: string | null
  is_custom_field: boolean

  // Constraints
  is_required: boolean
  is_unique: boolean
  default_value: string | null

  // UI behavior
  is_visible: boolean
  is_read_only: boolean
  display_order: number

  // Audit
  is_audited: boolean

  // Classification
  is_standard: boolean
  is_name_field: boolean

  // Security
  is_sensitive: boolean

  // Status
  is_active: boolean

  // Metadata
  created_at: string
  updated_at: string
}

/**
 * Input type for creating a field definition
 */
export type FieldDefinitionInsert = Omit<
  FieldDefinition,
  'id' | 'created_at' | 'updated_at' | 'is_standard'
>

/**
 * Input type for updating a field definition
 */
export type FieldDefinitionUpdate = Partial<
  Omit<
    FieldDefinition,
    | 'id'
    | 'created_at'
    | 'is_standard'
    | 'organization_id'
    | 'object_definition_id'
  >
>

// =====================================================
// PICKLIST VALUES
// =====================================================

/**
 * A single value in a picklist field
 */
export interface PicklistValue {
  id: string
  field_definition_id: string

  // Value data
  value: string
  label: string
  description: string | null

  // Ordering
  display_order: number
  is_default: boolean
  is_active: boolean

  // Dependent picklist support
  controlling_field_id: string | null
  controlling_values: string[] | null

  // UI
  color: string | null

  // Metadata
  created_at: string
}

/**
 * Input type for creating a picklist value
 */
export type PicklistValueInsert = Omit<PicklistValue, 'id' | 'created_at'>

/**
 * Input type for updating a picklist value
 */
export type PicklistValueUpdate = Partial<
  Omit<PicklistValue, 'id' | 'created_at' | 'field_definition_id'>
>

// =====================================================
// PAGE LAYOUTS
// =====================================================

/**
 * A section in a page layout
 */
export interface PageLayoutSection {
  id: string
  name: string
  columns: 1 | 2
  collapsed: boolean
  fields: string[] // Field API names
}

/**
 * Configuration for a page layout
 */
export interface PageLayoutConfig {
  sections: PageLayoutSection[]
  related_lists: string[]
  sidebar_components: string[]
}

/**
 * Defines how fields are arranged on a record page
 */
export interface PageLayout {
  id: string
  organization_id: string
  object_definition_id: string

  // Identity
  name: string
  description: string | null

  // Configuration
  layout_config: PageLayoutConfig

  // Flags
  is_default: boolean
  is_active: boolean

  // Metadata
  created_at: string
  updated_at: string
}

/**
 * Input type for creating a page layout
 */
export type PageLayoutInsert = Omit<
  PageLayout,
  'id' | 'created_at' | 'updated_at'
>

/**
 * Input type for updating a page layout
 */
export type PageLayoutUpdate = Partial<
  Omit<
    PageLayout,
    'id' | 'created_at' | 'organization_id' | 'object_definition_id'
  >
>

// =====================================================
// RECORD TYPES
// =====================================================

/**
 * Defines a record type for an object
 */
export interface RecordType {
  id: string
  organization_id: string
  object_definition_id: string

  // Identity
  name: string
  description: string | null

  // Layout
  page_layout_id: string | null

  // Flags
  is_default: boolean
  is_active: boolean

  // Metadata
  created_at: string
  updated_at: string
}

/**
 * Input type for creating a record type
 */
export type RecordTypeInsert = Omit<
  RecordType,
  'id' | 'created_at' | 'updated_at'
>

/**
 * Input type for updating a record type
 */
export type RecordTypeUpdate = Partial<
  Omit<
    RecordType,
    'id' | 'created_at' | 'organization_id' | 'object_definition_id'
  >
>

// =====================================================
// FIELD PERMISSIONS
// =====================================================

/**
 * Controls field visibility/editability per role
 */
export interface FieldPermission {
  id: string
  organization_id: string
  role_id: string
  field_definition_id: string

  // Permissions
  is_visible: boolean
  is_editable: boolean

  // Metadata
  created_at: string
  updated_at: string
}

/**
 * Input type for creating a field permission
 */
export type FieldPermissionInsert = Omit<
  FieldPermission,
  'id' | 'created_at' | 'updated_at'
>

/**
 * Input type for updating a field permission
 */
export type FieldPermissionUpdate = Partial<
  Pick<FieldPermission, 'is_visible' | 'is_editable'>
>

// =====================================================
// FILTER CONDITIONS (for lookups, reports, etc.)
// =====================================================

/**
 * Operators for filter conditions
 */
export type FilterOperator =
  | 'equals'
  | 'not_equals'
  | 'contains'
  | 'not_contains'
  | 'starts_with'
  | 'ends_with'
  | 'greater_than'
  | 'greater_than_or_equal'
  | 'less_than'
  | 'less_than_or_equal'
  | 'is_null'
  | 'is_not_null'
  | 'in'
  | 'not_in'
  | 'between'

/**
 * A single filter condition
 */
export interface FilterCondition {
  id: string
  field: string
  operator: FilterOperator
  value: unknown
  logic?: 'AND' | 'OR'
}

// =====================================================
// HELPER TYPES
// =====================================================

/**
 * Object definition with its fields
 */
export interface ObjectWithFields extends ObjectDefinition {
  fields: FieldDefinition[]
}

/**
 * Field definition with its picklist values (if applicable)
 */
export interface FieldWithPicklistValues extends FieldDefinition {
  picklist_values?: PicklistValue[]
}

/**
 * Complete object metadata for rendering forms
 */
export interface ObjectMetadata {
  object: ObjectDefinition
  fields: FieldWithPicklistValues[]
  page_layout: PageLayout | null
  record_types: RecordType[]
}

// =====================================================
// CRM RECORD TYPES (for actual data)
// =====================================================

/**
 * Base interface for all CRM records
 * Index signature added to support dynamic field access in SecureRecordDetailPage
 */
export interface CrmRecordBase {
  id: string
  organization_id: string
  owner_id: string | null
  created_at: string
  updated_at: string
  created_by: string | null
  custom_fields: Record<string, unknown>
  [key: string]: unknown
}

/**
 * Contact record - represents a person
 */
export interface CrmContact extends CrmRecordBase {
  // Name
  first_name: string
  last_name: string

  // Contact info
  email: string | null
  phone: string | null
  mobile_phone: string | null

  // Address
  mailing_street: string | null
  mailing_city: string | null
  mailing_state: string | null
  mailing_postal_code: string | null
  mailing_country: string | null

  // Personal
  birthdate: string | null

  // Doula-specific
  partner_name: string | null
  expected_due_date: string | null
  actual_birth_date: string | null

  // Relationships
  account_id: string | null

  // Preferences
  do_not_email: boolean
  do_not_call: boolean
  do_not_sms: boolean
  email_opt_in: boolean
  sms_opt_in: boolean
  preferred_contact_method: string | null

  // Status
  is_active: boolean

  // Portal access
  portal_access_enabled: boolean

  // Attribution
  lead_source: string | null
  referral_partner_id: string | null
  utm_source: string | null
  utm_medium: string | null
  utm_campaign: string | null
}

/**
 * Account record - represents a household/family
 */
export interface CrmAccount extends CrmRecordBase {
  // Identity
  name: string
  account_type: 'household' | 'business' | 'partner'

  // Primary contact
  primary_contact_id: string | null

  // Address
  billing_street: string | null
  billing_city: string | null
  billing_state: string | null
  billing_postal_code: string | null
  billing_country: string | null

  // Status
  account_status: 'prospect' | 'active' | 'inactive' | 'churned'
  lifecycle_stage: string | null

  // Financial
  total_revenue: number
  outstanding_balance: number
}

/**
 * Lead record - unqualified prospect
 */
export interface CrmLead extends CrmRecordBase {
  // Person info
  first_name: string
  last_name: string
  email: string | null
  phone: string | null

  // Qualification
  lead_status: 'new' | 'contacted' | 'qualified' | 'unqualified' | 'converted'
  lead_source: string | null
  lead_rating: 'hot' | 'warm' | 'cold' | null

  // Interest
  service_interest: string | null
  estimated_value: number | null
  expected_close_date: string | null

  // Doula-specific
  expected_due_date: string | null
  message: string | null

  // Portal access
  portal_access_enabled: boolean

  // Attribution
  referral_partner_id: string | null
  utm_source: string | null
  utm_medium: string | null
  utm_campaign: string | null
  landing_page: string | null
  referrer_url: string | null

  // Conversion tracking
  is_converted: boolean
  converted_at: string | null
  converted_contact_id: string | null
  converted_account_id: string | null
  converted_opportunity_id: string | null
  converted_by: string | null
}

/**
 * Opportunity stages
 */
export type OpportunityStage =
  | 'qualification'
  | 'needs_analysis'
  | 'proposal'
  | 'negotiation'
  | 'closed_won'
  | 'closed_lost'

/**
 * Opportunity record - sales deal
 */
export interface CrmOpportunity extends CrmRecordBase {
  // Identity
  name: string
  description: string | null

  // Relationships
  account_id: string | null
  primary_contact_id: string | null

  // Stage
  stage: OpportunityStage
  stage_probability: number

  // Financial
  amount: number | null
  expected_revenue: number | null

  // Dates
  close_date: string | null
  actual_close_date: string | null

  // Service details
  service_type: string | null
  package_id: string | null

  // Status
  is_closed: boolean
  is_won: boolean

  // Loss tracking
  closed_lost_reason: string | null
  competitor: string | null

  // Next steps
  next_step: string | null
  next_step_date: string | null
}

/**
 * Activity types
 */
export type ActivityType = 'task' | 'event' | 'call' | 'email' | 'note'

/**
 * Activity record - tasks, events, calls, notes
 */
export interface CrmActivity extends CrmRecordBase {
  // Type
  activity_type: ActivityType

  // Content
  subject: string
  description: string | null

  // Relationships (polymorphic)
  related_to_type: string | null
  related_to_id: string | null
  who_type: string | null
  who_id: string | null

  // Status
  status: 'open' | 'completed' | 'cancelled'
  priority: 'high' | 'normal' | 'low'

  // Timing
  due_date: string | null
  due_datetime: string | null
  completed_at: string | null
  duration_minutes: number | null

  // Event/meeting specific
  location: string | null
  meeting_link: string | null
  is_all_day: boolean

  // Call specific
  call_result: string | null
  call_direction: 'inbound' | 'outbound' | null

  // Assignment
  assigned_to: string | null
}

// =====================================================
// CONTACT RELATIONSHIP TYPES (for Account relationships)
// =====================================================

/**
 * Relationship types between Contact and Account
 */
export type ContactRelationshipType =
  | 'primary'
  | 'partner'
  | 'parent'
  | 'child'
  | 'emergency_contact'
  | 'other'

/**
 * Contact-Account relationship record
 */
export interface ContactAccountRelationship {
  id: string
  contact_id: string
  account_id: string
  relationship_type: ContactRelationshipType
  is_primary: boolean
  notes: string | null
  created_at: string
}

// =====================================================
// LEAD CONVERSION
// =====================================================

/**
 * Input for converting a lead
 */
export interface LeadConversionInput {
  lead_id: string

  // Contact options
  create_contact: boolean
  existing_contact_id?: string
  contact_overrides?: Partial<CrmContact>

  // Account options
  create_account: boolean
  existing_account_id?: string
  account_name?: string

  // Opportunity options
  create_opportunity: boolean
  opportunity_name?: string
  opportunity_stage?: OpportunityStage
  opportunity_amount?: number
  opportunity_close_date?: string
}

/**
 * Result of lead conversion
 */
export interface LeadConversionResult {
  success: boolean
  lead_id: string
  contact_id?: string
  account_id?: string
  opportunity_id?: string
  error?: string
}

// =====================================================
// RECORD-LEVEL SECURITY (SHARING MODEL)
// =====================================================

/**
 * Access levels for record sharing
 */
export type RecordAccessLevel = 'read' | 'read_write' | 'full_access'

/**
 * Sources of record access
 */
export type AccessSource =
  | 'owner' // Record owner
  | 'org_wide_default' // Organization-wide default
  | 'role_hierarchy' // Access via role hierarchy
  | 'sharing_rule' // Criteria-based sharing rule
  | 'manual_share' // Manual share grant

/**
 * Who can receive shared access
 */
export type ShareWithType = 'user' | 'role' | 'public_group'

/**
 * Sharing rule types
 */
export type SharingRuleType = 'criteria' | 'owner_based'

/**
 * Filter operator for sharing rule criteria
 */
export type SharingCriteriaOperator =
  | 'equals'
  | 'not_equals'
  | 'contains'
  | 'not_contains'
  | 'starts_with'
  | 'greater_than'
  | 'less_than'
  | 'is_null'
  | 'is_not_null'
  | 'in'

/**
 * Single condition in sharing rule criteria
 */
export interface SharingCriteriaCondition {
  field: string
  operator: SharingCriteriaOperator
  value: unknown
}

/**
 * Criteria configuration for sharing rules
 */
export interface SharingCriteria {
  conditions: SharingCriteriaCondition[]
  match_type: 'all' | 'any'
}

/**
 * Sharing rule definition
 */
export interface SharingRule {
  id: string
  organization_id: string
  object_definition_id: string

  // Identity
  name: string
  description: string | null

  // Access
  access_level: RecordAccessLevel

  // Who gets access
  share_with_type: ShareWithType
  share_with_id: string | null

  // Criteria
  criteria: SharingCriteria

  // Rule type
  rule_type: SharingRuleType
  owner_role_id: string | null

  // Status
  is_active: boolean

  // Metadata
  created_at: string
  updated_at: string
  created_by: string | null
}

/**
 * Input type for creating a sharing rule
 */
export type SharingRuleInsert = Omit<
  SharingRule,
  'id' | 'created_at' | 'updated_at'
>

/**
 * Input type for updating a sharing rule
 */
export type SharingRuleUpdate = Partial<
  Omit<
    SharingRule,
    'id' | 'created_at' | 'organization_id' | 'object_definition_id'
  >
>

/**
 * Manual share record
 */
export interface ManualShare {
  id: string
  organization_id: string

  // Record reference
  object_api_name: string
  record_id: string

  // Who gets access
  share_with_type: 'user' | 'role'
  share_with_id: string

  // Access level
  access_level: RecordAccessLevel

  // Metadata
  reason: string | null
  shared_by: string
  expires_at: string | null
  created_at: string
}

/**
 * Input type for creating a manual share
 */
export type ManualShareInsert = Omit<
  ManualShare,
  'id' | 'created_at' | 'shared_by'
>

/**
 * Information about who has access to a record
 */
export interface RecordSharingInfo {
  user_id: string
  user_name: string | null
  user_email: string
  access_level: RecordAccessLevel
  access_source: AccessSource
  source_name: string
}

/**
 * Result of checking record access
 */
export interface RecordAccessResult {
  has_access: boolean
  access_level: RecordAccessLevel | null
  access_source: AccessSource | null
}

/**
 * Sharing settings for an object
 */
export interface ObjectSharingSettings {
  object_api_name: string
  sharing_model: SharingModel
  sharing_rules: SharingRule[]
}
