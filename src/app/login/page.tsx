import { LoginForm } from '@/components/auth/login-form'

export const metadata = {
  title: 'Admin Login | Nurture Nest Birth',
  description: 'Admin login for Nurture Nest Birth CRM',
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="font-serif text-3xl font-bold text-foreground">
            Nurture Nest Birth
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Admin CRM - Sign in to your account
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  )
}
