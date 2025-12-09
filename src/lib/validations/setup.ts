import { z } from 'zod'

/**
 * Admin Setup Form Validation Schemas
 * Used with react-hook-form + zodResolver
 */

// ============================================================================
// User Management Schemas
// ============================================================================

export const inviteUserSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  role_id: z.string().optional(),
  team_member_id: z.string().optional(),
})

export type InviteUserFormData = z.infer<typeof inviteUserSchema>

export const createUserSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  fullName: z
    .string()
    .min(1, 'Full name is required')
    .min(2, 'Name must be at least 2 characters'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    ),
  roleId: z.string().optional(),
  teamMemberId: z.string().optional(),
})

export type CreateUserFormData = z.infer<typeof createUserSchema>

export const editUserSchema = z.object({
  fullName: z
    .string()
    .min(1, 'Full name is required')
    .min(2, 'Name must be at least 2 characters'),
  roleId: z.string().optional(),
})

export type EditUserFormData = z.infer<typeof editUserSchema>

// ============================================================================
// Role Management Schemas
// ============================================================================

const permissionValueSchema = z.array(
  z.enum(['create', 'read', 'update', 'delete', '*'])
)

const permissionsSchema = z.record(z.string(), permissionValueSchema)

export const createRoleSchema = z.object({
  name: z
    .string()
    .min(1, 'Role name is required')
    .min(2, 'Role name must be at least 2 characters')
    .max(50, 'Role name must be less than 50 characters')
    .regex(
      /^[a-zA-Z0-9_\s-]+$/,
      'Role name can only contain letters, numbers, spaces, underscores, and hyphens'
    ),
  description: z
    .string()
    .max(255, 'Description must be less than 255 characters')
    .optional(),
  permissions: permissionsSchema,
})

export type CreateRoleFormData = z.infer<typeof createRoleSchema>

export const editRoleSchema = z.object({
  name: z
    .string()
    .min(1, 'Role name is required')
    .min(2, 'Role name must be at least 2 characters')
    .max(50, 'Role name must be less than 50 characters')
    .regex(
      /^[a-zA-Z0-9_\s-]+$/,
      'Role name can only contain letters, numbers, spaces, underscores, and hyphens'
    ),
  description: z
    .string()
    .max(255, 'Description must be less than 255 characters')
    .optional(),
  permissions: permissionsSchema,
})

export type EditRoleFormData = z.infer<typeof editRoleSchema>

// ============================================================================
// Service Package Schemas
// ============================================================================

export const servicePackageSchema = z.object({
  name: z
    .string()
    .min(1, 'Package name is required')
    .min(2, 'Package name must be at least 2 characters')
    .max(100, 'Package name must be less than 100 characters'),
  description: z
    .string()
    .max(1000, 'Description must be less than 1000 characters')
    .optional(),
  service_type: z.enum([
    'birth_doula',
    'postpartum_doula',
    'lactation',
    'childbirth_ed',
    'other',
  ]),
  price_type: z.enum(['fixed', 'hourly', 'custom']),
  base_price: z.coerce
    .number()
    .min(0, 'Price must be 0 or greater')
    .max(99999, 'Price must be less than $100,000'),
  features: z.array(z.string()).default([]),
  contract_template_id: z.string().optional(),
  deposit_percentage: z.coerce
    .number()
    .min(0, 'Deposit must be 0% or greater')
    .max(100, 'Deposit must be 100% or less')
    .optional(),
  is_active: z.boolean().default(true),
  is_featured: z.boolean().default(false),
})

export type ServicePackageFormData = z.infer<typeof servicePackageSchema>

// ============================================================================
// Contract Template Schemas
// ============================================================================

export const contractTemplateSchema = z.object({
  name: z
    .string()
    .min(1, 'Template name is required')
    .min(2, 'Template name must be at least 2 characters')
    .max(100, 'Template name must be less than 100 characters'),
  description: z
    .string()
    .max(500, 'Description must be less than 500 characters')
    .optional(),
  service_type: z
    .enum([
      'birth_doula',
      'postpartum_doula',
      'lactation',
      'childbirth_ed',
      'other',
    ])
    .optional(),
  content: z
    .string()
    .min(1, 'Contract content is required')
    .min(50, 'Contract content must be at least 50 characters'),
  is_default: z.boolean().default(false),
})

export type ContractTemplateFormData = z.infer<typeof contractTemplateSchema>

// ============================================================================
// Company Settings Schema
// ============================================================================

export const companySettingsSchema = z.object({
  // Basic Info
  company_name: z
    .string()
    .min(1, 'Company name is required')
    .max(100, 'Company name must be less than 100 characters'),
  legal_name: z
    .string()
    .max(100, 'Legal name must be less than 100 characters'),
  tagline: z.string().max(200, 'Tagline must be less than 200 characters'),

  // Contact Info
  email: z.union([z.string().email('Invalid email address'), z.literal('')]),
  phone: z.string().max(20, 'Phone number must be less than 20 characters'),
  website: z.union([z.string().url('Invalid website URL'), z.literal('')]),

  // Address
  address_line1: z
    .string()
    .max(100, 'Address must be less than 100 characters'),
  address_line2: z
    .string()
    .max(100, 'Address must be less than 100 characters'),
  city: z.string().max(50, 'City must be less than 50 characters'),
  state: z.string().max(50, 'State must be less than 50 characters'),
  postal_code: z
    .string()
    .max(20, 'Postal code must be less than 20 characters'),
  country: z.string(),

  // Branding
  primary_color: z
    .string()
    .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Invalid hex color'),
  secondary_color: z
    .string()
    .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Invalid hex color'),

  // Preferences
  timezone: z.string().min(1, 'Timezone is required'),
  currency: z.string().min(1, 'Currency is required'),

  // Invoice Settings
  invoice_prefix: z
    .string()
    .max(10, 'Invoice prefix must be less than 10 characters'),
  invoice_footer: z
    .string()
    .max(500, 'Invoice footer must be less than 500 characters'),
  tax_rate: z
    .number()
    .min(0, 'Tax rate must be 0 or greater')
    .max(100, 'Tax rate must be 100 or less'),
  tax_id: z.string().max(50, 'Tax ID must be less than 50 characters'),
  payment_terms: z
    .string()
    .max(50, 'Payment terms must be less than 50 characters'),

  // Portal Settings
  portal_welcome_message: z
    .string()
    .max(2000, 'Welcome message must be less than 2000 characters'),
})

export type CompanySettingsFormData = z.infer<typeof companySettingsSchema>
