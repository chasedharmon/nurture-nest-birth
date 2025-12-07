'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { signInClient, requestMagicLink } from '@/app/actions/client-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Mail,
  Lock,
  ArrowRight,
  Loader2,
  Check,
  ArrowLeft,
  Sparkles,
} from 'lucide-react'

type LoginMode = 'choice' | 'password' | 'magic-link' | 'magic-link-sent'

export default function ClientLoginPage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [mode, setMode] = useState<LoginMode>('choice')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    startTransition(async () => {
      const result = await signInClient(email, password)

      if (result.success) {
        router.push('/client/dashboard')
      } else {
        setError(result.error || 'Something went wrong. Please try again.')
      }
    })
  }

  const handleMagicLinkRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    startTransition(async () => {
      const result = await requestMagicLink(email)

      if (result.success) {
        setMode('magic-link-sent')
      } else {
        setError(result.error || 'Something went wrong. Please try again.')
      }
    })
  }

  const resetToChoice = () => {
    setMode('choice')
    setError(null)
    setPassword('')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#fdfbf7] via-[#f8f4ec] to-[#f5f0e8] p-4">
      {/* Decorative elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-64 h-64 bg-[#e8dfd0]/30 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-80 h-80 bg-[#d4c5b0]/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#c9b896]/10 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Card */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/50 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#8b7355] to-[#6b5a45] p-8 text-white text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl mx-auto mb-4 flex items-center justify-center"
            >
              <Sparkles className="h-8 w-8" />
            </motion.div>
            <h1 className="text-2xl font-semibold">Welcome Back</h1>
            <p className="text-white/80 mt-2 text-sm">
              Sign in to your Nurture Nest Birth portal
            </p>
          </div>

          {/* Content */}
          <div className="p-8">
            <AnimatePresence mode="wait">
              {/* Choice Mode */}
              {mode === 'choice' && (
                <motion.div
                  key="choice"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <p className="text-stone-600 text-center mb-6">
                    How would you like to sign in?
                  </p>

                  {/* Email input first */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="email-choice"
                      className="text-sm font-medium text-stone-600"
                    >
                      Email Address
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-stone-400" />
                      <Input
                        type="email"
                        id="email-choice"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="your@email.com"
                        className="pl-10 border-stone-200 bg-white/80 focus:border-[#b5a48b] focus:ring-[#b5a48b]/20 rounded-xl h-12"
                      />
                    </div>
                  </div>

                  <div className="grid gap-3 pt-2">
                    <Button
                      onClick={() => setMode('magic-link')}
                      disabled={!email}
                      className="w-full h-12 bg-[#8b7355] hover:bg-[#6b5a45] text-white rounded-xl transition-all duration-200 disabled:opacity-50"
                    >
                      <Mail className="h-5 w-5 mr-2" />
                      Send Magic Link
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>

                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-stone-200" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-white/80 px-2 text-stone-500">
                          or
                        </span>
                      </div>
                    </div>

                    <Button
                      onClick={() => setMode('password')}
                      disabled={!email}
                      variant="outline"
                      className="w-full h-12 border-stone-300 text-stone-700 hover:bg-stone-50 rounded-xl transition-all duration-200 disabled:opacity-50"
                    >
                      <Lock className="h-5 w-5 mr-2" />
                      Sign in with Password
                    </Button>
                  </div>

                  {/* Dev mode hint */}
                  {process.env.NODE_ENV === 'development' && (
                    <div className="mt-6 p-4 rounded-xl bg-blue-50 border border-blue-100">
                      <p className="text-xs text-blue-700 font-medium mb-1">
                        Development Mode
                      </p>
                      <p className="text-xs text-blue-600">
                        Use any client email from your database with password:{' '}
                        <code className="bg-blue-100 px-1.5 py-0.5 rounded font-mono">
                          password123
                        </code>
                      </p>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Password Mode */}
              {mode === 'password' && (
                <motion.div
                  key="password"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <button
                    onClick={resetToChoice}
                    className="flex items-center text-sm text-stone-500 hover:text-stone-700 mb-6 transition-colors"
                  >
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Back to options
                  </button>

                  <form onSubmit={handlePasswordLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label
                        htmlFor="email-password"
                        className="text-sm font-medium text-stone-600"
                      >
                        Email Address
                      </Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-stone-400" />
                        <Input
                          type="email"
                          id="email-password"
                          value={email}
                          onChange={e => setEmail(e.target.value)}
                          required
                          placeholder="your@email.com"
                          className="pl-10 border-stone-200 bg-white/80 focus:border-[#b5a48b] focus:ring-[#b5a48b]/20 rounded-xl h-12"
                          disabled={isPending}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="password"
                        className="text-sm font-medium text-stone-600"
                      >
                        Password
                      </Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-stone-400" />
                        <Input
                          type="password"
                          id="password"
                          value={password}
                          onChange={e => setPassword(e.target.value)}
                          required
                          placeholder="Enter your password"
                          className="pl-10 border-stone-200 bg-white/80 focus:border-[#b5a48b] focus:ring-[#b5a48b]/20 rounded-xl h-12"
                          disabled={isPending}
                        />
                      </div>
                    </div>

                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm"
                      >
                        {error}
                      </motion.div>
                    )}

                    <Button
                      type="submit"
                      disabled={isPending}
                      className="w-full h-12 bg-[#8b7355] hover:bg-[#6b5a45] text-white rounded-xl mt-2"
                    >
                      {isPending ? (
                        <>
                          <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                          Signing in...
                        </>
                      ) : (
                        <>
                          Sign In
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </>
                      )}
                    </Button>

                    <button
                      type="button"
                      onClick={() => setMode('magic-link')}
                      className="w-full text-sm text-stone-500 hover:text-stone-700 transition-colors mt-4"
                    >
                      Forgot your password? Use a magic link instead
                    </button>
                  </form>
                </motion.div>
              )}

              {/* Magic Link Mode */}
              {mode === 'magic-link' && (
                <motion.div
                  key="magic-link"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <button
                    onClick={resetToChoice}
                    className="flex items-center text-sm text-stone-500 hover:text-stone-700 mb-6 transition-colors"
                  >
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Back to options
                  </button>

                  <div className="text-center mb-6">
                    <div className="w-12 h-12 bg-[#f5f0e8] rounded-full mx-auto mb-4 flex items-center justify-center">
                      <Mail className="h-6 w-6 text-[#8b7355]" />
                    </div>
                    <h2 className="text-lg font-semibold text-stone-800">
                      Sign in with Magic Link
                    </h2>
                    <p className="text-sm text-stone-500 mt-1">
                      We&apos;ll send you a secure link to sign in
                    </p>
                  </div>

                  <form onSubmit={handleMagicLinkRequest} className="space-y-4">
                    <div className="space-y-2">
                      <Label
                        htmlFor="email-magic"
                        className="text-sm font-medium text-stone-600"
                      >
                        Email Address
                      </Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-stone-400" />
                        <Input
                          type="email"
                          id="email-magic"
                          value={email}
                          onChange={e => setEmail(e.target.value)}
                          required
                          placeholder="your@email.com"
                          className="pl-10 border-stone-200 bg-white/80 focus:border-[#b5a48b] focus:ring-[#b5a48b]/20 rounded-xl h-12"
                          disabled={isPending}
                        />
                      </div>
                    </div>

                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm"
                      >
                        {error}
                      </motion.div>
                    )}

                    <Button
                      type="submit"
                      disabled={isPending}
                      className="w-full h-12 bg-[#8b7355] hover:bg-[#6b5a45] text-white rounded-xl"
                    >
                      {isPending ? (
                        <>
                          <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                          Sending link...
                        </>
                      ) : (
                        <>
                          Send Magic Link
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </>
                      )}
                    </Button>
                  </form>
                </motion.div>
              )}

              {/* Magic Link Sent */}
              {mode === 'magic-link-sent' && (
                <motion.div
                  key="magic-link-sent"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-4"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                    className="w-16 h-16 bg-green-100 rounded-full mx-auto mb-6 flex items-center justify-center"
                  >
                    <Check className="h-8 w-8 text-green-600" />
                  </motion.div>

                  <h2 className="text-xl font-semibold text-stone-800 mb-2">
                    Check your email
                  </h2>
                  <p className="text-stone-600 mb-6">
                    We&apos;ve sent a magic link to
                    <br />
                    <span className="font-medium text-stone-800">{email}</span>
                  </p>

                  <div className="bg-stone-50 rounded-xl p-4 text-sm text-stone-600 mb-6">
                    <p>
                      Click the link in your email to sign in. The link will
                      expire in 24 hours.
                    </p>
                  </div>

                  <button
                    onClick={resetToChoice}
                    className="text-sm text-[#8b7355] hover:text-[#6b5a45] font-medium transition-colors"
                  >
                    Try a different email
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <Link
            href="/"
            className="text-sm text-stone-500 hover:text-stone-700 transition-colors inline-flex items-center"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Home
          </Link>
        </div>
      </motion.div>
    </div>
  )
}
