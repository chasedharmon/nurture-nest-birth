import { getClientSession } from '@/app/actions/client-auth'
import { getClientServices } from '@/app/actions/services'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { format } from 'date-fns'

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

export default async function ClientServicesPage() {
  const session = await getClientSession()

  if (!session) {
    return null
  }

  const servicesResult = await getClientServices(session.clientId)
  const services = Array.isArray(servicesResult) ? servicesResult : []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Your Services</h1>
        <p className="text-muted-foreground mt-2">
          View all your doula care packages and services
        </p>
      </div>

      {services.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              You don&apos;t have any services yet. Your doula will add services
              to your account once you&apos;ve completed your consultation.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {services.map(service => (
            <Card key={service.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>
                      {serviceTypeLabels[
                        service.service_type as keyof typeof serviceTypeLabels
                      ] || serviceTypeLabels.other}
                    </CardTitle>
                    {service.package_name && (
                      <CardDescription className="mt-1">
                        {service.package_name}
                      </CardDescription>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${serviceStatusColors[service.status as keyof typeof serviceStatusColors] || serviceStatusColors.pending}`}
                    >
                      {service.status.replace('_', ' ').toUpperCase()}
                    </span>
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${paymentStatusColors[service.payment_status as keyof typeof paymentStatusColors] || paymentStatusColors.unpaid}`}
                    >
                      {service.payment_status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Service Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {service.price && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Package Price
                      </p>
                      <p className="text-lg font-semibold text-foreground">
                        ${service.price.toLocaleString()}
                      </p>
                    </div>
                  )}

                  {service.start_date && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Start Date
                      </p>
                      <p className="text-foreground">
                        {format(new Date(service.start_date), 'MMMM d, yyyy')}
                      </p>
                    </div>
                  )}

                  {service.end_date && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        End Date
                      </p>
                      <p className="text-foreground">
                        {format(new Date(service.end_date), 'MMMM d, yyyy')}
                      </p>
                    </div>
                  )}

                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Contract Status
                    </p>
                    <p className="text-foreground">
                      {service.contract_signed ? (
                        <span className="text-green-600 dark:text-green-400 font-medium">
                          ✓ Signed
                        </span>
                      ) : (
                        <span className="text-yellow-600 dark:text-yellow-400 font-medium">
                          ⏳ Pending Signature
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                {/* Contract Link */}
                {service.contract_url && (
                  <div className="pt-4 border-t">
                    <a
                      href={service.contract_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline font-medium"
                    >
                      View Contract →
                    </a>
                  </div>
                )}

                {/* Service Notes */}
                {service.notes && (
                  <div className="pt-4 border-t">
                    <p className="text-sm font-medium text-muted-foreground mb-2">
                      Service Notes
                    </p>
                    <p className="text-sm text-foreground">{service.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
