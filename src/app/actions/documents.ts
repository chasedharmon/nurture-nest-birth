'use server'

import { revalidatePath } from 'next/cache'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import type {
  ClientDocument,
  ClientDocumentInsert,
  DocumentType,
} from '@/lib/supabase/types'
import { sendDocumentSharedEmail } from './notifications'

export async function getClientDocuments(clientId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('client_documents')
    .select('*')
    .eq('client_id', clientId)
    .order('uploaded_at', { ascending: false })

  if (error) {
    console.error('Error fetching client documents:', error)
    return { success: false, error: error.message, documents: [] }
  }

  return { success: true, documents: data as ClientDocument[] }
}

export async function getDocumentsByType(
  clientId: string,
  documentType: DocumentType
) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('client_documents')
    .select('*')
    .eq('client_id', clientId)
    .eq('document_type', documentType)
    .order('uploaded_at', { ascending: false })

  if (error) {
    console.error('Error fetching documents by type:', error)
    return { success: false, error: error.message, documents: [] }
  }

  return { success: true, documents: data as ClientDocument[] }
}

export async function getClientVisibleDocuments(clientId: string) {
  // Use admin client to bypass RLS since this is called from client portal
  // which uses session-based auth instead of Supabase auth
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('client_documents')
    .select('*')
    .eq('client_id', clientId)
    .eq('is_visible_to_client', true)
    .order('uploaded_at', { ascending: false })

  if (error) {
    console.error('Error fetching client-visible documents:', error)
    return { success: false, error: error.message, documents: [] }
  }

  return { success: true, documents: data as ClientDocument[] }
}

export async function getDocumentById(documentId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('client_documents')
    .select('*')
    .eq('id', documentId)
    .single()

  if (error) {
    console.error('Error fetching document:', error)
    return { success: false, error: error.message, document: null }
  }

  return { success: true, document: data as ClientDocument }
}

export async function addDocument(
  clientId: string,
  document: Omit<ClientDocumentInsert, 'client_id' | 'uploaded_by'>
) {
  const supabase = await createClient()

  // Check auth
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Unauthorized' }
  }

  const { data, error } = await supabase
    .from('client_documents')
    .insert({
      client_id: clientId,
      uploaded_by: user.id,
      ...document,
    })
    .select()
    .single()

  if (error) {
    console.error('Error adding document:', error)
    return { success: false, error: error.message }
  }

  // Send notification email if document is visible to client
  if (document.is_visible_to_client !== false) {
    sendDocumentSharedEmail(data.id, clientId).catch(err => {
      console.error('[Documents] Failed to send document notification:', err)
    })
  }

  revalidatePath(`/admin/leads/${clientId}`)
  revalidatePath('/admin')

  return { success: true, document: data as ClientDocument }
}

export async function updateDocument(
  documentId: string,
  updates: Partial<
    Omit<ClientDocumentInsert, 'client_id' | 'uploaded_by' | 'file_url'>
  >
) {
  const supabase = await createClient()

  // Check auth
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Unauthorized' }
  }

  // Get client_id for revalidation
  const { data: document } = await supabase
    .from('client_documents')
    .select('client_id')
    .eq('id', documentId)
    .single()

  const { data, error } = await supabase
    .from('client_documents')
    .update(updates)
    .eq('id', documentId)
    .select()
    .single()

  if (error) {
    console.error('Error updating document:', error)
    return { success: false, error: error.message }
  }

  if (document?.client_id) {
    revalidatePath(`/admin/leads/${document.client_id}`)
  }
  revalidatePath('/admin')

  return { success: true, document: data as ClientDocument }
}

export async function toggleDocumentVisibility(documentId: string) {
  const supabase = await createClient()

  // Check auth
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Unauthorized' }
  }

  // Get current visibility and client_id
  const { data: document } = await supabase
    .from('client_documents')
    .select('is_visible_to_client, client_id')
    .eq('id', documentId)
    .single()

  if (!document) {
    return { success: false, error: 'Document not found' }
  }

  const newVisibility = !document.is_visible_to_client

  const { error } = await supabase
    .from('client_documents')
    .update({ is_visible_to_client: newVisibility })
    .eq('id', documentId)

  if (error) {
    console.error('Error toggling document visibility:', error)
    return { success: false, error: error.message }
  }

  // Send notification if now visible to client
  if (newVisibility && document.client_id) {
    sendDocumentSharedEmail(documentId, document.client_id).catch(err => {
      console.error('[Documents] Failed to send document notification:', err)
    })
  }

  revalidatePath(`/admin/leads/${document.client_id}`)
  revalidatePath('/admin')

  return { success: true, isVisible: newVisibility }
}

const BUCKET_NAME = 'client-documents'

export async function deleteDocument(documentId: string) {
  const supabase = await createClient()

  // Check auth
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Unauthorized' }
  }

  // Get document for revalidation and file deletion
  const { data: document } = await supabase
    .from('client_documents')
    .select('client_id, file_url')
    .eq('id', documentId)
    .single()

  if (!document) {
    return { success: false, error: 'Document not found' }
  }

  // Delete file from Supabase Storage
  if (document.file_url) {
    try {
      const url = new URL(document.file_url)
      const pathMatch = url.pathname.match(
        /\/storage\/v1\/object\/public\/client-documents\/(.+)/
      )

      if (pathMatch && pathMatch[1]) {
        const filePath = decodeURIComponent(pathMatch[1])
        const { error: storageError } = await supabase.storage
          .from(BUCKET_NAME)
          .remove([filePath])

        if (storageError) {
          console.error('Error deleting file from storage:', storageError)
          // Continue to delete database record even if storage deletion fails
        }
      }
    } catch (urlError) {
      console.error('Error parsing file URL:', urlError)
      // Continue to delete database record even if URL parsing fails
    }
  }

  // Delete database record
  const { error } = await supabase
    .from('client_documents')
    .delete()
    .eq('id', documentId)

  if (error) {
    console.error('Error deleting document:', error)
    return { success: false, error: error.message }
  }

  if (document.client_id) {
    revalidatePath(`/admin/leads/${document.client_id}`)
  }
  revalidatePath('/admin')
  revalidatePath('/client/documents')

  return { success: true }
}

// Helper function to generate a signed URL for downloading a document
export async function getDocumentDownloadUrl(documentId: string) {
  const supabase = await createClient()

  const { data: document, error } = await supabase
    .from('client_documents')
    .select('file_url')
    .eq('id', documentId)
    .single()

  if (error || !document) {
    console.error('Error fetching document URL:', error)
    return { success: false, error: error?.message || 'Document not found' }
  }

  // If using Supabase Storage, generate a signed URL
  // For now, return the direct URL
  return { success: true, url: document.file_url }
}

/**
 * Admin function to find and clean up orphaned storage files.
 * Orphaned files are files in storage that don't have a corresponding database record.
 * This is useful for maintenance and freeing up storage space.
 */
export async function cleanupOrphanedFiles(dryRun: boolean = true) {
  const supabase = await createClient()

  // Check auth - only admin users should be able to run this
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Unauthorized' }
  }

  // Check if user is admin
  const { data: teamMember } = await supabase
    .from('team_members')
    .select('role')
    .eq('user_id', user.id)
    .single()

  if (!teamMember || !['owner', 'admin'].includes(teamMember.role)) {
    return { success: false, error: 'Admin access required' }
  }

  // Get all file URLs from database
  const { data: documents, error: dbError } = await supabase
    .from('client_documents')
    .select('file_url')

  if (dbError) {
    return { success: false, error: dbError.message }
  }

  const dbFileUrls = new Set(documents?.map(d => d.file_url) || [])

  // List all files in storage bucket
  const { data: storageFiles, error: storageError } = await supabase.storage
    .from(BUCKET_NAME)
    .list('', { limit: 1000, offset: 0 })

  if (storageError) {
    return { success: false, error: storageError.message }
  }

  // Find orphaned files by checking each folder (client ID)
  const orphanedFiles: string[] = []
  const checkedFolders: string[] = []

  for (const folder of storageFiles || []) {
    if (folder.id === null) {
      // This is a folder, list its contents recursively
      checkedFolders.push(folder.name)

      const { data: folderContents } = await supabase.storage
        .from(BUCKET_NAME)
        .list(folder.name, { limit: 1000 })

      for (const subFolder of folderContents || []) {
        if (subFolder.id === null) {
          // This is a document type folder
          const { data: files } = await supabase.storage
            .from(BUCKET_NAME)
            .list(`${folder.name}/${subFolder.name}`, { limit: 1000 })

          for (const file of files || []) {
            if (file.id !== null) {
              const filePath = `${folder.name}/${subFolder.name}/${file.name}`
              const { data: urlData } = supabase.storage
                .from(BUCKET_NAME)
                .getPublicUrl(filePath)

              if (!dbFileUrls.has(urlData.publicUrl)) {
                orphanedFiles.push(filePath)
              }
            }
          }
        }
      }
    }
  }

  // Delete orphaned files if not a dry run
  let deletedCount = 0
  if (!dryRun && orphanedFiles.length > 0) {
    const { error: deleteError } = await supabase.storage
      .from(BUCKET_NAME)
      .remove(orphanedFiles)

    if (deleteError) {
      return {
        success: false,
        error: deleteError.message,
        orphanedFiles,
        deletedCount: 0,
      }
    }

    deletedCount = orphanedFiles.length
  }

  return {
    success: true,
    dryRun,
    orphanedFiles,
    deletedCount,
    checkedFolders,
    totalFilesInDb: dbFileUrls.size,
  }
}
