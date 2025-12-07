'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type {
  Meeting,
  MeetingInsert,
  MeetingStatus,
} from '@/lib/supabase/types'

export async function getClientMeetings(clientId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('meetings')
    .select('*')
    .eq('client_id', clientId)
    .order('scheduled_at', { ascending: true })

  if (error) {
    console.error('Error fetching client meetings:', error)
    return { success: false, error: error.message, meetings: [] }
  }

  return { success: true, meetings: data as Meeting[] }
}

export async function getUpcomingMeetings(limit = 10) {
  const supabase = await createClient()

  const now = new Date().toISOString()

  const { data, error } = await supabase
    .from('meetings')
    .select('*, leads(name, email)')
    .eq('status', 'scheduled')
    .gte('scheduled_at', now)
    .order('scheduled_at', { ascending: true })
    .limit(limit)

  if (error) {
    console.error('Error fetching upcoming meetings:', error)
    return { success: false, error: error.message, meetings: [] }
  }

  return { success: true, meetings: data }
}

export async function getMeetingById(meetingId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('meetings')
    .select('*')
    .eq('id', meetingId)
    .single()

  if (error) {
    console.error('Error fetching meeting:', error)
    return { success: false, error: error.message, meeting: null }
  }

  return { success: true, meeting: data as Meeting }
}

export async function scheduleMeeting(
  clientId: string,
  meeting: Omit<MeetingInsert, 'client_id' | 'created_by'>
) {
  const supabase = await createClient()

  // Check auth
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Unauthorized' }
  }

  const { data, error } = await supabase
    .from('meetings')
    .insert({
      client_id: clientId,
      created_by: user.id,
      ...meeting,
    })
    .select()
    .single()

  if (error) {
    console.error('Error scheduling meeting:', error)
    return { success: false, error: error.message }
  }

  revalidatePath(`/admin/leads/${clientId}`)
  revalidatePath('/admin')

  return { success: true, meeting: data as Meeting }
}

export async function updateMeeting(
  meetingId: string,
  updates: Partial<MeetingInsert>
) {
  const supabase = await createClient()

  // Check auth
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Unauthorized' }
  }

  // Get client_id for revalidation
  const { data: meeting } = await supabase
    .from('meetings')
    .select('client_id')
    .eq('id', meetingId)
    .single()

  const { data, error } = await supabase
    .from('meetings')
    .update(updates)
    .eq('id', meetingId)
    .select()
    .single()

  if (error) {
    console.error('Error updating meeting:', error)
    return { success: false, error: error.message }
  }

  if (meeting?.client_id) {
    revalidatePath(`/admin/leads/${meeting.client_id}`)
  }
  revalidatePath('/admin')

  return { success: true, meeting: data as Meeting }
}

export async function updateMeetingStatus(
  meetingId: string,
  status: MeetingStatus
) {
  const supabase = await createClient()

  // Check auth
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Unauthorized' }
  }

  // Get client_id for revalidation
  const { data: meeting } = await supabase
    .from('meetings')
    .select('client_id')
    .eq('id', meetingId)
    .single()

  const updateData: Partial<Meeting> = { status }

  // If marking as completed, set completed_at
  if (status === 'completed') {
    updateData.completed_at = new Date().toISOString()
  }

  const { error } = await supabase
    .from('meetings')
    .update(updateData)
    .eq('id', meetingId)

  if (error) {
    console.error('Error updating meeting status:', error)
    return { success: false, error: error.message }
  }

  if (meeting?.client_id) {
    revalidatePath(`/admin/leads/${meeting.client_id}`)
  }
  revalidatePath('/admin')

  return { success: true }
}

export async function addMeetingNotes(meetingId: string, notes: string) {
  const supabase = await createClient()

  // Check auth
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Unauthorized' }
  }

  // Get client_id for revalidation
  const { data: meeting } = await supabase
    .from('meetings')
    .select('client_id')
    .eq('id', meetingId)
    .single()

  const { error } = await supabase
    .from('meetings')
    .update({ meeting_notes: notes })
    .eq('id', meetingId)

  if (error) {
    console.error('Error adding meeting notes:', error)
    return { success: false, error: error.message }
  }

  if (meeting?.client_id) {
    revalidatePath(`/admin/leads/${meeting.client_id}`)
  }
  revalidatePath('/admin')

  return { success: true }
}

export async function cancelMeeting(meetingId: string) {
  return updateMeetingStatus(meetingId, 'cancelled')
}

export async function completeMeeting(meetingId: string, notes?: string) {
  const supabase = await createClient()

  // Check auth
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Unauthorized' }
  }

  // Get client_id for revalidation
  const { data: meeting } = await supabase
    .from('meetings')
    .select('client_id')
    .eq('id', meetingId)
    .single()

  const updateData: Partial<Meeting> = {
    status: 'completed',
    completed_at: new Date().toISOString(),
  }

  if (notes) {
    updateData.meeting_notes = notes
  }

  const { error } = await supabase
    .from('meetings')
    .update(updateData)
    .eq('id', meetingId)

  if (error) {
    console.error('Error completing meeting:', error)
    return { success: false, error: error.message }
  }

  if (meeting?.client_id) {
    revalidatePath(`/admin/leads/${meeting.client_id}`)
  }
  revalidatePath('/admin')

  return { success: true }
}

export async function deleteMeeting(meetingId: string) {
  const supabase = await createClient()

  // Check auth
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Unauthorized' }
  }

  // Get client_id for revalidation
  const { data: meeting } = await supabase
    .from('meetings')
    .select('client_id')
    .eq('id', meetingId)
    .single()

  const { error } = await supabase.from('meetings').delete().eq('id', meetingId)

  if (error) {
    console.error('Error deleting meeting:', error)
    return { success: false, error: error.message }
  }

  if (meeting?.client_id) {
    revalidatePath(`/admin/leads/${meeting.client_id}`)
  }
  revalidatePath('/admin')

  return { success: true }
}
