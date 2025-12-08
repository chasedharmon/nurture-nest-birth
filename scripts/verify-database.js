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

async function verifyDatabase() {
  console.log('🔍 Verifying Supabase database setup...\n')

  const tables = [
    'users',
    'leads',
    'lead_activities',
    'client_services',
    'meetings',
    'client_documents',
    'payments',
    'invoices',
    'invoice_payments',
    'contract_templates',
    'contract_signatures',
    // Team management tables
    'team_members',
    'client_assignments',
    'service_assignments',
    'time_entries',
    'oncall_schedule',
  ]
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
    console.log('🎉 Database is set up correctly!')
    console.log('\n📝 Next steps:')
    console.log('   1. Create your admin user account')
    console.log('   2. Test adding a sample lead')
    console.log('   3. Build the admin dashboard')
  } else {
    console.log('⚠️  Some tables are missing.')
    console.log('\n📋 Please run the migration:')
    console.log('   See MIGRATION_INSTRUCTIONS.md for details')
  }
}

verifyDatabase()
