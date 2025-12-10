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
  Copy,
  Link2,
  Eye,
  EyeOff,
  Check,
} from 'lucide-react'
import {
  toggleReferralPartnerStatus,
  deleteReferralPartner,
} from '@/app/actions/referral-partners'
import { ReferralPartnerDialog } from './referral-partner-dialog'
import type { ReferralPartner } from '@/lib/supabase/types'

interface ReferralPartnerActionsProps {
  partner: ReferralPartner
}

export function ReferralPartnerActions({
  partner,
}: ReferralPartnerActionsProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [copied, setCopied] = useState(false)
  const router = useRouter()

  const handleToggleStatus = () => {
    startTransition(async () => {
      await toggleReferralPartnerStatus(partner.id)
      router.refresh()
    })
  }

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteReferralPartner(partner.id)
      if (result.success) {
        setShowDeleteDialog(false)
        router.refresh()
      }
    })
  }

  const handleCopyReferralLink = async () => {
    if (partner.referral_code) {
      const baseUrl = window.location.origin
      const referralUrl = `${baseUrl}/contact?ref=${partner.referral_code}`
      await navigator.clipboard.writeText(referralUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleCopyReferralCode = async () => {
    if (partner.referral_code) {
      await navigator.clipboard.writeText(partner.referral_code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" disabled={isPending}>
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Actions</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <ReferralPartnerDialog mode="edit" partner={partner}>
            <DropdownMenuItem onSelect={e => e.preventDefault()}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
          </ReferralPartnerDialog>

          <DropdownMenuSeparator />

          {partner.referral_code && (
            <>
              <DropdownMenuItem onClick={handleCopyReferralLink}>
                {copied ? (
                  <Check className="mr-2 h-4 w-4 text-green-500" />
                ) : (
                  <Link2 className="mr-2 h-4 w-4" />
                )}
                Copy Referral Link
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleCopyReferralCode}>
                <Copy className="mr-2 h-4 w-4" />
                Copy Code: {partner.referral_code}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}

          <DropdownMenuItem onClick={handleToggleStatus}>
            {partner.is_active ? (
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

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Referral Partner?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <strong>{partner.name}</strong> and
              remove their referral tracking data. This action cannot be undone.
              {partner.lead_count > 0 && (
                <span className="mt-2 block text-amber-600 dark:text-amber-400">
                  Warning: This partner has {partner.lead_count} referred lead
                  {partner.lead_count !== 1 ? 's' : ''}.
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
