'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Download, Loader2, CheckCircle } from 'lucide-react'
import { requestDataExport } from '@/app/actions/gdpr'

interface DataExportButtonProps {
  organizationId: string
}

export function DataExportButton({ organizationId }: DataExportButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleExport = async () => {
    setIsLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const result = await requestDataExport(organizationId)

      if (result.success) {
        setSuccess(true)
        // Reset success state after 5 seconds
        setTimeout(() => setSuccess(false), 5000)
      } else {
        setError(result.error || 'Export failed')
      }
    } catch (err) {
      setError('An unexpected error occurred')
      console.error('Export error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <Button variant="outline" disabled className="text-green-600">
        <CheckCircle className="mr-2 h-4 w-4" />
        Export Sent to Email
      </Button>
    )
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button variant="outline" onClick={handleExport} disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Preparing Export...
          </>
        ) : (
          <>
            <Download className="mr-2 h-4 w-4" />
            Request Export
          </>
        )}
      </Button>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
