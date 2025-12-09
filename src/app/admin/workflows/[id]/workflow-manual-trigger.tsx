'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { PlayCircle, Loader2, AlertCircle, CheckCircle } from 'lucide-react'
import {
  triggerWorkflowManually,
  getRecordsForTrigger,
} from '@/app/actions/workflows'
import type { WorkflowObjectType } from '@/lib/workflows/types'

interface WorkflowManualTriggerProps {
  workflowId: string
  objectType: WorkflowObjectType
  isActive: boolean
}

interface RecordOption {
  id: string
  name: string
  email?: string
}

export function WorkflowManualTrigger({
  workflowId,
  objectType,
  isActive,
}: WorkflowManualTriggerProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isFetchingRecords, setIsFetchingRecords] = useState(false)
  const [records, setRecords] = useState<RecordOption[]>([])
  const [selectedRecordId, setSelectedRecordId] = useState<string>('')
  const [result, setResult] = useState<{
    success: boolean
    message: string
  } | null>(null)

  useEffect(() => {
    if (open) {
      fetchRecords()
    }
  }, [open, objectType])

  const fetchRecords = async () => {
    setIsFetchingRecords(true)
    try {
      const { data, error } = await getRecordsForTrigger(objectType)
      if (error) {
        console.error('Failed to fetch records:', error)
        setRecords([])
      } else {
        setRecords(data || [])
      }
    } finally {
      setIsFetchingRecords(false)
    }
  }

  const handleTrigger = async () => {
    if (!selectedRecordId) return

    setIsLoading(true)
    setResult(null)

    try {
      const { data, error } = await triggerWorkflowManually(
        workflowId,
        objectType,
        selectedRecordId
      )

      if (error) {
        setResult({ success: false, message: error })
      } else {
        setResult({
          success: true,
          message: `Workflow execution started (ID: ${data?.id?.slice(0, 8)}...)`,
        })
        router.refresh()
      }
    } catch {
      setResult({ success: false, message: 'An unexpected error occurred' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen)
    if (!isOpen) {
      setSelectedRecordId('')
      setResult(null)
    }
  }

  const objectTypeLabel = {
    lead: 'Client',
    meeting: 'Meeting',
    payment: 'Payment',
    invoice: 'Invoice',
    service: 'Service',
    document: 'Document',
    contract: 'Contract',
    intake_form: 'Intake Form',
  }[objectType]

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={!isActive}
          title={
            !isActive
              ? 'Workflow must be active to trigger manually'
              : undefined
          }
        >
          <PlayCircle className="mr-2 h-4 w-4" />
          Test Run
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Run Workflow Manually</DialogTitle>
          <DialogDescription>
            Select a {objectTypeLabel?.toLowerCase()} to run this workflow
            against. This will create a new execution and process all steps
            immediately.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Select {objectTypeLabel}</Label>
            {isFetchingRecords ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading records...
              </div>
            ) : records.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No {objectTypeLabel?.toLowerCase()}s found.
              </p>
            ) : (
              <Select
                value={selectedRecordId}
                onValueChange={setSelectedRecordId}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={`Select a ${objectTypeLabel?.toLowerCase()}`}
                  />
                </SelectTrigger>
                <SelectContent>
                  {records.map(record => (
                    <SelectItem key={record.id} value={record.id}>
                      {record.name}
                      {record.email && (
                        <span className="ml-2 text-muted-foreground">
                          ({record.email})
                        </span>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {result && (
            <div
              className={`flex items-start gap-2 rounded-lg p-3 text-sm ${
                result.success
                  ? 'bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                  : 'bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-300'
              }`}
            >
              {result.success ? (
                <CheckCircle className="h-4 w-4 mt-0.5" />
              ) : (
                <AlertCircle className="h-4 w-4 mt-0.5" />
              )}
              {result.message}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isLoading}
          >
            {result?.success ? 'Close' : 'Cancel'}
          </Button>
          {!result?.success && (
            <Button
              onClick={handleTrigger}
              disabled={isLoading || !selectedRecordId}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Run Workflow
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
