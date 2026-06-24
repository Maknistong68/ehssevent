import { createServerClient } from '@supabase/ssr'
import type { NextRequest, NextResponse } from 'next/server'

// Refreshes the Supabase auth session for the incoming request and writes any
// rotated auth cookies onto the given response. Called from proxy.ts so a user
// stays logged in as they navigate between pages.
export async function updateSession(
  request: NextRequest,
  response: NextResponse
): Promise<NextResponse> {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Touching getUser() triggers token refresh when needed; the new tokens are
  // persisted via setAll above.
  await supabase.auth.getUser()

  return response
}
