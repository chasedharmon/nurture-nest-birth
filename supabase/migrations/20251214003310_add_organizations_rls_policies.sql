-- Add RLS policies for organizations table
-- These allow users to read organizations they belong to through memberships

-- Policy: Users can read organizations they are members of
CREATE POLICY "Users can read their organizations"
ON organizations
FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT om.organization_id
    FROM organization_memberships om
    WHERE om.user_id = auth.uid() AND om.is_active = true
  )
);

-- Policy: Organization owners can update their organization
CREATE POLICY "Org owners can update their organization"
ON organizations
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM organization_memberships om
    WHERE om.organization_id = organizations.id
    AND om.user_id = auth.uid()
    AND om.is_active = true
    AND om.role = 'owner'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM organization_memberships om
    WHERE om.organization_id = organizations.id
    AND om.user_id = auth.uid()
    AND om.is_active = true
    AND om.role = 'owner'
  )
);

-- Note: INSERT and DELETE for organizations is typically handled by
-- platform admin operations using the service role, not end users
