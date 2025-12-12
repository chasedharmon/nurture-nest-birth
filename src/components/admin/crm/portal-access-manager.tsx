'use client'

import { useState, useTransition } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
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
  grantPortalAccess,
  revokePortalAccess,
  type CrmRecordType,
} from '@/app/actions/client-auth'
import {
  Shield,
  Mail,
  User,
  CheckCircle2,
  XCircle,
  Loader2,
  Send,
  KeyRound,
} from 'lucide-react'
import { toast } from 'sonner'

interface PortalAccessManagerProps {
  recordType: CrmRecordType
  recordId: string
  recordName: string
  email: string | null
  portalAccessEnabled: boolean
}

export function PortalAccessManager({
  recordType,
  recordId,
  recordName,
  email,
  portalAccessEnabled: initialAccess,
}: PortalAccessManagerProps) {
  const [isPending, startTransition] = useTransition()
  const [portalAccessEnabled, setPortalAccessEnabled] = useState(initialAccess)
  const [showRevokeDialog, setShowRevokeDialog] = useState(false)

  const handleToggleAccess = async (sendInvite: boolean = false) => {
    if (!portalAccessEnabled) {
      // Granting access
      startTransition(async () => {
        const result = await grantPortalAccess(recordType, recordId, sendInvite)
        if (result.success) {
          setPortalAccessEnabled(true)
          toast.success('Portal Access Granted', {
            description: sendInvite
              ? `${recordName} has been granted portal access and sent an invitation email.`
              : `${recordName} has been granted portal access.`,
          })
        } else {
          toast.error('Failed to grant access', {
            description: result.error,
          })
        }
      })
    } else {
      // Show confirmation for revoking
      setShowRevokeDialog(true)
    }
  }

  const handleRevokeAccess = async () => {
    startTransition(async () => {
      const result = await revokePortalAccess(recordType, recordId)
      if (result.success) {
        setPortalAccessEnabled(false)
        setShowRevokeDialog(false)
        toast.success('Portal Access Revoked', {
          description: `${recordName}'s portal access has been revoked and all sessions invalidated.`,
        })
      } else {
        toast.error('Failed to revoke access', {
          description: result.error,
        })
      }
    })
  }

  const handleSendInvite = async () => {
    if (!portalAccessEnabled) {
      // If not enabled, grant with invite
      handleToggleAccess(true)
    } else {
      // Already has access, just send invite
      startTransition(async () => {
        const result = await grantPortalAccess(recordType, recordId, true)
        if (result.success) {
          toast.success('Portal Invite Sent', {
            description: `An invitation email has been sent to ${email}.`,
          })
        } else {
          toast.error('Failed to send invite', {
            description: result.error,
          })
        }
      })
    }
  }

  const recordTypeLabel = recordType === 'contact' ? 'Contact' : 'Lead'

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg">Portal Access</CardTitle>
              <CardDescription>
                Manage client portal access for this{' '}
                {recordTypeLabel.toLowerCase()}
              </CardDescription>
            </div>
          </div>
          <Badge
            variant={portalAccessEnabled ? 'default' : 'secondary'}
            className={
              portalAccessEnabled
                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                : ''
            }
          >
            {portalAccessEnabled ? (
              <>
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Enabled
              </>
            ) : (
              <>
                <XCircle className="h-3 w-3 mr-1" />
                Disabled
              </>
            )}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Portal Access Toggle */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="portal-access" className="text-base">
              Enable Portal Access
            </Label>
            <p className="text-sm text-muted-foreground">
              {portalAccessEnabled
                ? 'This client can log into the portal'
                : 'Enable to allow this client to log into the portal'}
            </p>
          </div>
          <Switch
            id="portal-access"
            checked={portalAccessEnabled}
            onCheckedChange={() => handleToggleAccess(false)}
            disabled={isPending}
          />
        </div>

        {/* Email Status */}
        {email ? (
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">Login Email</p>
              <p className="text-sm text-muted-foreground truncate">{email}</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-900/30">
            <Mail className="h-4 w-4 text-yellow-600" />
            <div className="flex-1">
              <p className="text-sm font-medium text-yellow-800 dark:text-yellow-400">
                No Email Address
              </p>
              <p className="text-sm text-yellow-600 dark:text-yellow-500">
                An email address is required for portal login
              </p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 pt-2">
          {/* Send/Resend Portal Invite */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleSendInvite}
            disabled={isPending || !email}
            className="gap-2"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            {portalAccessEnabled
              ? 'Resend Invite'
              : 'Grant Access & Send Invite'}
          </Button>

          {/* Login As (if enabled) */}
          {portalAccessEnabled && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                window.open(`/admin/clients/${recordId}/login-as`, '_blank')
              }}
              className="gap-2"
            >
              <User className="h-4 w-4" />
              Login As {recordTypeLabel}
            </Button>
          )}

          {/* Password Reset (if enabled) */}
          {portalAccessEnabled && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleSendInvite}
              disabled={isPending || !email}
              className="gap-2"
            >
              <KeyRound className="h-4 w-4" />
              Send Password Reset
            </Button>
          )}
        </div>

        {/* Info about portal experience */}
        <div className="pt-4 border-t">
          <p className="text-xs text-muted-foreground">
            {recordType === 'lead' ? (
              <>
                <strong>Lead Portal Experience:</strong> Limited access
                including profile view, messages, and intake forms. Full portal
                features become available after conversion to Contact.
              </>
            ) : (
              <>
                <strong>Contact Portal Experience:</strong> Full access
                including services, meetings, documents, invoices, and journey
                tracking.
              </>
            )}
          </p>
        </div>
      </CardContent>

      {/* Revoke Access Confirmation Dialog */}
      <AlertDialog open={showRevokeDialog} onOpenChange={setShowRevokeDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke Portal Access?</AlertDialogTitle>
            <AlertDialogDescription>
              This will immediately revoke portal access for {recordName}. All
              active sessions will be invalidated and they will no longer be
              able to log in.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRevokeAccess}
              disabled={isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Revoking...
                </>
              ) : (
                'Revoke Access'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}
