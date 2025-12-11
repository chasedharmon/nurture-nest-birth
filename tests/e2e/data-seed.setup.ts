/**
 * E2E Test Data Seeding Setup
 *
 * Seeds all required test data for E2E tests:
 * - Team member (provider)
 * - Client assignment (links provider to test client)
 * - Conversation between admin and client
 * - Conversation participants
 * - Seed messages
 * - Workflow with steps (for workflow enhancement tests)
 *
 * Uses Supabase service role key to bypass RLS.
 * All operations are idempotent (safe to run multiple times).
 */

import { test as setup } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'

// Test user emails (must match auth.setup.ts)
const ADMIN_EMAIL = 'chase.d.harmon@gmail.com'
const CLIENT_EMAIL = 'makharmon@kearneycats.com'

// Fixed UUIDs for idempotent seeding
const E2E_TEAM_MEMBER_ID = 'e2e00000-0000-0000-0000-000000000001'
const E2E_ASSIGNMENT_ID = 'e2e00000-0000-0000-0000-000000000002'
const E2E_CONVERSATION_ID = 'e2e00000-0000-0000-0000-000000000003'
const E2E_MESSAGE_ADMIN_ID = 'e2e00000-0000-0000-0000-000000000004'
const E2E_MESSAGE_CLIENT_ID = 'e2e00000-0000-0000-0000-000000000005'
const E2E_WORKFLOW_ID = 'e2e00000-0000-0000-0000-000000000010'
const E2E_WORKFLOW_STEP_TRIGGER_ID = 'e2e00000-0000-0000-0000-000000000011'
const E2E_WORKFLOW_STEP_ACTION_ID = 'e2e00000-0000-0000-0000-000000000012'
const E2E_WORKFLOW_STEP_END_ID = 'e2e00000-0000-0000-0000-000000000013'

setup('seed test data', async () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    console.log('\n⚠️  Missing Supabase credentials - skipping data seeding')
    console.log(
      '   NEXT_PUBLIC_SUPABASE_URL:',
      supabaseUrl ? '✓ set' : '✗ missing'
    )
    console.log(
      '   SUPABASE_SERVICE_ROLE_KEY:',
      serviceRoleKey ? '✓ set' : '✗ missing'
    )
    if (!serviceRoleKey) {
      console.log(
        '\n   To enable data seeding, add SUPABASE_SERVICE_ROLE_KEY to .env.local'
      )
      console.log(
        '   Get it from: Supabase Dashboard → Project Settings → API → service_role key'
      )
    }
    console.log(
      '\n   Note: Tests will still run but may skip due to missing test data.\n'
    )
    return
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  console.log('\n=== E2E DATA SEEDING ===\n')

  // Step 1: Get admin user ID from public.users table
  console.log('1. Looking up admin user...')
  const { data: adminUser, error: adminError } = await supabase
    .from('users')
    .select('id, email, full_name')
    .eq('email', ADMIN_EMAIL)
    .single()

  if (adminError || !adminUser) {
    console.error('Failed to find admin user:', adminError?.message)
    console.log('Admin email:', ADMIN_EMAIL)
    return
  }
  console.log(
    `   Found admin: ${adminUser.full_name || adminUser.email} (${adminUser.id})`
  )

  // Step 2: Get test client lead
  console.log('2. Looking up test client lead...')
  const { data: clientLead, error: clientError } = await supabase
    .from('leads')
    .select('id, name, email, status')
    .eq('email', CLIENT_EMAIL)
    .single()

  if (clientError || !clientLead) {
    console.error('Failed to find test client lead:', clientError?.message)
    console.log('Client email:', CLIENT_EMAIL)
    console.log('Ensure the e2e_test_client_seed migration has run.')
    return
  }
  console.log(`   Found client: ${clientLead.name} (${clientLead.id})`)

  // Step 3: Get or create team member (admin role required for workflow tests)
  console.log('3. Getting/creating team member...')

  // First check if user already has a team member entry
  const { data: existingTeamMember } = await supabase
    .from('team_members')
    .select('id, display_name, role')
    .eq('user_id', adminUser.id)
    .single()

  let teamMember: { id: string; display_name: string; role: string }

  if (existingTeamMember) {
    // Use existing team member, but ensure they have admin role
    if (
      existingTeamMember.role !== 'admin' &&
      existingTeamMember.role !== 'owner'
    ) {
      await supabase
        .from('team_members')
        .update({ role: 'admin' })
        .eq('id', existingTeamMember.id)
      console.log(`   Updated existing team member role to admin`)
    }
    teamMember = { ...existingTeamMember, role: 'admin' }
    console.log(
      `   Using existing team member: ${teamMember.display_name} (${teamMember.id})`
    )
  } else {
    // Create new team member
    const { data: newTeamMember, error: teamError } = await supabase
      .from('team_members')
      .upsert(
        {
          id: E2E_TEAM_MEMBER_ID,
          user_id: adminUser.id,
          display_name: 'E2E Test Provider',
          email: ADMIN_EMAIL,
          role: 'admin',
          is_active: true,
          is_accepting_clients: true,
          title: 'Test Doula',
        },
        { onConflict: 'id' }
      )
      .select()
      .single()

    if (teamError || !newTeamMember) {
      console.error('Failed to create team member:', teamError?.message)
      return
    }
    teamMember = newTeamMember
    console.log(
      `   Created team member: ${teamMember.display_name} (${teamMember.id})`
    )
  }

  // Step 4: Create client assignment (provider → client)
  console.log('4. Creating client assignment...')
  const { error: assignmentError } = await supabase
    .from('client_assignments')
    .upsert(
      {
        id: E2E_ASSIGNMENT_ID,
        client_id: clientLead.id,
        team_member_id: teamMember.id,
        assignment_role: 'primary',
        notes: 'E2E test assignment - primary provider',
      },
      { onConflict: 'id' }
    )

  if (assignmentError) {
    console.error(
      'Failed to create client assignment:',
      assignmentError.message
    )
    // Continue anyway - assignment might already exist with different ID
  } else {
    console.log('   Assignment created: primary provider → client')
  }

  // Step 5: Create conversation
  console.log('5. Creating conversation...')
  const { data: conversation, error: convError } = await supabase
    .from('conversations')
    .upsert(
      {
        id: E2E_CONVERSATION_ID,
        client_id: clientLead.id,
        subject: 'E2E Test Conversation',
        conversation_type: 'direct',
        status: 'active',
        last_message_at: new Date().toISOString(),
        last_message_preview: 'Test message for E2E testing',
      },
      { onConflict: 'id' }
    )
    .select()
    .single()

  if (convError) {
    console.error('Failed to create conversation:', convError.message)
    return
  }
  console.log(`   Conversation: ${conversation.subject} (${conversation.id})`)

  // Step 6: Add conversation participants
  console.log('6. Adding conversation participants...')

  // Add admin participant
  const { error: adminPartError } = await supabase
    .from('conversation_participants')
    .upsert(
      {
        conversation_id: conversation.id,
        user_id: adminUser.id,
        role: 'owner',
        display_name: adminUser.full_name || 'Admin',
        last_read_at: new Date().toISOString(),
        unread_count: 0,
      },
      { onConflict: 'conversation_id,user_id', ignoreDuplicates: true }
    )

  if (adminPartError) {
    console.error('Failed to add admin participant:', adminPartError.message)
  } else {
    console.log('   Added admin as participant')
  }

  // Add client participant
  const { error: clientPartError } = await supabase
    .from('conversation_participants')
    .upsert(
      {
        conversation_id: conversation.id,
        client_id: clientLead.id,
        role: 'participant',
        display_name: clientLead.name,
        unread_count: 1, // Has unread message from admin
      },
      { onConflict: 'conversation_id,client_id', ignoreDuplicates: true }
    )

  if (clientPartError) {
    console.error('Failed to add client participant:', clientPartError.message)
  } else {
    console.log('   Added client as participant')
  }

  // Step 7: Add seed messages
  console.log('7. Adding seed messages...')

  // Message from admin
  const { error: msg1Error } = await supabase.from('messages').upsert(
    {
      id: E2E_MESSAGE_ADMIN_ID,
      conversation_id: conversation.id,
      sender_user_id: adminUser.id,
      sender_name: adminUser.full_name || 'Admin',
      content: 'Hello! This is a test message from the admin for E2E testing.',
      content_type: 'text',
      is_system_message: false,
      is_read: true,
      created_at: new Date(Date.now() - 60000).toISOString(), // 1 minute ago
    },
    { onConflict: 'id' }
  )

  if (msg1Error) {
    console.error('Failed to create admin message:', msg1Error.message)
  } else {
    console.log('   Added message from admin')
  }

  // Message from client
  const { error: msg2Error } = await supabase.from('messages').upsert(
    {
      id: E2E_MESSAGE_CLIENT_ID,
      conversation_id: conversation.id,
      sender_client_id: clientLead.id,
      sender_name: clientLead.name,
      content: 'Hi! This is a test reply from the client for E2E testing.',
      content_type: 'text',
      is_system_message: false,
      is_read: false,
      created_at: new Date().toISOString(), // Now
    },
    { onConflict: 'id' }
  )

  if (msg2Error) {
    console.error('Failed to create client message:', msg2Error.message)
  } else {
    console.log('   Added message from client')
  }

  // Step 8: Create workflow for workflow enhancement tests
  console.log('8. Creating E2E test workflow...')

  const { data: workflow, error: workflowError } = await supabase
    .from('workflows')
    .upsert(
      {
        id: E2E_WORKFLOW_ID,
        name: 'E2E Test Workflow',
        description: 'Test workflow for E2E automation tests',
        object_type: 'lead',
        trigger_type: 'record_create',
        is_active: true,
        is_template: false,
        evaluation_order: 0,
        canvas_data: {
          viewport: { x: 0, y: 0, zoom: 1 },
        },
        created_by: adminUser.id,
      },
      { onConflict: 'id' }
    )
    .select()
    .single()

  if (workflowError) {
    console.error('Failed to create workflow:', workflowError.message)
  } else {
    console.log(`   Workflow: ${workflow.name} (${workflow.id})`)

    // Step 9: Create workflow steps
    console.log('9. Creating workflow steps...')

    // Trigger step
    const { error: triggerError } = await supabase
      .from('workflow_steps')
      .upsert(
        {
          id: E2E_WORKFLOW_STEP_TRIGGER_ID,
          workflow_id: E2E_WORKFLOW_ID,
          step_order: 1,
          step_key: 'trigger',
          step_type: 'trigger',
          step_config: {},
          position_x: 250,
          position_y: 50,
          next_step_key: 'send_email',
        },
        { onConflict: 'id' }
      )

    if (triggerError) {
      console.error('Failed to create trigger step:', triggerError.message)
    } else {
      console.log('   Added trigger step')
    }

    // Action step (send_email)
    const { error: actionError } = await supabase.from('workflow_steps').upsert(
      {
        id: E2E_WORKFLOW_STEP_ACTION_ID,
        workflow_id: E2E_WORKFLOW_ID,
        step_order: 2,
        step_key: 'send_email',
        step_type: 'send_email',
        step_config: {
          template_name: 'Welcome Email',
          to_field: 'email',
          subject: 'Welcome to our practice!',
        },
        position_x: 250,
        position_y: 200,
        next_step_key: 'end',
      },
      { onConflict: 'id' }
    )

    if (actionError) {
      console.error('Failed to create action step:', actionError.message)
    } else {
      console.log('   Added send_email action step')
    }

    // End step
    const { error: endError } = await supabase.from('workflow_steps').upsert(
      {
        id: E2E_WORKFLOW_STEP_END_ID,
        workflow_id: E2E_WORKFLOW_ID,
        step_order: 3,
        step_key: 'end',
        step_type: 'end',
        step_config: {},
        position_x: 250,
        position_y: 350,
      },
      { onConflict: 'id' }
    )

    if (endError) {
      console.error('Failed to create end step:', endError.message)
    } else {
      console.log('   Added end step')
    }
  }

  console.log('\n=== DATA SEEDING COMPLETE ===\n')
  console.log('Seeded data summary:')
  console.log(`  - Team member: ${teamMember.display_name}`)
  console.log(`  - Client: ${clientLead.name}`)
  console.log(`  - Assignment: primary provider`)
  console.log(`  - Conversation: ${conversation.subject}`)
  console.log(`  - Messages: 2 (1 from admin, 1 from client)`)
  console.log(`  - Workflow: E2E Test Workflow (with 3 steps)`)
})
