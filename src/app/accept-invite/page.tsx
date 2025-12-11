'use client'

import { Suspense, useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { validateInvitation, acceptInvitation } from '@/app/actions/setup'
import {
  Loader2,
  CheckCircle,
  XCircle,
  Mail,
  User,
  KeyRound,
} from 'lucide-react'

type InvitationStatus = 'loading' | 'valid' | 'invalid' | 'expired' | 'accepted'

interface InvitationData {
  email: string
  roleName?: string
  teamMemberName?: string
  expiresAt: string
}

function AcceptInviteContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [status, setStatus] = useState<InvitationStatus>('loading')
  const [invitation, setInvitation] = useState<InvitationData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    fullName: '',
    password: '',
    confirmPassword: '',
  })
  const [termsAccepted, setTermsAccepted] = useState(false)

  useEffect(() => {
    async function checkInvitation() {
      if (!token) {
        setStatus('invalid')
        setError('No invitation token provided')
        return
      }

      const result = await validateInvitation(token)

      if (!result.success) {
        if (result.error?.includes('expired')) {
          setStatus('expired')
        } else if (result.error?.includes('accepted')) {
          setStatus('accepted')
        } else {
          setStatus('invalid')
        }
        setError(result.error || 'Invalid invitation')
        return
      }

      setInvitation(result.invitation || null)
      setStatus('valid')
    }

    checkInvitation()
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!termsAccepted) {
      setError('You must accept the Terms of Service and Privacy Policy')
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    setIsSubmitting(true)

    try {
      const result = await acceptInvitation({
        token: token!,
        fullName: formData.fullName,
        password: formData.password,
      })

      if (result.success) {
        // Redirect to login with success message
        router.push(
          '/login?message=Account created successfully. Please log in.'
        )
      } else {
        setError(result.error || 'Failed to create account')
      }
    } catch {
      setError('An unexpected error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Loading state
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-muted-foreground">Validating invitation...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Invalid/Expired/Already Accepted states
  if (status !== 'valid') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div
              className={`mx-auto mb-4 rounded-full p-3 ${
                status === 'accepted'
                  ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-300'
                  : 'bg-destructive/10 text-destructive'
              }`}
            >
              {status === 'accepted' ? (
                <CheckCircle className="h-8 w-8" />
              ) : (
                <XCircle className="h-8 w-8" />
              )}
            </div>
            <CardTitle>
              {status === 'expired' && 'Invitation Expired'}
              {status === 'accepted' && 'Already Accepted'}
              {status === 'invalid' && 'Invalid Invitation'}
            </CardTitle>
            <CardDescription>
              {status === 'expired' &&
                'This invitation has expired. Please contact your administrator for a new invitation.'}
              {status === 'accepted' &&
                'This invitation has already been accepted. You can log in with your account.'}
              {status === 'invalid' &&
                (error || 'This invitation link is not valid.')}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Link href="/login">
              <Button>Go to Login</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Valid invitation - show registration form
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 rounded-full bg-green-100 p-3 text-green-600 dark:bg-green-900/20 dark:text-green-300">
            <Mail className="h-8 w-8" />
          </div>
          <CardTitle>Welcome to Nurture Nest Birth</CardTitle>
          <CardDescription>
            You&apos;ve been invited to join the team. Create your account
            below.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Invitation Details */}
          <div className="mb-6 rounded-lg border border-border bg-muted/30 p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Email:</span>
              <span className="font-medium">{invitation?.email}</span>
            </div>
            {invitation?.roleName && (
              <div className="flex items-center gap-2 text-sm">
                <KeyRound className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Role:</span>
                <span className="font-medium capitalize">
                  {invitation.roleName.replace(/_/g, ' ')}
                </span>
              </div>
            )}
            {invitation?.teamMemberName && (
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Team Profile:</span>
                <span className="font-medium">{invitation.teamMemberName}</span>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                type="text"
                placeholder="Enter your full name"
                value={formData.fullName}
                onChange={e =>
                  setFormData(prev => ({ ...prev, fullName: e.target.value }))
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Create a password"
                value={formData.password}
                onChange={e =>
                  setFormData(prev => ({ ...prev, password: e.target.value }))
                }
                required
                minLength={8}
              />
              <p className="text-xs text-muted-foreground">
                Must be at least 8 characters
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    confirmPassword: e.target.value,
                  }))
                }
                required
              />
            </div>

            <div className="flex items-start space-x-3 rounded-lg border border-border bg-muted/30 p-3">
              <input
                type="checkbox"
                id="terms"
                checked={termsAccepted}
                onChange={e => setTermsAccepted(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                required
              />
              <label htmlFor="terms" className="text-xs text-muted-foreground">
                I agree to the{' '}
                <a
                  href="/terms"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline hover:no-underline"
                >
                  Terms of Service
                </a>{' '}
                and{' '}
                <a
                  href="/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline hover:no-underline"
                >
                  Privacy Policy
                </a>
              </label>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting || !termsAccepted}
            >
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Create Account
            </Button>
          </form>

          <p className="mt-4 text-center text-xs text-muted-foreground">
            Already have an account?{' '}
            <Link href="/login" className="text-primary hover:underline">
              Log in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

function AcceptInviteLoading() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function AcceptInvitePage() {
  return (
    <Suspense fallback={<AcceptInviteLoading />}>
      <AcceptInviteContent />
    </Suspense>
  )
}
