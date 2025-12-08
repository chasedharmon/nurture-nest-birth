import { getClientSession } from '@/app/actions/client-auth'
import { getClientVisibleDocuments } from '@/app/actions/documents'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { format } from 'date-fns'
import Link from 'next/link'
import type { ClientDocument } from '@/lib/supabase/types'
import { ClientDocumentUpload } from '@/components/client/document-upload'

const documentTypeLabels = {
  contract: 'Contract',
  birth_plan: 'Birth Plan',
  resource: 'Resource',
  photo: 'Photo',
  invoice: 'Invoice',
  form: 'Form',
  other: 'Other',
}

const documentTypeIcons = {
  contract: '📄',
  birth_plan: '📝',
  resource: '📚',
  photo: '📸',
  invoice: '💵',
  form: '📋',
  other: '📎',
}

const documentTypeColors = {
  contract:
    'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300',
  birth_plan:
    'bg-pink-100 text-pink-800 dark:bg-pink-900/20 dark:text-pink-300',
  resource: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300',
  photo: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300',
  invoice:
    'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300',
  form: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300',
  other: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300',
}

export default async function ClientDocumentsPage() {
  const session = await getClientSession()

  if (!session) {
    return null
  }

  const documentsResult = await getClientVisibleDocuments(session.clientId)
  const documents = documentsResult.success ? documentsResult.documents : []

  // Group documents by type
  const documentsByType = (documents ?? []).reduce<
    Record<string, ClientDocument[]>
  >((acc, doc) => {
    const type = doc.document_type
    const existing = acc[type] ?? []
    return { ...acc, [type]: [...existing, doc] }
  }, {})

  // Sort each group by upload date (newest first)
  Object.keys(documentsByType).forEach(type => {
    const docs = documentsByType[type]
    if (docs) {
      docs.sort((a: ClientDocument, b: ClientDocument) => {
        const dateA = new Date(a.uploaded_at).getTime()
        const dateB = new Date(b.uploaded_at).getTime()
        return dateB - dateA
      })
    }
  })

  function formatFileSize(bytes: number | null): string {
    if (!bytes) return 'Unknown size'
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Your Documents</h1>
          <p className="text-muted-foreground mt-2">
            Access all your files, contracts, and resources
          </p>
        </div>
        <ClientDocumentUpload />
      </div>

      {documents.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              You don&apos;t have any documents yet. Your doula will share
              relevant files and resources with you here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {(
            Object.entries(documentsByType) as [string, ClientDocument[]][]
          ).map(([type, docs]) => (
            <div key={type}>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">
                  {documentTypeIcons[type as keyof typeof documentTypeIcons]}
                </span>
                <h2 className="text-xl font-semibold text-foreground">
                  {documentTypeLabels[type as keyof typeof documentTypeLabels]}
                </h2>
                <span className="text-sm text-muted-foreground">
                  ({docs.length})
                </span>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {docs.map(doc => (
                  <Card key={doc.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg">{doc.title}</CardTitle>
                          {doc.description && (
                            <CardDescription className="mt-1">
                              {doc.description}
                            </CardDescription>
                          )}
                        </div>
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-medium whitespace-nowrap ml-4 ${documentTypeColors[doc.document_type as keyof typeof documentTypeColors] || documentTypeColors.other}`}
                        >
                          {documentTypeLabels[
                            doc.document_type as keyof typeof documentTypeLabels
                          ] || documentTypeLabels.other}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-6 text-sm text-muted-foreground">
                          <span>
                            Uploaded{' '}
                            {format(new Date(doc.uploaded_at), 'MMM d, yyyy')}
                          </span>
                          {doc.file_size_bytes && (
                            <span>{formatFileSize(doc.file_size_bytes)}</span>
                          )}
                          {doc.file_mime_type && (
                            <span className="uppercase">
                              {doc.file_mime_type
                                .split('/')[1]
                                ?.substring(0, 4)}
                            </span>
                          )}
                        </div>
                        <Link
                          href={doc.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-medium"
                        >
                          Download
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                            />
                          </svg>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
