import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Server Supabase client, bound to the request's auth cookies. Like the browser
// client it uses the anon key and is fully RLS-enforced — it acts as the
// signed-in user, never as a superuser.
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          // In Server Components cookies are read-only; the session is refreshed
          // in proxy.ts instead, so swallow the write here.
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Called from a Server Component — safe to ignore.
          }
        },
      },
    }
  )
}
