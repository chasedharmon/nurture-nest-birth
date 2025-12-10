'use server'

import { Resend } from 'resend'
import { contactFormSchema } from '@/lib/schemas/contact'
import { ContactFormEmail } from '@/lib/email/templates/contact-form'
import { createClient } from '@/lib/supabase/server'

// Lazy-initialize Resend client to avoid build-time errors when env var is missing
let resend: Resend | null = null
function getResend(): Resend {
  if (!resend) {
    if (!process.env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY environment variable is not set')
    }
    resend = new Resend(process.env.RESEND_API_KEY)
  }
  return resend
}

export async function submitContactForm(formData: FormData) {
  try {
    // Extract and validate form data
    const rawData = {
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      phone: formData.get('phone') as string,
      dueDate: formData.get('dueDate') as string,
      service: formData.get('service') as string,
      message: formData.get('message') as string,
    }

    // Extract attribution data (optional fields)
    const attributionData = {
      referral_source: (formData.get('referralSource') as string) || null,
      utm_source: (formData.get('utm_source') as string) || null,
      utm_medium: (formData.get('utm_medium') as string) || null,
      utm_campaign: (formData.get('utm_campaign') as string) || null,
      utm_term: (formData.get('utm_term') as string) || null,
      utm_content: (formData.get('utm_content') as string) || null,
      referrer_url: (formData.get('referrer_url') as string) || null,
      landing_page: (formData.get('landing_page') as string) || null,
    }

    const validatedData = contactFormSchema.parse(rawData)

    // Save to Supabase database with attribution data
    const supabase = await createClient()
    const { data: lead, error: dbError } = await supabase
      .from('leads')
      .insert({
        source: 'contact_form',
        status: 'new',
        name: validatedData.name,
        email: validatedData.email,
        phone: validatedData.phone || null,
        due_date: validatedData.dueDate || null,
        service_interest: validatedData.service || null,
        message: validatedData.message,
        // Attribution tracking
        ...attributionData,
      })
      .select()
      .single()

    if (dbError) {
      console.error('Error saving to database:', dbError)
      // Continue with email even if database save fails
    }

    // Send email using Resend
    const { data, error } = await getResend().emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
      to: process.env.CONTACT_EMAIL || 'hello@nurturenestbirth.com',
      subject: `New Contact Form Submission from ${validatedData.name}`,
      react: ContactFormEmail({ data: validatedData }),
      replyTo: validatedData.email,
    })

    if (error) {
      console.error('Error sending email:', error)
      return {
        success: false,
        error: 'Failed to send message. Please try again or email directly.',
      }
    }

    return {
      success: true,
      messageId: data?.id,
      leadId: lead?.id,
    }
  } catch (error) {
    console.error('Error processing contact form:', error)

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
