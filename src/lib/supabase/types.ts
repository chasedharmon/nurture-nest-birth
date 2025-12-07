export type LeadSource = 'contact_form' | 'newsletter' | 'manual'

export type LeadStatus = 'new' | 'contacted' | 'scheduled' | 'client' | 'lost'

export type ActivityType =
  | 'note'
  | 'email_sent'
  | 'call'
  | 'meeting'
  | 'status_change'

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
}

export interface LeadActivity {
  id: string
  lead_id: string
  created_at: string
  created_by_user_id?: string | null
  activity_type: ActivityType
  content: string
  metadata?: Record<string, unknown> | null
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
