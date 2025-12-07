/* eslint-disable @typescript-eslint/no-require-imports */
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

async function runMigration() {
  console.log('🚀 Running Phase 3.3 migration...\n')

  // Read the migration file
  const migrationPath = path.join(
    __dirname,
    '..',
    'supabase',
    'migrations',
    '20251207040000_client_management.sql'
  )
  const migrationSQL = fs.readFileSync(migrationPath, 'utf8')

  try {
    // Execute the migration using Supabase RPC
    const { error } = await supabase.rpc('exec_sql', { sql: migrationSQL })

    if (error) {
      console.error('❌ Migration failed:', error.message)
      process.exit(1)
    }

    console.log('✅ Migration completed successfully!\n')

    // Verify tables were created
    const tables = [
      'client_services',
      'meetings',
      'client_documents',
      'payments',
    ]
    console.log('🔍 Verifying new tables...\n')

    for (const table of tables) {
      try {
        const { count, error: verifyError } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true })

        if (verifyError) {
          console.log(
            `❌ ${table}: Not found or error - ${verifyError.message}`
          )
        } else {
          console.log(`✅ ${table}: Ready (${count ?? 0} rows)`)
        }
      } catch (error) {
        console.log(`❌ ${table}: Error - ${error.message}`)
      }
    }

    console.log('\n🎉 Phase 3.3 migration completed successfully!')
  } catch (error) {
    console.error('❌ Migration error:', error)
    process.exit(1)
  }
}

runMigration()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Unexpected error:', error)
    process.exit(1)
  })
