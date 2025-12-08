'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import type { ClientService } from '@/lib/supabase/types'
import {
  deleteService,
  updateServiceStatus,
  markContractSigned,
} from '@/app/actions/services'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select-native'
import { AddServiceForm } from './add-service-form'

interface ServicesListProps {
  services: ClientService[]
  clientId: string
}

const serviceStatusColors: Record<string, string> = {
  pending: 'bg-secondary/10 text-secondary',
  active: 'bg-primary/10 text-primary',
  completed: 'bg-muted text-muted-foreground',
  cancelled: 'bg-muted text-muted-foreground',
}

const serviceStatuses = [
  { value: 'pending', label: 'Pending' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
]

export function ServicesList({ services, clientId }: ServicesListProps) {
  return (
    <div className="space-y-4">
      <AddServiceForm clientId={clientId} />

      {services.length === 0 ? (
        <div className="py-8 text-center text-muted-foreground">
          <p>No services added yet</p>
          <p className="text-sm mt-1">Add a service package to get started</p>
        </div>
      ) : (
        <div className="space-y-4">
          {services.map(service => (
            <ServiceCard key={service.id} service={service} />
          ))}
        </div>
      )}
    </div>
  )
}

function ServiceCard({ service }: { service: ClientService }) {
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  async function handleStatusChange(newStatus: string) {
    setIsUpdating(true)
    await updateServiceStatus(
      service.id,
      newStatus as 'pending' | 'active' | 'completed' | 'cancelled'
    )
    setIsUpdating(false)
  }

  async function handleMarkContractSigned() {
    setIsUpdating(true)
    await markContractSigned(service.id)
    setIsUpdating(false)
  }

  async function handleDelete() {
    setIsDeleting(true)
    await deleteService(service.id)
    setIsDeleting(false)
    setShowDeleteConfirm(false)
  }

  return (
    <div className="border border-border rounded-lg p-4 hover:bg-muted/50 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-foreground">
              {service.service_type
                .replace(/_/g, ' ')
                .replace(/\b\w/g, l => l.toUpperCase())}
            </h3>
            <span
              className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${serviceStatusColors[service.status] || serviceStatusColors.pending}`}
            >
              {service.status}
            </span>
          </div>

          {service.package_name && (
            <p className="text-sm text-muted-foreground mt-1">
              {service.package_name}
            </p>
          )}

          {service.description && (
            <p className="text-sm text-muted-foreground mt-1">
              {service.description}
            </p>
          )}

          <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
            {service.total_amount && (
              <div>
                <span className="font-medium text-muted-foreground">
                  Amount:{' '}
                </span>
                <span className="text-foreground">
                  ${service.total_amount.toLocaleString()}
                </span>
              </div>
            )}

            {service.start_date && (
              <div>
                <span className="font-medium text-muted-foreground">
                  Start Date:{' '}
                </span>
                <span className="text-foreground">
                  {format(new Date(service.start_date), 'MMM d, yyyy')}
                </span>
              </div>
            )}

            {service.end_date && (
              <div>
                <span className="font-medium text-muted-foreground">
                  End Date:{' '}
                </span>
                <span className="text-foreground">
                  {format(new Date(service.end_date), 'MMM d, yyyy')}
                </span>
              </div>
            )}

            <div>
              <span className="font-medium text-muted-foreground">
                Contract:{' '}
              </span>
              <span className="text-foreground">
                {service.contract_signed ? (
                  <span className="text-primary">Signed</span>
                ) : (
                  <span className="text-secondary">Pending</span>
                )}
              </span>
            </div>
          </div>

          {service.notes && (
            <p className="text-sm text-muted-foreground mt-3">
              {service.notes}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2 ml-4">
          <Select
            value={service.status}
            onChange={e => handleStatusChange(e.target.value)}
            disabled={isUpdating}
            className="text-xs h-8"
          >
            {serviceStatuses.map(status => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </Select>

          {!service.contract_signed && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkContractSigned}
              disabled={isUpdating}
              className="text-xs"
            >
              Mark Signed
            </Button>
          )}

          {showDeleteConfirm ? (
            <div className="flex gap-1">
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                disabled={isDeleting}
                className="text-xs"
              >
                {isDeleting ? '...' : 'Yes'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDeleteConfirm(false)}
                className="text-xs"
              >
                No
              </Button>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDeleteConfirm(true)}
              className="text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              Delete
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
