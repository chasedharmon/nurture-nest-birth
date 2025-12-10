'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { NPSScale } from '@/components/ui/nps-scale'
import { submitSurveyResponse } from '@/app/actions/surveys'
import { CheckCircle2, Loader2 } from 'lucide-react'
import type { Survey, SurveyQuestion } from '@/lib/supabase/types'

interface SurveyResponseFormProps {
  token: string
  survey: Survey
  thankYouMessage: string
}

export function SurveyResponseForm({
  token,
  survey,
  thankYouMessage,
}: SurveyResponseFormProps) {
  const [responses, setResponses] = useState<Record<string, string | number>>(
    {}
  )
  const [npsScore, setNpsScore] = useState<number | null>(null)
  const [feedbackText, setFeedbackText] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [isPending, startTransition] = useTransition()

  const handleResponseChange = (questionId: string, value: string | number) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: value,
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validate required fields
    const questions = survey.questions || []
    for (const question of questions) {
      if (question && question.required) {
        if (question.type === 'nps' && npsScore === null) {
          setError('Please provide a rating before submitting')
          return
        }
        if (question.type !== 'nps') {
          const response = responses[question.id]
          if (!response || response.toString().trim() === '') {
            setError(`Please answer: "${question.question}"`)
            return
          }
        }
      }
    }

    startTransition(async () => {
      try {
        // Find the feedback text from responses or use the explicit field
        let feedback = feedbackText
        if (!feedback) {
          // Look for text-type questions
          for (const q of survey.questions) {
            if (q.type === 'text' && responses[q.id]) {
              if (!feedback) {
                feedback = responses[q.id] as string
              }
            }
          }
        }

        const result = await submitSurveyResponse({
          token,
          responses: {
            ...responses,
            ...(npsScore !== null ? { nps: npsScore } : {}),
          },
          npsScore: npsScore ?? undefined,
          feedbackText: feedback || undefined,
          userAgent:
            typeof window !== 'undefined'
              ? window.navigator.userAgent
              : undefined,
        })

        if (result.success) {
          setSubmitted(true)
        } else {
          setError(result.error || 'Failed to submit survey')
        }
      } catch {
        setError('An unexpected error occurred')
      }
    })
  }

  if (submitted) {
    return (
      <div className="py-8 text-center">
        <div className="mb-4 mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
          <CheckCircle2 className="h-8 w-8 text-green-600" />
        </div>
        <h2 className="text-xl font-semibold mb-2">Thank You!</h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          {thankYouMessage}
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {survey.questions.map((question, index) => (
        <QuestionField
          key={question.id}
          question={question}
          index={index}
          value={
            question.type === 'nps'
              ? npsScore
              : (responses[question.id] as string | undefined)
          }
          onChange={value => {
            if (question.type === 'nps') {
              setNpsScore(value as number)
            } else {
              handleResponseChange(question.id, value)
            }
          }}
          disabled={isPending}
        />
      ))}

      {/* Additional feedback for non-NPS surveys */}
      {survey.survey_type !== 'nps' &&
        !survey.questions.some(q => q.type === 'text') && (
          <div className="space-y-2">
            <Label htmlFor="feedback">Additional Comments (Optional)</Label>
            <Textarea
              id="feedback"
              value={feedbackText}
              onChange={e => setFeedbackText(e.target.value)}
              placeholder="Any other feedback you'd like to share..."
              rows={4}
              disabled={isPending}
            />
          </div>
        )}

      <Button type="submit" size="lg" className="w-full" disabled={isPending}>
        {isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Submitting...
          </>
        ) : (
          'Submit Feedback'
        )}
      </Button>
    </form>
  )
}

interface QuestionFieldProps {
  question: SurveyQuestion
  index: number
  value: string | number | null | undefined
  onChange: (value: string | number) => void
  disabled: boolean
}

function QuestionField({
  question,
  index,
  value,
  onChange,
  disabled,
}: QuestionFieldProps) {
  return (
    <div className="space-y-3">
      <Label className="text-base">
        {index + 1}. {question.question}
        {question.required && <span className="text-destructive ml-1">*</span>}
      </Label>

      {question.type === 'nps' && (
        <NPSScale
          value={value as number | null}
          onChange={onChange}
          disabled={disabled}
          size="md"
        />
      )}

      {question.type === 'rating' && (
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map(rating => (
            <button
              key={rating}
              type="button"
              onClick={() => onChange(rating)}
              disabled={disabled}
              className={`h-10 w-10 rounded-md border font-medium transition-colors
                ${
                  value === rating
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background hover:bg-muted border-input'
                }
                disabled:opacity-50 disabled:cursor-not-allowed
              `}
            >
              {rating}
            </button>
          ))}
        </div>
      )}

      {question.type === 'text' && (
        <Textarea
          value={(value as string) || ''}
          onChange={e => onChange(e.target.value)}
          placeholder="Your answer..."
          rows={3}
          disabled={disabled}
        />
      )}

      {(question.type === 'multiple_choice' ||
        question.type === 'single_choice') &&
        question.options && (
          <div className="space-y-2">
            {question.options.map(option => (
              <label
                key={option}
                className={`flex items-center gap-3 p-3 rounded-md border cursor-pointer transition-colors
                  ${
                    value === option
                      ? 'bg-primary/10 border-primary'
                      : 'bg-background hover:bg-muted border-input'
                  }
                  ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
                `}
              >
                <input
                  type={
                    question.type === 'single_choice' ? 'radio' : 'checkbox'
                  }
                  name={question.id}
                  value={option}
                  checked={value === option}
                  onChange={() => onChange(option)}
                  disabled={disabled}
                  className="sr-only"
                />
                <div
                  className={`h-4 w-4 rounded-full border-2 flex items-center justify-center
                    ${value === option ? 'border-primary' : 'border-muted-foreground'}
                  `}
                >
                  {value === option && (
                    <div className="h-2 w-2 rounded-full bg-primary" />
                  )}
                </div>
                <span className="text-sm">{option}</span>
              </label>
            ))}
          </div>
        )}
    </div>
  )
}
