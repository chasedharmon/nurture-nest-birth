'use client'

import { useState } from 'react'
import { addService } from '@/app/actions/services'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select-native'

interface AddServiceFormProps {
  clientId: string
  onSuccess?: () => void
}

const serviceTypes = [
  { value: 'birth_doula', label: 'Birth Doula' },
  { value: 'postpartum_doula', label: 'Postpartum Doula' },
  { value: 'lactation_consulting', label: 'Lactation Consulting' },
  { value: 'childbirth_education', label: 'Childbirth Education' },
  { value: 'other', label: 'Other' },
]

const serviceStatuses = [
  { value: 'pending', label: 'Pending' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
]

export function AddServiceForm({ clientId, onSuccess }: AddServiceFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    const formData = new FormData(e.currentTarget)

    const result = await addService(clientId, {
      service_type: formData.get('service_type') as string,
      package_name: (formData.get('package_name') as string) || null,
      description: (formData.get('description') as string) || null,
      status: formData.get('status') as string,
      start_date: (formData.get('start_date') as string) || null,
      end_date: (formData.get('end_date') as string) || null,
      total_amount: formData.get('total_amount')
        ? parseFloat(formData.get('total_amount') as string)
        : null,
      contract_required: formData.get('contract_required') === 'true',
      contract_signed: formData.get('contract_signed') === 'true',
      notes: (formData.get('notes') as string) || null,
    })

    setIsSubmitting(false)

    if (result.success) {
      setShowForm(false)
      onSuccess?.()
      // Reset form by targeting the form element
      ;(e.target as HTMLFormElement).reset()
    } else {
      setError(result.error || 'Failed to add service')
    }
  }

  if (!showForm) {
    return (
      <Button onClick={() => setShowForm(true)} className="w-full">
        + Add Service
      </Button>
    )
  }

  return (
    <div className="border border-border rounded-lg p-4 bg-muted/30">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Add New Service</h3>
        <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}>
          Cancel
        </Button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200 rounded-md text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="service_type">Service Type *</Label>
            <Select name="service_type" id="service_type" required>
              <option value="">Select a service type</option>
              {serviceTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status *</Label>
            <Select name="status" id="status" required defaultValue="pending">
              {serviceStatuses.map(status => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="package_name">Package Name</Label>
          <Input
            type="text"
            name="package_name"
            id="package_name"
            placeholder="e.g., Full Birth Support Package"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            name="description"
            id="description"
            placeholder="Describe the service package..."
            rows={2}
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="total_amount">Total Amount ($)</Label>
            <Input
              type="number"
              name="total_amount"
              id="total_amount"
              min="0"
              step="0.01"
              placeholder="0.00"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="start_date">Start Date</Label>
            <Input type="date" name="start_date" id="start_date" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="end_date">End Date</Label>
            <Input type="date" name="end_date" id="end_date" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="contract_required">Contract Required</Label>
            <Select
              name="contract_required"
              id="contract_required"
              defaultValue="true"
            >
              <option value="true">Yes</option>
              <option value="false">No</option>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="contract_signed">Contract Status</Label>
            <Select
              name="contract_signed"
              id="contract_signed"
              defaultValue="false"
            >
              <option value="false">Pending</option>
              <option value="true">Signed</option>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            name="notes"
            id="notes"
            placeholder="Additional notes..."
            rows={2}
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowForm(false)}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Adding...' : 'Add Service'}
          </Button>
        </div>
      </form>
    </div>
  )
}
