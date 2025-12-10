'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select-native'
import { createSurvey, updateSurvey } from '@/app/actions/surveys'
import type {
  Survey,
  SurveyType,
  SurveyTriggerType,
  SurveyQuestion,
} from '@/lib/supabase/types'
import { Plus, Trash2, GripVertical } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

const SURVEY_TYPE_OPTIONS: { value: SurveyType; label: string }[] = [
  { value: 'nps', label: 'NPS (Net Promoter Score)' },
  { value: 'csat', label: 'Customer Satisfaction' },
  { value: 'custom', label: 'Custom Survey' },
]

const QUESTION_TYPE_OPTIONS = [
  { value: 'nps', label: 'NPS Scale (0-10)' },
  { value: 'rating', label: 'Rating (1-5 Stars)' },
  { value: 'text', label: 'Open Text' },
  { value: 'single_choice', label: 'Single Choice' },
  { value: 'multiple_choice', label: 'Multiple Choice' },
]

interface SurveyDialogProps {
  mode: 'create' | 'edit'
  survey?: Survey
  children: React.ReactNode
}

export function SurveyDialog({ mode, survey, children }: SurveyDialogProps) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  // Form state
  const [name, setName] = useState(survey?.name || '')
  const [description, setDescription] = useState(survey?.description || '')
  const [surveyType, setSurveyType] = useState<SurveyType>(
    survey?.survey_type || 'nps'
  )
  const [thankYouMessage, setThankYouMessage] = useState(
    survey?.thank_you_message || 'Thank you for your feedback!'
  )
  const [questions, setQuestions] = useState<SurveyQuestion[]>(
    survey?.questions || []
  )
  const [triggerType, setTriggerType] = useState<SurveyTriggerType>(
    survey?.trigger_type || 'manual'
  )

  const resetForm = () => {
    if (mode === 'create') {
      setName('')
      setDescription('')
      setSurveyType('nps')
      setThankYouMessage('Thank you for your feedback!')
      setQuestions([])
      setTriggerType('manual')
    } else if (survey) {
      setName(survey.name)
      setDescription(survey.description || '')
      setSurveyType(survey.survey_type)
      setThankYouMessage(
        survey.thank_you_message || 'Thank you for your feedback!'
      )
      setQuestions(survey.questions || [])
      setTriggerType(survey.trigger_type || 'manual')
    }
    setError(null)
  }

  // When survey type changes, set default questions
  const handleSurveyTypeChange = (newType: SurveyType) => {
    setSurveyType(newType)
    if (mode === 'create' && questions.length === 0) {
      if (newType === 'nps') {
        setQuestions([
          {
            id: crypto.randomUUID(),
            question:
              'How likely are you to recommend our services to a friend or family member?',
            type: 'nps',
            required: true,
          },
          {
            id: crypto.randomUUID(),
            question: "What's the main reason for your score?",
            type: 'text',
            required: false,
          },
        ])
      } else if (newType === 'csat') {
        setQuestions([
          {
            id: crypto.randomUUID(),
            question: 'How satisfied were you with our services overall?',
            type: 'rating',
            required: true,
          },
          {
            id: crypto.randomUUID(),
            question: 'What could we do to improve?',
            type: 'text',
            required: false,
          },
        ])
      }
    }
  }

  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        id: crypto.randomUUID(),
        question: '',
        type: 'text',
        required: false,
      },
    ])
  }

  const updateQuestion = (index: number, updates: Partial<SurveyQuestion>) => {
    const newQuestions = [...questions]
    const currentQuestion = newQuestions[index]
    if (!currentQuestion) return
    newQuestions[index] = {
      id: currentQuestion.id,
      question:
        updates.question !== undefined
          ? updates.question
          : currentQuestion.question,
      type: updates.type !== undefined ? updates.type : currentQuestion.type,
      required:
        updates.required !== undefined
          ? updates.required
          : currentQuestion.required,
      options:
        updates.options !== undefined
          ? updates.options
          : currentQuestion.options,
    }
    setQuestions(newQuestions)
  }

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!name.trim()) {
      setError('Survey name is required')
      return
    }

    if (questions.length === 0) {
      setError('Add at least one question')
      return
    }

    // Validate questions
    for (const q of questions) {
      if (!q.question.trim()) {
        setError('All questions must have text')
        return
      }
    }

    startTransition(async () => {
      try {
        const formData = {
          name: name.trim(),
          description: description.trim() || undefined,
          survey_type: surveyType,
          thank_you_message: thankYouMessage.trim() || undefined,
          questions,
          trigger_type: triggerType,
        }

        const result =
          mode === 'create'
            ? await createSurvey(formData)
            : await updateSurvey(survey!.id, formData)

        if (result.success) {
          setOpen(false)
          resetForm()
          router.refresh()
        } else {
          setError(result.error || 'Failed to save survey')
        }
      } catch {
        setError('An unexpected error occurred')
      }
    })
  }

  return (
    <Dialog
      open={open}
      onOpenChange={isOpen => {
        setOpen(isOpen)
        if (isOpen) resetForm()
      }}
    >
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Create Survey' : 'Edit Survey'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? 'Create a new survey to collect client feedback.'
              : 'Update the survey details and questions.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {/* Basic Info */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Survey Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Post-Service Feedback"
                disabled={isPending}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Sent after doula services are completed"
                disabled={isPending}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="surveyType">Survey Type</Label>
                <Select
                  id="surveyType"
                  value={surveyType}
                  onChange={e =>
                    handleSurveyTypeChange(e.target.value as SurveyType)
                  }
                  disabled={isPending}
                >
                  {SURVEY_TYPE_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
          </div>

          {/* Questions */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Questions</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addQuestion}
                disabled={isPending}
              >
                <Plus className="mr-1 h-4 w-4" />
                Add Question
              </Button>
            </div>

            {questions.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No questions yet. Select a survey type to add default questions,
                or add questions manually.
              </p>
            )}

            <div className="space-y-3">
              {questions.map((question, index) => (
                <Card key={question.id}>
                  <CardContent className="pt-4">
                    <div className="flex gap-3">
                      <GripVertical className="h-5 w-5 text-muted-foreground shrink-0 mt-2 cursor-move" />
                      <div className="flex-1 space-y-3">
                        <div className="flex gap-2">
                          <div className="flex-1">
                            <Input
                              value={question.question}
                              onChange={e =>
                                updateQuestion(index, {
                                  question: e.target.value,
                                })
                              }
                              placeholder="Enter your question..."
                              disabled={isPending}
                            />
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeQuestion(index)}
                            disabled={isPending}
                            className="text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="flex gap-4 items-center">
                          <div className="w-48">
                            <Select
                              value={question.type}
                              onChange={e =>
                                updateQuestion(index, {
                                  type: e.target
                                    .value as SurveyQuestion['type'],
                                })
                              }
                              disabled={isPending}
                            >
                              {QUESTION_TYPE_OPTIONS.map(option => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </Select>
                          </div>
                          <label className="flex items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              checked={question.required}
                              onChange={e =>
                                updateQuestion(index, {
                                  required: e.target.checked,
                                })
                              }
                              disabled={isPending}
                              className="rounded border-input"
                            />
                            Required
                          </label>
                        </div>

                        {/* Options for choice questions */}
                        {(question.type === 'single_choice' ||
                          question.type === 'multiple_choice') && (
                          <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground">
                              Options (one per line)
                            </Label>
                            <Textarea
                              value={(question.options || []).join('\n')}
                              onChange={e =>
                                updateQuestion(index, {
                                  options: e.target.value
                                    .split('\n')
                                    .filter(Boolean),
                                })
                              }
                              placeholder="Option 1&#10;Option 2&#10;Option 3"
                              rows={3}
                              disabled={isPending}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Thank You Message */}
          <div className="space-y-2">
            <Label htmlFor="thankYouMessage">Thank You Message</Label>
            <Textarea
              id="thankYouMessage"
              value={thankYouMessage}
              onChange={e => setThankYouMessage(e.target.value)}
              placeholder="Thank you for your feedback! We appreciate you taking the time to share your experience."
              rows={3}
              disabled={isPending}
            />
            <p className="text-xs text-muted-foreground">
              Shown to clients after they submit their response
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending
                ? 'Saving...'
                : mode === 'create'
                  ? 'Create Survey'
                  : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
