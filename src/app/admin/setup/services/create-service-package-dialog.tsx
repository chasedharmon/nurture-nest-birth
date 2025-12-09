'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { createServicePackage } from '@/app/actions/setup'
import type { ContractTemplate, ServiceType } from '@/lib/supabase/types'
import { Plus, Loader2, X } from 'lucide-react'

interface CreateServicePackageDialogProps {
  contractTemplates: ContractTemplate[]
}

const SERVICE_TYPES: { value: ServiceType; label: string }[] = [
  { value: 'birth_doula', label: 'Birth Doula' },
  { value: 'postpartum_doula', label: 'Postpartum Doula' },
  { value: 'lactation_consulting', label: 'Lactation Consulting' },
  { value: 'childbirth_education', label: 'Childbirth Education' },
  { value: 'other', label: 'Other' },
]

export function CreateServicePackageDialog({
  contractTemplates,
}: CreateServicePackageDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    service_type: 'birth_doula' as ServiceType,
    base_price: '',
    price_type: 'fixed' as 'fixed' | 'hourly' | 'custom',
    contract_template_id: '',
    requires_contract: true,
    requires_deposit: false,
    deposit_amount: '',
    is_active: true,
    is_featured: false,
  })

  const [features, setFeatures] = useState<string[]>([])
  const [newFeature, setNewFeature] = useState('')

  const handleAddFeature = () => {
    if (newFeature.trim()) {
      setFeatures([...features, newFeature.trim()])
      setNewFeature('')
    }
  }

  const handleRemoveFeature = (index: number) => {
    setFeatures(features.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const result = await createServicePackage({
        name: formData.name,
        description: formData.description || null,
        service_type: formData.service_type,
        base_price: parseFloat(formData.base_price) || 0,
        price_type: formData.price_type,
        included_features: features,
        contract_template_id: formData.contract_template_id || null,
        requires_contract: formData.requires_contract,
        requires_deposit: formData.requires_deposit,
        deposit_amount: formData.deposit_amount
          ? parseFloat(formData.deposit_amount)
          : null,
        deposit_percent: null,
        is_active: formData.is_active,
        is_featured: formData.is_featured,
        display_order: 0,
        intake_form_template_id: null,
      })

      if (result.success) {
        setOpen(false)
        setFormData({
          name: '',
          description: '',
          service_type: 'birth_doula',
          base_price: '',
          price_type: 'fixed',
          contract_template_id: '',
          requires_contract: true,
          requires_deposit: false,
          deposit_amount: '',
          is_active: true,
          is_featured: false,
        })
        setFeatures([])
        router.refresh()
      } else {
        setError(result.error || 'Failed to create package')
      }
    } catch {
      setError('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Package
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create Service Package</DialogTitle>
          <DialogDescription>
            Define a new service package with pricing and features.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">Package Name *</Label>
            <Input
              id="name"
              placeholder="e.g., Birth Doula Package"
              value={formData.name}
              onChange={e =>
                setFormData(prev => ({ ...prev, name: e.target.value }))
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe what this package includes..."
              value={formData.description}
              onChange={e =>
                setFormData(prev => ({ ...prev, description: e.target.value }))
              }
              rows={2}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="service_type">Service Type *</Label>
              <Select
                value={formData.service_type}
                onValueChange={value =>
                  setFormData(prev => ({
                    ...prev,
                    service_type: value as ServiceType,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SERVICE_TYPES.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="price_type">Price Type</Label>
              <Select
                value={formData.price_type}
                onValueChange={value =>
                  setFormData(prev => ({
                    ...prev,
                    price_type: value as 'fixed' | 'hourly' | 'custom',
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fixed">Fixed Price</SelectItem>
                  <SelectItem value="hourly">Hourly Rate</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="base_price">
              {formData.price_type === 'hourly' ? 'Hourly Rate' : 'Base Price'}{' '}
              ($)
            </Label>
            <Input
              id="base_price"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={formData.base_price}
              onChange={e =>
                setFormData(prev => ({ ...prev, base_price: e.target.value }))
              }
            />
          </div>

          {/* Features */}
          <div className="space-y-2">
            <Label>Included Features</Label>
            <div className="flex gap-2">
              <Input
                placeholder="e.g., 2 prenatal visits"
                value={newFeature}
                onChange={e => setNewFeature(e.target.value)}
                onKeyPress={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleAddFeature()
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleAddFeature}
              >
                Add
              </Button>
            </div>
            {features.length > 0 && (
              <ul className="mt-2 space-y-1">
                {features.map((feature, index) => (
                  <li
                    key={index}
                    className="flex items-center justify-between rounded bg-muted px-3 py-1.5 text-sm"
                  >
                    <span>{feature}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveFeature(index)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Contract Template */}
          {contractTemplates.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="contract_template">Contract Template</Label>
              <Select
                value={formData.contract_template_id}
                onValueChange={value =>
                  setFormData(prev => ({
                    ...prev,
                    contract_template_id: value,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a template (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {contractTemplates
                    .filter(t => t.is_active)
                    .map(template => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Options */}
          <div className="space-y-4 rounded-lg border border-border p-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="requires_contract">Requires Contract</Label>
                <p className="text-xs text-muted-foreground">
                  Clients must sign a contract
                </p>
              </div>
              <Switch
                id="requires_contract"
                checked={formData.requires_contract}
                onCheckedChange={checked =>
                  setFormData(prev => ({ ...prev, requires_contract: checked }))
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="is_active">Active</Label>
                <p className="text-xs text-muted-foreground">
                  Package is available to clients
                </p>
              </div>
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={checked =>
                  setFormData(prev => ({ ...prev, is_active: checked }))
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="is_featured">Featured</Label>
                <p className="text-xs text-muted-foreground">
                  Highlight this package
                </p>
              </div>
              <Switch
                id="is_featured"
                checked={formData.is_featured}
                onCheckedChange={checked =>
                  setFormData(prev => ({ ...prev, is_featured: checked }))
                }
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Package
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
