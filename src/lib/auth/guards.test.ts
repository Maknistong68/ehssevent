import { describe, it, expect, beforeEach, vi } from 'vitest'

// Shared, test-controlled cookie jar backing the mocked `next/headers`
// (used only for the impersonation cookie now).
const cookieJar = new Map<string, string>()

vi.mock('next/headers', () => ({
  cookies: async () => ({
    get: (name: string) => {
      const value = cookieJar.get(name)
      return value === undefined ? undefined : { name, value }
    },
  }),
}))

// Test-controlled Supabase session. `currentUserId` is the authenticated user
// (null = unauthenticated); `profiles` is the backing profile table.
let currentUserId: string | null = null

const profiles: Record<
  string,
  { id: string; role: string; organization_id: string | null; status: string }
> = {
  'admin-1': {
    id: 'admin-1',
    role: 'client_admin',
    organization_id: 'org-1',
    status: 'active',
  },
  'user-1': {
    id: 'user-1',
    role: 'client_user',
    organization_id: 'org-1',
    status: 'active',
  },
  'sys-1': {
    id: 'sys-1',
    role: 'system_admin',
    organization_id: null,
    status: 'active',
  },
  'pending-1': {
    id: 'pending-1',
    role: 'client_user',
    organization_id: 'org-1',
    status: 'pending',
  },
  'invited-1': {
    id: 'invited-1',
    role: 'client_user',
    organization_id: 'org-1',
    status: 'invited',
  },
  'deact-1': {
    id: 'deact-1',
    role: 'client_user',
    organization_id: 'org-1',
    status: 'deactivated',
  },
}

vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    auth: {
      getUser: async () => ({
        data: {
          user: currentUserId
            ? { id: currentUserId, email: `${currentUserId}@test` }
            : null,
        },
        error: currentUserId ? null : new Error('no session'),
      }),
    },
    from: () => ({
      select: () => ({
        eq: (_col: string, val: string) => ({
          single: async () => ({ data: profiles[val] ?? null, error: null }),
        }),
      }),
    }),
  }),
}))

import {
  getSessionProfile,
  requireUser,
  requireAdmin,
  requirePermission,
  IMPERSONATION_COOKIE,
} from '@/lib/auth/guards'

beforeEach(() => {
  cookieJar.clear()
  currentUserId = null
})

describe('getSessionProfile()', () => {
  it('returns null when there is no authenticated session', async () => {
    const profile = await getSessionProfile()
    expect(profile).toBeNull()
  })

  it('resolves the real signed-in profile', async () => {
    currentUserId = 'sys-1'
    const profile = await getSessionProfile()
    expect(profile?.id).toBe('sys-1')
    expect(profile?.role).toBe('system_admin')
  })

  it('returns null when the auth user has no profile row', async () => {
    currentUserId = 'no-profile'
    const profile = await getSessionProfile()
    expect(profile).toBeNull()
  })
})

describe('requireUser()', () => {
  it('rejects an unauthenticated request', async () => {
    const result = await requireUser()
    expect(result.ok).toBe(false)
  })

  it('admits an active account', async () => {
    currentUserId = 'user-1'
    const result = await requireUser()
    expect(result.ok).toBe(true)
  })

  it('rejects a pending account awaiting approval', async () => {
    currentUserId = 'pending-1'
    const result = await requireUser()
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toMatch(/approval/i)
  })

  it('rejects an invited (not yet accepted) account', async () => {
    currentUserId = 'invited-1'
    const result = await requireUser()
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toMatch(/invitation/i)
  })

  it('rejects a deactivated account', async () => {
    currentUserId = 'deact-1'
    const result = await requireUser()
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toMatch(/deactivated/i)
  })
})

describe('requireAdmin()', () => {
  it('rejects a non-admin (client_admin is not a platform admin)', async () => {
    currentUserId = 'admin-1'
    const result = await requireAdmin()
    expect(result.ok).toBe(false)
  })

  it('admits a platform admin role', async () => {
    currentUserId = 'sys-1'
    const result = await requireAdmin()
    expect(result.ok).toBe(true)
  })
})

describe('requirePermission()', () => {
  it('admits a role that holds the permission', async () => {
    currentUserId = 'user-1'
    const result = await requirePermission('event:view')
    expect(result.ok).toBe(true)
  })

  it('rejects a role lacking the permission', async () => {
    currentUserId = 'user-1'
    const result = await requirePermission('event:manage')
    expect(result.ok).toBe(false)
  })

  it('blocks mutations while impersonating', async () => {
    currentUserId = 'user-1'
    cookieJar.set(IMPERSONATION_COOKIE, 'someone-else')
    const result = await requirePermission('event:create')
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toMatch(/read-only/i)
  })

  it('still allows view permissions while impersonating', async () => {
    currentUserId = 'user-1'
    cookieJar.set(IMPERSONATION_COOKIE, 'someone-else')
    const result = await requirePermission('event:view')
    expect(result.ok).toBe(true)
  })
})
