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
import { deleteSmsTemplate, type SmsTemplate } from '@/app/actions/setup'
import { previewTemplate } from '@/lib/sms/templates'
import { calculateSegments } from '@/lib/sms/utils'
import { SmsTemplateDialog } from './sms-template-dialog'
import { Eye, Pencil, Trash2, Loader2 } from 'lucide-react'

interface SmsTemplateActionsProps {
  template: SmsTemplate
}

export function SmsTemplateActions({ template }: SmsTemplateActionsProps) {
  const router = useRouter()
  const [showPreview, setShowPreview] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const previewContent = previewTemplate(template.content)
  const stats = calculateSegments(previewContent)

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const result = await deleteSmsTemplate(template.id)
      if (result.success) {
        setShowDelete(false)
        router.refresh()
      }
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => setShowPreview(true)}>
          <Eye className="h-4 w-4 mr-1" />
          Preview
        </Button>

        <SmsTemplateDialog mode="edit" template={template}>
          <Button variant="ghost" size="sm">
            <Pencil className="h-4 w-4 mr-1" />
            Edit
          </Button>
        </SmsTemplateDialog>

        <Button
          variant="ghost"
          size="sm"
          className="text-destructive hover:text-destructive"
          onClick={() => setShowDelete(true)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>SMS Preview</DialogTitle>
            <DialogDescription>Preview with sample data</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Phone mockup */}
            <div className="mx-auto max-w-xs">
              <div className="rounded-3xl border-4 border-gray-800 bg-gray-900 p-2">
                <div className="rounded-2xl bg-white p-4 dark:bg-gray-100">
                  <div className="mb-3 flex items-center justify-center">
                    <span className="text-xs text-gray-500">Message</span>
                  </div>
                  <div className="space-y-2">
                    <div className="inline-block max-w-[85%] rounded-2xl rounded-tl-sm bg-gray-200 px-4 py-2 text-sm text-gray-900">
                      {previewContent}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center text-sm text-muted-foreground">
              <p>{stats.charCount} characters</p>
              <p>
                {stats.segments} SMS segment{stats.segments !== 1 ? 's' : ''}
                {stats.isUnicode && ' (Unicode)'}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPreview(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={showDelete} onOpenChange={setShowDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete SMS Template</AlertDialogTitle>
            <AlertDialogDescription>
              {template.is_default ? (
                <>
                  This is a default template and will be deactivated instead of
                  deleted. You can reactivate it later.
                </>
              ) : (
                <>
                  Are you sure you want to delete &quot;{template.name}&quot;?
                  This action cannot be undone.
                </>
              )}
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
              {template.is_default ? 'Deactivate' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
