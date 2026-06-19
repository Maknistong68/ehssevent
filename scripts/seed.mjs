import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

async function runSQL(sql, label) {
  const res = await fetch(`${supabaseUrl}/rest/v1/rpc`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
    },
    body: JSON.stringify({ query: sql }),
  })

  // Use the SQL editor endpoint instead
  const sqlRes = await fetch(`${supabaseUrl}/pg`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
    },
    body: JSON.stringify({ query: sql }),
  })
}

async function runMigration(filename) {
  const filePath = path.join(__dirname, '..', 'supabase', 'migrations', filename)
  const sql = fs.readFileSync(filePath, 'utf-8')
  console.log(`Running migration: ${filename}...`)

  // Split on semicolons but keep them, filter empty
  const statements = sql
    .split(/;[\s]*\n/)
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'))

  for (const stmt of statements) {
    const fullStmt = stmt.endsWith(';') ? stmt : stmt + ';'
    try {
      const { error } = await supabase.rpc('exec_sql', { sql_text: fullStmt })
      if (error) {
        // Try alternate approach - just log and continue
        console.log(`  Note: ${error.message.substring(0, 100)}`)
      }
    } catch (e) {
      // Ignore RPC not found, we'll use the dashboard
    }
  }
  console.log(`  Done: ${filename}`)
}

async function seedData() {
  console.log('\n--- Seeding mock data ---\n')

  // Create organizations
  console.log('Creating organizations...')
  const { data: orgs, error: orgErr } = await supabase
    .from('organizations')
    .upsert([
      {
        name: 'Acme Construction Ltd',
        org_type: 'client',
        contact_email: 'admin@acmeconstruction.com',
        is_active: true,
      },
      {
        name: 'SafeBuild Contractors',
        org_type: 'contractor',
        contact_email: 'info@safebuild.com',
        is_active: true,
      },
      {
        name: 'QuickFix Electrical',
        org_type: 'contractor',
        contact_email: 'contact@quickfix.com',
        is_active: true,
      },
      {
        name: 'SteelWorks Inc',
        org_type: 'contractor',
        contact_email: 'hello@steelworks.com',
        is_active: true,
      },
    ], { onConflict: 'id', ignoreDuplicates: false })
    .select()

  if (orgErr) {
    console.error('Error creating orgs:', orgErr.message)
    return
  }

  console.log(`  Created ${orgs.length} organizations`)

  const clientOrg = orgs.find(o => o.org_type === 'client')
  const contractors = orgs.filter(o => o.org_type === 'contractor')

  // Create test users via Supabase Auth
  console.log('Creating test users...')
  const testUsers = [
    { email: 'admin@acme.com', password: 'password123', full_name: 'John Admin', role: 'client_admin', org: clientOrg },
    { email: 'manager@acme.com', password: 'password123', full_name: 'Sarah Manager', role: 'client_manager', org: clientOrg },
    { email: 'user@acme.com', password: 'password123', full_name: 'Mike User', role: 'client_user', org: clientOrg },
    { email: 'bob@safebuild.com', password: 'password123', full_name: 'Bob Builder', role: 'contractor_user', org: contractors[0] },
    { email: 'alice@quickfix.com', password: 'password123', full_name: 'Alice Sparks', role: 'contractor_user', org: contractors[1] },
    { email: 'dave@steelworks.com', password: 'password123', full_name: 'Dave Welder', role: 'contractor_user', org: contractors[2] },
  ]

  const createdUsers = []
  for (const u of testUsers) {
    const { data, error } = await supabase.auth.admin.createUser({
      email: u.email,
      password: u.password,
      email_confirm: true,
      user_metadata: { full_name: u.full_name },
    })

    if (error) {
      if (error.message.includes('already been registered')) {
        console.log(`  User ${u.email} already exists, fetching...`)
        const { data: { users } } = await supabase.auth.admin.listUsers()
        const existing = users.find(eu => eu.email === u.email)
        if (existing) createdUsers.push({ ...u, id: existing.id })
      } else {
        console.error(`  Error creating ${u.email}:`, error.message)
      }
    } else {
      console.log(`  Created user: ${u.email}`)
      createdUsers.push({ ...u, id: data.user.id })
    }
  }

  // Update profiles with roles and orgs
  console.log('Updating profiles...')
  for (const u of createdUsers) {
    const { error } = await supabase
      .from('profiles')
      .update({
        role: u.role,
        organization_id: u.org.id,
        full_name: u.full_name,
      })
      .eq('id', u.id)

    if (error) {
      console.error(`  Error updating profile ${u.email}:`, error.message)
    } else {
      console.log(`  Updated profile: ${u.email} → ${u.role}`)
    }
  }

  // Create projects
  console.log('Creating projects...')
  const { data: projects, error: projErr } = await supabase
    .from('projects')
    .insert([
      {
        name: 'Highway Bridge Renovation',
        description: 'Major renovation of the I-95 overpass bridge including structural reinforcement and road resurfacing.',
        client_org_id: clientOrg.id,
        location: 'I-95 Overpass, Section B',
        is_active: true,
      },
      {
        name: 'Industrial Park Expansion',
        description: 'Phase 2 expansion of the Greenfield Industrial Park, adding 3 new warehouse units.',
        client_org_id: clientOrg.id,
        location: 'Greenfield Industrial Park',
        is_active: true,
      },
      {
        name: 'Office Tower Fit-Out',
        description: 'Interior fit-out of levels 5-10 of the new CBD office tower.',
        client_org_id: clientOrg.id,
        location: 'CBD Tower, 100 Main St',
        is_active: true,
      },
    ])
    .select()

  if (projErr) {
    console.error('Error creating projects:', projErr.message)
    return
  }
  console.log(`  Created ${projects.length} projects`)

  // Assign contractors to projects
  console.log('Assigning contractors to projects...')
  const pcInserts = [
    { project_id: projects[0].id, contractor_org_id: contractors[0].id },
    { project_id: projects[0].id, contractor_org_id: contractors[2].id },
    { project_id: projects[1].id, contractor_org_id: contractors[0].id },
    { project_id: projects[1].id, contractor_org_id: contractors[1].id },
    { project_id: projects[2].id, contractor_org_id: contractors[1].id },
    { project_id: projects[2].id, contractor_org_id: contractors[2].id },
  ]

  const { error: pcErr } = await supabase
    .from('project_contractors')
    .insert(pcInserts)

  if (pcErr) {
    console.error('Error assigning contractors:', pcErr.message)
  } else {
    console.log(`  Assigned ${pcInserts.length} contractor-project relationships`)
  }

  // Get user references
  const clientAdmin = createdUsers.find(u => u.role === 'client_admin')
  const clientManager = createdUsers.find(u => u.role === 'client_manager')
  const clientUser = createdUsers.find(u => u.role === 'client_user')
  const bob = createdUsers.find(u => u.email === 'bob@safebuild.com')
  const alice = createdUsers.find(u => u.email === 'alice@quickfix.com')
  const dave = createdUsers.find(u => u.email === 'dave@steelworks.com')

  if (!clientAdmin || !clientManager || !bob || !alice || !dave) {
    console.error('Missing required users, skipping observations')
    return
  }

  // Create observations
  console.log('Creating observations...')
  const today = new Date()
  const dueInDays = (n) => {
    const d = new Date(today)
    d.setDate(d.getDate() + n)
    return d.toISOString().split('T')[0]
  }

  const observations = [
    {
      title: 'Missing guardrail on scaffolding level 3',
      description: 'Observed that the guardrail on the east side of scaffolding level 3 is missing. Workers were seen operating near the edge without fall protection.',
      project_id: projects[0].id,
      created_by: clientAdmin.id,
      creator_org_id: clientOrg.id,
      assigned_to: bob.id,
      assigned_org_id: contractors[0].id,
      category: 'unsafe_condition',
      priority: 'critical',
      status: 'open',
      due_date: dueInDays(3),
    },
    {
      title: 'Worker not wearing hard hat in active zone',
      description: 'A worker from SafeBuild was observed working without a hard hat in the active demolition zone near sector C.',
      project_id: projects[0].id,
      created_by: clientManager.id,
      creator_org_id: clientOrg.id,
      assigned_to: bob.id,
      assigned_org_id: contractors[0].id,
      category: 'unsafe_act',
      priority: 'high',
      status: 'in_progress',
      due_date: dueInDays(5),
    },
    {
      title: 'Chemical spill near drainage point',
      description: 'Hydraulic fluid leak from excavator has pooled near the stormwater drain inlet at grid reference E4.',
      project_id: projects[1].id,
      created_by: clientAdmin.id,
      creator_org_id: clientOrg.id,
      assigned_to: alice.id,
      assigned_org_id: contractors[1].id,
      category: 'environmental',
      priority: 'high',
      status: 'open',
      due_date: dueInDays(2),
    },
    {
      title: 'Near miss - falling tools from height',
      description: 'A wrench fell from level 8 and landed within 2 meters of a pedestrian walkway. No injuries but high potential severity.',
      project_id: projects[2].id,
      created_by: clientManager.id,
      creator_org_id: clientOrg.id,
      assigned_to: dave.id,
      assigned_org_id: contractors[2].id,
      category: 'near_miss',
      priority: 'critical',
      status: 'pending_review',
      due_date: dueInDays(-1),
    },
    {
      title: 'Excellent housekeeping on level 6',
      description: 'QuickFix team maintained an exceptionally clean and organized workspace throughout the week. Good example for other teams.',
      project_id: projects[2].id,
      created_by: clientAdmin.id,
      creator_org_id: clientOrg.id,
      assigned_to: alice.id,
      assigned_org_id: contractors[1].id,
      category: 'positive_observation',
      priority: 'low',
      status: 'closed',
      due_date: null,
    },
    {
      title: 'Exposed electrical wiring in utility room',
      description: 'Live wires found exposed without junction box cover in the utility room behind warehouse 2. Immediate fix needed.',
      project_id: projects[1].id,
      created_by: clientUser?.id || clientAdmin.id,
      creator_org_id: clientOrg.id,
      assigned_to: alice.id,
      assigned_org_id: contractors[1].id,
      category: 'unsafe_condition',
      priority: 'critical',
      status: 'in_progress',
      due_date: dueInDays(1),
    },
    {
      title: 'Fire extinguisher expired - Zone B entrance',
      description: 'The fire extinguisher at the Zone B entrance has an expired service tag (last serviced Jan 2025).',
      project_id: projects[0].id,
      created_by: clientManager.id,
      creator_org_id: clientOrg.id,
      assigned_to: bob.id,
      assigned_org_id: contractors[0].id,
      category: 'unsafe_condition',
      priority: 'medium',
      status: 'open',
      due_date: dueInDays(7),
    },
    {
      title: 'Improper lifting technique observed',
      description: 'Two workers were observed manually lifting heavy steel beams without using proper lifting aids or techniques.',
      project_id: projects[2].id,
      created_by: clientAdmin.id,
      creator_org_id: clientOrg.id,
      assigned_to: dave.id,
      assigned_org_id: contractors[2].id,
      category: 'unsafe_act',
      priority: 'medium',
      status: 'open',
      due_date: dueInDays(5),
    },
  ]

  const { data: obsData, error: obsErr } = await supabase
    .from('observations')
    .insert(observations)
    .select()

  if (obsErr) {
    console.error('Error creating observations:', obsErr.message)
    return
  }
  console.log(`  Created ${obsData.length} observations`)

  // Add some responses to in-progress / pending review observations
  console.log('Creating observation responses...')
  const inProgressObs = obsData.find(o => o.title.includes('not wearing hard hat'))
  const pendingObs = obsData.find(o => o.title.includes('falling tools'))
  const closedObs = obsData.find(o => o.title.includes('housekeeping'))
  const exposedWiringObs = obsData.find(o => o.title.includes('Exposed electrical'))

  const responses = []

  if (inProgressObs) {
    responses.push({
      observation_id: inProgressObs.id,
      responded_by: bob.id,
      responder_org_id: contractors[0].id,
      response_text: 'We have issued a toolbox talk to all workers on site regarding mandatory PPE. The worker in question has been counseled and provided with a replacement hard hat.',
      is_closing: false,
    })
  }

  if (pendingObs) {
    responses.push(
      {
        observation_id: pendingObs.id,
        responded_by: dave.id,
        responder_org_id: contractors[2].id,
        response_text: 'We have installed tool lanyards on all hand tools and added mesh barriers along the edge of each working level. A site-wide briefing was conducted on the prevention of dropped objects.',
        is_closing: false,
      },
      {
        observation_id: pendingObs.id,
        responded_by: dave.id,
        responder_org_id: contractors[2].id,
        response_text: 'All corrective actions have been implemented and verified by our site supervisor. Requesting closure of this observation.',
        is_closing: true,
      }
    )
  }

  if (closedObs) {
    responses.push({
      observation_id: closedObs.id,
      responded_by: alice.id,
      responder_org_id: contractors[1].id,
      response_text: 'Thank you for the recognition! We will continue to maintain high standards of housekeeping across all our work areas.',
      is_closing: false,
    })
  }

  if (exposedWiringObs) {
    responses.push({
      observation_id: exposedWiringObs.id,
      responded_by: alice.id,
      responder_org_id: contractors[1].id,
      response_text: 'Area has been cordoned off and de-energized. Replacement junction box covers have been ordered and will be installed tomorrow morning.',
      is_closing: false,
    })
  }

  if (responses.length > 0) {
    const { error: respErr } = await supabase
      .from('observation_responses')
      .insert(responses)

    if (respErr) {
      console.error('Error creating responses:', respErr.message)
    } else {
      console.log(`  Created ${responses.length} responses`)
    }
  }

  console.log('\n=== Seed complete! ===\n')
  console.log('Test accounts (all passwords: password123):')
  console.log('  Client Admin:      admin@acme.com')
  console.log('  Client Manager:    manager@acme.com')
  console.log('  Client User:       user@acme.com')
  console.log('  Contractor (SafeBuild):   bob@safebuild.com')
  console.log('  Contractor (QuickFix):    alice@quickfix.com')
  console.log('  Contractor (SteelWorks):  dave@steelworks.com')
}

seedData().catch(console.error)
