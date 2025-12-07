'use server'

import { Resend } from 'resend'
import { contactFormSchema } from '@/lib/schemas/contact'
import { ContactFormEmail } from '@/lib/email/templates/contact-form'
import { createClient } from '@/lib/supabase/server'

const resend = new Resend(process.env.RESEND_API_KEY)

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

    const validatedData = contactFormSchema.parse(rawData)

    // Save to Supabase database
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
      })
      .select()
      .single()

    if (dbError) {
      console.error('Error saving to database:', dbError)
      // Continue with email even if database save fails
    }

    // Send email using Resend
    const { data, error } = await resend.emails.send({
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
