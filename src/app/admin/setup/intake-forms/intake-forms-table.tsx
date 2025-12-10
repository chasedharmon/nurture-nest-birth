'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  toggleIntakeFormTemplateActive,
  deleteIntakeFormTemplate,
  type IntakeFormTemplate,
} from '@/app/actions/setup'
import { IntakeFormBuilderDialog } from '@/components/admin/setup/intake-form-builder-dialog'
import {
  MoreHorizontal,
  Eye,
  EyeOff,
  ClipboardList,
  Pencil,
  Trash2,
  Loader2,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface IntakeFormsTableProps {
  templates: IntakeFormTemplate[]
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

export function IntakeFormsTable({ templates }: IntakeFormsTableProps) {
  const router = useRouter()
  const [isProcessing, setIsProcessing] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [templateToDelete, setTemplateToDelete] =
    useState<IntakeFormTemplate | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleToggleActive = async (template: IntakeFormTemplate) => {
    setIsProcessing(true)
    try {
      await toggleIntakeFormTemplateActive(template.id, !template.is_active)
      router.refresh()
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDelete = async () => {
    if (!templateToDelete) return

    setIsDeleting(true)
    try {
      await deleteIntakeFormTemplate(templateToDelete.id)
      setDeleteDialogOpen(false)
      setTemplateToDelete(null)
      router.refresh()
    } finally {
      setIsDeleting(false)
    }
  }

  const openDeleteDialog = (template: IntakeFormTemplate) => {
    setTemplateToDelete(template)
    setDeleteDialogOpen(true)
  }

  const countFields = (schema: Record<string, unknown>): number => {
    if (!schema || typeof schema !== 'object') return 0

    // Count properties if it's a JSON schema
    if (schema.properties && typeof schema.properties === 'object') {
      return Object.keys(schema.properties).length
    }

    // Count fields if it's a custom format
    if (Array.isArray(schema.fields)) {
      return schema.fields.length
    }

    return 0
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border">
            <tr>
              <th className="px-4 py-3 font-medium text-muted-foreground">
                Form Name
              </th>
              <th className="px-4 py-3 font-medium text-muted-foreground">
                Service Type
              </th>
              <th className="px-4 py-3 font-medium text-muted-foreground">
                Fields
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
                    <ClipboardList className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-foreground">
                        {template.name}
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
                  {countFields(template.form_schema)} field
                  {countFields(template.form_schema) !== 1 ? 's' : ''}
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
                      <IntakeFormBuilderDialog
                        template={template}
                        trigger={
                          <DropdownMenuItem onSelect={e => e.preventDefault()}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                        }
                      />
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
                        onClick={() => openDeleteDialog(template)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
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
            No intake forms found. Click &quot;New Form&quot; to create one.
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Intake Form</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{templateToDelete?.name}
              &quot;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
