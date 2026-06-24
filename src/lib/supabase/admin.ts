import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// Privileged service-role client. BYPASSES Row Level Security, so it must only
// ever be used server-side for trusted operations (e.g. provisioning users,
// writing the append-only audit log). The service_role key must never reach the
// browser — it is a server-only secret.
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}
