'use client'

import { useState, useTransition } from 'react'
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
  MoreHorizontal,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  BarChart3,
} from 'lucide-react'
import { deleteSurvey, updateSurvey } from '@/app/actions/surveys'
import { SurveyDialog } from './survey-dialog'
import type { Survey } from '@/lib/supabase/types'
import Link from 'next/link'

interface SurveyActionsProps {
  survey: Survey
}

export function SurveyActions({ survey }: SurveyActionsProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const handleToggleStatus = () => {
    startTransition(async () => {
      await updateSurvey(survey.id, { is_active: !survey.is_active })
      router.refresh()
    })
  }

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteSurvey(survey.id)
      if (result.success) {
        setShowDeleteDialog(false)
        router.refresh()
      }
    })
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <Link href={`/admin/surveys/${survey.id}`}>
          <Button variant="outline" size="sm">
            <BarChart3 className="mr-1 h-4 w-4" />
            View Results
          </Button>
        </Link>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" disabled={isPending}>
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">Actions</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <SurveyDialog mode="edit" survey={survey}>
              <DropdownMenuItem onSelect={e => e.preventDefault()}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit Survey
              </DropdownMenuItem>
            </SurveyDialog>

            <DropdownMenuItem asChild>
              <Link
                href={`/admin/surveys/${survey.id}`}
                className="flex items-center"
              >
                <BarChart3 className="mr-2 h-4 w-4" />
                View Results
              </Link>
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem onClick={handleToggleStatus}>
              {survey.is_active ? (
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
              onClick={() => setShowDeleteDialog(true)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Survey?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <strong>{survey.name}</strong> and
              all its responses. This action cannot be undone.
              {survey.response_count > 0 && (
                <span className="mt-2 block text-amber-600 dark:text-amber-400">
                  Warning: This survey has {survey.response_count} response
                  {survey.response_count !== 1 ? 's' : ''}.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
