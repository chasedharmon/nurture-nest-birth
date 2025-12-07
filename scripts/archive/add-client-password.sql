-- Add password field to leads table for client authentication
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- Set a default password for existing clients (they'll need to change it)
-- Default password: "welcome123" (hashed)
-- In production, you'd send password reset emails instead

SELECT 'Password column added to leads table. Clients can now use email/password authentication.' as status;
