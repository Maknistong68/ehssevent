'use server'

import { cookies } from 'next/headers'
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
import { IMPERSONATION_COOKIE, MOCK_SESSION_COOKIE } from '@/lib/auth/guards'
import { MOCK_PROFILES } from '@/lib/mock-data'
import type { Profile } from '@/types/database'

export async function login(formData: FormData) {
  const parsed = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  redirect('/dashboard')
}

/**
 * Mock role launcher. Sets the `mock_session_uid` cookie to the chosen profile
 * so the whole stack (server guards + client effective profile) signs in as
 * that role, then lands on the role-aware dashboard. No PII is collected — the
 * caller only passes a profile id selected from the login role cards.
 */
export async function loginAs(profileId: string) {
  const profile = MOCK_PROFILES.find((p) => p.id === profileId)
  if (!profile) {
    return { error: 'Unknown role selected.' }
  }

  // httpOnly so the mock session is set only via this server action, mirroring
  // startImpersonation.
  const cookieStore = await cookies()
  cookieStore.set(MOCK_SESSION_COOKIE, profileId, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
  })
  // Clear any leftover impersonation so the freshly selected role is clean.
  cookieStore.delete(IMPERSONATION_COOKIE)

  redirect('/dashboard')
}

export async function signup(input: SignupInput) {
  const parsed = signupSchema.safeParse(input)

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  // Username is the identity key — reject duplicates (case-insensitive) so two
  // accounts can never collide on sign-in.
  const username = parsed.data.username.trim()
  if (
    MOCK_PROFILES.some(
      (p) => p.username?.toLowerCase() === username.toLowerCase()
    )
  ) {
    return { error: 'This username is already taken.' }
  }

  // Record provable consent at the moment of acceptance: timestamp + the exact
  // policy version the user agreed to. This is what lets the controller later
  // demonstrate a valid lawful basis under the PDPL.
  const now = new Date().toISOString()
  const consent = {
    terms_accepted_at: now,
    privacy_accepted_at: now,
    terms_version: CURRENT_TERMS_VERSION,
    privacy_version: CURRENT_PRIVACY_VERSION,
  }

  // Restricted signup: a self-registered account lands in `pending` and cannot
  // authenticate until an administrator reviews and approves it (assigning a
  // real role and organization). Role/org are placeholders until then.
  // TODO(prod): create the auth user and INSERT the profile row with these
  // consent fields (resolve the new user id from Supabase Auth). The consent
  // stamp must be persisted, not just computed.
  const newProfile: Profile = {
    id: crypto.randomUUID(),
    username,
    email: null,
    full_name: null,
    role: 'client_user',
    organization_id: null,
    status: 'pending',
    ...consent,
    created_at: now,
    updated_at: now,
  }
  MOCK_PROFILES.push(newProfile)

  return {
    success:
      'Account created — an administrator will review and activate your access.',
  }
}

/**
 * Mock invite acceptance. In production this would be reached via a signed
 * invite token; here it flips the matching `invited` profile to `active`
 * (the "set password" step is represented by the form that calls this).
 */
export async function acceptInvite(input: {
  username: string
}): Promise<{ success?: string; error?: string }> {
  const profile = MOCK_PROFILES.find(
    (p) => p.username?.toLowerCase() === input.username.trim().toLowerCase()
  )
  if (!profile || profile.status !== 'invited') {
    return { error: 'No pending invitation was found for this username.' }
  }
  profile.status = 'active'
  profile.updated_at = new Date().toISOString()
  return { success: 'Invitation accepted — your account is now active.' }
}

export async function forgotPassword(formData: FormData) {
  const parsed = forgotPasswordSchema.safeParse({
    email: formData.get('email'),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  return { success: 'Check your email for a password reset link.' }
}

export async function logout() {
  // Clear both the selected mock session and any active impersonation so
  // switching roles starts from a clean slate.
  const cookieStore = await cookies()
  cookieStore.delete(MOCK_SESSION_COOKIE)
  cookieStore.delete(IMPERSONATION_COOKIE)
  redirect('/login')
}

/**
 * Records that the current user has (re-)accepted the latest Terms and Privacy
 * Policy. Called by the re-consent gate when the stored consent version is
 * older than the currently published version.
 */
export async function recordConsent(): Promise<{
  success?: boolean
  error?: string
}> {
  // TODO(prod): UPDATE the authenticated user's profile, stamping
  // terms_accepted_at = now(), privacy_accepted_at = now(),
  // terms_version = CURRENT_TERMS_VERSION, privacy_version = CURRENT_PRIVACY_VERSION.
  // Resolve the user from the Supabase session (auth.uid()), never from the client.
  return { success: true }
}
