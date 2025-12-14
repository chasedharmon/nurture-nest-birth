-- Add RLS policies for organization_memberships table
-- These allow users to read their own memberships and allow org owners/admins to manage memberships

-- Policy: Users can read their own memberships
CREATE POLICY "Users can read their own memberships"
ON organization_memberships
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Policy: Users can read memberships of organizations they belong to
CREATE POLICY "Users can read memberships of their organizations"
ON organization_memberships
FOR SELECT
TO authenticated
USING (
  organization_id IN (
    SELECT om.organization_id
    FROM organization_memberships om
    WHERE om.user_id = auth.uid() AND om.is_active = true
  )
);

-- Policy: Org owners and admins can insert memberships
CREATE POLICY "Org owners and admins can insert memberships"
ON organization_memberships
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM organization_memberships om
    WHERE om.organization_id = organization_memberships.organization_id
    AND om.user_id = auth.uid()
    AND om.is_active = true
    AND om.role IN ('owner', 'admin')
  )
);

-- Policy: Org owners and admins can update memberships
CREATE POLICY "Org owners and admins can update memberships"
ON organization_memberships
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM organization_memberships om
    WHERE om.organization_id = organization_memberships.organization_id
    AND om.user_id = auth.uid()
    AND om.is_active = true
    AND om.role IN ('owner', 'admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM organization_memberships om
    WHERE om.organization_id = organization_memberships.organization_id
    AND om.user_id = auth.uid()
    AND om.is_active = true
    AND om.role IN ('owner', 'admin')
  )
);

-- Policy: Org owners can delete memberships
CREATE POLICY "Org owners can delete memberships"
ON organization_memberships
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM organization_memberships om
    WHERE om.organization_id = organization_memberships.organization_id
    AND om.user_id = auth.uid()
    AND om.is_active = true
    AND om.role = 'owner'
  )
);
