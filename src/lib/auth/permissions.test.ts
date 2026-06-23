import { describe, it, expect } from 'vitest'
import {
  can,
  isViewPermission,
  nextEventStage,
  requiredPermissionToLeaveStage,
  allowedEventTransitions,
  canTransitionEvent,
} from '@/lib/auth/permissions'

describe('can()', () => {
  it('grants base permissions to every role', () => {
    expect(can('client_user', 'event:view')).toBe(true)
    expect(can('contractor_user', 'event:create')).toBe(true)
  })

  it('withholds manager/admin permissions from client_user', () => {
    expect(can('client_user', 'event:manage')).toBe(false)
    expect(can('client_user', 'ca:approve')).toBe(false)
  })

  it('grants platform-admin permissions only to system_admin/support', () => {
    expect(can('system_admin', 'admin:access')).toBe(true)
    expect(can('support', 'impersonate:use')).toBe(true)
    // client_admin can manage users but is intentionally NOT given admin:access
    expect(can('client_admin', 'user:manage')).toBe(true)
    expect(can('client_admin', 'admin:access')).toBe(false)
  })

  it('grants contractor_user event:review but not event:manage', () => {
    expect(can('contractor_user', 'event:review')).toBe(true)
    expect(can('contractor_user', 'event:manage')).toBe(false)
  })

  it('never authorizes an undefined role', () => {
    expect(can(undefined, 'event:view')).toBe(false)
  })
})

describe('isViewPermission()', () => {
  it('is true only for :view permissions', () => {
    expect(isViewPermission('event:view')).toBe(true)
    expect(isViewPermission('audit:view')).toBe(true)
    expect(isViewPermission('event:create')).toBe(false)
    expect(isViewPermission('event:manage')).toBe(false)
  })
})

describe('nextEventStage()', () => {
  it('returns the next canonical stage', () => {
    expect(nextEventStage('draft')).toBe('contractor_review')
    expect(nextEventStage('approval')).toBe('closed')
  })

  it('returns null for the terminal stage', () => {
    expect(nextEventStage('closed')).toBeNull()
  })
})

describe('requiredPermissionToLeaveStage()', () => {
  it('derives the leave permission from the stage owner', () => {
    expect(requiredPermissionToLeaveStage('draft')).toBe('event:create')
    expect(requiredPermissionToLeaveStage('contractor_review')).toBe(
      'event:review'
    )
    expect(requiredPermissionToLeaveStage('review')).toBe('event:manage')
  })

  it('returns null for the immutable closed stage', () => {
    expect(requiredPermissionToLeaveStage('closed')).toBeNull()
  })
})

describe('allowedEventTransitions()', () => {
  it('lets a contractor advance their owned stage one step forward', () => {
    expect(
      allowedEventTransitions('contractor_user', 'contractor_review')
    ).toEqual(['review'])
  })

  it('blocks a role lacking the leave permission', () => {
    expect(allowedEventTransitions('client_user', 'contractor_review')).toEqual(
      []
    )
  })

  it('gives event:manage holders full lifecycle override', () => {
    const result = allowedEventTransitions('client_manager', 'review')
    expect(result).not.toContain('review')
    expect(result).toContain('closed')
    expect(result).toContain('draft')
    // every other stage is reachable
    expect(result).toHaveLength(7)
  })

  it('returns no transitions from a closed event', () => {
    expect(allowedEventTransitions('system_admin', 'closed')).toEqual([])
  })

  it('returns no transitions for an undefined role', () => {
    expect(allowedEventTransitions(undefined, 'draft')).toEqual([])
  })
})

describe('canTransitionEvent()', () => {
  it('allows a single forward step for a stage owner', () => {
    expect(
      canTransitionEvent('contractor_user', 'contractor_review', 'review')
    ).toBe(true)
  })

  it('rejects skipping ahead without manage override', () => {
    expect(
      canTransitionEvent('contractor_user', 'contractor_review', 'approval')
    ).toBe(false)
  })

  it('allows manage holders to jump to any stage', () => {
    expect(canTransitionEvent('client_manager', 'review', 'closed')).toBe(true)
  })
})
