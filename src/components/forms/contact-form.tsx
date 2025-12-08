'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select-native'
import { Textarea } from '@/components/ui/textarea'
import { submitContactForm } from '@/app/actions/contact'
import {
  trackContactFormSubmit,
  trackContactFormSuccess,
  trackContactFormError,
} from '@/lib/analytics'
import { useOptionalPersonalization } from '@/components/personalization'

export function ContactForm() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)
  const personalization = useOptionalPersonalization()

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSubmitting(true)
    setMessage(null)

    const form = event.currentTarget
    const formData = new FormData(form)
    const service = formData.get('service') as string

    // Track form submission
    trackContactFormSubmit({ service })

    try {
      const result = await submitContactForm(formData)

      if (result.success) {
        // Track success
        trackContactFormSuccess({ service })

        // Identify visitor for personalization
        const email = formData.get('email') as string
        const name = formData.get('name') as string
        const dueDate = formData.get('dueDate') as string
        if (personalization?.identify && email) {
          personalization.identify(email, name, {
            dueDate: dueDate || undefined,
            serviceInterest: service || undefined,
          })
        }

        setMessage({
          type: 'success',
          text: 'Thank you for your message! I will respond within 24 hours.',
        })
        form.reset()
      } else {
        // Track error
        trackContactFormError({
          error: result.error || 'Unknown error',
          service,
        })

        setMessage({
          type: 'error',
          text: result.error || 'Something went wrong. Please try again.',
        })
      }
    } catch (error) {
      // Track error
      trackContactFormError({
        error: error instanceof Error ? error.message : 'Network error',
        service,
      })

      setMessage({
        type: 'error',
        text: 'Failed to send message. Please try again or email directly.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-serif text-2xl">Send Me a Message</CardTitle>
        <p className="text-sm text-muted-foreground">
          I typically respond within 24 hours.
        </p>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-6"
          onSubmit={handleSubmit}
          aria-label="Contact form"
        >
          {message && (
            <div
              role="alert"
              aria-live="polite"
              className={`rounded-md p-4 ${
                message.type === 'success'
                  ? 'bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                  : 'bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-300'
              }`}
            >
              <p className="text-sm font-medium">{message.text}</p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              name="name"
              type="text"
              placeholder="Your full name"
              required
              disabled={isSubmitting}
              aria-required="true"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="you@example.com"
              required
              disabled={isSubmitting}
              aria-required="true"
              aria-describedby="email-description"
            />
            <span id="email-description" className="sr-only">
              We&apos;ll use this email to respond to your inquiry
            </span>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              placeholder="(308) 555-1234"
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dueDate">Due Date (if applicable)</Label>
            <Input
              id="dueDate"
              name="dueDate"
              type="date"
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="service">Service Interest</Label>
            <Select id="service" name="service" disabled={isSubmitting}>
              <option value="">Select a service...</option>
              <option value="birth-doula">Birth Doula Support</option>
              <option value="postpartum-care">Postpartum Care</option>
              <option value="lactation">Lactation Consulting</option>
              <option value="sibling-prep">Sibling Preparation</option>
              <option value="multiple">Multiple Services</option>
              <option value="not-sure">Not Sure Yet</option>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Message *</Label>
            <Textarea
              id="message"
              name="message"
              placeholder="Tell me a bit about what you're looking for..."
              rows={5}
              required
              disabled={isSubmitting}
              aria-required="true"
            />
          </div>

          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={isSubmitting}
            aria-busy={isSubmitting}
          >
            {isSubmitting ? 'Sending...' : 'Send Message'}
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            By submitting this form, you agree to be contacted about doula
            services.
          </p>
        </form>
      </CardContent>
    </Card>
  )
}
