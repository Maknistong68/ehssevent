import { createBrowserClient } from '@supabase/ssr'

// Browser Supabase client. Uses the public anon key — every request is subject
// to Row Level Security, so this client can only ever see the signed-in user's
// own organization's data.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
