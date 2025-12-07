'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { verifyMagicLink } from '@/app/actions/client-auth'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Check, X, Loader2, Sparkles, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

function VerifyContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>(
    'verifying'
  )
  const [errorMessage, setErrorMessage] = useState<string>('')

  useEffect(() => {
    async function verify() {
      const token = searchParams.get('token')

      if (!token) {
        setStatus('error')
        setErrorMessage('No verification token provided.')
        return
      }

      const result = await verifyMagicLink(token)

      if (result.success) {
        setStatus('success')
        // Redirect to dashboard after 2 seconds
        setTimeout(() => {
          router.push('/client/dashboard')
        }, 2000)
      } else {
        setStatus('error')
        setErrorMessage(
          result.error || 'Verification failed. Please try again.'
        )
      }
    }

    verify()
  }, [searchParams, router])

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
            <h1 className="text-2xl font-semibold">
              {status === 'verifying' && 'Verifying Your Link'}
              {status === 'success' && 'Welcome Back!'}
              {status === 'error' && 'Verification Failed'}
            </h1>
            <p className="text-white/80 mt-2 text-sm">
              {status === 'verifying' && 'Please wait a moment...'}
              {status === 'success' && 'Redirecting you to your portal...'}
              {status === 'error' && 'There was a problem with your link'}
            </p>
          </div>

          {/* Content */}
          <div className="p-8">
            {status === 'verifying' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-8"
              >
                <Loader2 className="h-12 w-12 mx-auto text-[#8b7355] animate-spin mb-4" />
                <p className="text-stone-600">Verifying your magic link...</p>
              </motion.div>
            )}

            {status === 'success' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-8"
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
                  You&apos;re all set!
                </h2>
                <p className="text-stone-600 mb-6">
                  Taking you to your dashboard...
                </p>
                <div className="flex items-center justify-center gap-1 text-[#8b7355]">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Redirecting</span>
                </div>
              </motion.div>
            )}

            {status === 'error' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-6"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                  className="w-16 h-16 bg-red-100 rounded-full mx-auto mb-6 flex items-center justify-center"
                >
                  <X className="h-8 w-8 text-red-600" />
                </motion.div>
                <p className="text-stone-800 font-medium mb-2">
                  {errorMessage}
                </p>
                <p className="text-stone-500 text-sm mb-6">
                  Your login link may have expired or already been used.
                </p>
                <Link href="/client/login">
                  <Button className="bg-[#8b7355] hover:bg-[#6b5a45] text-white rounded-xl">
                    Request New Link
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </motion.div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <Link
            href="/"
            className="text-sm text-stone-500 hover:text-stone-700 transition-colors"
          >
            Return to Home
          </Link>
        </div>
      </motion.div>
    </div>
  )
}

export default function ClientVerifyPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#fdfbf7] via-[#f8f4ec] to-[#f5f0e8] p-4">
          <div className="text-center">
            <Loader2 className="h-12 w-12 mx-auto text-[#8b7355] animate-spin mb-4" />
            <p className="text-stone-600">Loading...</p>
          </div>
        </div>
      }
    >
      <VerifyContent />
    </Suspense>
  )
}
