'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type {
  ClientActionItem,
  ClientActionItemInsert,
  ClientJourneyMilestone,
  ClientJourneyMilestoneInsert,
  ActionItemTemplate,
  JourneyPhase,
  ServiceType,
} from '@/lib/supabase/types'

// ============================================================================
// CLIENT ACTION ITEMS
// ============================================================================

export async function getClientActionItems(clientId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('client_action_items')
    .select('*')
    .eq('client_id', clientId)
    .order('priority', { ascending: true })
    .order('display_order', { ascending: true })

  if (error) return { success: false, error: error.message, data: [] }
  return { success: true, data: data as ClientActionItem[] }
}

export async function createActionItem(item: ClientActionItemInsert) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('client_action_items')
    .insert(item)
    .select()
    .single()

  if (error) return { success: false, error: error.message, data: null }

  revalidatePath('/client/dashboard')
  revalidatePath(`/admin/leads/${item.client_id}`)
  return { success: true, data: data as ClientActionItem }
}

export async function updateActionItem(
  id: string,
  updates: Partial<ClientActionItem>
) {
  const supabase = await createClient()

  // Remove id from updates
  const { id: _, ...safeUpdates } = updates as ClientActionItem

  const { data, error } = await supabase
    .from('client_action_items')
    .update(safeUpdates)
    .eq('id', id)
    .select()
    .single()

  if (error) return { success: false, error: error.message, data: null }

  revalidatePath('/client/dashboard')
  return { success: true, data: data as ClientActionItem }
}

export async function completeActionItem(id: string) {
  return updateActionItem(id, {
    status: 'completed',
    completed_at: new Date().toISOString(),
  })
}

export async function skipActionItem(id: string) {
  return updateActionItem(id, { status: 'skipped' })
}

export async function deleteActionItem(id: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('client_action_items')
    .delete()
    .eq('id', id)

  if (error) return { success: false, error: error.message }

  revalidatePath('/client/dashboard')
  return { success: true }
}

// ============================================================================
// ACTION ITEM TEMPLATES
// ============================================================================

export async function getActionItemTemplates(serviceType?: ServiceType) {
  const supabase = await createClient()

  let query = supabase
    .from('action_item_templates')
    .select('*')
    .eq('is_active', true)

  if (serviceType) {
    query = query.or(`service_type.eq.${serviceType},service_type.is.null`)
  }

  const { data, error } = await query.order('created_at', { ascending: false })

  if (error) return { success: false, error: error.message, data: [] }
  return { success: true, data: data as ActionItemTemplate[] }
}

export async function createDefaultActionItems(
  clientId: string,
  serviceType?: ServiceType,
  serviceId?: string
) {
  const supabase = await createClient()

  // Get the appropriate template
  let query = supabase
    .from('action_item_templates')
    .select('*')
    .eq('is_active', true)

  if (serviceType) {
    query = query.eq('service_type', serviceType)
  } else {
    query = query.is('service_type', null)
  }

  const { data: templates, error: templateError } = await query.limit(1)

  if (templateError || !templates || templates.length === 0) {
    // Fall back to general template
    const { data: generalTemplates } = await supabase
      .from('action_item_templates')
      .select('*')
      .is('service_type', null)
      .eq('is_active', true)
      .limit(1)

    if (!generalTemplates || generalTemplates.length === 0) {
      return { success: false, error: 'No template found', data: [] }
    }

    if (generalTemplates && generalTemplates.length > 0) {
      return createActionItemsFromTemplate(
        clientId,
        generalTemplates[0] as ActionItemTemplate,
        serviceId
      )
    }
    return { success: false, error: 'No template found', data: [] }
  }

  const template = templates[0] as ActionItemTemplate
  return createActionItemsFromTemplate(clientId, template, serviceId)
}

async function createActionItemsFromTemplate(
  clientId: string,
  template: ActionItemTemplate,
  serviceId?: string
) {
  const supabase = await createClient()
  const defaultItems = template.default_items || []

  // Create action items from template
  const itemsToCreate: ClientActionItemInsert[] = defaultItems.map(
    (item, index) => ({
      client_id: clientId,
      service_id: serviceId || null,
      template_id: template.id,
      title: item.title,
      description: item.description || null,
      action_type: item.action_type,
      status: 'pending',
      priority: item.priority || (index + 1) * 10,
      display_order: index,
      action_url: item.action_url || null,
      created_by: null,
    })
  )

  const { data, error } = await supabase
    .from('client_action_items')
    .insert(itemsToCreate)
    .select()

  if (error) return { success: false, error: error.message, data: [] }

  revalidatePath('/client/dashboard')
  return { success: true, data: data as ClientActionItem[] }
}

// ============================================================================
// JOURNEY MILESTONES
// ============================================================================

export async function getJourneyMilestones(clientId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('client_journey_milestones')
    .select('*')
    .eq('client_id', clientId)
    .order('phase')
    .order('display_order', { ascending: true })

  if (error) return { success: false, error: error.message, data: [] }
  return { success: true, data: data as ClientJourneyMilestone[] }
}

export async function createMilestone(milestone: ClientJourneyMilestoneInsert) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('client_journey_milestones')
    .insert(milestone)
    .select()
    .single()

  if (error) return { success: false, error: error.message, data: null }

  revalidatePath('/client/dashboard')
  return { success: true, data: data as ClientJourneyMilestone }
}

export async function completeMilestone(id: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('client_journey_milestones')
    .update({ completed_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) return { success: false, error: error.message, data: null }

  revalidatePath('/client/dashboard')
  return { success: true, data: data as ClientJourneyMilestone }
}

export async function createDefaultMilestones(
  clientId: string,
  phase: JourneyPhase = 'consultation'
) {
  const supabase = await createClient()

  // Default milestones for each phase
  const milestonesByPhase: Record<
    JourneyPhase,
    { type: string; label: string }[]
  > = {
    consultation: [
      { type: 'initial_contact', label: 'Initial contact' },
      { type: 'consultation_scheduled', label: 'Consultation scheduled' },
      { type: 'consultation_completed', label: 'Consultation completed' },
      { type: 'contract_signed', label: 'Contract signed' },
    ],
    prenatal: [
      { type: 'first_prenatal', label: 'First prenatal visit' },
      { type: 'birth_plan_created', label: 'Birth plan created' },
      { type: 'hospital_bag_ready', label: 'Hospital bag ready' },
      { type: 'on_call_started', label: 'On-call period started' },
    ],
    birth: [
      { type: 'labor_started', label: 'Labor started' },
      { type: 'doula_arrived', label: 'Doula arrived' },
      { type: 'baby_born', label: 'Baby born!' },
    ],
    postpartum: [
      { type: 'first_postpartum', label: 'First postpartum visit' },
      { type: 'breastfeeding_support', label: 'Breastfeeding support' },
      { type: 'final_visit', label: 'Final visit completed' },
    ],
  }

  // Create milestones for all phases up to and including current phase
  const phaseOrder: JourneyPhase[] = [
    'consultation',
    'prenatal',
    'birth',
    'postpartum',
  ]
  const currentPhaseIndex = phaseOrder.indexOf(phase)

  const milestonesToCreate: ClientJourneyMilestoneInsert[] = []

  phaseOrder.forEach((p, phaseIdx) => {
    const phaseMilestones = milestonesByPhase[p]
    phaseMilestones.forEach((m, idx) => {
      milestonesToCreate.push({
        client_id: clientId,
        milestone_type: m.type,
        milestone_label: m.label,
        phase: p,
        display_order: phaseIdx * 100 + idx,
        // Auto-complete consultation milestones if already past that phase
        completed_at:
          phaseIdx < currentPhaseIndex ? new Date().toISOString() : null,
      })
    })
  })

  const { data, error } = await supabase
    .from('client_journey_milestones')
    .insert(milestonesToCreate)
    .select()

  if (error) return { success: false, error: error.message, data: [] }

  revalidatePath('/client/dashboard')
  return { success: true, data: data as ClientJourneyMilestone[] }
}

// ============================================================================
// JOURNEY PHASE MANAGEMENT
// ============================================================================

export async function updateJourneyPhase(
  clientId: string,
  phase: JourneyPhase
) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('leads')
    .update({
      journey_phase: phase,
      journey_started_at: new Date().toISOString(),
    })
    .eq('id', clientId)
    .select()
    .single()

  if (error) return { success: false, error: error.message, data: null }

  revalidatePath('/client/dashboard')
  revalidatePath(`/admin/leads/${clientId}`)
  return { success: true, data }
}

export async function updateLastPortalVisit(clientId: string) {
  const supabase = await createClient()

  await supabase
    .from('leads')
    .update({ last_portal_visit: new Date().toISOString() })
    .eq('id', clientId)

  // No need to revalidate for this background update
}

// ============================================================================
// COMBINED DATA FOR CLIENT DASHBOARD
// ============================================================================

export async function getClientJourneyData(clientId: string) {
  const supabase = await createClient()

  // Fetch all journey-related data in parallel
  const [actionItemsResult, milestonesResult, clientResult] = await Promise.all(
    [
      getClientActionItems(clientId),
      getJourneyMilestones(clientId),
      supabase.from('leads').select('*').eq('id', clientId).single(),
    ]
  )

  const actionItems = actionItemsResult.success ? actionItemsResult.data : []
  const milestones = milestonesResult.success ? milestonesResult.data : []
  const client = clientResult.data

  // Calculate progress
  const totalActionItems = actionItems.length
  const completedActionItems = actionItems.filter(
    item => item.status === 'completed'
  ).length
  const actionItemProgress =
    totalActionItems > 0 ? (completedActionItems / totalActionItems) * 100 : 0

  const totalMilestones = milestones.length
  const completedMilestones = milestones.filter(
    m => m.completed_at !== null
  ).length
  const milestoneProgress =
    totalMilestones > 0 ? (completedMilestones / totalMilestones) * 100 : 0

  return {
    success: true,
    data: {
      client,
      actionItems,
      milestones,
      progress: {
        actionItems: {
          total: totalActionItems,
          completed: completedActionItems,
          percentage: actionItemProgress,
        },
        milestones: {
          total: totalMilestones,
          completed: completedMilestones,
          percentage: milestoneProgress,
        },
      },
      currentPhase: (client?.journey_phase as JourneyPhase) || 'consultation',
    },
  }
}
