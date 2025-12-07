'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import type { ContractSignature } from '@/lib/supabase/types'
import { Button } from '@/components/ui/button'
import { voidContractSignature } from '@/app/actions/contracts'
import { X, CheckCircle, XCircle, Globe, Monitor, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface ContractSignatureModalProps {
  signature: ContractSignature
  onClose: () => void
}

export function ContractSignatureModal({
  signature,
  onClose,
}: ContractSignatureModalProps) {
  const [showVoidConfirm, setShowVoidConfirm] = useState(false)
  const [voidReason, setVoidReason] = useState('')
  const [isVoiding, setIsVoiding] = useState(false)

  const handleVoid = async () => {
    if (!voidReason.trim()) return

    setIsVoiding(true)
    await voidContractSignature(signature.id, voidReason.trim())
    setIsVoiding(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">Contract Details</h2>
            {signature.status === 'signed' && (
              <span className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium bg-green-100 text-green-800">
                <CheckCircle className="h-3 w-3" />
                Signed
              </span>
            )}
            {signature.status === 'voided' && (
              <span className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600">
                <XCircle className="h-3 w-3" />
                Voided
              </span>
            )}
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {/* Signature Info */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-3">
                Signer Information
              </h3>
              <div className="space-y-2">
                <div>
                  <p className="text-xs text-muted-foreground">Name</p>
                  <p className="font-medium">{signature.signer_name}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="font-medium">{signature.signer_email}</p>
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-3">
                Signature Details
              </h3>
              <div className="space-y-2">
                {signature.signed_at && (
                  <div>
                    <p className="text-xs text-muted-foreground">Signed At</p>
                    <p className="font-medium">
                      {format(
                        new Date(signature.signed_at),
                        'MMMM d, yyyy h:mm:ss a'
                      )}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-muted-foreground">
                    Contract Version
                  </p>
                  <p className="font-medium">v{signature.contract_version}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Technical Details */}
          <div className="mb-6 p-4 bg-muted/30 rounded-lg">
            <h3 className="text-sm font-medium text-muted-foreground mb-3">
              Verification Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              {signature.ip_address && (
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">IP Address:</span>
                  <span className="font-mono">{signature.ip_address}</span>
                </div>
              )}
              {signature.user_agent && (
                <div className="flex items-start gap-2 col-span-2">
                  <Monitor className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <span className="text-muted-foreground">User Agent:</span>
                    <p className="font-mono text-xs break-all mt-1">
                      {signature.user_agent}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Voided info */}
          {signature.status === 'voided' && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <h3 className="text-sm font-medium text-red-800 mb-2">
                Contract Voided
              </h3>
              <div className="space-y-2 text-sm">
                {signature.voided_at && (
                  <p className="text-red-700">
                    Voided on:{' '}
                    {format(
                      new Date(signature.voided_at),
                      'MMMM d, yyyy h:mm a'
                    )}
                  </p>
                )}
                {signature.voided_reason && (
                  <p className="text-red-700">
                    Reason: {signature.voided_reason}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Contract Content */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">
              Contract Content (as signed)
            </h3>
            <div className="border border-border rounded-lg p-4 max-h-64 overflow-y-auto bg-white prose prose-sm max-w-none">
              <div
                className="whitespace-pre-wrap"
                dangerouslySetInnerHTML={{
                  __html: signature.contract_content,
                }}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-muted/30">
          {signature.status === 'signed' && !showVoidConfirm && (
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">
                This signature is legally binding.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowVoidConfirm(true)}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                Void Contract
              </Button>
            </div>
          )}

          {showVoidConfirm && (
            <div className="space-y-3">
              <p className="text-sm text-red-600 font-medium">
                Are you sure you want to void this contract?
              </p>
              <div className="space-y-2">
                <Label htmlFor="void-reason">Reason for voiding</Label>
                <Input
                  id="void-reason"
                  value={voidReason}
                  onChange={e => setVoidReason(e.target.value)}
                  placeholder="Enter the reason for voiding this contract"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowVoidConfirm(false)
                    setVoidReason('')
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleVoid}
                  disabled={!voidReason.trim() || isVoiding}
                >
                  {isVoiding ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Voiding...
                    </>
                  ) : (
                    'Confirm Void'
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
