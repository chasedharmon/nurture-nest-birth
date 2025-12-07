'use server'

import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const newsletterSchema = z.object({
  email: z.string().email('Invalid email address'),
})

export async function subscribeToNewsletter(email: string) {
  try {
    // Validate email
    const validatedData = newsletterSchema.parse({ email })

    // Save to Supabase database
    const supabase = await createClient()
    const { data: lead, error: dbError } = await supabase
      .from('leads')
      .insert({
        source: 'newsletter',
        status: 'new',
        name: '', // Newsletter signups don't have names yet
        email: validatedData.email,
      })
      .select()
      .single()

    if (dbError) {
      // Check if email already exists
      if (dbError.code === '23505') {
        // Unique constraint violation
        return {
          success: false,
          error: 'This email is already subscribed.',
        }
      }

      console.error('Error saving newsletter signup:', dbError)
      return {
        success: false,
        error: 'Failed to subscribe. Please try again.',
      }
    }

    // TODO: Integrate with email service (Mailchimp, ConvertKit, etc.) in the future

    return {
      success: true,
      leadId: lead?.id,
    }
  } catch (error) {
    console.error('Error processing newsletter signup:', error)

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues[0]?.message || 'Invalid email address',
      }
    }

    if (error instanceof Error) {
      return {
        success: false,
        error: error.message,
      }
    }

    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.',
    }
  }
}
