'use server'

import { redirect } from 'next/navigation'
import {
  loginSchema,
  signupSchema,
  forgotPasswordSchema,
  type SignupInput,
} from '@/lib/validators/auth'
import {
  CURRENT_TERMS_VERSION,
  CURRENT_PRIVACY_VERSION,
} from '@/lib/constants/legal'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { env } from '@/lib/env'

/**
 * Real sign-in against Supabase Auth. Verifies the password, then confirms the
 * account is `active` (a `pending`/`invited`/`deactivated` user is signed back
 * out with an explanatory message). On success, lands on the dashboard.
 */
export async function login(formData: FormData) {
  const parsed = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  })

  if (error || !data.user) {
    return { error: 'Invalid email or password.' }
  }

  // Gate on lifecycle status so a not-yet-approved account can't slip through.
  const { data: profile } = await supabase
    .from('profiles')
    .select('status')
    .eq('id', data.user.id)
    .single()

  if (profile?.status !== 'active') {
    await supabase.auth.signOut()
    const message =
      profile?.status === 'pending'
        ? 'Your account is awaiting administrator approval.'
        : profile?.status === 'invited'
          ? 'Please accept your invitation to activate your account.'
          : profile?.status === 'deactivated'
            ? 'This account has been deactivated.'
            : 'Your account is not active.'
    return { error: message }
  }

  redirect('/dashboard')
}

/**
 * Restricted self-signup. Creates the Supabase Auth user; a database trigger
 * (handle_new_user) inserts a matching profile in `pending` status with no
 * organization. The account cannot authenticate until an administrator approves
 * it (assigning a role + organization and flipping status to `active`).
 *
 * Consent (terms/privacy version) is passed as user metadata so the trigger can
 * stamp provable consent timestamps — the PDPL lawful-basis record.
 */
export async function signup(input: SignupInput) {
  const parsed = signupSchema.safeParse(input)

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const username = parsed.data.username.trim()

  // Username is the human identity key — reject duplicates up front for a clear
  // message (the DB unique constraint is the ultimate guard).
  const admin = createAdminClient()
  const { data: existing } = await admin
    .from('profiles')
    .select('id')
    .ilike('username', username)
    .maybeSingle()
  if (existing) {
    return { error: 'This username is already taken.' }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo: `${env.NEXT_PUBLIC_APP_ORIGIN ?? ''}/login`,
      data: {
        username,
        terms_version: CURRENT_TERMS_VERSION,
        privacy_version: CURRENT_PRIVACY_VERSION,
      },
    },
  })

  if (error) {
    // Most commonly a duplicate email.
    return { error: 'Could not create the account. Try a different email.' }
  }

  return {
    success:
      'Account created — an administrator will review and activate your access.',
  }
}

/**
 * Invite acceptance. A genuine flow arrives via a signed Supabase invite link;
 * here we simply confirm the account is active once the password is set. Kept
 * for the existing accept-invite form contract.
 */
export async function acceptInvite(input: {
  username: string
}): Promise<{ success?: string; error?: string }> {
  const admin = createAdminClient()
  const { data: profile } = await admin
    .from('profiles')
    .select('id, status')
    .ilike('username', input.username.trim())
    .maybeSingle()

  if (!profile || profile.status !== 'invited') {
    return { error: 'No pending invitation was found for this username.' }
  }

  await admin
    .from('profiles')
    .update({ status: 'active', updated_at: new Date().toISOString() })
    .eq('id', profile.id)

  return { success: 'Invitation accepted — your account is now active.' }
}

/**
 * Sends a Supabase password-reset email. Always reports success so the endpoint
 * cannot be used to enumerate which emails have accounts.
 */
export async function forgotPassword(formData: FormData) {
  const parsed = forgotPasswordSchema.safeParse({
    email: formData.get('email'),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const supabase = await createClient()
  await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${env.NEXT_PUBLIC_APP_ORIGIN ?? ''}/login`,
  })

  return { success: 'Check your email for a password reset link.' }
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

/**
 * Records that the current user has (re-)accepted the latest Terms and Privacy
 * Policy. Stamps the authenticated user's profile — the user is resolved from
 * the Supabase session, never from the client.
 */
export async function recordConsent(): Promise<{
  success?: boolean
  error?: string
}> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const now = new Date().toISOString()
  const { error } = await supabase
    .from('profiles')
    .update({
      terms_accepted_at: now,
      privacy_accepted_at: now,
      terms_version: CURRENT_TERMS_VERSION,
      privacy_version: CURRENT_PRIVACY_VERSION,
      updated_at: now,
    })
    .eq('id', user.id)

  if (error) return { error: 'Could not record consent' }
  return { success: true }
}
