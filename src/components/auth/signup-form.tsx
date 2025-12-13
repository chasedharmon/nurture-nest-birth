'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { signupTenant, type SignupInput } from '@/app/actions/signup'
import { platformConfig } from '@/config/platform'

export function SignupForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [termsAccepted, setTermsAccepted] = useState(false)

  const [formData, setFormData] = useState<SignupInput>({
    email: '',
    password: '',
    businessName: '',
    firstName: '',
  })

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
    setError(null)
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!termsAccepted) {
      setError('Please accept the Terms of Service and Privacy Policy')
      return
    }

    setIsLoading(true)
    setError(null)

    const result = await signupTenant(formData)

    if (!result.success) {
      setError(result.error || 'Something went wrong. Please try again.')
      setIsLoading(false)
      return
    }

    // Redirect to admin dashboard (onboarding checklist will show there)
    router.push('/admin')
    router.refresh()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Start your free trial</CardTitle>
        <p className="text-sm text-muted-foreground">
          30 days free. No credit card required.
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div
              role="alert"
              className="rounded-md bg-red-50 p-4 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-300"
            >
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="businessName">Business Name</Label>
            <Input
              id="businessName"
              name="businessName"
              type="text"
              placeholder="Your Doula Practice"
              value={formData.businessName}
              onChange={handleChange}
              required
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="firstName">Your First Name</Label>
            <Input
              id="firstName"
              name="firstName"
              type="text"
              placeholder="Jane"
              value={formData.firstName}
              onChange={handleChange}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="you@example.com"
              value={formData.email}
              onChange={handleChange}
              required
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              required
              minLength={8}
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">
              Minimum 8 characters
            </p>
          </div>

          <div className="flex items-start space-x-2">
            <Checkbox
              id="terms"
              checked={termsAccepted}
              onCheckedChange={(checked: boolean) =>
                setTermsAccepted(checked === true)
              }
              disabled={isLoading}
            />
            <Label
              htmlFor="terms"
              className="text-sm font-normal leading-tight"
            >
              I agree to the{' '}
              <a
                href={platformConfig.legal.termsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Terms of Service
              </a>{' '}
              and{' '}
              <a
                href={platformConfig.legal.privacyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Privacy Policy
              </a>
            </Label>
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Creating your account...' : 'Start Free Trial'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
