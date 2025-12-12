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
const E2E_ORGANIZATION_ID = 'e2e00000-0000-0000-0000-000000000000'
const E2E_TEAM_MEMBER_ID = 'e2e00000-0000-0000-0000-000000000001'
const E2E_ASSIGNMENT_ID = 'e2e00000-0000-0000-0000-000000000002'
const E2E_CONVERSATION_ID = 'e2e00000-0000-0000-0000-000000000003'
const E2E_MESSAGE_ADMIN_ID = 'e2e00000-0000-0000-0000-000000000004'
const E2E_MESSAGE_CLIENT_ID = 'e2e00000-0000-0000-0000-000000000005'
const E2E_BACKUP_ASSIGNMENT_ID = 'e2e00000-0000-0000-0000-000000000006'
const E2E_WORKFLOW_ID = 'e2e00000-0000-0000-0000-000000000010'
const E2E_WORKFLOW_STEP_TRIGGER_ID = 'e2e00000-0000-0000-0000-000000000011'
const E2E_WORKFLOW_STEP_ACTION_ID = 'e2e00000-0000-0000-0000-000000000012'
const E2E_WORKFLOW_STEP_END_ID = 'e2e00000-0000-0000-0000-000000000013'

// CRM Test Data UUIDs
const E2E_CRM_ACCOUNT_ID = 'e2e00000-0000-0000-0000-000000000100'
const E2E_CRM_CONTACT_ID = 'e2e00000-0000-0000-0000-000000000101'
const E2E_CRM_LEAD_ID = 'e2e00000-0000-0000-0000-000000000102'
const E2E_CRM_OPPORTUNITY_ID = 'e2e00000-0000-0000-0000-000000000103'
const E2E_CRM_ACTIVITY_EVENT_ID = 'e2e00000-0000-0000-0000-000000000104'
const E2E_CRM_ACTIVITY_TASK_ID = 'e2e00000-0000-0000-0000-000000000105'
const E2E_CRM_ACTIVITY_CALL_ID = 'e2e00000-0000-0000-0000-000000000106'

// Portal Test Data UUIDs (lead and contact with portal access)
const E2E_PORTAL_LEAD_ID = 'e2e00000-0000-0000-0000-000000000150'
const E2E_PORTAL_CONTACT_ID = 'e2e00000-0000-0000-0000-000000000151'
const E2E_PORTAL_ACCOUNT_ID = 'e2e00000-0000-0000-0000-000000000152'
const E2E_PORTAL_OPPORTUNITY_ID = 'e2e00000-0000-0000-0000-000000000153'
const E2E_PORTAL_ACTIVITY_ID = 'e2e00000-0000-0000-0000-000000000154'

// Test emails for CRM
const CRM_CONTACT_EMAIL = 'e2e.contact@example.com'
const CRM_LEAD_EMAIL = 'e2e.lead@example.com'
const PORTAL_LEAD_EMAIL = 'portal.lead@example.com'
const PORTAL_CONTACT_EMAIL = 'portal.contact@example.com'

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

  // Step 2: Create/update organization for multi-tenancy (if table exists)
  console.log(
    '2. Creating organization (if multi-tenancy migration applied)...'
  )
  let organization: { id: string; name: string } | null = null
  let organizationId: string | null = null

  const { data: orgData, error: orgError } = await supabase
    .from('organizations')
    .upsert(
      {
        id: E2E_ORGANIZATION_ID,
        name: 'E2E Test Organization',
        slug: 'e2e-test-org',
        subscription_status: 'active',
        subscription_tier: 'professional',
        max_team_members: 10,
        max_clients: 500,
        max_storage_mb: 5000,
        max_workflows: 50,
        primary_color: '#E8A87C',
        secondary_color: '#85CDCA',
        billing_email: ADMIN_EMAIL,
        billing_name: 'E2E Test Billing',
        owner_user_id: adminUser.id,
        trial_ends_at: new Date(
          Date.now() + 30 * 24 * 60 * 60 * 1000
        ).toISOString(), // 30 days from now
      },
      { onConflict: 'id' }
    )
    .select()
    .single()

  if (orgError) {
    if (orgError.message.includes('Could not find the table')) {
      console.log(
        '   ⚠️  Organizations table not found - multi-tenancy migration not applied'
      )
      console.log(
        '      SaaS Foundation tests will be skipped. Run migrations to enable.'
      )
    } else {
      console.error('Failed to create organization:', orgError.message)
    }
    // Continue without organization - most tests don't require it
  } else if (orgData) {
    organization = orgData
    organizationId = E2E_ORGANIZATION_ID
    console.log(`   Organization: ${orgData.name} (${orgData.id})`)

    // Step 3: Create organization membership for admin
    console.log('3. Creating organization membership...')
    const { error: membershipError } = await supabase
      .from('organization_memberships')
      .upsert(
        {
          organization_id: E2E_ORGANIZATION_ID,
          user_id: adminUser.id,
          role: 'owner',
          accepted_at: new Date().toISOString(),
          is_active: true,
        },
        { onConflict: 'organization_id,user_id' }
      )

    if (membershipError) {
      console.error(
        'Failed to create organization membership:',
        membershipError.message
      )
    } else {
      console.log('   Admin added as organization owner')
    }

    // Step 4: Update admin user with organization_id
    console.log('4. Linking admin user to organization...')
    const { error: userOrgError } = await supabase
      .from('users')
      .update({ organization_id: E2E_ORGANIZATION_ID })
      .eq('id', adminUser.id)

    if (userOrgError) {
      console.error(
        'Failed to link user to organization:',
        userOrgError.message
      )
    } else {
      console.log('   User linked to organization')
    }
  }

  // Step 5: Get test client lead
  console.log('5. Looking up test client lead...')
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

  // Step 6: Get or create team member (admin role required for workflow tests)
  console.log('6. Getting/creating team member...')

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
          ...(organizationId && { organization_id: organizationId }),
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

  // Step 7: Create client assignments (primary and backup providers)
  console.log('7. Creating client assignments...')

  // Primary provider assignment
  const { error: assignmentError } = await supabase
    .from('client_assignments')
    .upsert(
      {
        id: E2E_ASSIGNMENT_ID,
        client_id: clientLead.id,
        team_member_id: teamMember.id,
        assignment_role: 'primary',
        notes: 'E2E test assignment - primary provider',
        ...(organizationId && { organization_id: organizationId }),
      },
      { onConflict: 'id' }
    )

  if (assignmentError) {
    console.error(
      'Failed to create primary assignment:',
      assignmentError.message
    )
  } else {
    console.log('   Primary assignment created')
  }

  // Backup provider assignment (same team member, different role for testing role changes)
  const { error: backupError } = await supabase
    .from('client_assignments')
    .upsert(
      {
        id: E2E_BACKUP_ASSIGNMENT_ID,
        client_id: clientLead.id,
        team_member_id: teamMember.id,
        assignment_role: 'backup',
        notes: 'E2E test assignment - backup provider',
        ...(organizationId && { organization_id: organizationId }),
      },
      { onConflict: 'id' }
    )

  if (backupError) {
    // This might fail due to unique constraint (same team member can't be assigned twice)
    // That's okay - we'll just use the primary for role change tests
    console.log('   Backup assignment skipped (may already exist or conflict)')
  } else {
    console.log('   Backup assignment created')
  }

  // Step 8: Create conversation
  console.log('8. Creating conversation...')
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
        ...(organizationId && { organization_id: organizationId }),
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

  // Step 9: Add conversation participants
  console.log('9. Adding conversation participants...')

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
        ...(organizationId && { organization_id: organizationId }),
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
        ...(organizationId && { organization_id: organizationId }),
      },
      { onConflict: 'conversation_id,client_id', ignoreDuplicates: true }
    )

  if (clientPartError) {
    console.error('Failed to add client participant:', clientPartError.message)
  } else {
    console.log('   Added client as participant')
  }

  // Step 10: Add seed messages
  console.log('10. Adding seed messages...')

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
      ...(organizationId && { organization_id: organizationId }),
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
      ...(organizationId && { organization_id: organizationId }),
    },
    { onConflict: 'id' }
  )

  if (msg2Error) {
    console.error('Failed to create client message:', msg2Error.message)
  } else {
    console.log('   Added message from client')
  }

  // Step 11: Create workflow for workflow enhancement tests
  console.log('11. Creating E2E test workflow...')

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
        ...(organizationId && { organization_id: organizationId }),
      },
      { onConflict: 'id' }
    )
    .select()
    .single()

  if (workflowError) {
    console.error('Failed to create workflow:', workflowError.message)
  } else {
    console.log(`   Workflow: ${workflow.name} (${workflow.id})`)

    // Step 12: Create workflow steps
    console.log('12. Creating workflow steps...')

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
          ...(organizationId && { organization_id: organizationId }),
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
        ...(organizationId && { organization_id: organizationId }),
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
        ...(organizationId && { organization_id: organizationId }),
      },
      { onConflict: 'id' }
    )

    if (endError) {
      console.error('Failed to create end step:', endError.message)
    } else {
      console.log('   Added end step')
    }
  }

  // =========================================================================
  // CRM DATA SEEDING
  // =========================================================================
  console.log('\n--- CRM Data Seeding ---\n')

  // Step 13: Create CRM Account (household)
  console.log('13. Creating CRM Account...')
  const { data: crmAccount, error: crmAccountError } = await supabase
    .from('crm_accounts')
    .upsert(
      {
        id: E2E_CRM_ACCOUNT_ID,
        name: 'E2E Test Household',
        account_type: 'household',
        account_status: 'active',
        billing_street: '123 E2E Test St',
        billing_city: 'Test City',
        billing_state: 'TX',
        billing_postal_code: '75001',
        owner_id: adminUser.id,
        ...(organizationId && { organization_id: organizationId }),
      },
      { onConflict: 'id' }
    )
    .select()
    .single()

  if (crmAccountError) {
    console.error('Failed to create CRM account:', crmAccountError.message)
  } else {
    console.log(`   CRM Account: ${crmAccount.name} (${crmAccount.id})`)
  }

  // Step 14: Create CRM Contact
  console.log('14. Creating CRM Contact...')
  const { data: crmContact, error: crmContactError } = await supabase
    .from('crm_contacts')
    .upsert(
      {
        id: E2E_CRM_CONTACT_ID,
        first_name: 'E2E',
        last_name: 'TestContact',
        email: CRM_CONTACT_EMAIL,
        phone: '555-123-4567',
        mobile_phone: '555-987-6543',
        partner_name: 'Partner TestContact',
        mailing_street: '123 E2E Test St',
        mailing_city: 'Test City',
        mailing_state: 'TX',
        mailing_postal_code: '75001',
        expected_due_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0], // 90 days from now
        is_active: true,
        account_id: E2E_CRM_ACCOUNT_ID,
        portal_access_enabled: false,
        owner_id: adminUser.id,
        ...(organizationId && { organization_id: organizationId }),
      },
      { onConflict: 'id' }
    )
    .select()
    .single()

  if (crmContactError) {
    console.error('Failed to create CRM contact:', crmContactError.message)
  } else {
    console.log(
      `   CRM Contact: ${crmContact.first_name} ${crmContact.last_name} (${crmContact.id})`
    )
  }

  // Step 15: Create CRM Lead
  console.log('15. Creating CRM Lead...')
  const { data: crmLead, error: crmLeadError } = await supabase
    .from('crm_leads')
    .upsert(
      {
        id: E2E_CRM_LEAD_ID,
        first_name: 'E2E',
        last_name: 'TestLead',
        email: CRM_LEAD_EMAIL,
        phone: '555-222-3333',
        expected_due_date: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0], // 120 days from now
        lead_status: 'qualified',
        lead_source: 'website',
        service_interest: 'birth_doula',
        message: 'E2E test lead inquiry',
        portal_access_enabled: false,
        is_converted: false,
        owner_id: adminUser.id,
        ...(organizationId && { organization_id: organizationId }),
      },
      { onConflict: 'id' }
    )
    .select()
    .single()

  if (crmLeadError) {
    console.error('Failed to create CRM lead:', crmLeadError.message)
  } else {
    console.log(
      `   CRM Lead: ${crmLead.first_name} ${crmLead.last_name} (${crmLead.id})`
    )
  }

  // Step 16: Create CRM Opportunity
  console.log('16. Creating CRM Opportunity...')
  const { data: crmOpportunity, error: crmOpportunityError } = await supabase
    .from('crm_opportunities')
    .upsert(
      {
        id: E2E_CRM_OPPORTUNITY_ID,
        name: 'E2E Birth Doula Package',
        account_id: E2E_CRM_ACCOUNT_ID,
        primary_contact_id: E2E_CRM_CONTACT_ID,
        stage: 'closed_won',
        amount: 2500,
        service_type: 'birth_doula',
        close_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0], // 30 days ago
        actual_close_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0],
        stage_probability: 100,
        is_won: true,
        is_closed: true,
        next_step: 'Schedule prenatal visit',
        next_step_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0], // 7 days from now
        description: 'E2E test opportunity - birth doula services',
        owner_id: adminUser.id,
        ...(organizationId && { organization_id: organizationId }),
      },
      { onConflict: 'id' }
    )
    .select()
    .single()

  if (crmOpportunityError) {
    console.error(
      'Failed to create CRM opportunity:',
      crmOpportunityError.message
    )
  } else {
    console.log(
      `   CRM Opportunity: ${crmOpportunity.name} (${crmOpportunity.id})`
    )
  }

  // Step 17: Create CRM Activities (event, task, call)
  console.log('17. Creating CRM Activities...')

  // Event (meeting)
  const { error: eventError } = await supabase.from('crm_activities').upsert(
    {
      id: E2E_CRM_ACTIVITY_EVENT_ID,
      subject: 'E2E Prenatal Visit',
      activity_type: 'event',
      status: 'open',
      who_type: 'contact',
      who_id: E2E_CRM_CONTACT_ID,
      related_to_type: 'opportunity',
      related_to_id: E2E_CRM_OPPORTUNITY_ID,
      due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0], // 14 days from now
      due_datetime: new Date(
        Date.now() + 14 * 24 * 60 * 60 * 1000 + 10 * 60 * 60 * 1000
      ).toISOString(), // 10am
      location: '123 Birth Center Blvd',
      meeting_link: 'https://zoom.us/e2e-test-meeting',
      description: 'First prenatal visit - E2E test event',
      owner_id: adminUser.id,
      ...(organizationId && { organization_id: organizationId }),
    },
    { onConflict: 'id' }
  )

  if (eventError) {
    console.error('Failed to create event activity:', eventError.message)
  } else {
    console.log('   Created event activity (meeting)')
  }

  // Task
  const { error: taskError } = await supabase.from('crm_activities').upsert(
    {
      id: E2E_CRM_ACTIVITY_TASK_ID,
      subject: 'E2E Follow-up Call',
      activity_type: 'task',
      status: 'open',
      priority: 'high',
      who_type: 'contact',
      who_id: E2E_CRM_CONTACT_ID,
      due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0], // 3 days from now
      description: 'Follow up with client - E2E test task',
      owner_id: adminUser.id,
      ...(organizationId && { organization_id: organizationId }),
    },
    { onConflict: 'id' }
  )

  if (taskError) {
    console.error('Failed to create task activity:', taskError.message)
  } else {
    console.log('   Created task activity')
  }

  // Call (completed)
  const { error: callError } = await supabase.from('crm_activities').upsert(
    {
      id: E2E_CRM_ACTIVITY_CALL_ID,
      subject: 'E2E Initial Consultation',
      activity_type: 'call',
      status: 'completed',
      who_type: 'contact',
      who_id: E2E_CRM_CONTACT_ID,
      related_to_type: 'opportunity',
      related_to_id: E2E_CRM_OPPORTUNITY_ID,
      due_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0], // 7 days ago
      due_datetime: new Date(
        Date.now() - 7 * 24 * 60 * 60 * 1000 + 14 * 60 * 60 * 1000
      ).toISOString(), // 2pm
      description:
        'Initial consultation call - discussed birth plan preferences',
      owner_id: adminUser.id,
      ...(organizationId && { organization_id: organizationId }),
    },
    { onConflict: 'id' }
  )

  if (callError) {
    console.error('Failed to create call activity:', callError.message)
  } else {
    console.log('   Created call activity (completed)')
  }

  // =========================================================================
  // PORTAL-CRM SYNC TEST DATA
  // =========================================================================
  console.log('\n--- Portal-CRM Sync Test Data ---\n')

  // Step 18: Create Portal Test Account
  console.log('18. Creating Portal Test Account...')
  const { data: portalAccount, error: portalAccountError } = await supabase
    .from('crm_accounts')
    .upsert(
      {
        id: E2E_PORTAL_ACCOUNT_ID,
        name: 'Portal Test Household',
        account_type: 'household',
        account_status: 'active',
        billing_street: '456 Portal Test Ave',
        billing_city: 'Portal City',
        billing_state: 'CA',
        billing_postal_code: '90210',
        owner_id: adminUser.id,
        ...(organizationId && { organization_id: organizationId }),
      },
      { onConflict: 'id' }
    )
    .select()
    .single()

  if (portalAccountError) {
    console.error(
      'Failed to create portal account:',
      portalAccountError.message
    )
  } else {
    console.log(
      `   Portal Account: ${portalAccount.name} (${portalAccount.id})`
    )
  }

  // Step 19: Create Portal Contact (with portal access enabled)
  console.log('19. Creating Portal Contact (with portal access)...')
  const { data: portalContact, error: portalContactError } = await supabase
    .from('crm_contacts')
    .upsert(
      {
        id: E2E_PORTAL_CONTACT_ID,
        first_name: 'Portal',
        last_name: 'TestUser',
        email: PORTAL_CONTACT_EMAIL,
        phone: '555-444-5555',
        mobile_phone: '555-666-7777',
        partner_name: 'Partner Portal',
        mailing_street: '456 Portal Test Ave',
        mailing_city: 'Portal City',
        mailing_state: 'CA',
        mailing_postal_code: '90210',
        expected_due_date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0], // 60 days from now
        is_active: true,
        account_id: E2E_PORTAL_ACCOUNT_ID,
        portal_access_enabled: true, // Portal access enabled!
        owner_id: adminUser.id,
        ...(organizationId && { organization_id: organizationId }),
      },
      { onConflict: 'id' }
    )
    .select()
    .single()

  if (portalContactError) {
    console.error(
      'Failed to create portal contact:',
      portalContactError.message
    )
  } else {
    console.log(
      `   Portal Contact: ${portalContact.first_name} ${portalContact.last_name} (portal_access_enabled: true)`
    )
  }

  // Step 20: Create Portal Lead (with portal access enabled)
  console.log('20. Creating Portal Lead (with portal access)...')
  const { data: portalLead, error: portalLeadError } = await supabase
    .from('crm_leads')
    .upsert(
      {
        id: E2E_PORTAL_LEAD_ID,
        first_name: 'Portal',
        last_name: 'LeadUser',
        email: PORTAL_LEAD_EMAIL,
        phone: '555-888-9999',
        expected_due_date: new Date(Date.now() + 150 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0], // 150 days from now
        lead_status: 'qualified',
        lead_source: 'referral',
        service_interest: 'postpartum_doula',
        message: 'Portal test lead - interested in postpartum support',
        portal_access_enabled: true, // Portal access enabled!
        is_converted: false,
        owner_id: adminUser.id,
        ...(organizationId && { organization_id: organizationId }),
      },
      { onConflict: 'id' }
    )
    .select()
    .single()

  if (portalLeadError) {
    console.error('Failed to create portal lead:', portalLeadError.message)
  } else {
    console.log(
      `   Portal Lead: ${portalLead.first_name} ${portalLead.last_name} (portal_access_enabled: true)`
    )
  }

  // Step 21: Create Portal Opportunity (active service for portal contact)
  console.log('21. Creating Portal Opportunity...')
  const { data: portalOpportunity, error: portalOpportunityError } =
    await supabase
      .from('crm_opportunities')
      .upsert(
        {
          id: E2E_PORTAL_OPPORTUNITY_ID,
          name: 'Portal Postpartum Package',
          account_id: E2E_PORTAL_ACCOUNT_ID,
          primary_contact_id: E2E_PORTAL_CONTACT_ID,
          stage: 'closed_won',
          amount: 1800,
          service_type: 'postpartum_doula',
          close_date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split('T')[0], // 14 days ago
          actual_close_date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split('T')[0],
          stage_probability: 100,
          is_won: true,
          is_closed: true,
          next_step: 'First postpartum visit',
          next_step_date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split('T')[0], // After due date
          description: 'Postpartum doula services - portal test',
          owner_id: adminUser.id,
          ...(organizationId && { organization_id: organizationId }),
        },
        { onConflict: 'id' }
      )
      .select()
      .single()

  if (portalOpportunityError) {
    console.error(
      'Failed to create portal opportunity:',
      portalOpportunityError.message
    )
  } else {
    console.log(
      `   Portal Opportunity: ${portalOpportunity.name} (${portalOpportunity.id})`
    )
  }

  // Step 22: Create Portal Activity (meeting for portal contact)
  console.log('22. Creating Portal Activity (meeting)...')
  const { error: portalActivityError } = await supabase
    .from('crm_activities')
    .upsert(
      {
        id: E2E_PORTAL_ACTIVITY_ID,
        subject: 'Portal Prenatal Consultation',
        activity_type: 'event',
        status: 'open',
        who_type: 'contact',
        who_id: E2E_PORTAL_CONTACT_ID,
        related_to_type: 'opportunity',
        related_to_id: E2E_PORTAL_OPPORTUNITY_ID,
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0], // 7 days from now
        due_datetime: new Date(
          Date.now() + 7 * 24 * 60 * 60 * 1000 + 11 * 60 * 60 * 1000
        ).toISOString(), // 11am
        location: 'Virtual Meeting',
        meeting_link: 'https://zoom.us/portal-test-meeting',
        description: 'Prenatal consultation - portal test',
        owner_id: adminUser.id,
        ...(organizationId && { organization_id: organizationId }),
      },
      { onConflict: 'id' }
    )

  if (portalActivityError) {
    console.error(
      'Failed to create portal activity:',
      portalActivityError.message
    )
  } else {
    console.log('   Created portal activity (meeting)')
  }

  console.log('\n=== DATA SEEDING COMPLETE ===\n')
  console.log('Seeded data summary:')
  if (organization) {
    console.log(`  - Organization: ${organization.name} (${organization.id})`)
  } else {
    console.log(`  - Organization: Not seeded (migration not applied)`)
  }
  console.log(`  - Team member: ${teamMember.display_name}`)
  console.log(`  - Client: ${clientLead.name}`)
  console.log(`  - Assignments: primary + backup providers`)
  console.log(`  - Conversation: ${conversation.subject}`)
  console.log(`  - Messages: 2 (1 from admin, 1 from client)`)
  console.log(`  - Workflow: E2E Test Workflow (with 3 steps)`)
  console.log('')
  console.log('CRM Data:')
  console.log(`  - CRM Account: ${crmAccount?.name || 'failed'}`)
  console.log(
    `  - CRM Contact: ${crmContact ? `${crmContact.first_name} ${crmContact.last_name}` : 'failed'}`
  )
  console.log(
    `  - CRM Lead: ${crmLead ? `${crmLead.first_name} ${crmLead.last_name}` : 'failed'}`
  )
  console.log(`  - CRM Opportunity: ${crmOpportunity?.name || 'failed'}`)
  console.log(`  - CRM Activities: 3 (event, task, call)`)
  console.log('')
  console.log('Portal-CRM Sync Data:')
  console.log(
    `  - Portal Contact: ${portalContact ? `${portalContact.first_name} ${portalContact.last_name} (portal_access: true)` : 'failed'}`
  )
  console.log(
    `  - Portal Lead: ${portalLead ? `${portalLead.first_name} ${portalLead.last_name} (portal_access: true)` : 'failed'}`
  )
  console.log(`  - Portal Opportunity: ${portalOpportunity?.name || 'failed'}`)
  console.log(`  - Portal Activity: 1 (meeting)`)
})
