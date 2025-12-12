import {
  getClientSession,
  getClientAccessLevel,
} from '@/app/actions/client-auth'
import { getPortalServices } from '@/app/actions/portal-crm-data'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import {
  Briefcase,
  Calendar,
  DollarSign,
  Clock,
  CheckCircle2,
} from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

const serviceTypeLabels: Record<string, string> = {
  birth_doula: 'Birth Doula',
  postpartum_doula: 'Postpartum Doula',
  lactation_consulting: 'Lactation Consulting',
  childbirth_education: 'Childbirth Education',
  antepartum_doula: 'Antepartum Doula',
  full_spectrum: 'Full Spectrum Support',
  consultation: 'Consultation',
  other: 'Other Service',
}

const stageColors: Record<string, string> = {
  qualification:
    'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  needs_analysis:
    'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  proposal:
    'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  negotiation:
    'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  closed_won:
    'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  closed_lost:
    'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
}

export default async function ClientServicesPage() {
  const session = await getClientSession()

  if (!session) {
    return null
  }

  const accessLevel = await getClientAccessLevel()

  // Leads don't have access to services
  if (accessLevel === 'limited') {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Your Services</h1>
          <p className="text-muted-foreground mt-2">
            View all your doula care packages and services
          </p>
        </div>

        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="py-8 text-center">
            <Briefcase className="h-12 w-12 mx-auto text-primary/50 mb-4" />
            <h2 className="text-lg font-semibold mb-2">Services Coming Soon</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Once you become a client, you&apos;ll be able to see your service
              packages, their status, and details here.
            </p>
            <Link href="/client/dashboard" className="mt-4 inline-block">
              <Button variant="outline">Back to Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const servicesResult = await getPortalServices()
  const services = servicesResult.data || []

  // Separate active (closed_won) from in-progress services
  const activeServices = services.filter(s => s.isActive)
  const inProgressServices = services.filter(s => !s.isActive && !s.isWon)

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
            <Briefcase className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">
              You don&apos;t have any services yet. Your doula will add services
              to your account once you&apos;ve completed your consultation.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {/* Active Services */}
          {activeServices.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                Active Services
              </h2>
              <div className="grid grid-cols-1 gap-6">
                {activeServices.map(service => (
                  <Card
                    key={service.id}
                    className="border-green-200/50 bg-green-50/30 dark:bg-green-900/10"
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            {service.name}
                          </CardTitle>
                          {service.serviceType && (
                            <CardDescription className="mt-1">
                              {serviceTypeLabels[service.serviceType] ||
                                service.serviceType
                                  .split('_')
                                  .map(
                                    word =>
                                      word.charAt(0).toUpperCase() +
                                      word.slice(1)
                                  )
                                  .join(' ')}
                            </CardDescription>
                          )}
                        </div>
                        <Badge className={stageColors.closed_won}>
                          {service.stageDisplay}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Service Details Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {service.amount && (
                          <div className="flex items-start gap-3">
                            <DollarSign className="h-4 w-4 text-muted-foreground mt-0.5" />
                            <div>
                              <p className="text-sm font-medium text-muted-foreground">
                                Package Price
                              </p>
                              <p className="text-lg font-semibold text-foreground">
                                ${service.amount.toLocaleString()}
                              </p>
                            </div>
                          </div>
                        )}

                        {service.actualCloseDate && (
                          <div className="flex items-start gap-3">
                            <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                            <div>
                              <p className="text-sm font-medium text-muted-foreground">
                                Service Started
                              </p>
                              <p className="text-foreground">
                                {format(
                                  new Date(service.actualCloseDate),
                                  'MMMM d, yyyy'
                                )}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Next Step */}
                      {service.nextStep && (
                        <div className="pt-4 border-t">
                          <p className="text-sm font-medium text-muted-foreground mb-1">
                            Next Step
                          </p>
                          <p className="text-sm text-foreground">
                            {service.nextStep}
                          </p>
                          {service.nextStepDate && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Due:{' '}
                              {format(
                                new Date(service.nextStepDate),
                                'MMM d, yyyy'
                              )}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Description */}
                      {service.description && (
                        <div className="pt-4 border-t">
                          <p className="text-sm font-medium text-muted-foreground mb-2">
                            Service Details
                          </p>
                          <p className="text-sm text-foreground">
                            {service.description}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* In-Progress Services */}
          {inProgressServices.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-600" />
                Services in Progress
              </h2>
              <div className="grid grid-cols-1 gap-6">
                {inProgressServices.map(service => (
                  <Card key={service.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle>{service.name}</CardTitle>
                          {service.serviceType && (
                            <CardDescription className="mt-1">
                              {serviceTypeLabels[service.serviceType] ||
                                service.serviceType
                                  .split('_')
                                  .map(
                                    word =>
                                      word.charAt(0).toUpperCase() +
                                      word.slice(1)
                                  )
                                  .join(' ')}
                            </CardDescription>
                          )}
                        </div>
                        <Badge
                          className={
                            stageColors[service.stage] ||
                            stageColors.qualification
                          }
                        >
                          {service.stageDisplay}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Service Details Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {service.amount && (
                          <div className="flex items-start gap-3">
                            <DollarSign className="h-4 w-4 text-muted-foreground mt-0.5" />
                            <div>
                              <p className="text-sm font-medium text-muted-foreground">
                                Estimated Price
                              </p>
                              <p className="text-lg font-semibold text-foreground">
                                ${service.amount.toLocaleString()}
                              </p>
                            </div>
                          </div>
                        )}

                        {service.closeDate && (
                          <div className="flex items-start gap-3">
                            <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                            <div>
                              <p className="text-sm font-medium text-muted-foreground">
                                Expected Start
                              </p>
                              <p className="text-foreground">
                                {format(
                                  new Date(service.closeDate),
                                  'MMMM d, yyyy'
                                )}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Progress Indicator */}
                      <div className="pt-4 border-t">
                        <p className="text-sm font-medium text-muted-foreground mb-2">
                          Progress
                        </p>
                        <div className="flex gap-1">
                          {[
                            'qualification',
                            'needs_analysis',
                            'proposal',
                            'negotiation',
                            'closed_won',
                          ].map((stage, index) => {
                            const stageOrder = [
                              'qualification',
                              'needs_analysis',
                              'proposal',
                              'negotiation',
                              'closed_won',
                            ]
                            const currentIndex = stageOrder.indexOf(
                              service.stage
                            )
                            const isCompleted = index <= currentIndex
                            const isCurrent = index === currentIndex

                            return (
                              <div
                                key={stage}
                                className={`h-2 flex-1 rounded-full ${
                                  isCompleted
                                    ? isCurrent
                                      ? 'bg-primary'
                                      : 'bg-primary/60'
                                    : 'bg-muted'
                                }`}
                              />
                            )
                          })}
                        </div>
                        <div className="flex justify-between text-xs text-muted-foreground mt-1">
                          <span>Initial</span>
                          <span>Active</span>
                        </div>
                      </div>

                      {/* Next Step */}
                      {service.nextStep && (
                        <div className="pt-4 border-t">
                          <p className="text-sm font-medium text-muted-foreground mb-1">
                            Next Step
                          </p>
                          <p className="text-sm text-foreground">
                            {service.nextStep}
                          </p>
                          {service.nextStepDate && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Due:{' '}
                              {format(
                                new Date(service.nextStepDate),
                                'MMM d, yyyy'
                              )}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Description */}
                      {service.description && (
                        <div className="pt-4 border-t">
                          <p className="text-sm font-medium text-muted-foreground mb-2">
                            Service Details
                          </p>
                          <p className="text-sm text-foreground">
                            {service.description}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
