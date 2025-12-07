'use client'

import { useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select-native'
import { Button } from '@/components/ui/button'
import type { LeadStatus, LeadSource } from '@/lib/supabase/types'

export function LeadsSearch() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const [query, setQuery] = useState(searchParams.get('q') || '')
  const [status, setStatus] = useState<LeadStatus | 'all'>(
    (searchParams.get('status') as LeadStatus) || 'all'
  )
  const [source, setSource] = useState<LeadSource | 'all'>(
    (searchParams.get('source') as LeadSource) || 'all'
  )

  function handleSearch() {
    const params = new URLSearchParams()

    if (query) params.set('q', query)
    if (status && status !== 'all') params.set('status', status)
    if (source && source !== 'all') params.set('source', source)

    startTransition(() => {
      router.push(
        `/admin/leads${params.toString() ? `?${params.toString()}` : ''}`
      )
    })
  }

  function handleClear() {
    setQuery('')
    setStatus('all')
    setSource('all')
    startTransition(() => {
      router.push('/admin/leads')
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4">
        <div className="flex-1 min-w-[200px]">
          <Input
            type="search"
            placeholder="Search by name or email..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
          />
        </div>

        <div className="w-[150px]">
          <Select
            value={status}
            onChange={e => setStatus(e.target.value as LeadStatus | 'all')}
          >
            <option value="all">All Statuses</option>
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="scheduled">Scheduled</option>
            <option value="client">Client</option>
            <option value="lost">Lost</option>
          </Select>
        </div>

        <div className="w-[150px]">
          <Select
            value={source}
            onChange={e => setSource(e.target.value as LeadSource | 'all')}
          >
            <option value="all">All Sources</option>
            <option value="contact_form">Contact Form</option>
            <option value="newsletter">Newsletter</option>
            <option value="manual">Manual</option>
          </Select>
        </div>

        <Button onClick={handleSearch} disabled={isPending}>
          {isPending ? 'Searching...' : 'Search'}
        </Button>

        <Button variant="outline" onClick={handleClear} disabled={isPending}>
          Clear
        </Button>
      </div>
    </div>
  )
}
