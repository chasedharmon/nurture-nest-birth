'use client'

import { useState } from 'react'
import { scheduleMeeting } from '@/app/actions/meetings'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select-native'

interface AddMeetingFormProps {
  clientId: string
  onSuccess?: () => void
}

const meetingTypes = [
  { value: 'consultation', label: 'Consultation' },
  { value: 'prenatal', label: 'Prenatal Visit' },
  { value: 'birth', label: 'Birth Support' },
  { value: 'postpartum', label: 'Postpartum Visit' },
  { value: 'follow_up', label: 'Follow-up' },
  { value: 'other', label: 'Other' },
]

const durationOptions = [
  { value: '30', label: '30 minutes' },
  { value: '45', label: '45 minutes' },
  { value: '60', label: '1 hour' },
  { value: '90', label: '1.5 hours' },
  { value: '120', label: '2 hours' },
]

export function AddMeetingForm({ clientId, onSuccess }: AddMeetingFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    const formData = new FormData(e.currentTarget)

    // Combine date and time into ISO string
    const date = formData.get('meeting_date') as string
    const time = formData.get('meeting_time') as string
    const scheduledAt = new Date(`${date}T${time}`).toISOString()

    const result = await scheduleMeeting(clientId, {
      meeting_type: formData.get('meeting_type') as string,
      title: (formData.get('title') as string) || null,
      description: (formData.get('description') as string) || null,
      scheduled_at: scheduledAt,
      duration_minutes: parseInt(formData.get('duration_minutes') as string),
      location: (formData.get('location') as string) || null,
      meeting_link: (formData.get('meeting_link') as string) || null,
      status: 'scheduled',
      notes: (formData.get('notes') as string) || null,
    })

    setIsSubmitting(false)

    if (result.success) {
      setShowForm(false)
      onSuccess?.()
      ;(e.target as HTMLFormElement).reset()
    } else {
      setError(result.error || 'Failed to schedule meeting')
    }
  }

  if (!showForm) {
    return (
      <Button onClick={() => setShowForm(true)} className="w-full">
        + Schedule Meeting
      </Button>
    )
  }

  // Default to tomorrow's date
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const defaultDate = tomorrow.toISOString().split('T')[0]

  return (
    <div className="border border-border rounded-lg p-4 bg-muted/30">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Schedule Meeting</h3>
        <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}>
          Cancel
        </Button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200 rounded-md text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="meeting_type">Meeting Type *</Label>
            <Select name="meeting_type" id="meeting_type" required>
              <option value="">Select a meeting type</option>
              {meetingTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="duration_minutes">Duration *</Label>
            <Select
              name="duration_minutes"
              id="duration_minutes"
              required
              defaultValue="60"
            >
              {durationOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="title">Title (optional)</Label>
          <Input
            type="text"
            name="title"
            id="title"
            placeholder="e.g., Initial Consultation with Sarah"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="meeting_date">Date *</Label>
            <Input
              type="date"
              name="meeting_date"
              id="meeting_date"
              required
              defaultValue={defaultDate}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="meeting_time">Time *</Label>
            <Input
              type="time"
              name="meeting_time"
              id="meeting_time"
              required
              defaultValue="10:00"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="location">Location</Label>
          <Input
            type="text"
            name="location"
            id="location"
            placeholder="e.g., Client's home, Office, Hospital"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="meeting_link">Video Meeting Link</Label>
          <Input
            type="url"
            name="meeting_link"
            id="meeting_link"
            placeholder="https://zoom.us/j/..."
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            name="description"
            id="description"
            placeholder="Meeting agenda or details..."
            rows={2}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">Internal Notes</Label>
          <Textarea
            name="notes"
            id="notes"
            placeholder="Preparation notes, topics to discuss..."
            rows={2}
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowForm(false)}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Scheduling...' : 'Schedule Meeting'}
          </Button>
        </div>
      </form>
    </div>
  )
}
