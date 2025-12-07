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
