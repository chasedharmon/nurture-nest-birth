'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { confirmUpload, getUploadUrl } from '@/app/actions/file-upload'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select-native'
import { FileUpload } from '@/components/ui/file-upload'
import { Upload, Link as LinkIcon } from 'lucide-react'
import type { DocumentType } from '@/lib/supabase/types'

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

const acceptByType: Record<string, string> = {
  contract: '.pdf',
  birth_plan: '.pdf,.doc,.docx',
  resource: '.pdf,.doc,.docx,.txt',
  photo: '.jpg,.jpeg,.png,.webp,.gif',
  invoice: '.pdf',
  form: '.pdf,.doc,.docx',
  other: '.pdf,.doc,.docx,.jpg,.jpeg,.png,.txt',
}

export function AddDocumentForm({ clientId, onSuccess }: AddDocumentFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [uploadMode, setUploadMode] = useState<'file' | 'url'>('file')
  const [documentType, setDocumentType] = useState<DocumentType>('other')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [isVisibleToClient, setIsVisibleToClient] = useState(false)
  const [fileUrl, setFileUrl] = useState('')
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)

  const handleFileUpload = async (
    file: File
  ): Promise<{ success: boolean; error?: string }> => {
    if (!documentType) {
      return { success: false, error: 'Please select a document type first' }
    }

    setIsSubmitting(true)
    setError(null)

    try {
      // Get signed upload URL
      const uploadUrlResult = await getUploadUrl(
        clientId,
        documentType,
        file.name,
        file.type
      )

      if (!uploadUrlResult.success) {
        setIsSubmitting(false)
        return { success: false, error: uploadUrlResult.error }
      }

      // Upload file directly to Supabase Storage
      const uploadResponse = await fetch(uploadUrlResult.signedUrl!, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      })

      if (!uploadResponse.ok) {
        setIsSubmitting(false)
        return { success: false, error: 'Failed to upload file' }
      }

      // Confirm upload and create database record
      const confirmResult = await confirmUpload(
        clientId,
        documentType,
        uploadUrlResult.path!,
        file.name,
        file.size,
        file.type,
        title || file.name,
        description || undefined,
        isVisibleToClient
      )

      setIsSubmitting(false)

      if (confirmResult.success) {
        // Reset form
        setTitle('')
        setDescription('')
        setIsVisibleToClient(false)
        setDocumentType('other')
        setShowForm(false)
        onSuccess?.()
        router.refresh()
        return { success: true }
      } else {
        return { success: false, error: confirmResult.error }
      }
    } catch (err) {
      setIsSubmitting(false)
      console.error('Upload error:', err)
      return { success: false, error: 'Upload failed. Please try again.' }
    }
  }

  const handleUrlSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    if (!fileUrl) {
      setError('Please provide a file URL')
      setIsSubmitting(false)
      return
    }

    // Import addDocument for URL-based uploads
    const { addDocument } = await import('@/app/actions/documents')

    const result = await addDocument(clientId, {
      title: title || 'Untitled Document',
      description: description || null,
      document_type: documentType,
      file_url: fileUrl,
      is_visible_to_client: isVisibleToClient,
    })

    setIsSubmitting(false)

    if (result.success) {
      setShowForm(false)
      setTitle('')
      setDescription('')
      setFileUrl('')
      setIsVisibleToClient(false)
      onSuccess?.()
      router.refresh()
    } else {
      setError(result.error || 'Failed to add document')
    }
  }

  if (!showForm) {
    return (
      <Button onClick={() => setShowForm(true)} className="w-full">
        <Upload className="h-4 w-4 mr-2" />
        Upload Document
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

      {/* Upload mode toggle */}
      <div className="flex gap-2 mb-4">
        <Button
          type="button"
          variant={uploadMode === 'file' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setUploadMode('file')}
        >
          <Upload className="h-4 w-4 mr-2" />
          Upload File
        </Button>
        <Button
          type="button"
          variant={uploadMode === 'url' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setUploadMode('url')}
        >
          <LinkIcon className="h-4 w-4 mr-2" />
          Add URL
        </Button>
      </div>

      <form
        ref={formRef}
        onSubmit={
          uploadMode === 'url' ? handleUrlSubmit : e => e.preventDefault()
        }
        className="space-y-4"
      >
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="title">Document Title</Label>
            <Input
              type="text"
              name="title"
              id="title"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g., Service Contract"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="document_type">Document Type *</Label>
            <Select
              name="document_type"
              id="document_type"
              required
              value={documentType}
              onChange={e => setDocumentType(e.target.value as DocumentType)}
            >
              <option value="">Select a type</option>
              {documentTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </Select>
          </div>
        </div>

        {uploadMode === 'file' ? (
          <div className="space-y-2">
            <Label>Upload File *</Label>
            <FileUpload
              onUpload={handleFileUpload}
              accept={acceptByType[documentType] || acceptByType.other}
              maxSize={10 * 1024 * 1024}
              disabled={isSubmitting || !documentType}
            />
            {!documentType && (
              <p className="text-xs text-amber-600">
                Please select a document type first
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <Label htmlFor="file_url">File URL *</Label>
            <Input
              type="url"
              name="file_url"
              id="file_url"
              required
              value={fileUrl}
              onChange={e => setFileUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            name="description"
            id="description"
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Brief description of the document..."
            rows={2}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="is_visible_to_client">Visibility</Label>
          <Select
            name="is_visible_to_client"
            id="is_visible_to_client"
            value={isVisibleToClient ? 'true' : 'false'}
            onChange={e => setIsVisibleToClient(e.target.value === 'true')}
          >
            <option value="false">Admin only (hidden from client)</option>
            <option value="true">Visible to client</option>
          </Select>
        </div>

        {uploadMode === 'url' && (
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
        )}
      </form>
    </div>
  )
}
