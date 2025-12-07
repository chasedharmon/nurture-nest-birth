'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select-native'
import { FileUpload } from '@/components/ui/file-upload'
import { clientUploadFile } from '@/app/actions/file-upload'
import { Upload, X, CheckCircle } from 'lucide-react'
import type { DocumentType } from '@/lib/supabase/types'

// Document types clients are allowed to upload
const allowedDocumentTypes = [
  { value: 'birth_plan', label: 'Birth Plan' },
  { value: 'photo', label: 'Photo' },
  { value: 'form', label: 'Form / Paperwork' },
  { value: 'other', label: 'Other Document' },
]

const acceptByType: Record<string, string> = {
  birth_plan: '.pdf,.doc,.docx',
  photo: '.jpg,.jpeg,.png,.webp',
  form: '.pdf,.doc,.docx',
  other: '.pdf,.doc,.docx,.jpg,.jpeg,.png,.txt',
}

export function ClientDocumentUpload() {
  const [showForm, setShowForm] = useState(false)
  const [documentType, setDocumentType] = useState<DocumentType>('birth_plan')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleUpload = async (
    file: File
  ): Promise<{ success: boolean; error?: string }> => {
    setIsUploading(true)
    setError(null)

    try {
      const result = await clientUploadFile(
        documentType,
        file,
        title || file.name,
        description || undefined
      )

      setIsUploading(false)

      if (result.success) {
        setUploadSuccess(true)
        setTimeout(() => {
          setShowForm(false)
          setUploadSuccess(false)
          setTitle('')
          setDescription('')
          setDocumentType('birth_plan')
          router.refresh()
        }, 1500)
        return { success: true }
      } else {
        setError(result.error || 'Upload failed')
        return { success: false, error: result.error }
      }
    } catch (err) {
      setIsUploading(false)
      console.error('Upload error:', err)
      const errorMessage = 'Upload failed. Please try again.'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    }
  }

  if (!showForm) {
    return (
      <Button
        onClick={() => setShowForm(true)}
        className="bg-[#8b7355] hover:bg-[#6b5a45] text-white"
      >
        <Upload className="h-4 w-4 mr-2" />
        Upload Document
      </Button>
    )
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="bg-white dark:bg-gray-900 rounded-lg border border-stone-200 p-6 shadow-sm"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-stone-800">Upload a Document</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setShowForm(false)
              setError(null)
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {uploadSuccess ? (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="py-8 text-center"
          >
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
            <p className="text-lg font-medium text-green-700">
              Upload Successful!
            </p>
            <p className="text-sm text-stone-500">
              Your document has been uploaded.
            </p>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="document_type">Document Type *</Label>
                <Select
                  id="document_type"
                  value={documentType}
                  onChange={e =>
                    setDocumentType(e.target.value as DocumentType)
                  }
                >
                  {allowedDocumentTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Title (optional)</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g., My Birth Plan"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Add any notes about this document..."
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label>Select File *</Label>
              <FileUpload
                onUpload={handleUpload}
                accept={acceptByType[documentType] || acceptByType.other}
                maxSize={10 * 1024 * 1024}
                disabled={isUploading}
              />
            </div>

            <div className="text-xs text-stone-500 space-y-1">
              <p>Accepted file types vary by document type:</p>
              <ul className="list-disc list-inside pl-2">
                <li>Birth Plan: PDF, Word documents</li>
                <li>Photos: JPEG, PNG, WebP</li>
                <li>Forms: PDF, Word documents</li>
                <li>Other: PDF, Word, images, text files</li>
              </ul>
              <p className="mt-2">Maximum file size: 10MB</p>
            </div>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  )
}
