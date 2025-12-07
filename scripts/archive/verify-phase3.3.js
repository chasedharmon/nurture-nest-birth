/* eslint-disable @typescript-eslint/no-require-imports */
const { createClient } = require('@supabase/supabase-js')
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

async function verifyPhase33() {
  console.log('🔍 Verifying Phase 3.3 Database Setup...\n')
  console.log(
    'Expected Tables: client_services, meetings, client_documents, payments\n'
  )

  const tables = ['client_services', 'meetings', 'client_documents', 'payments']
  let allTablesExist = true

  for (const table of tables) {
    try {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true })

      if (error) {
        console.log(`❌ ${table}: Not found or error - ${error.message}`)
        allTablesExist = false
      } else {
        console.log(`✅ ${table}: Ready (${count ?? 0} rows)`)
      }
    } catch (error) {
      console.log(`❌ ${table}: Error - ${error.message}`)
      allTablesExist = false
    }
  }

  console.log()

  if (allTablesExist) {
    console.log('🎉 Phase 3.3 tables are set up correctly!')
    console.log('\n📝 Next steps:')
    console.log('   1. Build admin UI for managing client services')
    console.log('   2. Build admin UI for scheduling meetings')
    console.log('   3. Build admin UI for document uploads')
    console.log('   4. Build admin UI for payment recording')
  } else {
    console.log('⚠️  Some tables are missing!')
    console.log('\n📝 To create missing tables:')
    console.log('   1. Open Supabase Dashboard')
    console.log('   2. Go to SQL Editor')
    console.log(
      '   3. Run: supabase/migrations/20251207040000_client_management.sql'
    )
  }

  process.exit(allTablesExist ? 0 : 1)
}

verifyPhase33().catch(error => {
  console.error('Unexpected error:', error)
  process.exit(1)
})
