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

async function testTeamAssignment() {
  console.log('🔍 Testing Team Member Assignment Flow...\n')

  // 1. Get an existing team member
  console.log('1. Getting team members...')
  const { data: teamMembers, error: teamError } = await supabase
    .from('team_members')
    .select('*')
    .limit(5)

  if (teamError) {
    console.error('❌ Failed to get team members:', teamError)
    return
  }
  console.log(`   ✅ Found ${teamMembers?.length || 0} team member(s)`)
  if (teamMembers?.length > 0) {
    console.log(
      `   Team member: ${teamMembers[0].display_name} (${teamMembers[0].id})`
    )
  }

  // 2. Get clients with status 'client'
  console.log('\n2. Getting clients...')
  const { data: clients, error: clientError } = await supabase
    .from('leads')
    .select('id, name, email, status')
    .eq('status', 'client')
    .limit(5)

  if (clientError) {
    console.error('❌ Failed to get clients:', clientError)
    return
  }
  console.log(`   ✅ Found ${clients?.length || 0} client(s)`)
  if (clients?.length > 0) {
    console.log(`   Client: ${clients[0].name} (${clients[0].id})`)
  }

  // 3. Test creating a client assignment
  if (teamMembers?.length > 0 && clients?.length > 0) {
    console.log('\n3. Testing client assignment creation...')
    const teamMemberId = teamMembers[0].id
    const clientId = clients[0].id

    // Check if assignment already exists
    const { data: existing } = await supabase
      .from('client_assignments')
      .select('*')
      .eq('client_id', clientId)
      .eq('team_member_id', teamMemberId)
      .single()

    if (existing) {
      console.log('   ⚠️  Assignment already exists, skipping creation')
      console.log(`   Existing assignment ID: ${existing.id}`)
    } else {
      // Create the assignment
      // Note: This may fail if the log_client_assignment_activity trigger
      // uses wrong column name. Run the fix migration to correct it.
      const { data: assignment, error: assignError } = await supabase
        .from('client_assignments')
        .insert({
          client_id: clientId,
          team_member_id: teamMemberId,
          assignment_role: 'primary',
          notes: 'Test assignment from script',
        })
        .select(
          `
          *,
          team_member:team_members!client_assignments_team_member_id_fkey(id, display_name, email)
        `
        )
        .single()

      if (assignError) {
        console.error('❌ Failed to create assignment:', assignError)
        if (
          assignError.code === '42703' &&
          assignError.message.includes('description')
        ) {
          console.log('\n   ⚠️  The trigger function needs to be fixed.')
          console.log('   Run this SQL in Supabase SQL Editor:')
          console.log(`
   CREATE OR REPLACE FUNCTION log_client_assignment_activity()
   RETURNS TRIGGER AS $$
   DECLARE
     v_client_name TEXT;
     v_member_name TEXT;
   BEGIN
     SELECT name INTO v_client_name FROM leads WHERE id = NEW.client_id;
     SELECT display_name INTO v_member_name FROM team_members WHERE id = NEW.team_member_id;

     INSERT INTO lead_activities (lead_id, activity_type, content, created_by_user_id)
     VALUES (
       NEW.client_id,
       'team_assigned',
       format('%s assigned as %s provider', v_member_name, NEW.assignment_role),
       (SELECT user_id FROM team_members WHERE id = NEW.assigned_by)
     );

     RETURN NEW;
   END;
   $$ LANGUAGE plpgsql;
          `)
        }
      } else {
        console.log('   ✅ Assignment created successfully!')
        console.log(`   Assignment ID: ${assignment.id}`)
        console.log(`   Team member: ${assignment.team_member?.display_name}`)
      }
    }
  }

  // 4. Test querying assignments with FK syntax
  console.log('\n4. Testing assignment query with FK syntax...')
  const { data: assignments, error: queryError } = await supabase
    .from('client_assignments')
    .select(
      `
      *,
      team_member:team_members!client_assignments_team_member_id_fkey(
        id, display_name, email, role, phone
      ),
      client:leads!client_assignments_client_id_fkey(
        id, name, email, status
      )
    `
    )
    .limit(10)

  if (queryError) {
    console.error('❌ Failed to query assignments:', queryError)
  } else {
    console.log(
      `   ✅ Query successful! Found ${assignments?.length || 0} assignment(s)`
    )
    if (assignments?.length > 0) {
      console.log('\n   Assignments:')
      for (const a of assignments) {
        console.log(
          `   - ${a.team_member?.display_name || 'Unknown'} → ${a.client?.name || 'Unknown'} (${a.assignment_role})`
        )
      }
    }
  }

  // 5. Test getClientsWithTeamAssignments query pattern
  console.log('\n5. Testing getClientsWithTeamAssignments query pattern...')
  const { data: clientsWithTeam, error: cwError } = await supabase
    .from('leads')
    .select(
      `
      id,
      name,
      email,
      status,
      team_assignments:client_assignments(
        id,
        assignment_role,
        team_member:team_members!client_assignments_team_member_id_fkey(
          id,
          display_name,
          email
        )
      )
    `
    )
    .eq('status', 'client')
    .limit(10)

  if (cwError) {
    console.error('❌ Failed to query clients with team:', cwError)
  } else {
    console.log(
      `   ✅ Query successful! Found ${clientsWithTeam?.length || 0} client(s)`
    )
    if (clientsWithTeam?.length > 0) {
      for (const c of clientsWithTeam) {
        console.log(
          `   - ${c.name}: ${c.team_assignments?.length || 0} team assignment(s)`
        )
        for (const ta of c.team_assignments || []) {
          console.log(
            `     → ${ta.team_member?.display_name || 'Unknown'} (${ta.assignment_role})`
          )
        }
      }
    }
  }

  // 6. Test oncall_schedule query
  console.log('\n6. Testing oncall_schedule query with FK syntax...')
  const { data: schedules, error: schedError } = await supabase
    .from('oncall_schedule')
    .select(
      `
      *,
      team_member:team_members!oncall_schedule_team_member_id_fkey(id, display_name, phone, oncall_phone)
    `
    )
    .limit(5)

  if (schedError) {
    console.error('❌ Failed to query on-call schedules:', schedError)
  } else {
    console.log(
      `   ✅ Query successful! Found ${schedules?.length || 0} schedule(s)`
    )
  }

  console.log('\n🎉 All tests completed!')
}

testTeamAssignment().catch(console.error)
