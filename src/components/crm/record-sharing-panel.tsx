'use client'

import { useState, useEffect } from 'react'
import {
  Loader2,
  Plus,
  Trash2,
  Users,
  User,
  Eye,
  Edit3,
  Share2,
  AlertCircle,
  Check,
  Crown,
  Clock,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { format } from 'date-fns'
import {
  getManualShares,
  createManualShare,
  deleteManualShare,
  getShareTargets,
  getRecordSharingInfo,
} from '@/app/actions/sharing-rules'
import type {
  ManualShare,
  RecordSharingInfo,
  RecordAccessLevel,
} from '@/lib/crm/types'

interface RecordSharingPanelProps {
  objectApiName: string
  recordId: string
  ownerId: string | null
  isOwner?: boolean
  canManageSharing?: boolean
}

export function RecordSharingPanel({
  objectApiName,
  recordId,
  ownerId,
  isOwner = false,
  canManageSharing = false,
}: RecordSharingPanelProps) {
  const [shares, setShares] = useState<ManualShare[]>([])
  const [sharingInfo, setSharingInfo] = useState<RecordSharingInfo[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [showShareDialog, setShowShareDialog] = useState(false)

  // Share targets (users and roles)
  const [users, setUsers] = useState<
    Array<{ id: string; full_name: string | null; email: string }>
  >([])
  const [roles, setRoles] = useState<Array<{ id: string; name: string }>>([])

  // Form state
  const [shareWithType, setShareWithType] = useState<'user' | 'role'>('user')
  const [shareWithId, setShareWithId] = useState('')
  const [accessLevel, setAccessLevel] = useState<RecordAccessLevel>('read')
  const [reason, setReason] = useState('')
  const [expiresAt, setExpiresAt] = useState<Date | undefined>(undefined)

  // Load data
  useEffect(() => {
    async function loadData() {
      setIsLoading(true)
      setError(null)

      try {
        const [sharesResult, targetsResult, infoResult] = await Promise.all([
          getManualShares(objectApiName, recordId),
          getShareTargets(),
          ownerId
            ? getRecordSharingInfo(objectApiName, recordId, ownerId)
            : Promise.resolve({ data: [], error: null }),
        ])

        if (sharesResult.error) {
          setError(sharesResult.error)
          return
        }

        setShares(sharesResult.data || [])

        if (targetsResult.data) {
          setUsers(targetsResult.data.users)
          setRoles(targetsResult.data.roles)
        }

        if (infoResult.data) {
          setSharingInfo(infoResult.data)
        }
      } catch {
        setError('Failed to load sharing information')
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [objectApiName, recordId, ownerId])

  // Clear messages
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 3000)
      return () => clearTimeout(timer)
    }
    return undefined
  }, [successMessage])

  // Reset form when dialog closes
  useEffect(() => {
    if (!showShareDialog) {
      setShareWithType('user')
      setShareWithId('')
      setAccessLevel('read')
      setReason('')
      setExpiresAt(undefined)
    }
  }, [showShareDialog])

  // Handle share creation
  const handleShare = async () => {
    if (!shareWithId) {
      setError('Please select a user or role to share with')
      return
    }

    setIsSaving(true)
    setError(null)

    try {
      const result = await createManualShare({
        organization_id: '', // Will be set by server
        object_api_name: objectApiName,
        record_id: recordId,
        share_with_type: shareWithType,
        share_with_id: shareWithId,
        access_level: accessLevel,
        reason: reason || null,
        expires_at: expiresAt ? expiresAt.toISOString() : null,
      })

      if (result.error) {
        setError(result.error)
        return
      }

      if (result.data) {
        setShares(prev => [...prev, result.data!])
      }

      setSuccessMessage('Record shared successfully')
      setShowShareDialog(false)
    } catch {
      setError('Failed to share record')
    } finally {
      setIsSaving(false)
    }
  }

  // Handle share removal
  const handleRemoveShare = async (shareId: string) => {
    setIsSaving(true)
    setError(null)

    try {
      const result = await deleteManualShare(shareId)
      if (result.error) {
        setError(result.error)
        return
      }

      setShares(prev => prev.filter(s => s.id !== shareId))
      setSuccessMessage('Share removed successfully')
    } catch {
      setError('Failed to remove share')
    } finally {
      setIsSaving(false)
    }
  }

  // Get target name
  const getTargetName = (type: 'user' | 'role', id: string) => {
    if (type === 'role') {
      const role = roles.find(r => r.id === id)
      return role?.name || 'Unknown Role'
    }
    const user = users.find(u => u.id === id)
    return user?.full_name || user?.email || 'Unknown User'
  }

  // Compact mode for detail page sidebar
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Share2 className="h-4 w-4" />
            Sharing
          </CardTitle>
          {(isOwner || canManageSharing) && (
            <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Plus className="mr-1 h-3 w-3" />
                  Share
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Share This Record</DialogTitle>
                  <DialogDescription>
                    Grant access to this record to a user or role
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Share With</Label>
                      <Select
                        value={shareWithType}
                        onValueChange={value => {
                          setShareWithType(value as 'user' | 'role')
                          setShareWithId('')
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="user">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4" />
                              User
                            </div>
                          </SelectItem>
                          <SelectItem value="role">
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4" />
                              Role
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>
                        {shareWithType === 'user'
                          ? 'Select User'
                          : 'Select Role'}
                      </Label>
                      <Select
                        value={shareWithId}
                        onValueChange={setShareWithId}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Choose..." />
                        </SelectTrigger>
                        <SelectContent>
                          {shareWithType === 'user'
                            ? users.map(u => (
                                <SelectItem key={u.id} value={u.id}>
                                  {u.full_name || u.email}
                                </SelectItem>
                              ))
                            : roles.map(r => (
                                <SelectItem key={r.id} value={r.id}>
                                  <span className="capitalize">
                                    {r.name.replace(/_/g, ' ')}
                                  </span>
                                </SelectItem>
                              ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Access Level</Label>
                    <Select
                      value={accessLevel}
                      onValueChange={value =>
                        setAccessLevel(value as RecordAccessLevel)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="read">
                          <div className="flex items-center gap-2">
                            <Eye className="h-4 w-4" />
                            Read Only
                          </div>
                        </SelectItem>
                        <SelectItem value="read_write">
                          <div className="flex items-center gap-2">
                            <Edit3 className="h-4 w-4" />
                            Read/Write
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Reason (optional)</Label>
                    <Input
                      value={reason}
                      onChange={e => setReason(e.target.value)}
                      placeholder="Why are you sharing this record?"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Expires (optional)</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                        >
                          <Clock className="mr-2 h-4 w-4" />
                          {expiresAt
                            ? format(expiresAt, 'PPP')
                            : 'No expiration'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={expiresAt}
                          onSelect={setExpiresAt}
                          disabled={date => date < new Date()}
                          initialFocus
                        />
                        {expiresAt && (
                          <div className="border-t p-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="w-full"
                              onClick={() => setExpiresAt(undefined)}
                            >
                              Clear expiration
                            </Button>
                          </div>
                        )}
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setShowShareDialog(false)}
                    disabled={isSaving}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleShare} disabled={isSaving}>
                    {isSaving ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Share2 className="mr-2 h-4 w-4" />
                    )}
                    Share
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
        <CardDescription>
          {shares.length} {shares.length === 1 ? 'person' : 'people'} have
          access
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Error/Success Messages */}
        {error && (
          <Alert variant="destructive" className="py-2">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs">{error}</AlertDescription>
          </Alert>
        )}

        {successMessage && (
          <Alert className="border-green-200 bg-green-50 py-2 dark:border-green-800 dark:bg-green-900/20">
            <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
            <AlertDescription className="text-xs text-green-700 dark:text-green-400">
              {successMessage}
            </AlertDescription>
          </Alert>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Sharing Info List */}
        {!isLoading && (
          <div className="space-y-2">
            {/* Owner */}
            {sharingInfo
              .filter(info => info.access_source === 'owner')
              .map(info => (
                <div
                  key={`owner-${info.user_id}`}
                  className="flex items-center justify-between rounded-lg border bg-muted/30 p-2"
                >
                  <div className="flex items-center gap-2">
                    <Crown className="h-4 w-4 text-amber-500" />
                    <div>
                      <div className="text-sm font-medium">
                        {info.user_name || info.user_email}
                      </div>
                      <div className="text-xs text-muted-foreground">Owner</div>
                    </div>
                  </div>
                  <Badge variant="secondary">Full Access</Badge>
                </div>
              ))}

            {/* Manual Shares */}
            {shares.map(share => (
              <div
                key={share.id}
                className="flex items-center justify-between rounded-lg border p-2"
              >
                <div className="flex items-center gap-2">
                  {share.share_with_type === 'role' ? (
                    <Users className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <User className="h-4 w-4 text-muted-foreground" />
                  )}
                  <div>
                    <div className="text-sm font-medium capitalize">
                      {getTargetName(
                        share.share_with_type,
                        share.share_with_id
                      )}
                    </div>
                    {share.reason && (
                      <div className="text-xs text-muted-foreground">
                        {share.reason}
                      </div>
                    )}
                    {share.expires_at && (
                      <div className="text-xs text-amber-600">
                        Expires {format(new Date(share.expires_at), 'PP')}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      share.access_level === 'read_write'
                        ? 'default'
                        : 'secondary'
                    }
                  >
                    {share.access_level === 'read' ? (
                      <Eye className="mr-1 h-3 w-3" />
                    ) : (
                      <Edit3 className="mr-1 h-3 w-3" />
                    )}
                    {share.access_level === 'read' ? 'Read' : 'Edit'}
                  </Badge>
                  {(isOwner || canManageSharing) && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => handleRemoveShare(share.id)}
                      disabled={isSaving}
                    >
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  )}
                </div>
              </div>
            ))}

            {/* Empty State */}
            {shares.length === 0 &&
              sharingInfo.filter(i => i.access_source !== 'owner').length ===
                0 && (
                <div className="rounded-lg border-2 border-dashed py-4 text-center">
                  <p className="text-xs text-muted-foreground">
                    No additional shares. Only the owner has access.
                  </p>
                </div>
              )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
