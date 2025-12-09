'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Play, Pause, Loader2, AlertCircle, AlertTriangle } from 'lucide-react'
import {
  toggleWorkflowActive,
  validateWorkflow,
  type WorkflowValidationResult,
} from '@/app/actions/workflows'

interface WorkflowToggleButtonProps {
  workflowId: string
  isActive: boolean
}

export function WorkflowToggleButton({
  workflowId,
  isActive,
}: WorkflowToggleButtonProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [validationResult, setValidationResult] =
    useState<WorkflowValidationResult | null>(null)
  const [showValidationDialog, setShowValidationDialog] = useState(false)

  const handleToggle = async () => {
    // If trying to activate, validate first and show dialog if there are issues
    if (!isActive) {
      setIsLoading(true)
      try {
        const validation = await validateWorkflow(workflowId)
        if (!validation.isValid || validation.warnings.length > 0) {
          setValidationResult(validation)
          setShowValidationDialog(true)
          setIsLoading(false)
          return
        }
      } catch {
        setIsLoading(false)
        return
      }
    }

    await performToggle()
  }

  const performToggle = async () => {
    setIsLoading(true)
    setShowValidationDialog(false)
    try {
      const result = await toggleWorkflowActive(workflowId, !isActive)
      if (result.error) {
        // Handle error - could show a toast here
        console.error('Failed to toggle workflow:', result.error)
      } else {
        router.refresh()
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <Button
        onClick={handleToggle}
        disabled={isLoading}
        variant={isActive ? 'outline' : 'default'}
      >
        {isLoading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : isActive ? (
          <Pause className="mr-2 h-4 w-4" />
        ) : (
          <Play className="mr-2 h-4 w-4" />
        )}
        {isActive ? 'Pause Workflow' : 'Activate Workflow'}
      </Button>

      <Dialog
        open={showValidationDialog}
        onOpenChange={setShowValidationDialog}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {validationResult?.isValid ? (
                <>
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  Workflow Has Warnings
                </>
              ) : (
                <>
                  <AlertCircle className="h-5 w-5 text-red-500" />
                  Cannot Activate Workflow
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {validationResult?.isValid
                ? 'The workflow can be activated, but there are some warnings you should review.'
                : 'Please fix the following issues before activating this workflow.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Errors */}
            {validationResult?.errors && validationResult.errors.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-red-600 dark:text-red-400">
                  Errors
                </h4>
                <ul className="space-y-1">
                  {validationResult.errors.map((error, index) => (
                    <li
                      key={index}
                      className="flex items-start gap-2 text-sm text-red-700 dark:text-red-300"
                    >
                      <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                      {error}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Warnings */}
            {validationResult?.warnings &&
              validationResult.warnings.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-yellow-600 dark:text-yellow-400">
                    Warnings
                  </h4>
                  <ul className="space-y-1">
                    {validationResult.warnings.map((warning, index) => (
                      <li
                        key={index}
                        className="flex items-start gap-2 text-sm text-yellow-700 dark:text-yellow-300"
                      >
                        <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                        {warning}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setShowValidationDialog(false)}
            >
              Cancel
            </Button>
            {validationResult?.isValid && (
              <Button onClick={performToggle} disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Activate Anyway
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
