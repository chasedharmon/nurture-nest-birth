#!/usr/bin/env node

/**
 * Seed E2E Test Client
 *
 * This script creates a test client account in the database for E2E testing.
 * The client can be logged into using the email: e2e-test-client@example.com
 * and password: password123 (dev mode fallback).
 *
 * Usage: node scripts/seed-e2e-test-client.mjs
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const TEST_CLIENT = {
  source: 'manual',
  status: 'client',
  name: 'E2E Test Client',
  email: 'e2e-test-client@example.com',
  phone: '(555) 123-4567',
  message: 'Test client account for E2E automated testing',
}

async function main() {
  console.log('Seeding E2E test client...')

  // Check if test client already exists
  const { data: existing, error: checkError } = await supabase
    .from('leads')
    .select('id, email')
    .eq('email', TEST_CLIENT.email)
    .single()

  if (checkError && checkError.code !== 'PGRST116') {
    // PGRST116 = no rows returned
    console.error('Error checking for existing client:', checkError)
    process.exit(1)
  }

  if (existing) {
    console.log('Test client already exists:', existing.email)
    return
  }

  // Try to get the first organization for org_id (may not exist in all setups)
  let orgId = null
  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .select('id')
    .limit(1)
    .single()

  if (!orgError && org) {
    orgId = org.id
    console.log('Using organization:', orgId)
  } else {
    console.log('No organizations found, creating client without org_id')
  }

  // Insert the test client
  const insertData = { ...TEST_CLIENT }
  if (orgId) {
    insertData.organization_id = orgId
  }

  const { data, error } = await supabase
    .from('leads')
    .insert(insertData)
    .select()
    .single()

  if (error) {
    console.error('Error creating test client:', error)
    process.exit(1)
  }

  console.log('Test client created successfully!')
  console.log('  ID:', data.id)
  console.log('  Email:', data.email)
  console.log('  Status:', data.status)
  console.log('')
  console.log('You can now log in with:')
  console.log('  Email: e2e-test-client@example.com')
  console.log('  Password: password123 (dev mode only)')
}

main().catch(console.error)
