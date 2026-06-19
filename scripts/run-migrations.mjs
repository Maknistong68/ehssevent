import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing env vars. Run with: node --env-file=.env.local scripts/run-migrations.mjs')
  process.exit(1)
}

// Extract project ref from URL
const projectRef = new URL(supabaseUrl).hostname.split('.')[0]

const migrations = [
  '001_enums.sql',
  '002_organizations.sql',
  '003_profiles.sql',
  '004_projects.sql',
  '005_observations.sql',
  '006_rls.sql',
  '007_inspections.sql',
  '008_events.sql',
  '009_events_rls.sql',
  '010_corrective_actions.sql',
  '011_corrective_actions_rls.sql',
  // 012 adds an enum value and MUST be committed in its own transaction
  // before any later migration/code references 'compliance'.
  '012_compliance_field_type.sql',
  '013_corrective_actions_inspection_link.sql',
  '014_event_responses.sql',
  // 015 drops the observation tables — run LAST, after code stops querying them.
  '015_drop_observations.sql',
]

async function runSQL(sql, label) {
  // Use Supabase Management API via pg-meta or direct SQL
  // We'll use the PostgREST rpc endpoint with a custom function
  // But first, let's try the simpler approach: use supabase-js query builder

  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': serviceRoleKey,
      'Authorization': `Bearer ${serviceRoleKey}`,
      'Prefer': 'return=minimal',
    },
    body: JSON.stringify({}),
  })

  // This won't work for DDL. Let's use the SQL query endpoint instead
  return null
}

async function executeSQLViaAPI(sql) {
  // Supabase exposes a SQL execution endpoint for service role
  const response = await fetch(`${supabaseUrl}/pg/query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': serviceRoleKey,
      'Authorization': `Bearer ${serviceRoleKey}`,
    },
    body: JSON.stringify({ query: sql }),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`HTTP ${response.status}: ${text}`)
  }

  return response.json()
}

// Alternative: combine all migrations into one big SQL and print for manual execution
async function main() {
  console.log('Attempting to run migrations via Supabase API...\n')

  for (const filename of migrations) {
    const filePath = path.join(__dirname, '..', 'supabase', 'migrations', filename)
    const sql = fs.readFileSync(filePath, 'utf-8')

    console.log(`Running: ${filename}...`)

    try {
      await executeSQLViaAPI(sql)
      console.log(`  ✓ ${filename}`)
    } catch (e) {
      console.log(`  ✗ API method failed: ${e.message}`)
      console.log(`  Falling back to combined output...`)

      // If the API doesn't work, output combined SQL for manual execution
      console.log('\n========================================')
      console.log('The SQL API endpoint is not available.')
      console.log('Please run the migrations manually:')
      console.log('1. Go to your Supabase dashboard')
      console.log('2. Click "SQL Editor" in the left sidebar')
      console.log('3. Paste and run the SQL below')
      console.log('========================================\n')

      let combined = ''
      for (const f of migrations) {
        const fp = path.join(__dirname, '..', 'supabase', 'migrations', f)
        combined += `-- === ${f} ===\n` + fs.readFileSync(fp, 'utf-8') + '\n\n'
      }

      const outPath = path.join(__dirname, '..', 'supabase', 'combined_migration.sql')
      fs.writeFileSync(outPath, combined)
      console.log(`Combined SQL written to: supabase/combined_migration.sql`)
      console.log('Copy the contents and paste into the Supabase SQL Editor.\n')
      return
    }
  }

  console.log('\nAll migrations completed successfully!')
}

main().catch(console.error)
