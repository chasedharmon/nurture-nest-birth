'use client'

import { format } from 'date-fns'
import type { ClientService } from '@/lib/supabase/types'

interface ServicesListProps {
  services: ClientService[]
  clientId: string
}

const serviceTypeLabels = {
  birth_doula: 'Birth Doula',
  postpartum_doula: 'Postpartum Doula',
  lactation_consulting: 'Lactation Consulting',
  childbirth_education: 'Childbirth Education',
  other: 'Other',
}

const serviceStatusColors = {
  pending:
    'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300',
  active:
    'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300',
  completed: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300',
  cancelled: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300',
}

const paymentStatusColors = {
  unpaid: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300',
  partial:
    'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300',
  paid: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300',
  refunded: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300',
}

export function ServicesList({ services }: ServicesListProps) {
  if (services.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        <p>No services added yet</p>
        <p className="text-sm mt-1">Add a service package to get started</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {services.map(service => (
        <div
          key={service.id}
          className="border border-border rounded-lg p-4 hover:bg-muted/50 transition-colors"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-foreground">
                  {serviceTypeLabels[service.service_type]}
                </h3>
                <span
                  className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${serviceStatusColors[service.status]}`}
                >
                  {service.status}
                </span>
                <span
                  className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${paymentStatusColors[service.payment_status]}`}
                >
                  {service.payment_status}
                </span>
              </div>

              {service.package_name && (
                <p className="text-sm text-muted-foreground mt-1">
                  {service.package_name}
                </p>
              )}

              <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
                {service.price && (
                  <div>
                    <span className="font-medium text-muted-foreground">
                      Price:{' '}
                    </span>
                    <span className="text-foreground">
                      ${service.price.toLocaleString()}
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
                      <span className="text-green-600">✓ Signed</span>
                    ) : (
                      <span className="text-yellow-600">Pending</span>
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
          </div>
        </div>
      ))}
    </div>
  )
}
