'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
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
  const supabase = await createClient()

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

export async function deleteDocument(documentId: string) {
  const supabase = await createClient()

  // Check auth
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Unauthorized' }
  }

  // Get document for revalidation and potential file deletion
  const { data: document } = await supabase
    .from('client_documents')
    .select('client_id, file_url')
    .eq('id', documentId)
    .single()

  const { error } = await supabase
    .from('client_documents')
    .delete()
    .eq('id', documentId)

  if (error) {
    console.error('Error deleting document:', error)
    return { success: false, error: error.message }
  }

  // TODO: Delete file from Supabase Storage if needed
  // if (document?.file_url) {
  //   // Extract file path from URL and delete from storage
  // }

  if (document?.client_id) {
    revalidatePath(`/admin/leads/${document.client_id}`)
  }
  revalidatePath('/admin')

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
