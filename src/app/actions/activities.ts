'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { ActivityType } from '@/lib/supabase/types'

export async function getLeadActivities(leadId: string) {
  const supabase = await createClient()

  const { data: activities, error } = await supabase
    .from('lead_activities')
    .select('*')
    .eq('lead_id', leadId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching activities:', error)
    return { success: false, error: error.message }
  }

  return { success: true, activities }
}

export async function addActivity(
  leadId: string,
  activityType: ActivityType,
  content: string,
  metadata?: Record<string, unknown>
) {
  const supabase = await createClient()

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: activity, error } = await supabase
    .from('lead_activities')
    .insert({
      lead_id: leadId,
      activity_type: activityType,
      content,
      metadata: metadata || null,
      created_by_user_id: user?.id || null,
    })
    .select()
    .single()

  if (error) {
    console.error('Error adding activity:', error)
    return { success: false, error: error.message }
  }

  // Revalidate the lead detail page
  revalidatePath(`/admin/leads/${leadId}`)

  return { success: true, activity }
}

export async function deleteActivity(activityId: string, leadId: string) {
  const supabase = await createClient()

  // Get current user to verify ownership
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Not authenticated' }
  }

  // Delete activity (RLS will ensure user can only delete their own)
  const { error } = await supabase
    .from('lead_activities')
    .delete()
    .eq('id', activityId)
    .eq('created_by_user_id', user.id)

  if (error) {
    console.error('Error deleting activity:', error)
    return { success: false, error: error.message }
  }

  revalidatePath(`/admin/leads/${leadId}`)

  return { success: true }
}
