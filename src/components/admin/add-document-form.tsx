'use client'

import { useState } from 'react'
import { addDocument } from '@/app/actions/documents'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select-native'

interface AddDocumentFormProps {
  clientId: string
  onSuccess?: () => void
}

const documentTypes = [
  { value: 'contract', label: 'Contract' },
  { value: 'birth_plan', label: 'Birth Plan' },
  { value: 'resource', label: 'Resource' },
  { value: 'photo', label: 'Photo' },
  { value: 'invoice', label: 'Invoice' },
  { value: 'form', label: 'Form' },
  { value: 'other', label: 'Other' },
]

export function AddDocumentForm({ clientId, onSuccess }: AddDocumentFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    const formData = new FormData(e.currentTarget)

    // For now, we'll use a URL-based approach
    // In a full implementation, you'd upload to Supabase Storage here
    const fileUrl = formData.get('file_url') as string

    if (!fileUrl) {
      setError('Please provide a file URL')
      setIsSubmitting(false)
      return
    }

    const result = await addDocument(clientId, {
      title: formData.get('title') as string,
      description: (formData.get('description') as string) || null,
      document_type: formData.get('document_type') as string,
      file_url: fileUrl,
      is_visible_to_client: formData.get('is_visible_to_client') === 'true',
    })

    setIsSubmitting(false)

    if (result.success) {
      setShowForm(false)
      onSuccess?.()
      ;(e.target as HTMLFormElement).reset()
    } else {
      setError(result.error || 'Failed to add document')
    }
  }

  if (!showForm) {
    return (
      <Button onClick={() => setShowForm(true)} className="w-full">
        + Upload Document
      </Button>
    )
  }

  return (
    <div className="border border-border rounded-lg p-4 bg-muted/30">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Add Document</h3>
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
            <Label htmlFor="title">Document Title *</Label>
            <Input
              type="text"
              name="title"
              id="title"
              required
              placeholder="e.g., Service Contract"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="document_type">Document Type *</Label>
            <Select name="document_type" id="document_type" required>
              <option value="">Select a type</option>
              {documentTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="file_url">File URL *</Label>
          <Input
            type="url"
            name="file_url"
            id="file_url"
            required
            placeholder="https://..."
          />
          <p className="text-xs text-muted-foreground">
            Enter the URL to the document. File upload feature coming soon.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            name="description"
            id="description"
            placeholder="Brief description of the document..."
            rows={2}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="is_visible_to_client">Visibility</Label>
          <Select
            name="is_visible_to_client"
            id="is_visible_to_client"
            defaultValue="false"
          >
            <option value="false">Admin only (hidden from client)</option>
            <option value="true">Visible to client</option>
          </Select>
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
            {isSubmitting ? 'Adding...' : 'Add Document'}
          </Button>
        </div>
      </form>
    </div>
  )
}
