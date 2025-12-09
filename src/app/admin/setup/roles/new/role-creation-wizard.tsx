'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { createRole } from '@/app/actions/setup'
import type { Permissions, PermissionAction } from '@/lib/supabase/types'
import {
  PERMISSION_OBJECTS,
  PERMISSION_ACTIONS,
  PERMISSION_OBJECT_LABELS,
  PERMISSION_ACTION_LABELS,
} from '@/lib/permissions'
import {
  Loader2,
  ChevronRight,
  ChevronLeft,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Eye,
  Check,
} from 'lucide-react'

type WizardStep = 'details' | 'preset' | 'permissions' | 'review'

interface RolePreset {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  permissions: Permissions
  hierarchyLevel: number
  color: string
}

const ROLE_PRESETS: RolePreset[] = [
  {
    id: 'admin',
    name: 'Administrator',
    description: 'Full access to all features and settings',
    icon: <ShieldCheck className="h-6 w-6" />,
    permissions: { '*': ['*'] },
    hierarchyLevel: 1,
    color: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300',
  },
  {
    id: 'power_user',
    name: 'Power User',
    description: 'Full access except system settings and team management',
    icon: <Shield className="h-6 w-6" />,
    permissions: {
      leads: ['create', 'read', 'update', 'delete'],
      clients: ['create', 'read', 'update', 'delete'],
      invoices: ['create', 'read', 'update', 'delete'],
      meetings: ['create', 'read', 'update', 'delete'],
      documents: ['create', 'read', 'update', 'delete'],
      reports: ['create', 'read', 'update', 'delete'],
      dashboards: ['create', 'read', 'update', 'delete'],
      services: ['create', 'read', 'update', 'delete'],
      contracts: ['create', 'read', 'update', 'delete'],
    },
    hierarchyLevel: 2,
    color:
      'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-300',
  },
  {
    id: 'user',
    name: 'Standard User',
    description: 'Create and manage clients, meetings, and basic operations',
    icon: <ShieldAlert className="h-6 w-6" />,
    permissions: {
      leads: ['create', 'read', 'update'],
      clients: ['create', 'read', 'update'],
      invoices: ['read'],
      meetings: ['create', 'read', 'update'],
      documents: ['create', 'read'],
      reports: ['read'],
      dashboards: ['read'],
      services: ['read'],
      contracts: ['read'],
    },
    hierarchyLevel: 3,
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300',
  },
  {
    id: 'viewer',
    name: 'Viewer',
    description: 'Read-only access to all records',
    icon: <Eye className="h-6 w-6" />,
    permissions: {
      leads: ['read'],
      clients: ['read'],
      invoices: ['read'],
      meetings: ['read'],
      documents: ['read'],
      reports: ['read'],
      dashboards: ['read'],
      services: ['read'],
      contracts: ['read'],
    },
    hierarchyLevel: 4,
    color: 'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-300',
  },
  {
    id: 'custom',
    name: 'Custom',
    description: 'Start from scratch and define your own permissions',
    icon: <Shield className="h-6 w-6" />,
    permissions: {},
    hierarchyLevel: 100,
    color:
      'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300',
  },
]

export function RoleCreationWizard() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState<WizardStep>('details')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    description: '',
  })
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null)
  const [permissions, setPermissions] = useState<Permissions>({})

  const steps: WizardStep[] = ['details', 'preset', 'permissions', 'review']
  const currentStepIndex = steps.indexOf(currentStep)

  const canProceed = () => {
    switch (currentStep) {
      case 'details':
        return formData.name.trim().length >= 2
      case 'preset':
        return selectedPreset !== null
      case 'permissions':
        return true
      case 'review':
        return true
      default:
        return false
    }
  }

  const handleNext = () => {
    if (currentStep === 'preset' && selectedPreset) {
      const preset = ROLE_PRESETS.find(p => p.id === selectedPreset)
      if (preset) {
        setPermissions({ ...preset.permissions })
      }
    }
    const nextIndex = currentStepIndex + 1
    if (nextIndex < steps.length) {
      const nextStep = steps[nextIndex]
      if (nextStep) {
        setCurrentStep(nextStep)
      }
    }
  }

  const handleBack = () => {
    const prevIndex = currentStepIndex - 1
    if (prevIndex >= 0) {
      const prevStep = steps[prevIndex]
      if (prevStep) {
        setCurrentStep(prevStep)
      }
    }
  }

  const handleSubmit = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const preset = ROLE_PRESETS.find(p => p.id === selectedPreset)
      const result = await createRole({
        name: formData.name,
        description: formData.description || undefined,
        permissions,
        hierarchyLevel: preset?.hierarchyLevel ?? 100,
      })

      if (result.success) {
        router.push('/admin/setup/roles')
        router.refresh()
      } else {
        setError(result.error || 'Failed to create role')
      }
    } catch {
      setError('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  // Permission helpers
  const isFullAdmin =
    permissions['*']?.includes('*') ||
    permissions['*']?.includes('*' as PermissionAction)

  const hasPermission = (object: string, action: PermissionAction): boolean => {
    if (isFullAdmin) return true
    const objectPerms = permissions[object] || []
    return (
      objectPerms.includes(action) ||
      objectPerms.includes('*' as PermissionAction)
    )
  }

  const togglePermission = (object: string, action: PermissionAction) => {
    const newPermissions = { ...permissions }
    const currentPerms = [...(newPermissions[object] || [])]

    if (currentPerms.includes(action)) {
      newPermissions[object] = currentPerms.filter(p => p !== action)
      if (newPermissions[object].length === 0) {
        delete newPermissions[object]
      }
    } else {
      newPermissions[object] = [...currentPerms, action]
    }

    setPermissions(newPermissions)
  }

  const toggleAllForObject = (object: string, checked: boolean) => {
    const newPermissions = { ...permissions }
    if (checked) {
      newPermissions[object] = [...PERMISSION_ACTIONS]
    } else {
      delete newPermissions[object]
    }
    setPermissions(newPermissions)
  }

  const allForObjectChecked = (object: string): boolean => {
    return PERMISSION_ACTIONS.every(action => hasPermission(object, action))
  }

  const countPermissions = (): number => {
    if (isFullAdmin)
      return PERMISSION_OBJECTS.length * PERMISSION_ACTIONS.length
    let count = 0
    PERMISSION_OBJECTS.forEach(object => {
      PERMISSION_ACTIONS.forEach(action => {
        if (hasPermission(object, action)) count++
      })
    })
    return count
  }

  return (
    <div className="space-y-6">
      {/* Progress Steps */}
      <div className="flex items-center justify-center">
        <div className="flex items-center gap-2">
          {steps.map((step, index) => (
            <div key={step} className="flex items-center">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors ${
                  index < currentStepIndex
                    ? 'bg-primary text-primary-foreground'
                    : index === currentStepIndex
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                }`}
              >
                {index < currentStepIndex ? (
                  <Check className="h-4 w-4" />
                ) : (
                  index + 1
                )}
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`mx-2 h-0.5 w-12 transition-colors ${
                    index < currentStepIndex ? 'bg-primary' : 'bg-muted'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Step 1: Details */}
      {currentStep === 'details' && (
        <Card>
          <CardHeader>
            <CardTitle>Role Details</CardTitle>
            <CardDescription>
              Give your role a name and description
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Role Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Manager, Coordinator, Assistant"
                value={formData.name}
                onChange={e =>
                  setFormData(prev => ({ ...prev, name: e.target.value }))
                }
              />
              <p className="text-xs text-muted-foreground">
                Will be formatted as lowercase with underscores (e.g.,
                &quot;Team Lead&quot; becomes &quot;team_lead&quot;)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe what this role is for and who should have it..."
                value={formData.description}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                rows={3}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Preset Selection */}
      {currentStep === 'preset' && (
        <Card>
          <CardHeader>
            <CardTitle>Choose a Starting Point</CardTitle>
            <CardDescription>
              Select a preset to start with. You can customize permissions in
              the next step.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2">
              {ROLE_PRESETS.map(preset => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => setSelectedPreset(preset.id)}
                  className={`flex flex-col items-start gap-3 rounded-lg border-2 p-4 text-left transition-all hover:border-primary/50 ${
                    selectedPreset === preset.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border'
                  }`}
                >
                  <div className="flex w-full items-center justify-between">
                    <div className={`rounded-lg p-2 ${preset.color}`}>
                      {preset.icon}
                    </div>
                    {selectedPreset === preset.id && (
                      <div className="rounded-full bg-primary p-1">
                        <Check className="h-3 w-3 text-primary-foreground" />
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground">
                      {preset.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {preset.description}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Permissions */}
      {currentStep === 'permissions' && (
        <Card>
          <CardHeader>
            <CardTitle>Fine-tune Permissions</CardTitle>
            <CardDescription>
              Customize what this role can do. Check the box to grant
              permission.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isFullAdmin ? (
              <div className="rounded-md border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20">
                <p className="text-sm text-amber-800 dark:text-amber-300">
                  This role has full administrative access to all features. No
                  customization needed.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="px-3 py-3 text-left font-medium text-muted-foreground">
                        Resource
                      </th>
                      {PERMISSION_ACTIONS.map(action => (
                        <th
                          key={action}
                          className="px-3 py-3 text-center font-medium text-muted-foreground"
                        >
                          {PERMISSION_ACTION_LABELS[action]}
                        </th>
                      ))}
                      <th className="px-3 py-3 text-center font-medium text-muted-foreground">
                        All
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {PERMISSION_OBJECTS.map(object => (
                      <tr key={object} className="hover:bg-muted/50">
                        <td className="px-3 py-3 font-medium text-foreground">
                          {PERMISSION_OBJECT_LABELS[object] || object}
                        </td>
                        {PERMISSION_ACTIONS.map(action => (
                          <td key={action} className="px-3 py-3 text-center">
                            <Checkbox
                              checked={hasPermission(object, action)}
                              onCheckedChange={() =>
                                togglePermission(object, action)
                              }
                              className="h-4 w-4"
                            />
                          </td>
                        ))}
                        <td className="px-3 py-3 text-center">
                          <Checkbox
                            checked={allForObjectChecked(object)}
                            onCheckedChange={(checked: boolean) =>
                              toggleAllForObject(object, checked)
                            }
                            className="h-4 w-4"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 4: Review */}
      {currentStep === 'review' && (
        <Card>
          <CardHeader>
            <CardTitle>Review & Create</CardTitle>
            <CardDescription>
              Review your role configuration before creating
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Role Name</p>
                <p className="font-medium">{formData.name}</p>
                <p className="text-xs text-muted-foreground">
                  (Saved as: {formData.name.toLowerCase().replace(/\s+/g, '_')})
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Based On</p>
                <p className="font-medium">
                  {ROLE_PRESETS.find(p => p.id === selectedPreset)?.name ||
                    'Custom'}
                </p>
              </div>
            </div>

            {formData.description && (
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Description</p>
                <p className="text-sm">{formData.description}</p>
              </div>
            )}

            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Permissions</p>
              {isFullAdmin ? (
                <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300">
                  Full Administrative Access
                </Badge>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {PERMISSION_OBJECTS.map(object => {
                    const perms = permissions[object] || []
                    if (perms.length === 0) return null
                    return (
                      <Badge key={object} variant="outline" className="text-xs">
                        {PERMISSION_OBJECT_LABELS[object]}:{' '}
                        {perms.length === PERMISSION_ACTIONS.length
                          ? 'All'
                          : perms
                              .map(p => p.charAt(0).toUpperCase())
                              .join(', ')}
                      </Badge>
                    )
                  })}
                  {countPermissions() === 0 && (
                    <p className="text-sm text-muted-foreground">
                      No permissions selected
                    </p>
                  )}
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                {countPermissions()} of{' '}
                {PERMISSION_OBJECTS.length * PERMISSION_ACTIONS.length} total
                permissions
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={handleBack}
          disabled={currentStepIndex === 0 || isLoading}
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        {currentStep === 'review' ? (
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Role
          </Button>
        ) : (
          <Button onClick={handleNext} disabled={!canProceed()}>
            Next
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  )
}
