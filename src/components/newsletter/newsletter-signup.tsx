'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { trackEvent, EVENTS } from '@/lib/analytics'

/**
 * Newsletter Signup Component
 *
 * Email newsletter signup form with validation and analytics.
 * Ready for future email service integration (Mailchimp, ConvertKit, etc.).
 */

interface NewsletterSignupProps {
  variant?: 'inline' | 'card'
  title?: string
  description?: string
  className?: string
}

export function NewsletterSignup({
  variant = 'inline',
  title = 'Stay Connected',
  description = 'Get helpful tips, resources, and updates delivered to your inbox.',
  className = '',
}: NewsletterSignupProps) {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<
    'idle' | 'loading' | 'success' | 'error'
  >('idle')
  const [errorMessage, setErrorMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setStatus('loading')
    setErrorMessage('')

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setStatus('error')
      setErrorMessage('Please enter a valid email address.')
      return
    }

    // Track newsletter signup attempt
    trackEvent(EVENTS.NEWSLETTER_SIGNUP, { email_domain: email.split('@')[1] })

    try {
      // TODO: Integrate with email service (Mailchimp, ConvertKit, etc.)
      // For now, simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Simulate success
      setStatus('success')
      setEmail('')
      trackEvent(EVENTS.NEWSLETTER_SUCCESS, {
        email_domain: email.split('@')[1],
      })
    } catch (error) {
      setStatus('error')
      setErrorMessage(
        'Something went wrong. Please try again or contact us directly.'
      )
      trackEvent(EVENTS.NEWSLETTER_ERROR, {
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  if (variant === 'card') {
    return (
      <div
        className={`rounded-lg border border-border bg-card p-6 shadow-sm ${className}`}
      >
        <h3 className="font-serif text-xl font-semibold text-foreground">
          {title}
        </h3>
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
        <NewsletterForm
          email={email}
          setEmail={setEmail}
          status={status}
          errorMessage={errorMessage}
          onSubmit={handleSubmit}
        />
      </div>
    )
  }

  return (
    <div className={className}>
      <div className="mb-4">
        <h3 className="font-serif text-lg font-semibold text-foreground">
          {title}
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      <NewsletterForm
        email={email}
        setEmail={setEmail}
        status={status}
        errorMessage={errorMessage}
        onSubmit={handleSubmit}
      />
    </div>
  )
}

interface NewsletterFormProps {
  email: string
  setEmail: (email: string) => void
  status: 'idle' | 'loading' | 'success' | 'error'
  errorMessage: string
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void
}

function NewsletterForm({
  email,
  setEmail,
  status,
  errorMessage,
  onSubmit,
}: NewsletterFormProps) {
  if (status === 'success') {
    return (
      <div className="mt-4 rounded-lg bg-primary/10 p-4 text-sm text-primary">
        <div className="flex items-start gap-2">
          <svg
            className="mt-0.5 h-5 w-5 shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div>
            <p className="font-medium">Thank you for subscribing!</p>
            <p className="mt-1 text-xs opacity-90">
              Check your inbox for a confirmation email.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} className="mt-4">
      <div className="flex gap-2">
        <Input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          disabled={status === 'loading'}
          required
          className="flex-1"
          aria-label="Email address"
        />
        <Button type="submit" disabled={status === 'loading'}>
          {status === 'loading' ? (
            <span className="flex items-center gap-2">
              <svg
                className="h-4 w-4 animate-spin"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Subscribing...
            </span>
          ) : (
            'Subscribe'
          )}
        </Button>
      </div>
      {status === 'error' && errorMessage && (
        <p className="mt-2 text-sm text-destructive">{errorMessage}</p>
      )}
      <p className="mt-2 text-xs text-muted-foreground">
        We respect your privacy. Unsubscribe at any time.
      </p>
    </form>
  )
}
