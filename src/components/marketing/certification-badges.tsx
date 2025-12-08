'use client'

import { cn } from '@/lib/utils'
import { FadeIn } from '@/components/ui/fade-in'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Heart,
  Baby,
  GraduationCap,
  Shield,
  HandHeart,
  Home,
  Award,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

interface Certification {
  id: string
  name: string
  shortName: string
  organization: string
  description: string
  icon: LucideIcon
  color: string
  bgColor: string
  borderColor: string
}

const certifications: Certification[] = [
  {
    id: 'dona-birth',
    name: 'DONA Certified Birth Doula',
    shortName: 'Birth Doula',
    organization: 'DONA International',
    description:
      "Trained and certified by DONA International, the world's oldest and largest doula certifying organization. Includes extensive training in labor support, comfort measures, and advocacy.",
    icon: Heart,
    color: 'text-rose-600 dark:text-rose-400',
    bgColor: 'bg-rose-100 dark:bg-rose-950/30',
    borderColor: 'border-rose-200 dark:border-rose-800',
  },
  {
    id: 'dona-postpartum',
    name: 'DONA Certified Postpartum Doula',
    shortName: 'Postpartum Doula',
    organization: 'DONA International',
    description:
      'Certified to provide evidence-based postpartum support including newborn care, feeding assistance, family adjustment, and recovery support during the fourth trimester.',
    icon: Baby,
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-100 dark:bg-purple-950/30',
    borderColor: 'border-purple-200 dark:border-purple-800',
  },
  {
    id: 'lactation',
    name: 'Certified Lactation Consultant',
    shortName: 'Lactation',
    organization: 'Lactation Education Resources',
    description:
      'Trained to provide evidence-based lactation support, including latch assessment, supply management, and troubleshooting common breastfeeding challenges.',
    icon: HandHeart,
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-100 dark:bg-amber-950/30',
    borderColor: 'border-amber-200 dark:border-amber-800',
  },
  {
    id: 'cpst',
    name: 'Child Passenger Safety Technician',
    shortName: 'CPST',
    organization: 'Safe Kids Worldwide',
    description:
      'Nationally certified to properly install car seats and educate families on child passenger safety. Studies show 73% of car seats are installed incorrectly—a CPST ensures your child travels safely.',
    icon: Shield,
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-100 dark:bg-blue-950/30',
    borderColor: 'border-blue-200 dark:border-blue-800',
  },
  {
    id: 'infant-massage',
    name: 'Certified Infant Massage Instructor',
    shortName: 'Infant Massage',
    organization: 'Infant Massage USA',
    description:
      'Trained to teach parents therapeutic massage techniques that promote bonding, improve sleep, relieve colic and gas, and support healthy infant development.',
    icon: Baby,
    color: 'text-teal-600 dark:text-teal-400',
    bgColor: 'bg-teal-100 dark:bg-teal-950/30',
    borderColor: 'border-teal-200 dark:border-teal-800',
  },
  {
    id: 'family-studies',
    name: 'Family Studies Degree',
    shortName: 'Family Studies',
    organization: 'University of Nebraska',
    description:
      'Academic foundation in child development, family dynamics, and human services that informs a holistic approach to supporting families through major life transitions.',
    icon: GraduationCap,
    color: 'text-indigo-600 dark:text-indigo-400',
    bgColor: 'bg-indigo-100 dark:bg-indigo-950/30',
    borderColor: 'border-indigo-200 dark:border-indigo-800',
  },
  {
    id: 'home-visitation',
    name: 'Home Visitation Specialist',
    shortName: 'Home Visitor',
    organization: 'Nebraska Early Childhood',
    description:
      'Specialized training in providing support to families in their home environment, understanding family dynamics, and connecting families with community resources.',
    icon: Home,
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-100 dark:bg-green-950/30',
    borderColor: 'border-green-200 dark:border-green-800',
  },
]

interface CertificationBadgesProps {
  variant?: 'full' | 'compact' | 'icons-only'
  showTooltips?: boolean
  className?: string
  filter?: string[]
  animated?: boolean
  columns?: 2 | 3 | 4
}

export function CertificationBadges({
  variant = 'full',
  showTooltips = true,
  className,
  filter,
  animated = true,
  columns = 3,
}: CertificationBadgesProps) {
  const filteredCertifications = filter
    ? certifications.filter(c => filter.includes(c.id))
    : certifications

  const gridCols = {
    2: 'sm:grid-cols-2',
    3: 'sm:grid-cols-2 lg:grid-cols-3',
    4: 'sm:grid-cols-2 lg:grid-cols-4',
  }

  if (variant === 'icons-only') {
    return (
      <TooltipProvider>
        <div className={cn('flex flex-wrap gap-3', className)}>
          {filteredCertifications.map((cert, index) => {
            const Badge = (
              <div
                key={cert.id}
                className={cn(
                  'flex h-12 w-12 items-center justify-center rounded-full border-2 transition-transform hover:scale-110',
                  cert.bgColor,
                  cert.borderColor
                )}
              >
                <cert.icon className={cn('h-6 w-6', cert.color)} />
              </div>
            )

            if (!showTooltips) {
              return animated ? (
                <FadeIn key={cert.id} delay={index * 0.1}>
                  {Badge}
                </FadeIn>
              ) : (
                Badge
              )
            }

            return animated ? (
              <FadeIn key={cert.id} delay={index * 0.1}>
                <Tooltip>
                  <TooltipTrigger asChild>{Badge}</TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-xs">
                    <p className="font-semibold">{cert.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {cert.organization}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </FadeIn>
            ) : (
              <Tooltip key={cert.id}>
                <TooltipTrigger asChild>{Badge}</TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs">
                  <p className="font-semibold">{cert.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {cert.organization}
                  </p>
                </TooltipContent>
              </Tooltip>
            )
          })}
        </div>
      </TooltipProvider>
    )
  }

  if (variant === 'compact') {
    return (
      <TooltipProvider>
        <div className={cn('flex flex-wrap gap-2', className)}>
          {filteredCertifications.map((cert, index) => {
            const Badge = (
              <div
                key={cert.id}
                className={cn(
                  'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted/50',
                  cert.borderColor
                )}
              >
                <cert.icon className={cn('h-4 w-4', cert.color)} />
                <span>{cert.shortName}</span>
              </div>
            )

            if (!showTooltips) {
              return animated ? (
                <FadeIn key={cert.id} delay={index * 0.05}>
                  {Badge}
                </FadeIn>
              ) : (
                Badge
              )
            }

            return animated ? (
              <FadeIn key={cert.id} delay={index * 0.05}>
                <Tooltip>
                  <TooltipTrigger asChild>{Badge}</TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-xs">
                    <p className="font-semibold">{cert.name}</p>
                    <p className="mt-1 text-xs">{cert.description}</p>
                  </TooltipContent>
                </Tooltip>
              </FadeIn>
            ) : (
              <Tooltip key={cert.id}>
                <TooltipTrigger asChild>{Badge}</TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs">
                  <p className="font-semibold">{cert.name}</p>
                  <p className="mt-1 text-xs">{cert.description}</p>
                </TooltipContent>
              </Tooltip>
            )
          })}
        </div>
      </TooltipProvider>
    )
  }

  // Full variant with cards
  return (
    <div className={cn('grid gap-4', gridCols[columns], className)}>
      {filteredCertifications.map((cert, index) => {
        const Card = (
          <div
            key={cert.id}
            className={cn(
              'group relative overflow-hidden rounded-xl border-2 p-5 transition-all hover:shadow-md',
              cert.borderColor,
              'hover:border-primary/30'
            )}
          >
            <div
              className={cn(
                'absolute right-0 top-0 h-24 w-24 -translate-y-8 translate-x-8 rounded-full opacity-20 transition-transform group-hover:scale-150',
                cert.bgColor
              )}
            />
            <div className="relative">
              <div
                className={cn(
                  'flex h-12 w-12 items-center justify-center rounded-lg',
                  cert.bgColor
                )}
              >
                <cert.icon className={cn('h-6 w-6', cert.color)} />
              </div>
              <h3 className="mt-4 font-serif text-lg font-semibold">
                {cert.name}
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">
                {cert.organization}
              </p>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                {cert.description}
              </p>
            </div>
          </div>
        )

        return animated ? (
          <FadeIn key={cert.id} delay={index * 0.1}>
            {Card}
          </FadeIn>
        ) : (
          Card
        )
      })}
    </div>
  )
}

// Export individual badge for use in specific contexts
export function CertificationBadge({
  certificationId,
  variant = 'compact',
}: {
  certificationId: string
  variant?: 'compact' | 'full'
}) {
  const cert = certifications.find(c => c.id === certificationId)
  if (!cert) return null

  if (variant === 'compact') {
    return (
      <div
        className={cn(
          'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium',
          cert.borderColor
        )}
      >
        <cert.icon className={cn('h-4 w-4', cert.color)} />
        <span>{cert.shortName}</span>
      </div>
    )
  }

  return (
    <div className={cn('rounded-xl border-2 p-5', cert.borderColor)}>
      <div
        className={cn(
          'flex h-12 w-12 items-center justify-center rounded-lg',
          cert.bgColor
        )}
      >
        <cert.icon className={cn('h-6 w-6', cert.color)} />
      </div>
      <h3 className="mt-4 font-serif text-lg font-semibold">{cert.name}</h3>
      <p className="mt-1 text-xs text-muted-foreground">{cert.organization}</p>
      <p className="mt-3 text-sm text-muted-foreground">{cert.description}</p>
    </div>
  )
}

// Featured certifications highlight component
export function FeaturedCertifications({ className }: { className?: string }) {
  const featured = [
    'dona-birth',
    'dona-postpartum',
    'lactation',
    'cpst',
    'infant-massage',
  ]

  return (
    <div className={cn('rounded-xl bg-card border p-6', className)}>
      <div className="flex items-center gap-2 mb-4">
        <Award className="h-5 w-5 text-primary" />
        <h3 className="font-serif text-lg font-semibold">
          Certifications & Training
        </h3>
      </div>
      <CertificationBadges
        variant="compact"
        filter={featured}
        animated={false}
        showTooltips={true}
      />
    </div>
  )
}

// Export certifications data for use elsewhere
export { certifications }
export type { Certification }
