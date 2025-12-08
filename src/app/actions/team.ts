'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type {
  TeamMember,
  TeamMemberInsert,
  TeamMemberRole,
  ClientAssignment,
  ClientAssignmentInsert,
  ServiceAssignment,
  ServiceAssignmentInsert,
  TimeEntry,
  TimeEntryInsert,
  OnCallSchedule,
  OnCallScheduleInsert,
  AssignmentRole,
} from '@/lib/supabase/types'

// =====================================================
// TEAM MEMBER CRUD
// =====================================================

export async function getTeamMembers(options?: {
  includeInactive?: boolean
  role?: TeamMemberRole
}) {
  const supabase = await createClient()

  let query = supabase.from('team_members').select('*').order('display_name')

  if (!options?.includeInactive) {
    query = query.eq('is_active', true)
  }

  if (options?.role) {
    query = query.eq('role', options.role)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching team members:', error)
    return { success: false, error: error.message }
  }

  return { success: true, data: data as TeamMember[] }
}

export async function getTeamMemberById(id: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('team_members')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching team member:', error)
    return { success: false, error: error.message }
  }

  return { success: true, data: data as TeamMember }
}

export async function getTeamMemberByUserId(userId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('team_members')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      // No matching record found
      return { success: true, data: null }
    }
    console.error('Error fetching team member by user ID:', error)
    return { success: false, error: error.message }
  }

  return { success: true, data: data as TeamMember }
}

export async function createTeamMember(data: TeamMemberInsert) {
  const supabase = await createClient()

  const { data: newMember, error } = await supabase
    .from('team_members')
    .insert(data)
    .select()
    .single()

  if (error) {
    console.error('Error creating team member:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/admin/team')
  return { success: true, data: newMember as TeamMember }
}

export async function updateTeamMember(
  id: string,
  data: Partial<TeamMemberInsert>
) {
  const supabase = await createClient()

  const { data: updated, error } = await supabase
    .from('team_members')
    .update(data)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating team member:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/admin/team')
  revalidatePath(`/admin/team/${id}`)
  return { success: true, data: updated as TeamMember }
}

export async function deactivateTeamMember(id: string) {
  return updateTeamMember(id, { is_active: false })
}

export async function reactivateTeamMember(id: string) {
  return updateTeamMember(id, { is_active: true })
}

// =====================================================
// CLIENT ASSIGNMENTS
// =====================================================

export async function getClientAssignments(clientId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('client_assignments')
    .select(
      `
      *,
      team_member:team_members(*)
    `
    )
    .eq('client_id', clientId)
    .order('assignment_role')

  if (error) {
    console.error('Error fetching client assignments:', error)
    return { success: false, error: error.message }
  }

  return { success: true, data: data as ClientAssignment[] }
}

/**
 * Get care team for client portal (respects visibility settings)
 */
export async function getClientCareTeam(clientId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('client_assignments')
    .select(
      `
      id,
      assignment_role,
      notes,
      team_member:team_members(
        id,
        display_name,
        title,
        bio,
        avatar_url,
        email,
        phone,
        certifications,
        specialties,
        show_email_to_clients,
        show_phone_to_clients,
        is_available_oncall,
        oncall_phone
      )
    `
    )
    .eq('client_id', clientId)
    .order('assignment_role')

  if (error) {
    console.error('Error fetching client care team:', error)
    return { success: false, error: error.message }
  }

  // Filter out sensitive info based on visibility settings
  interface CareTeamMember {
    id: string
    assignment_role: AssignmentRole
    notes: string | null
    provider: {
      id: string
      display_name: string
      title: string | null
      bio: string | null
      avatar_url: string | null
      certifications: string[] | null
      specialties: string[] | null
      email: string | null
      phone: string | null
      oncall_phone: string | null
    }
  }

  const careTeam: CareTeamMember[] = []

  for (const assignment of data || []) {
    // Handle both single object and array from join
    const memberData = assignment.team_member
    const member = Array.isArray(memberData) ? memberData[0] : memberData
    if (!member) continue

    careTeam.push({
      id: assignment.id as string,
      assignment_role: assignment.assignment_role as AssignmentRole,
      notes: assignment.notes as string | null,
      provider: {
        id: member.id,
        display_name: member.display_name,
        title: member.title || null,
        bio: member.bio || null,
        avatar_url: member.avatar_url || null,
        certifications: member.certifications || null,
        specialties: member.specialties || null,
        // Only show contact info if visibility is enabled
        email: member.show_email_to_clients ? member.email : null,
        phone: member.show_phone_to_clients ? member.phone : null,
        oncall_phone:
          member.is_available_oncall && member.show_phone_to_clients
            ? member.oncall_phone || member.phone
            : null,
      },
    })
  }

  return { success: true, data: careTeam }
}

export async function getTeamMemberClients(
  teamMemberId: string,
  options?: {
    assignmentRole?: AssignmentRole
  }
) {
  const supabase = await createClient()

  let query = supabase
    .from('client_assignments')
    .select(
      `
      *,
      client:leads(*)
    `
    )
    .eq('team_member_id', teamMemberId)

  if (options?.assignmentRole) {
    query = query.eq('assignment_role', options.assignmentRole)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching team member clients:', error)
    return { success: false, error: error.message }
  }

  return { success: true, data: data as ClientAssignment[] }
}

export async function assignClientToTeamMember(data: ClientAssignmentInsert) {
  const supabase = await createClient()

  const { data: assignment, error } = await supabase
    .from('client_assignments')
    .insert(data)
    .select(
      `
      *,
      team_member:team_members(*)
    `
    )
    .single()

  if (error) {
    console.error('Error creating client assignment:', error)
    return { success: false, error: error.message }
  }

  revalidatePath(`/admin/leads/${data.client_id}`)
  revalidatePath('/admin/team')
  return { success: true, data: assignment as ClientAssignment }
}

export async function updateClientAssignment(
  id: string,
  data: Partial<Pick<ClientAssignment, 'assignment_role' | 'notes'>>
) {
  const supabase = await createClient()

  const { data: updated, error } = await supabase
    .from('client_assignments')
    .update(data)
    .eq('id', id)
    .select(
      `
      *,
      team_member:team_members(*)
    `
    )
    .single()

  if (error) {
    console.error('Error updating client assignment:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/admin')
  return { success: true, data: updated as ClientAssignment }
}

export async function removeClientAssignment(id: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('client_assignments')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error removing client assignment:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/admin')
  return { success: true }
}

// =====================================================
// SERVICE ASSIGNMENTS
// =====================================================

export async function getServiceAssignments(serviceId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('service_assignments')
    .select(
      `
      *,
      team_member:team_members(*)
    `
    )
    .eq('service_id', serviceId)
    .order('assignment_role')

  if (error) {
    console.error('Error fetching service assignments:', error)
    return { success: false, error: error.message }
  }

  return { success: true, data: data as ServiceAssignment[] }
}

export async function assignServiceToTeamMember(data: ServiceAssignmentInsert) {
  const supabase = await createClient()

  const { data: assignment, error } = await supabase
    .from('service_assignments')
    .insert(data)
    .select(
      `
      *,
      team_member:team_members(*)
    `
    )
    .single()

  if (error) {
    console.error('Error creating service assignment:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/admin')
  return { success: true, data: assignment as ServiceAssignment }
}

export async function updateServiceAssignment(
  id: string,
  data: Partial<
    Pick<ServiceAssignment, 'assignment_role' | 'revenue_share_percent'>
  >
) {
  const supabase = await createClient()

  const { data: updated, error } = await supabase
    .from('service_assignments')
    .update(data)
    .eq('id', id)
    .select(
      `
      *,
      team_member:team_members(*)
    `
    )
    .single()

  if (error) {
    console.error('Error updating service assignment:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/admin')
  return { success: true, data: updated as ServiceAssignment }
}

export async function removeServiceAssignment(id: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('service_assignments')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error removing service assignment:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/admin')
  return { success: true }
}

// =====================================================
// TIME ENTRIES
// =====================================================

export async function getTimeEntries(options: {
  teamMemberId?: string
  clientId?: string
  startDate?: string
  endDate?: string
  entryType?: string
  billable?: boolean
  invoiced?: boolean
  limit?: number
}) {
  const supabase = await createClient()

  let query = supabase
    .from('time_entries')
    .select(
      `
      *,
      team_member:team_members(id, display_name),
      client:leads(id, name),
      service:client_services(id, service_type, package_name)
    `
    )
    .order('entry_date', { ascending: false })

  if (options.teamMemberId) {
    query = query.eq('team_member_id', options.teamMemberId)
  }
  if (options.clientId) {
    query = query.eq('client_id', options.clientId)
  }
  if (options.startDate) {
    query = query.gte('entry_date', options.startDate)
  }
  if (options.endDate) {
    query = query.lte('entry_date', options.endDate)
  }
  if (options.entryType) {
    query = query.eq('entry_type', options.entryType)
  }
  if (options.billable !== undefined) {
    query = query.eq('billable', options.billable)
  }
  if (options.invoiced !== undefined) {
    query = query.eq('invoiced', options.invoiced)
  }
  if (options.limit) {
    query = query.limit(options.limit)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching time entries:', error)
    return { success: false, error: error.message }
  }

  return { success: true, data: data as TimeEntry[] }
}

export async function createTimeEntry(data: TimeEntryInsert) {
  const supabase = await createClient()

  const { data: entry, error } = await supabase
    .from('time_entries')
    .insert(data)
    .select(
      `
      *,
      team_member:team_members(id, display_name),
      client:leads(id, name)
    `
    )
    .single()

  if (error) {
    console.error('Error creating time entry:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/admin/time')
  revalidatePath('/admin/team')
  return { success: true, data: entry as TimeEntry }
}

export async function updateTimeEntry(
  id: string,
  data: Partial<TimeEntryInsert>
) {
  const supabase = await createClient()

  const { data: updated, error } = await supabase
    .from('time_entries')
    .update(data)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating time entry:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/admin/time')
  return { success: true, data: updated as TimeEntry }
}

export async function deleteTimeEntry(id: string) {
  const supabase = await createClient()

  const { error } = await supabase.from('time_entries').delete().eq('id', id)

  if (error) {
    console.error('Error deleting time entry:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/admin/time')
  return { success: true }
}

export async function getTimeEntrySummary(
  teamMemberId: string,
  startDate: string,
  endDate: string
) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('time_entries')
    .select('hours, entry_type, billable')
    .eq('team_member_id', teamMemberId)
    .gte('entry_date', startDate)
    .lte('entry_date', endDate)

  if (error) {
    console.error('Error fetching time entry summary:', error)
    return { success: false, error: error.message }
  }

  const summary = {
    totalHours: 0,
    billableHours: 0,
    byType: {} as Record<string, number>,
  }

  for (const entry of data || []) {
    summary.totalHours += Number(entry.hours)
    if (entry.billable) {
      summary.billableHours += Number(entry.hours)
    }
    summary.byType[entry.entry_type] =
      (summary.byType[entry.entry_type] || 0) + Number(entry.hours)
  }

  return { success: true, data: summary }
}

// =====================================================
// ON-CALL SCHEDULE
// =====================================================

export async function getOnCallSchedule(options?: {
  startDate?: string
  endDate?: string
  teamMemberId?: string
  currentOnly?: boolean
}) {
  const supabase = await createClient()

  let query = supabase
    .from('oncall_schedule')
    .select(
      `
      *,
      team_member:team_members(id, display_name, phone, oncall_phone)
    `
    )
    .order('start_date')

  if (options?.teamMemberId) {
    query = query.eq('team_member_id', options.teamMemberId)
  }

  if (options?.currentOnly) {
    const today = new Date().toISOString().split('T')[0]
    query = query.lte('start_date', today).gte('end_date', today)
  } else {
    if (options?.startDate) {
      query = query.gte('end_date', options.startDate)
    }
    if (options?.endDate) {
      query = query.lte('start_date', options.endDate)
    }
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching on-call schedule:', error)
    return { success: false, error: error.message }
  }

  return { success: true, data: data as OnCallSchedule[] }
}

export async function getCurrentOnCall() {
  return getOnCallSchedule({ currentOnly: true })
}

export async function createOnCallSchedule(data: OnCallScheduleInsert) {
  const supabase = await createClient()

  const { data: schedule, error } = await supabase
    .from('oncall_schedule')
    .insert(data)
    .select(
      `
      *,
      team_member:team_members(id, display_name, phone, oncall_phone)
    `
    )
    .single()

  if (error) {
    console.error('Error creating on-call schedule:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/admin/oncall')
  revalidatePath('/admin/team')
  return { success: true, data: schedule as OnCallSchedule }
}

export async function updateOnCallSchedule(
  id: string,
  data: Partial<OnCallScheduleInsert>
) {
  const supabase = await createClient()

  const { data: updated, error } = await supabase
    .from('oncall_schedule')
    .update(data)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating on-call schedule:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/admin/oncall')
  return { success: true, data: updated as OnCallSchedule }
}

export async function deleteOnCallSchedule(id: string) {
  const supabase = await createClient()

  const { error } = await supabase.from('oncall_schedule').delete().eq('id', id)

  if (error) {
    console.error('Error deleting on-call schedule:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/admin/oncall')
  return { success: true }
}

// =====================================================
// TEAM STATS & REPORTING
// =====================================================

export async function getTeamMemberStats(teamMemberId: string) {
  const supabase = await createClient()

  // Get active client count
  const { count: activeClientCount } = await supabase
    .from('client_assignments')
    .select('*', { count: 'exact', head: true })
    .eq('team_member_id', teamMemberId)

  // Get current month date range
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .split('T')[0] as string
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    .toISOString()
    .split('T')[0] as string

  // Get hours this month
  const hoursResult = await getTimeEntrySummary(
    teamMemberId,
    startOfMonth,
    endOfMonth
  )

  return {
    success: true,
    data: {
      activeClientCount: activeClientCount || 0,
      hoursThisMonth: hoursResult.success ? hoursResult.data?.totalHours : 0,
      billableHoursThisMonth: hoursResult.success
        ? hoursResult.data?.billableHours
        : 0,
    },
  }
}

export async function getTeamOverview() {
  const supabase = await createClient()

  // Get all active team members with their stats
  const { data: members, error } = await supabase
    .from('team_members')
    .select('*')
    .eq('is_active', true)
    .order('display_name')

  if (error) {
    console.error('Error fetching team overview:', error)
    return { success: false, error: error.message }
  }

  // Get current on-call
  const onCallResult = await getCurrentOnCall()

  return {
    success: true,
    data: {
      members: members as TeamMember[],
      currentOnCall: onCallResult.success ? onCallResult.data : [],
    },
  }
}

/**
 * Get all team members with their client counts and hours
 */
export async function getTeamMembersWithStats() {
  const supabase = await createClient()

  // Get all team members
  const { data: members, error: membersError } = await supabase
    .from('team_members')
    .select('*')
    .eq('is_active', true)
    .order('display_name')

  if (membersError) {
    console.error('Error fetching team members:', membersError)
    return { success: false, error: membersError.message }
  }

  // Get client assignments grouped by team member
  const { data: assignments, error: assignmentsError } = await supabase
    .from('client_assignments')
    .select(
      `
      team_member_id,
      assignment_role,
      client:leads(id, name, status, expected_due_date)
    `
    )

  if (assignmentsError) {
    console.error('Error fetching assignments:', assignmentsError)
    return { success: false, error: assignmentsError.message }
  }

  // Get current month date range for hours
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .split('T')[0] as string
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    .toISOString()
    .split('T')[0] as string

  // Get time entries for current month
  const { data: timeEntries, error: timeError } = await supabase
    .from('time_entries')
    .select('team_member_id, hours, billable')
    .gte('entry_date', startOfMonth)
    .lte('entry_date', endOfMonth)

  if (timeError) {
    console.error('Error fetching time entries:', timeError)
  }

  // Build stats for each member
  interface MemberWithStats {
    member: TeamMember
    clientCount: number
    primaryClientCount: number
    backupClientCount: number
    hoursThisMonth: number
    billableHoursThisMonth: number
  }

  const membersWithStats: MemberWithStats[] = (members || []).map(member => {
    const memberAssignments = (assignments || []).filter(
      a => a.team_member_id === member.id
    )
    const memberTimeEntries = (timeEntries || []).filter(
      t => t.team_member_id === member.id
    )

    return {
      member: member as TeamMember,
      clientCount: memberAssignments.length,
      primaryClientCount: memberAssignments.filter(
        a => a.assignment_role === 'primary'
      ).length,
      backupClientCount: memberAssignments.filter(
        a => a.assignment_role === 'backup'
      ).length,
      hoursThisMonth: memberTimeEntries.reduce(
        (sum, t) => sum + Number(t.hours),
        0
      ),
      billableHoursThisMonth: memberTimeEntries
        .filter(t => t.billable)
        .reduce((sum, t) => sum + Number(t.hours), 0),
    }
  })

  return { success: true, data: membersWithStats }
}

/**
 * Get detailed view of a team member with all their clients and services
 */
export async function getTeamMemberWithClients(teamMemberId: string) {
  const supabase = await createClient()

  // Get team member
  const { data: member, error: memberError } = await supabase
    .from('team_members')
    .select('*')
    .eq('id', teamMemberId)
    .single()

  if (memberError) {
    console.error('Error fetching team member:', memberError)
    return { success: false, error: memberError.message }
  }

  // Get client assignments with full client data
  const { data: assignments, error: assignmentsError } = await supabase
    .from('client_assignments')
    .select(
      `
      id,
      assignment_role,
      notes,
      created_at,
      client:leads(
        id,
        name,
        email,
        phone,
        status,
        expected_due_date,
        actual_birth_date
      )
    `
    )
    .eq('team_member_id', teamMemberId)
    .order('created_at', { ascending: false })

  if (assignmentsError) {
    console.error('Error fetching assignments:', assignmentsError)
    return { success: false, error: assignmentsError.message }
  }

  // Get service assignments
  const { data: serviceAssignments, error: serviceError } = await supabase
    .from('service_assignments')
    .select(
      `
      id,
      assignment_role,
      revenue_share_percent,
      service:client_services(
        id,
        service_type,
        package_name,
        status,
        client:leads(id, name)
      )
    `
    )
    .eq('team_member_id', teamMemberId)

  if (serviceError) {
    console.error('Error fetching service assignments:', serviceError)
  }

  // Get recent time entries
  const { data: recentTime, error: timeError } = await supabase
    .from('time_entries')
    .select(
      `
      *,
      client:leads(id, name)
    `
    )
    .eq('team_member_id', teamMemberId)
    .order('entry_date', { ascending: false })
    .limit(10)

  if (timeError) {
    console.error('Error fetching time entries:', timeError)
  }

  // Get hours summary for current month
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .split('T')[0] as string
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    .toISOString()
    .split('T')[0] as string

  const hoursSummary = await getTimeEntrySummary(
    teamMemberId,
    startOfMonth,
    endOfMonth
  )

  return {
    success: true,
    data: {
      member: member as TeamMember,
      clientAssignments: assignments || [],
      serviceAssignments: serviceAssignments || [],
      recentTimeEntries: recentTime || [],
      hoursSummary: hoursSummary.success ? hoursSummary.data : null,
    },
  }
}

/**
 * Get all clients with their assigned team members
 */
export async function getClientsWithTeamAssignments() {
  const supabase = await createClient()

  // Get all clients (leads with client status) with their assignments
  const { data: clients, error: clientsError } = await supabase
    .from('leads')
    .select(
      `
      id,
      name,
      email,
      status,
      expected_due_date,
      actual_birth_date,
      client_assignments(
        id,
        assignment_role,
        team_member:team_members(id, display_name, avatar_url)
      )
    `
    )
    .in('status', ['client', 'active'])
    .order('name')

  if (clientsError) {
    console.error('Error fetching clients:', clientsError)
    return { success: false, error: clientsError.message }
  }

  return { success: true, data: clients }
}
