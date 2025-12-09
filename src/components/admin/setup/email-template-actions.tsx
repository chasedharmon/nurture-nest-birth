'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import {
  deleteEmailTemplate,
  toggleEmailTemplateActive,
  type EmailTemplate,
} from '@/app/actions/setup'
import { EmailTemplateDialog } from './email-template-dialog'
import {
  MoreHorizontal,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  Loader2,
  Copy,
} from 'lucide-react'

interface EmailTemplateActionsProps {
  template: EmailTemplate
}

export function EmailTemplateActions({ template }: EmailTemplateActionsProps) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)
  const [isToggling, setIsToggling] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showPreviewDialog, setShowPreviewDialog] = useState(false)

  const handleToggleActive = async () => {
    setIsToggling(true)
    try {
      await toggleEmailTemplateActive(template.id, !template.is_active)
      router.refresh()
    } finally {
      setIsToggling(false)
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await deleteEmailTemplate(template.id)
      router.refresh()
    } finally {
      setIsDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  const copyToClipboard = async () => {
    const text = `Subject: ${template.subject}\n\n${template.body}`
    await navigator.clipboard.writeText(text)
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowPreviewDialog(true)}
        >
          Preview
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <EmailTemplateDialog mode="edit" template={template}>
              <DropdownMenuItem onSelect={e => e.preventDefault()}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
            </EmailTemplateDialog>
            <DropdownMenuItem onClick={copyToClipboard}>
              <Copy className="mr-2 h-4 w-4" />
              Copy Content
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={handleToggleActive}
              disabled={isToggling}
            >
              {template.is_active ? (
                <>
                  <EyeOff className="mr-2 h-4 w-4" />
                  Deactivate
                </>
              ) : (
                <>
                  <Eye className="mr-2 h-4 w-4" />
                  Activate
                </>
              )}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => setShowDeleteDialog(true)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Preview Dialog */}
      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{template.name}</DialogTitle>
            <DialogDescription>{template.description}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="mb-1 text-sm font-medium text-muted-foreground">
                Subject
              </p>
              <p className="rounded-md border bg-muted/50 p-3">
                {template.subject}
              </p>
            </div>
            <div>
              <p className="mb-1 text-sm font-medium text-muted-foreground">
                Body
              </p>
              <pre className="whitespace-pre-wrap rounded-md border bg-muted/50 p-3 text-sm">
                {template.body}
              </pre>
            </div>
            {template.available_variables.length > 0 && (
              <div>
                <p className="mb-2 text-sm font-medium text-muted-foreground">
                  Available Variables
                </p>
                <div className="flex flex-wrap gap-2">
                  {template.available_variables.map(variable => (
                    <Badge
                      key={variable}
                      variant="outline"
                      className="font-mono"
                    >
                      {`{{${variable}}}`}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Email Template</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{template.name}&quot;? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
