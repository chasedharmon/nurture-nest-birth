import { AnimatedCounter } from './animated-counter'

/**
 * Stats Section Component
 *
 * Displays key statistics with animated counters.
 * Can accept real-time data or static values.
 */

export interface Stat {
  value: number
  label: string
  suffix?: string
  prefix?: string
  decimals?: number
  description?: string
  icon?: React.ReactNode
  sourceUrl?: string
  sourceLabel?: string
}

interface StatsSectionProps {
  stats: Stat[]
  title?: string
  description?: string
  variant?: 'default' | 'compact'
  className?: string
}

export function StatsSection({
  stats,
  title,
  description,
  variant = 'default',
  className = '',
}: StatsSectionProps) {
  if (variant === 'compact') {
    return (
      <div className={`grid gap-8 sm:grid-cols-2 lg:grid-cols-4 ${className}`}>
        {stats.map((stat, index) => (
          <div key={index} className="text-center">
            <div className="font-serif text-4xl font-bold text-primary">
              <AnimatedCounter
                end={stat.value}
                suffix={stat.suffix}
                prefix={stat.prefix}
                decimals={stat.decimals}
              />
            </div>
            <p className="mt-2 text-sm font-medium text-foreground">
              {stat.label}
            </p>
          </div>
        ))}
      </div>
    )
  }

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

      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => {
          const StatWrapper = stat.sourceUrl ? 'a' : 'div'
          const wrapperProps = stat.sourceUrl
            ? {
                href: stat.sourceUrl,
                target: '_blank',
                rel: 'noopener noreferrer',
                className:
                  'group block rounded-lg border border-border bg-card p-6 text-center shadow-sm transition-all hover:border-primary/50 hover:shadow-md',
              }
            : {
                className:
                  'rounded-lg border border-border bg-card p-6 text-center shadow-sm transition-shadow hover:shadow-md',
              }

          return (
            <StatWrapper key={index} {...wrapperProps}>
              {stat.icon && (
                <div className="mb-4 flex justify-center text-primary">
                  {stat.icon}
                </div>
              )}
              <div className="font-serif text-5xl font-bold text-primary">
                <AnimatedCounter
                  end={stat.value}
                  suffix={stat.suffix}
                  prefix={stat.prefix}
                  decimals={stat.decimals}
                />
              </div>
              <p className="mt-3 font-semibold text-foreground">{stat.label}</p>
              {stat.description && (
                <p className="mt-2 text-sm text-muted-foreground">
                  {stat.description}
                </p>
              )}
              {stat.sourceUrl && stat.sourceLabel && (
                <p className="mt-3 text-xs text-primary opacity-70 transition-opacity group-hover:opacity-100">
                  Source: {stat.sourceLabel} →
                </p>
              )}
            </StatWrapper>
          )
        })}
      </div>
    </div>
  )
}
