/**
 * Service Comparison Table
 *
 * Helps families understand the differences between service offerings.
 * Responsive design with mobile-friendly card layout.
 */

export interface ComparisonFeature {
  name: string
  description?: string
}

export interface ComparisonService {
  name: string
  description: string
  features: (boolean | string)[]
  highlighted?: boolean
  ctaText?: string
  ctaLink?: string
}

interface ServiceComparisonProps {
  services: ComparisonService[]
  features: ComparisonFeature[]
  title?: string
  description?: string
  className?: string
}

export function ServiceComparison({
  services,
  features,
  title,
  description,
  className = '',
}: ServiceComparisonProps) {
  return (
    <div className={className}>
      {(title || description) && (
        <div className="mb-12 text-center">
          {title && (
            <h2 className="font-serif text-3xl font-bold text-foreground">
              {title}
            </h2>
          )}
          {description && (
            <p className="mt-4 text-lg text-muted-foreground">{description}</p>
          )}
        </div>
      )}

      {/* Desktop Table View */}
      <div className="hidden overflow-hidden rounded-lg border border-border lg:block">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="p-4 text-left font-serif text-lg font-semibold text-foreground">
                Feature
              </th>
              {services.map((service, index) => (
                <th
                  key={index}
                  className={`p-4 text-center font-serif text-lg font-semibold ${
                    service.highlighted
                      ? 'bg-primary/10 text-primary'
                      : 'text-foreground'
                  }`}
                >
                  <div>{service.name}</div>
                  <div className="mt-1 text-sm font-normal text-muted-foreground">
                    {service.description}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {features.map((feature, featureIndex) => (
              <tr
                key={featureIndex}
                className="border-b border-border last:border-b-0 hover:bg-muted/30"
              >
                <td className="p-4">
                  <div className="font-medium text-foreground">
                    {feature.name}
                  </div>
                  {feature.description && (
                    <div className="mt-1 text-sm text-muted-foreground">
                      {feature.description}
                    </div>
                  )}
                </td>
                {services.map((service, serviceIndex) => (
                  <td
                    key={serviceIndex}
                    className={`p-4 text-center ${
                      service.highlighted ? 'bg-primary/5' : ''
                    }`}
                  >
                    {service.features[featureIndex] !== undefined &&
                      renderFeatureValue(service.features[featureIndex])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="space-y-6 lg:hidden">
        {services.map((service, serviceIndex) => (
          <div
            key={serviceIndex}
            className={`rounded-lg border-2 ${
              service.highlighted
                ? 'border-primary bg-primary/5'
                : 'border-border bg-card'
            } p-6 shadow-sm`}
          >
            <h3 className="font-serif text-xl font-bold text-foreground">
              {service.name}
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {service.description}
            </p>

            <div className="mt-6 space-y-4">
              {features.map((feature, featureIndex) => (
                <div
                  key={featureIndex}
                  className="flex items-start justify-between gap-4"
                >
                  <div className="flex-1">
                    <div className="font-medium text-foreground">
                      {feature.name}
                    </div>
                    {feature.description && (
                      <div className="mt-1 text-sm text-muted-foreground">
                        {feature.description}
                      </div>
                    )}
                  </div>
                  <div className="shrink-0">
                    {service.features[featureIndex] !== undefined &&
                      renderFeatureValue(service.features[featureIndex])}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function renderFeatureValue(value: boolean | string) {
  if (typeof value === 'boolean') {
    return (
      <div className="flex items-center justify-center">
        {value ? (
          <svg
            className="h-5 w-5 text-primary"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M5 13l4 4L19 7"
            />
          </svg>
        ) : (
          <svg
            className="h-5 w-5 text-muted-foreground/30"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        )}
      </div>
    )
  }

  return <span className="text-sm font-medium text-foreground">{value}</span>
}
