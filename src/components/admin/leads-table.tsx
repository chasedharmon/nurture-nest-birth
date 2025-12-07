'use client'

import { useRouter } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'
import type { Lead } from '@/lib/supabase/types'

interface LeadsTableProps {
  leads: Lead[]
}

const statusColors = {
  new: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300',
  contacted:
    'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300',
  scheduled:
    'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300',
  client:
    'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300',
  lost: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300',
}

const sourceLabels = {
  contact_form: 'Contact Form',
  newsletter: 'Newsletter',
  manual: 'Manual Entry',
}

export function LeadsTable({ leads }: LeadsTableProps) {
  const router = useRouter()

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-border text-xs uppercase text-muted-foreground">
          <tr>
            <th className="px-4 py-3">Name</th>
            <th className="px-4 py-3">Email</th>
            <th className="px-4 py-3">Source</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Created</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {leads.map(lead => (
            <tr
              key={lead.id}
              onClick={() => router.push(`/admin/leads/${lead.id}`)}
              className="hover:bg-muted/50 transition-colors cursor-pointer"
            >
              <td className="px-4 py-4 font-medium">{lead.name}</td>
              <td className="px-4 py-4 text-muted-foreground">{lead.email}</td>
              <td className="px-4 py-4">
                <span className="rounded-full bg-muted px-2 py-1 text-xs">
                  {sourceLabels[lead.source]}
                </span>
              </td>
              <td className="px-4 py-4">
                <span
                  className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${statusColors[lead.status]}`}
                >
                  {lead.status}
                </span>
              </td>
              <td className="px-4 py-4 text-muted-foreground">
                {formatDistanceToNow(new Date(lead.created_at), {
                  addSuffix: true,
                })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
