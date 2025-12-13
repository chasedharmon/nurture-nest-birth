'use client'

import { useState, useEffect, useRef } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  MessageSquare,
  FileText,
  User,
  Calendar,
  CreditCard,
  ArrowRight,
  X,
  Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

interface TourStep {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  targetPath: string
  highlight?: string // CSS selector to highlight
}

const TOUR_STEPS: TourStep[] = [
  {
    id: 'dashboard',
    title: 'Welcome to Your Dashboard',
    description:
      'This is your home base. See your upcoming appointments, action items, and track your journey all in one place.',
    icon: <LayoutDashboard className="h-6 w-6" />,
    targetPath: '/client/dashboard',
  },
  {
    id: 'messages',
    title: 'Stay Connected',
    description:
      'Send and receive messages with your doula team. We are here to support you every step of the way.',
    icon: <MessageSquare className="h-6 w-6" />,
    targetPath: '/client/messages',
  },
  {
    id: 'documents',
    title: 'Your Documents',
    description:
      'Access contracts, resources, and important files. Everything is securely stored and easy to find.',
    icon: <FileText className="h-6 w-6" />,
    targetPath: '/client/documents',
  },
  {
    id: 'meetings',
    title: 'Appointments',
    description:
      'View and manage your scheduled appointments. Get reminders and meeting details all in one place.',
    icon: <Calendar className="h-6 w-6" />,
    targetPath: '/client/meetings',
  },
  {
    id: 'payments',
    title: 'Payments & Invoices',
    description:
      'View your payment history and any outstanding invoices. Pay securely online anytime.',
    icon: <CreditCard className="h-6 w-6" />,
    targetPath: '/client/payments',
  },
  {
    id: 'profile',
    title: 'Your Profile',
    description:
      'Keep your contact information and preferences up to date. We want to provide the best care for you.',
    icon: <User className="h-6 w-6" />,
    targetPath: '/client/profile',
  },
]

const TOUR_STORAGE_KEY = 'client-onboarding-tour-completed'

interface OnboardingTourProps {
  forceShow?: boolean
  onComplete?: () => void
}

export function OnboardingTour({
  forceShow = false,
  onComplete,
}: OnboardingTourProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(forceShow)
  const [currentStep, setCurrentStep] = useState(0)
  const hasInitialized = useRef(false)

  // Check if tour has been completed - only run once on mount
  useEffect(() => {
    if (hasInitialized.current) return undefined

    hasInitialized.current = true
    const completed = localStorage.getItem(TOUR_STORAGE_KEY)

    // Show tour on first visit to dashboard
    if (!completed && pathname === '/client/dashboard' && !forceShow) {
      // Small delay to let the page render
      const timer = setTimeout(() => {
        setIsOpen(true)
      }, 500)
      return () => clearTimeout(timer)
    }

    return undefined
  }, [pathname, forceShow])

  const handleNext = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      handleComplete()
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleComplete = () => {
    localStorage.setItem(TOUR_STORAGE_KEY, 'true')
    setIsOpen(false)
    onComplete?.()
  }

  const handleSkip = () => {
    localStorage.setItem(TOUR_STORAGE_KEY, 'true')
    setIsOpen(false)
    onComplete?.()
  }

  const handleGoToStep = (stepToGo: TourStep) => {
    router.push(stepToGo.targetPath)
    handleNext()
  }

  // Suppress unused variable warning - handleGoToStep available for future use
  void handleGoToStep

  const step = TOUR_STEPS[currentStep]
  const progress = ((currentStep + 1) / TOUR_STEPS.length) * 100
  const isLastStep = currentStep === TOUR_STEPS.length - 1

  if (!step) {
    return null
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-primary/10 p-2">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <span className="text-xs text-muted-foreground">
                Step {currentStep + 1} of {TOUR_STEPS.length}
              </span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleSkip}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Progress bar */}
          <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </DialogHeader>

        <div className="py-6">
          {/* Step icon */}
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-primary/10 p-4 text-primary">
              {step.icon}
            </div>
          </div>

          {/* Step content */}
          <DialogTitle className="text-center text-xl mb-2">
            {step.title}
          </DialogTitle>
          <DialogDescription className="text-center">
            {step.description}
          </DialogDescription>
        </div>

        {/* Navigation dots */}
        <div className="flex justify-center gap-2 py-2">
          {TOUR_STEPS.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentStep(index)}
              className={cn(
                'h-2 w-2 rounded-full transition-all',
                index === currentStep
                  ? 'bg-primary w-4'
                  : 'bg-muted hover:bg-muted-foreground/30'
              )}
              aria-label={`Go to step ${index + 1}`}
            />
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t">
          <Button
            variant="ghost"
            onClick={handleSkip}
            className="text-muted-foreground"
          >
            Skip tour
          </Button>

          <div className="flex items-center gap-2">
            {currentStep > 0 && (
              <Button variant="outline" onClick={handlePrevious}>
                Previous
              </Button>
            )}
            <Button onClick={handleNext}>
              {isLastStep ? (
                'Get Started'
              ) : (
                <>
                  Next
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

/**
 * Hook to reset the onboarding tour (useful for testing)
 */
export function useResetOnboardingTour() {
  return {
    reset: () => localStorage.removeItem(TOUR_STORAGE_KEY),
    isCompleted: () => localStorage.getItem(TOUR_STORAGE_KEY) === 'true',
  }
}
