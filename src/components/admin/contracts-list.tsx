'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import type { ContractSignature, ClientService } from '@/lib/supabase/types'
import { Button } from '@/components/ui/button'
import {
  FileText,
  CheckCircle,
  Clock,
  XCircle,
  Eye,
  Send,
  AlertCircle,
} from 'lucide-react'
import { getDefaultContractTemplate } from '@/app/actions/contracts'
import { ContractSignatureModal } from './contract-signature-modal'

interface ContractsListProps {
  signatures: ContractSignature[]
  services: ClientService[]
  clientId: string
  clientName: string
  clientEmail: string
}

const signatureStatusConfig = {
  signed: {
    label: 'Signed',
    color: 'bg-green-100 text-green-800',
    icon: CheckCircle,
  },
  pending: {
    label: 'Pending',
    color: 'bg-yellow-100 text-yellow-800',
    icon: Clock,
  },
  voided: {
    label: 'Voided',
    color: 'bg-gray-100 text-gray-500',
    icon: XCircle,
  },
}

export function ContractsList({
  signatures,
  services,
  clientId: _clientId,
  clientName: _clientName,
  clientEmail: _clientEmail,
}: ContractsListProps) {
  const [selectedSignature, setSelectedSignature] =
    useState<ContractSignature | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  // These will be used when we add the contract sending modal
  const [_showNewContractModal, setShowNewContractModal] = useState(false)
  const [_selectedService, setSelectedService] = useState<ClientService | null>(
    null
  )

  // Filter services that require contracts but haven't been signed yet
  const pendingServices = services.filter(
    service => service.contract_required && !service.contract_signed
  )

  const handleSendContract = async (service: ClientService) => {
    setIsLoading(true)
    const templateResult = await getDefaultContractTemplate(
      service.service_type
    )
    setIsLoading(false)

    if (templateResult.success && templateResult.template) {
      setSelectedService(service)
      setShowNewContractModal(true)
    } else {
      alert('No contract template found for this service type')
    }
  }

  return (
    <div className="space-y-6">
      {/* Pending Contracts Section */}
      {pendingServices.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground">
            Awaiting Signature
          </h4>
          {pendingServices.map(service => (
            <div
              key={service.id}
              className="flex items-center justify-between p-4 border border-amber-200 rounded-lg bg-amber-50"
            >
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600" />
                <div>
                  <p className="font-medium text-amber-900">
                    {service.package_name ||
                      service.service_type
                        .replace(/_/g, ' ')
                        .replace(/\b\w/g, l => l.toUpperCase())}
                  </p>
                  <p className="text-sm text-amber-700">
                    Contract required before service begins
                  </p>
                </div>
              </div>
              <Button
                onClick={() => handleSendContract(service)}
                disabled={isLoading}
                size="sm"
                className="bg-amber-600 hover:bg-amber-700"
              >
                <Send className="h-4 w-4 mr-1" />
                Send Contract
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Signed Contracts */}
      {signatures.length === 0 && pendingServices.length === 0 ? (
        <div className="py-8 text-center text-muted-foreground">
          <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>No contracts yet</p>
          <p className="text-sm mt-1">
            Contracts will appear here when services require them
          </p>
        </div>
      ) : (
        signatures.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground">
              Contract History
            </h4>
            {signatures.map(signature => {
              const status =
                signatureStatusConfig[
                  signature.status as keyof typeof signatureStatusConfig
                ] || signatureStatusConfig.pending
              const StatusIcon = status.icon

              return (
                <div
                  key={signature.id}
                  className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-foreground">
                          Service Contract
                        </p>
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${status.color}`}
                        >
                          <StatusIcon className="h-3 w-3" />
                          {status.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>Signed by: {signature.signer_name}</span>
                        {signature.signed_at && (
                          <span>
                            {format(
                              new Date(signature.signed_at),
                              'MMM d, yyyy h:mm a'
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedSignature(signature)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </Button>
                </div>
              )
            })}
          </div>
        )
      )}

      {/* View Signature Modal */}
      {selectedSignature && (
        <ContractSignatureModal
          signature={selectedSignature}
          onClose={() => setSelectedSignature(null)}
        />
      )}
    </div>
  )
}
