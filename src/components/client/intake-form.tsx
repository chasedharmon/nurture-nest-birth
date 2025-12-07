'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useForm } from 'react-hook-form'
import {
  ChevronLeft,
  ChevronRight,
  Check,
  Sparkles,
  Heart,
  Baby,
  Stethoscope,
  Star,
  Users,
  Phone,
  MessageCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { submitIntakeForm, saveIntakeDraft } from '@/app/actions/intake-forms'
import { useRouter } from 'next/navigation'

// Types
interface IntakeFormData {
  // Personal
  preferred_name: string
  pronouns: string
  birth_date: string
  partner_name: string
  partner_phone: string
  // Pregnancy
  due_date: string
  first_pregnancy: string
  previous_births: string
  multiples: string
  // Medical
  provider_name: string
  provider_practice: string
  birth_location: string
  hospital_name: string
  high_risk: string
  high_risk_details: string
  health_conditions: string
  // Preferences
  pain_management: string[]
  important_aspects: string
  concerns: string
  support_style: string
  // Postpartum
  feeding_plan: string[]
  lactation_support: string
  postpartum_support: string
  other_children: string
  // Emergency
  emergency_name: string
  emergency_phone: string
  emergency_relationship: string
  // Additional
  how_found: string
  questions: string
}

interface IntakeFormProps {
  templateId: string
  initialData?: Partial<IntakeFormData>
  draftId?: string
}

const sections = [
  {
    id: 'welcome',
    title: 'Welcome',
    subtitle: "Let's get to know you",
    icon: Sparkles,
  },
  {
    id: 'personal',
    title: 'About You',
    subtitle: 'Personal details',
    icon: Heart,
  },
  {
    id: 'pregnancy',
    title: 'Your Pregnancy',
    subtitle: 'Pregnancy information',
    icon: Baby,
  },
  {
    id: 'medical',
    title: 'Medical Care',
    subtitle: 'Healthcare providers',
    icon: Stethoscope,
  },
  {
    id: 'preferences',
    title: 'Birth Wishes',
    subtitle: 'Your preferences',
    icon: Star,
  },
  {
    id: 'postpartum',
    title: 'After Birth',
    subtitle: 'Postpartum planning',
    icon: Users,
  },
  {
    id: 'emergency',
    title: 'Emergency Contact',
    subtitle: 'Important contact',
    icon: Phone,
  },
  {
    id: 'complete',
    title: 'Almost Done',
    subtitle: 'Final thoughts',
    icon: MessageCircle,
  },
]

export function IntakeForm({
  templateId,
  initialData,
  draftId,
}: IntakeFormProps) {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentDraftId, setCurrentDraftId] = useState(draftId)

  const form = useForm<IntakeFormData>({
    defaultValues: {
      preferred_name: '',
      pronouns: '',
      birth_date: '',
      partner_name: '',
      partner_phone: '',
      due_date: '',
      first_pregnancy: '',
      previous_births: '',
      multiples: 'No',
      provider_name: '',
      provider_practice: '',
      birth_location: '',
      hospital_name: '',
      high_risk: 'No',
      high_risk_details: '',
      health_conditions: '',
      pain_management: [],
      important_aspects: '',
      concerns: '',
      support_style: '',
      feeding_plan: [],
      lactation_support: '',
      postpartum_support: '',
      other_children: '',
      emergency_name: '',
      emergency_phone: '',
      emergency_relationship: '',
      how_found: '',
      questions: '',
      ...initialData,
    },
  })

  const { watch, setValue, getValues } = form
  const watchFirstPregnancy = watch('first_pregnancy')
  const watchHighRisk = watch('high_risk')

  // Auto-save draft every 30 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      const data = getValues() as unknown as Record<string, unknown>
      const result = await saveIntakeDraft(templateId, data, currentDraftId)
      if (result.success && result.draftId) {
        setCurrentDraftId(result.draftId)
      }
    }, 30000)

    return () => clearInterval(interval)
  }, [templateId, currentDraftId, getValues])

  const handleNext = async () => {
    if (currentStep < sections.length - 1) {
      setCurrentStep(prev => prev + 1)
      // Save draft on step change
      const data = getValues() as unknown as Record<string, unknown>
      const result = await saveIntakeDraft(templateId, data, currentDraftId)
      if (result.success && result.draftId) {
        setCurrentDraftId(result.draftId)
      }
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1)
    }
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      const data = getValues() as unknown as Record<string, unknown>
      const result = await submitIntakeForm(templateId, data)
      if (result.success) {
        router.push('/client/dashboard?intake=success')
      }
    } catch (error) {
      console.error('Failed to submit:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const toggleArrayValue = (field: keyof IntakeFormData, value: string) => {
    const current = (getValues(field) as string[]) || []
    if (current.includes(value)) {
      setValue(field, current.filter(v => v !== value) as never)
    } else {
      setValue(field, [...current, value] as never)
    }
  }

  const progress = ((currentStep + 1) / sections.length) * 100

  return (
    <div className="min-h-screen bg-[#faf8f5] relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-[#e8ddd4]/40 blur-3xl" />
        <div className="absolute top-1/2 -left-20 w-72 h-72 rounded-full bg-[#d4c4b5]/30 blur-3xl" />
        <div className="absolute bottom-20 right-1/4 w-64 h-64 rounded-full bg-[#f0e6dc]/50 blur-3xl" />
        {/* Subtle grain texture overlay */}
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          }}
        />
      </div>

      <div className="relative max-w-2xl mx-auto px-4 py-8 sm:py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1
            className="text-3xl sm:text-4xl font-light text-[#5c4a3d] tracking-tight"
            style={{ fontFamily: 'Georgia, serif' }}
          >
            Client Intake Form
          </h1>
          <p className="text-[#8b7355] mt-2 text-sm sm:text-base">
            Take your time — your responses help us support you better
          </p>
        </motion.div>

        {/* Progress indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            {sections.map((section, index) => {
              const Icon = section.icon
              const isActive = index === currentStep
              const isComplete = index < currentStep

              return (
                <motion.button
                  key={section.id}
                  onClick={() => index <= currentStep && setCurrentStep(index)}
                  disabled={index > currentStep}
                  className={`
                    relative flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-full
                    transition-all duration-300
                    ${isActive ? 'bg-[#8b7355] text-white shadow-lg scale-110' : ''}
                    ${isComplete ? 'bg-[#c4b5a5] text-white' : ''}
                    ${!isActive && !isComplete ? 'bg-[#e8ddd4] text-[#a89a8a]' : ''}
                    ${index <= currentStep ? 'cursor-pointer hover:scale-105' : 'cursor-not-allowed'}
                  `}
                  whileHover={index <= currentStep ? { scale: 1.1 } : {}}
                  whileTap={index <= currentStep ? { scale: 0.95 } : {}}
                >
                  {isComplete ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Icon className="w-4 h-4" />
                  )}
                  {isActive && (
                    <motion.div
                      layoutId="activeIndicator"
                      className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] sm:text-xs text-[#8b7355] whitespace-nowrap font-medium"
                    >
                      {section.title}
                    </motion.div>
                  )}
                </motion.button>
              )
            })}
          </div>
          {/* Progress bar */}
          <div className="h-1 bg-[#e8ddd4] rounded-full overflow-hidden mt-8">
            <motion.div
              className="h-full bg-gradient-to-r from-[#c4b5a5] to-[#8b7355] rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>
        </div>

        {/* Form card */}
        <motion.div
          className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl shadow-[#d4c4b5]/20 border border-[#e8ddd4]/50 overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="p-6 sm:p-8"
            >
              {/* Welcome Step */}
              {currentStep === 0 && <WelcomeStep onContinue={handleNext} />}

              {/* Personal Step */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <SectionHeader
                    title="About You"
                    description="Let's start with some basic information"
                  />
                  <div className="grid gap-5">
                    <FormField
                      label="What name would you like us to call you?"
                      hint="Your preferred name or nickname"
                    >
                      <Input
                        {...form.register('preferred_name')}
                        placeholder="e.g., Sarah, Mama Bear, etc."
                        className="intake-input"
                      />
                    </FormField>

                    <FormField label="Your pronouns" optional>
                      <Input
                        {...form.register('pronouns')}
                        placeholder="e.g., she/her, they/them"
                        className="intake-input"
                      />
                    </FormField>

                    <FormField label="Your date of birth" optional>
                      <Input
                        type="date"
                        {...form.register('birth_date')}
                        className="intake-input"
                      />
                    </FormField>

                    <div className="pt-4 border-t border-[#e8ddd4]">
                      <p className="text-sm text-[#8b7355] mb-4 font-medium">
                        Partner/Support Person
                      </p>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <FormField label="Partner's name" optional>
                          <Input
                            {...form.register('partner_name')}
                            placeholder="Name"
                            className="intake-input"
                          />
                        </FormField>
                        <FormField label="Partner's phone" optional>
                          <Input
                            type="tel"
                            {...form.register('partner_phone')}
                            placeholder="(555) 123-4567"
                            className="intake-input"
                          />
                        </FormField>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Pregnancy Step */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <SectionHeader
                    title="Your Pregnancy"
                    description="Tell us about this exciting journey"
                  />
                  <div className="grid gap-5">
                    <FormField label="Estimated due date" required>
                      <Input
                        type="date"
                        {...form.register('due_date')}
                        className="intake-input"
                      />
                    </FormField>

                    <FormField label="Is this your first pregnancy?" required>
                      <OptionButtons
                        options={['Yes', 'No']}
                        value={watchFirstPregnancy}
                        onChange={val => setValue('first_pregnancy', val)}
                      />
                    </FormField>

                    {watchFirstPregnancy === 'No' && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                      >
                        <FormField
                          label="Tell us about your previous birth experiences"
                          hint="Whatever feels important to share"
                        >
                          <Textarea
                            {...form.register('previous_births')}
                            placeholder="Share as much or as little as you'd like..."
                            className="intake-input min-h-[100px]"
                          />
                        </FormField>
                      </motion.div>
                    )}

                    <FormField label="Are you expecting multiples?" required>
                      <OptionButtons
                        options={['No', 'Twins', 'Triplets or more']}
                        value={watch('multiples')}
                        onChange={val => setValue('multiples', val)}
                      />
                    </FormField>
                  </div>
                </div>
              )}

              {/* Medical Step */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <SectionHeader
                    title="Medical Care"
                    description="Information about your healthcare team"
                  />
                  <div className="grid gap-5">
                    <FormField label="OB/GYN or Midwife name" required>
                      <Input
                        {...form.register('provider_name')}
                        placeholder="Dr. Smith or Midwife Jane"
                        className="intake-input"
                      />
                    </FormField>

                    <FormField label="Practice/Clinic name" optional>
                      <Input
                        {...form.register('provider_practice')}
                        placeholder="Women's Health Associates"
                        className="intake-input"
                      />
                    </FormField>

                    <FormField
                      label="Where do you plan to give birth?"
                      required
                    >
                      <OptionButtons
                        options={[
                          'Hospital',
                          'Birth Center',
                          'Home',
                          'Undecided',
                        ]}
                        value={watch('birth_location')}
                        onChange={val => setValue('birth_location', val)}
                      />
                    </FormField>

                    <FormField label="Hospital/Birth Center name" optional>
                      <Input
                        {...form.register('hospital_name')}
                        placeholder="Good Samaritan Hospital"
                        className="intake-input"
                      />
                    </FormField>

                    <FormField
                      label="Has your pregnancy been classified as high-risk?"
                      required
                    >
                      <OptionButtons
                        options={['No', 'Yes']}
                        value={watchHighRisk}
                        onChange={val => setValue('high_risk', val)}
                      />
                    </FormField>

                    {watchHighRisk === 'Yes' && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                      >
                        <FormField label="Please share more details">
                          <Textarea
                            {...form.register('high_risk_details')}
                            placeholder="Any information that would help us better support you..."
                            className="intake-input min-h-[80px]"
                          />
                        </FormField>
                      </motion.div>
                    )}

                    <FormField
                      label="Any health conditions we should know about?"
                      optional
                    >
                      <Textarea
                        {...form.register('health_conditions')}
                        placeholder="Allergies, chronic conditions, medications, etc."
                        className="intake-input min-h-[80px]"
                      />
                    </FormField>
                  </div>
                </div>
              )}

              {/* Preferences Step */}
              {currentStep === 4 && (
                <div className="space-y-6">
                  <SectionHeader
                    title="Your Birth Wishes"
                    description="Help us understand what matters most to you"
                  />
                  <div className="grid gap-5">
                    <FormField
                      label="Pain management preferences"
                      hint="Select all that apply"
                    >
                      <MultiSelectButtons
                        options={[
                          'Natural/unmedicated',
                          'Open to epidural',
                          'Definitely want epidural',
                          'Undecided',
                        ]}
                        values={(watch('pain_management') as string[]) || []}
                        onChange={val =>
                          toggleArrayValue('pain_management', val)
                        }
                      />
                    </FormField>

                    <FormField label="What aspects of birth are most important to you?">
                      <Textarea
                        {...form.register('important_aspects')}
                        placeholder="e.g., feeling in control, having a calm environment, being able to move freely..."
                        className="intake-input min-h-[100px]"
                      />
                    </FormField>

                    <FormField label="What are your biggest concerns or fears about birth?">
                      <Textarea
                        {...form.register('concerns')}
                        placeholder="It's okay to share your worries — we're here to support you..."
                        className="intake-input min-h-[100px]"
                      />
                    </FormField>

                    <FormField label="How do you like to be supported during stressful situations?">
                      <Textarea
                        {...form.register('support_style')}
                        placeholder="e.g., gentle encouragement, firm guidance, quiet presence, physical touch like hand-holding..."
                        className="intake-input min-h-[100px]"
                      />
                    </FormField>
                  </div>
                </div>
              )}

              {/* Postpartum Step */}
              {currentStep === 5 && (
                <div className="space-y-6">
                  <SectionHeader
                    title="After Birth"
                    description="Planning for the postpartum period"
                  />
                  <div className="grid gap-5">
                    <FormField
                      label="How do you plan to feed your baby?"
                      hint="Select all that apply"
                    >
                      <MultiSelectButtons
                        options={[
                          'Breastfeeding/chestfeeding',
                          'Formula feeding',
                          'Combination',
                          'Undecided',
                        ]}
                        values={(watch('feeding_plan') as string[]) || []}
                        onChange={val => toggleArrayValue('feeding_plan', val)}
                      />
                    </FormField>

                    <FormField label="Interested in lactation support?">
                      <OptionButtons
                        options={['Yes', 'No', 'Maybe']}
                        value={watch('lactation_support')}
                        onChange={val => setValue('lactation_support', val)}
                      />
                    </FormField>

                    <FormField label="Will you have support at home after birth?">
                      <Textarea
                        {...form.register('postpartum_support')}
                        placeholder="e.g., partner taking leave, family coming to help, hiring a postpartum doula..."
                        className="intake-input min-h-[80px]"
                      />
                    </FormField>

                    <FormField
                      label="Do you have other children at home?"
                      optional
                    >
                      <Input
                        {...form.register('other_children')}
                        placeholder="e.g., 2-year-old daughter"
                        className="intake-input"
                      />
                    </FormField>
                  </div>
                </div>
              )}

              {/* Emergency Contact Step */}
              {currentStep === 6 && (
                <div className="space-y-6">
                  <SectionHeader
                    title="Emergency Contact"
                    description="Someone we can reach if needed"
                  />
                  <div className="grid gap-5">
                    <FormField label="Contact name" required>
                      <Input
                        {...form.register('emergency_name')}
                        placeholder="Full name"
                        className="intake-input"
                      />
                    </FormField>

                    <FormField label="Contact phone" required>
                      <Input
                        type="tel"
                        {...form.register('emergency_phone')}
                        placeholder="(555) 123-4567"
                        className="intake-input"
                      />
                    </FormField>

                    <FormField label="Relationship to you" required>
                      <Input
                        {...form.register('emergency_relationship')}
                        placeholder="e.g., Mother, Sister, Friend"
                        className="intake-input"
                      />
                    </FormField>
                  </div>
                </div>
              )}

              {/* Complete Step */}
              {currentStep === 7 && (
                <div className="space-y-6">
                  <SectionHeader
                    title="Almost Done!"
                    description="Just a couple more questions"
                  />
                  <div className="grid gap-5">
                    <FormField label="How did you hear about us?" optional>
                      <OptionButtons
                        options={[
                          'Google search',
                          'Social media',
                          'Friend/family',
                          'Healthcare provider',
                          'Other',
                        ]}
                        value={watch('how_found')}
                        onChange={val => setValue('how_found', val)}
                        wrap
                      />
                    </FormField>

                    <FormField label="Any questions or anything else you'd like us to know?">
                      <Textarea
                        {...form.register('questions')}
                        placeholder="We're here to help in any way we can..."
                        className="intake-input min-h-[100px]"
                      />
                    </FormField>

                    {/* Summary */}
                    <div className="mt-6 p-6 bg-gradient-to-br from-[#f5f0eb] to-[#ebe4dc] rounded-2xl border border-[#e0d5c9]">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-full bg-[#8b7355] flex items-center justify-center">
                          <Check className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p
                            className="font-medium text-[#5c4a3d]"
                            style={{ fontFamily: 'Georgia, serif' }}
                          >
                            Ready to submit!
                          </p>
                          <p className="text-sm text-[#8b7355]">
                            Your information has been saved as a draft
                          </p>
                        </div>
                      </div>
                      <p className="text-sm text-[#7a6b5a] leading-relaxed">
                        Thank you for taking the time to fill this out. Your
                        responses help us provide personalized support for your
                        unique journey.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="px-6 sm:px-8 py-5 bg-[#faf8f5]/50 border-t border-[#e8ddd4] flex justify-between items-center">
            <Button
              type="button"
              variant="ghost"
              onClick={handleBack}
              disabled={currentStep === 0}
              className="text-[#8b7355] hover:text-[#5c4a3d] hover:bg-[#e8ddd4]/50 disabled:opacity-30"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Back
            </Button>

            {currentStep < sections.length - 1 ? (
              <Button
                type="button"
                onClick={handleNext}
                className="bg-[#8b7355] hover:bg-[#7a6347] text-white px-6 rounded-full"
              >
                Continue
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="bg-gradient-to-r from-[#8b7355] to-[#6d5a45] hover:from-[#7a6347] hover:to-[#5c4a3d] text-white px-8 rounded-full shadow-lg"
              >
                {isSubmitting ? (
                  <span className="flex items-center">
                    <motion.span
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1 }}
                      className="mr-2"
                    >
                      ✦
                    </motion.span>
                    Submitting...
                  </span>
                ) : (
                  <span className="flex items-center">
                    Submit Form
                    <Sparkles className="w-4 h-4 ml-2" />
                  </span>
                )}
              </Button>
            )}
          </div>
        </motion.div>

        {/* Auto-save indicator */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center text-xs text-[#a89a8a] mt-4"
        >
          Your progress is automatically saved
        </motion.p>
      </div>

      {/* Custom styles */}
      <style jsx global>{`
        .intake-input {
          background-color: #faf8f5 !important;
          border: 1.5px solid #e0d5c9 !important;
          border-radius: 12px !important;
          padding: 12px 16px !important;
          font-size: 15px !important;
          color: #5c4a3d !important;
          transition: all 0.2s ease !important;
        }
        .intake-input::placeholder {
          color: #b5a898 !important;
        }
        .intake-input:focus {
          outline: none !important;
          border-color: #8b7355 !important;
          box-shadow: 0 0 0 3px rgba(139, 115, 85, 0.1) !important;
          background-color: white !important;
        }
        .intake-input:hover:not(:focus) {
          border-color: #c4b5a5 !important;
        }
      `}</style>
    </div>
  )
}

// Sub-components

function WelcomeStep({ onContinue }: { onContinue: () => void }) {
  return (
    <div className="text-center py-8">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-[#e8ddd4] to-[#d4c4b5] flex items-center justify-center"
      >
        <Heart className="w-10 h-10 text-[#8b7355]" />
      </motion.div>

      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-2xl sm:text-3xl font-light text-[#5c4a3d] mb-4"
        style={{ fontFamily: 'Georgia, serif' }}
      >
        Welcome to Your Journey
      </motion.h2>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-[#8b7355] max-w-md mx-auto mb-8 leading-relaxed"
      >
        This form helps us understand you better so we can provide the most
        personalized support possible. Take your time — there are no wrong
        answers.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="space-y-3 text-sm text-[#7a6b5a] mb-8"
      >
        <p className="flex items-center justify-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#c4b5a5]" />
          Takes about 10-15 minutes
        </p>
        <p className="flex items-center justify-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#c4b5a5]" />
          Your progress is saved automatically
        </p>
        <p className="flex items-center justify-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#c4b5a5]" />
          You can come back anytime to finish
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <Button
          onClick={onContinue}
          className="bg-[#8b7355] hover:bg-[#7a6347] text-white px-8 py-6 rounded-full text-base shadow-lg"
        >
          Let&apos;s Begin
          <ChevronRight className="w-5 h-5 ml-2" />
        </Button>
      </motion.div>
    </div>
  )
}

function SectionHeader({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <div className="mb-2">
      <h2
        className="text-xl sm:text-2xl font-light text-[#5c4a3d]"
        style={{ fontFamily: 'Georgia, serif' }}
      >
        {title}
      </h2>
      <p className="text-sm text-[#8b7355] mt-1">{description}</p>
    </div>
  )
}

function FormField({
  label,
  hint,
  optional,
  required,
  children,
}: {
  label: string
  hint?: string
  optional?: boolean
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium text-[#5c4a3d] flex items-center gap-2">
        {label}
        {optional && (
          <span className="text-xs text-[#a89a8a] font-normal">(optional)</span>
        )}
        {required && <span className="text-[#c4937a]">*</span>}
      </Label>
      {hint && <p className="text-xs text-[#a89a8a] -mt-1">{hint}</p>}
      {children}
    </div>
  )
}

function OptionButtons({
  options,
  value,
  onChange,
  wrap,
}: {
  options: string[]
  value: string
  onChange: (val: string) => void
  wrap?: boolean
}) {
  return (
    <div className={`flex gap-2 ${wrap ? 'flex-wrap' : ''}`}>
      {options.map(option => (
        <button
          key={option}
          type="button"
          onClick={() => onChange(option)}
          className={`
            px-4 py-2.5 rounded-full text-sm font-medium transition-all duration-200
            ${
              value === option
                ? 'bg-[#8b7355] text-white shadow-md'
                : 'bg-[#f0e6dc] text-[#7a6b5a] hover:bg-[#e8ddd4]'
            }
          `}
        >
          {option}
        </button>
      ))}
    </div>
  )
}

function MultiSelectButtons({
  options,
  values,
  onChange,
}: {
  options: string[]
  values: string[]
  onChange: (val: string) => void
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(option => {
        const isSelected = values.includes(option)
        return (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            className={`
              px-4 py-2.5 rounded-full text-sm font-medium transition-all duration-200
              ${
                isSelected
                  ? 'bg-[#8b7355] text-white shadow-md'
                  : 'bg-[#f0e6dc] text-[#7a6b5a] hover:bg-[#e8ddd4]'
              }
            `}
          >
            {isSelected && <Check className="w-3 h-3 inline mr-1.5" />}
            {option}
          </button>
        )
      })}
    </div>
  )
}
