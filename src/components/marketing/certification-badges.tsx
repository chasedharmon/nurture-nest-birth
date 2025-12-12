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

/**
 * Certification Badge Component
 *
 * Redesigned to use cohesive brand colors:
 * - Core certifications (DONA): Primary olive tones
 * - Specialized services: Secondary terracotta tones
 * - Education/Training: Neutral muted tones
 *
 * This creates visual cohesion while still differentiating credential types.
 */

interface Certification {
  id: string
  name: string
  shortName: string
  organization: string
  description: string
  icon: LucideIcon
  group: 'core' | 'specialized' | 'education'
}

const certifications: Certification[] = [
  {
    id: 'birth-doula',
    name: 'Professionally Trained Birth Doula',
    shortName: 'Birth Doula',
    organization: 'Professional Doula Training',
    description:
      'Professionally trained birth doula with extensive education in labor support, comfort measures, and advocacy. Comprehensive training in evidence-based birth support techniques.',
    icon: Heart,
    group: 'core',
  },
  {
    id: 'postpartum-doula',
    name: 'Professionally Trained Postpartum Doula',
    shortName: 'Postpartum Doula',
    organization: 'Professional Doula Training',
    description:
      'Trained to provide evidence-based postpartum support including newborn care, feeding assistance, family adjustment, and recovery support during the fourth trimester.',
    icon: Baby,
    group: 'core',
  },
  {
    id: 'breastfeeding',
    name: 'Certified Breastfeeding Specialist',
    shortName: 'Breastfeeding',
    organization: 'Lactation Education Resources',
    description:
      'Trained to provide evidence-based infant feeding support, including latch assessment, supply management, and troubleshooting common breastfeeding challenges. For complex issues, referral to certified IBCLC provided.',
    icon: HandHeart,
    group: 'specialized',
  },
  {
    id: 'cpst',
    name: 'Child Passenger Safety Technician',
    shortName: 'CPST',
    organization: 'Safe Kids Worldwide',
    description:
      'Nationally certified to properly install car seats and educate families on child passenger safety. Studies show 73% of car seats are installed incorrectly—a CPST ensures your child travels safely.',
    icon: Shield,
    group: 'education',
  },
  {
    id: 'infant-massage',
    name: 'Certified Infant Massage Instructor',
    shortName: 'Infant Massage',
    organization: 'Infant Massage USA',
    description:
      'Trained to teach parents therapeutic massage techniques that promote bonding, improve sleep, relieve colic and gas, and support healthy infant development.',
    icon: Baby,
    group: 'specialized',
  },
  {
    id: 'family-studies',
    name: 'Family Studies Degree',
    shortName: 'Family Studies',
    organization: 'University of Nebraska',
    description:
      'Academic foundation in child development, family dynamics, and human services that informs a holistic approach to supporting families through major life transitions.',
    icon: GraduationCap,
    group: 'education',
  },
  {
    id: 'home-visitation',
    name: 'Home Visitation Specialist',
    shortName: 'Home Visitor',
    organization: 'Nebraska Early Childhood',
    description:
      'Specialized training in providing support to families in their home environment, understanding family dynamics, and connecting families with community resources.',
    icon: Home,
    group: 'education',
  },
]

/**
 * Get cohesive styling based on credential group
 * Uses brand palette instead of rainbow colors
 */
function getGroupStyle(group: Certification['group']) {
  switch (group) {
    case 'core':
      // Primary olive tones - for main doula certifications
      return {
        icon: 'text-primary',
        bg: 'bg-primary/10',
        border: 'border-primary/20',
        hoverBorder: 'hover:border-primary/40',
      }
    case 'specialized':
      // Secondary terracotta tones - for specialized services
      return {
        icon: 'text-secondary',
        bg: 'bg-secondary/10',
        border: 'border-secondary/20',
        hoverBorder: 'hover:border-secondary/40',
      }
    case 'education':
    default:
      // Neutral tones - for academic/training credentials
      return {
        icon: 'text-muted-foreground',
        bg: 'bg-muted',
        border: 'border-border',
        hoverBorder: 'hover:border-muted-foreground/30',
      }
  }
}

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

  // Icons-only variant (for homepage banner)
  if (variant === 'icons-only') {
    return (
      <TooltipProvider delayDuration={100}>
        <div className={cn('flex flex-wrap justify-center gap-3', className)}>
          {filteredCertifications.map((cert, index) => {
            const style = getGroupStyle(cert.group)

            const Badge = (
              <div
                className={cn(
                  'flex h-12 w-12 items-center justify-center rounded-full border-2 transition-all duration-300',
                  style.bg,
                  style.border,
                  style.hoverBorder,
                  'hover:scale-110'
                )}
              >
                <cert.icon className={cn('h-5 w-5', style.icon)} />
              </div>
            )

            const content = showTooltips ? (
              <Tooltip key={cert.id}>
                <TooltipTrigger asChild>{Badge}</TooltipTrigger>
                <TooltipContent
                  side="bottom"
                  className="max-w-xs border border-border bg-card text-card-foreground shadow-lg"
                >
                  <p className="font-semibold text-foreground">{cert.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {cert.organization}
                  </p>
                </TooltipContent>
              </Tooltip>
            ) : (
              Badge
            )

            return animated ? (
              <FadeIn key={cert.id} delay={index * 0.1}>
                {content}
              </FadeIn>
            ) : (
              <div key={cert.id}>{content}</div>
            )
          })}
        </div>
      </TooltipProvider>
    )
  }

  // Compact variant (pill badges)
  if (variant === 'compact') {
    return (
      <TooltipProvider delayDuration={100}>
        <div className={cn('flex flex-wrap gap-2', className)}>
          {filteredCertifications.map((cert, index) => {
            const style = getGroupStyle(cert.group)

            const Badge = (
              <div
                className={cn(
                  'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium transition-all duration-300',
                  style.border,
                  style.hoverBorder,
                  'hover:bg-muted/50'
                )}
              >
                <cert.icon className={cn('h-4 w-4', style.icon)} />
                <span className="text-foreground">{cert.shortName}</span>
              </div>
            )

            const content = showTooltips ? (
              <Tooltip key={cert.id}>
                <TooltipTrigger asChild>{Badge}</TooltipTrigger>
                <TooltipContent
                  side="bottom"
                  className="max-w-xs border border-border bg-card text-card-foreground shadow-lg"
                >
                  <p className="font-semibold text-foreground">{cert.name}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {cert.description}
                  </p>
                </TooltipContent>
              </Tooltip>
            ) : (
              Badge
            )

            return animated ? (
              <FadeIn key={cert.id} delay={index * 0.05}>
                {content}
              </FadeIn>
            ) : (
              <div key={cert.id}>{content}</div>
            )
          })}
        </div>
      </TooltipProvider>
    )
  }

  // Full variant (cards)
  return (
    <div className={cn('grid gap-4', gridCols[columns], className)}>
      {filteredCertifications.map((cert, index) => {
        const style = getGroupStyle(cert.group)

        const Card = (
          <div
            className={cn(
              'group relative overflow-hidden rounded-xl border-2 bg-card p-5 transition-all duration-300',
              style.border,
              style.hoverBorder,
              'hover:shadow-lg hover:shadow-primary/5'
            )}
          >
            {/* Subtle background accent */}
            <div
              className={cn(
                'absolute -right-8 -top-8 h-24 w-24 rounded-full opacity-50 transition-transform duration-500 group-hover:scale-150',
                style.bg
              )}
            />

            <div className="relative">
              <div
                className={cn(
                  'flex h-12 w-12 items-center justify-center rounded-xl',
                  style.bg
                )}
              >
                <cert.icon className={cn('h-6 w-6', style.icon)} />
              </div>
              <h3 className="mt-4 font-serif text-lg font-semibold text-foreground">
                {cert.name}
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">
                {cert.organization}
              </p>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
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
          <div key={cert.id}>{Card}</div>
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

  const style = getGroupStyle(cert.group)

  if (variant === 'compact') {
    return (
      <div
        className={cn(
          'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium',
          style.border
        )}
      >
        <cert.icon className={cn('h-4 w-4', style.icon)} />
        <span className="text-foreground">{cert.shortName}</span>
      </div>
    )
  }

  return (
    <div className={cn('rounded-xl border-2 bg-card p-5', style.border)}>
      <div
        className={cn(
          'flex h-12 w-12 items-center justify-center rounded-xl',
          style.bg
        )}
      >
        <cert.icon className={cn('h-6 w-6', style.icon)} />
      </div>
      <h3 className="mt-4 font-serif text-lg font-semibold text-foreground">
        {cert.name}
      </h3>
      <p className="mt-1 text-xs text-muted-foreground">{cert.organization}</p>
      <p className="mt-3 text-sm text-muted-foreground">{cert.description}</p>
    </div>
  )
}

// Featured certifications highlight component
export function FeaturedCertifications({ className }: { className?: string }) {
  const featured = [
    'birth-doula',
    'postpartum-doula',
    'breastfeeding',
    'cpst',
    'infant-massage',
  ]

  return (
    <div className={cn('rounded-xl border bg-card p-6', className)}>
      <div className="mb-4 flex items-center gap-2">
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
