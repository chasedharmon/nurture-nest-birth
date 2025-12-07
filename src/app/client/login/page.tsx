'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signInClient } from '@/app/actions/client-auth'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import Link from 'next/link'

export default function ClientLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const result = await signInClient(email, password)

    if (result.success) {
      // Redirect to dashboard
      router.push('/client/dashboard')
    } else {
      setError(result.error || 'Something went wrong. Please try again.')
    }

    setIsLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 dark:from-gray-900 dark:via-purple-900 dark:to-gray-900 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Client Portal</CardTitle>
          <CardDescription>
            Sign in to access your Nurture Nest Birth portal
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="your@email.com"
                disabled={isLoading}
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium mb-2"
              >
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Enter your password"
                disabled={isLoading}
              />
            </div>

            {error && (
              <div className="p-3 rounded-md bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-300 text-sm">
                {error}
              </div>
            )}

            <div className="p-3 rounded-md bg-blue-50 dark:bg-blue-900/20 text-sm text-blue-800 dark:text-blue-200">
              <p className="font-medium">For testing:</p>
              <p>Use any client email from your database</p>
              <p>
                Password:{' '}
                <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">
                  password123
                </code>
              </p>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            <Link href="/" className="hover:text-foreground">
              ← Back to Home
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
