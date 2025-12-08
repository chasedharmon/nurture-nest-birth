# Phase 4.4 Testing Guide - File Management & Document Upload

## Overview

Phase 4.4 implements file upload functionality using Supabase Storage. Documents can be uploaded by both admins and clients with proper validation and storage.

## Storage Setup (Completed)

- **Bucket:** `client-documents`
- **Public:** Yes (files accessible via URL)
- **Max file size:** 10MB
- **Allowed types:** PDF, DOC, DOCX, TXT, JPEG, PNG, WebP, GIF

## Testing Scenarios

### 1. Admin Document Upload

**Location:** Admin Dashboard > Client Detail > Documents Tab

#### Test File Upload Mode

1. Click "Upload Document" button
2. Verify "Upload File" mode is selected (default)
3. Select document type from dropdown
4. Enter optional title and description
5. Drag and drop a file OR click to browse
6. Verify file validation:
   - [ ] Files > 10MB show error
   - [ ] Wrong file types for category show error
7. Verify upload progress indicator appears
8. Verify success message and page refresh
9. Confirm document appears in list with correct metadata

#### Test URL Mode

1. Click "Add URL" toggle
2. Enter external file URL
3. Fill in title and document type
4. Submit and verify document is added

#### File Type Validation by Category

| Document Type | Allowed Extensions                         |
| ------------- | ------------------------------------------ |
| Contract      | .pdf                                       |
| Birth Plan    | .pdf, .doc, .docx                          |
| Resource      | .pdf, .doc, .docx, .txt                    |
| Photo         | .jpg, .jpeg, .png, .webp, .gif             |
| Invoice       | .pdf                                       |
| Form          | .pdf, .doc, .docx                          |
| Other         | .pdf, .doc, .docx, .jpg, .jpeg, .png, .txt |

### 2. Client Document Upload

**Location:** Client Portal > Documents

#### Test Client Upload

1. Login to client portal
2. Navigate to Documents page
3. Click "Upload Document" button
4. Select document type:
   - [ ] Birth Plan
   - [ ] Photo
   - [ ] Form / Paperwork
   - [ ] Other Document
5. Enter optional title and description
6. Upload a file
7. Verify:
   - [ ] Upload progress shows
   - [ ] Success animation displays
   - [ ] Document appears in list
   - [ ] Document is visible to client (is_visible_to_client = true)

### 3. Document Visibility

#### Admin Controls

- [ ] New admin uploads default to "Admin only"
- [ ] Admin can toggle visibility to "Visible to client"
- [ ] Hidden documents don't appear in client portal

#### Client Behavior

- [ ] Clients only see documents marked as visible
- [ ] Client uploads are always visible to themselves
- [ ] Clients cannot change visibility settings

### 4. File Storage Verification

#### Supabase Storage

1. Go to Supabase Dashboard > Storage
2. Click on `client-documents` bucket
3. Verify:
   - [ ] Files organized by: `{client_id}/{document_type}/{timestamp}-{filename}`
   - [ ] Files are publicly accessible via URL
   - [ ] File metadata matches database record

#### Database Records

Check `client_documents` table:

```sql
SELECT id, client_id, title, document_type, file_url, file_size_bytes,
       file_mime_type, is_visible_to_client, uploaded_by
FROM client_documents
ORDER BY created_at DESC
LIMIT 10;
```

### 5. Error Handling

#### Test Upload Failures

- [ ] Network disconnection during upload shows error
- [ ] Invalid file type shows specific error message
- [ ] File too large shows size limit message
- [ ] Missing document type shows validation error

### 6. Drag and Drop

- [ ] Drag area highlights when dragging file over
- [ ] Single file drop uploads correctly
- [ ] Multiple file drop only takes first file (single upload component)
- [ ] Drag outside target area cancels highlight

## Quick Verification Steps

1. **Admin Upload Test:**

   ```
   Admin Dashboard → Select Client → Documents Tab → Upload Document →
   Select PDF → Verify appears in list
   ```

2. **Client Upload Test:**

   ```
   Client Portal → Documents → Upload Document →
   Select Birth Plan type → Upload PDF → Verify success
   ```

3. **Storage Verification:**
   ```
   Supabase Dashboard → Storage → client-documents →
   Verify file exists in correct path
   ```

## Known Limitations

- Single file upload only (multi-file coming in future)
- 10MB maximum file size
- Public URLs (consider signed URLs for sensitive documents)
- Client uploads limited to: birth_plan, photo, form, other

## Troubleshooting

### "Upload failed" error

1. Check browser console for errors
2. Verify Supabase Storage policies are applied
3. Check file size and type restrictions

### Files not appearing

1. Verify database record was created
2. Check `is_visible_to_client` flag
3. Refresh the page (router.refresh() called automatically)

### Permission errors

1. Verify RLS policies on storage.objects
2. Check user authentication status
3. For client uploads, verify session cookie exists
