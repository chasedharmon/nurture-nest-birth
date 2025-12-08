'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import type { TimeEntryType, TeamMember } from '@/lib/supabase/types'
import { createTimeEntry } from '@/app/actions/team'

interface TimeEntryFormProps {
  teamMembers: TeamMember[]
  clientId?: string
  clientName?: string
  onSuccess?: () => void
}

const entryTypeLabels: Record<TimeEntryType, string> = {
  client_work: 'Client Work',
  travel: 'Travel',
  on_call: 'On-Call Time',
  birth_support: 'Birth Support',
  admin: 'Administrative',
  training: 'Training/CE',
  other: 'Other',
}

export function TimeEntryForm({
  teamMembers,
  clientId,
  clientName,
  onSuccess,
}: TimeEntryFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const getToday = () => new Date().toISOString().split('T')[0] as string

  const [formData, setFormData] = useState({
    team_member_id: '',
    entry_date: getToday(),
    hours: '',
    entry_type: 'client_work' as TimeEntryType,
    description: '',
    billable: true,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    const hours = parseFloat(formData.hours)
    if (isNaN(hours) || hours <= 0) {
      setError('Please enter valid hours')
      setIsLoading(false)
      return
    }

    const result = await createTimeEntry({
      team_member_id: formData.team_member_id,
      client_id: clientId || null,
      entry_date: formData.entry_date || getToday(),
      hours,
      entry_type: formData.entry_type,
      description: formData.description || null,
      billable: formData.billable,
    })

    setIsLoading(false)

    if (result.success) {
      setFormData({
        team_member_id: formData.team_member_id,
        entry_date: getToday(),
        hours: '',
        entry_type: 'client_work',
        description: '',
        billable: true,
      })
      router.refresh()
      onSuccess?.()
    } else {
      setError(result.error || 'Failed to log time')
    }
  }

  const activeMembers = teamMembers.filter(m => m.is_active)

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="team_member">Team Member</Label>
          <Select
            value={formData.team_member_id}
            onValueChange={v =>
              setFormData(prev => ({ ...prev, team_member_id: v }))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select provider" />
            </SelectTrigger>
            <SelectContent>
              {activeMembers.map(member => (
                <SelectItem key={member.id} value={member.id}>
                  {member.display_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="entry_date">Date</Label>
          <Input
            id="entry_date"
            type="date"
            value={formData.entry_date}
            onChange={e =>
              setFormData(prev => ({ ...prev, entry_date: e.target.value }))
            }
            required
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="hours">Hours</Label>
          <Input
            id="hours"
            type="number"
            step="0.25"
            min="0.25"
            max="24"
            placeholder="e.g., 2.5"
            value={formData.hours}
            onChange={e =>
              setFormData(prev => ({ ...prev, hours: e.target.value }))
            }
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="entry_type">Type</Label>
          <Select
            value={formData.entry_type}
            onValueChange={(v: TimeEntryType) =>
              setFormData(prev => ({ ...prev, entry_type: v }))
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(entryTypeLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {clientName && (
        <div className="rounded-md bg-muted p-3 text-sm">
          <span className="text-muted-foreground">Client:</span>{' '}
          <span className="font-medium">{clientName}</span>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="description">Description (optional)</Label>
        <Textarea
          id="description"
          placeholder="What did you work on?"
          value={formData.description}
          onChange={e =>
            setFormData(prev => ({ ...prev, description: e.target.value }))
          }
          rows={2}
        />
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="billable"
          checked={formData.billable}
          onCheckedChange={checked =>
            setFormData(prev => ({ ...prev, billable: checked === true }))
          }
        />
        <Label htmlFor="billable" className="text-sm font-normal">
          Billable time
        </Label>
      </div>

      <Button
        type="submit"
        disabled={isLoading || !formData.team_member_id || !formData.hours}
        className="w-full"
      >
        {isLoading ? 'Logging...' : 'Log Time'}
      </Button>
    </form>
  )
}
