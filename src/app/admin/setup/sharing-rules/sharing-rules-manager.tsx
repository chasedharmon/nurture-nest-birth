'use client'

import { useState, useEffect } from 'react'
import {
  Loader2,
  Plus,
  Trash2,
  Edit2,
  AlertCircle,
  Check,
  Users,
  User,
  Lock,
  Unlock,
  Eye,
  Edit3,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
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
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  createSharingRule,
  updateSharingRule,
  deleteSharingRule,
  toggleSharingRuleActive,
  updateObjectSharingModel,
} from '@/app/actions/sharing-rules'
import type {
  ObjectDefinition,
  SharingRule,
  SharingModel,
} from '@/lib/crm/types'
import type { Role } from '@/lib/supabase/types'
import { getSharingModelDisplayName } from '@/lib/crm/record-sharing'

interface SharingRulesManagerProps {
  objects: Array<ObjectDefinition & { fieldCount: number }>
  roles: Role[]
  users: Array<{ id: string; full_name: string | null; email: string }>
  initialRules: SharingRule[]
}

const SHARING_MODELS: SharingModel[] = [
  'private',
  'read',
  'read_write',
  'full_access',
]

export function SharingRulesManager({
  objects,
  roles,
  users,
  initialRules,
}: SharingRulesManagerProps) {
  const [selectedObjectId, setSelectedObjectId] = useState<string>('')
  const [rules, setRules] = useState<SharingRule[]>(initialRules)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Dialog states
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [editingRule, setEditingRule] = useState<SharingRule | null>(null)
  const [deletingRuleId, setDeletingRuleId] = useState<string | null>(null)

  // Form state for creating/editing rules
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    access_level: 'read' as 'read' | 'read_write',
    share_with_type: 'role' as 'user' | 'role',
    share_with_id: '',
  })

  const selectedObject = objects.find(o => o.id === selectedObjectId)
  const filteredRules = selectedObjectId
    ? rules.filter(r => r.object_definition_id === selectedObjectId)
    : rules

  // Clear messages after timeout
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 3000)
      return () => clearTimeout(timer)
    }
    return undefined
  }, [successMessage])

  // Reset form when dialog closes
  useEffect(() => {
    if (!showCreateDialog) {
      setFormData({
        name: '',
        description: '',
        access_level: 'read',
        share_with_type: 'role',
        share_with_id: '',
      })
      setEditingRule(null)
    }
  }, [showCreateDialog])

  // Load rule data when editing
  useEffect(() => {
    if (editingRule) {
      setFormData({
        name: editingRule.name,
        description: editingRule.description || '',
        access_level: editingRule.access_level as 'read' | 'read_write',
        share_with_type: editingRule.share_with_type as 'user' | 'role',
        share_with_id: editingRule.share_with_id || '',
      })
    }
  }, [editingRule])

  // Handle sharing model change for an object
  const handleSharingModelChange = async (
    objectApiName: string,
    newModel: SharingModel
  ) => {
    setIsSaving(true)
    setError(null)

    try {
      const result = await updateObjectSharingModel(objectApiName, newModel)
      if (result.error) {
        setError(result.error)
        return
      }
      setSuccessMessage('Sharing model updated successfully')
      // Force re-render by updating the selected object
      setSelectedObjectId(prev => prev)
    } catch {
      setError('Failed to update sharing model')
    } finally {
      setIsSaving(false)
    }
  }

  // Handle create/update rule
  const handleSaveRule = async () => {
    if (!selectedObjectId || !formData.name || !formData.share_with_id) {
      setError('Please fill in all required fields')
      return
    }

    setIsSaving(true)
    setError(null)

    try {
      if (editingRule) {
        // Update existing rule
        const result = await updateSharingRule(editingRule.id, {
          name: formData.name,
          description: formData.description || null,
          access_level: formData.access_level,
          share_with_type: formData.share_with_type,
          share_with_id: formData.share_with_id,
        })

        if (result.error) {
          setError(result.error)
          return
        }

        if (result.data) {
          setRules(prev =>
            prev.map(r => (r.id === editingRule.id ? result.data! : r))
          )
        }
        setSuccessMessage('Sharing rule updated successfully')
      } else {
        // Create new rule
        const result = await createSharingRule({
          object_definition_id: selectedObjectId,
          name: formData.name,
          description: formData.description || null,
          access_level: formData.access_level,
          share_with_type: formData.share_with_type,
          share_with_id: formData.share_with_id,
          criteria: { conditions: [], match_type: 'all' },
          rule_type: 'criteria',
          owner_role_id: null,
          is_active: true,
        })

        if (result.error) {
          setError(result.error)
          return
        }

        if (result.data) {
          setRules(prev => [result.data!, ...prev])
        }
        setSuccessMessage('Sharing rule created successfully')
      }

      setShowCreateDialog(false)
    } catch {
      setError('Failed to save sharing rule')
    } finally {
      setIsSaving(false)
    }
  }

  // Handle delete rule
  const handleDeleteRule = async () => {
    if (!deletingRuleId) return

    setIsSaving(true)
    setError(null)

    try {
      const result = await deleteSharingRule(deletingRuleId)
      if (result.error) {
        setError(result.error)
        return
      }

      setRules(prev => prev.filter(r => r.id !== deletingRuleId))
      setSuccessMessage('Sharing rule deleted successfully')
      setShowDeleteDialog(false)
      setDeletingRuleId(null)
    } catch {
      setError('Failed to delete sharing rule')
    } finally {
      setIsSaving(false)
    }
  }

  // Handle toggle active
  const handleToggleActive = async (ruleId: string, currentActive: boolean) => {
    setError(null)

    try {
      const result = await toggleSharingRuleActive(ruleId, !currentActive)
      if (result.error) {
        setError(result.error)
        return
      }

      setRules(prev =>
        prev.map(r =>
          r.id === ruleId ? { ...r, is_active: !currentActive } : r
        )
      )
      setSuccessMessage(
        `Sharing rule ${!currentActive ? 'activated' : 'deactivated'}`
      )
    } catch {
      setError('Failed to toggle sharing rule')
    }
  }

  // Get share target name
  const getShareTargetName = (type: string, id: string | null) => {
    if (!id) return 'Unknown'
    if (type === 'role') {
      const role = roles.find(r => r.id === id)
      return role?.name || 'Unknown Role'
    }
    const user = users.find(u => u.id === id)
    return user?.full_name || user?.email || 'Unknown User'
  }

  return (
    <div className="space-y-6">
      {/* Error/Success Messages */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {successMessage && (
        <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20">
          <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
          <AlertDescription className="text-green-700 dark:text-green-400">
            {successMessage}
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="defaults" className="space-y-4">
        <TabsList>
          <TabsTrigger value="defaults">Organization-Wide Defaults</TabsTrigger>
          <TabsTrigger value="rules">Sharing Rules</TabsTrigger>
        </TabsList>

        {/* Organization-Wide Defaults Tab */}
        <TabsContent value="defaults" className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Set the default sharing model for each object. This determines
            baseline access for all users before sharing rules are applied.
          </p>

          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Object</TableHead>
                  <TableHead>Current Model</TableHead>
                  <TableHead className="w-[200px]">Change Model</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {objects.map(obj => (
                  <TableRow key={obj.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: obj.color }}
                        />
                        <span className="font-medium">{obj.label}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          obj.sharing_model === 'private'
                            ? 'destructive'
                            : obj.sharing_model === 'full_access'
                              ? 'default'
                              : 'secondary'
                        }
                      >
                        {obj.sharing_model === 'private' && (
                          <Lock className="mr-1 h-3 w-3" />
                        )}
                        {obj.sharing_model === 'full_access' && (
                          <Unlock className="mr-1 h-3 w-3" />
                        )}
                        {getSharingModelDisplayName(obj.sharing_model)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={obj.sharing_model}
                        onValueChange={value =>
                          handleSharingModelChange(
                            obj.api_name,
                            value as SharingModel
                          )
                        }
                        disabled={isSaving || obj.is_standard}
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {SHARING_MODELS.map(model => (
                            <SelectItem key={model} value={model}>
                              {getSharingModelDisplayName(model)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* Sharing Rules Tab */}
        <TabsContent value="rules" className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="space-y-1">
                <Label htmlFor="object-filter">Filter by Object</Label>
                <Select
                  value={selectedObjectId}
                  onValueChange={setSelectedObjectId}
                >
                  <SelectTrigger id="object-filter" className="w-[200px]">
                    <SelectValue placeholder="All objects" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All objects</SelectItem>
                    {objects.map(obj => (
                      <SelectItem key={obj.id} value={obj.id}>
                        {obj.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button
              onClick={() => setShowCreateDialog(true)}
              disabled={!selectedObjectId}
            >
              <Plus className="mr-2 h-4 w-4" />
              New Sharing Rule
            </Button>
          </div>

          {!selectedObjectId && (
            <div className="rounded-lg border-2 border-dashed py-12 text-center">
              <p className="text-muted-foreground">
                Select an object to view and manage its sharing rules
              </p>
            </div>
          )}

          {selectedObjectId && filteredRules.length === 0 && (
            <div className="rounded-lg border-2 border-dashed py-12 text-center">
              <p className="text-muted-foreground">
                No sharing rules for {selectedObject?.label}. Create one to
                grant additional access.
              </p>
            </div>
          )}

          {selectedObjectId && filteredRules.length > 0 && (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rule Name</TableHead>
                    <TableHead>Share With</TableHead>
                    <TableHead>Access Level</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRules.map(rule => (
                    <TableRow key={rule.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{rule.name}</div>
                          {rule.description && (
                            <div className="text-xs text-muted-foreground">
                              {rule.description}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {rule.share_with_type === 'role' ? (
                            <Users className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <User className="h-4 w-4 text-muted-foreground" />
                          )}
                          <span className="capitalize">
                            {getShareTargetName(
                              rule.share_with_type,
                              rule.share_with_id
                            )}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            rule.access_level === 'read_write'
                              ? 'default'
                              : 'secondary'
                          }
                        >
                          {rule.access_level === 'read' ? (
                            <Eye className="mr-1 h-3 w-3" />
                          ) : (
                            <Edit3 className="mr-1 h-3 w-3" />
                          )}
                          {rule.access_level === 'read'
                            ? 'Read Only'
                            : 'Read/Write'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={rule.is_active}
                            onCheckedChange={() =>
                              handleToggleActive(rule.id, rule.is_active)
                            }
                          />
                          <span
                            className={
                              rule.is_active
                                ? 'text-green-600'
                                : 'text-muted-foreground'
                            }
                          >
                            {rule.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setEditingRule(rule)
                              setShowCreateDialog(true)
                            }}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setDeletingRuleId(rule.id)
                              setShowDeleteDialog(true)
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Create/Edit Rule Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingRule ? 'Edit Sharing Rule' : 'Create Sharing Rule'}
            </DialogTitle>
            <DialogDescription>
              {editingRule
                ? 'Update the sharing rule configuration'
                : `Create a sharing rule for ${selectedObject?.label}`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="rule-name">Rule Name *</Label>
              <Input
                id="rule-name"
                value={formData.name}
                onChange={e =>
                  setFormData(prev => ({ ...prev, name: e.target.value }))
                }
                placeholder="e.g., Share with Sales Team"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="rule-description">Description</Label>
              <Textarea
                id="rule-description"
                value={formData.description}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Describe the purpose of this sharing rule"
                rows={2}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="share-with-type">Share With Type</Label>
                <Select
                  value={formData.share_with_type}
                  onValueChange={value =>
                    setFormData(prev => ({
                      ...prev,
                      share_with_type: value as 'user' | 'role',
                      share_with_id: '',
                    }))
                  }
                >
                  <SelectTrigger id="share-with-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="role">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Role
                      </div>
                    </SelectItem>
                    <SelectItem value="user">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        User
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="share-with-id">
                  {formData.share_with_type === 'role'
                    ? 'Select Role *'
                    : 'Select User *'}
                </Label>
                <Select
                  value={formData.share_with_id}
                  onValueChange={value =>
                    setFormData(prev => ({ ...prev, share_with_id: value }))
                  }
                >
                  <SelectTrigger id="share-with-id">
                    <SelectValue
                      placeholder={
                        formData.share_with_type === 'role'
                          ? 'Choose a role...'
                          : 'Choose a user...'
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {formData.share_with_type === 'role'
                      ? roles.map(role => (
                          <SelectItem key={role.id} value={role.id}>
                            <span className="capitalize">
                              {role.name.replace(/_/g, ' ')}
                            </span>
                          </SelectItem>
                        ))
                      : users.map(user => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.full_name || user.email}
                          </SelectItem>
                        ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="access-level">Access Level</Label>
              <Select
                value={formData.access_level}
                onValueChange={value =>
                  setFormData(prev => ({
                    ...prev,
                    access_level: value as 'read' | 'read_write',
                  }))
                }
              >
                <SelectTrigger id="access-level">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="read">
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4" />
                      Read Only - Can view but not edit
                    </div>
                  </SelectItem>
                  <SelectItem value="read_write">
                    <div className="flex items-center gap-2">
                      <Edit3 className="h-4 w-4" />
                      Read/Write - Can view and edit
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCreateDialog(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveRule} disabled={isSaving}>
              {isSaving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : editingRule ? (
                'Update Rule'
              ) : (
                'Create Rule'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Sharing Rule?</DialogTitle>
            <DialogDescription>
              This will permanently delete this sharing rule. Users who had
              access via this rule will lose that access.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteDialog(false)
                setDeletingRuleId(null)
              }}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteRule}
              disabled={isSaving}
            >
              {isSaving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              Delete Rule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
