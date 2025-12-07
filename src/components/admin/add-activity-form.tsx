'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select-native'
import { Label } from '@/components/ui/label'
import { addActivity } from '@/app/actions/activities'
import type { ActivityType } from '@/lib/supabase/types'

interface AddActivityFormProps {
  leadId: string
  onActivityAdded?: () => void
}

export function AddActivityForm({
  leadId,
  onActivityAdded,
}: AddActivityFormProps) {
  const [activityType, setActivityType] = useState<ActivityType>('note')
  const [content, setContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!content.trim()) return

    setIsSubmitting(true)

    const result = await addActivity(leadId, activityType, content.trim())

    if (result.success) {
      setContent('')
      setActivityType('note')
      onActivityAdded?.()
    } else {
      alert('Failed to add activity: ' + result.error)
    }

    setIsSubmitting(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="activityType">Activity Type</Label>
        <Select
          id="activityType"
          value={activityType}
          onChange={e => setActivityType(e.target.value as ActivityType)}
          disabled={isSubmitting}
        >
          <option value="note">Note</option>
          <option value="call">Phone Call</option>
          <option value="email_sent">Email Sent</option>
          <option value="meeting">Meeting</option>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="content">Details</Label>
        <Textarea
          id="content"
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder="Add details about this activity..."
          rows={4}
          disabled={isSubmitting}
          required
        />
      </div>

      <Button type="submit" disabled={isSubmitting || !content.trim()}>
        {isSubmitting ? 'Adding...' : 'Add Activity'}
      </Button>
    </form>
  )
}
