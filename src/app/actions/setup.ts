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
  CompanySettings,
  CompanySettingsUpdate,
  ServicePackage,
  ServicePackageInsert,
  ServicePackageUpdate,
  WelcomePacket,
  WelcomePacketInsert,
  WelcomePacketUpdate,
  WelcomePacketItem,
  WelcomePacketItemInsert,
  WelcomePacketItemUpdate,
  WelcomePacketWithItemCount,
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
      .order('hierarchy_level', { ascending: true })
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
  hierarchyLevel?: number
}): Promise<{ success: boolean; role?: Role; error?: string }> {
  try {
    const supabase = createAdminClient()

    const { data: role, error } = await supabase
      .from('roles')
      .insert({
        name: data.name.toLowerCase().replace(/\s+/g, '_'),
        description: data.description || null,
        permissions: data.permissions,
        hierarchy_level: data.hierarchyLevel ?? 100,
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

export async function validateInvitation(token: string): Promise<{
  success: boolean
  invitation?: {
    email: string
    roleName?: string
    teamMemberName?: string
    expiresAt: string
  }
  error?: string
}> {
  try {
    const supabase = createAdminClient()

    const { data: invitation, error } = await supabase
      .from('user_invitations')
      .select(
        `
        *,
        role:roles(name),
        team_member:team_members(display_name)
      `
      )
      .eq('token', token)
      .single()

    if (error || !invitation) {
      return { success: false, error: 'Invalid invitation token' }
    }

    // Check if already accepted
    if (invitation.accepted_at) {
      return {
        success: false,
        error: 'This invitation has already been accepted',
      }
    }

    // Check if expired
    if (new Date(invitation.expires_at) < new Date()) {
      return { success: false, error: 'This invitation has expired' }
    }

    return {
      success: true,
      invitation: {
        email: invitation.email,
        roleName: invitation.role?.name,
        teamMemberName: invitation.team_member?.display_name,
        expiresAt: invitation.expires_at,
      },
    }
  } catch (error) {
    console.error('[Setup] Failed to validate invitation:', error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to validate invitation',
    }
  }
}

export async function acceptInvitation(data: {
  token: string
  fullName: string
  password: string
}): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createAdminClient()

    // Get invitation details
    const { data: invitation, error: fetchError } = await supabase
      .from('user_invitations')
      .select('*')
      .eq('token', data.token)
      .single()

    if (fetchError || !invitation) {
      return { success: false, error: 'Invalid invitation token' }
    }

    // Check if already accepted
    if (invitation.accepted_at) {
      return {
        success: false,
        error: 'This invitation has already been accepted',
      }
    }

    // Check if expired
    if (new Date(invitation.expires_at) < new Date()) {
      return { success: false, error: 'This invitation has expired' }
    }

    // Create auth user via Supabase Admin API
    const { data: authData, error: authError } =
      await supabase.auth.admin.createUser({
        email: invitation.email,
        password: data.password,
        email_confirm: true,
        user_metadata: {
          full_name: data.fullName,
        },
      })

    if (authError || !authData.user) {
      console.error('[Setup] Failed to create auth user:', authError)
      return {
        success: false,
        error: authError?.message || 'Failed to create user account',
      }
    }

    // Create user record in our users table
    const { error: userError } = await supabase.from('users').insert({
      id: authData.user.id,
      email: invitation.email,
      full_name: data.fullName,
      role_id: invitation.role_id,
      is_active: true,
      invited_by: invitation.invited_by,
      invited_at: invitation.created_at,
    })

    if (userError) {
      console.error('[Setup] Failed to create user record:', userError)
      // Try to clean up auth user
      await supabase.auth.admin.deleteUser(authData.user.id)
      return { success: false, error: 'Failed to create user record' }
    }

    // Link to team member if specified
    if (invitation.team_member_id) {
      await supabase
        .from('team_members')
        .update({ user_id: authData.user.id })
        .eq('id', invitation.team_member_id)
    }

    // Mark invitation as accepted
    await supabase
      .from('user_invitations')
      .update({ accepted_at: new Date().toISOString() })
      .eq('id', invitation.id)

    revalidatePath('/admin/setup/users')
    return { success: true }
  } catch (error) {
    console.error('[Setup] Failed to accept invitation:', error)
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to accept invitation',
    }
  }
}

export async function createUser(data: {
  email: string
  fullName: string
  password: string
  roleId?: string
  teamMemberId?: string
}): Promise<{ success: boolean; userId?: string; error?: string }> {
  try {
    const supabase = createAdminClient()

    // Check if email already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', data.email.toLowerCase())
      .single()

    if (existingUser) {
      return { success: false, error: 'A user with this email already exists' }
    }

    // Create auth user via Supabase Admin API
    const { data: authData, error: authError } =
      await supabase.auth.admin.createUser({
        email: data.email.toLowerCase(),
        password: data.password,
        email_confirm: true,
        user_metadata: {
          full_name: data.fullName,
        },
      })

    if (authError || !authData.user) {
      console.error('[Setup] Failed to create auth user:', authError)
      return {
        success: false,
        error: authError?.message || 'Failed to create user account',
      }
    }

    // Create user record in our users table
    const { error: userError } = await supabase.from('users').insert({
      id: authData.user.id,
      email: data.email.toLowerCase(),
      full_name: data.fullName,
      role_id: data.roleId || null,
      is_active: true,
    })

    if (userError) {
      console.error('[Setup] Failed to create user record:', userError)
      // Try to clean up auth user
      await supabase.auth.admin.deleteUser(authData.user.id)
      return { success: false, error: 'Failed to create user record' }
    }

    // Link to team member if specified
    if (data.teamMemberId) {
      await supabase
        .from('team_members')
        .update({ user_id: authData.user.id })
        .eq('id', data.teamMemberId)
    }

    revalidatePath('/admin/setup/users')
    return { success: true, userId: authData.user.id }
  } catch (error) {
    console.error('[Setup] Failed to create user:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create user',
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

// ============================================================================
// COMPANY SETTINGS
// ============================================================================

export async function getCompanySettings(): Promise<{
  success: boolean
  settings?: CompanySettings
  error?: string
}> {
  try {
    // Use authenticated client since RLS allows authenticated users to read
    const supabase = await createClient()

    const { data: settings, error } = await supabase
      .from('company_settings')
      .select('*')
      .limit(1)
      .single()

    if (error) throw error

    return { success: true, settings: settings as CompanySettings }
  } catch (error) {
    console.error('[Setup] Failed to get company settings:', error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to get company settings',
    }
  }
}

export async function updateCompanySettings(
  data: CompanySettingsUpdate
): Promise<{ success: boolean; settings?: CompanySettings; error?: string }> {
  try {
    const supabase = createAdminClient()

    // Get the existing settings ID first
    const { data: existing, error: fetchError } = await supabase
      .from('company_settings')
      .select('id')
      .limit(1)
      .single()

    if (fetchError) throw fetchError

    const { data: settings, error } = await supabase
      .from('company_settings')
      .update(data)
      .eq('id', existing.id)
      .select()
      .single()

    if (error) throw error

    revalidatePath('/admin/setup/company')
    return { success: true, settings: settings as CompanySettings }
  } catch (error) {
    console.error('[Setup] Failed to update company settings:', error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to update company settings',
    }
  }
}

// ============================================================================
// SERVICE PACKAGES
// ============================================================================

export async function getServicePackages(): Promise<{
  success: boolean
  packages?: ServicePackage[]
  error?: string
}> {
  try {
    const supabase = createAdminClient()

    const { data: packages, error } = await supabase
      .from('service_packages')
      .select('*')
      .order('display_order', { ascending: true })
      .order('name')

    if (error) throw error

    return { success: true, packages: (packages as ServicePackage[]) || [] }
  } catch (error) {
    console.error('[Setup] Failed to get service packages:', error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to get service packages',
    }
  }
}

export async function createServicePackage(
  data: ServicePackageInsert
): Promise<{ success: boolean; package?: ServicePackage; error?: string }> {
  try {
    const supabase = createAdminClient()

    const { data: pkg, error } = await supabase
      .from('service_packages')
      .insert(data)
      .select()
      .single()

    if (error) throw error

    revalidatePath('/admin/setup/services')
    return { success: true, package: pkg as ServicePackage }
  } catch (error) {
    console.error('[Setup] Failed to create service package:', error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to create service package',
    }
  }
}

export async function updateServicePackage(
  packageId: string,
  data: ServicePackageUpdate
): Promise<{ success: boolean; package?: ServicePackage; error?: string }> {
  try {
    const supabase = createAdminClient()

    const { data: pkg, error } = await supabase
      .from('service_packages')
      .update(data)
      .eq('id', packageId)
      .select()
      .single()

    if (error) throw error

    revalidatePath('/admin/setup/services')
    return { success: true, package: pkg as ServicePackage }
  } catch (error) {
    console.error('[Setup] Failed to update service package:', error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to update service package',
    }
  }
}

export async function deleteServicePackage(
  packageId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createAdminClient()

    const { error } = await supabase
      .from('service_packages')
      .delete()
      .eq('id', packageId)

    if (error) throw error

    revalidatePath('/admin/setup/services')
    return { success: true }
  } catch (error) {
    console.error('[Setup] Failed to delete service package:', error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to delete service package',
    }
  }
}

export async function toggleServicePackageActive(
  packageId: string,
  isActive: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createAdminClient()

    const { error } = await supabase
      .from('service_packages')
      .update({ is_active: isActive })
      .eq('id', packageId)

    if (error) throw error

    revalidatePath('/admin/setup/services')
    return { success: true }
  } catch (error) {
    console.error('[Setup] Failed to toggle service package:', error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to toggle service package',
    }
  }
}

// ============================================================================
// EMAIL TEMPLATES
// ============================================================================

export interface EmailTemplate {
  id: string
  name: string
  description: string | null
  category: string
  subject: string
  body: string
  available_variables: string[]
  is_active: boolean
  is_default: boolean
  created_at: string
  updated_at: string
  created_by: string | null
}

export async function getEmailTemplates(): Promise<{
  success: boolean
  templates?: EmailTemplate[]
  error?: string
}> {
  try {
    const supabase = await createClient()

    const { data: templates, error } = await supabase
      .from('email_templates')
      .select('*')
      .order('category')
      .order('name')

    if (error) throw error

    return { success: true, templates: templates || [] }
  } catch (error) {
    console.error('[Setup] Failed to get email templates:', error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to get email templates',
    }
  }
}

export async function getEmailTemplate(templateId: string): Promise<{
  success: boolean
  template?: EmailTemplate
  error?: string
}> {
  try {
    const supabase = await createClient()

    const { data: template, error } = await supabase
      .from('email_templates')
      .select('*')
      .eq('id', templateId)
      .single()

    if (error) throw error

    return { success: true, template }
  } catch (error) {
    console.error('[Setup] Failed to get email template:', error)
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to get email template',
    }
  }
}

export async function createEmailTemplate(data: {
  name: string
  description?: string
  category: string
  subject: string
  body: string
  available_variables?: string[]
  is_active?: boolean
  is_default?: boolean
}): Promise<{ success: boolean; template?: EmailTemplate; error?: string }> {
  try {
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const { data: template, error } = await supabase
      .from('email_templates')
      .insert({
        name: data.name,
        description: data.description || null,
        category: data.category,
        subject: data.subject,
        body: data.body,
        available_variables: data.available_variables || [],
        is_active: data.is_active ?? true,
        is_default: data.is_default ?? false,
        created_by: user?.id || null,
      })
      .select()
      .single()

    if (error) throw error

    revalidatePath('/admin/setup/email-templates')
    return { success: true, template }
  } catch (error) {
    console.error('[Setup] Failed to create email template:', error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to create email template',
    }
  }
}

export async function updateEmailTemplate(
  templateId: string,
  data: {
    name?: string
    description?: string
    category?: string
    subject?: string
    body?: string
    available_variables?: string[]
    is_active?: boolean
    is_default?: boolean
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()

    const { error } = await supabase
      .from('email_templates')
      .update({
        ...(data.name !== undefined && { name: data.name }),
        ...(data.description !== undefined && {
          description: data.description || null,
        }),
        ...(data.category !== undefined && { category: data.category }),
        ...(data.subject !== undefined && { subject: data.subject }),
        ...(data.body !== undefined && { body: data.body }),
        ...(data.available_variables !== undefined && {
          available_variables: data.available_variables,
        }),
        ...(data.is_active !== undefined && { is_active: data.is_active }),
        ...(data.is_default !== undefined && { is_default: data.is_default }),
      })
      .eq('id', templateId)

    if (error) throw error

    revalidatePath('/admin/setup/email-templates')
    return { success: true }
  } catch (error) {
    console.error('[Setup] Failed to update email template:', error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to update email template',
    }
  }
}

export async function deleteEmailTemplate(
  templateId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()

    const { error } = await supabase
      .from('email_templates')
      .delete()
      .eq('id', templateId)

    if (error) throw error

    revalidatePath('/admin/setup/email-templates')
    return { success: true }
  } catch (error) {
    console.error('[Setup] Failed to delete email template:', error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to delete email template',
    }
  }
}

export async function toggleEmailTemplateActive(
  templateId: string,
  isActive: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()

    const { error } = await supabase
      .from('email_templates')
      .update({ is_active: isActive })
      .eq('id', templateId)

    if (error) throw error

    revalidatePath('/admin/setup/email-templates')
    return { success: true }
  } catch (error) {
    console.error('[Setup] Failed to toggle email template:', error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to toggle email template',
    }
  }
}

// ============================================================================
// WELCOME PACKETS
// ============================================================================

export async function getWelcomePackets(): Promise<{
  success: boolean
  packets?: WelcomePacketWithItemCount[]
  error?: string
}> {
  try {
    const supabase = await createClient()

    const { data: packets, error } = await supabase
      .from('welcome_packets')
      .select(
        `
        *,
        items:welcome_packet_items(count)
      `
      )
      .order('created_at', { ascending: false })

    if (error) throw error

    return { success: true, packets: packets || [] }
  } catch (error) {
    console.error('[Setup] Failed to get welcome packets:', error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to get welcome packets',
    }
  }
}

export async function getWelcomePacket(packetId: string): Promise<{
  success: boolean
  packet?: WelcomePacket
  error?: string
}> {
  try {
    const supabase = await createClient()

    const { data: packet, error } = await supabase
      .from('welcome_packets')
      .select('*')
      .eq('id', packetId)
      .single()

    if (error) throw error

    return { success: true, packet }
  } catch (error) {
    console.error('[Setup] Failed to get welcome packet:', error)
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to get welcome packet',
    }
  }
}

export async function createWelcomePacket(
  data: WelcomePacketInsert
): Promise<{ success: boolean; packet?: WelcomePacket; error?: string }> {
  try {
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const { data: packet, error } = await supabase
      .from('welcome_packets')
      .insert({
        ...data,
        created_by: user?.id || null,
      })
      .select()
      .single()

    if (error) throw error

    revalidatePath('/admin/setup/welcome-packets')
    return { success: true, packet }
  } catch (error) {
    console.error('[Setup] Failed to create welcome packet:', error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to create welcome packet',
    }
  }
}

export async function updateWelcomePacket(
  packetId: string,
  data: WelcomePacketUpdate
): Promise<{ success: boolean; packet?: WelcomePacket; error?: string }> {
  try {
    const supabase = await createClient()

    const { data: packet, error } = await supabase
      .from('welcome_packets')
      .update(data)
      .eq('id', packetId)
      .select()
      .single()

    if (error) throw error

    revalidatePath('/admin/setup/welcome-packets')
    return { success: true, packet }
  } catch (error) {
    console.error('[Setup] Failed to update welcome packet:', error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to update welcome packet',
    }
  }
}

export async function deleteWelcomePacket(
  packetId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()

    // Check if packet has any deliveries
    const { data: deliveries, error: checkError } = await supabase
      .from('welcome_packet_deliveries')
      .select('id')
      .eq('packet_id', packetId)
      .limit(1)

    if (checkError) throw checkError

    if (deliveries && deliveries.length > 0) {
      // Soft delete by deactivating instead
      const { error } = await supabase
        .from('welcome_packets')
        .update({ is_active: false })
        .eq('id', packetId)

      if (error) throw error

      revalidatePath('/admin/setup/welcome-packets')
      return { success: true }
    }

    // Hard delete if no deliveries
    const { error } = await supabase
      .from('welcome_packets')
      .delete()
      .eq('id', packetId)

    if (error) throw error

    revalidatePath('/admin/setup/welcome-packets')
    return { success: true }
  } catch (error) {
    console.error('[Setup] Failed to delete welcome packet:', error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to delete welcome packet',
    }
  }
}

export async function toggleWelcomePacketActive(
  packetId: string,
  isActive: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()

    const { error } = await supabase
      .from('welcome_packets')
      .update({ is_active: isActive })
      .eq('id', packetId)

    if (error) throw error

    revalidatePath('/admin/setup/welcome-packets')
    return { success: true }
  } catch (error) {
    console.error('[Setup] Failed to toggle welcome packet:', error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to toggle welcome packet',
    }
  }
}

// ============================================================================
// WELCOME PACKET ITEMS
// ============================================================================

export async function getWelcomePacketItems(packetId: string): Promise<{
  success: boolean
  items?: WelcomePacketItem[]
  error?: string
}> {
  try {
    const supabase = await createClient()

    const { data: items, error } = await supabase
      .from('welcome_packet_items')
      .select('*')
      .eq('packet_id', packetId)
      .order('sort_order', { ascending: true })

    if (error) throw error

    return { success: true, items: items || [] }
  } catch (error) {
    console.error('[Setup] Failed to get welcome packet items:', error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to get welcome packet items',
    }
  }
}

export async function createWelcomePacketItem(
  data: WelcomePacketItemInsert
): Promise<{ success: boolean; item?: WelcomePacketItem; error?: string }> {
  try {
    const supabase = await createClient()

    const { data: item, error } = await supabase
      .from('welcome_packet_items')
      .insert(data)
      .select()
      .single()

    if (error) throw error

    revalidatePath('/admin/setup/welcome-packets')
    return { success: true, item }
  } catch (error) {
    console.error('[Setup] Failed to create welcome packet item:', error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to create welcome packet item',
    }
  }
}

export async function updateWelcomePacketItem(
  itemId: string,
  data: WelcomePacketItemUpdate
): Promise<{ success: boolean; item?: WelcomePacketItem; error?: string }> {
  try {
    const supabase = await createClient()

    const { data: item, error } = await supabase
      .from('welcome_packet_items')
      .update(data)
      .eq('id', itemId)
      .select()
      .single()

    if (error) throw error

    revalidatePath('/admin/setup/welcome-packets')
    return { success: true, item }
  } catch (error) {
    console.error('[Setup] Failed to update welcome packet item:', error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to update welcome packet item',
    }
  }
}

export async function deleteWelcomePacketItem(
  itemId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()

    const { error } = await supabase
      .from('welcome_packet_items')
      .delete()
      .eq('id', itemId)

    if (error) throw error

    revalidatePath('/admin/setup/welcome-packets')
    return { success: true }
  } catch (error) {
    console.error('[Setup] Failed to delete welcome packet item:', error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to delete welcome packet item',
    }
  }
}

export async function reorderWelcomePacketItems(
  packetId: string,
  itemIds: string[]
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()

    // Update each item with its new sort order
    const updates = itemIds.map((id, index) =>
      supabase
        .from('welcome_packet_items')
        .update({ sort_order: index })
        .eq('id', id)
        .eq('packet_id', packetId)
    )

    const results = await Promise.all(updates)

    const failedUpdate = results.find(r => r.error)
    if (failedUpdate?.error) throw failedUpdate.error

    revalidatePath('/admin/setup/welcome-packets')
    return { success: true }
  } catch (error) {
    console.error('[Setup] Failed to reorder welcome packet items:', error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to reorder welcome packet items',
    }
  }
}
