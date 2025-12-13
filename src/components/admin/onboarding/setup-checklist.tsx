'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Building2,
  Briefcase,
  Mail,
  Workflow,
  Users,
  Check,
  ChevronRight,
  X,
  Sparkles,
} from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import { dismissOnboarding } from '@/app/actions/onboarding'

export interface OnboardingStep {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  href: string
  completed: boolean
  optional?: boolean
}

export interface OnboardingCompletionStatus {
  hasCompanyProfile: boolean
  hasService: boolean
  hasEmailTemplate: boolean
  hasWorkflow: boolean
  hasTeamMember: boolean
}

interface SetupChecklistProps {
  completionStatus: OnboardingCompletionStatus
  onDismiss?: () => void
  className?: string
}

// Generate steps with icons inside the client component
function generateSteps(
  completionStatus: OnboardingCompletionStatus
): OnboardingStep[] {
  return [
    {
      id: 'company-profile',
      title: 'Complete your company profile',
      description: 'Add your business name, logo, and contact details',
      icon: <Building2 className="h-5 w-5" />,
      href: '/admin/setup/organization',
      completed: completionStatus.hasCompanyProfile,
    },
    {
      id: 'service-package',
      title: 'Add your first service package',
      description: 'Define the services you offer to clients',
      icon: <Briefcase className="h-5 w-5" />,
      href: '/admin/setup/services',
      completed: completionStatus.hasService,
    },
    {
      id: 'email-template',
      title: 'Customize an email template',
      description: 'Personalize your automated communications',
      icon: <Mail className="h-5 w-5" />,
      href: '/admin/setup/email-templates',
      completed: completionStatus.hasEmailTemplate,
    },
    {
      id: 'workflow',
      title: 'Create your first workflow',
      description: 'Automate follow-ups and client communications',
      icon: <Workflow className="h-5 w-5" />,
      href: '/admin/workflows',
      completed: completionStatus.hasWorkflow,
    },
    {
      id: 'team-member',
      title: 'Invite a team member',
      description: 'Add colleagues to collaborate with you',
      icon: <Users className="h-5 w-5" />,
      href: '/admin/setup/users',
      completed: completionStatus.hasTeamMember,
      optional: true,
    },
  ]
}

export function SetupChecklist({
  completionStatus,
  onDismiss,
  className,
}: SetupChecklistProps) {
  const router = useRouter()
  const [isDismissing, setIsDismissing] = useState(false)
  const [localSteps] = useState(() => generateSteps(completionStatus))

  const completedSteps = localSteps.filter(s => s.completed).length
  const requiredSteps = localSteps.filter(s => !s.optional)
  const completedRequiredSteps = requiredSteps.filter(s => s.completed).length
  const progress = (completedSteps / localSteps.length) * 100
  const allRequiredComplete = completedRequiredSteps === requiredSteps.length

  const handleDismiss = async () => {
    setIsDismissing(true)
    try {
      await dismissOnboarding()
      onDismiss?.()
      router.refresh()
    } catch (error) {
      console.error('Failed to dismiss onboarding:', error)
    } finally {
      setIsDismissing(false)
    }
  }

  const handleStepClick = async (step: OnboardingStep) => {
    if (!step.completed) {
      // Mark as in progress or navigate
      router.push(step.href)
    }
  }

  return (
    <Card className={cn('relative overflow-hidden', className)}>
      {/* Gradient accent */}
      <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-primary via-primary/80 to-primary/60" />

      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Get Started</CardTitle>
              <CardDescription>
                Complete these steps to set up your practice
              </CardDescription>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={handleDismiss}
            disabled={isDismissing}
            title="Dismiss setup guide"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Progress bar */}
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {completedSteps} of {localSteps.length} complete
            </span>
            <span className="font-medium text-primary">
              {Math.round(progress)}%
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </CardHeader>

      <CardContent className="pb-6">
        <div className="space-y-2">
          {localSteps.map((step, index) => (
            <button
              key={step.id}
              onClick={() => handleStepClick(step)}
              className={cn(
                'group flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-all',
                step.completed
                  ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20'
                  : 'border-border hover:border-primary/50 hover:bg-accent'
              )}
            >
              {/* Step indicator */}
              <div
                className={cn(
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-medium transition-colors',
                  step.completed
                    ? 'bg-green-500 text-white'
                    : 'bg-muted text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground'
                )}
              >
                {step.completed ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <span>{index + 1}</span>
                )}
              </div>

              {/* Icon */}
              <div
                className={cn(
                  'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
                  step.completed
                    ? 'bg-green-100 text-green-600 dark:bg-green-800 dark:text-green-300'
                    : 'bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary'
                )}
              >
                {step.icon}
              </div>

              {/* Content */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      'font-medium',
                      step.completed
                        ? 'text-green-700 dark:text-green-300'
                        : 'text-foreground'
                    )}
                  >
                    {step.title}
                  </span>
                  {step.optional && (
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                      Optional
                    </span>
                  )}
                </div>
                <p
                  className={cn(
                    'truncate text-sm',
                    step.completed
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-muted-foreground'
                  )}
                >
                  {step.description}
                </p>
              </div>

              {/* Arrow */}
              {!step.completed && (
                <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
              )}
            </button>
          ))}
        </div>

        {/* Completion message */}
        {allRequiredComplete && (
          <div className="mt-4 rounded-lg bg-green-50 p-4 dark:bg-green-900/20">
            <div className="flex items-center gap-2">
              <Check className="h-5 w-5 text-green-600" />
              <span className="font-medium text-green-700 dark:text-green-300">
                You&apos;re all set!
              </span>
            </div>
            <p className="mt-1 text-sm text-green-600 dark:text-green-400">
              You&apos;ve completed the essential setup. Feel free to explore
              more features or{' '}
              <button
                onClick={handleDismiss}
                className="font-medium underline underline-offset-2 hover:no-underline"
              >
                dismiss this guide
              </button>
              .
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
