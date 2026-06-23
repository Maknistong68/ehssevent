import { describe, it, expect, beforeEach, vi } from 'vitest'

// Shared, test-controlled cookie jar backing the mocked `next/headers`.
const cookieJar = new Map<string, string>()

vi.mock('next/headers', () => ({
  cookies: async () => ({
    get: (name: string) => {
      const value = cookieJar.get(name)
      return value === undefined ? undefined : { name, value }
    },
  }),
}))

vi.mock('@/lib/mock-data', () => ({
  MOCK_PROFILES: [
    {
      id: 'admin-1',
      role: 'client_admin',
      organization_id: 'org-1',
      status: 'active',
    },
    {
      id: 'user-1',
      role: 'client_user',
      organization_id: 'org-1',
      status: 'active',
    },
    {
      id: 'sys-1',
      role: 'system_admin',
      organization_id: null,
      status: 'active',
    },
    {
      id: 'pending-1',
      role: 'client_user',
      organization_id: 'org-1',
      status: 'pending',
    },
    {
      id: 'invited-1',
      role: 'client_user',
      organization_id: 'org-1',
      status: 'invited',
    },
    {
      id: 'deact-1',
      role: 'client_user',
      organization_id: 'org-1',
      status: 'deactivated',
    },
  ],
}))

import {
  getSessionProfile,
  requireUser,
  requireAdmin,
  requirePermission,
  MOCK_SESSION_COOKIE,
  IMPERSONATION_COOKIE,
} from '@/lib/auth/guards'

beforeEach(() => {
  cookieJar.clear()
})

describe('getSessionProfile()', () => {
  it('falls back to the default mock admin session when no cookie is set', async () => {
    const profile = await getSessionProfile()
    expect(profile?.role).toBe('client_admin')
  })

  it('resolves the profile selected by the mock session cookie', async () => {
    cookieJar.set(MOCK_SESSION_COOKIE, 'sys-1')
    const profile = await getSessionProfile()
    expect(profile?.id).toBe('sys-1')
    expect(profile?.role).toBe('system_admin')
  })

  it('falls back to default when the cookie points at an unknown id', async () => {
    cookieJar.set(MOCK_SESSION_COOKIE, 'does-not-exist')
    const profile = await getSessionProfile()
    expect(profile?.role).toBe('client_admin')
  })
})

describe('requireUser()', () => {
  it('admits an active account', async () => {
    cookieJar.set(MOCK_SESSION_COOKIE, 'user-1')
    const result = await requireUser()
    expect(result.ok).toBe(true)
  })

  it('rejects a pending account awaiting approval', async () => {
    cookieJar.set(MOCK_SESSION_COOKIE, 'pending-1')
    const result = await requireUser()
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toMatch(/approval/i)
  })

  it('rejects an invited (not yet accepted) account', async () => {
    cookieJar.set(MOCK_SESSION_COOKIE, 'invited-1')
    const result = await requireUser()
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toMatch(/invitation/i)
  })

  it('rejects a deactivated account', async () => {
    cookieJar.set(MOCK_SESSION_COOKIE, 'deact-1')
    const result = await requireUser()
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toMatch(/deactivated/i)
  })
})

describe('requireAdmin()', () => {
  it('rejects a non-admin (default client_admin is not a platform admin)', async () => {
    const result = await requireAdmin()
    expect(result.ok).toBe(false)
  })

  it('admits a platform admin role', async () => {
    cookieJar.set(MOCK_SESSION_COOKIE, 'sys-1')
    const result = await requireAdmin()
    expect(result.ok).toBe(true)
  })
})

describe('requirePermission()', () => {
  it('admits a role that holds the permission', async () => {
    cookieJar.set(MOCK_SESSION_COOKIE, 'user-1')
    const result = await requirePermission('event:view')
    expect(result.ok).toBe(true)
  })

  it('rejects a role lacking the permission', async () => {
    cookieJar.set(MOCK_SESSION_COOKIE, 'user-1')
    const result = await requirePermission('event:manage')
    expect(result.ok).toBe(false)
  })

  it('blocks mutations while impersonating', async () => {
    cookieJar.set(MOCK_SESSION_COOKIE, 'user-1')
    cookieJar.set(IMPERSONATION_COOKIE, 'someone-else')
    const result = await requirePermission('event:create')
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toMatch(/read-only/i)
  })

  it('still allows view permissions while impersonating', async () => {
    cookieJar.set(MOCK_SESSION_COOKIE, 'user-1')
    cookieJar.set(IMPERSONATION_COOKIE, 'someone-else')
    const result = await requirePermission('event:view')
    expect(result.ok).toBe(true)
  })
})
