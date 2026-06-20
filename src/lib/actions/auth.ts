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

export async function signup(input: SignupInput) {
  const parsed = signupSchema.safeParse(input)

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
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

  // TODO(prod): create the auth user and INSERT the profile row with these
  // consent fields (resolve the new user id from Supabase Auth). The consent
  // stamp must be persisted, not just computed.
  void consent

  return { success: 'Check your email for a confirmation link.' }
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
  redirect('/login')
}

/**
 * Records that the current user has (re-)accepted the latest Terms and Privacy
 * Policy. Called by the re-consent gate when the stored consent version is
 * older than the currently published version.
 */
export async function recordConsent(): Promise<{ success?: boolean; error?: string }> {
  // TODO(prod): UPDATE the authenticated user's profile, stamping
  // terms_accepted_at = now(), privacy_accepted_at = now(),
  // terms_version = CURRENT_TERMS_VERSION, privacy_version = CURRENT_PRIVACY_VERSION.
  // Resolve the user from the Supabase session (auth.uid()), never from the client.
  return { success: true }
}
