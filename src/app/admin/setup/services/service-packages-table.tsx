'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
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
  deleteServicePackage,
  toggleServicePackageActive,
} from '@/app/actions/setup'
import type { ServicePackage } from '@/lib/supabase/types'
import { MoreHorizontal, Pencil, Trash2, Star, DollarSign } from 'lucide-react'

interface ServicePackagesTableProps {
  packages: ServicePackage[]
}

const SERVICE_TYPE_LABELS: Record<string, string> = {
  birth_doula: 'Birth Doula',
  postpartum_doula: 'Postpartum Doula',
  lactation_consulting: 'Lactation Consulting',
  childbirth_education: 'Childbirth Education',
  other: 'Other',
}

const SERVICE_TYPE_COLORS: Record<string, string> = {
  birth_doula:
    'bg-pink-100 text-pink-800 dark:bg-pink-900/20 dark:text-pink-300',
  postpartum_doula:
    'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300',
  lactation_consulting:
    'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300',
  childbirth_education:
    'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300',
  other: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300',
}

export function ServicePackagesTable({ packages }: ServicePackagesTableProps) {
  const router = useRouter()
  const [deletingPackage, setDeletingPackage] = useState<ServicePackage | null>(
    null
  )
  const [isProcessing, setIsProcessing] = useState(false)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  const handleDelete = async () => {
    if (!deletingPackage) return

    setIsProcessing(true)
    try {
      const result = await deleteServicePackage(deletingPackage.id)
      if (!result.success) {
        alert(result.error || 'Failed to delete package')
      }
      router.refresh()
    } finally {
      setIsProcessing(false)
      setDeletingPackage(null)
    }
  }

  const handleToggleActive = async (pkg: ServicePackage) => {
    setTogglingId(pkg.id)
    try {
      const result = await toggleServicePackageActive(pkg.id, !pkg.is_active)
      if (!result.success) {
        alert(result.error || 'Failed to toggle package')
      }
      router.refresh()
    } finally {
      setTogglingId(null)
    }
  }

  const formatPrice = (price: number, priceType: string) => {
    const formatted = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price)

    if (priceType === 'hourly') {
      return `${formatted}/hr`
    }
    return formatted
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border">
            <tr>
              <th className="px-4 py-3 font-medium text-muted-foreground">
                Package
              </th>
              <th className="px-4 py-3 font-medium text-muted-foreground">
                Type
              </th>
              <th className="px-4 py-3 font-medium text-muted-foreground">
                Price
              </th>
              <th className="px-4 py-3 font-medium text-muted-foreground">
                Features
              </th>
              <th className="px-4 py-3 font-medium text-muted-foreground">
                Active
              </th>
              <th className="px-4 py-3 font-medium text-muted-foreground">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {packages.map(pkg => (
              <tr key={pkg.id} className="hover:bg-muted/50">
                <td className="px-4 py-4">
                  <div className="flex items-start gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground">
                          {pkg.name}
                        </span>
                        {pkg.is_featured && (
                          <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                        )}
                      </div>
                      {pkg.description && (
                        <p className="mt-1 max-w-xs text-xs text-muted-foreground line-clamp-2">
                          {pkg.description}
                        </p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <Badge
                    className={`${SERVICE_TYPE_COLORS[pkg.service_type] || SERVICE_TYPE_COLORS.other} border-0`}
                  >
                    {SERVICE_TYPE_LABELS[pkg.service_type] || pkg.service_type}
                  </Badge>
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-1">
                    <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="font-medium">
                      {formatPrice(pkg.base_price, pkg.price_type)}
                    </span>
                  </div>
                  {pkg.price_type === 'custom' && (
                    <span className="text-xs text-muted-foreground">
                      Custom
                    </span>
                  )}
                </td>
                <td className="px-4 py-4">
                  <div className="max-w-xs">
                    {pkg.included_features.length > 0 ? (
                      <span className="text-sm text-muted-foreground">
                        {pkg.included_features.length} feature
                        {pkg.included_features.length !== 1 ? 's' : ''} included
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-4">
                  <Switch
                    checked={pkg.is_active}
                    onCheckedChange={() => handleToggleActive(pkg)}
                    disabled={togglingId === pkg.id}
                  />
                </td>
                <td className="px-4 py-4">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem disabled>
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit Package
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => setDeletingPackage(pkg)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Package
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {packages.length === 0 && (
          <div className="py-12 text-center text-muted-foreground">
            No service packages found. Create your first package to get started.
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={deletingPackage !== null}
        onOpenChange={() => setDeletingPackage(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Package</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deletingPackage?.name}
              &quot;? This action cannot be undone.
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
              {isProcessing ? 'Deleting...' : 'Delete Package'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
