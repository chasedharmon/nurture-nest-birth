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
        {stats.map((stat, index) => (
          <div
            key={index}
            className="rounded-lg border border-border bg-card p-6 text-center shadow-sm transition-shadow hover:shadow-md"
          >
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
          </div>
        ))}
      </div>
    </div>
  )
}
