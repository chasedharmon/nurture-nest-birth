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

export type RelatedRecordType = 'service' | 'meeting' | 'payment' | 'document'

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
  service_type: ServiceType
  package_name?: string | null
  start_date?: string | null
  end_date?: string | null
  status: ServiceStatus
  contract_signed: boolean
  contract_url?: string | null
  price?: number | null
  payment_status: PaymentStatus
  notes?: string | null
  created_at: string
  updated_at: string
}

export interface Meeting {
  id: string
  client_id: string
  meeting_type: MeetingType
  scheduled_at: string
  duration_minutes: number
  location?: string | null
  status: MeetingStatus
  meeting_notes?: string | null
  preparation_notes?: string | null
  completed_at?: string | null
  created_by?: string | null
  created_at: string
  updated_at: string
}

export interface ClientDocument {
  id: string
  client_id: string
  document_type: DocumentType
  title: string
  description?: string | null
  file_url: string
  file_size?: number | null
  mime_type?: string | null
  is_client_visible: boolean
  uploaded_by?: string | null
  uploaded_at: string
}

export interface Payment {
  id: string
  client_id: string
  service_id?: string | null
  amount: number
  payment_method?: PaymentMethod | null
  transaction_id?: string | null
  status: PaymentStatusType
  payment_date?: string | null
  notes?: string | null
  created_at: string
}

export interface User {
  id: string
  email: string
  full_name?: string | null
  created_at: string
  role: UserRole
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
export type ClientDocumentInsert = Omit<ClientDocument, 'id' | 'uploaded_at'>
export type PaymentInsert = Omit<Payment, 'id' | 'created_at'>
