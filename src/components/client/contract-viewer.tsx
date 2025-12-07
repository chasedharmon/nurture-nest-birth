'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { signContract } from '@/app/actions/contracts'
import {
  FileText,
  CheckCircle,
  Loader2,
  AlertCircle,
  Signature,
} from 'lucide-react'
import { format } from 'date-fns'
import type { ContractTemplate, ContractSignature } from '@/lib/supabase/types'
import { emailConfig } from '@/lib/email/config'

interface ContractViewerProps {
  template: ContractTemplate
  clientId: string
  serviceId?: string
  clientName: string
  clientEmail: string
  existingSignature?: ContractSignature | null
  onSigned?: () => void
}

export function ContractViewer({
  template,
  clientId,
  serviceId,
  clientName,
  clientEmail,
  existingSignature,
  onSigned,
}: ContractViewerProps) {
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false)
  const [agreed, setAgreed] = useState(false)
  const [signerName, setSignerName] = useState(clientName)
  const [signerEmail, setSignerEmail] = useState(clientEmail)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [signed, setSigned] = useState(!!existingSignature)
  const contentRef = useRef<HTMLDivElement>(null)

  const handleScroll = () => {
    if (contentRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = contentRef.current
      if (scrollTop + clientHeight >= scrollHeight - 50) {
        setHasScrolledToBottom(true)
      }
    }
  }

  const handleSign = async () => {
    if (!agreed) {
      setError('Please agree to the terms before signing')
      return
    }

    if (!signerName.trim()) {
      setError('Please enter your full legal name')
      return
    }

    if (!signerEmail.trim()) {
      setError('Please enter your email address')
      return
    }

    setIsSubmitting(true)
    setError(null)

    const result = await signContract({
      clientId,
      serviceId,
      templateId: template.id,
      signerName: signerName.trim(),
      signerEmail: signerEmail.trim(),
    })

    setIsSubmitting(false)

    if (result.success) {
      setSigned(true)
      onSigned?.()
    } else {
      setError(result.error || 'Failed to sign contract')
    }
  }

  // Replace placeholders in contract content
  const processedContent = template.content
    .replace(/\{\{client_name\}\}/g, clientName)
    .replace(/\{\{doula_name\}\}/g, emailConfig.doula.name || 'Your Doula')
    .replace(/\{\{doula_phone\}\}/g, emailConfig.doula.phone || '')
    .replace(/\{\{doula_email\}\}/g, emailConfig.doula.email || '')
    .replace(/\{\{business_name\}\}/g, emailConfig.branding.name)
    .replace(/\{\{current_date\}\}/g, format(new Date(), 'MMMM d, yyyy'))

  if (signed || existingSignature) {
    const signature = existingSignature
    return (
      <Card className="bg-green-50/50 border-green-200">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-xl text-green-600">
              <CheckCircle className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg text-green-800">
                Contract Signed
              </CardTitle>
              <p className="text-sm text-green-600">
                This contract has been electronically signed
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-white rounded-lg p-4 border border-green-200">
            <h4 className="font-medium text-stone-800 mb-3">{template.name}</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-stone-500">Signed by</p>
                <p className="font-medium text-stone-800">
                  {signature?.signer_name || signerName}
                </p>
              </div>
              <div>
                <p className="text-stone-500">Email</p>
                <p className="font-medium text-stone-800">
                  {signature?.signer_email || signerEmail}
                </p>
              </div>
              {signature?.signed_at && (
                <div>
                  <p className="text-stone-500">Signed on</p>
                  <p className="font-medium text-stone-800">
                    {format(new Date(signature.signed_at), 'MMMM d, yyyy')}
                  </p>
                </div>
              )}
              {signature?.signed_at && (
                <div>
                  <p className="text-stone-500">Time</p>
                  <p className="font-medium text-stone-800">
                    {format(new Date(signature.signed_at), 'h:mm a')}
                  </p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-white/90 backdrop-blur-sm border-stone-200">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#f5f0e8] rounded-xl text-[#8b7355]">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-lg text-stone-800">
              {template.name}
            </CardTitle>
            {template.description && (
              <p className="text-sm text-stone-500">{template.description}</p>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Contract Content */}
        <div
          ref={contentRef}
          onScroll={handleScroll}
          className="max-h-96 overflow-y-auto border border-stone-200 rounded-lg p-6 bg-stone-50 prose prose-sm max-w-none"
        >
          <div
            className="whitespace-pre-wrap"
            dangerouslySetInnerHTML={{ __html: processedContent }}
          />
        </div>

        {/* Scroll indicator */}
        <AnimatePresence>
          {!hasScrolledToBottom && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center text-sm text-amber-600 bg-amber-50 p-2 rounded-lg"
            >
              <AlertCircle className="h-4 w-4 inline mr-2" />
              Please scroll to read the entire contract before signing
            </motion.div>
          )}
        </AnimatePresence>

        {/* Signature Form */}
        <motion.div
          initial={{ opacity: 0.5 }}
          animate={{ opacity: hasScrolledToBottom ? 1 : 0.5 }}
          className="space-y-4"
        >
          {/* Error message */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-3 bg-red-50 text-red-700 rounded-lg border border-red-200"
              >
                <p className="text-sm">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Agreement checkbox */}
          <div className="flex items-start gap-3 p-4 bg-stone-50 rounded-lg">
            <Checkbox
              id="agree"
              checked={agreed}
              onCheckedChange={(checked: boolean | 'indeterminate') =>
                setAgreed(checked === true)
              }
              disabled={!hasScrolledToBottom}
            />
            <Label
              htmlFor="agree"
              className="text-sm text-stone-700 cursor-pointer leading-relaxed"
            >
              I have read and understand the terms outlined in this contract,
              and I agree to be bound by them. I acknowledge that this
              electronic signature is legally binding.
            </Label>
          </div>

          {/* Signature fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="signer-name" className="text-stone-700">
                Full Legal Name
              </Label>
              <Input
                id="signer-name"
                value={signerName}
                onChange={e => setSignerName(e.target.value)}
                placeholder="Enter your full legal name"
                disabled={!hasScrolledToBottom}
                className="bg-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="signer-email" className="text-stone-700">
                Email Address
              </Label>
              <Input
                id="signer-email"
                type="email"
                value={signerEmail}
                onChange={e => setSignerEmail(e.target.value)}
                placeholder="Enter your email"
                disabled={!hasScrolledToBottom}
                className="bg-white"
              />
            </div>
          </div>

          {/* Sign button */}
          <Button
            onClick={handleSign}
            disabled={!hasScrolledToBottom || !agreed || isSubmitting}
            className="w-full bg-[#8b7355] hover:bg-[#6b5a45] text-white rounded-xl"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Signing...
              </>
            ) : (
              <>
                <Signature className="h-4 w-4 mr-2" />
                Sign Contract Electronically
              </>
            )}
          </Button>

          <p className="text-xs text-center text-stone-500">
            By clicking &quot;Sign Contract Electronically&quot;, you agree that
            your electronic signature is the legal equivalent of your manual
            signature.
          </p>
        </motion.div>
      </CardContent>
    </Card>
  )
}
