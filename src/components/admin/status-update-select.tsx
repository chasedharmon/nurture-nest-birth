'use client'

import { useState } from 'react'
import { Select } from '@/components/ui/select-native'
import { updateLeadStatus } from '@/app/actions/leads'
import type { LeadStatus } from '@/lib/supabase/types'

interface StatusUpdateSelectProps {
  leadId: string
  currentStatus: LeadStatus
  onStatusChange?: () => void
}

export function StatusUpdateSelect({
  leadId,
  currentStatus,
  onStatusChange,
}: StatusUpdateSelectProps) {
  const [status, setStatus] = useState<LeadStatus>(currentStatus)
  const [isUpdating, setIsUpdating] = useState(false)

  async function handleStatusChange(newStatus: LeadStatus) {
    setIsUpdating(true)
    setStatus(newStatus)

    const result = await updateLeadStatus(leadId, newStatus)

    if (result.success) {
      onStatusChange?.()
    } else {
      // Revert on error
      setStatus(currentStatus)
      alert('Failed to update status: ' + result.error)
    }

    setIsUpdating(false)
  }

  return (
    <Select
      value={status}
      onChange={e => handleStatusChange(e.target.value as LeadStatus)}
      disabled={isUpdating}
      className="w-auto"
    >
      <option value="new">New</option>
      <option value="contacted">Contacted</option>
      <option value="scheduled">Scheduled</option>
      <option value="client">Client</option>
      <option value="lost">Lost</option>
    </Select>
  )
}
