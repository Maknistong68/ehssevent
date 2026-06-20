'use server'

import { redirect } from 'next/navigation'
import { loginSchema, signupSchema, forgotPasswordSchema } from '@/lib/validators/auth'

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

export async function signup(formData: FormData) {
  const parsed = signupSchema.safeParse({
    email: formData.get('email'),
    full_name: formData.get('full_name'),
    password: formData.get('password'),
    confirm_password: formData.get('confirm_password'),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

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
