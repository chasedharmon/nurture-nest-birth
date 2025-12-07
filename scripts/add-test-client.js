import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables!')
  console.error(
    'NEXT_PUBLIC_SUPABASE_URL:',
    supabaseUrl ? 'Present' : 'Missing'
  )
  console.error(
    'SUPABASE_SERVICE_ROLE_KEY:',
    supabaseServiceKey ? 'Present' : 'Missing'
  )
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function addTestClient() {
  const testEmail = 'elchaseo5@gmail.com'

  console.log('Checking if test client exists...')

  // Check if client exists
  const { data: existingClients, error: checkError } = await supabase
    .from('leads')
    .select('id, name, email, created_at')
    .eq('email', testEmail)
    .order('created_at', { ascending: true })

  if (checkError) {
    console.error('Error checking for existing client:', checkError)
    process.exit(1)
  }

  if (existingClients && existingClients.length > 0) {
    console.log(
      `Found ${existingClients.length} client(s) with email ${testEmail}`
    )

    // If multiple, delete duplicates and keep the oldest one
    if (existingClients.length > 1) {
      console.log(
        'Multiple clients found. Keeping oldest, deleting duplicates...'
      )
      const keepClient = existingClients[0]
      const duplicateIds = existingClients.slice(1).map(c => c.id)

      const { error: deleteError } = await supabase
        .from('leads')
        .delete()
        .in('id', duplicateIds)

      if (deleteError) {
        console.error('Error deleting duplicates:', deleteError)
      } else {
        console.log(`Deleted ${duplicateIds.length} duplicate(s)`)
      }

      console.log('Keeping client:', keepClient.id)
    }

    const existingClient = existingClients[0]
    console.log('Test client already exists!')
    console.log('ID:', existingClient.id)
    console.log('Name:', existingClient.name)
    console.log('Email:', existingClient.email)

    // Update to ensure it has the right data
    const { error: updateError } = await supabase
      .from('leads')
      .update({
        name: 'Chase Harmon',
        phone: '555-1234',
        expected_due_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0],
        client_type: 'expecting',
        lifecycle_stage: 'active_client',
        email_verified: true,
      })
      .eq('id', existingClient.id)

    if (updateError) {
      console.error('Error updating client:', updateError)
    } else {
      console.log('Test client updated successfully!')
    }
  } else {
    console.log('Creating new test client...')

    const { data: newClient, error: insertError } = await supabase
      .from('leads')
      .insert({
        name: 'Chase Harmon',
        email: testEmail,
        phone: '555-1234',
        expected_due_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0],
        client_type: 'expecting',
        lifecycle_stage: 'active_client',
        email_verified: true,
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error creating client:', insertError)
      process.exit(1)
    }

    console.log('Test client created successfully!')
    console.log('ID:', newClient.id)
    console.log('Name:', newClient.name)
    console.log('Email:', newClient.email)
  }

  console.log('\n✅ Test client ready!')
  console.log('\nYou can now log in at: http://localhost:3000/client/login')
  console.log('Email:', testEmail)
  console.log('Password: password123')
}

addTestClient()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Unexpected error:', error)
    process.exit(1)
  })
