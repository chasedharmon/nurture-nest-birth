export type LeadSource = 'contact_form' | 'newsletter' | 'manual'

export type LeadStatus = 'new' | 'contacted' | 'scheduled' | 'client' | 'lost'

export type ActivityType =
  | 'note'
  | 'email_sent'
  | 'call'
  | 'meeting'
  | 'status_change'
  | 'system'

export type ActivityCategory =
  | 'communication'
  | 'milestone'
  | 'system'
  | 'document'
  | 'payment'
  | 'meeting'

export type RelatedRecordType =
  | 'service'
  | 'meeting'
  | 'payment'
  | 'document'
  | 'invoice'
  | 'contract_signature'

export type ClientType = 'lead' | 'expecting' | 'postpartum' | 'past_client'

export type LifecycleStage =
  | 'lead'
  | 'consultation_scheduled'
  | 'active_client'
  | 'past_client'
  | 'inactive'

export type ServiceType =
  | 'birth_doula'
  | 'postpartum_doula'
  | 'lactation_consulting'
  | 'childbirth_education'
  | 'other'

export type ServiceStatus = 'pending' | 'active' | 'completed' | 'cancelled'

export type PaymentStatus = 'unpaid' | 'partial' | 'paid' | 'refunded'

export type MeetingType =
  | 'consultation'
  | 'prenatal'
  | 'birth'
  | 'postpartum'
  | 'follow_up'
  | 'other'

export type MeetingStatus = 'scheduled' | 'completed' | 'cancelled' | 'no_show'

export type DocumentType =
  | 'contract'
  | 'birth_plan'
  | 'resource'
  | 'photo'
  | 'invoice'
  | 'form'
  | 'other'

export type PaymentMethod =
  | 'stripe'
  | 'check'
  | 'cash'
  | 'venmo'
  | 'zelle'
  | 'other'

export type PaymentStatusType = 'pending' | 'completed' | 'failed' | 'refunded'

export type UserRole = 'admin' | 'viewer'

export interface Lead {
  id: string
  created_at: string
  updated_at: string
  source: LeadSource
  status: LeadStatus
  name: string
  email: string
  phone?: string | null
  due_date?: string | null
  service_interest?: string | null
  message?: string | null
  email_domain?: string | null
  assigned_to_user_id?: string | null
  // Phase 3 additions
  partner_name?: string | null
  address?: {
    street?: string
    city?: string
    state?: string
    zip?: string
  } | null
  birth_preferences?: {
    location?: string
    birth_plan_notes?: string
    special_requests?: string
  } | null
  medical_info?: {
    obgyn?: string
    hospital?: string
    insurance?: string
  } | null
  emergency_contact?: {
    name?: string
    phone?: string
    relationship?: string
  } | null
  expected_due_date?: string | null
  actual_birth_date?: string | null
  client_type?: ClientType
  tags?: string[]
  lifecycle_stage?: LifecycleStage
  // Phase E attribution tracking
  source_detail?: string | null
  referral_source?: string | null
  referral_partner_id?: string | null
  utm_source?: string | null
  utm_medium?: string | null
  utm_campaign?: string | null
  utm_term?: string | null
  utm_content?: string | null
  referrer_url?: string | null
  landing_page?: string | null
}

export interface LeadActivity {
  id: string
  lead_id: string
  created_at: string
  created_by_user_id?: string | null
  activity_type: ActivityType
  content: string
  metadata?: Record<string, unknown> | null
  // Phase 3 additions
  activity_category?: ActivityCategory
  related_record_type?: RelatedRecordType | null
  related_record_id?: string | null
  created_by?: string | null
  is_pinned?: boolean
  is_client_visible?: boolean
}

export interface ClientService {
  id: string
  client_id: string
  service_type: string
  package_name?: string | null
  description?: string | null
  status: string
  start_date?: string | null
  end_date?: string | null
  total_amount?: number | null
  contract_required: boolean
  contract_signed: boolean
  contract_signed_at?: string | null
  contract_signature_id?: string | null
  notes?: string | null
  created_at: string
  updated_at: string
  created_by?: string | null
  updated_by?: string | null
}

export interface Meeting {
  id: string
  client_id: string
  meeting_type: string
  title?: string | null
  description?: string | null
  scheduled_at: string
  duration_minutes?: number | null
  location?: string | null
  meeting_link?: string | null
  status: string
  notes?: string | null
  cancellation_reason?: string | null
  cancelled_at?: string | null
  completed_at?: string | null
  reminder_sent_at?: string | null
  preparation_notes?: string | null
  created_at: string
  updated_at: string
  created_by?: string | null
  updated_by?: string | null
}

export interface ClientDocument {
  id: string
  client_id: string
  title: string
  description?: string | null
  document_type: string
  file_url: string
  file_size_bytes?: number | null
  file_mime_type?: string | null
  is_visible_to_client: boolean
  uploaded_at: string
  uploaded_by?: string | null
  created_at: string
  updated_at: string
}

export interface Payment {
  id: string
  client_id: string
  service_id?: string | null
  amount: number
  payment_type: string
  payment_method?: string | null
  status: string
  transaction_id?: string | null
  payment_date?: string | null
  due_date?: string | null
  notes?: string | null
  created_at: string
  updated_at: string
  created_by?: string | null
  updated_by?: string | null
}

export interface User {
  id: string
  email: string
  full_name?: string | null
  created_at: string
  role: UserRole
}

// Invoice types
export type InvoiceStatus =
  | 'draft'
  | 'sent'
  | 'paid'
  | 'overdue'
  | 'cancelled'
  | 'refunded'
  | 'partial'

export interface InvoiceLineItem {
  description: string
  quantity: number
  unit_price: number
  total: number
}

export interface Invoice {
  id: string
  client_id: string
  service_id?: string | null
  invoice_number: string
  status: InvoiceStatus
  subtotal: number
  tax_rate: number
  tax_amount: number
  discount_amount: number
  total: number
  amount_paid: number
  balance_due: number
  issue_date: string
  due_date?: string | null
  paid_at?: string | null
  sent_at?: string | null
  line_items: InvoiceLineItem[]
  notes?: string | null
  client_notes?: string | null
  terms?: string | null
  stripe_invoice_id?: string | null
  stripe_payment_intent_id?: string | null
  payment_link?: string | null
  payment_method?: string | null
  created_at: string
  updated_at: string
  created_by?: string | null
  updated_by?: string | null
}

export interface InvoicePayment {
  id: string
  invoice_id: string
  amount: number
  payment_method: string
  payment_reference?: string | null
  payment_date: string
  notes?: string | null
  stripe_payment_id?: string | null
  stripe_charge_id?: string | null
  created_at: string
  created_by?: string | null
}

// Contract types
export interface ContractTemplate {
  id: string
  name: string
  description?: string | null
  service_type?: string | null
  content: string
  is_active: boolean
  is_default: boolean
  version: number
  created_at: string
  updated_at: string
  created_by?: string | null
}

export interface ContractSignature {
  id: string
  client_id: string
  service_id?: string | null
  template_id?: string | null
  contract_content: string
  contract_version?: number | null
  signed_at: string
  signer_name: string
  signer_email: string
  ip_address?: string | null
  user_agent?: string | null
  signature_data?: Record<string, unknown> | null
  status: 'signed' | 'voided'
  voided_at?: string | null
  voided_reason?: string | null
  created_at: string
}

// Database insert types (without auto-generated fields)
export type LeadInsert = Omit<Lead, 'id' | 'created_at' | 'updated_at'>
export type LeadActivityInsert = Omit<LeadActivity, 'id' | 'created_at'>
export type UserInsert = Omit<User, 'id' | 'created_at'>
export type ClientServiceInsert = Omit<
  ClientService,
  'id' | 'created_at' | 'updated_at'
>
export type MeetingInsert = Omit<Meeting, 'id' | 'created_at' | 'updated_at'>
export type ClientDocumentInsert = Omit<
  ClientDocument,
  'id' | 'uploaded_at' | 'created_at' | 'updated_at'
>
export type PaymentInsert = Omit<Payment, 'id' | 'created_at' | 'updated_at'>
export type InvoiceInsert = Omit<
  Invoice,
  'id' | 'created_at' | 'updated_at' | 'invoice_number' | 'balance_due'
>
export type ContractTemplateInsert = Omit<
  ContractTemplate,
  'id' | 'created_at' | 'updated_at'
>
export type ContractSignatureInsert = Omit<
  ContractSignature,
  'id' | 'created_at' | 'signed_at'
>

// =====================================================
// Team Member Types (Phase 5: Multi-Provider Support)
// =====================================================

export type TeamMemberRole = 'owner' | 'admin' | 'provider' | 'assistant'

export type AssignmentRole = 'primary' | 'backup' | 'support'

export type TimeEntryType =
  | 'client_work'
  | 'travel'
  | 'on_call'
  | 'birth_support'
  | 'admin'
  | 'training'
  | 'other'

export type OnCallType = 'primary' | 'backup'

export interface TeamMember {
  id: string
  user_id?: string | null
  role: TeamMemberRole
  display_name: string
  email: string
  phone?: string | null
  title?: string | null
  bio?: string | null
  avatar_url?: string | null
  certifications: string[]
  specialties: string[]
  is_active: boolean
  is_accepting_clients: boolean
  max_active_clients?: number | null
  hourly_rate?: number | null
  is_available_oncall: boolean
  oncall_phone?: string | null
  show_email_to_clients: boolean
  show_phone_to_clients: boolean
  created_at: string
  updated_at: string
}

export interface ClientAssignment {
  id: string
  client_id: string
  team_member_id: string
  assignment_role: AssignmentRole
  notes?: string | null
  assigned_at: string
  assigned_by?: string | null
  // Joined data
  team_member?: TeamMember
  client?: Lead
}

export interface ServiceAssignment {
  id: string
  service_id: string
  team_member_id: string
  assignment_role: AssignmentRole
  revenue_share_percent: number
  assigned_at: string
  // Joined data
  team_member?: TeamMember
  service?: ClientService
}

export interface TimeEntry {
  id: string
  team_member_id: string
  client_id?: string | null
  service_id?: string | null
  meeting_id?: string | null
  entry_date: string
  hours: number
  entry_type: TimeEntryType
  description?: string | null
  billable: boolean
  hourly_rate_override?: number | null
  invoiced: boolean
  invoice_id?: string | null
  created_at: string
  updated_at: string
  // Joined data
  team_member?: TeamMember
  client?: Lead
  service?: ClientService
  meeting?: Meeting
}

export interface OnCallSchedule {
  id: string
  team_member_id: string
  start_date: string
  end_date: string
  oncall_type: OnCallType
  notes?: string | null
  created_at: string
  created_by?: string | null
  // Joined data
  team_member?: TeamMember
}

// Team member insert types
export type TeamMemberInsert = Omit<
  TeamMember,
  'id' | 'created_at' | 'updated_at'
>
export type ClientAssignmentInsert = Omit<
  ClientAssignment,
  'id' | 'assigned_at' | 'team_member' | 'client'
>
export type ServiceAssignmentInsert = Omit<
  ServiceAssignment,
  'id' | 'assigned_at' | 'team_member' | 'service'
>
export type TimeEntryInsert = Omit<
  TimeEntry,
  | 'id'
  | 'created_at'
  | 'updated_at'
  | 'team_member'
  | 'client'
  | 'service'
  | 'meeting'
  | 'invoiced' // Has default value in DB
> & {
  invoiced?: boolean
}
export type OnCallScheduleInsert = Omit<
  OnCallSchedule,
  'id' | 'created_at' | 'team_member'
>

// Helper types for team-related queries
export interface TeamMemberWithStats extends TeamMember {
  active_client_count?: number
  total_hours_this_month?: number
  total_revenue_this_month?: number
}

export interface ClientTeamInfo {
  team_member_id: string
  display_name: string
  role: TeamMemberRole
  assignment_role: AssignmentRole
  email: string
  phone?: string | null
  show_email_to_clients: boolean
  show_phone_to_clients: boolean
}

export interface CurrentOnCall {
  team_member_id: string
  display_name: string
  oncall_type: OnCallType
  oncall_phone?: string | null
  start_date: string
  end_date: string
}

// =====================================================
// Salesforce-Like Features (Phase 7)
// =====================================================

// UI Preferences
export type UIDensity = 'compact' | 'comfortable' | 'spacious'
export type ThemePreference = 'light' | 'dark' | 'system'
export type ViewVisibility = 'private' | 'shared' | 'org'
export type ViewMode = 'table' | 'kanban' | 'calendar' | 'cards'
export type ReportType = 'tabular' | 'summary' | 'matrix' | 'chart'
export type WidgetType =
  | 'metric'
  | 'chart'
  | 'table'
  | 'report'
  | 'list'
  | 'funnel'
  | 'gauge'
  | 'calendar'
export type ObjectType =
  | 'leads'
  | 'clients'
  | 'invoices'
  | 'meetings'
  | 'team_members'
  | 'payments'
  | 'services'
export type DataSource = 'report' | 'query' | 'static'
export type ChartType = 'bar' | 'line' | 'pie' | 'donut' | 'area' | 'scatter'

// Filter system
export type FilterOperator =
  | 'equals'
  | 'not_equals'
  | 'contains'
  | 'not_contains'
  | 'starts_with'
  | 'ends_with'
  | 'greater_than'
  | 'less_than'
  | 'greater_or_equal'
  | 'less_or_equal'
  | 'is_null'
  | 'is_not_null'
  | 'in'
  | 'not_in'
  | 'between'
  | 'this_week'
  | 'this_month'
  | 'this_quarter'
  | 'last_n_days'

export interface FilterCondition {
  id: string
  field: string
  operator: FilterOperator
  value: unknown
  logic?: 'AND' | 'OR'
}

export interface ColumnConfig {
  field: string
  label: string
  visible: boolean
  width?: number
  sortable?: boolean
  filterable?: boolean
  editable?: boolean
  format?:
    | 'text'
    | 'number'
    | 'date'
    | 'datetime'
    | 'currency'
    | 'badge'
    | 'link'
    | 'avatar'
    | 'boolean'
  formatOptions?: Record<string, unknown>
}

export interface SortConfig {
  field: string
  direction: 'asc' | 'desc'
}

export interface KanbanConfig {
  statusField: string
  swimlaneField?: string
  cardFields: string[]
  columnOrder?: string[]
}

export type AggregationType =
  | 'sum'
  | 'count'
  | 'avg'
  | 'min'
  | 'max'
  | 'count_distinct'

export interface AggregationConfig {
  id: string
  field: string
  type: AggregationType
  label: string
  // Legacy support
  function?: AggregationType
}

export interface ChartConfig {
  type: ChartType
  xAxis?: string
  yAxis?: string
  series?: string[]
  colors?: string[]
  title?: string
  colorScheme?: string
  showLegend?: boolean
  showDataLabels?: boolean
  showGrid?: boolean
  horizontal?: boolean
  stacked?: boolean
}

// Report configuration used by the builder wizard
export interface ReportConfig {
  name: string
  description: string
  report_type: ReportType
  object_type: ObjectType
  columns: ColumnConfig[]
  filters: FilterCondition[]
  groupings: string[]
  aggregations: AggregationConfig[]
  chart_config: ChartConfig
  visibility: ViewVisibility
}

export interface WidgetPosition {
  widget_id: string
  x: number
  y: number
  width: number
  height: number
}

// User Preferences
export interface UserPreferences {
  id: string
  user_id: string
  ui_density: UIDensity
  theme: ThemePreference
  sidebar_collapsed: boolean
  default_lead_view_id?: string | null
  default_client_view_id?: string | null
  default_invoice_view_id?: string | null
  default_meeting_view_id?: string | null
  dashboard_layout: Record<string, unknown>
  default_dashboard_id?: string | null
  pinned_reports: string[]
  recent_leads: string[]
  recent_clients: string[]
  email_notifications: boolean
  in_app_notifications: boolean
  created_at: string
  updated_at: string
}

// List Views
export interface ListView {
  id: string
  created_by: string
  name: string
  description?: string | null
  object_type: ObjectType
  visibility: ViewVisibility
  is_default: boolean
  is_pinned: boolean
  filters: FilterCondition[]
  columns: ColumnConfig[]
  sort_config: SortConfig
  group_by?: string | null
  view_mode: ViewMode
  kanban_config: KanbanConfig
  quick_filters: FilterCondition[]
  created_at: string
  updated_at: string
}

// Saved Filters
export interface SavedFilter {
  id: string
  created_by: string
  name: string
  object_type: ObjectType
  filter_config: FilterCondition[]
  visibility: ViewVisibility
  created_at: string
}

// Reports
export interface Report {
  id: string
  created_by: string
  name: string
  description?: string | null
  report_type: ReportType
  object_type: ObjectType
  columns: ColumnConfig[]
  filters: FilterCondition[]
  groupings: string[]
  aggregations: AggregationConfig[]
  chart_config: ChartConfig
  visibility: ViewVisibility
  schedule_config?: Record<string, unknown> | null
  created_at: string
  updated_at: string
}

// Report execution result
export interface ReportExecutionResult {
  rows: Record<string, unknown>[]
  totalCount: number
  aggregations?: Record<string, number | string>
  groupedData?: Record<string, Record<string, unknown>[]>
}

// Dashboards
export interface Dashboard {
  id: string
  created_by: string
  name: string
  description?: string | null
  layout: WidgetPosition[]
  visibility: ViewVisibility
  is_default: boolean
  auto_refresh_seconds: number
  created_at: string
  updated_at: string
  widgets?: DashboardWidget[]
}

// Dashboard Widgets
export interface DashboardWidget {
  id: string
  dashboard_id: string
  widget_type: WidgetType
  title: string
  config: Record<string, unknown>
  grid_x: number
  grid_y: number
  grid_width: number
  grid_height: number
  data_source?: DataSource | null
  report_id?: string | null
  query_config: Record<string, unknown>
  created_at: string
  updated_at: string
}

// =====================================================
// Client Journey Types
// =====================================================

export type JourneyPhase = 'consultation' | 'prenatal' | 'birth' | 'postpartum'

export type ActionItemType =
  | 'intake_form'
  | 'sign_contract'
  | 'upload_document'
  | 'schedule_meeting'
  | 'make_payment'
  | 'review_document'
  | 'custom'

export type ActionItemStatus =
  | 'pending'
  | 'in_progress'
  | 'completed'
  | 'skipped'

// Action Item Templates
export interface ActionItemTemplate {
  id: string
  name: string
  description?: string | null
  service_type?: ServiceType | null
  default_items: ActionItemTemplateItem[]
  is_active: boolean
  created_at: string
  updated_at: string
  created_by?: string | null
}

export interface ActionItemTemplateItem {
  title: string
  action_type: ActionItemType
  priority: number
  action_url?: string
  description?: string
}

// Client Action Items
export interface ClientActionItem {
  id: string
  client_id: string
  service_id?: string | null
  template_id?: string | null
  title: string
  description?: string | null
  action_type: ActionItemType
  status: ActionItemStatus
  completed_at?: string | null
  priority: number
  display_order: number
  due_date?: string | null
  auto_complete_trigger?: string | null
  action_url?: string | null
  created_at: string
  updated_at: string
  created_by?: string | null
}

// Client Journey Milestones
export interface ClientJourneyMilestone {
  id: string
  client_id: string
  milestone_type: string
  milestone_label: string
  phase: JourneyPhase
  completed_at?: string | null
  expected_date?: string | null
  display_order: number
  created_at: string
}

// Extended Lead with journey fields
export interface LeadWithJourney extends Lead {
  journey_phase?: JourneyPhase | null
  journey_started_at?: string | null
  last_portal_visit?: string | null
  preferred_provider_id?: string | null
}

// =====================================================
// Insert Types for New Tables
// =====================================================

export type UserPreferencesInsert = Omit<
  UserPreferences,
  'id' | 'created_at' | 'updated_at'
>
export type ListViewInsert = Omit<ListView, 'id' | 'created_at' | 'updated_at'>
export type SavedFilterInsert = Omit<SavedFilter, 'id' | 'created_at'>
export type ReportInsert = Omit<Report, 'id' | 'created_at' | 'updated_at'>
export type DashboardInsert = Omit<
  Dashboard,
  'id' | 'created_at' | 'updated_at' | 'widgets'
>
export type DashboardWidgetInsert = Omit<
  DashboardWidget,
  'id' | 'created_at' | 'updated_at'
>
export type ActionItemTemplateInsert = Omit<
  ActionItemTemplate,
  'id' | 'created_at' | 'updated_at'
>
export type ClientActionItemInsert = Omit<
  ClientActionItem,
  'id' | 'created_at' | 'updated_at'
>
export type ClientJourneyMilestoneInsert = Omit<
  ClientJourneyMilestone,
  'id' | 'created_at'
>

// =====================================================
// Helper Types for Dashboard KPIs
// =====================================================

export interface DashboardKPIs {
  totalLeads: number
  newLeadsThisMonth: number
  newLeadsLastMonth: number
  activeClients: number
  conversionRate: number
  totalRevenue: number
  pendingRevenue: number
  revenueThisMonth: number
  revenueLastMonth: number
  upcomingBirths: number
  overdueInvoices: number
  meetingsThisWeek: number
}

export interface LeadFunnelData {
  stage: string
  count: number
}

export interface RevenueByMonth {
  month: string
  total: number
  count: number
}

// =====================================================
// Client Portal Dashboard Types
// =====================================================

export interface ClientDashboardData {
  client: LeadWithJourney
  nextAppointment?: Meeting | null
  actionItems: ClientActionItem[]
  journeyMilestones: ClientJourneyMilestone[]
  careTeam: ClientTeamInfo[]
  paymentSummary: {
    total: number
    paid: number
    balance: number
  }
  activeServices: ClientService[]
  recentDocuments: ClientDocument[]
}

// =====================================================
// Roles & Permissions Types
// =====================================================

export type PermissionAction = 'create' | 'read' | 'update' | 'delete' | '*'

export interface Permissions {
  [object: string]: PermissionAction[]
}

export interface Role {
  id: string
  name: string
  description?: string | null
  is_system: boolean
  permissions: Permissions
  hierarchy_level: number
  created_at: string
  updated_at: string
}

export interface UserInvitation {
  id: string
  email: string
  role_id?: string | null
  team_member_id?: string | null
  invited_by?: string | null
  token: string
  expires_at: string
  accepted_at?: string | null
  created_at: string
  // Joined data
  role?: Role
  team_member?: TeamMember
}

// Extended User with role info
export interface UserWithRole extends User {
  role_id?: string | null
  is_active: boolean
  invited_at?: string | null
  invited_by?: string | null
  last_login_at?: string | null
  role_details?: Role
}

export type RoleInsert = Omit<Role, 'id' | 'created_at' | 'updated_at'>
export type UserInvitationInsert = Omit<
  UserInvitation,
  'id' | 'created_at' | 'role' | 'team_member'
>

// =====================================================
// Company Settings Types
// =====================================================

export interface BusinessHours {
  open: string | null
  close: string | null
}

export interface CompanySettings {
  id: string
  company_name: string
  tagline?: string | null
  legal_name?: string | null
  email?: string | null
  phone?: string | null
  website?: string | null
  address_line1?: string | null
  address_line2?: string | null
  city?: string | null
  state?: string | null
  postal_code?: string | null
  country: string
  logo_url?: string | null
  favicon_url?: string | null
  primary_color: string
  secondary_color: string
  timezone: string
  currency: string
  business_hours: Record<string, BusinessHours | null>
  invoice_prefix: string
  invoice_footer?: string | null
  tax_rate: number
  tax_id?: string | null
  payment_terms: string
  portal_welcome_message?: string | null
  created_at: string
  updated_at: string
}

export type CompanySettingsUpdate = Partial<
  Omit<CompanySettings, 'id' | 'created_at' | 'updated_at'>
>

// =====================================================
// Service Packages Types
// =====================================================

export type ServicePriceType = 'fixed' | 'hourly' | 'custom'

export interface ServicePackage {
  id: string
  name: string
  description?: string | null
  service_type: ServiceType
  base_price: number
  price_type: ServicePriceType
  included_features: string[]
  contract_template_id?: string | null
  intake_form_template_id?: string | null
  requires_contract: boolean
  requires_deposit: boolean
  deposit_amount?: number | null
  deposit_percent?: number | null
  is_active: boolean
  is_featured: boolean
  display_order: number
  created_at: string
  updated_at: string
}

export type ServicePackageInsert = Omit<
  ServicePackage,
  'id' | 'created_at' | 'updated_at'
>

export type ServicePackageUpdate = Partial<ServicePackageInsert>

// =====================================================
// Extended DashboardWidget with drill-down
// =====================================================

export interface DashboardWidgetWithDrillDown extends DashboardWidget {
  drill_down_report_id?: string | null
}

// =====================================================
// Welcome Packets Types
// =====================================================

export type WelcomePacketTrigger =
  | 'contract_signed'
  | 'lead_converted'
  | 'manual'

export type WelcomePacketItemType =
  | 'document'
  | 'email'
  | 'form'
  | 'custom_message'
  | 'action_item'

export type WelcomePacketDeliveryStatus =
  | 'pending'
  | 'in_progress'
  | 'completed'
  | 'failed'
  | 'cancelled'

export type WelcomePacketItemDeliveryStatus =
  | 'pending'
  | 'scheduled'
  | 'delivered'
  | 'failed'
  | 'skipped'

export interface WelcomePacket {
  id: string
  name: string
  description?: string | null
  service_type?: string | null
  is_active: boolean
  trigger_on: WelcomePacketTrigger
  created_at: string
  updated_at: string
  created_by?: string | null
}

export interface WelcomePacketItem {
  id: string
  packet_id: string
  item_type: WelcomePacketItemType
  item_id?: string | null
  custom_title?: string | null
  custom_content?: string | null
  sort_order: number
  delay_hours: number
  is_required: boolean
  created_at: string
}

export interface WelcomePacketDelivery {
  id: string
  packet_id: string
  client_id: string
  status: WelcomePacketDeliveryStatus
  triggered_at: string
  completed_at?: string | null
  error_message?: string | null
  metadata?: Record<string, unknown> | null
  created_at: string
}

export interface WelcomePacketItemDelivery {
  id: string
  delivery_id: string
  item_id: string
  status: WelcomePacketItemDeliveryStatus
  scheduled_at?: string | null
  delivered_at?: string | null
  error_message?: string | null
  created_at: string
}

// Welcome Packet with items count for list views
export interface WelcomePacketWithItemCount extends WelcomePacket {
  items?: { count: number }[]
}

// Insert types
export type WelcomePacketInsert = Omit<
  WelcomePacket,
  'id' | 'created_at' | 'updated_at'
>

export type WelcomePacketUpdate = Partial<WelcomePacketInsert>

export type WelcomePacketItemInsert = Omit<
  WelcomePacketItem,
  'id' | 'created_at'
>

export type WelcomePacketItemUpdate = Partial<
  Omit<WelcomePacketItemInsert, 'packet_id'>
>

// =====================================================
// Multi-Tenancy Types (Phase C.1: SaaS Foundation)
// =====================================================

export type SubscriptionStatus =
  | 'trialing'
  | 'active'
  | 'past_due'
  | 'cancelled'
  | 'paused'

export type SubscriptionTier =
  | 'starter'
  | 'professional'
  | 'enterprise'
  | 'custom'

export type OrganizationRole = 'owner' | 'admin' | 'member' | 'viewer'

export interface Organization {
  id: string
  name: string
  slug: string

  // Branding
  logo_url?: string | null
  primary_color: string
  secondary_color: string

  // Settings (JSONB)
  settings: Record<string, unknown>

  // Stripe billing (rails only)
  stripe_customer_id?: string | null
  stripe_subscription_id?: string | null

  // Subscription
  subscription_status: SubscriptionStatus
  subscription_tier: SubscriptionTier
  trial_ends_at?: string | null
  subscription_ends_at?: string | null

  // Usage limits
  max_team_members: number
  max_clients: number
  max_storage_mb: number
  max_workflows: number

  // Contact info
  billing_email?: string | null
  billing_name?: string | null

  // Owner
  owner_user_id?: string | null

  // Metadata
  created_at: string
  updated_at: string
  deleted_at?: string | null
}

export interface OrganizationMembership {
  id: string
  organization_id: string
  user_id: string
  role: OrganizationRole

  // Invitation tracking
  invited_by?: string | null
  invited_at?: string | null
  accepted_at?: string | null

  is_active: boolean
  created_at: string
  updated_at: string

  // Joined data
  organization?: Organization
  user?: User
}

// Organization with usage stats
export interface OrganizationWithUsage extends Organization {
  current_team_members?: number
  current_clients?: number
  current_storage_mb?: number
  current_workflows?: number
}

// Insert/Update types
export type OrganizationInsert = Omit<
  Organization,
  'id' | 'created_at' | 'updated_at'
>

export type OrganizationUpdate = Partial<
  Omit<OrganizationInsert, 'slug'> // slug should be immutable
>

export type OrganizationMembershipInsert = Omit<
  OrganizationMembership,
  'id' | 'created_at' | 'updated_at' | 'organization' | 'user'
>

// =====================================================
// Feature Flags & Subscription Plans Types
// =====================================================

export interface FeatureFlags {
  // Team features
  max_team_members: number
  custom_roles: boolean

  // Client features
  max_clients: number
  client_portal: boolean

  // Workflow features
  max_workflows: number
  workflow_templates: boolean
  advanced_conditions: boolean

  // Communication features
  email_enabled: boolean
  sms_enabled: boolean
  max_emails_per_month: number
  max_sms_per_month: number

  // Storage features
  max_storage_mb: number
  document_uploads: boolean

  // Branding features
  custom_branding: boolean
  white_label: boolean
  custom_domain: boolean

  // Analytics features
  basic_reports: boolean
  advanced_reports: boolean
  custom_dashboards: boolean

  // Integration features
  api_access: boolean
  webhook_access: boolean
  calendar_sync: boolean

  // Support features
  priority_support: boolean
  dedicated_account_manager: boolean
}

export interface SubscriptionPlan {
  id: string // 'starter', 'professional', 'enterprise'
  name: string
  description?: string | null
  price_monthly: number // cents
  price_yearly: number // cents
  features: FeatureFlags
  is_active: boolean
  is_default: boolean
  display_order: number
  created_at: string
  updated_at: string
}

// Default feature flags per tier
export const DEFAULT_FEATURE_FLAGS: Record<SubscriptionTier, FeatureFlags> = {
  starter: {
    max_team_members: 3,
    custom_roles: false,
    max_clients: 50,
    client_portal: true,
    max_workflows: 5,
    workflow_templates: true,
    advanced_conditions: false,
    email_enabled: true,
    sms_enabled: false,
    max_emails_per_month: 500,
    max_sms_per_month: 0,
    max_storage_mb: 500,
    document_uploads: true,
    custom_branding: false,
    white_label: false,
    custom_domain: false,
    basic_reports: true,
    advanced_reports: false,
    custom_dashboards: false,
    api_access: false,
    webhook_access: false,
    calendar_sync: false,
    priority_support: false,
    dedicated_account_manager: false,
  },
  professional: {
    max_team_members: 10,
    custom_roles: true,
    max_clients: 500,
    client_portal: true,
    max_workflows: 50,
    workflow_templates: true,
    advanced_conditions: true,
    email_enabled: true,
    sms_enabled: true,
    max_emails_per_month: 5000,
    max_sms_per_month: 500,
    max_storage_mb: 5000,
    document_uploads: true,
    custom_branding: true,
    white_label: false,
    custom_domain: false,
    basic_reports: true,
    advanced_reports: true,
    custom_dashboards: true,
    api_access: true,
    webhook_access: true,
    calendar_sync: true,
    priority_support: true,
    dedicated_account_manager: false,
  },
  enterprise: {
    max_team_members: -1, // Unlimited
    custom_roles: true,
    max_clients: -1, // Unlimited
    client_portal: true,
    max_workflows: -1, // Unlimited
    workflow_templates: true,
    advanced_conditions: true,
    email_enabled: true,
    sms_enabled: true,
    max_emails_per_month: -1, // Unlimited
    max_sms_per_month: -1, // Unlimited
    max_storage_mb: -1, // Unlimited
    document_uploads: true,
    custom_branding: true,
    white_label: true,
    custom_domain: true,
    basic_reports: true,
    advanced_reports: true,
    custom_dashboards: true,
    api_access: true,
    webhook_access: true,
    calendar_sync: true,
    priority_support: true,
    dedicated_account_manager: true,
  },
  custom: {
    // Custom plans - features set per organization
    max_team_members: -1,
    custom_roles: true,
    max_clients: -1,
    client_portal: true,
    max_workflows: -1,
    workflow_templates: true,
    advanced_conditions: true,
    email_enabled: true,
    sms_enabled: true,
    max_emails_per_month: -1,
    max_sms_per_month: -1,
    max_storage_mb: -1,
    document_uploads: true,
    custom_branding: true,
    white_label: true,
    custom_domain: true,
    basic_reports: true,
    advanced_reports: true,
    custom_dashboards: true,
    api_access: true,
    webhook_access: true,
    calendar_sync: true,
    priority_support: true,
    dedicated_account_manager: true,
  },
}

// ============================================================================
// Phase E: Lead Attribution Types
// ============================================================================

export type ReferralPartnerType =
  | 'healthcare'
  | 'business'
  | 'individual'
  | 'organization'
  | 'other'

export interface ReferralPartner {
  id: string
  organization_id: string
  name: string
  email?: string | null
  phone?: string | null
  business_name?: string | null
  partner_type: ReferralPartnerType
  referral_code?: string | null
  referral_url?: string | null
  commission_percent?: number | null
  commission_flat_fee?: number | null
  notes?: string | null
  address?: string | null
  specialization?: string | null
  lead_count: number
  converted_count: number
  is_active: boolean
  created_at: string
  updated_at: string
}

// ============================================================================
// Phase E: Client Satisfaction Types
// ============================================================================

export type SurveyType = 'nps' | 'csat' | 'custom'

export type SurveyTriggerType =
  | 'manual'
  | 'after_service'
  | 'after_meeting'
  | 'workflow'

export type SurveyQuestionType =
  | 'nps'
  | 'rating'
  | 'text'
  | 'multiple_choice'
  | 'single_choice'

export type NPSSentiment = 'promoter' | 'passive' | 'detractor'

export interface SurveyQuestion {
  id: string
  type: SurveyQuestionType
  question: string
  required: boolean
  options?: string[]
}

export interface Survey {
  id: string
  organization_id: string
  name: string
  description?: string | null
  survey_type: SurveyType
  questions: SurveyQuestion[]
  thank_you_message?: string | null
  trigger_type: SurveyTriggerType
  is_active: boolean
  response_count: number
  average_score?: number | null
  created_at: string
  updated_at: string
}

export interface SurveyResponse {
  id: string
  survey_id: string
  client_id: string
  service_id?: string | null
  organization_id: string
  responses: Record<string, string | number>
  nps_score?: number | null
  feedback_text?: string | null
  sentiment?: NPSSentiment | null
  submitted_at: string
  ip_address?: string | null
  user_agent?: string | null
}

export interface SurveyInvitation {
  id: string
  survey_id: string
  client_id: string
  service_id?: string | null
  sent_at: string
  sent_via: 'email' | 'portal' | 'sms'
  opened_at?: string | null
  completed_at?: string | null
  token: string
  expires_at: string
}

/**
 * Calculate NPS sentiment from a score
 */
export function getNPSSentiment(score: number): NPSSentiment {
  if (score >= 9) return 'promoter'
  if (score >= 7) return 'passive'
  return 'detractor'
}

/**
 * Calculate NPS from an array of scores
 * NPS = %Promoters - %Detractors
 */
export function calculateNPS(scores: number[]): number {
  if (scores.length === 0) return 0

  const promoters = scores.filter(s => s >= 9).length
  const detractors = scores.filter(s => s <= 6).length

  const promoterPercent = (promoters / scores.length) * 100
  const detractorPercent = (detractors / scores.length) * 100

  return Math.round(promoterPercent - detractorPercent)
}
