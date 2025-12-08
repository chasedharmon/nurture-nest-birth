'use client'

import { Check, Circle, Baby, Heart, Sun, Home } from 'lucide-react'
import type { JourneyPhase, ClientJourneyMilestone } from '@/lib/supabase/types'
import { cn } from '@/lib/utils'

interface JourneyTimelineProps {
  currentPhase: JourneyPhase
  milestones: ClientJourneyMilestone[]
  className?: string
}

const PHASE_CONFIG: Record<
  JourneyPhase,
  { label: string; icon: React.ElementType; description: string }
> = {
  consultation: {
    label: 'Consultation',
    icon: Heart,
    description: 'Getting to know each other',
  },
  prenatal: {
    label: 'Prenatal',
    icon: Sun,
    description: 'Preparing for your journey',
  },
  birth: {
    label: 'Birth',
    icon: Baby,
    description: 'The big day',
  },
  postpartum: {
    label: 'Postpartum',
    icon: Home,
    description: 'Supporting your new family',
  },
}

const PHASE_ORDER: JourneyPhase[] = [
  'consultation',
  'prenatal',
  'birth',
  'postpartum',
]

export function JourneyTimeline({
  currentPhase,
  milestones,
  className,
}: JourneyTimelineProps) {
  const currentPhaseIndex = PHASE_ORDER.indexOf(currentPhase)
  const progressPercent = ((currentPhaseIndex + 0.5) / PHASE_ORDER.length) * 100

  // Group milestones by phase
  const milestonesByPhase = milestones.reduce(
    (acc, milestone) => {
      const phase = milestone.phase as JourneyPhase
      if (!acc[phase]) acc[phase] = []
      acc[phase].push(milestone)
      return acc
    },
    {} as Record<JourneyPhase, ClientJourneyMilestone[]>
  )

  return (
    <div
      className={cn('w-full', className)}
      role="navigation"
      aria-label="Journey progress timeline"
    >
      {/* Screen reader summary */}
      <div className="sr-only">
        Your journey is currently in the {PHASE_CONFIG[currentPhase].label}{' '}
        phase. You are {Math.round(progressPercent)}% through your journey.
      </div>

      {/* Desktop: Horizontal Timeline */}
      <div className="hidden md:block">
        <div className="relative">
          {/* Progress bar background */}
          <div
            className="absolute left-0 right-0 top-6 h-1 bg-muted"
            role="progressbar"
            aria-valuenow={Math.round(progressPercent)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Journey progress"
          />

          {/* Progress bar fill */}
          <div
            className="absolute left-0 top-6 h-1 bg-primary transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />

          {/* Phase nodes */}
          <div className="relative flex justify-between">
            {PHASE_ORDER.map((phase, index) => {
              const config = PHASE_CONFIG[phase]
              const Icon = config.icon
              const isCompleted = index < currentPhaseIndex
              const isCurrent = index === currentPhaseIndex
              const isFuture = index > currentPhaseIndex
              const phaseMilestones = milestonesByPhase[phase] || []
              const completedMilestones = phaseMilestones.filter(
                m => m.completed_at
              ).length

              return (
                <div
                  key={phase}
                  className="flex flex-col items-center"
                  style={{ width: `${100 / PHASE_ORDER.length}%` }}
                >
                  {/* Node */}
                  <div
                    className={cn(
                      'relative z-10 flex h-12 w-12 items-center justify-center rounded-full border-2 transition-all duration-300',
                      isCompleted &&
                        'border-primary bg-primary text-primary-foreground',
                      isCurrent &&
                        'border-primary bg-primary/10 text-primary ring-4 ring-primary/20',
                      isFuture &&
                        'border-muted bg-background text-muted-foreground'
                    )}
                  >
                    {isCompleted ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      <Icon className="h-5 w-5" />
                    )}
                  </div>

                  {/* Label */}
                  <div className="mt-3 text-center">
                    <p
                      className={cn(
                        'font-medium',
                        isCurrent && 'text-primary',
                        isFuture && 'text-muted-foreground'
                      )}
                    >
                      {config.label}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {config.description}
                    </p>
                    {phaseMilestones.length > 0 && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {completedMilestones}/{phaseMilestones.length}{' '}
                        milestones
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Mobile: Vertical Timeline */}
      <div className="md:hidden">
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-muted" />

          {/* Progress fill */}
          <div
            className="absolute left-6 top-0 w-0.5 bg-primary transition-all duration-500"
            style={{ height: `${progressPercent}%` }}
          />

          {/* Phase nodes */}
          <div className="space-y-8">
            {PHASE_ORDER.map((phase, index) => {
              const config = PHASE_CONFIG[phase]
              const Icon = config.icon
              const isCompleted = index < currentPhaseIndex
              const isCurrent = index === currentPhaseIndex
              const isFuture = index > currentPhaseIndex
              const phaseMilestones = milestonesByPhase[phase] || []
              const completedMilestones = phaseMilestones.filter(
                m => m.completed_at
              ).length

              return (
                <div key={phase} className="relative flex items-start gap-4">
                  {/* Node */}
                  <div
                    className={cn(
                      'relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-300',
                      isCompleted &&
                        'border-primary bg-primary text-primary-foreground',
                      isCurrent &&
                        'border-primary bg-primary/10 text-primary ring-4 ring-primary/20',
                      isFuture &&
                        'border-muted bg-background text-muted-foreground'
                    )}
                  >
                    {isCompleted ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      <Icon className="h-5 w-5" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 pt-1">
                    <p
                      className={cn(
                        'font-medium',
                        isCurrent && 'text-primary',
                        isFuture && 'text-muted-foreground'
                      )}
                    >
                      {config.label}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {config.description}
                    </p>

                    {/* Milestones */}
                    {isCurrent && phaseMilestones.length > 0 && (
                      <div className="mt-3 space-y-1.5">
                        {phaseMilestones.map(milestone => (
                          <div
                            key={milestone.id}
                            className="flex items-center gap-2 text-sm"
                          >
                            {milestone.completed_at ? (
                              <Check className="h-3.5 w-3.5 text-primary" />
                            ) : (
                              <Circle className="h-3.5 w-3.5 text-muted-foreground" />
                            )}
                            <span
                              className={cn(
                                milestone.completed_at
                                  ? 'text-muted-foreground line-through'
                                  : 'text-foreground'
                              )}
                            >
                              {milestone.milestone_label}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {!isCurrent && phaseMilestones.length > 0 && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {completedMilestones}/{phaseMilestones.length}{' '}
                        milestones
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
