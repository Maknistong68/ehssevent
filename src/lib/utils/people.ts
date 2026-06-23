// Helpers for rendering people without leaking directly-identifying data.
// People are referenced internally by account ID (pseudonymous); these
// functions resolve an ID to a human label only where the viewer is entitled
// to see it, and otherwise fall back to a stable, non-identifying token.

export interface PersonLike {
  id?: string
  full_name?: string | null
  email?: string | null
  username?: string | null
}

/**
 * Display label for a person: their full name, then username, then the
 * local-part of their email as a fallback. Username-only accounts (no name or
 * email) render cleanly via the username step.
 */
export function displayName(p: {
  full_name?: string | null
  email?: string | null
  username?: string | null
}): string {
  if (p.full_name && p.full_name.trim()) return p.full_name.trim()
  if (p.username && p.username.trim()) return p.username.trim()
  if (p.email && p.email.trim()) return p.email.split('@')[0]
  return '—'
}

/**
 * Up-to-two-letter initials for an avatar, derived from name, username, or
 * email. Including username keeps username-only accounts from collapsing to
 * the generic 'U'.
 */
export function initials(
  name?: string | null,
  email?: string | null,
  username?: string | null
): string {
  const source = name?.trim() || username?.trim() || email?.split('@')[0] || 'U'
  return source
    .split(/[\s._@-]+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('')
}

/**
 * Resolve an account ID to a display label using the supplied directory.
 * Returns '—' when the ID is empty or cannot be resolved, so the raw ID is
 * never surfaced to the UI.
 */
export function resolvePerson(
  id: string | null | undefined,
  users: PersonLike[]
): string {
  if (!id) return '—'
  const match = users.find((u) => u.id === id)
  return match ? displayName(match) : '—'
}

/**
 * Stable, non-reversible short token for an account ID, suitable for exports
 * or a regulator view where no PII may appear (e.g. `Person-7F3A`). The same
 * ID always maps to the same token within a dataset.
 */
export function pseudonym(id: string | null | undefined): string {
  if (!id) return '—'
  let hash = 0
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0
  }
  const token = hash.toString(16).toUpperCase().padStart(4, '0').slice(-4)
  return `Person-${token}`
}
