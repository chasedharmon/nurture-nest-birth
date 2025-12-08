'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
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
  toggleContractTemplateActive,
  deleteContractTemplate,
} from '@/app/actions/setup'
import type { ContractTemplate } from '@/lib/supabase/types'
import {
  MoreHorizontal,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  Star,
  FileText,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface ContractTemplatesTableProps {
  templates: ContractTemplate[]
}

const serviceTypeColors: Record<string, string> = {
  birth_doula:
    'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300',
  postpartum_doula:
    'bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300',
  lactation_consulting:
    'bg-pink-50 text-pink-700 dark:bg-pink-900/20 dark:text-pink-300',
  childbirth_education:
    'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300',
  other: 'bg-gray-50 text-gray-700 dark:bg-gray-900/20 dark:text-gray-300',
}

const serviceTypeLabels: Record<string, string> = {
  birth_doula: 'Birth Doula',
  postpartum_doula: 'Postpartum Doula',
  lactation_consulting: 'Lactation Consulting',
  childbirth_education: 'Childbirth Education',
  other: 'Other',
}

export function ContractTemplatesTable({
  templates,
}: ContractTemplatesTableProps) {
  const router = useRouter()
  const [deletingTemplate, setDeletingTemplate] =
    useState<ContractTemplate | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const handleToggleActive = async (template: ContractTemplate) => {
    setIsProcessing(true)
    try {
      await toggleContractTemplateActive(template.id, !template.is_active)
      router.refresh()
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDelete = async () => {
    if (!deletingTemplate) return

    setIsProcessing(true)
    try {
      const result = await deleteContractTemplate(deletingTemplate.id)
      if (!result.success) {
        alert(result.error || 'Failed to delete template')
      }
      router.refresh()
    } finally {
      setIsProcessing(false)
      setDeletingTemplate(null)
    }
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border">
            <tr>
              <th className="px-4 py-3 font-medium text-muted-foreground">
                Template
              </th>
              <th className="px-4 py-3 font-medium text-muted-foreground">
                Service Type
              </th>
              <th className="px-4 py-3 font-medium text-muted-foreground">
                Version
              </th>
              <th className="px-4 py-3 font-medium text-muted-foreground">
                Status
              </th>
              <th className="px-4 py-3 font-medium text-muted-foreground">
                Updated
              </th>
              <th className="px-4 py-3 font-medium text-muted-foreground">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {templates.map(template => (
              <tr key={template.id} className="hover:bg-muted/50">
                <td className="px-4 py-4">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-foreground">
                        {template.name}
                        {template.is_default && (
                          <Star className="ml-2 inline h-4 w-4 text-amber-500" />
                        )}
                      </p>
                      {template.description && (
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {template.description}
                        </p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4">
                  {template.service_type ? (
                    <Badge
                      variant="outline"
                      className={
                        serviceTypeColors[template.service_type] ||
                        serviceTypeColors.other
                      }
                    >
                      {serviceTypeLabels[template.service_type] ||
                        template.service_type}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground">General</span>
                  )}
                </td>
                <td className="px-4 py-4 text-muted-foreground">
                  v{template.version}
                </td>
                <td className="px-4 py-4">
                  {template.is_active ? (
                    <Badge className="bg-green-100 text-green-800 border-0 dark:bg-green-900/20 dark:text-green-300">
                      Active
                    </Badge>
                  ) : (
                    <Badge className="bg-gray-100 text-gray-800 border-0 dark:bg-gray-900/20 dark:text-gray-300">
                      Inactive
                    </Badge>
                  )}
                </td>
                <td className="px-4 py-4 text-muted-foreground">
                  {formatDistanceToNow(new Date(template.updated_at), {
                    addSuffix: true,
                  })}
                </td>
                <td className="px-4 py-4">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" disabled={isProcessing}>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/admin/setup/contracts/${template.id}`}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit Template
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleToggleActive(template)}
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
                        className="text-destructive"
                        onClick={() => setDeletingTemplate(template)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Template
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {templates.length === 0 && (
          <div className="py-12 text-center text-muted-foreground">
            No contract templates found. Create your first template to get
            started.
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={deletingTemplate !== null}
        onOpenChange={() => setDeletingTemplate(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Contract Template</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deletingTemplate?.name}
              &quot;?
              {deletingTemplate?.is_active && (
                <span className="block mt-2 text-amber-600">
                  Note: This template will be deactivated instead of deleted if
                  it has been used for signed contracts.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isProcessing}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isProcessing ? 'Deleting...' : 'Delete Template'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
