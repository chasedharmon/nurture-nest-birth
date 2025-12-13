'use client'

/**
 * Objects Page Client Component
 *
 * Handles the "New Custom Object" button and wizard dialog.
 * This client component wraps the interactive elements that require
 * client-side state management.
 */

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { CreateObjectWizard } from '@/components/admin/setup/objects/create-object-wizard'

interface ObjectsPageClientProps {
  variant?: 'default' | 'outline'
}

export function ObjectsPageClient({
  variant = 'default',
}: ObjectsPageClientProps) {
  const [wizardOpen, setWizardOpen] = useState(false)

  return (
    <>
      <Button variant={variant} onClick={() => setWizardOpen(true)}>
        <Plus className="mr-2 h-4 w-4" />
        {variant === 'outline' ? 'Create Custom Object' : 'New Custom Object'}
      </Button>

      <CreateObjectWizard open={wizardOpen} onOpenChange={setWizardOpen} />
    </>
  )
}
