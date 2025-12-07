-- Ensure test client exists for client portal testing
-- This creates or updates the test client with email elchaseo5@gmail.com

-- First, check if the client exists
DO $$
DECLARE
  client_exists BOOLEAN;
  client_id_var UUID;
BEGIN
  -- Check if client with this email exists
  SELECT EXISTS (
    SELECT 1 FROM leads WHERE email = 'elchaseo5@gmail.com'
  ) INTO client_exists;

  IF client_exists THEN
    -- Update existing client
    UPDATE leads
    SET
      name = 'Chase Harmon',
      phone = '555-1234',
      expected_due_date = CURRENT_DATE + INTERVAL '90 days',
      client_type = 'expecting',
      lifecycle_stage = 'active_client',
      email_verified = true
    WHERE email = 'elchaseo5@gmail.com'
    RETURNING id INTO client_id_var;

    RAISE NOTICE 'Updated existing client: %', client_id_var;
  ELSE
    -- Insert new client
    INSERT INTO leads (
      name,
      email,
      phone,
      expected_due_date,
      client_type,
      lifecycle_stage,
      email_verified,
      created_at
    ) VALUES (
      'Chase Harmon',
      'elchaseo5@gmail.com',
      '555-1234',
      CURRENT_DATE + INTERVAL '90 days',
      'expecting',
      'active_client',
      true,
      NOW()
    )
    RETURNING id INTO client_id_var;

    RAISE NOTICE 'Created new client: %', client_id_var;
  END IF;
END $$;

-- Verify the client exists
SELECT
  id,
  name,
  email,
  phone,
  client_type,
  lifecycle_stage,
  expected_due_date,
  created_at
FROM leads
WHERE email = 'elchaseo5@gmail.com';
