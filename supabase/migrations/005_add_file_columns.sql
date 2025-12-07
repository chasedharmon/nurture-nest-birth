-- Add missing file columns to client_documents table
-- This adds the file_size_bytes and file_mime_type columns needed for file uploads

-- Add file_size_bytes column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'client_documents' AND column_name = 'file_size_bytes'
  ) THEN
    ALTER TABLE client_documents ADD COLUMN file_size_bytes INTEGER;
  END IF;
END $$;

-- Add file_mime_type column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'client_documents' AND column_name = 'file_mime_type'
  ) THEN
    ALTER TABLE client_documents ADD COLUMN file_mime_type VARCHAR(100);
  END IF;
END $$;

-- If the old columns exist (file_size, mime_type), migrate data and rename
DO $$
BEGIN
  -- Check if old file_size column exists and new one doesn't have data
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'client_documents' AND column_name = 'file_size'
  ) THEN
    -- Copy data from old column to new column
    UPDATE client_documents SET file_size_bytes = file_size WHERE file_size_bytes IS NULL AND file_size IS NOT NULL;
  END IF;

  -- Check if old mime_type column exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'client_documents' AND column_name = 'mime_type'
  ) THEN
    -- Copy data from old column to new column
    UPDATE client_documents SET file_mime_type = mime_type WHERE file_mime_type IS NULL AND mime_type IS NOT NULL;
  END IF;
END $$;

-- Ensure is_visible_to_client column exists (some schemas use is_client_visible)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'client_documents' AND column_name = 'is_visible_to_client'
  ) THEN
    -- Check if is_client_visible exists and rename it
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'client_documents' AND column_name = 'is_client_visible'
    ) THEN
      ALTER TABLE client_documents RENAME COLUMN is_client_visible TO is_visible_to_client;
    ELSE
      ALTER TABLE client_documents ADD COLUMN is_visible_to_client BOOLEAN DEFAULT TRUE;
    END IF;
  END IF;
END $$;
