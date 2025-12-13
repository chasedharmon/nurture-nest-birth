import { SignupForm } from '@/components/auth/signup-form'
import Link from 'next/link'
import { platformConfig } from '@/config/platform'

export const metadata = {
  title: `Sign Up | ${platformConfig.name}`,
  description: `Create your ${platformConfig.name} account and start your 30-day free trial.`,
}

export default function SignupPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="font-serif text-3xl font-bold text-foreground">
            {platformConfig.name}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {platformConfig.tagline}
          </p>
        </div>
        <SignupForm />
        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link href="/login" className="text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
