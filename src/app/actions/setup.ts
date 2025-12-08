'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient, createClient } from '@/lib/supabase/server'
import type {
  Role,
  UserInvitation,
  UserWithRole,
  Permissions,
  TeamMember,
  ContractTemplate,
} from '@/lib/supabase/types'
import { Resend } from 'resend'

// ============================================================================
// ROLES
// ============================================================================

export async function getRoles(): Promise<{
  success: boolean
  roles?: Role[]
  error?: string
}> {
  try {
    const supabase = createAdminClient()

    const { data: roles, error } = await supabase
      .from('roles')
      .select('*')
      .order('is_system', { ascending: false })
      .order('name')

    if (error) throw error

    return { success: true, roles: roles || [] }
  } catch (error) {
    console.error('[Setup] Failed to get roles:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get roles',
    }
  }
}

export async function getRole(
  roleId: string
): Promise<{ success: boolean; role?: Role; error?: string }> {
  try {
    const supabase = createAdminClient()

    const { data: role, error } = await supabase
      .from('roles')
      .select('*')
      .eq('id', roleId)
      .single()

    if (error) throw error

    return { success: true, role }
  } catch (error) {
    console.error('[Setup] Failed to get role:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get role',
    }
  }
}

export async function createRole(data: {
  name: string
  description?: string
  permissions: Permissions
}): Promise<{ success: boolean; role?: Role; error?: string }> {
  try {
    const supabase = createAdminClient()

    const { data: role, error } = await supabase
      .from('roles')
      .insert({
        name: data.name.toLowerCase().replace(/\s+/g, '_'),
        description: data.description || null,
        permissions: data.permissions,
        is_system: false,
      })
      .select()
      .single()

    if (error) throw error

    revalidatePath('/admin/setup/roles')
    return { success: true, role }
  } catch (error) {
    console.error('[Setup] Failed to create role:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create role',
    }
  }
}

export async function updateRole(
  roleId: string,
  data: {
    name?: string
    description?: string
    permissions?: Permissions
  }
): Promise<{ success: boolean; role?: Role; error?: string }> {
  try {
    const supabase = createAdminClient()

    // Check if this is a system role - only allow permission updates for system roles
    const { data: existingRole, error: fetchError } = await supabase
      .from('roles')
      .select('is_system')
      .eq('id', roleId)
      .single()

    if (fetchError) throw fetchError

    const updateData: Record<string, unknown> = {}

    // System roles can only have permissions updated
    if (existingRole.is_system) {
      if (data.permissions !== undefined) {
        updateData.permissions = data.permissions
      }
    } else {
      if (data.name !== undefined) {
        updateData.name = data.name.toLowerCase().replace(/\s+/g, '_')
      }
      if (data.description !== undefined) {
        updateData.description = data.description
      }
      if (data.permissions !== undefined) {
        updateData.permissions = data.permissions
      }
    }

    const { data: role, error } = await supabase
      .from('roles')
      .update(updateData)
      .eq('id', roleId)
      .select()
      .single()

    if (error) throw error

    revalidatePath('/admin/setup/roles')
    return { success: true, role }
  } catch (error) {
    console.error('[Setup] Failed to update role:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update role',
    }
  }
}

export async function deleteRole(
  roleId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createAdminClient()

    // Check if role is system role (can't delete)
    const { data: role, error: fetchError } = await supabase
      .from('roles')
      .select('is_system')
      .eq('id', roleId)
      .single()

    if (fetchError) throw fetchError

    if (role.is_system) {
      return { success: false, error: 'Cannot delete system roles' }
    }

    // Check if any users have this role
    const { data: usersWithRole, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('role_id', roleId)
      .limit(1)

    if (userError) throw userError

    if (usersWithRole && usersWithRole.length > 0) {
      return {
        success: false,
        error: 'Cannot delete role while users are assigned to it',
      }
    }

    const { error } = await supabase.from('roles').delete().eq('id', roleId)

    if (error) throw error

    revalidatePath('/admin/setup/roles')
    return { success: true }
  } catch (error) {
    console.error('[Setup] Failed to delete role:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete role',
    }
  }
}

// ============================================================================
// USERS
// ============================================================================

export async function getUsers(): Promise<{
  success: boolean
  users?: UserWithRole[]
  error?: string
}> {
  try {
    const supabase = createAdminClient()

    const { data: users, error } = await supabase
      .from('users')
      .select(
        `
        *,
        role_details:roles(*)
      `
      )
      .order('created_at', { ascending: false })

    if (error) throw error

    return { success: true, users: (users as UserWithRole[]) || [] }
  } catch (error) {
    console.error('[Setup] Failed to get users:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get users',
    }
  }
}

export async function getUser(
  userId: string
): Promise<{ success: boolean; user?: UserWithRole; error?: string }> {
  try {
    const supabase = createAdminClient()

    const { data: user, error } = await supabase
      .from('users')
      .select(
        `
        *,
        role_details:roles(*)
      `
      )
      .eq('id', userId)
      .single()

    if (error) throw error

    return { success: true, user: user as UserWithRole }
  } catch (error) {
    console.error('[Setup] Failed to get user:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get user',
    }
  }
}

export async function updateUser(
  userId: string,
  data: {
    full_name?: string
    role_id?: string
    is_active?: boolean
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createAdminClient()

    const updateData: Record<string, unknown> = {}
    if (data.full_name !== undefined) updateData.full_name = data.full_name
    if (data.role_id !== undefined) updateData.role_id = data.role_id
    if (data.is_active !== undefined) updateData.is_active = data.is_active

    const { error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', userId)

    if (error) throw error

    revalidatePath('/admin/setup/users')
    return { success: true }
  } catch (error) {
    console.error('[Setup] Failed to update user:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update user',
    }
  }
}

export async function deactivateUser(
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()

    // Make sure we're not deactivating our own account
    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser()

    if (currentUser?.id === userId) {
      return { success: false, error: 'Cannot deactivate your own account' }
    }

    const adminSupabase = createAdminClient()
    const { error } = await adminSupabase
      .from('users')
      .update({ is_active: false })
      .eq('id', userId)

    if (error) throw error

    revalidatePath('/admin/setup/users')
    return { success: true }
  } catch (error) {
    console.error('[Setup] Failed to deactivate user:', error)
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to deactivate user',
    }
  }
}

export async function reactivateUser(
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createAdminClient()

    const { error } = await supabase
      .from('users')
      .update({ is_active: true })
      .eq('id', userId)

    if (error) throw error

    revalidatePath('/admin/setup/users')
    return { success: true }
  } catch (error) {
    console.error('[Setup] Failed to reactivate user:', error)
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to reactivate user',
    }
  }
}

// ============================================================================
// USER INVITATIONS
// ============================================================================

export async function getInvitations(): Promise<{
  success: boolean
  invitations?: UserInvitation[]
  error?: string
}> {
  try {
    const supabase = createAdminClient()

    const { data: invitations, error } = await supabase
      .from('user_invitations')
      .select(
        `
        *,
        role:roles(*),
        team_member:team_members(*)
      `
      )
      .is('accepted_at', null)
      .order('created_at', { ascending: false })

    if (error) throw error

    return {
      success: true,
      invitations: (invitations as UserInvitation[]) || [],
    }
  } catch (error) {
    console.error('[Setup] Failed to get invitations:', error)
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to get invitations',
    }
  }
}

export async function createInvitation(data: {
  email: string
  role_id?: string
  team_member_id?: string
}): Promise<{ success: boolean; invitation?: UserInvitation; error?: string }> {
  try {
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    const adminSupabase = createAdminClient()

    // Check if email is already a user
    const { data: existingUser } = await adminSupabase
      .from('users')
      .select('id')
      .eq('email', data.email.toLowerCase())
      .single()

    if (existingUser) {
      return { success: false, error: 'A user with this email already exists' }
    }

    // Check for existing pending invitation
    const { data: existingInvitation } = await adminSupabase
      .from('user_invitations')
      .select('id')
      .eq('email', data.email.toLowerCase())
      .is('accepted_at', null)
      .single()

    if (existingInvitation) {
      return {
        success: false,
        error: 'An invitation for this email is already pending',
      }
    }

    // Generate unique token
    const token = crypto.randomUUID()
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7) // Expires in 7 days

    const { data: invitation, error } = await adminSupabase
      .from('user_invitations')
      .insert({
        email: data.email.toLowerCase(),
        role_id: data.role_id || null,
        team_member_id: data.team_member_id || null,
        invited_by: user.id,
        token,
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single()

    if (error) throw error

    // Send invitation email via Resend
    const resendApiKey = process.env.RESEND_API_KEY
    if (resendApiKey) {
      const resend = new Resend(resendApiKey)
      const baseUrl =
        process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
      const inviteUrl = `${baseUrl}/accept-invite?token=${token}`

      try {
        await resend.emails.send({
          from: 'Nurture Nest Birth <noreply@nurturenestbirth.com>',
          to: data.email,
          subject: 'You have been invited to Nurture Nest Birth CRM',
          html: `
            <h1>You've Been Invited!</h1>
            <p>You have been invited to join Nurture Nest Birth CRM.</p>
            <p>Click the link below to accept your invitation and create your account:</p>
            <p><a href="${inviteUrl}" style="display: inline-block; padding: 12px 24px; background-color: #E8A87C; color: white; text-decoration: none; border-radius: 6px;">Accept Invitation</a></p>
            <p>This invitation will expire in 7 days.</p>
            <p>If you didn't expect this invitation, you can safely ignore this email.</p>
          `,
        })
      } catch (emailError) {
        console.error('[Setup] Failed to send invitation email:', emailError)
        // Don't fail the entire operation if email fails
      }
    }

    revalidatePath('/admin/setup/users')
    return { success: true, invitation: invitation as UserInvitation }
  } catch (error) {
    console.error('[Setup] Failed to create invitation:', error)
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to create invitation',
    }
  }
}

export async function resendInvitation(
  invitationId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createAdminClient()

    // Get invitation
    const { data: invitation, error: fetchError } = await supabase
      .from('user_invitations')
      .select('*')
      .eq('id', invitationId)
      .single()

    if (fetchError || !invitation) {
      return { success: false, error: 'Invitation not found' }
    }

    // Generate new token and extend expiration
    const token = crypto.randomUUID()
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)

    const { error } = await supabase
      .from('user_invitations')
      .update({
        token,
        expires_at: expiresAt.toISOString(),
      })
      .eq('id', invitationId)

    if (error) throw error

    // Send new invitation email
    const resendApiKey = process.env.RESEND_API_KEY
    if (resendApiKey) {
      const resend = new Resend(resendApiKey)
      const baseUrl =
        process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
      const inviteUrl = `${baseUrl}/accept-invite?token=${token}`

      try {
        await resend.emails.send({
          from: 'Nurture Nest Birth <noreply@nurturenestbirth.com>',
          to: invitation.email,
          subject: 'Your invitation to Nurture Nest Birth CRM has been resent',
          html: `
            <h1>Invitation Reminder</h1>
            <p>This is a reminder that you have been invited to join Nurture Nest Birth CRM.</p>
            <p>Click the link below to accept your invitation and create your account:</p>
            <p><a href="${inviteUrl}" style="display: inline-block; padding: 12px 24px; background-color: #E8A87C; color: white; text-decoration: none; border-radius: 6px;">Accept Invitation</a></p>
            <p>This invitation will expire in 7 days.</p>
          `,
        })
      } catch (emailError) {
        console.error('[Setup] Failed to resend invitation email:', emailError)
      }
    }

    revalidatePath('/admin/setup/users')
    return { success: true }
  } catch (error) {
    console.error('[Setup] Failed to resend invitation:', error)
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to resend invitation',
    }
  }
}

export async function cancelInvitation(
  invitationId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createAdminClient()

    const { error } = await supabase
      .from('user_invitations')
      .delete()
      .eq('id', invitationId)

    if (error) throw error

    revalidatePath('/admin/setup/users')
    return { success: true }
  } catch (error) {
    console.error('[Setup] Failed to cancel invitation:', error)
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to cancel invitation',
    }
  }
}

// ============================================================================
// TEAM MEMBERS (for linking to users)
// ============================================================================

export async function getUnlinkedTeamMembers(): Promise<{
  success: boolean
  teamMembers?: TeamMember[]
  error?: string
}> {
  try {
    const supabase = createAdminClient()

    const { data: teamMembers, error } = await supabase
      .from('team_members')
      .select('*')
      .is('user_id', null)
      .eq('is_active', true)
      .order('display_name')

    if (error) throw error

    return { success: true, teamMembers: teamMembers || [] }
  } catch (error) {
    console.error('[Setup] Failed to get unlinked team members:', error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to get unlinked team members',
    }
  }
}

export async function linkUserToTeamMember(
  userId: string,
  teamMemberId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createAdminClient()

    // Update team member to link to user
    const { error } = await supabase
      .from('team_members')
      .update({ user_id: userId })
      .eq('id', teamMemberId)

    if (error) throw error

    revalidatePath('/admin/setup/users')
    revalidatePath('/admin/team')
    return { success: true }
  } catch (error) {
    console.error('[Setup] Failed to link user to team member:', error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to link user to team member',
    }
  }
}

export async function unlinkUserFromTeamMember(
  teamMemberId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createAdminClient()

    const { error } = await supabase
      .from('team_members')
      .update({ user_id: null })
      .eq('id', teamMemberId)

    if (error) throw error

    revalidatePath('/admin/setup/users')
    revalidatePath('/admin/team')
    return { success: true }
  } catch (error) {
    console.error('[Setup] Failed to unlink user from team member:', error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to unlink user from team member',
    }
  }
}

// ============================================================================
// CONTRACT TEMPLATES (for setup page)
// ============================================================================

export async function getAllContractTemplates(): Promise<{
  success: boolean
  templates?: ContractTemplate[]
  error?: string
}> {
  try {
    const supabase = createAdminClient()

    const { data: templates, error } = await supabase
      .from('contract_templates')
      .select('*')
      .order('name')

    if (error) throw error

    return { success: true, templates: templates || [] }
  } catch (error) {
    console.error('[Setup] Failed to get all contract templates:', error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to get contract templates',
    }
  }
}

export async function toggleContractTemplateActive(
  templateId: string,
  isActive: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createAdminClient()

    const { error } = await supabase
      .from('contract_templates')
      .update({ is_active: isActive })
      .eq('id', templateId)

    if (error) throw error

    revalidatePath('/admin/setup/contracts')
    return { success: true }
  } catch (error) {
    console.error('[Setup] Failed to toggle contract template:', error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to toggle contract template',
    }
  }
}

export async function deleteContractTemplate(
  templateId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createAdminClient()

    // Check if template has signatures
    const { data: signatures, error: checkError } = await supabase
      .from('contract_signatures')
      .select('id')
      .eq('template_id', templateId)
      .limit(1)

    if (checkError) throw checkError

    if (signatures && signatures.length > 0) {
      // Soft delete by deactivating instead
      const { error } = await supabase
        .from('contract_templates')
        .update({ is_active: false })
        .eq('id', templateId)

      if (error) throw error

      return { success: true }
    }

    // Hard delete if no signatures
    const { error } = await supabase
      .from('contract_templates')
      .delete()
      .eq('id', templateId)

    if (error) throw error

    revalidatePath('/admin/setup/contracts')
    return { success: true }
  } catch (error) {
    console.error('[Setup] Failed to delete contract template:', error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to delete contract template',
    }
  }
}

// ============================================================================
// INTAKE FORM TEMPLATES
// ============================================================================

export interface IntakeFormTemplate {
  id: string
  name: string
  description?: string | null
  service_type?: string | null
  schema: Record<string, unknown>
  is_active: boolean
  created_at: string
  updated_at: string
}

export async function getIntakeFormTemplates(): Promise<{
  success: boolean
  templates?: IntakeFormTemplate[]
  error?: string
}> {
  try {
    const supabase = createAdminClient()

    const { data: templates, error } = await supabase
      .from('intake_form_templates')
      .select('*')
      .order('name')

    if (error) throw error

    return { success: true, templates: templates || [] }
  } catch (error) {
    console.error('[Setup] Failed to get intake form templates:', error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to get intake form templates',
    }
  }
}

export async function toggleIntakeFormTemplateActive(
  templateId: string,
  isActive: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createAdminClient()

    const { error } = await supabase
      .from('intake_form_templates')
      .update({ is_active: isActive })
      .eq('id', templateId)

    if (error) throw error

    revalidatePath('/admin/setup/intake-forms')
    return { success: true }
  } catch (error) {
    console.error('[Setup] Failed to toggle intake form template:', error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to toggle intake form template',
    }
  }
}

// Note: Permission constants and types are exported from '@/lib/permissions'
