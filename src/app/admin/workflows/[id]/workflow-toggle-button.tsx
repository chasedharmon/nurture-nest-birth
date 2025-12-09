'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Play, Pause, Loader2 } from 'lucide-react'
import { toggleWorkflowActive } from '@/app/actions/workflows'

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

  const handleToggle = async () => {
    setIsLoading(true)
    try {
      await toggleWorkflowActive(workflowId, !isActive)
      router.refresh()
    } finally {
      setIsLoading(false)
    }
  }

  return (
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
  )
}
