'use server'

import { revalidatePath } from 'next/cache'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import type { DocumentType } from '@/lib/supabase/types'

const BUCKET_NAME = 'client-documents'
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

// Allowed file types by document type
const ALLOWED_TYPES: Record<DocumentType, string[]> = {
  contract: ['application/pdf'],
  birth_plan: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ],
  resource: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
  ],
  photo: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  invoice: ['application/pdf'],
  form: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ],
  other: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/png',
    'text/plain',
  ],
}

// Get a signed URL for uploading a file directly to Supabase Storage
export async function getUploadUrl(
  clientId: string,
  documentType: DocumentType,
  fileName: string,
  contentType: string
) {
  const supabase = await createClient()

  // Check auth
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Unauthorized' }
  }

  // Validate content type
  const allowedTypes = ALLOWED_TYPES[documentType] || ALLOWED_TYPES.other
  if (!allowedTypes.includes(contentType)) {
    return {
      success: false,
      error: `File type ${contentType} not allowed for ${documentType}`,
    }
  }

  // Generate unique file path
  const timestamp = Date.now()
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_')
  const filePath = `${clientId}/${documentType}/${timestamp}-${sanitizedFileName}`

  // Create signed upload URL
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .createSignedUploadUrl(filePath)

  if (error) {
    console.error('Error creating upload URL:', error)
    return { success: false, error: error.message }
  }

  return {
    success: true,
    signedUrl: data.signedUrl,
    token: data.token,
    path: filePath,
  }
}

// Confirm upload completed and create database record
export async function confirmUpload(
  clientId: string,
  documentType: DocumentType,
  filePath: string,
  fileName: string,
  fileSize: number,
  contentType: string,
  title?: string,
  description?: string,
  isVisibleToClient: boolean = true
) {
  const supabase = await createClient()

  // Check auth
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Unauthorized' }
  }

  // Validate file size
  if (fileSize > MAX_FILE_SIZE) {
    return { success: false, error: 'File too large. Maximum size is 10MB.' }
  }

  // Get public URL for the uploaded file
  const { data: urlData } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(filePath)

  // Create document record in database
  const { data, error } = await supabase
    .from('client_documents')
    .insert({
      client_id: clientId,
      title: title || fileName,
      description: description || null,
      document_type: documentType,
      file_url: urlData.publicUrl,
      file_size_bytes: fileSize,
      file_mime_type: contentType,
      is_visible_to_client: isVisibleToClient,
      uploaded_by: user.id,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating document record:', error)
    // Try to delete the uploaded file if database insert fails
    await supabase.storage.from(BUCKET_NAME).remove([filePath])
    return { success: false, error: error.message }
  }

  revalidatePath(`/admin/leads/${clientId}`)
  revalidatePath('/admin')
  revalidatePath(`/client/documents`)

  return { success: true, document: data }
}

// Upload file directly from server (for server-side uploads)
export async function uploadFile(
  clientId: string,
  documentType: DocumentType,
  file: File,
  title?: string,
  description?: string,
  isVisibleToClient: boolean = true
) {
  const supabase = await createClient()

  // Check auth
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Unauthorized' }
  }

  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    return { success: false, error: 'File too large. Maximum size is 10MB.' }
  }

  // Validate content type
  const allowedTypes = ALLOWED_TYPES[documentType] || ALLOWED_TYPES.other
  if (!allowedTypes.includes(file.type)) {
    return {
      success: false,
      error: `File type ${file.type} not allowed for ${documentType}`,
    }
  }

  // Generate unique file path
  const timestamp = Date.now()
  const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
  const filePath = `${clientId}/${documentType}/${timestamp}-${sanitizedFileName}`

  // Upload file to storage
  const { error: uploadError } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filePath, file, {
      contentType: file.type,
      upsert: false,
    })

  if (uploadError) {
    console.error('Error uploading file:', uploadError)
    return { success: false, error: uploadError.message }
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(filePath)

  // Create document record
  const { data, error } = await supabase
    .from('client_documents')
    .insert({
      client_id: clientId,
      title: title || file.name,
      description: description || null,
      document_type: documentType,
      file_url: urlData.publicUrl,
      file_size_bytes: file.size,
      file_mime_type: file.type,
      is_visible_to_client: isVisibleToClient,
      uploaded_by: user.id,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating document record:', error)
    // Clean up uploaded file
    await supabase.storage.from(BUCKET_NAME).remove([filePath])
    return { success: false, error: error.message }
  }

  revalidatePath(`/admin/leads/${clientId}`)
  revalidatePath('/admin')
  revalidatePath(`/client/documents`)

  return { success: true, document: data }
}

// Get a signed download URL (for private files)
export async function getDownloadUrl(documentId: string) {
  const supabase = await createClient()

  // Get document record
  const { data: document, error: docError } = await supabase
    .from('client_documents')
    .select('file_url, client_id')
    .eq('id', documentId)
    .single()

  if (docError || !document) {
    return { success: false, error: 'Document not found' }
  }

  // Extract file path from URL
  const url = new URL(document.file_url)
  const pathMatch = url.pathname.match(
    /\/storage\/v1\/object\/public\/client-documents\/(.+)/
  )

  if (!pathMatch) {
    // URL might already be a signed URL or external URL
    return { success: true, url: document.file_url }
  }

  const filePath = pathMatch[1]!

  // Create signed download URL (1 hour expiry)
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .createSignedUrl(filePath, 3600)

  if (error) {
    console.error('Error creating signed URL:', error)
    // Fall back to public URL
    return { success: true, url: document.file_url }
  }

  return { success: true, url: data.signedUrl }
}

// Delete file from storage and database
export async function deleteFile(documentId: string) {
  const supabase = await createClient()

  // Check auth
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Unauthorized' }
  }

  // Get document record
  const { data: document, error: docError } = await supabase
    .from('client_documents')
    .select('file_url, client_id')
    .eq('id', documentId)
    .single()

  if (docError || !document) {
    return { success: false, error: 'Document not found' }
  }

  // Extract file path from URL and delete from storage
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

  // Delete database record
  const { error } = await supabase
    .from('client_documents')
    .delete()
    .eq('id', documentId)

  if (error) {
    console.error('Error deleting document record:', error)
    return { success: false, error: error.message }
  }

  revalidatePath(`/admin/leads/${document.client_id}`)
  revalidatePath('/admin')
  revalidatePath(`/client/documents`)

  return { success: true }
}

// Client upload - uses session-based auth for client portal
export async function clientUploadFile(
  documentType: DocumentType,
  file: File,
  title?: string,
  description?: string
) {
  // Get client session from cookies
  const { cookies } = await import('next/headers')
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get('client_session')?.value

  if (!sessionToken) {
    return { success: false, error: 'Not authenticated' }
  }

  // Use admin client to bypass RLS and validate session
  const adminClient = createAdminClient()

  // Validate session
  const { data: session, error: sessionError } = await adminClient
    .from('client_sessions')
    .select('client_id, expires_at')
    .eq('session_token', sessionToken)
    .single()

  if (sessionError || !session) {
    return { success: false, error: 'Invalid session' }
  }

  if (new Date(session.expires_at) < new Date()) {
    return { success: false, error: 'Session expired' }
  }

  const clientId = session.client_id

  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    return { success: false, error: 'File too large. Maximum size is 10MB.' }
  }

  // Validate content type
  const allowedTypes = ALLOWED_TYPES[documentType] || ALLOWED_TYPES.other
  if (!allowedTypes.includes(file.type)) {
    return {
      success: false,
      error: `File type ${file.type} not allowed for ${documentType}`,
    }
  }

  // Generate unique file path
  const timestamp = Date.now()
  const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
  const filePath = `${clientId}/${documentType}/${timestamp}-${sanitizedFileName}`

  // Convert File to ArrayBuffer for upload
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  // Upload file to storage using admin client
  const { error: uploadError } = await adminClient.storage
    .from(BUCKET_NAME)
    .upload(filePath, buffer, {
      contentType: file.type,
      upsert: false,
    })

  if (uploadError) {
    console.error('Error uploading file:', uploadError)
    return { success: false, error: uploadError.message }
  }

  // Get public URL
  const { data: urlData } = adminClient.storage
    .from(BUCKET_NAME)
    .getPublicUrl(filePath)

  // Create document record - client uploads are always visible to client
  const { data, error } = await adminClient
    .from('client_documents')
    .insert({
      client_id: clientId,
      title: title || file.name,
      description: description || null,
      document_type: documentType,
      file_url: urlData.publicUrl,
      file_size_bytes: file.size,
      file_mime_type: file.type,
      is_visible_to_client: true,
      uploaded_by: null, // Client upload, no admin user
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating document record:', error)
    // Clean up uploaded file
    await adminClient.storage.from(BUCKET_NAME).remove([filePath])
    return { success: false, error: error.message }
  }

  revalidatePath(`/client/documents`)

  return { success: true, document: data }
}
