'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import type { ClientDocument } from '@/lib/supabase/types'
import {
  deleteDocument,
  toggleDocumentVisibility,
} from '@/app/actions/documents'
import { Button } from '@/components/ui/button'
import { AddDocumentForm } from './add-document-form'

interface DocumentsListProps {
  documents: ClientDocument[]
  clientId: string
}

const documentTypeLabels: Record<string, string> = {
  contract: 'Contract',
  birth_plan: 'Birth Plan',
  resource: 'Resource',
  photo: 'Photo',
  invoice: 'Invoice',
  form: 'Form',
  other: 'Document',
}

const documentTypeColors: Record<string, string> = {
  contract:
    'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300',
  birth_plan:
    'bg-pink-100 text-pink-800 dark:bg-pink-900/20 dark:text-pink-300',
  resource: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300',
  photo: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300',
  invoice:
    'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300',
  form: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-300',
  other: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300',
}

export function DocumentsList({ documents, clientId }: DocumentsListProps) {
  // Group documents by type
  const documentsByType = documents.reduce(
    (acc, doc) => {
      if (!acc[doc.document_type]) {
        acc[doc.document_type] = []
      }
      acc[doc.document_type]!.push(doc)
      return acc
    },
    {} as Record<string, ClientDocument[]>
  )

  return (
    <div className="space-y-6">
      <AddDocumentForm clientId={clientId} />

      {documents.length === 0 ? (
        <div className="py-8 text-center text-muted-foreground">
          <p>No documents uploaded yet</p>
          <p className="text-sm mt-1">
            Upload contracts, resources, or birth plans
          </p>
        </div>
      ) : (
        Object.entries(documentsByType).map(([type, docs]) => (
          <div key={type}>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <span
                className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${documentTypeColors[type] || documentTypeColors.other}`}
              >
                {documentTypeLabels[type] || type}
              </span>
              <span className="text-muted-foreground text-sm">
                ({docs.length})
              </span>
            </h3>
            <div className="grid gap-3">
              {docs.map(document => (
                <DocumentCard key={document.id} document={document} />
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  )
}

function DocumentCard({ document }: { document: ClientDocument }) {
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  async function handleToggleVisibility() {
    setIsUpdating(true)
    await toggleDocumentVisibility(document.id)
    setIsUpdating(false)
  }

  async function handleDelete() {
    setIsDeleting(true)
    await deleteDocument(document.id)
    setIsDeleting(false)
    setShowDeleteConfirm(false)
  }

  return (
    <div className="border border-border rounded-lg p-4 hover:bg-muted/50 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-semibold text-foreground">{document.title}</h4>
            {document.is_visible_to_client && (
              <span className="inline-flex rounded-full bg-green-100 dark:bg-green-900/20 px-2 py-1 text-xs font-medium text-green-800 dark:text-green-300">
                Visible to Client
              </span>
            )}
          </div>

          {document.description && (
            <p className="text-sm text-muted-foreground mt-1">
              {document.description}
            </p>
          )}

          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
            <span>
              Uploaded {format(new Date(document.uploaded_at), 'MMM d, yyyy')}
            </span>
            {document.file_size_bytes && (
              <span>{(document.file_size_bytes / 1024).toFixed(1)} KB</span>
            )}
            {document.file_mime_type && (
              <span className="uppercase">
                {document.file_mime_type.split('/')[1]}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2 ml-4">
          <a
            href={document.file_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-primary hover:underline text-center"
          >
            Download
          </a>

          <Button
            variant="outline"
            size="sm"
            onClick={handleToggleVisibility}
            disabled={isUpdating}
            className="text-xs"
          >
            {document.is_visible_to_client
              ? 'Hide from Client'
              : 'Show to Client'}
          </Button>

          {showDeleteConfirm ? (
            <div className="flex gap-1">
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                disabled={isDeleting}
                className="text-xs"
              >
                {isDeleting ? '...' : 'Yes'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDeleteConfirm(false)}
                className="text-xs"
              >
                No
              </Button>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDeleteConfirm(true)}
              className="text-xs text-red-600 hover:text-red-700 hover:bg-red-100"
            >
              Delete
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
