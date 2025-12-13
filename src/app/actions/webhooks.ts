'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createHmac, randomBytes } from 'crypto'

import type { WebhookEventType } from '@/lib/constants/webhook-events'

export interface Webhook {
  id: string
  organization_id: string
  name: string
  description: string | null
  url: string
  secret: string
  events: WebhookEventType[]
  is_active: boolean
  retry_count: number
  timeout_seconds: number
  custom_headers: Record<string, string>
  total_deliveries: number
  successful_deliveries: number
  failed_deliveries: number
  last_triggered_at: string | null
  last_success_at: string | null
  last_failure_at: string | null
  last_failure_reason: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface WebhookDelivery {
  id: string
  webhook_id: string
  event_type: WebhookEventType
  event_id: string | null
  request_url: string
  request_headers: Record<string, string> | null
  request_body: Record<string, unknown> | null
  response_status: number | null
  response_headers: Record<string, string> | null
  response_body: string | null
  status: 'pending' | 'success' | 'failed' | 'retrying'
  attempt_count: number
  duration_ms: number | null
  error_message: string | null
  created_at: string
  completed_at: string | null
}

export interface CreateWebhookParams {
  name: string
  description?: string
  url: string
  events: WebhookEventType[]
  retry_count?: number
  timeout_seconds?: number
  custom_headers?: Record<string, string>
}

export interface UpdateWebhookParams {
  name?: string
  description?: string
  url?: string
  events?: WebhookEventType[]
  is_active?: boolean
  retry_count?: number
  timeout_seconds?: number
  custom_headers?: Record<string, string>
}

/**
 * Generate a secure webhook secret
 */
function generateSecret(): string {
  return `whsec_${randomBytes(32).toString('hex')}`
}

/**
 * Get all webhooks for the current organization
 */
export async function getWebhooks(): Promise<{
  success: boolean
  webhooks?: Webhook[]
  error?: string
}> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Unauthorized' }
  }

  const { data, error } = await supabase
    .from('webhooks')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching webhooks:', error)
    return { success: false, error: error.message }
  }

  return { success: true, webhooks: data as Webhook[] }
}

/**
 * Get a single webhook by ID
 */
export async function getWebhookById(id: string): Promise<{
  success: boolean
  webhook?: Webhook
  error?: string
}> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Unauthorized' }
  }

  const { data, error } = await supabase
    .from('webhooks')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching webhook:', error)
    return { success: false, error: error.message }
  }

  return { success: true, webhook: data as Webhook }
}

/**
 * Create a new webhook
 */
export async function createWebhook(params: CreateWebhookParams): Promise<{
  success: boolean
  webhook?: Webhook
  error?: string
}> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Unauthorized' }
  }

  // Check admin permission
  const { data: teamMember } = await supabase
    .from('team_members')
    .select('role')
    .eq('user_id', user.id)
    .single()

  if (!teamMember || !['owner', 'admin'].includes(teamMember.role)) {
    return { success: false, error: 'Admin access required' }
  }

  // Get organization ID
  const { data: orgData } = await supabase.rpc('get_user_organization_id')

  if (!orgData) {
    return { success: false, error: 'Organization not found' }
  }

  // Validate URL
  try {
    new URL(params.url)
  } catch {
    return { success: false, error: 'Invalid webhook URL' }
  }

  // Generate secret
  const secret = generateSecret()

  const { data, error } = await supabase
    .from('webhooks')
    .insert({
      organization_id: orgData,
      name: params.name,
      description: params.description || null,
      url: params.url,
      secret,
      events: params.events,
      retry_count: params.retry_count ?? 3,
      timeout_seconds: params.timeout_seconds ?? 30,
      custom_headers: params.custom_headers || {},
      created_by: user.id,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating webhook:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/admin/setup/webhooks')

  return { success: true, webhook: data as Webhook }
}

/**
 * Update an existing webhook
 */
export async function updateWebhook(
  id: string,
  params: UpdateWebhookParams
): Promise<{
  success: boolean
  webhook?: Webhook
  error?: string
}> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Unauthorized' }
  }

  // Validate URL if provided
  if (params.url) {
    try {
      new URL(params.url)
    } catch {
      return { success: false, error: 'Invalid webhook URL' }
    }
  }

  const { data, error } = await supabase
    .from('webhooks')
    .update({
      ...params,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating webhook:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/admin/setup/webhooks')

  return { success: true, webhook: data as Webhook }
}

/**
 * Delete a webhook
 */
export async function deleteWebhook(id: string): Promise<{
  success: boolean
  error?: string
}> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Unauthorized' }
  }

  const { error } = await supabase.from('webhooks').delete().eq('id', id)

  if (error) {
    console.error('Error deleting webhook:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/admin/setup/webhooks')

  return { success: true }
}

/**
 * Toggle webhook active status
 */
export async function toggleWebhookStatus(id: string): Promise<{
  success: boolean
  is_active?: boolean
  error?: string
}> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Unauthorized' }
  }

  // Get current status
  const { data: webhook } = await supabase
    .from('webhooks')
    .select('is_active')
    .eq('id', id)
    .single()

  if (!webhook) {
    return { success: false, error: 'Webhook not found' }
  }

  const newStatus = !webhook.is_active

  const { error } = await supabase
    .from('webhooks')
    .update({
      is_active: newStatus,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) {
    console.error('Error toggling webhook status:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/admin/setup/webhooks')

  return { success: true, is_active: newStatus }
}

/**
 * Regenerate webhook secret
 */
export async function regenerateWebhookSecret(id: string): Promise<{
  success: boolean
  secret?: string
  error?: string
}> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Unauthorized' }
  }

  const newSecret = generateSecret()

  const { error } = await supabase
    .from('webhooks')
    .update({
      secret: newSecret,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) {
    console.error('Error regenerating webhook secret:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/admin/setup/webhooks')

  return { success: true, secret: newSecret }
}

/**
 * Get webhook delivery history
 */
export async function getWebhookDeliveries(
  webhookId: string,
  options?: {
    limit?: number
    offset?: number
    status?: string
  }
): Promise<{
  success: boolean
  deliveries?: WebhookDelivery[]
  total?: number
  error?: string
}> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Unauthorized' }
  }

  const limit = options?.limit ?? 50
  const offset = options?.offset ?? 0

  let query = supabase
    .from('webhook_deliveries')
    .select('*', { count: 'exact' })
    .eq('webhook_id', webhookId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (options?.status) {
    query = query.eq('status', options.status)
  }

  const { data, count, error } = await query

  if (error) {
    console.error('Error fetching webhook deliveries:', error)
    return { success: false, error: error.message }
  }

  return {
    success: true,
    deliveries: data as WebhookDelivery[],
    total: count ?? 0,
  }
}

/**
 * Test a webhook by sending a test payload
 */
export async function testWebhook(id: string): Promise<{
  success: boolean
  delivery?: WebhookDelivery
  error?: string
}> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Unauthorized' }
  }

  // Get webhook details
  const { data: webhook, error: webhookError } = await supabase
    .from('webhooks')
    .select('*')
    .eq('id', id)
    .single()

  if (webhookError || !webhook) {
    return { success: false, error: 'Webhook not found' }
  }

  // Create test payload
  const testPayload = {
    event: 'webhook.test',
    timestamp: new Date().toISOString(),
    data: {
      message: 'This is a test webhook delivery from Nurture Nest Birth',
      webhook_id: id,
      webhook_name: webhook.name,
    },
  }

  // Sign the payload
  const signature = createHmac('sha256', webhook.secret)
    .update(JSON.stringify(testPayload))
    .digest('hex')

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Webhook-Signature': `sha256=${signature}`,
    'X-Webhook-Id': id,
    'X-Webhook-Event': 'webhook.test',
    ...(webhook.custom_headers || {}),
  }

  // Create delivery record
  const { data: delivery, error: deliveryError } = await supabase
    .from('webhook_deliveries')
    .insert({
      webhook_id: id,
      event_type: 'lead.created', // Use a valid enum value for test
      request_url: webhook.url,
      request_headers: headers,
      request_body: testPayload,
      status: 'pending',
    })
    .select()
    .single()

  if (deliveryError) {
    console.error('Error creating delivery record:', deliveryError)
    return { success: false, error: deliveryError.message }
  }

  // Send the webhook
  const startTime = Date.now()
  let responseStatus: number | null = null
  let responseBody: string | null = null
  let status: 'success' | 'failed' = 'failed'
  let errorMessage: string | null = null

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(
      () => controller.abort(),
      webhook.timeout_seconds * 1000
    )

    const response = await fetch(webhook.url, {
      method: 'POST',
      headers,
      body: JSON.stringify(testPayload),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    responseStatus = response.status
    responseBody = await response.text()

    if (response.ok) {
      status = 'success'
    } else {
      errorMessage = `HTTP ${response.status}: ${response.statusText}`
    }
  } catch (err) {
    errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
  }

  const durationMs = Date.now() - startTime

  // Update delivery record
  const { data: updatedDelivery, error: updateError } = await supabase
    .from('webhook_deliveries')
    .update({
      response_status: responseStatus,
      response_body: responseBody?.substring(0, 10000), // Limit response body size
      status,
      attempt_count: 1,
      duration_ms: durationMs,
      error_message: errorMessage,
      completed_at: new Date().toISOString(),
    })
    .eq('id', delivery.id)
    .select()
    .single()

  if (updateError) {
    console.error('Error updating delivery record:', updateError)
  }

  revalidatePath('/admin/setup/webhooks')

  return {
    success: status === 'success',
    delivery: updatedDelivery as WebhookDelivery,
    error: errorMessage ?? undefined,
  }
}

/**
 * Trigger webhooks for an event (called from other parts of the application)
 */
export async function triggerWebhooks(
  eventType: WebhookEventType,
  eventData: Record<string, unknown>,
  eventId?: string
): Promise<void> {
  const supabase = await createClient()

  // Get organization ID from current user
  const { data: orgId } = await supabase.rpc('get_user_organization_id')

  if (!orgId) {
    console.error('Could not determine organization for webhook trigger')
    return
  }

  // Get all active webhooks subscribed to this event
  const { data: webhooks, error } = await supabase.rpc(
    'get_webhooks_for_event',
    {
      p_organization_id: orgId,
      p_event_type: eventType,
    }
  )

  if (error || !webhooks || webhooks.length === 0) {
    return // No webhooks to trigger
  }

  // Create payload
  const payload = {
    event: eventType,
    timestamp: new Date().toISOString(),
    data: eventData,
  }

  // Queue delivery for each webhook (fire and forget)
  for (const webhook of webhooks) {
    const signature = createHmac('sha256', webhook.secret)
      .update(JSON.stringify(payload))
      .digest('hex')

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Webhook-Signature': `sha256=${signature}`,
      'X-Webhook-Id': webhook.id,
      'X-Webhook-Event': eventType,
      ...(webhook.custom_headers || {}),
    }

    // Create delivery record and send asynchronously (fire and forget)
    ;(async () => {
      try {
        const { data: delivery } = await supabase
          .from('webhook_deliveries')
          .insert({
            webhook_id: webhook.id,
            event_type: eventType,
            event_id: eventId,
            request_url: webhook.url,
            request_headers: headers,
            request_body: payload,
            status: 'pending',
          })
          .select()
          .single()

        if (!delivery) return

        const startTime = Date.now()
        let responseStatus: number | null = null
        let responseBody: string | null = null
        let status: 'success' | 'failed' = 'failed'
        let errorMessage: string | null = null

        try {
          const controller = new AbortController()
          const timeoutId = setTimeout(
            () => controller.abort(),
            webhook.timeout_seconds * 1000
          )

          const response = await fetch(webhook.url, {
            method: 'POST',
            headers,
            body: JSON.stringify(payload),
            signal: controller.signal,
          })

          clearTimeout(timeoutId)

          responseStatus = response.status
          responseBody = await response.text()

          if (response.ok) {
            status = 'success'
          } else {
            errorMessage = `HTTP ${response.status}: ${response.statusText}`
          }
        } catch (err) {
          errorMessage =
            err instanceof Error ? err.message : 'Unknown error occurred'
        }

        const durationMs = Date.now() - startTime

        // Update delivery record
        await supabase
          .from('webhook_deliveries')
          .update({
            response_status: responseStatus,
            response_body: responseBody?.substring(0, 10000),
            status,
            attempt_count: 1,
            duration_ms: durationMs,
            error_message: errorMessage,
            completed_at: new Date().toISOString(),
          })
          .eq('id', delivery.id)
      } catch (err) {
        console.error('Error triggering webhook:', err)
      }
    })()
  }
}
