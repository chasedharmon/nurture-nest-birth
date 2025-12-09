'use client'

import { useState, useCallback } from 'react'
import { WorkflowCanvas } from '@/components/admin/workflows'
import { saveWorkflowCanvas } from '@/app/actions/workflows'
import type {
  WorkflowWithSteps,
  StepConfig,
  CanvasData,
} from '@/lib/workflows/types'

interface WorkflowBuilderClientProps {
  workflow: WorkflowWithSteps
  emailTemplates: { id: string; name: string }[]
}

export function WorkflowBuilderClient({
  workflow,
  emailTemplates,
}: WorkflowBuilderClientProps) {
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = useCallback(
    async (
      steps: Array<{
        step_key: string
        step_type: string
        step_order: number
        step_config: StepConfig
        position_x: number
        position_y: number
        next_step_key?: string | null
      }>,
      canvasData: CanvasData
    ) => {
      setIsSaving(true)
      try {
        await saveWorkflowCanvas(workflow.id, steps, canvasData)
      } finally {
        setIsSaving(false)
      }
    },
    [workflow.id]
  )

  return (
    <WorkflowCanvas
      workflow={workflow}
      onSave={handleSave}
      emailTemplates={emailTemplates}
      isSaving={isSaving}
    />
  )
}
